// api/paypal-webhook.js
// Vercel Serverless Function — reçoit les webhooks PayPal
// et insère un token de paiement validé dans Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // clé service (pas anon) pour écriture sécurisée
);

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_CLIENT_ID  = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET     = process.env.PAYPAL_SECRET;

const PAYPAL_API = process.env.PAYPAL_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// ── Obtenir un access token PayPal ─────────────────────────────────────────
async function getPaypalAccessToken() {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await res.json();
  return json.access_token;
}

// ── Vérifier la signature du webhook PayPal ────────────────────────────────
async function verifyWebhookSignature(req, rawBody) {
  const accessToken = await getPaypalAccessToken();

  const verifyPayload = {
    auth_algo:         req.headers["paypal-auth-algo"],
    cert_url:          req.headers["paypal-cert-url"],
    transmission_id:   req.headers["paypal-transmission-id"],
    transmission_sig:  req.headers["paypal-transmission-sig"],
    transmission_time: req.headers["paypal-transmission-time"],
    webhook_id:        PAYPAL_WEBHOOK_ID,
    webhook_event:     JSON.parse(rawBody),
  };

  const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verifyPayload),
  });

  const json = await res.json();
  return json.verification_status === "SUCCESS";
}

// ── Handler principal ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Lire le body brut pour la vérification de signature
  const rawBody = await new Promise((resolve) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(data));
  });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // Vérifier la signature PayPal
  const isValid = await verifyWebhookSignature(req, rawBody);
  if (!isValid) {
    console.error("Invalid PayPal webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  // On ne traite que les paiements complétés
  if (event.event_type !== "PAYMENT.SALE.COMPLETED" &&
      event.event_type !== "CHECKOUT.ORDER.APPROVED") {
    return res.status(200).json({ received: true, ignored: true });
  }

  // Extraire les infos du paiement
  const resource   = event.resource;
  const paymentId  = resource.id || resource.sale_id;
  const amount     = parseFloat(resource.amount?.total || resource.amount?.value || "0");
  const currency   = resource.amount?.currency_code || resource.amount?.currency || "BRL";
  const payerEmail = resource.payer?.email_address ||
                     resource.payer?.payer_info?.email || null;

  // Vérifier le montant minimum (R$9.99 pour tolérer les frais)
  if (amount < 9.99) {
    console.warn(`Montant insuffisant: ${amount} ${currency}`);
    return res.status(200).json({ received: true, ignored: "amount_too_low" });
  }

  // Insérer le token de paiement validé dans Supabase
  const { error } = await supabase.from("payment_tokens").insert({
    payment_id:   paymentId,
    amount:       amount,
    currency:     currency,
    payer_email:  payerEmail,
    used:         false,
  });

  if (error) {
    // Si c'est un doublon (webhook envoyé 2x), on ignore silencieusement
    if (error.code === "23505") {
      return res.status(200).json({ received: true, duplicate: true });
    }
    console.error("Supabase insert error:", error);
    return res.status(500).json({ error: "Database error" });
  }

  console.log(`✓ Paiement validé: ${paymentId} — ${amount} ${currency}`);
  return res.status(200).json({ received: true, payment_id: paymentId });
}

// Désactiver le body parser Vercel (on lit le raw body manuellement)
export const config = {
  api: { bodyParser: false },
};

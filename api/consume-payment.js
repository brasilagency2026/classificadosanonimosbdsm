// api/consume-payment.js
// Vercel Serverless Function — marque un token comme utilisé après upload des photos

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { payment_id, anuncio_id } = req.body;
  if (!payment_id || !anuncio_id) {
    return res.status(400).json({ error: "Missing payment_id or anuncio_id" });
  }

  // Vérifier que le token existe et n'est pas encore utilisé
  const { data: token, error: fetchErr } = await supabase
    .from("payment_tokens")
    .select("id, used")
    .eq("payment_id", payment_id)
    .single();

  if (fetchErr || !token) {
    return res.status(404).json({ error: "Token not found" });
  }
  if (token.used) {
    return res.status(409).json({ error: "Token already used" });
  }

  // Marquer comme utilisé et lier à l'annonce
  const { error: updateErr } = await supabase
    .from("payment_tokens")
    .update({ used: true, anuncio_id, used_at: new Date().toISOString() })
    .eq("id", token.id);

  if (updateErr) {
    return res.status(500).json({ error: "Failed to consume token" });
  }

  return res.status(200).json({ success: true });
}

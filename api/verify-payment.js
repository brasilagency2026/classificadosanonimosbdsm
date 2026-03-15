// api/verify-payment.js
// Vercel Serverless Function — vérifie qu'un payment_id est valide et non utilisé

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { payment_id } = req.query;
  if (!payment_id) {
    return res.status(400).json({ valid: false, error: "Missing payment_id" });
  }

  const { data, error } = await supabase
    .from("payment_tokens")
    .select("id, used")
    .eq("payment_id", payment_id)
    .single();

  if (error || !data) {
    return res.status(200).json({ valid: false });
  }

  if (data.used) {
    return res.status(200).json({ valid: false, reason: "already_used" });
  }

  return res.status(200).json({ valid: true, token_id: data.id });
}

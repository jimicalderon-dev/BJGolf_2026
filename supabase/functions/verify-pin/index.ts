// Supabase Edge Function — verify-pin
// Validates a player's PIN server-side so pin_code never reaches the client.
//
// Deploy:
//   supabase functions deploy verify-pin --no-verify-jwt
//
// POST { player_id, pin }
//   → { success: true,  player: { id, name, handicap, team, avatar } }
//   → { success: false, error: "..." }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let player_id: string, pin: string;
  try {
    ({ player_id, pin } = await req.json());
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (!player_id || !pin) {
    return new Response(JSON.stringify({ success: false, error: "player_id and pin are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from("players")
    .select("id, name, handicap, team, avatar, pin_code")
    .eq("id", player_id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ success: false, error: "Player not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (data.pin_code !== pin) {
    return new Response(JSON.stringify({ success: false, error: "Incorrect PIN — try again" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { pin_code: _, ...player } = data;

  return new Response(JSON.stringify({ success: true, player }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  });
});

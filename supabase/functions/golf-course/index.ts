// Supabase Edge Function — golf-course
// Proxies requests to GolfCourseAPI so the API key stays server-side.
//
// Deploy:
//   supabase secrets set GOLF_COURSE_API_KEY=your_key_here
//   supabase functions deploy golf-course --no-verify-jwt
//
// Endpoints (relative to the function URL):
//   GET ?search=QUERY&page=1&page_size=50   → search courses (paginated)
//   GET /COURSE_ID                          → fetch full course detail

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const API_KEY = Deno.env.get("GOLF_COURSE_API_KEY");
if (!API_KEY) console.error("Missing GOLF_COURSE_API_KEY secret");

const BASE = "https://api.golfcourseapi.com/v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Server misconfigured: missing API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search");

  // Pagination params for search
  const pageRaw = Number(url.searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(url.searchParams.get("page_size") ?? "50");

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), 100)
    : 50;

  // Extract course ID from path, e.g. /functions/v1/golf-course/12345
  const pathAfterFn = url.pathname.replace(/.*\/golf-course\/?/, "");
  const courseId = pathAfterFn.length > 0 ? pathAfterFn : null;

  let apiUrl: string;

  if (search) {
    apiUrl =
      `${BASE}/courses?search=${encodeURIComponent(search)}` +
      `&page=${page}&page_size=${pageSize}`;
  } else if (courseId) {
    apiUrl = `${BASE}/courses/${encodeURIComponent(courseId)}`;
  } else {
    return new Response(JSON.stringify({ error: "Provide ?search=QUERY or a course ID in the path" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const upstream = await fetch(apiUrl, {
      headers: { Authorization: `Key ${API_KEY}` },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (err) {
    console.error("Upstream fetch failed:", err);
    return new Response(JSON.stringify({ error: "Upstream request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
});
export async function onRequestGet({env}) {
  return Response.json({
    configured: !!env.OPENROUTER_API_KEY,
    model: 'nvidia/nemotron-3.5-super-vl:free',
    role: 'Vision-language research assistant',
    free_tier_limit: 'OpenRouter currently 50 requests/day on uncredited free accounts',
    diagnosis_validated: false
  }, {headers:{'Cache-Control':'no-store'}});
}

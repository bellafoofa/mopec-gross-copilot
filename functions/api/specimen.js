// Same-origin proxy for a public-domain CDC specimen so the browser can safely
// draw it on a canvas and send a resized research image to the free AI model.
const URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Polycystic_kidneys%2C_gross_pathology_CDC_PHIL.png/1280px-Polycystic_kidneys%2C_gross_pathology_CDC_PHIL.png';
export async function onRequestGet() {
  const r=await fetch(URL,{headers:{'User-Agent':'LTU-Mopec-Research-Demo/1.0'}});
  if(!r.ok) return Response.json({error:'CDC image temporarily unavailable'}, {status:502});
  return new Response(r.body,{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
}

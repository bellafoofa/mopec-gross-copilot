import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handleAsk,retrieveDrafts} from '../functions/api/ask.js';
const endpoint='https://mopec-demo.pages.dev/api/ask';
const req=(body,headers={})=>new Request(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});

test('Missing key never pretends to be AI',async()=>{
 const out=await handleAsk(req({question:'Describe this tissue'}),{});
 assert.equal(out.status,503);
 const body=await out.json();assert.equal(body.type,'not_configured');
});
test('SOP passage lookup is grounded in local documents',()=>{
 const r=retrieveDrafts('specimen intake and traceability workflow');
 assert.ok(r.some(x=>x.title.includes('Specimen intake')));
});
test('SOP unknown question abstains without AI call',async()=>{
 const out=await handleAsk(req({question:'What is the protocol for icosahedral fixation?' }),{OPENROUTER_API_KEY:'hidden'});
 const body=await out.json(); assert.equal(body.type,'no_source');
});
test('Origin mismatches denied',async()=>{
 const out=await handleAsk(req({question:'Describe this tissue'},{Origin:'https://another-site.example'}),{OPENROUTER_API_KEY:'hidden'});
 assert.equal(out.status,403);
});
test('Reject invalid image payloads',async()=>{
 const out=await handleAsk(req({question:'Describe this tissue',image:'https://attacker.example/a.jpg'}),{OPENROUTER_API_KEY:'hidden'});
 assert.equal(out.status,400);
});
test('Model request contains supplied image and secret only on server',async()=>{
 let called;
 const fake=async(url,opts)=>{called={url,opts};return new Response(JSON.stringify({model:'nvidia/nemotron-3.5-super-vl:free',choices:[{message:{content:'Visible outline is irregular.'}}]}),{status:200,headers:{'Content-Type':'application/json'}})};
 const image='data:image/jpeg;base64,'+Buffer.from('sample').toString('base64');
 const out=await handleAsk(req({question:'Describe visible outline',image}),{OPENROUTER_API_KEY:'SECRET_TEST_NEVER_BROWSER'},fake);
 const body=await out.json();assert.equal(body.has_image,true);
 assert.equal(body.type,'ai_research');assert.match(body.model,/nemotron/);
 assert.match(called.opts.headers.Authorization,/SECRET_TEST_NEVER_BROWSER/);
 assert.doesNotMatch(JSON.stringify(body),/SECRET_TEST_NEVER_BROWSER/);
 const sent=JSON.parse(called.opts.body);assert.equal(sent.model,'nvidia/nemotron-3.5-super-vl:free');
 assert.deepEqual(sent.messages[1].content[1].image_url.url,image);
});
test('Free router fallback after 429',async()=>{
 let calls=0;
 const fake=async()=>{calls++;if(calls===1)return new Response(JSON.stringify({error:{message:'Quota'}}),{status:429});return new Response(JSON.stringify({model:'free-fallback',choices:[{message:{content:'Research observation.'}}]}),{status:200})};
 const out=await handleAsk(req({question:'Describe gross image'}),{OPENROUTER_API_KEY:'hidden'},fake);
 assert.equal(calls,2);assert.equal((await out.json()).model,'free-fallback');
});
test('SOP question returns draft citation fields',async()=>{
 const fake=async()=>new Response(JSON.stringify({choices:[{message:{content:'Review case group [DRAFT 1]'}}]}),{status:200});
 const out=await handleAsk(req({question:'What SOP for specimen intake and traceability?'}),{OPENROUTER_API_KEY:'hidden'},fake);
 const body=await out.json(); assert.ok(body.sources.length>=1); assert.match(body.sources[0].scope,/not clinically approved/);
});
test('HTML does not contain a visitor key entry or test credential',()=>{
 const html=fs.readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/GEMINI_API_KEY|OPENROUTER_API_KEY|type="password"/);
 assert.match(html,/Shared AI/);
});

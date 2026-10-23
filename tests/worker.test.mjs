import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{ask,retrieveGuides} from '../src/worker.js';
const host='https://mopec-gross-copilot.example.workers.dev';
function req(path,method='GET',body){return new Request(host+path,{method,headers:{'Content-Type':'application/json','Origin':host},body:body?JSON.stringify(body):undefined});}
test('health says unconfigured without exposing key',async()=>{
 const res=await worker.fetch(req('/api/health'),{});
 const data=await res.json(); assert.equal(data.configured,false); assert.equal(data.provider,'Groq');assert.equal(data.model,'qwen/qwen3.8-27b');
});
test('health says configured but makes no upstream model claim',async()=>{
 const res=await worker.fetch(req('/api/health'),{GROQ_API_KEY:'private-example'});const data=await res.json();
 assert.equal(data.configured,true);assert.ok(!JSON.stringify(data).includes('private-example'));
});
test('unknown api route returns JSON 404',async()=>{const res=await worker.fetch(req('/api/missing'),{});assert.equal(res.status,404);});
test('normal site request delegates to static assets',async()=>{
 const res=await worker.fetch(req('/'),{ASSETS:{fetch:async()=>new Response('ok')}});assert.equal(await res.text(),'ok');
});
test('draft retrieval selects matching guide',()=>{assert.ok(retrieveGuides('What is the specimen intake and traceability checklist?').length);});
test('SOP without source abstains',async()=>{
 const r=await ask(req('/api/ask','POST',{question:'Protocol for skydiving on Mars?'}),{}); const d=await r.json();assert.equal(d.type,'no_source');
});
test('AI unconfigured does not call upstream',async()=>{
 const r=await ask(req('/api/ask','POST',{question:'Describe the visible gross morphology.'}),{},()=>{throw Error('no call')});
 assert.equal(r.status,503);
});
test('Groq image vision request uses supported format and private key',async()=>{
 let outbound;
 const fakeFetch=async(url,opt)=>{
   outbound={url,opt};return Response.json({model:'qwen/qwen3.8-27b',choices:[{message:{content:'Specimen shows multiple cysts visible on the surface; confirm against independent references.'}}]});
 };
 const r=await ask(req('/api/ask','POST',{question:'Describe this specimen',image:'data:image/jpeg;base64,/9j/AA=='}),{GROQ_API_KEY:'TEST_PRIVATE'},fakeFetch);
 const d=await r.json();assert.equal(r.status,200);assert.equal(d.type,'ai_research');
 assert.equal(outbound.url,'https://api.groq.com/openai/v1/chat/completions');
 assert.ok(outbound.opt.headers.Authorization.includes('TEST_PRIVATE'));assert.equal(JSON.parse(outbound.opt.body).model,'qwen/qwen3.8-27b');
 assert.ok(!JSON.stringify(d).includes('TEST_PRIVATE'));
});
test('Groq 429 produces safe error',async()=>{
 const r=await ask(req('/api/ask','POST',{question:'Describe this specimen'}),{GROQ_API_KEY:'TEST_PRIVATE'},async()=>Response.json({error:'secret not to leak'},{status:429}));
 const d=await r.json();assert.equal(r.status,503);assert.ok(d.error.includes('quota'));assert.ok(!JSON.stringify(d).includes('secret'));
});
test('rejects requests from another origin',async()=>{
 const r=await ask(new Request(host+'/api/ask',{method:'POST',headers:{'Origin':'https://evil.example'},body:JSON.stringify({question:'Describe image'})}),{GROQ_API_KEY:'TEST'},async()=>{throw Error('must not reach');});assert.equal(r.status,403);
});

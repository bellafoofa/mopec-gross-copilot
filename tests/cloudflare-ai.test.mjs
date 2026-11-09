import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{ask,vision,modelConfig,requestModel} from '../src/worker.js';
const host='https://mopec-gross-copilot.example.workers.dev';
const image='data:image/jpeg;base64,/9j/AA==';
const request=(path,body)=>new Request(host+path,{method:'POST',headers:{'Origin':host,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('Cloudflare Mistral AI takes priority over a rate-limited Groq secret',()=>{
 const ai={run:async()=>({response:'OK'})};
 const cfg=modelConfig({AI:ai,GROQ_API_KEY:'SECRET'});
 assert.equal(cfg.name,'cloudflare');assert.equal(cfg.configured,true);
 assert.equal(cfg.model,'@cf/mistralai/mistral-small-3.1-24b-instruct');
});
test('Explicit MiniMax/Kimi or Groq selection remains respected',()=>{
 const AI={run(){}};
 assert.equal(modelConfig({AI,CLIPPY_PROVIDER:'groq',GROQ_API_KEY:'TEST'}).name,'groq');
 assert.equal(modelConfig({AI,CLIPPY_PROVIDER:'minimax'}).configured,false);
 assert.equal(modelConfig({AI,CLIPPY_PROVIDER:'workers_ai'}).name,'cloudflare');
});
test('Cloudflare AI vision receives multimodal image parts without public API keys',async()=>{
 let got=null;
 const AI={run:async(model,payload)=>{got={model,payload};return {response:JSON.stringify({organ_hypothesis:'Kidney',morphology:'Two visible lobulated specimens with multiple cystic structures.',organ_visual_support_pct:null,candidates:[{label:'Cyst region',rationale:'Visible rounded cavity',box:[150,200,280,290],visual_support_pct:null}],possible_considerations:[],quality_flags:[],suggested_next_review:'Have PA verify renal sinus from additional views'})}}};
 const res=await vision(request('/api/vision',{image,source:'Kidney public research image'}),{AI,GROQ_API_KEY:'GROQ_SECRET'},()=>{throw Error('Must not call Groq')});
 const d=await res.json();
 assert.equal(res.status,200);assert.equal(d.candidates.length,1);assert.equal(d.model,'@cf/mistralai/mistral-small-3.1-24b-instruct');
 assert.equal(got.model,'@cf/mistralai/mistral-small-3.1-24b-instruct');
 assert.equal(got.payload.messages[1].content[1].image_url.url,image);
 assert.ok(!JSON.stringify(d).includes('GROQ_SECRET'));
});
test('Clippy chat uses Cloudflare binding with image and returns formatted content',async()=>{
 let calls=0;
 const AI={run:async(model,payload)=>{calls++;return {response:'**Visible findings**\n- Multiple renal cystic structures. Verify orientation and sampling.'};}};
 const res=await ask(request('/api/ask',{question:'Describe visible morphology',source:'kidney photo',image}),{AI},()=>{throw Error('Should not use Groq')});
 const body=await res.json();assert.equal(res.status,200);assert.equal(body.type,'ai_research');assert.ok(body.answer.startsWith('**Visible findings**'));assert.equal(calls,1);
});
test('Cloudflare AI exhausted allocation is a safe, explanatory 429; no automatic paid fallback',async()=>{
 let calls=0;const AI={run:async()=>{calls++;const e=new Error('upstream quota exceeded');e.status=429;throw e}};
 const env={AI,GROQ_API_KEY:'SHOULD_NOT_USE'};
 const res=await vision(request('/api/vision',{image,source:'Kidney research'}),env,()=>{throw Error('No paid fallback')});
 const data=await res.json();assert.equal(res.status,429);assert.equal(data.type,'rate_limited');assert.equal(calls,1);
 assert.ok(data.error.includes('allocation'));assert.ok(!JSON.stringify(data).includes('SHOULD_NOT_USE'));
});
test('Public health accurately reports bound Mistral not Groq',async()=>{
 const res=await worker.fetch(new Request(host+'/api/health'),{AI:{run(){}},GROQ_API_KEY:'TEST'});
 const json=await res.json();assert.equal(json.provider,'Cloudflare AI · Mistral');assert.equal(json.configured,true);
 assert.equal(json.model_mode,'cloudflare');assert.equal(json.validated_clinical_model,false);
});

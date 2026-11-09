import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{ask,vision,modelConfig,requestModel} from '../src/worker.js';
const host='https://mopec-gross-copilot.example.workers.dev';
const req=(path,body)=>new Request(host+path,{method:'POST',headers:{'Content-Type':'application/json','Origin':host},body:JSON.stringify(body)});
const image='data:image/jpeg;base64,/9j/AA==';
test('provider selection prioritizes configured MiniMax, then Kimi, and keeps Groq as backwards-compatible fallback',()=>{
 assert.equal(modelConfig({GROQ_API_KEY:'x'}).name,'groq');
 assert.equal(modelConfig({GROQ_API_KEY:'x',MOONSHOT_API_KEY:'y'}).name,'kimi');
 assert.equal(modelConfig({GROQ_API_KEY:'x',MINIMAX_API_KEY:'z'}).name,'minimax');
 assert.equal(modelConfig({CLIPPY_PROVIDER:'kimi',MINIMAX_API_KEY:'z'}).configured,false);
 assert.equal(modelConfig({CLIPPY_PROVIDER:'minimax',MINIMAX_API_KEY:'z'}).model,'MiniMax-M3.1-Flash');
 assert.equal(modelConfig({CLIPPY_PROVIDER:'kimi',MOONSHOT_API_KEY:'y'}).model,'kimi-k3.1-pro');
});
test('MiniMax Clippy sends image via server-only OpenAI-compatible interface and never leaks key',async()=>{
 let outbound;
 const response=async(url,opt)=>{outbound={url,opt};return Response.json({choices:[{message:{content:'Visible cystic structures. Verify the collecting system and sampling guidance.'}}]})};
 const result=await ask(req('/api/ask',{question:'Describe visible features',image,source:'Kidney specimen'}),{MINIMAX_API_KEY:'PRIVATE_TEST_KEY'},response);
 const data=await result.json();
 assert.equal(outbound.url,'https://api.minimax.io/v1/chat/completions');
 const payload=JSON.parse(outbound.opt.body);
 assert.equal(payload.model,'MiniMax-M3.1-Flash');
 assert.ok(Array.isArray(payload.messages[1].content));
 assert.equal(payload.messages[1].content[1].image_url.url,image);
 assert.equal(data.type,'ai_research');assert.ok(!JSON.stringify(data).includes('PRIVATE_TEST_KEY'));
});
test('Kimi can process the same chat input and is not mistaken for MiniMax',async()=>{
 let url;
 const response=async(u,opt)=>{url=u;return Response.json({model:'kimi-k3.1-pro',choices:[{message:{content:'The image depicts an ex vivo kidney cut surface.'}}]})};
 const result=await ask(req('/api/ask',{question:'Describe the organ',source:'kidney'}),{CLIPPY_PROVIDER:'kimi',MOONSHOT_API_KEY:'SECRET_KIMI'},response);
 assert.equal(result.status,200);assert.equal(url,'https://api.moonshot.ai/v1/chat/completions');
 assert.equal((await result.json()).model,'kimi-k3.1-pro');
});
test('selected model with no secret cannot silently spend from another provider',async()=>{
 let called=false;
 const res=await ask(req('/api/ask',{question:'Describe this specimen'}),{CLIPPY_PROVIDER:'minimax',GROQ_API_KEY:'GROQ_SECRET'},async()=>{called=true;throw Error('incorrect');});
 assert.equal(res.status,503);assert.equal((await res.json()).type,'not_configured');assert.equal(called,false);
});
test('Kimi vision accepts JSON and yields bounded suggestions without raw credential output',async()=>{
 let payload;
 const response=async(url,opt)=>{payload=JSON.parse(opt.body);return Response.json({model:'kimi-k3.1-pro',choices:[{message:{content:JSON.stringify({morphology:'Visible cystic change',organ_hypothesis:'Kidney',organ_visual_support_pct:70,quality_flags:[],possible_considerations:[],candidates:[{label:'Cystic region',rationale:'Multiple visible cavities',visual_support_pct:69,box:[10,10,300,400]}],suggested_next_review:'Verify with PA'})}}]})};
 const result=await vision(req('/api/vision',{image,source:'Kidney research case'}),{CLIPPY_PROVIDER:'kimi',MOONSHOT_API_KEY:'SECRET_TEST'},response);
 const data=await result.json();
 assert.equal(result.status,200);assert.equal(data.candidates[0].label,'Cystic region');
 assert.equal(payload.response_format.type,'json_object');
 assert.ok(!JSON.stringify(data).includes('SECRET_TEST'));
});
test('public health reports selected service readiness, not actual clinical validation',async()=>{
 const res=await worker.fetch(new Request(host+'/api/health'),{CLIPPY_PROVIDER:'minimax',MINIMAX_API_KEY:'PRIVATE'});
 const d=await res.json();
 assert.equal(d.provider,'MiniMax');assert.equal(d.configured,true);assert.equal(d.validated_clinical_model,false);assert.ok(!JSON.stringify(d).includes('PRIVATE'));
});

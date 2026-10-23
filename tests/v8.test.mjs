import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{vision} from '../src/worker.js';
const host='https://mopec-gross-copilot.example.workers.dev';
const make=(path,method='GET',body)=>new Request(host+path,{method,headers:{Origin:host,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
const photo='data:image/jpeg;base64,/9j/AA==';
test('catalog contains distinct gross photo organs and sources',async()=>{
 const r=await worker.fetch(make('/api/catalog'),{}),a=await r.json();
 assert.equal(r.status,200);assert.ok(a.length>=6);
 assert.ok(new Set(a.map(x=>x.organ)).size>=4);
 for(const p of a){assert.ok(p.license&&p.credit&&p.url&&p.file);}
});
test('vision endpoint requires key and image',async()=>{
 const r=await worker.fetch(make('/api/vision','POST',{image:photo}),{});assert.equal(r.status,503);
});
test('model analysis bounds are normalized and confidence stays uncalibrated',async()=>{
 let outgoing;
 const fake=async(url,opt)=>{outgoing=JSON.parse(opt.body);
  return Response.json({model:'qwen/qwen3.8-27b',choices:[{message:{content:JSON.stringify({
   morphology:'Focal discoloration visible',organ_hypothesis:'Kidney',quality_flags:[],
   candidates:[{label:'Focal color change',rationale:'Variable coloration',box:[200,100,300,320]},
     {label:'Invalid region',rationale:'Outside view',box:[1300,0,200,300]}],
   suggested_next_review:'Confirm with histology and provenance'})}}]});
 };
 const r=await vision(make('/api/vision','POST',{image:photo,source:'Unidentified gross specimen'}),{GROQ_API_KEY:'private'},fake),v=await r.json();
 assert.equal(r.status,200);assert.equal(v.candidates.length,1);assert.equal(v.candidates[0].confidence,null);
 assert.equal(v.status,'preliminary');assert.equal(outgoing.response_format.type,'json_object');
 assert.ok(!JSON.stringify(v).includes('private'));
});
test('vision rejects malformed image and foreign origin',async()=>{
 const invalid=await vision(make('/api/vision','POST',{image:'https://attacker.example/x'}),{GROQ_API_KEY:'test'},async()=>{throw Error('should not call');});assert.equal(invalid.status,400);
 const cross=new Request(host+'/api/vision',{method:'POST',headers:{Origin:'https://attacker.example'},body:JSON.stringify({image:photo})});
 assert.equal((await vision(cross,{GROQ_API_KEY:'test'})).status,403);
});
test('unknown catalog image does not fetch arbitrary URL',async()=>{
 const r=await worker.fetch(make('/api/specimen?id=https://attacker.example/'),{});
 assert.equal(r.status,404);
});

test('vision reports subjective percent scores without claiming diagnostic calibration',async()=>{
 const fake=async()=>Response.json({model:'qwen/qwen3.8-27b',choices:[{message:{content:JSON.stringify({
  morphology:'A rounded tan focus is visually distinguishable',organ_hypothesis:'Kidney',organ_visual_support_pct:84,
  quality_flags:[],possible_considerations:[{label:'Focal neoplasm pattern',rationale:'Gross color contrast',visual_support_pct:62}],
  candidates:[{label:'Tan nodule',rationale:'Round focal region',visual_support_pct:71,box:[200,200,180,240]}],
  suggested_next_review:'Correlate with gross description and available pathology findings'
 })}}]});
 const r=await vision(make('/api/vision','POST',{image:photo,source:'Kidney gross specimen'}),{GROQ_API_KEY:'PRIVATE'},fake);
 const d=await r.json();assert.equal(r.status,200);assert.equal(d.organ_visual_support_pct,84);
 assert.equal(d.possible_considerations[0].visual_support_pct,62);assert.equal(d.candidates[0].confidence,71);
 assert.ok(d.candidates[0].confidence_kind.includes('not diagnosis likelihood'));assert.equal(d.confidence,'Not calibrated');
});

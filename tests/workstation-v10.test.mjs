import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
const host='https://mopec-gross-copilot.example.workers.dev';
test('research guidance is retrievable and clearly draft-only',async()=>{
 const res=await worker.fetch(new Request(host+'/api/guides'),{});
 assert.equal(res.status,200);
 const guides=await res.json();
 assert.ok(Array.isArray(guides)&&guides.length>=9);
 assert.ok(guides.some(x=>x.id==='ltu-renal-anatomy-008'));
 for(const g of guides){
  assert.ok(g.source_url.startsWith('https://'));
  assert.ok(g.approval.includes('not approved'));
  assert.ok(Array.isArray(g.checklist));
 }
});
test('research guides reject writes',async()=>{
 const res=await worker.fetch(new Request(host+'/api/guides',{method:'POST'}),{});
 assert.equal(res.status,405);
});
test('public health endpoint never exposes project API key',async()=>{
 const res=await worker.fetch(new Request(host+'/api/health'),{GROQ_API_KEY:'NEVER_SHOW_ME'});
 const data=await res.json();
 assert.equal(data.configured,true);
 assert.ok(!JSON.stringify(data).includes('NEVER_SHOW_ME'));
 assert.equal(data.validated_clinical_model,false);
});
test('catalog retains source metadata for every image',async()=>{
 const res=await worker.fetch(new Request(host+'/api/catalog'),{});
 const data=await res.json();assert.ok(data.length>=7);
 for(const row of data){assert.ok(row.id&&row.organ&&row.name&&row.license&&row.url)}
});

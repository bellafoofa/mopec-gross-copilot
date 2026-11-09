import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('live v11 entrypoint loads each active module',()=>{
 const html=read('docs/index.html'),boot=read('docs/workstation-boot.js');
 for(const name of ['workstation-core.js','workstation-analysis.js','workstation-workflow.js','workstation-chat.js','workstation-sponsor.js','workstation-imaging-v11.js','workstation-segmentation-v11.js','workstation-ops-v11.js','workstation-boot.js'])
   assert.ok(html.includes('/'+name),name+' missing from document');
 for(const name of ['initAnalysis','initWorkflow','initChat','initCore','initSponsor','initImaging','initSegmentation','initOps'])
   assert.ok(boot.includes(name+'(')||boot.includes(name+'?.('),name+' missing from boot');
});
test('primary nav queries all buttons; the earlier single-element forEach error cannot recur',()=>{
 const code=read('docs/workstation-core.js');
 assert.ok(code.includes("S.page=name;$$('[data-nav]').forEach"));
 assert.ok(!code.includes("S.page=name;$('[data-nav]').forEach"));
});
test('manual masks and QC are labeled as research-only',()=>{
 const segmentation=read('docs/workstation-segmentation-v11.js'),imaging=read('docs/workstation-imaging-v11.js');
 assert.ok(segmentation.includes('trained_model:false'));
 assert.ok(segmentation.includes('expert_ground_truth:false'));
 assert.ok(imaging.includes('operator')); // preview calibration is manual
 assert.ok(imaging.includes('PA-entered'));
});
test('no browser-side secret variable value is committed',()=>{
 const html=read('docs/index.html'),chat=read('docs/workstation-chat.js');
 assert.ok(!/\b(sk-[a-zA-Z0-9_-]{20,}|gsk_[a-zA-Z0-9_-]{20,})\b/.test(html+chat));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../docs/workstation-v14.js',import.meta.url),'utf8');
function setup(){const S={image:{naturalWidth:800,naturalHeight:600},imageWidth:800,imageHeight:600,caseId:'DEMO-001',sourceType:'catalog',reviewEvents:[]},M={S,$:()=>null,safe:String,toast:()=>{},draw:()=>{},step:()=>{},qcScreen:()=>({width:800,height:600,flags:['Possible blur']}),paintMask:()=>({}),renderQC:()=>{}};
const context={window:{Mopec:M},document:{getElementById:()=>null},sessionStorage:{setItem(){},getItem(){return null}}};vm.runInNewContext(code,context);return M;}
test('v14 exposes safe, nonclinical case workflow functions',()=>{const M=setup();assert.equal(typeof M.initV14,'function');assert.equal(typeof M.v14.runLocalQC,'function');assert.equal(typeof M.v14.addPhotos,'function');assert.equal(typeof M.v14.restoreView,'function');});
test('local image QC can run without external AI',()=>{const M=setup();M.v14.runLocalQC();assert.equal(M.S.qc.flags[0],'Possible blur');assert.ok(M.S.mask);assert.equal(M.S.reviewEvents[0].event,'local_image_qc');});
test('local-only setting represents explicit user choice',()=>{const M=setup();M.v14.setLocal(true);assert.equal(M.v14.readCase().localOnly,true);assert.equal(M.S.localReviewOnly,true);M.v14.setLocal(false);assert.equal(M.v14.readCase().localOnly,false);});
test('module source contains no cloud API secrets and is valid JavaScript',()=>{assert.doesNotThrow(()=>new Function(code));assert.ok(!code.includes('sk_live_'));assert.ok(!code.includes('MINIMAX_API_KEY=sk'));});

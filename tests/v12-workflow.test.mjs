import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../docs/workstation-v12.js',import.meta.url),'utf8');
const mock={S:{},$:()=>null,safe:x=>x,toast:()=>{}};
vm.runInNewContext(script,{window:{Mopec:mock}});
const parse=mock.parseV12Command;
test('case and AI analysis voice shortcuts navigate to correct pages',()=>{
 assert.equal(parse('Open review').page,'review');
 assert.equal(parse('Show AI analysis').page,'analysis');
 assert.equal(parse('Show image library').page,'library');
 assert.equal(parse('Open case list').page,'cases');
});
test('commands expose structured actions instead of executing arbitrary user input',()=>{
 assert.equal(parse('Analyze image').kind,'analyze');
 assert.equal(parse('Zoom out').direction,-1);
 assert.equal(parse('Hide overlay').show,false);
 assert.equal(parse('Next step').kind,'next');
 assert.equal(parse('Ask Clippy what is visible in region 1?').kind,'ask');
 assert.equal(parse('Dictate note orientation shown in figure').kind,'note');
 assert.equal(parse('approve this clinical cancer stage').kind,'unknown');
 assert.equal(parse('read PHI without authorization').kind,'unknown');
});
test('spoken text and notes are preserved and limited',()=>{
 assert.equal(parse('ASK CLIPPY Could this be a gross cyst?').question,'Could this be a gross cyst?');
 assert.equal(parse('Record observation cut surface documented').note,'cut surface documented');
 assert.ok(parse('ask clippy '+'x'.repeat(900)).question.length<=650);
 assert.ok(parse('note '+'x'.repeat(1000)).note.length<=850);
});
test('UI module remains parseable and does not contain secrets',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(!script.includes('sk_live_'));
 assert.ok(!script.includes('gsk_'));
});

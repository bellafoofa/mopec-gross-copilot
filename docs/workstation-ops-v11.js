
/* LTU/Mopec v11 — workflow, reviewer feedback, reproducible validation and model comparison */
(()=>{'use strict';
const M=window.Mopec;if(!M)return;const S=M.S,$=M.$,safe=M.safe,toast=M.toast;
let compare=null,showProposals=true;
const stamp=()=>new Date().toISOString();
function log(event,detail=''){
 S.reviewEvents=S.reviewEvents||[];
 S.reviewEvents.push({time:stamp(),case_id:S.caseId,event:String(event).slice(0,70),detail:String(detail).slice(0,180)});
 if(S.reviewEvents.length>100)S.reviewEvents.splice(0,S.reviewEvents.length-100);
 renderTimeline();
}
function updateRibbon(){
 const el=$('#v11WorkTitle'),sub=$('#v11WorkSub'),btn=$('#v11WorkNext');if(!el||!sub||!btn)return;
 const state=S.page;
 const stateMap={
  cases:['Select a specimen','Open a case to begin source-aware image review.','library','Image library'],
  library:['Choose a gross photograph','Use a source-labeled photo or import an authorized one.','analysis','Analysis'],
  capture:['Capture and identify','Confirm synthetic accession, image source, camera views and orientation.','analysis','Image analysis'],
  analysis:['Inspect image and proposals','Check image quality, calibrate measurements and review AI-proposed features.','review','PA review'],
  review:['Review and document','Complete image QA, anatomy checks and correction feedback; export the record.','models','Validation'],
  guidance:['Source-based reference','Read draft guidance, verify references, and return to your case.','review','PA review'],
  models:['Evaluate model and data readiness','Compare reviewer annotations with paired ground truth or another model output.','analysis','Back to image']
 };
 const [head,note,next,label]=stateMap[state]||stateMap.analysis;el.textContent=head;sub.textContent=note;btn.textContent=label+' →';btn.onclick=()=>M.nav(next);
}
function renderTimeline(){
 const root=$('#v11Timeline');if(!root)return;const events=(S.reviewEvents||[]).slice(-15).reverse();
 root.innerHTML=events.length?events.map(e=>'<li><time>'+safe(e.time.slice(11,19))+'</time><span><strong>'+safe(e.event.replace(/_/g,' '))+'</strong><br><small>'+safe(e.detail||'Case event')+'</small></span></li>').join(''):'<li>Open or analyze a case to begin the event timeline.</li>';
}
function renderFeedback(){
 const list=$('#v11FeedbackFeature');if(!list)return;
 const choices=S.analysis?.candidates||[];
 const selected=list.value;list.innerHTML='';list.add(new Option('Choose a proposed region',''));
 for(const [i,c] of choices.entries())list.add(new Option('F'+(i+1)+' · '+c.label,String(i)));
 if(selected!==''&&Number(selected)<choices.length)list.value=selected;else if(S.selected>=0&&S.selected<choices.length)list.value=String(S.selected);
 const has=list.value!=='';$('#v11FeedbackForm').hidden=!has;
 if(has){const item=S.feedback?.[list.value]||{reason:'',reason_code:'Other',corrected_label:''};$('#v11FeedbackReason').value=item.reason||'';$('#v11FeedbackCode').value=item.reason_code||'Other';$('#v11CorrectedLabel').value=item.corrected_label||'';}
}
function saveFeedback(){
 const idx=$('#v11FeedbackFeature').value;if(idx===''){toast('Select an AI-proposed feature first.');return;}
 const reason=$('#v11FeedbackReason').value.trim(),code=$('#v11FeedbackCode').value,corrected=$('#v11CorrectedLabel').value.trim();
 if(!reason){toast('Describe the mismatch or reason for the correction.');return;}
 S.feedback=S.feedback||{};
 S.feedback[idx]={reason_code:code,reason:reason.slice(0,800),corrected_label:corrected.slice(0,90),review_status:S.reviewDecisions[idx]||'Not reviewed',model:S.analysis?.model||null,updated_at:stamp()};
 log('model_feedback','F'+(Number(idx)+1)+' · '+code);
 toast('Model-correction feedback saved in the current research case. Export the review JSON to retain it.');
}
function showMetrics(){
 if(!$('#v11Metrics'))return;const candidates=S.analysis?.candidates||[],statuses=candidates.map((_,i)=>S.reviewDecisions[i]||'Pending');
 const reviewed=statuses.filter(x=>x!=='Pending').length,accepted=statuses.filter(x=>x==='Accepted').length,modified=statuses.filter(x=>x==='Edited').length;
 const gt=S.maskValidation,rate=reviewed?Math.round(accepted/reviewed*100):null;
 const rows=[
 ['AI candidate regions',String(candidates.length)],['PA-reviewed',reviewed+'/'+candidates.length],
 ['Accepted as proposed',rate==null?'N/A':rate+'%'],['Reference-mask Dice',gt?.dice==null?'N/A':gt.dice.toFixed(3)]
 ];
 $('#v11Metrics').innerHTML=rows.map(([name,value])=>'<div class="v11-metric"><strong>'+safe(value)+'</strong><small>'+safe(name)+'</small></div>').join('');
 $('#v11MetricsNote').textContent='Case only · '+modified+' edited · '+statuses.filter(s=>s==='Rejected').length+' rejected · no aggregated accuracy claim. Ground-truth overlap is from manual polygons only.';
}
const iou=(a,b)=>{
 if(![...a,...b].every(Number.isFinite))return null;
 const [ax,ay,aw,ah]=a,[bx,by,bw,bh]=b;if(aw<=0||ah<=0||bw<=0||bh<=0)return null;
 const intersection=Math.max(0,Math.min(ax+aw,bx+bw)-Math.max(ax,bx))*Math.max(0,Math.min(ay+ah,by+bh)-Math.max(ay,by));
 const union=aw*ah+bw*bh-intersection;return union>0?intersection/union:null;
};
async function importOther(file){
 if(!file||!(/\.json$/i.test(file.name))||file.size>1_000_000)return toast('Choose a prediction JSON under 1 MB.');
 try{
  const obj=JSON.parse(await file.text()),all=Array.isArray(obj.candidates)?obj.candidates:[];
  if(!Array.isArray(obj.candidates)||all.length>80)throw Error('Expected a candidates array of at most 80 entries.');
  if(obj.case_id&&String(obj.case_id)!==String(S.caseId))throw Error('The prediction file belongs to another case; open the matching specimen first.');
  const parsed=all.filter(c=>Array.isArray(c.box)&&c.box.length===4&&c.box.every(n=>typeof n==='number'&&Number.isFinite(n))&&c.box[2]>0&&c.box[3]>0&&c.box[0]>=0&&c.box[1]>=0&&c.box[0]+c.box[2]<=1000&&c.box[1]+c.box[3]<=1000).slice(0,30).map(c=>({label:String(c.label||'Unlabeled candidate').slice(0,90),box:c.box}));
  compare={model:String(obj.model||file.name).slice(0,100),candidates:parsed,case_id:String(obj.case_id||'unverified'),source_file:file.name};
  S.comparisonPrediction=compare;
  renderCompare();M.draw();log('comparison_import',compare.model);
 }catch(e){toast('Prediction JSON not recognized: '+e.message);}
}
function renderCompare(){
 const area=$('#v11Compare');if(!area)return;
 if(!compare){area.textContent='Import optional comparison predictions in the same normalized 0–1000 coordinate system to examine disagreement. No additional AI service is called.';return;}
 const base=S.analysis?.candidates||[],other=compare.candidates;
 const pairs=base.map(a=>Math.max(0,...other.map(b=>iou(a.box,b.box)||0)));
 const avg=pairs.length?pairs.reduce((s,n)=>s+n,0)/pairs.length:null;
 area.innerHTML='<strong>'+safe(compare.model)+'</strong> · '+other.length+' comparison boxes · '+(avg===null?'no current-model boxes':'mean best box IoU '+avg.toFixed(3))+'<br><small>Geometric agreement only, not clinical accuracy. Labels and class evidence require expert review.</small>';
}
function refresh(){
 renderFeedback();renderTimeline();showMetrics();renderCompare();updateRibbon();
}
function exportOps(){return{reviewer_feedback:S.feedback||{},compare_model:compare?{name:compare.model,case_id:compare.case_id,candidate_count:compare.candidates.length}:null,review_event_log:S.reviewEvents||[],validation_metrics:S.maskValidation||null,view_mode:document.body.classList.contains('v11-focus')?'focused':'full'};}
function focusToggle(){
 const focused=document.body.classList.toggle('v11-focus');$('#v11Focus').textContent=focused?'Full tools':'Focus tools';
 $('#v11Focus').setAttribute('aria-pressed',String(focused));try{localStorage.setItem('mopec-ui-focus',focused?'1':'0');}catch{}
 toast(focused?'Focused PA view: research/admin options hidden.':'Full research tools visible.');
}
function help(){
 const dlg=$('#v11HelpDialog');if(typeof dlg.showModal==='function')dlg.showModal();
 else dlg.hidden=false;
}
function updateModelHealth(){
 Promise.allSettled([fetch('/api/health',{cache:'no-store'}),fetch('/api/catalog',{cache:'no-store'}),fetch('/api/guides',{cache:'no-store'})]).then(async results=>{
 const labels=['AI gateway','Specimen library','Procedure sources'];let out=[];
 for(const [idx,result] of results.entries()){let ok=result.status==='fulfilled'&&result.value.ok;
 let reason=ok?'Endpoint reachable':'Unavailable';
 if(ok&&idx===0){try{const body=await result.value.json();reason=body.configured?'Key present; inference not yet tested':'No active model secret';}catch{reason='Health response unreadable';}}
 out.push('<tr><td>'+labels[idx]+'</td><td>'+safe(reason)+'</td></tr>');}
 $('#v11ServiceResult').innerHTML='<table class="v11-table"><thead><tr><th>Service</th><th>Status</th></tr></thead><tbody>'+out.join('')+'</tbody></table>';
 });
}
function applyCase(){
 S.feedback={};S.comparisonPrediction=null;compare=null;S.reviewEvents=[{time:stamp(),event:'case_opened',detail:S.caseName||'No case selected',case_id:S.caseId}];
 refresh();if($('#v11FeedbackReason'))$('#v11FeedbackReason').value='';
}
function addClippyActions(){
 const footer=$('#chatForm');if(!footer)return;
 const area=document.createElement('div');area.className='v11-handoff';area.innerHTML='<button type="button" class="btn small" data-v11ask="Explain what the PA should verify about the currently selected gross feature.">Review this region</button><button type="button" class="btn small" data-v11ask="Which required anatomy or image-quality checks remain unresolved for this specimen?">What is missing?</button><button type="button" class="btn small" data-v11ask="Cite the available draft guidance relevant to this specimen, and explicitly identify what is not covered.">Relevant SOP</button>';
 footer.before(area);
 area.querySelectorAll('[data-v11ask]').forEach(button=>button.onclick=()=>{$('#chatInput').value=button.dataset.v11ask;$('#chatInput').focus();M.openChat(true);});
}
function shortcuts(event){
 if(!(event.altKey&&event.shiftKey)||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const map={'1':'cases','2':'capture','3':'analysis','4':'review','5':'guidance','6':'library'};
 if(map[event.key]){event.preventDefault();M.nav(map[event.key]);updateRibbon();}
 if(event.key.toLowerCase()==='c'){event.preventDefault();M.openChat();}
}
function init(){
 const steps=$('.steps');
 if(steps&&!$('#v11WorkTitle')){
 const strip=document.createElement('div');strip.className='v11-nav-quick';
 strip.innerHTML='<span class="v11-ribbon-icon">→</span><strong id="v11WorkTitle">Specimen workflow</strong><span id="v11WorkSub">Case intake, image QC and PA review</span><button id="v11WorkNext" type="button">Continue →</button>';
 steps.after(strip);
 }
 const top=$('.top-actions');
 if(top){
  const focus=document.createElement('button');focus.type='button';focus.id='v11Focus';focus.className='btn small';focus.textContent='Focus tools';focus.title='Hide research configuration tabs. Not an access-control mechanism.';focus.setAttribute('aria-pressed','false');focus.onclick=focusToggle;top.prepend(focus);
  const button=document.createElement('button');button.id='v11Help';button.className='icon-btn';button.textContent='?';button.type='button';button.setAttribute('aria-label','Help and keyboard shortcuts');button.onclick=help;top.insertBefore(button,$('#chatToggle'));
  try{if(localStorage.getItem('mopec-ui-focus')==='1'){document.body.classList.add('v11-focus');focus.textContent='Full tools';focus.setAttribute('aria-pressed','true');}}catch{}
 }
 const modal=document.createElement('dialog');modal.id='v11HelpDialog';modal.className='v11-helpdialog';
 modal.innerHTML='<h2>Mopec workstation guide</h2><p>Use synthetic/public case information only in this prototype.</p><ol><li>Open a specimen in <strong>Cases</strong> or <strong>Image Library</strong>.</li><li>Use <strong>Capture</strong> to demonstrate barcode identification, camera and dictation.</li><li>Click <strong>Analyze image</strong> for image QC and unvalidated visual proposals.</li><li>In <strong>Annotation & measurement tools</strong>, trace a Polygon and calibrate a ruler when available.</li><li>Open <strong>Review & Evidence</strong> to confirm anatomy, image quality and model corrections.</li><li>Export reviewer records and dataset manifests for later expert validation.</li></ol><p><strong>Shortcuts:</strong> Alt + Shift + 1–6 navigates Cases, Capture, AI Analysis, Review, Guidance and Library. Alt + Shift + C toggles Clippy.</p><p>Focus tools changes presentation only; it is not authentication or an institutional permission system.</p><div class="v11-help-footer"><button class="btn primary" id="v11CloseHelp">Close</button></div>';
 document.body.append(modal);$('#v11CloseHelp').onclick=()=>{if(modal.close)modal.close();else modal.hidden=true;};
 const review=$('#page-review');
 const fb=document.createElement('section');fb.className='panel v11-panel';
 fb.innerHTML='<div class="section-head"><h2>Model correction feedback</h2><span class="case-pill">PA training signal</span></div><p>Record why a proposed region was rejected or relabeled. Exported with the current case; feedback is not sent to Mopec or used for training automatically.</p><div class="v11-inputrow"><label for="v11FeedbackFeature">Selected proposal</label><select id="v11FeedbackFeature"><option value="">No analysis yet</option></select></div><div id="v11FeedbackForm" hidden><div class="v11-pair"><div class="v11-inputrow"><label for="v11FeedbackCode">Issue category</label><select id="v11FeedbackCode"><option>Other</option><option>Wrong organ / anatomy</option><option>False-positive region</option><option>Incorrect region boundary</option><option>Missing relevant finding</option><option>Image-quality artifact</option><option>Incorrect label</option></select></div><div class="v11-inputrow"><label for="v11CorrectedLabel">Preferred label (optional)</label><input id="v11CorrectedLabel" maxlength="90" placeholder="PA-revised region name"></div></div><div class="v11-inputrow"><label for="v11FeedbackReason">Evidence / explanation</label><textarea rows="3" id="v11FeedbackReason" maxlength="800" placeholder="What was incorrect and what should the model learn?"></textarea></div><button id="v11SaveFeedback" class="btn small">Save correction</button></div>';
 review.append(fb);$('#v11FeedbackFeature').onchange=renderFeedback;$('#v11SaveFeedback').onclick=saveFeedback;
 const tl=document.createElement('details');tl.className='panel v11-panel';tl.innerHTML='<summary>Case review timeline</summary><ol class="v11-timeline" id="v11Timeline"></ol><p>Temporary browser-session events. Export review JSON to retain a copy; this is not a protected audit trail.</p>';
 review.append(tl);
 const models=$('#page-models');
 const evalp=document.createElement('section');evalp.className='panel v11-panel';
 evalp.innerHTML='<div class="section-head"><h2>Research evaluation · current case</h2><span class="case-pill">Measured data only</span></div><div id="v11Metrics" class="v11-metricgrid"></div><p id="v11MetricsNote" class="v11-mini"></p><div class="v11-pair"><div><h3>Model comparison input</h3><p>Import a second model’s proposed bounding boxes in JSON. The app reports coordinate overlap only; it does not call another paid model.</p><input type="file" id="v11ImportModel" accept=".json,application/json"></div><div><h3>Model agreement</h3><div id="v11Compare" class="v11-result"></div></div></div><h3>Service diagnostics</h3><p>Check public endpoints and secret presence without exposing any API key or making a model inference request.</p><button id="v11Diagnostics" type="button" class="btn small">Check components</button><div id="v11ServiceResult"></div>';
 models.append(evalp);$('#v11ImportModel').onchange=e=>importOther(e.target.files?.[0]);$('#v11Diagnostics').onclick=updateModelHealth;
 addClippyActions();
 document.addEventListener('keydown',shortcuts);
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-nav]'))queueMicrotask(updateRibbon);
  if(e.target.closest('[data-decide],[data-case-decision]'))queueMicrotask(()=>{refresh();log('pa_review','Finding or case status updated');});
  if(e.target.closest('[data-find]'))queueMicrotask(renderFeedback);
 });
 window.addEventListener('mopec:analysis-complete',()=>{log('ai_analysis','AI proposal received');refresh();});
 window.addEventListener('mopec:case-changed',applyCase);
 M.exportOps=exportOps;M.renderEval=refresh;
 S.feedback=S.feedback||{};S.reviewEvents=S.reviewEvents||[];
 refresh();updateModelHealth();
}
M.initOps=init;
})();

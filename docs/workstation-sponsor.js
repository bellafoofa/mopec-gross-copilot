
/* v10.1 — sponsor-directed PA verification and handoff module. No patient data. */
(()=>{'use strict';
const M=window.Mopec;if(!M)return;
const S=M.S,$=M.$,esc=M.safe,toast=M.toast;
const CUES={
 Kidney:[
  {id:'renal_sinus',title:'Renal sinus / hilar interface',reason:'Review the interface with renal sinus fat and identify any suspicious area for sampling; gross appearance alone does not establish invasion.',tag:'Stage-relevant anatomy'},
  {id:'perinephric',title:'Perinephric fat and capsule',reason:'Verify whether the specimen view includes the capsule and any adjacent perinephric tissue.',tag:'Stage-relevant anatomy'},
  {id:'venous',title:'Renal vein / vascular structures',reason:'Check whether vascular structures are visible and whether additional gross documentation is needed.',tag:'Stage-relevant anatomy'},
  {id:'size',title:'Lesion dimensions and scale',reason:'Check that a reference scale is available and that any dimensions are verified rather than inferred from pixels.',tag:'Documentation'},
  {id:'collecting',title:'Collecting system / renal pelvis',reason:'Check whether pertinent collecting-system anatomy is identifiable in the specimen views.',tag:'Orientation'}
 ],
 Breast:[
  {id:'size',title:'Lesion measurement',reason:'Verify the maximum dimension and measurement source with calibrated equipment; do not assign stage from the photograph.',tag:'Documentation'},
  {id:'margins',title:'Margin orientation and proximity',reason:'Verify laterality/orientation markers and measured distances where required.',tag:'Stage-relevant anatomy'},
  {id:'skin',title:'Skin and nipple relationship',reason:'Determine whether supplied views contain these structures, if applicable to the specimen type.',tag:'Stage-relevant anatomy'},
  {id:'nodes',title:'Lymph-node sampling context',reason:'Record whether nodal tissue and gross sampling documentation are available, when applicable.',tag:'Sampling'}
 ],
 Prostate:[
  {id:'orientation',title:'Orientation and margins',reason:'Verify inked margins, anatomical landmarks, and specimen orientation in the source material.',tag:'Anatomy'},
  {id:'sampling',title:'Section mapping',reason:'Confirm that sections are linked to their locations and cassette records where applicable.',tag:'Sampling'}
 ],
 General:[
  {id:'identity',title:'Case and image identification',reason:'Confirm image, specimen, synthetic accession and capture metadata agree.',tag:'Traceability'},
  {id:'views',title:'Relevant image views',reason:'Verify orientation, scale and required complementary photographs for the actual specimen.',tag:'Image QC'},
  {id:'focus',title:'Candidate area review',reason:'Confirm that areas flagged by AI were visually inspected and any uncertainty documented.',tag:'Image review'}
 ]
};
const pick=()=>{
 const organ=String(S.organ||'').toLowerCase();
 if(/renal|kidney/.test(organ))return ['Kidney',CUES.Kidney];
 if(/breast/.test(organ))return ['Breast',CUES.Breast];
 if(/prostat/.test(organ))return ['Prostate',CUES.Prostate];
 return ['General',CUES.General];
};
let key='',started=null,observations=[],lastReport=null;
function caseKey(){return String(S.caseId||'none')+'|'+String(S.caseName||'unknown');}
function ensure(){
 if(!S.priorityChecks||typeof S.priorityChecks!=='object')S.priorityChecks={};
 if(!S.workflowStudy||typeof S.workflowStudy!=='object')S.workflowStudy={events:[]};
 const current=caseKey();if(key!==current){key=current;S.priorityChecks={};observations=[];started=null;lastReport=null;S.roiFocus=false;const roi=$('#roiFocus');if(roi){roi.classList.remove('active');roi.setAttribute('aria-pressed','false');roi.textContent='ROI focus';}}
}
function render(){
 ensure();const root=$('#priorityChecks');if(!root)return;
 const [organ,rows]=pick();$('#priorityOrgan').textContent=organ+' · '+rows.length+' checks';
 root.innerHTML='';
 for(const item of rows){
  const saved=S.priorityChecks[item.id]||{status:'Not reviewed',note:''};
  const field=document.createElement('div');field.className='priority-row';
  const left=document.createElement('div');left.className='priority-label';
  left.innerHTML='<span class="tiny-tag">'+esc(item.tag)+'</span><strong>'+esc(item.title)+'</strong><p>'+esc(item.reason)+'</p>';
  const right=document.createElement('div');right.className='priority-entry';
  const select=document.createElement('select');select.setAttribute('aria-label',item.title+' review status');
  for(const text of ['Not reviewed','Reviewed — no concern noted','Follow-up required','Not assessable in image','Not applicable'])select.add(new Option(text,text));
  select.value=saved.status;
  const note=document.createElement('input');note.type='text';note.maxLength=300;note.setAttribute('aria-label',item.title+' reviewer note');note.placeholder='Evidence / note';note.value=saved.note||'';
  const apply=()=>{S.priorityChecks[item.id]={status:select.value,note:note.value.slice(0,300),reason:item.reason,tag:item.tag};updateCount();};
  select.onchange=apply;note.oninput=apply;
  right.append(select,note);field.append(left,right);root.append(field);
 }
 updateCount();
}
function updateCount(){
 const el=$('#prioritySummary');if(!el)return;
 const rows=pick()[1],statuses=rows.map(x=>S.priorityChecks?.[x.id]?.status||'Not reviewed');
 const unresolved=statuses.filter(x=>x==='Not reviewed').length,flagged=statuses.filter(x=>x==='Follow-up required').length;
 el.textContent=unresolved+' unreviewed · '+flagged+' require follow-up';
 el.classList.toggle('warn-flag',unresolved>0||flagged>0);
}
function encodeRegion(max=1150){
 const c=(S.analysis?.candidates||[])[S.selected];if(!c||!S.image)return '';
 const [bx,by,bw,bh]=c.box||[];if(![bx,by,bw,bh].every(Number.isFinite)||bw<1||bh<1)return '';
 const x=Math.max(0,(bx-.12*bw)/1000*S.imageWidth),y=Math.max(0,(by-.12*bh)/1000*S.imageHeight);
 const w=Math.min(S.imageWidth-x,bw*1.24/1000*S.imageWidth),h=Math.min(S.imageHeight-y,bh*1.24/1000*S.imageHeight);
 if(w<5||h<5)return '';
 const scale=Math.min(1,max/Math.max(w,h)),o=document.createElement('canvas');o.width=Math.max(1,Math.round(w*scale));o.height=Math.max(1,Math.round(h*scale));
 o.getContext('2d').drawImage(S.image,x,y,w,h,0,0,o.width,o.height);
 for(const quality of [.8,.67,.5]){const d=o.toDataURL('image/jpeg',quality);if(d.length<1_550_000)return d;}
 return '';
}
function toggleRegion(){
 S.roiFocus=!S.roiFocus;
 const button=$('#roiFocus');
 if(button){button.classList.toggle('active',!!S.roiFocus);button.setAttribute('aria-pressed',String(!!S.roiFocus));button.textContent=S.roiFocus?'ROI focus · ON':'ROI focus';}
 if(S.roiFocus&&S.selected<0)toast('Select a numbered AI region first. The crop will be sent only with an authorized Clippy question.');
}
function recordEvent(event,detail){
 ensure();observations.push({at:new Date().toISOString(),event:String(event).slice(0,50),detail:String(detail||'').slice(0,160)});
 $('#studyCount').textContent=observations.length+' events';
}
function renderBenchmark(){
 const area=$('#studyLog');if(!area)return;
 const elapsed=started?Math.round((performance.now()-started)/1000):lastReport?.elapsed_seconds||0;
 area.textContent=(started?'Session running · ':'Last recorded · ')+elapsed+' s · '+observations.length+' events';
}
function studyStart(){
 if(!S.image){toast('Open a specimen before starting a usability observation.');return;}
 started=performance.now();observations=[];recordEvent('study_started',S.caseId);renderBenchmark();toast('PA walkthrough timing started. No data leaves this browser.');
}
function studyStop(){
 if(started===null){toast('No active observation session.');return;}
 const seconds=Math.round((performance.now()-started)/1000);recordEvent('study_stopped',String(seconds)+' seconds');
 lastReport={case_id:S.caseId,elapsed_seconds:seconds,events:[...observations],issues:String($('#studyIssues').value||'').slice(0,2000),task:'Research PA walkthrough',review_note:'Observer-entered notes only; no real patients'};
 started=null;renderBenchmark();toast('Recorded research walkthrough · '+seconds+' s');
}
function exportStudy(){
 if(started!==null)studyStop();
 if(!lastReport){toast('Start and finish a walkthrough before exporting.');return;}
 M.blobDownload(JSON.stringify(lastReport,null,2),'application/json',(S.caseId||'DEMO')+'-usability.json');
}
function trainingManifest(){
 ensure();
 if(!S.image){toast('Open a specimen before exporting training metadata.');return;}
 const record={
  schema:'ltu-capturedx-dataset-candidate/1.1',
  export_time:new Date().toISOString(),case_id:S.caseId,group_id:S.caseId,organ_source_label:S.organ,
  specimen_source:S.source,source_url:S.sourceUrl,license:S.license,
  original_dimensions:{width:S.imageWidth,height:S.imageHeight},
  allowed_for_training:false,rights_status:'Require explicit confirmation before model training',
  expert_ground_truth_available:false,ground_truth_mask:null,split:'unassigned — split by specimen/case',
  image_qc:S.qc||null,
  model_proposals:(S.analysis?.candidates||[]).map((c,i)=>({id:'F'+(i+1),label:c.label,box_normalized:c.box,model_visual_support_pct:c.confidence??null,review:S.reviewDecisions[i]||'Pending',expert_mask:false})),
  pa_evidence:S.priorityChecks||{},manual_annotations:{stroke_paths:S.strokes,measurements_px:S.measures,operator_calibration:S.calibration||null,reviewed_polygons:S.polygons||[]},evaluation:{manual_polygon_mask_overlap:S.maskValidation||null,reviewer_model_feedback:S.feedback||{},image_view_completeness:S.viewChecks||{},qc_reviewed:!!S.qcAcknowledged},
  reviewer_conclusion:S.reviewDecision||'Pending',notes:S.notes,
  caveat:'Image itself not included; export has no expert-validated masks, diagnosis or permission to train. Not suitable as a gold-standard sample.'
 };
 M.blobDownload(JSON.stringify(record,null,2),'application/json',(S.caseId||'DEMO')+'-dataset-candidate.json');
}
function init(){
 // New UX is appended to the existing focused Capture DX-inspired review; no duplicated admin dashboard.
 const review=$('#page-review'),two=review?.querySelector('.two-col');
 if(review&&two&&!$('#priorityChecks')){
 const panel=document.createElement('section');panel.className='panel sponsor-review';
 panel.innerHTML='<div class="section-head"><div><h2>Priority anatomy review</h2><p class="sponsor-lead">Case-specific QA prompts for a PA; these are not automated staging or diagnosis results.</p></div><span class="case-pill" id="priorityOrgan">General</span></div><div id="priorityChecks"></div><div class="sponsor-bottom"><span id="prioritySummary" aria-live="polite">Not reviewed</span><button type="button" id="priorityGoImage" class="btn small">Inspect image</button></div>';
 two.after(panel);
 $('#priorityGoImage').onclick=()=>M.nav('analysis');
 }
 const session=document.createElement('details');session.className='panel sponsor-study';
 session.innerHTML='<summary>PA walkthrough &amp; workflow observation <span class="case-pill">Research evaluation</span></summary><p class="sponsor-lead">Time a simulated intake → image QC → PA review. Record friction points during a guided PA observation. No video or patient information is recorded.</p><div class="flex"><button class="btn small" id="studyStart" type="button">Start task</button><button class="btn small" id="studyStop" type="button">Finish</button><button class="btn small" id="studyExport" type="button">Export study JSON</button></div><p class="sponsor-lead" id="studyLog">No completed session</p><label for="studyIssues" class="sponsor-lead">Workflow issues observed</label><textarea id="studyIssues" rows="3" placeholder="e.g., 4 clicks to reach annotation review; camera switch interrupted task"></textarea><span id="studyCount" class="sponsor-lead">0 events</span>';
 review.append(session);
 $('#studyStart').onclick=studyStart;$('#studyStop').onclick=studyStop;$('#studyExport').onclick=exportStudy;
 const models=$('#page-models');const panel=document.createElement('section');panel.className='panel sponsor-handoff';
 panel.innerHTML='<div class="section-head"><h2>Dataset factory handoff</h2><span class="case-pill">Ready for labeling</span></div><p class="sponsor-lead">Export case provenance, QC, AI proposals and reviewer decisions as a versioned JSON training-candidate manifest. No image or proprietary dataset is uploaded here.</p><button id="manifestExport" class="btn" type="button">Export current case manifest</button><p class="disclaimer">Requires an expert annotation and permission review before training. DGX Spark connection and LTU Pathologize API integration are not yet configured.</p>';
 models.append(panel);$('#manifestExport').onclick=trainingManifest;
 const chat=$('#chatForm .footer .flex');if(chat&&!$('#roiFocus')){const button=document.createElement('button');button.id='roiFocus';button.type='button';button.className='btn small';button.textContent='ROI focus';button.title='Use selected AI bounding box as a higher-detail crop for the next Clippy image question';button.setAttribute('aria-pressed','false');button.onclick=toggleRegion;chat.insertBefore(button,chat.firstChild);}
 const prior=M.renderReview;M.renderReview=(...args)=>{prior?.(...args);render();};
 const oldNav=M.nav;M.nav=function(name){oldNav(name);if(name==='review')render();};
 const oldToast=M.toast;M.toast=oldToast;
 const observeClicks=[['#analyzeBtn','analyze_requested'],['#barcodeBtn','barcode_scan_requested'],['#snapPhoto','camera_capture'],['#exportReview','review_export'],['#draftGrossBtn','draft_created']];
 for(const [id,event] of observeClicks)$(id)?.addEventListener('click',()=>{if(started!==null)recordEvent(event,S.caseId)});
 const reviewButtons=document.querySelectorAll('[data-case-decision]');reviewButtons.forEach(el=>el.addEventListener('click',()=>{if(started!==null)recordEvent('review_decision',el.dataset.caseDecision)}));
 M.encodeRegion=encodeRegion;M.sponsorInfo=()=>({priority_checks:S.priorityChecks||{},workflow_study:lastReport,roi_focus:!!S.roiFocus});
 M.renderPriority=render;
 render();
}
M.initSponsor=init;
})();

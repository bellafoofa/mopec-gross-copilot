
/* Mopec Capture & Analysis v14 — practical PA workflows built on v11/v12.
   Research only. No PHI, automatic staging, validated lesion masks, or hospital integration. */
(()=>{'use strict';
const M=window.Mopec;if(!M)return;
const S=M.S,$=M.$,safe=M.safe,toast=M.toast;
const state={views:[],active:null,serial:0,localOnly:false,cassettes:[],caseId:'',qcAdvice:null,roi:null};
const snapshotKeys=['analysis','qc','mask','strokes','measures','undoStack','selected','reviewDecisions','reviewChecks','reviewDecision','reviewer','notes','captureNotes','polygons','mmPerPixel','calibration','qcAcknowledged','qcReviewNote','viewChecks','maskValidation','gtMask','comparisonPrediction','feedback','reviewEvents','priorityChecks','consent','sourceType','source'];
const isImg=x=>!!x&&Number.isFinite(x.naturalWidth)&&x.naturalWidth>0;
const stamp=()=>new Date().toISOString();
function el(id){return document.getElementById(id);}
function setText(id,val){const n=el(id);if(n)n.textContent=val;}
function makeButton(label,id,cls='btn small'){const b=document.createElement('button');b.type='button';b.id=id;b.className=cls;b.textContent=label;return b;}
function thumb(img){try{const c=document.createElement('canvas');c.width=156;c.height=98;const k=c.getContext('2d');k.fillStyle='#18232e';k.fillRect(0,0,c.width,c.height);
 const scale=Math.min(146/img.naturalWidth,88/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
 k.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);return c.toDataURL('image/jpeg',.68);}catch{return ''}}
function captureSnapshot(){const result={};for(const k of snapshotKeys)result[k]=S[k];result.image=S.image;result.imageWidth=S.imageWidth;result.imageHeight=S.imageHeight;return result;}
function rootCase(){if(!isImg(S.image))return;const v={id:'v1',name:'Overview / original',image:S.image,width:S.imageWidth,height:S.imageHeight,thumb:thumb(S.image),kind:S.sourceType==='catalog'?'reference':'local',snapshot:captureSnapshot()};
 state.views=[v];state.active=v.id;state.serial=1;state.cassettes=[];state.caseId=S.caseId||'DEMO';S.activeViewId=v.id;renderViews();renderCassette();renderQCAdvice();setText('v14PhotoCount','1 view');}
function saveActive(){const prev=state.views.find(v=>v.id===state.active);if(prev){prev.snapshot=captureSnapshot();prev.image=S.image;prev.width=S.imageWidth;prev.height=S.imageHeight;}}
function restoreView(view){
 if(!view)return;
 saveActive();state.active=view.id;S.activeViewId=view.id;
 if(view.snapshot){Object.assign(S,view.snapshot);}
 else{S.image=view.image;S.imageWidth=view.width;S.imageHeight=view.height;M.resetResults();}
 S.image=view.image;S.imageWidth=view.width;S.imageHeight=view.height;S.imageUrl=null;
 $('#canvasEmpty').classList.add('hidden');
 $('#publicConsent').checked=!!S.consent;
 M.setTitle();M.renderFindings?.();M.renderReview?.();M.renderCues?.();
 if(S.qc)M.renderQC?.();else{
  setText('qcStatus','QC not run');setText('qcBadge','Not assessed');setText('qcMetrics','Run local image QC to inspect technical image quality.');el('qcTags').innerHTML='';
 }
 M.resizeCanvas();M.renderEval?.();renderQCAdvice();renderViews();renderCassette();M.draw();toast('Viewing '+view.name+'.');
}
function renderViews(){
 const list=el('v14Views');if(!list)return;list.innerHTML='';
 for(const v of state.views){const b=document.createElement('button');b.type='button';b.className='v14-thumb'+(v.id===state.active?' active':'');b.setAttribute('aria-pressed',String(v.id===state.active));b.title=v.name+' · '+v.width+' × '+v.height+' px';
 const im=document.createElement('img');im.src=v.thumb||'';im.alt='';
 const label=document.createElement('span');label.textContent=v.name;b.append(im,label);b.onclick=()=>restoreView(v);list.append(b);}
 setText('v14PhotoCount',state.views.length+' / 8 image'+(state.views.length!==1?'s':''));
 const compare=el('v14Compare');if(compare)compare.disabled=state.views.length<2;
}
async function addPhotos(files){
 if(!S.image)return toast('Open a source specimen before adding related photographs.');
 const allowed=Array.from(files||[]).slice(0,8),free=Math.max(0,8-state.views.length);
 if(!free)return toast('This browser prototype supports up to eight image views per case.');
 let count=0;for(const f of allowed.slice(0,free)){
  if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>40*1024*1024){toast('Skipped '+f.name+': image must be JPEG/PNG/WebP under 40 MB.');continue;}
  const url=URL.createObjectURL(f),im=new Image();
  try{im.src=url;await im.decode();if(im.naturalWidth*im.naturalHeight>130_000_000){toast('Skipped '+f.name+': large image exceeds browser demo budget. Use a tiled image service for 200-MP Capture DX files.');continue;}
   const v={id:'v'+(++state.serial),name:f.name.slice(0,48),image:im,width:im.naturalWidth,height:im.naturalHeight,thumb:thumb(im),kind:'local',snapshot:null};
   state.views.push(v);count++;
  }catch{toast('Could not decode '+f.name);}
  finally{URL.revokeObjectURL(url);}
 }
 renderViews();if(count){toast(count+' view(s) added to the current research case. Select a thumbnail to inspect.');}
}
function createFilmstrip(){
 const viewer=el('viewer');if(!viewer||el('v14Strip'))return;
 const strip=document.createElement('section');strip.id='v14Strip';strip.className='v14-strip';strip.setAttribute('aria-label','Photographs linked to the selected specimen');
 strip.innerHTML='<div class="v14-strip-title"><span>SPECIMEN VIEWS</span><span id="v14PhotoCount">—</span></div><div class="v14-thumbs" id="v14Views"></div><div class="v14-strip-actions"><button id="v14AddPhoto" class="btn small" type="button">+ Add views</button><button id="v14Compare" class="btn small" type="button" disabled>Compare</button><button id="v14ROI" class="btn small" type="button">Inspect detail</button></div><input id="v14FileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>';
 viewer.before(strip);
 el('v14AddPhoto').onclick=()=>el('v14FileInput').click();
 el('v14FileInput').onchange=e=>{addPhotos(e.target.files);e.target.value='';};
 el('v14ROI').onclick=openRegion;
 el('v14Compare').onclick=openCompare;
}
function buildModals(){
 const compare=document.createElement('dialog');compare.id='v14CompareDialog';compare.className='v14-modal';
 compare.innerHTML='<div class="v14-modal-head"><div><h2>Compare specimen views</h2><p>Side-by-side comparison of photographs from the current case. Views are not registered or aligned.</p></div><button type="button" class="btn small" data-close="v14CompareDialog">Close</button></div>'+
 '<div class="v14-modal-body"><label class="v14-select-label" for="v14CompareSelect">Second photograph</label><select id="v14CompareSelect"></select><div class="v14-compare-grid"><figure><canvas id="v14CompareA"></canvas><figcaption id="v14CompareALabel"></figcaption></figure><figure><canvas id="v14CompareB"></canvas><figcaption id="v14CompareBLabel"></figcaption></figure></div><p class="v14-note">These images may represent different specimen views and must not be treated as geometrically aligned. Measurements require separate calibration.</p></div>';
 const roi=document.createElement('dialog');roi.id='v14ROIDialog';roi.className='v14-modal';
 roi.innerHTML='<div class="v14-modal-head"><div><h2>Native image detail</h2><p>Inspect a selected feature or an area of the original photograph without downsampling it for AI.</p></div><button type="button" class="btn small" data-close="v14ROIDialog">Close</button></div>'+
 '<div class="v14-modal-body"><div class="v14-roi-bar"><button class="btn small" type="button" id="v14RoiLeft">← Shift left</button><button class="btn small" type="button" id="v14RoiRight">Shift right →</button><button class="btn small" type="button" id="v14RoiUp">↑</button><button class="btn small" type="button" id="v14RoiDown">↓</button><button class="btn small" type="button" id="v14RoiSave">Export region PNG</button></div><div class="v14-native-view"><canvas id="v14RoiCanvas"></canvas></div><p id="v14RoiInfo" class="v14-note"></p><p class="v14-note">Native detail is rendered locally from the loaded image. It is not a tiled 200-MP camera integration; clinical-scale imaging requires Mopec image files, tiling, and validation.</p></div>';
 document.body.append(compare,roi);
 document.querySelectorAll('[data-close^="v14"]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 el('v14CompareSelect').onchange=drawCompare;
 for(const [id,x,y] of [['v14RoiLeft',-1,0],['v14RoiRight',1,0],['v14RoiUp',0,-1],['v14RoiDown',0,1]])el(id).onclick=()=>{if(state.roi){state.roi.x+=x*state.roi.w*.7;state.roi.y+=y*state.roi.h*.7;drawRegion();}};
 el('v14RoiSave').onclick=exportRegion;
}
function renderScaled(canvas,img){
 if(!isImg(img))return;const dpr=Math.min(2,devicePixelRatio||1),w=620,h=480;
 canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.fillStyle='#17222c';ctx.fillRect(0,0,canvas.width,canvas.height);
 const f=Math.min((canvas.width-28)/img.naturalWidth,(canvas.height-28)/img.naturalHeight);
 ctx.drawImage(img,(canvas.width-img.naturalWidth*f)/2,(canvas.height-img.naturalHeight*f)/2,img.naturalWidth*f,img.naturalHeight*f);
}
function openCompare(){
 if(state.views.length<2)return toast('Add another related specimen photograph first.');
 const select=el('v14CompareSelect');select.innerHTML='';
 state.views.filter(v=>v.id!==state.active).forEach(v=>select.add(new Option(v.name,v.id)));
 drawCompare();el('v14CompareDialog').showModal();
}
function drawCompare(){
 const curr=state.views.find(v=>v.id===state.active),other=state.views.find(v=>v.id===el('v14CompareSelect').value);
 if(!curr||!other)return;
 renderScaled(el('v14CompareA'),curr.image);renderScaled(el('v14CompareB'),other.image);
 setText('v14CompareALabel',curr.name+' · '+curr.width+' × '+curr.height+' px');
 setText('v14CompareBLabel',other.name+' · '+other.width+' × '+other.height+' px');
}
function clamp(n,min,max){return Math.max(min,Math.min(n,max));}
function openRegion(){
 if(!isImg(S.image))return toast('Open an image to inspect native detail.');
 let cx=S.imageWidth/2,cy=S.imageHeight/2,w=Math.min(1450,S.imageWidth),h=Math.min(1050,S.imageHeight);
 const proposal=S.analysis?.candidates?.[S.selected];
 if(proposal?.box?.length===4){
  const [x,y,bw,bh]=proposal.box;const rw=bw/1000*S.imageWidth,rh=bh/1000*S.imageHeight;
  cx=(x+bw/2)/1000*S.imageWidth;cy=(y+bh/2)/1000*S.imageHeight;
  w=clamp(Math.max(rw*1.45,450),120,Math.min(1900,S.imageWidth));
  h=clamp(Math.max(rh*1.45,380),120,Math.min(1500,S.imageHeight));
 }
 state.roi={x:cx-w/2,y:cy-h/2,w,h};drawRegion();el('v14ROIDialog').showModal();
}
function roiRect(){
 if(!state.roi||!S.image)return null;
 const r=state.roi;const w=Math.max(1,Math.round(Math.min(r.w,S.imageWidth))),h=Math.max(1,Math.round(Math.min(r.h,S.imageHeight)));
 const x=Math.round(clamp(r.x,0,Math.max(0,S.imageWidth-w))),y=Math.round(clamp(r.y,0,Math.max(0,S.imageHeight-h)));
 state.roi={x,y,w,h};return state.roi;
}
function drawRegion(){
 const r=roiRect();if(!r)return;
 const c=el('v14RoiCanvas');c.width=r.w;c.height=r.h;c.getContext('2d').drawImage(S.image,r.x,r.y,r.w,r.h,0,0,r.w,r.h);
 setText('v14RoiInfo','Native source '+S.imageWidth.toLocaleString()+' × '+S.imageHeight.toLocaleString()+' px · Crop x='+r.x+', y='+r.y+', width='+r.w+', height='+r.h+' pixels · Source: '+(S.source||'Imported image'));
}
function exportRegion(){
 const r=roiRect();if(!r)return;const c=document.createElement('canvas');c.width=r.w;c.height=r.h;c.getContext('2d').drawImage(S.image,r.x,r.y,r.w,r.h,0,0,r.w,r.h);
 c.toBlob(b=>{if(b)M.blobDownload(b,'image/png',(S.caseId||'research')+'-'+(state.active||'v1')+'-native-roi.png');},'image/png');
}
function runLocalQC(){
 if(!S.image)return toast('Open an image first.');
 try{S.qc=M.qcScreen();S.mask=M.paintMask();S.qcAcknowledged=false;M.renderQC();M.draw();M.step(S.analysis?4:2);renderQCAdvice();
  S.reviewEvents=S.reviewEvents||[];S.reviewEvents.push({time:stamp(),event:'local_image_qc',detail:(S.qc.flags||[]).join('; ').slice(0,180),case_id:S.caseId});toast('Local image-quality screening completed. Review warnings before using results.');
 }catch(e){toast('Image quality screening could not complete: '+(e.message||'unknown error'));}
}
const qualityHints=[
 [/blur|fine detail/i,'Retake using stable support, correct focus, and a perpendicular camera position. Confirm detail at native resolution.'],
 [/near-white|glare/i,'Reposition lights or the specimen to reduce specular reflections. Do not interpret saturated highlights as tissue.'],
 [/resolution/i,'Use a higher-resolution original or a native-resolution region image. Confirm that annotations refer to the actual source.'],
 [/dark|brightness/i,'Adjust diffuse illumination and image exposure; verify that shadowed structures remain visible.'],
 [/color/i,'Check white balance and color calibration against the workstation standard.']
];
function renderQCAdvice(){
 const out=el('v14QCAdvice');if(!out)return;
 if(!S.qc){out.innerHTML='<p class="v14-note">Run local QC for focus, brightness, clipped highlights, image size and capture-completeness prompts. No AI or server request is needed.</p>';return;}
 const q=S.qc,flags=Array.isArray(q.flags)?q.flags:[];
 const lines=flags.map(f=>{
  let hint=qualityHints.find(([pattern])=>pattern.test(f));
  return '<li><strong>'+safe(f)+'</strong><span>'+safe(hint?hint[1]:'Inspect the original photograph and verify adequacy with the PA.')+'</span></li>';
 });
 out.innerHTML='<div class="v14-qc-status '+(flags.length?'needs':'ok')+'"><strong>'+(flags.length?flags.length+' screening flag(s)':'No heuristic flags')+'</strong><span>'+safe(q.width+' × '+q.height)+' px</span></div>'+
 (lines.length?'<ul class="v14-qc-list">'+lines.join('')+'</ul>':'<p class="v14-note">The heuristics did not flag an issue. A PA must still verify focus, required views, labeling, orientation and scale.</p>')+
 '<div class="v14-mini-actions"><button type="button" class="btn small" id="v14QCReview">Record PA QC decision</button><button type="button" class="btn small" id="v14QCRetake">Capture another view</button></div><p class="v14-note">Screening flags are not validated quality decisions. Current image and scale remain unchanged.</p>';
 el('v14QCReview').onclick=()=>{M.nav('review');el('qcReviewNote')?.focus();el('qcReviewNote')?.scrollIntoView({block:'center',behavior:'smooth'});};
 el('v14QCRetake').onclick=()=>M.nav('capture');
}
function addQCFeatures(){
 const row=$('#page-analysis .toolrow');
 if(row&&!el('v14LocalQC')){const b=makeButton('Run local QC','v14LocalQC');row.insertBefore(b,el('analyzeBtn'));b.onclick=runLocalQC;}
 const panel=el('qcMetrics')?.parentNode;if(panel&&!el('v14QCAdvice')){const wrap=document.createElement('div');wrap.id='v14QCAdvice';wrap.className='v14-qc-advice';panel.append(wrap);}
 el('analyzeBtn')?.addEventListener('click',()=>setTimeout(renderQCAdvice,110));
 window.addEventListener('mopec:analysis-complete',()=>{renderQCAdvice();renderViews();});
}
function makeCassettePanel(){
 const review=el('page-review'),anchor=review?.querySelector('.two-col');if(!review||!anchor)return;
 const section=document.createElement('section');section.id='v14Sections';section.className='panel v14-section-panel';
 section.innerHTML='<div class="section-head"><div><h2>Section / cassette map</h2><p class="v14-note">Associate an image region with a proposed grossing section. Nothing is assigned or sampled automatically.</p></div><span class="case-pill">Reviewer verified only</span></div>'+
 '<form id="v14CassetteForm" class="v14-cassette-form"><label>Cassette label<input id="v14CassetteId" maxlength="8" placeholder="A1" required></label>'+
 '<label>Image / region<select id="v14RegionRef"></select></label>'+
 '<label class="v14-site">Section location or purpose<input id="v14CassetteSite" maxlength="130" placeholder="e.g. interface requiring PA review" required></label>'+
 '<label class="v14-site">Observation / follow-up<input id="v14CassetteNote" maxlength="250" placeholder="Visible evidence or verification still needed"></label>'+
 '<button type="submit" class="btn primary">Add section</button></form>'+
 '<div class="v14-table-wrap"><table class="v14-map-table"><thead><tr><th>Cassette</th><th>Linked image / region</th><th>Review purpose</th><th>PA status</th><th></th></tr></thead><tbody id="v14CassetteRows"><tr><td colspan="5" class="muted">No sections mapped.</td></tr></tbody></table></div>'+
 '<div class="v14-section-foot"><span>Mapping is local to this research case; export records to preserve it.</span><button id="v14CassetteExport" type="button" class="btn small">Export CSV</button></div>';
 anchor.after(section);
 el('v14CassetteForm').onsubmit=e=>{e.preventDefault();addCassette();};
 el('v14CassetteExport').onclick=exportCassetteCSV;
 renderCassette();
}
function renderRegionOptions(){
 const select=el('v14RegionRef');if(!select)return;
 const value=select.value;select.innerHTML='';select.add(new Option('Current view — general','general'));
 for(let i=0;i<(S.analysis?.candidates||[]).length;i++){
  const f=S.analysis.candidates[i];select.add(new Option('F'+(i+1)+' · '+f.label,'F'+(i+1)));}
 for(let i=0;i<(S.polygons||[]).length;i++){const p=S.polygons[i];select.add(new Option('Manual '+(i+1)+' · '+(p.label||'region'),'M'+(i+1)));}
 if([...select.options].some(o=>o.value===value))select.value=value;
}
function addCassette(){
 if(!S.image)return toast('Open a specimen before mapping sections.');
 const cassette=el('v14CassetteId').value.trim().toUpperCase().replace(/\s+/g,''),site=el('v14CassetteSite').value.trim(),note=el('v14CassetteNote').value.trim();
 if(!/^[A-Z]{1,2}\d{1,3}$/.test(cassette))return toast('Use a cassette label such as A1 or B12.');
 if(state.cassettes.some(c=>c.cassette===cassette))return toast(cassette+' already exists. Use a different cassette label.');
 if(!site)return toast('Provide the section location or reason for review.');
 state.cassettes.push({cassette,view_id:state.active,view_label:state.views.find(v=>v.id===state.active)?.name||'Current image',region:el('v14RegionRef').value,site:site.slice(0,130),note:note.slice(0,250),status:'Proposed',time:stamp()});
 S.cassetteMap=state.cassettes;
 el('v14CassetteForm').reset();renderCassette();appendEvent('cassette_added',cassette+' · '+site);toast(cassette+' added to the draft section map.');
}
function appendEvent(event,detail){
 S.reviewEvents=S.reviewEvents||[];S.reviewEvents.push({time:stamp(),event,detail:String(detail).slice(0,180),case_id:S.caseId||'DEMO'});
}
function renderCassette(){
 const body=el('v14CassetteRows');if(!body)return;renderRegionOptions();body.innerHTML='';
 if(!state.cassettes.length){body.innerHTML='<tr><td colspan="5" class="v14-empty">No sections mapped. Add an image-linked section for review.</td></tr>';}
 else for(const c of state.cassettes){const row=document.createElement('tr');const ref=(c.region==='general'?'General view':c.region);
 row.innerHTML='<td><strong>'+safe(c.cassette)+'</strong></td><td>'+safe(c.view_label)+'<small>'+safe(ref)+'</small></td><td>'+safe(c.site)+(c.note?'<small>'+safe(c.note)+'</small>':'')+'</td><td></td><td></td>';
 const select=document.createElement('select');select.setAttribute('aria-label','PA status for '+c.cassette);
 for(const x of ['Proposed','PA verified','Needs clarification'])select.add(new Option(x,x));
 select.value=c.status;select.onchange=()=>{c.status=select.value;appendEvent('cassette_status',c.cassette+' · '+c.status)};
 const del=makeButton('Remove','', 'btn small');del.setAttribute('aria-label','Remove '+c.cassette);
 del.onclick=()=>{state.cassettes=state.cassettes.filter(x=>x!==c);S.cassetteMap=state.cassettes;renderCassette();appendEvent('cassette_removed',c.cassette)};
 row.children[3].append(select);row.children[4].append(del);body.append(row);}
 const used=new Set(state.cassettes.map(c=>c.cassette));let i=1;while(used.has('A'+i))i++;el('v14CassetteId').value='A'+i;
}
function csvEscape(x){return '"'+String(x??'').replace(/"/g,'""')+'"';}
function exportCassetteCSV(){
 const headers=['Case ID','Cassette','View ID','View label','Region','Section site','Note','PA status','Created'];
 const rows=state.cassettes.map(c=>[S.caseId,c.cassette,c.view_id,c.view_label,c.region,c.site,c.note,c.status,c.time]);
 const csv=[headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\r\n');
 M.blobDownload(csv,'text/csv',(S.caseId||'case')+'-cassette-map.csv');
}
function upgradeExports(){
 const base=M.exportRecord;
 M.exportRecord=function(){
  saveActive();const record=base();record.schema='ltu-mopec-capture-dx-handoff/1.1';
  record.case_views=state.views.map(v=>({id:v.id,name:v.name,native_width:v.width,native_height:v.height,kind:v.kind,has_local_qc:!!v.snapshot?.qc,has_ai_proposals:!!v.snapshot?.analysis}));
  record.active_view_id=state.active;record.section_mapping=state.cassettes.map(c=>({...c}));record.privacy_mode=state.localOnly?'local_review_only':'cloud_assistance_permitted_by_existing_source_checks';
  record.validation_status='Research: no hospital data, licensed billing, clinical grading or validated lesion-stage prediction.';
  return record;
 };
 el('exportReview').onclick=()=>M.blobDownload(JSON.stringify(M.exportRecord(),null,2),'application/json',(S.caseId||'DEMO')+'-review.json');
 const draft=el('draftGrossBtn'),original=draft.onclick;
 draft.onclick=()=>{original?.();const box=el('draftGross');if(!box.value)return;
  const verified=state.cassettes.filter(c=>c.status==='PA verified');
  const footer=['','IMAGE SET','Views associated with this case: '+state.views.length,
   ...state.views.map(v=>'- '+v.name+' ('+v.width+' × '+v.height+' px)'),'',
   'CASSETTE / SECTION MAP (PA verification required)',...(verified.length?verified.map(c=>'- '+c.cassette+': '+c.site+'; image '+c.view_label+'; '+c.region):['- No cassette locations marked PA verified']),
   '','Outstanding proposed sections: '+state.cassettes.filter(c=>c.status!=='PA verified').length,
   '','Draft only: use the institution-approved grossing SOP and verify every clinical statement.'];
  box.value+='\n'+footer.join('\n');
 };
}
function updateLocalUI(){
 const b=el('v14Privacy');if(!b)return;
 b.setAttribute('aria-pressed',String(state.localOnly));b.innerHTML='<span class="v14-privacy-dot"></span>'+(state.localOnly?'Local review only':'Cloud AI allowed');
 const go=el('analyzeBtn');if(go){go.disabled=state.localOnly;go.title=state.localOnly?'Local review mode blocks external AI requests. Run local QC instead.':'Cloud AI requires a public/synthetic or authorized image.';}
 const note=el('v14PrivacyNote');if(note)note.textContent=state.localOnly?'External AI and browser speech requests are blocked by this interface. Local annotation and QC remain available.':'Cloud AI is available only for public/synthetic or explicitly authorized images. Do not use patient data on this public site.';
}
function setLocal(flag){
 state.localOnly=!!flag;S.localReviewOnly=state.localOnly;try{sessionStorage.setItem('mopec-local-review-only',state.localOnly?'1':'0');}catch{}
 updateLocalUI();toast(state.localOnly?'Local review only: external AI and browser speech disabled.':'Cloud AI enabled for permitted research material.');
}
function installPrivacy(){
 const top=$('.top-actions'),b=makeButton('Local review only','v14Privacy','v14-privacy');
 top.insertBefore(b,el('modelStatus'));
 b.onclick=()=>setLocal(!state.localOnly);
 try{state.localOnly=sessionStorage.getItem('mopec-local-review-only')==='1';}catch{}
 const base=M.remoteAllowed;M.remoteAllowed=()=>!state.localOnly&&base();
 for(const id of ['chatForm','v12CmdMic','dictateNotes','dictateChat']){
  const node=el(id);if(!node)continue;node.addEventListener(id==='chatForm'?'submit':'click',e=>{
    if(!state.localOnly)return;e.preventDefault();e.stopImmediatePropagation();toast('Local review only: cloud AI and browser speech are disabled. Switch modes to use them.');},true);
 }
 const models=el('page-models');const info=document.createElement('section');info.className='panel v14-privacy-help';
 info.innerHTML='<div class="section-head"><h2>AI &amp; data controls</h2><span class="case-pill">Research environment</span></div><p id="v14PrivacyNote" class="v14-note"></p>'+
 '<p class="v14-note">MiniMax and Kimi are supported as server-managed model adapters, but need project-owner credentials and evaluation. The website never asks visitors for an API key. The selected model is shown above.</p><a href="https://github.com/bellafoofa/mopec-gross-copilot/blob/main/CLIPPY_MODEL_SETUP.md" target="_blank" rel="noopener noreferrer">MiniMax / Kimi setup and validation guide ↗</a>'+
 '<p class="v14-note">“Local review only” blocks this interface’s external AI and browser speech requests; it is not a licensed offline hospital installation or a substitute for endpoint isolation.</p>';
 models.prepend(info);updateLocalUI();
}
function init(){
 createFilmstrip();buildModals();addQCFeatures();makeCassettePanel();upgradeExports();installPrivacy();
 window.addEventListener('mopec:case-changed',()=>{setTimeout(rootCase,0);});
 window.addEventListener('mopec:analysis-complete',()=>{renderCassette();renderQCAdvice();});
 document.addEventListener('click',e=>{if(e.target.closest('[data-decide],#finishPoly,#v11SaveFeedback'))setTimeout(renderCassette,50)});
 if(S.image)rootCase();
}
M.initV14=init;M.v14={runLocalQC,addPhotos,restoreView,readCase:()=>({caseId:state.caseId,views:state.views.map(v=>({id:v.id,name:v.name,width:v.width,height:v.height})),cassettes:state.cassettes.map(c=>({...c})),localOnly:state.localOnly}),setLocal};
})();

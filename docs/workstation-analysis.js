
(()=>{'use strict';
const M=window.Mopec,S=M.S,$=M.$,$$=M.$$,safe=M.safe,toast=M.toast;
const renal=['Record gross lesion dimensions when applicable','Inspect and document renal sinus interface','Assess relationship to perinephric fat','Review renal vein and vascular structures','Inspect collecting system and renal pelvis','Record specimen orientation and margins','Confirm representative tissue sampling with institutional protocol'];
const breast=['Document lesion size with a verified scale','Confirm anatomical orientation and margins','Review proximity to margins','Review skin/nipple structures if present','Check representative sections and relevant lymph node material'];
const generic=['Verify source and specimen identity','Confirm required image views and orientation','Review image QC and presence of scale','Document salient gross features and measurements','Check sampling requirements against local guidance'];
function checks(){const o=S.organ.toLowerCase();return /renal|kidney/.test(o)?renal:/breast/.test(o)?breast:generic;}
function renderCues(){const e=$('#anatomyCues');if(!e)return;const o=S.organ.toLowerCase();e.innerHTML=/kidney|renal/.test(o)?'<p class="limited"><b>Renal review cues:</b> sinus fat, perinephric fat, renal vein, collecting system, margins and measured size. Gross photo alone cannot establish invasion.</p>':/breast/.test(o)?'<p class="limited"><b>Breast review cues:</b> lesion dimensions, margin orientation, skin/nipple and relevant sections. Gross photo cannot assign stage.</p>':'<p class="limited">Confirm required landmarks, image views and measurements using the applicable laboratory procedure.</p>';}
function qcScreen(){
 if(!S.image)return null;const w=250,h=Math.max(25,Math.round(w*S.imageHeight/S.imageWidth)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(S.image,0,0,w,h);const p=x.getImageData(0,0,w,h).data;
 const grey=new Float32Array(w*h);let bright=0,dark=0,sum=0,lap=0,lapSq=0,cnt=0;
 for(let i=0;i<grey.length;i++){const k=i*4,v=.299*p[k]+.587*p[k+1]+.114*p[k+2];grey[i]=v;sum+=v;bright+=v>247;dark+=v<20;}
 for(let y=1;y<h-1;y+=2)for(let x=1;x<w-1;x+=2){const k=y*w+x,v=4*grey[k]-grey[k-1]-grey[k+1]-grey[k-w]-grey[k+w];lap+=v;lapSq+=v*v;cnt++;}
 const sharp=Math.max(0,lapSq/cnt-(lap/cnt)**2),white=bright/grey.length,black=dark/grey.length,mean=sum/grey.length,flags=[];
 if(Math.min(S.imageWidth,S.imageHeight)<700)flags.push('Limited native resolution');
 if(sharp<90)flags.push('Possible blur or low fine detail');
 if(white>.10)flags.push('Many near-white pixels / possible glare');
 if(mean<60)flags.push('Low average brightness');
 if(black>.18)flags.push('Large dark area');
 return {width:S.imageWidth,height:S.imageHeight,sharpness_heuristic:Math.round(sharp),mean_brightness:Math.round(mean),white_clipped_pct:+(100*white).toFixed(1),dark_pct:+(100*black).toFixed(1),flags,method:'heuristic screening, not validated clinical quality control'};
}
function paintMask(){
 if(!S.image)return null;const w=220,h=Math.round(w*S.imageHeight/S.imageWidth);
 if(h<30||h>1500)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(S.image,0,0,w,h);const a=g.getImageData(0,0,w,h).data;
 const points=[[2,2],[w-3,2],[2,h-3],[w-3,h-3]];const colors=points.map(([x,y])=>a.slice((y*w+x)*4,(y*w+x)*4+3));const median=v=>[...v].sort((x,y)=>x-y)[1];const bg=[0,1,2].map(k=>median(colors.map(v=>v[k])));
 const mask=new Uint8Array(w*h);let tissue=0;for(let i=0;i<mask.length;i++){const p=i*4;mask[i]=Math.hypot(a[p]-bg[0],a[p+1]-bg[1],a[p+2]-bg[2])>51?1:0;tissue+=mask[i];}
 if(tissue/mask.length<.03||tissue/mask.length>.91)return null;
 const out=document.createElement('canvas');out.width=w;out.height=h;const z=out.getContext('2d'),d=z.createImageData(w,h);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(mask[i]&&(!mask[i-1]||!mask[i+1]||!mask[i-w]||!mask[i+w])){const p=i*4;d.data[p]=88;d.data[p+1]=235;d.data[p+2]=220;d.data[p+3]=230;}}
 z.putImageData(d,0,0);return out;
}
function encodeImage(max=780){
 const c=document.createElement('canvas');const scale=Math.min(1,max/Math.max(S.imageWidth,S.imageHeight));c.width=Math.max(1,Math.round(S.imageWidth*scale));c.height=Math.max(1,Math.round(S.imageHeight*scale));c.getContext('2d').drawImage(S.image,0,0,c.width,c.height);
 for(const q of [.72,.57,.43]){const str=c.toDataURL('image/jpeg',q);if(str.length<1_600_000)return str;}return '';
}
function score(n){return n===null||n===undefined||n===''||!Number.isFinite(Number(n))?'N/A':Math.round(Math.max(0,Math.min(100,Number(n))))+'%';}
function renderQC(){
 if(!S.qc)return;const q=S.qc;$('#qcStatus').textContent=q.flags.length?'QC needs review':'QC screened';$('#qcBadge').textContent=q.flags.length?q.flags.length+' warning(s)':'No heuristic warnings';$('#statusDot').className='pip '+(q.flags.length?'warn':'good');
 $('#qcMetrics').innerHTML='<div class="kv"><dt>Native size</dt><dd>'+q.width+' × '+q.height+' px</dd><dt>Relative sharpness</dt><dd>'+q.sharpness_heuristic+'</dd><dt>Near-white area</dt><dd>'+q.white_clipped_pct+'%</dd><dt>Mean brightness</dt><dd>'+q.mean_brightness+'/255</dd></div>';
 $('#qcTags').innerHTML=q.flags.length?q.flags.map(f=>'<span class="qc-tag attention">'+safe(f)+'</span>').join(''):'<span class="qc-tag pass">Screened</span>';
 $('#qcTags').innerHTML+='<span class="qc-tag">PA verifies before use</span>';
}
function renderFindings(){
 const x=S.analysis,box=$('#findings');$('#findCount').textContent=x?String((x.candidates||[]).length):'—';
 if(!x){box.innerHTML='<div class="empty-data">Run analysis to review candidate gross findings.</div>';return}
 $('#analysisState').textContent='Preliminary · '+(x.candidates||[]).length+' regions';box.innerHTML='';
 const intro=document.createElement('div');intro.innerHTML='<div class="kv"><dt>Organ hypothesis</dt><dd>'+safe(x.organ_hypothesis||'Unknown')+' · <span class="score">'+score(x.organ_visual_support_pct)+' visual support</span></dd><dt>Visible morphology</dt><dd>'+safe(x.morphology||'No morphology returned')+'</dd></div>';box.append(intro);
 const consider=x.possible_considerations||[];
 if(consider.length){const head=document.createElement('h3');head.textContent='Possible gross patterns';head.style.cssText='font-size:12px;margin:12px 0 3px';box.append(head);
 for(const c of consider){const div=document.createElement('div');div.className='finding';div.innerHTML='<div class="finding-header"><strong>'+safe(c.label)+'</strong><span class="score">'+score(c.visual_support_pct)+'*</span></div><p>'+safe(c.rationale)+'</p>';box.append(div);}}
 if((x.candidates||[]).length){const head=document.createElement('h3');head.textContent='Localized candidate features';head.style.cssText='font-size:12px;margin:13px 0 4px';box.append(head);
 x.candidates.forEach((c,i)=>{const d=S.reviewDecisions[i]||'',div=document.createElement('div');div.className='finding';div.innerHTML='<div class="finding-header"><strong>F'+(i+1)+' · '+safe(c.label)+'</strong><span class="score">'+score(c.confidence)+'*</span></div><p>'+safe(c.rationale||'No rationale provided')+'</p><div class="review-acts"><button data-find="'+i+'">Locate</button><button data-decide="'+i+'" data-choice="Accepted" class="'+(d==='Accepted'?'selected':'')+'">Accept</button><button data-decide="'+i+'" data-choice="Edited" class="'+(d==='Edited'?'selected':'')+'">Edit</button><button data-decide="'+i+'" data-choice="Rejected" class="'+(d==='Rejected'?'selected':'')+'">Reject</button></div>';box.append(div)});
 }else{const empty=document.createElement('p');empty.className='muted';empty.style.fontSize='11px';empty.textContent='No localized focal feature proposed. Absence of a proposal is not confirmation of normal tissue.';box.append(empty)}
 const note=document.createElement('p');note.className='disclaimer';note.textContent='* AI-estimated visual support, not a calibrated diagnosis probability. Boxes are not lesion segmentation masks. PA review required.';box.append(note);
 $$('[data-find]').forEach(b=>b.onclick=()=>{S.selected=Number(b.dataset.find);S.overlay=true;$('#overlayToggle').checked=true;M.draw();toast('Highlighted candidate F'+(S.selected+1));});
 $$('[data-decide]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.decide);S.reviewDecisions[i]=b.dataset.choice;if(b.dataset.choice==='Edited'){S.selected=i;M.tool('brush');toast('Use Brush/Erase to correct the annotation.');}renderFindings();renderReview();});
 M.draw();
}
async function analyze(){
 if(!S.image){toast('Open a specimen image first.');return}
 S.qc=qcScreen();S.mask=paintMask();renderQC();renderCues();M.step(3);M.draw();
 if(!M.remoteAllowed()){toast('Cloud AI needs an authorized public/de-identified image. Confirm this under Capture.');M.nav('capture');return}
 const btn=$('#analyzeBtn');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Analyzing';$('#analysisState').textContent='Vision request…';
 try{
 const image=encodeImage();if(!image)throw Error('Cannot prepare the image for AI inference.');
 const resp=await fetch('/api/vision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,source:S.caseName+'; '+S.organ+'; '+S.source}),signal:AbortSignal.timeout(58000)});const data=await resp.json().catch(()=>({}));if(!resp.ok)throw Error(data.error||'AI service unavailable.');
 S.analysis=data;S.selected=-1;S.reviewDecisions={};M.step(4);renderFindings();M.nav('analysis');toast('Analysis returned. Verify the suggested regions and review checklist.');
 }catch(e){S.analysis=null;$('#analysisState').textContent='AI unavailable';$('#findings').innerHTML='<div class="empty-data">QC completed; model request did not return usable analysis. '+safe(e.message||'')+'</div>';$('#findCount').textContent='—';toast(e.message||'Model unavailable');}
 finally{btn.disabled=false;btn.innerHTML='<svg><use href="#i-play"></use></svg> Analyze image';M.draw();}
}
function renderReview(){
 const items=checks(),out=$('#reviewChecklist');out.innerHTML='';$('#reviewOrgan').textContent=S.organ||'General';
 for(const [i,name] of items.entries()){const label=document.createElement('label');label.className='checkrow';const input=document.createElement('input');input.type='checkbox';input.checked=!!S.reviewChecks[i];input.onchange=e=>S.reviewChecks[i]=e.target.checked;const span=document.createElement('span');span.textContent=name;label.append(input,span);out.append(label)}
 $('#reviewerName').value=S.reviewer;$('#reviewNote').value=S.notes;$('#reviewDecisionBadge').textContent=S.reviewDecision||'Pending';$$('[data-case-decision]').forEach(b=>b.classList.toggle('primary',b.dataset.caseDecision===S.reviewDecision));
}
function exportRecord(){return{schema:'ltu-mopec-capture-dx-handoff/1.0',exported_at:new Date().toISOString(),scope:'public or authorized research only',
 case:M.caseMeta(),image:{native_width:S.imageWidth,native_height:S.imageHeight},qc:S.qc,model:S.analysis?.model||null,analysis:S.analysis,
 manual_annotations:{stroke_paths:S.strokes,measurements_in_pixels:S.measures,region_review:S.reviewDecisions},
 review:{decision:S.reviewDecision||'Pending',reviewer_label:S.reviewer||null,notes:S.notes,anatomic_checks:checks().map((item,i)=>({item,confirmed:!!S.reviewChecks[i]})),priority_anatomy_checks:S.priorityChecks||{},capture_notes:S.captureNotes||null,draft_description:$('#draftGross').value||null},
 integration_status:'Prototype export only. Not connected to Capture DX, LIS, Epic or shared audit storage. Scores are not calibrated.'}}
function draft(){
 if(!S.image){toast('Open an image first.');return}
 const verified=checks().filter((v,i)=>S.reviewChecks[i]),accepted=(S.analysis?.candidates||[]).filter((c,i)=>['Accepted','Edited'].includes(S.reviewDecisions[i]));
 const lines=['DRAFT · PA VERIFICATION REQUIRED','Case: '+S.caseId,'Source specimen: '+S.caseName,'Organ label (source): '+S.organ,'Image: '+S.imageWidth+' × '+S.imageHeight+' px','','REVIEWER-CONFIRMED ITEMS',...(verified.length?verified.map(x=>'- '+x):['- None confirmed']),'','REVIEWED AI REGIONS',...(accepted.length?accepted.map(x=>'- '+x.label):['- No AI regions accepted']),'','MEASUREMENTS',...(S.measures.length?S.measures.map((m,i)=>'- '+(i+1)+': '+Math.round(m.pixels)+' pixels (uncalibrated)'):['- No verified physical measurements']),'','PA NOTES',S.notes||'[Not entered]','','Institution SOP, sampling decisions and final pathologic interpretation require authorized review.'];
 $('#draftGross').value=lines.join('\n');toast('Draft created from reviewer-confirmed material.');}
function initAnalysis(){
 $('#analyzeBtn').onclick=analyze;
 $('#reviewerName').oninput=e=>S.reviewer=e.target.value.slice(0,100);$('#reviewNote').oninput=e=>S.notes=e.target.value.slice(0,3000);
 $$('[data-case-decision]').forEach(b=>b.onclick=()=>{if(b.dataset.caseDecision==='Rejected'&&!S.notes.trim()){toast('Explain the rejection before saving.');$('#reviewNote').focus();return}S.reviewDecision=b.dataset.caseDecision;renderReview();toast('Review decision recorded for this browser session. Export the record for retention.');});
 $('#exportReview').onclick=()=>M.blobDownload(JSON.stringify(exportRecord(),null,2),'application/json',(S.caseId||'DEMO')+'-review.json');
 $('#draftGrossBtn').onclick=draft;$('#exportDraft').onclick=()=>M.blobDownload($('#draftGross').value||'No draft created.','text/plain',(S.caseId||'DEMO')+'-draft.txt');
 renderCues();
}
M.renderCues=renderCues;M.renderReview=renderReview;M.renderFindings=renderFindings;M.encodeImage=encodeImage;M.exportRecord=exportRecord;M.initAnalysis=initAnalysis;
})();

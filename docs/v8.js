
(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cv=$('#canvas'); if(!cv)return;
const clipSvg='<svg viewBox="0 0 36 44" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M27 13V30C27 38 21 41 16 41S5 37 5 28V14C5 6 11 3 18 3S30 9 30 17V29C30 34 26 37 22 37S14 34 14 28V17C14 13 16 11 19 11S24 13 24 17V29"/><circle cx="16.7" cy="17" r="1.1" fill="currentColor" stroke="none"/><circle cx="25.2" cy="17" r="1.1" fill="currentColor" stroke="none"/></svg>';
document.title='Mopec · Specimen review';
const nav=$('aside nav'),header=$('header');if(nav&&header){
  const wrap=document.createElement('div');wrap.className='topnav';wrap.appendChild(nav);header.insertBefore(wrap,header.querySelector('.right'));
  const names={workspace:'Workspace',guides:'Protocols',sources:'Library',about:'About'};
  nav.querySelectorAll('[data-nav]').forEach(b=>{b.textContent=names[b.dataset.nav]||b.textContent});
}
const cbtn=$('#clippy');cbtn.innerHTML=clipSvg+'<span>Clippy</span>';cbtn.setAttribute('aria-label','Open Clippy assistant');
const drawerTitle=$('.drawerhead strong');if(drawerTitle)drawerTitle.innerHTML='<span class="cliplogo">'+clipSvg+'</span><span>Clippy</span>';
const cap=$('.capsule');if(cap)cap.remove();
const about=$('#page-about');if(about)about.innerHTML='<h1>Mopec imaging workspace</h1><p>Gross-specimen image review, annotation, computer-vision exploration and PA review in one workspace.</p><div class="notice"><b>Development scope</b><p>Feature locations and masks are preliminary suggestions. They are not verified clinical findings. Approved local protocols and expert review remain the final authority.</p></div>';
const sources=$('#page-sources');if(sources)sources.innerHTML='<div class="tiny">Specimen collection</div><h1>Image library</h1><p>Gross specimen photography from CDC and attributed educational collections. Source labels are dataset metadata, not AI predictions.</p><div id="librarygrid" class="librarygrid"><p>Loading image library…</p></div><p class="disclaimer-small">Photographs are loaded from their sources. License and attribution information travel with each specimen. These photographs do not include expert lesion masks.</p>';
const bottom=$('.bottom>span');if(bottom)bottom.remove();
const status=$('#leftStatus');if(status)status.textContent='Opening specimen…';
const bar=document.createElement('div');bar.className='analysis-strip';bar.innerHTML='<span><strong id="segStatus">Not analyzed</strong></span><span id="qualityStatus">Image QC · —</span><span id="regionStatus">Regions · —</span><button id="analysisToggle">Results ▾</button>';
const detailed=document.createElement('div');detailed.id='analysisDetail';detailed.className='analysis-detail';detailed.textContent='Run analysis to review image quality, tissue isolation, and candidate findings.';
const reviewBar=document.createElement('div');reviewBar.className='reviewbar';reviewBar.innerHTML='<span id="reviewStatus">Review pending</span><div><label>Decision <select id="reviewDecision"><option value="">Choose</option><option>Accepted</option><option>Edited</option><option>Rejected</option></select></label> <input id="reviewNote" type="text" maxlength="250" placeholder="Reviewer note (optional)" aria-label="Review note"> <button id="saveReview">Save review</button> <button id="exportRecord">Export record</button></div>';
const viewer=$('.viewer');viewer.insertAdjacentElement('afterend',bar);bar.insertAdjacentElement('afterend',detailed);detailed.insertAdjacentElement('afterend',reviewBar);
$('#analysisToggle').onclick=()=>{detailed.classList.toggle('open');$('#analysisToggle').textContent=detailed.classList.contains('open')?'Results ▴':'Results ▾'};
const stage=$('#stage');
const regions=document.createElement('div');regions.id='roiOverlay';stage.appendChild(regions);
const regionCanvas=document.createElement('canvas');regionCanvas.id='roiCanvas';stage.appendChild(regionCanvas);
const insights=document.createElement('div');insights.id='assistantInsights';insights.className='insights';insights.innerHTML='<div class="tiny">Image analysis</div><div class="row"><span>AI findings</span><strong id="insightCount">Not requested</strong></div><div id="insightList" class="hint">Analyze a specimen to review suggested regions.</div>';
const drawerBody=$('.drawerbody');if(drawerBody)drawerBody.insertBefore(insights,drawerBody.firstChild);
let library=[],selected=null,proposal=null,metrics=null,busy=false,focus=null,patchMask=null,review=null;
const key=()=>selected?selected.id:'imported-'+($('#title')?.textContent||'image');
function showMessage(text){if(status)status.textContent=text}
const escapeHTML=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function formatted(text){
 let safe=escapeHTML(text);
 safe=safe.replace(/^#{1,4}\s+(.+)$/gm,'<h3>$1</h3>');
 safe=safe.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
 safe=safe.replace(/(?:^|\n)\s*[-•]\s+([^\n]+)/g,'\n• $1');
 const lines=safe.split(/\n+/),parts=[],bullets=[];
 function flush(){if(bullets.length){parts.push('<ul>'+bullets.map(x=>'<li>'+x+'</li>').join('')+'</ul>');bullets.length=0;}}
 for(let line of lines){line=line.trim();if(!line)continue;if(line.startsWith('• ')){bullets.push(line.slice(2));continue;}flush();if(line.startsWith('<h3>'))parts.push(line);else parts.push('<p>'+line+'</p>');}flush();return parts.join('');
}
const hist=$('#history');
if(hist){const observer=new MutationObserver(()=>{
 for(const el of hist.querySelectorAll('.message:not(.v8-rendered)')){
  el.classList.add('v8-rendered');
  if(!el.classList.contains('user')&&/^\S/.test(el.textContent||'')){const txt=el.textContent;if(txt&&!txt.includes('Clippy is analyzing…'))el.innerHTML=formatted(txt);}
 }
});observer.observe(hist,{childList:true});}
async function loadCatalog(){
 try{const r=await fetch('/api/catalog');if(!r.ok)throw Error('Catalog unavailable');library=await r.json();
 const grid=$('#librarygrid');grid.innerHTML='';
 for(const item of library){
  const el=document.createElement('article');el.className='library-card';
  el.innerHTML='<div class="tiny">'+escapeHTML(item.organ)+' · '+escapeHTML(item.group)+'</div><h3>'+escapeHTML(item.name)+'</h3><small>'+escapeHTML(item.origin)+' · '+escapeHTML(item.license)+'</small><div class="button-row"><button type="button">Open specimen</button><a target="_blank" rel="noopener noreferrer">Original source ↗</a></div>';
  el.querySelector('a').href=item.url;el.querySelector('button').onclick=()=>openSpecimen(item);grid.appendChild(el);
 }
 }catch(e){$('#librarygrid').textContent='Image library unavailable. You can still open a local image.';}
}
async function openSpecimen(item){
 if(busy)return;busy=true;showMessage('Loading '+item.organ.toLowerCase()+' specimen…');
 try{
  const r=await fetch('/api/specimen?id='+encodeURIComponent(item.id));if(!r.ok)throw Error('The source image is unavailable.');
  const blob=await r.blob();if(!blob.type.startsWith('image/'))throw Error('Image host did not return an image');
  const ext=blob.type.includes('png')?'png':'jpg',f=new File([blob],item.organ+' - '+item.name+'.'+ext,{type:blob.type});
  const dt=new DataTransfer();dt.items.add(f);const inp=$('#upload');inp.files=dt.files;inp.dispatchEvent(new Event('change',{bubbles:true}));
  selected=item;proposal=null;metrics=null;focus=null;patchMask=null;review=null;resetAnalysis();
  $('#title').textContent=item.name;
  $('#subtitle').textContent=item.organ+' · '+item.origin+' · '+item.license;
  $('#reviewStatus').textContent='Review pending';
  $$('[data-nav]').find(x=>x.dataset.nav==='workspace')?.click();
  setTimeout(()=>{showMessage('Ready · '+item.origin);positionRegions();},420);
 }catch(e){showMessage(e.message+' You can open a local image instead.');}finally{busy=false}
}
function resetAnalysis(){regions.innerHTML='';regionCanvas.getContext('2d').clearRect(0,0,regionCanvas.width,regionCanvas.height);$('#segStatus').textContent='Not analyzed';$('#qualityStatus').textContent='Image QC · —';$('#regionStatus').textContent='Regions · —';$('#insightCount').textContent='Not requested';$('#insightList').textContent='Analyze a specimen to review suggested regions.';detailed.textContent='Run analysis to review image quality, tissue isolation, and candidate findings.';}
$('#upload').addEventListener('change',()=>{if(!busy){selected=null;proposal=null;metrics=null;review=null;focus=null;patchMask=null;resetAnalysis();}});
function captureOriginal(){
 const toggle=$('#overlay'),prev=toggle.checked;toggle.checked=false;toggle.dispatchEvent(new Event('change'));
 const out=document.createElement('canvas'),rat=Math.min(1,900/Math.max(cv.width,cv.height));out.width=Math.max(1,Math.round(cv.width*rat));out.height=Math.max(1,Math.round(cv.height*rat));
 out.getContext('2d').drawImage(cv,0,0,out.width,out.height);
 toggle.checked=prev;toggle.dispatchEvent(new Event('change'));
 return out;
}
function imageQC(canvas){
 const c=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height,p=c.getImageData(0,0,w,h).data;
 let bright=0,dark=0,n=w*h,grey=new Float32Array(n),sum=0,sumSq=0,count=0;
 for(let i=0;i<n;i++){let k=i*4,r=p[k],g=p[k+1],b=p[k+2],v=(.299*r+.587*g+.114*b);grey[i]=v;if(r>247&&g>247&&b>247)bright++;if(v<12)dark++;}
 for(let y=1;y<h-1;y+=3)for(let x=1;x<w-1;x+=3){let i=y*w+x,lap=4*grey[i]-grey[i-1]-grey[i+1]-grey[i-w]-grey[i+w];sum+=lap;sumSq+=lap*lap;count++;}
 let sharp=(sumSq/count)-(sum/count)**2;
 let flags=[];if(Math.min(cv.width,cv.height)<700)flags.push('Low native resolution');if(sharp<90)flags.push('Low high-frequency detail / possible blur');if(bright/n>.1)flags.push('Many near-white pixels / possible glare');if(dark/n>.15)flags.push('Large dark regions');
 return {sharp:Math.round(sharp),bright:(bright/n*100).toFixed(1),flags,dimensions:cv.width+'×'+cv.height};
}
function positionRegions(){
 const a=cv.getBoundingClientRect(),b=stage.getBoundingClientRect();if(!a.width||!b.width)return;
 for(const el of [regions,regionCanvas]){el.style.left=(a.left-b.left)+'px';el.style.top=(a.top-b.top)+'px';el.style.width=a.width+'px';el.style.height=a.height+'px';}
 regions.style.width=a.width+'px';regions.style.height=a.height+'px';
 if(proposal)drawRegions();
}
function drawRegions(){
 regions.innerHTML='';if(!proposal)return;
 const candidates=proposal.candidates||[];
 for(const r of candidates){
  const [x,y,w,h]=r.box,el=document.createElement('button');el.className='candidate-box';el.style.left=(x/10)+'%';el.style.top=(y/10)+'%';el.style.width=(w/10)+'%';el.style.height=(h/10)+'%';
  el.innerHTML='<span>'+escapeHTML(r.id+' · '+r.label)+'</span>';el.title='Preliminary model localization, not expert ground truth';el.onclick=()=>selectCandidate(r);regions.appendChild(el);
 }
}
function selectCandidate(candidate){
 focus=candidate;$('#insightList').innerHTML='<div class="found"><b>'+escapeHTML(candidate.id+' · '+candidate.label)+'</b><p>'+escapeHTML(candidate.rationale)+'</p><button id="refineRegion">Outline color-similar pixels ↗</button><small>Exploratory color-based region suggestion, not a tumor boundary.</small></div>';
 $('#refineRegion').onclick=()=>refineCandidate(candidate);
}
function refineCandidate(cand){
 const [nx,ny,nw,nh]=cand.box,base=captureOriginal(),ctx=base.getContext('2d',{willReadFrequently:true}),w=base.width,h=base.height;
 const data=ctx.getImageData(0,0,w,h).data,x0=Math.max(0,Math.floor(nx/1000*w)),y0=Math.max(0,Math.floor(ny/1000*h)),x1=Math.min(w,Math.ceil((nx+nw)/1000*w)),y1=Math.min(h,Math.ceil((ny+nh)/1000*h));
 if(x1-x0<4||y1-y0<4)return;
 let seeds=[];for(const [fx,fy] of [[.5,.5],[.35,.35],[.65,.65]]){let sx=Math.floor(x0+fx*(x1-x0)),sy=Math.floor(y0+fy*(y1-y0)),p=(sy*w+sx)*4;seeds.push([data[p],data[p+1],data[p+2]]);}
 let out=document.createElement('canvas');out.width=w;out.height=h;let o=out.getContext('2d'),pixels=o.createImageData(w,h),n=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){let i=y*w+x,k=i*4,r=data[k],g=data[k+1],b=data[k+2];
  let match=seeds.some(s=>Math.hypot(r-s[0],g-s[1],b-s[2])<34);
  if(match){pixels.data[k]=242;pixels.data[k+1]=161;pixels.data[k+2]=51;pixels.data[k+3]=95;n++;}
 }
 o.putImageData(pixels,0,0);patchMask=out;
 regionCanvas.width=w;regionCanvas.height=h;regionCanvas.getContext('2d').drawImage(out,0,0);positionRegions();
 showMessage('Color-similar region: '+Math.round(n/((x1-x0)*(y1-y0))*100)+'% of candidate box; needs PA correction.');
}
async function runVision(){
 if(busy||!cv.width)return;busy=true;proposal=null;patchMask=null;positionRegions();
 const sample=captureOriginal();metrics=imageQC(sample);$('#qualityStatus').textContent='QC · '+(metrics.flags.length?'Check image':'Screened');
 $('#segStatus').textContent='Tissue outline · preliminary';$('#regionStatus').textContent='Analyzing features…';
 detailed.innerHTML='<b>Image QC</b><p>Dimensions '+escapeHTML(metrics.dimensions)+' · Sharpness heuristic '+metrics.sharp+' · Near-white pixels '+metrics.bright+'%</p><p>'+escapeHTML(metrics.flags.join(' · ')||'No heuristic quality flags')+'</p>';
 $('#insightCount').textContent='Running vision model…';$('#insightList').textContent='Identifying visible structures and candidate regions…';
 try{
  const image=sample.toDataURL('image/jpeg',.67);const r=await fetch('/api/vision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,source:selected?selected.name+'; '+selected.origin:'Unverified user-supplied image'})});
  const val=await r.json();if(!r.ok)throw Error(val.error||'Vision model not available');
  proposal=val;$('#regionStatus').textContent='AI regions · '+val.candidates.length;$('#insightCount').textContent=val.candidates.length+' proposals';
  const items=['<div class="row"><span>Organ hypothesis</span><strong>'+escapeHTML(val.organ_hypothesis||'Unknown')+'</strong></div>',
   '<p>'+escapeHTML(val.morphology||'No details returned')+'</p>'];
  if(val.candidates.length)for(const x of val.candidates)items.push('<div class="found"><button data-finding="'+escapeHTML(x.id)+'">'+escapeHTML(x.id+' · '+x.label)+'</button><div>'+escapeHTML(x.rationale)+'</div><small>No calibrated confidence score</small></div>');
  else items.push('<small>No reliably localized focal feature proposed.</small>');
  $('#insightList').innerHTML=items.join('');
  $$('[data-finding]').forEach(el=>el.onclick=()=>{const x=val.candidates.find(c=>c.id===el.dataset.finding);if(x)selectCandidate(x)});
  detailed.innerHTML+='<hr><b>AI image review</b><p>'+escapeHTML(val.morphology)+'</p><p>Next PA check: '+escapeHTML(val.suggested_next_review)+'</p><small>Proposed regions are approximate boxes generated by a vision-language model, not validated lesion segmentations. Calibration and expert ground truth are pending.</small>';
  drawRegions();positionRegions();showMessage('Completed image sweep. Review suggested regions before signing off.');
 }catch(e){$('#regionStatus').textContent='AI unavailable';$('#insightCount').textContent='Unavailable';$('#insightList').textContent=e.message;showMessage('Local tissue mask generated; '+e.message)}
 finally{busy=false}
}
$('#analyze').addEventListener('click',()=>setTimeout(runVision,35));
window.addEventListener('resize',positionRegions);new ResizeObserver(positionRegions).observe(stage);
$('#reviewDecision').onchange=()=>{$('#saveReview').disabled=!$('#reviewDecision').value};
$('#saveReview').onclick=()=>{
 let decision=$('#reviewDecision').value;if(!decision)return;let note=$('#reviewNote').value.trim();if(decision==='Rejected'&&!note)return showMessage('Please add a reason for rejection.');
 review={case_id:key(),decision,note,reviewed_at:new Date().toISOString(),model:proposal?.model||'No vision run',findings:proposal?.candidates||[],qc:metrics,source:selected?selected.url:'Unverified user upload'};
 localStorage.setItem('mopec_review_'+key(),JSON.stringify(review));$('#reviewStatus').textContent='PA decision · '+decision;showMessage('Research review saved on this browser.');
};
$('#exportRecord').onclick=()=>{
 const record=review||{case_id:key(),decision:'Pending',reviewed_at:null,model:proposal?.model||'No run',findings:proposal?.candidates||[],qc:metrics,source:selected?.url||null};
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));a.download='mopec_'+key()+'_review.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
};
const oldExport=$('#export');oldExport.onclick=()=>{
 const off=document.createElement('canvas');off.width=cv.width;off.height=cv.height;let o=off.getContext('2d');o.drawImage(cv,0,0);
 if(patchMask)o.drawImage(patchMask,0,0,off.width,off.height);
 if(proposal)for(const r of proposal.candidates){const [x,y,w,h]=r.box;o.strokeStyle='#f2b252';o.lineWidth=Math.max(3,off.width/350);o.setLineDash([12,8]);o.strokeRect(x/1000*off.width,y/1000*off.height,w/1000*off.width,h/1000*off.height);o.setLineDash([]);}
 const a=document.createElement('a');a.download='mopec_annotated.png';a.href=off.toDataURL('image/png');a.click();
};
const overlay=$('#overlay');overlay.addEventListener('change',()=>{regions.style.display=overlay.checked?'':'none';regionCanvas.style.display=overlay.checked?'':'none'});
$('#help').onclick=()=>{$('#drawer').classList.add('open');$('#history').insertAdjacentHTML('beforeend','<div class="message">Open a specimen from <strong>Library</strong>, choose <strong>Analyze</strong> for tissue isolation and AI proposals, click any finding to outline similar pixels, then record the PA review. Use Clippy for image questions and SOP retrieval.</div>')};
loadCatalog();setTimeout(positionRegions,450);
})();

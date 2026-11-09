
(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={page:'analysis',catalog:[],guides:[],caseId:'',caseName:'',organ:'',source:'',license:'',sourceUrl:'',sourceType:'catalog',image:null,imageUrl:null,imageWidth:0,imageHeight:0,consent:false,analysis:null,qc:null,mask:null,tool:'move',zoom:1,panX:0,panY:0,overlay:true,strokes:[],measures:[],selected:-1,reviewDecisions:{},reviewChecks:{},reviewDecision:'',reviewer:'',notes:'',captureNotes:'',chatTurns:[],chatBusy:false,cameraStream:null,recognizer:null};
let toastTimer;const canvas=$('#viewCanvas'),ctx=canvas.getContext('2d',{alpha:false});
let dimensions={scale:1,cx:0,cy:0},pointer=null;
function toast(msg){const el=$('#toast');el.textContent=String(msg);el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),4500);}
function nav(name){S.page=name;$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+name));if(name==='analysis')requestAnimationFrame(resizeCanvas);if(name==='review')window.Mopec.renderReview?.();if(name==='library')renderLibrary();if(name==='guidance')window.Mopec.renderGuides?.();if(name==='cases')renderQueue();}
function step(n){for(let i=1;i<=4;i++){const el=$('#step'+i);el.classList.toggle('done',i<n);el.classList.toggle('current',i===n);}}
function caseMeta(){return{id:S.caseId,name:S.caseName,organ:S.organ,source:S.source,source_url:S.sourceUrl,license:S.license,source_type:S.sourceType};}
function setTitle(){ $('#caseTitle').textContent=S.caseName||'Select a specimen';$('#caseSubtitle').textContent=S.image?((S.organ||'Unknown organ')+' · '+(S.source||'Imported image')+' · '+(S.license||'Check rights')):'Open a public specimen or approved image.';$('#caseKicker').textContent='SPECIMEN REVIEW · '+(S.caseId||'NO ACTIVE CASE');$('#viewerBadge').textContent=S.image?(S.caseId||'Imported'):'No image selected';$('#imageInfo').textContent=S.image?(S.imageWidth+' × '+S.imageHeight+' px · '+S.source):'No image loaded';}
function resetResults(){S.analysis=null;S.qc=null;S.mask=null;S.strokes=[];S.measures=[];S.selected=-1;S.reviewDecisions={};S.reviewChecks={};S.reviewDecision='';$('#qcStatus').textContent='QC not run';$('#qcBadge').textContent='Not assessed';$('#qcMetrics').textContent='Run image QC and AI analysis to see findings.';$('#qcTags').innerHTML='';$('#findCount').textContent='—';$('#annotCount').textContent='0';$('#analysisState').textContent='Awaiting analysis';$('#findings').innerHTML='<div class="empty-data">Run analysis to see visible-feature suggestions and review controls.</div>';$('#statusDot').className='pip';step(S.image?2:1);window.Mopec?.renderCues?.();draw();}
function remoteAllowed(){return S.sourceType==='catalog'||S.consent===true;}
function setImage(src,objectUrl){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{if(S.imageUrl)URL.revokeObjectURL(S.imageUrl);S.image=image;S.imageUrl=objectUrl||null;S.imageWidth=image.naturalWidth;S.imageHeight=image.naturalHeight;S.zoom=1;S.panX=0;S.panY=0;$('#canvasEmpty').classList.add('hidden');setTitle();resetResults();resizeCanvas();renderQueue();resolve()};image.onerror=()=>reject(Error('Could not open image. Try another specimen or a local JPEG, PNG or WebP.'));image.src=src;});}
async function loadSpecimen(item){
 if(!item)return;toast('Opening '+item.name+'…');
 try{const r=await fetch('/api/specimen?id='+encodeURIComponent(item.id),{cache:'force-cache'});if(!r.ok)throw Error('Reference image is unavailable (HTTP '+r.status+').');
 const blob=await r.blob();if(!blob.type.startsWith('image/'))throw Error('Source was not an image.');const url=URL.createObjectURL(blob);
 await setImage(url,url);S.caseId=item.id;S.caseName=item.name;S.organ=item.organ||'';S.source=item.origin||'Reference image';S.sourceUrl=item.url||'';S.license=item.license||'See source';S.sourceType='catalog';S.consent=true;setTitle();resetResults();renderSelect();renderQueue();nav('analysis');toast('Opened '+item.name);return true;
 }catch(e){toast(e.message||'Could not load source');return false;}}
async function importFile(file,sourceType){
 if(!file)return false;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>30e6){toast('Choose a JPEG, PNG or WebP under 30 MB.');return false}
 const url=URL.createObjectURL(file);try{await setImage(url,url);S.caseId='DEMO-IMPORT';S.caseName=file.name.replace(/\.[^.]+$/,'').slice(0,80)||'Imported specimen';S.organ='Unverified';S.source='User-provided image';S.sourceUrl='';S.license='Permission unverified';S.sourceType=sourceType||'import';S.consent=$('#publicConsent').checked;setTitle();resetResults();renderSelect();renderQueue();nav('analysis');toast('Image opened. Confirm permission in Capture before cloud AI.');return true}catch(e){URL.revokeObjectURL(url);toast(e.message);return false}}
function renderSelect(){const x=$('#caseSelect');x.innerHTML='';if(S.image&&S.sourceType!=='catalog'){const o=new Option(S.caseName,'local');x.add(o)}for(const c of S.catalog)x.add(new Option(c.organ+' · '+c.name,c.id));if(S.caseId)x.value=S.sourceType==='catalog'?S.caseId:'local';}
function renderQueue(){const x=$('#caseQueue');x.innerHTML='';const rows=S.catalog.map(c=>({id:c.id,name:c.name,organ:c.organ,source:c.origin,status:c.id===S.caseId?(S.reviewDecision|| (S.analysis?'Under review':'Selected')):'Available'}));if(S.image&&S.sourceType!=='catalog')rows.unshift({id:'local',name:S.caseName,organ:S.organ,source:'Locally imported',status:S.reviewDecision||'Pending'});$('#queueCount').textContent=rows.length+' cases';
 for(const c of rows){const line=document.createElement('div');line.className='case-line';line.tabIndex=0;line.setAttribute('role','button');line.innerHTML='<div><strong>'+safe(c.name)+'</strong><p>'+safe(c.organ)+' · '+safe(c.id)+' · '+safe(c.source)+'</p></div><span class="case-pill">'+safe(c.status)+'</span>';line.onclick=()=>c.id==='local'?nav('analysis'):loadSpecimen(S.catalog.find(z=>z.id===c.id));line.onkeydown=e=>{if(e.key==='Enter')line.click()};x.append(line)}if(!rows.length)x.innerHTML='<div class="empty-data">No public cases available. Import an image to begin.</div>';}
function renderLibrary(){
 const grid=$('#libraryGrid');grid.innerHTML='';const q=$('#libraryQuery').value.trim().toLowerCase(),filter=$('#organFilter').value;
 if(!$('#organFilter').dataset.ready){$('#organFilter').dataset.ready='1';for(const o of [...new Set(S.catalog.map(x=>x.organ))].sort())$('#organFilter').add(new Option(o,o))}
 const arr=S.catalog.filter(c=>(!filter||c.organ===filter)&&(!q||(c.organ+' '+c.name+' '+c.group).toLowerCase().includes(q)));
 for(const c of arr){const el=document.createElement('article');el.className='spec-card';el.innerHTML='<img loading="lazy" alt="'+safe(c.name)+' gross specimen"><div class="spec-content"><span class="eyebrow">'+safe(c.organ)+' · '+safe(c.group)+'</span><h3>'+safe(c.name)+'</h3><small>'+safe(c.origin)+' · '+safe(c.license)+'</small><div class="actions"><button type="button" class="btn small primary">Open</button><a target="_blank" rel="noopener noreferrer" href="'+safe(c.url)+'">Source ↗</a></div></div>';
 el.querySelector('img').src='/api/specimen?id='+encodeURIComponent(c.id);el.querySelector('button').onclick=()=>loadSpecimen(c);grid.append(el)}
 if(!arr.length)grid.innerHTML='<div class="empty-data">No matching specimens.</div>';
}
async function loadCatalog(){try{const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)throw Error('Catalog unavailable');const arr=await r.json();S.catalog=Array.isArray(arr)?arr.filter(c=>c?.id&&c?.name&&c?.url):[];renderSelect();renderQueue();renderLibrary();const first=S.catalog.find(c=>c.id==='kidney-cysts')||S.catalog[0];if(first)loadSpecimen(first);}catch(e){toast('Public image library unavailable. Local image import still works.');renderQueue();}}
function fit(){if(!S.image)return{scale:1,w:0,h:0};const scale=Math.min(canvas.width*.91/S.imageWidth,canvas.height*.91/S.imageHeight)*S.zoom;return{scale,w:S.imageWidth*scale,h:S.imageHeight*scale};}
function resizeCanvas(){const r=canvas.getBoundingClientRect();if(r.width<4||r.height<4)return;const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);draw();}
function toCanvas(x,y){return {x:dimensions.cx+(x-S.imageWidth/2)*dimensions.scale,y:dimensions.cy+(y-S.imageHeight/2)*dimensions.scale};}
function toImage(x,y){return{x:(x-dimensions.cx)/dimensions.scale+S.imageWidth/2,y:(y-dimensions.cy)/dimensions.scale+S.imageHeight/2};}
function eventPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
function draw(){
 if(!canvas.width)return;ctx.fillStyle='#17222c';ctx.fillRect(0,0,canvas.width,canvas.height);if(!S.image)return;
 const f=fit();dimensions={cx:canvas.width/2+S.panX,cy:canvas.height/2+S.panY,scale:f.scale};
 const tl=toCanvas(0,0);ctx.drawImage(S.image,tl.x,tl.y,f.w,f.h);
 if(S.overlay){
  if(S.mask){ctx.save();ctx.globalAlpha=.84;ctx.drawImage(S.mask,tl.x,tl.y,f.w,f.h);ctx.restore()}
  (S.analysis?.candidates||[]).forEach((c,i)=>{const b=c.box;if(!Array.isArray(b)||b.length!==4)return;const p=toCanvas(b[0]/1000*S.imageWidth,b[1]/1000*S.imageHeight);ctx.save();ctx.strokeStyle=i===S.selected?'#ffd36e':'#5de5db';ctx.lineWidth=i===S.selected?3:2;ctx.setLineDash([9,6]);ctx.strokeRect(p.x,p.y,b[2]/1000*S.imageWidth*f.scale,b[3]/1000*S.imageHeight*f.scale);ctx.setLineDash([]);const label='F'+(i+1)+' · '+String(c.label||'Region').slice(0,22);ctx.font='13px sans-serif';let tw=ctx.measureText(label).width+13;ctx.fillStyle='#257c83';ctx.fillRect(p.x,p.y-22,tw,21);ctx.fillStyle='#fff';ctx.fillText(label,p.x+6,p.y-7);ctx.restore();});
  for(const s of S.strokes){if(!s.points.length)continue;ctx.beginPath();s.points.forEach((p,i)=>{const xy=toCanvas(p.x*S.imageWidth,p.y*S.imageHeight);i?ctx.lineTo(xy.x,xy.y):ctx.moveTo(xy.x,xy.y)});ctx.lineWidth=s.width;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=s.mode==='erase'?.65:1;ctx.strokeStyle=s.mode==='erase'?'#fff':s.color;ctx.stroke();ctx.globalAlpha=1}
 }
 for(const m of S.measures){const a=toCanvas(m.a.x*S.imageWidth,m.a.y*S.imageHeight),b=toCanvas(m.b.x*S.imageWidth,m.b.y*S.imageHeight);ctx.strokeStyle='#ffd36e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle='#ffd36e';ctx.font='12px sans-serif';ctx.fillText(Math.round(m.pixels)+' px', (a.x+b.x)/2,(a.y+b.y)/2-9);}
}
function tool(name){S.tool=name;$$('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===name));canvas.style.cursor=name==='move'?'grab':'crosshair';}
function zoom(factor){S.zoom=clamp(S.zoom*factor,.25,7);$('#zoomPct').textContent=Math.round(S.zoom*100)+'%';draw()}
function selectAt(p){const list=S.analysis?.candidates||[];for(let i=list.length-1;i>=0;i--){const b=list[i].box||[];const x=1000*p.x/S.imageWidth,y=1000*p.y/S.imageHeight;if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3])return i;}return -1}
function registerViewer(){
 new ResizeObserver(()=>{if(S.page==='analysis')resizeCanvas()}).observe($('#viewer'));window.addEventListener('resize',resizeCanvas);
 $$('[data-tool]').forEach(b=>b.onclick=()=>tool(b.dataset.tool));$('#overlayToggle').onchange=e=>{S.overlay=e.target.checked;draw()};$('#zoomIn').onclick=()=>zoom(1.25);$('#zoomOut').onclick=()=>zoom(.8);
 $('#zoomPct').onclick=()=>{S.zoom=1;S.panX=0;S.panY=0;$('#zoomPct').textContent='Fit';draw()};$('#resetView').onclick=()=>$('#zoomPct').click();
 canvas.addEventListener('wheel',e=>{if(S.image){e.preventDefault();zoom(e.deltaY<0?1.12:.89)}},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(!S.image||e.button!==0)return;const mouse=eventPoint(e),pos=toImage(mouse.x,mouse.y),norm={x:clamp(pos.x/S.imageWidth,0,1),y:clamp(pos.y/S.imageHeight,0,1)};
 if(S.tool==='move'&&S.overlay){const i=selectAt(pos);if(i!==-1){S.selected=i;window.Mopec.renderFindings?.();draw();toast('Selected feature F'+(i+1));return}}
 canvas.setPointerCapture(e.pointerId);pointer={tool:S.tool,last:mouse,start:norm,stroke:null};
 if(['brush','erase'].includes(S.tool)){pointer.stroke={mode:S.tool,points:[norm],width:S.tool==='erase'?17:8,color:'#ffcb6e'};S.strokes.push(pointer.stroke);$('#annotCount').textContent=S.strokes.length+S.measures.length;draw()}
 });
 canvas.addEventListener('pointermove',e=>{if(!pointer||!S.image)return;const mouse=eventPoint(e);
 if(pointer.tool==='move'){S.panX+=mouse.x-pointer.last.x;S.panY+=mouse.y-pointer.last.y;pointer.last=mouse;draw()}
 if(pointer.stroke){const p=toImage(mouse.x,mouse.y);pointer.stroke.points.push({x:clamp(p.x/S.imageWidth,0,1),y:clamp(p.y/S.imageHeight,0,1)});draw()}
 });
 canvas.addEventListener('pointerup',e=>{if(!pointer||!S.image)return;if(pointer.tool==='measure'){const pos=toImage(eventPoint(e).x,eventPoint(e).y),b={x:clamp(pos.x/S.imageWidth,0,1),y:clamp(pos.y/S.imageHeight,0,1)},a=pointer.start,len=Math.hypot((a.x-b.x)*S.imageWidth,(a.y-b.y)*S.imageHeight);if(len>3){S.measures.push({a,b,pixels:len});$('#annotCount').textContent=S.strokes.length+S.measures.length;toast('Distance '+Math.round(len)+' px. Calibrate a scale before converting to mm.');draw()}}pointer=null;});
 }
function blobDownload(content,type,filename){const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename.replace(/[^a-z0-9._-]/gi,'_');a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);}
function exportImage(){if(!S.image){toast('Open an image first');return}const c=document.createElement('canvas');c.width=S.imageWidth;c.height=S.imageHeight;const g=c.getContext('2d');g.drawImage(S.image,0,0);
 if(S.overlay)(S.analysis?.candidates||[]).forEach(f=>{const b=f.box||[];if(b.length!==4)return;g.strokeStyle='#56d8d2';g.lineWidth=Math.max(3,S.imageWidth/350);g.strokeRect(b[0]/1000*c.width,b[1]/1000*c.height,b[2]/1000*c.width,b[3]/1000*c.height)});
 c.toBlob(blob=>{if(blob)blobDownload(blob,'image/png',(S.caseId||'DEMO')+'-annotated.png')},'image/png');}
function initCore(){
 $$('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
 $('#caseSelect').onchange=e=>{const c=S.catalog.find(x=>x.id===e.target.value);if(c)loadSpecimen(c)};
 const picker=$('#filePicker');picker.onchange=e=>{importFile(e.target.files?.[0]);e.target.value=''};
 for(const id of ['importTop','libraryImport'])$('#'+id).onclick=()=>picker.click();
 $('#libraryQuery').oninput=renderLibrary;$('#organFilter').onchange=renderLibrary;
 $('#newCase').onclick=()=>{S.caseId='DEMO-0001';S.caseName='Synthetic accession';S.organ='Unverified';S.source='Synthetic case';S.sourceType='import';S.consent=false;S.image=null;setTitle();resetResults();$('#canvasEmpty').classList.remove('hidden');renderSelect();nav('capture');toast('Synthetic case created. Open an authorized image to analyze.')};
 $('#imageExport').onclick=exportImage;
 $('#themeBtn').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('mopec-theme',document.body.classList.contains('dark')?'dark':'light')}catch{}draw()};
 try{if(localStorage.getItem('mopec-theme')==='dark')document.body.classList.add('dark')}catch{}
 registerViewer();setTitle();resizeCanvas();loadCatalog();
}
window.Mopec={S,$,$$,safe,toast,nav,step,caseMeta,setTitle,resetResults,remoteAllowed,setImage,loadSpecimen,importFile,renderSelect,renderQueue,renderLibrary,resizeCanvas,draw,tool,blobDownload,initCore};
})();

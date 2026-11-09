
/* LTU/Mopec v11 — calibrated measurement, polygon labeling, QA, and mask validation */
(()=>{'use strict';
const M=window.Mopec;if(!M)return;const S=M.S,$=M.$,safe=M.safe,toast=M.toast;
const cv=$('#viewCanvas');let polygon=[],hover=null,gt=null,gtShow=false;
const css='';const get=(id)=>document.getElementById(id);
const count=(n)=>Number.isFinite(n)?Math.round(n):0;
function mmText(pixels){return S.mmPerPixel>0?(pixels*S.mmPerPixel).toFixed(2)+' mm':count(pixels)+' px';}
function labelScale(){
 const scale=get('calibrationState');if(scale)scale.textContent=S.mmPerPixel>0?'Scale · '+S.mmPerPixel.toFixed(5)+' mm/px (PA-entered)':'Uncalibrated · pixels only';
 if(get('calibrationInfo'))get('calibrationInfo').textContent=S.mmPerPixel>0?'Based on the last manually drawn ruler line; check against the original scale.':'Measure a visible calibration span, then enter its verified physical length.';
}
function drawExtensions(ctx,opt){
 const tl=opt.toCanvas(0,0),w=S.imageWidth*opt.scale,h=S.imageHeight*opt.scale;
 if(gt?.overlay && gtShow && S.overlay){ctx.save();ctx.globalAlpha=.5;ctx.drawImage(gt.overlay,tl.x,tl.y,w,h);ctx.restore();}
 function path(points,close,color,fill){
  if(!points?.length)return;ctx.save();ctx.beginPath();
  points.forEach((p,i)=>{let xy=opt.toCanvas(p.x*S.imageWidth,p.y*S.imageHeight);i?ctx.lineTo(xy.x,xy.y):ctx.moveTo(xy.x,xy.y)});
  if(close){ctx.closePath();ctx.fillStyle=fill||'#f1b55b22';ctx.fill();}
  ctx.strokeStyle=color||'#e2c979';ctx.lineWidth=2.3;ctx.setLineDash(close?[]:[7,5]);ctx.stroke();ctx.restore();
 }
 if(S.overlay){
  for(const r of (S.polygons||[]))path(r.points,true,r.color||'#ffbf68','#efb8502b');
  if(polygon.length){path(polygon,false,'#ffd87c');if(hover){
   const a=opt.toCanvas(polygon.at(-1).x*S.imageWidth,polygon.at(-1).y*S.imageHeight);
   const b=opt.toCanvas(hover.x*S.imageWidth,hover.y*S.imageHeight);ctx.save();ctx.strokeStyle='#ffd87c';ctx.lineWidth=1.4;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
  }}
 }
 if(S.comparisonPrediction?.candidates?.length && S.overlay){ctx.save();ctx.strokeStyle='#d692ff';ctx.lineWidth=2;ctx.setLineDash([5,4]);S.comparisonPrediction.candidates.forEach((c,i)=>{const [x,y,bw,bh]=c.box||[];if(![x,y,bw,bh].every(Number.isFinite))return;const p=opt.toCanvas(x/1000*S.imageWidth,y/1000*S.imageHeight);ctx.strokeRect(p.x,p.y,bw/1000*S.imageWidth*opt.scale,bh/1000*S.imageHeight*opt.scale);if(i<10){ctx.font='bold 12px system-ui';ctx.fillStyle='#e4b5ff';ctx.fillText('B'+(i+1),p.x+2,p.y+14);}});ctx.restore();}
 if(S.compareMode){
  // Repaint the original photograph over the left-hand portion, preserving analysis on the right.
  ctx.save();const boundary=ctx.canvas.width*(S.compareSplit??50)/100;
  ctx.beginPath();ctx.rect(0,0,boundary,ctx.canvas.height);ctx.clip();
  ctx.drawImage(S.image,tl.x,tl.y,w,h);ctx.restore();
  ctx.save();ctx.beginPath();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.moveTo(boundary,0);ctx.lineTo(boundary,ctx.canvas.height);ctx.stroke();
  ctx.fillStyle='#ffffffdb';ctx.font='bold 12px system-ui';ctx.fillText('ORIGINAL',12,22);ctx.fillText('ANNOTATED',Math.max(boundary+10,ctx.canvas.width-95),22);ctx.restore();
 }
}
function imagePoint(event){
 const rect=cv.getBoundingClientRect();if(!rect.width||!S.imageWidth)return null;
 const mx=(event.clientX-rect.left)*cv.width/rect.width,my=(event.clientY-rect.top)*cv.height/rect.height;
 const scale=Math.min(cv.width*.91/S.imageWidth,cv.height*.91/S.imageHeight)*S.zoom;
 return {x:Math.min(1,Math.max(0,((mx-cv.width/2-S.panX)/scale+S.imageWidth/2)/S.imageWidth)),
         y:Math.min(1,Math.max(0,((my-cv.height/2-S.panY)/scale+S.imageHeight/2)/S.imageHeight))};
}
function finishPolygon(){
 if(polygon.length<3){toast('Choose at least three distinct points to close a polygon.');return;}
 const id='P'+((S.polygons||[]).length+1);
 S.polygons.push({id,label:'Manual region '+id,points:polygon.map(p=>({...p})),source:'human-drawn gross-image annotation',review:'Not reviewed',color:'#ffc775'});
 polygon=[];hover=null;M.draw();renderPolygons();toast('Polygon '+id+' saved as an editable research annotation.');M.tool('move');
}
function resetPolygon(){polygon=[];hover=null;M.draw();}
function canvasDown(e){
 if(S.tool!=='polygon'||!S.image||e.button!==0)return;
 e.preventDefault();e.stopImmediatePropagation();
 const point=imagePoint(e);if(!point)return;
 if(e.detail>=2){if(polygon.length>=3)finishPolygon();return;}
 if(polygon.length && Math.hypot(point.x-polygon[0].x,point.y-polygon[0].y)*Math.min(S.imageWidth,S.imageHeight)<13&&polygon.length>=3){finishPolygon();return;}
 polygon.push(point);hover=null;M.draw();
}
function canvasMove(e){if(S.tool==='polygon'&&polygon.length){hover=imagePoint(e);M.draw();}}
function renderPolygons(){
 const el=get('polygonRows');if(!el)return;el.innerHTML='';
 for(const p of (S.polygons||[])){
  const d=document.createElement('div');d.className='v11-poly-row';
  const name=document.createElement('input');name.value=p.label;name.maxLength=70;name.setAttribute('aria-label','Annotation label');name.oninput=()=>p.label=name.value.slice(0,70);
  const status=document.createElement('select');status.setAttribute('aria-label','Annotation review');['Not reviewed','Accepted','Edited','Rejected'].forEach(x=>status.add(new Option(x,x)));status.value=p.review;status.onchange=()=>{p.review=status.value;renderReadiness();};
  const del=document.createElement('button');del.type='button';del.textContent='Delete';del.className='btn small';del.onclick=()=>{S.polygons=S.polygons.filter(r=>r!==p);renderPolygons();M.draw();};
  d.append(name,status,del);el.append(d);
 }
 if(!S.polygons?.length)el.textContent='No manual regions. Select Polygon and click points around a visible feature.';
 get('polygonCount').textContent=(S.polygons||[]).length+' manual regions';
 renderReadiness();
}
function calibrate(){
 const ruler=S.measures?.at(-1),distance=Number(get('knownMm').value);
 if(!ruler||ruler.pixels<=2){toast('Use the Measure tool to draw a line across a known scale span first.');return;}
 if(!Number.isFinite(distance)||distance<=0||distance>10000){toast('Enter a positive verified physical length in millimeters.');return;}
 S.mmPerPixel=distance/ruler.pixels;S.calibration={mm_per_pixel:S.mmPerPixel,known_mm:distance,source:'PA-entered reference; not automatically verified',reference_line_pixels:ruler.pixels};
 labelScale();M.draw();toast('Pixel measurements converted using your verified ruler entry.');renderReadiness();
}
function qca(){
 if(!S.qc){toast('Run Analyze image first to perform image-quality screening.');M.nav('analysis');return;}
 if(S.qc.flags?.length && !get('qcReviewNote').value.trim()){toast('Image QC has flags; record a reviewer note before acknowledging.');get('qcReviewNote').focus();return;}
 S.qcAcknowledged=true;S.qcReviewNote=get('qcReviewNote').value.trim().slice(0,350);get('qcReviewBadge').textContent='Reviewed by operator';
 renderReadiness();toast('Image QC marked reviewed; heuristic screening is not a clinical approval.');
}
function qccheck(){
 const items=['Complete specimen overview','Orientation and laterality (if applicable)','Reference ruler / physical scale','Detailed photograph of region of interest','Specimen-to-case identity cross-check'];
 const root=get('viewChecks');root.innerHTML='';
 for(let i=0;i<items.length;i++){
  const row=document.createElement('label');row.className='v11-checkrow';
  const check=document.createElement('input');check.type='checkbox';check.checked=!!S.viewChecks?.[i];check.onchange=()=>{S.viewChecks[i]=check.checked;renderReadiness();};
  const span=document.createElement('span');span.textContent=items[i];row.append(check,span);root.append(row);
 }
}
function renderReadiness(){
 if(!get('readiness'))return;
 let checks=[];
 checks.push({name:'Image loaded',ok:!!S.image});
 checks.push({name:'Image QC reviewed',ok:!!S.qcAcknowledged});
 checks.push({name:'AI feature proposals reviewed',ok:!!S.analysis&&(!(S.analysis.candidates||[]).length||(S.analysis.candidates||[]).every((_,i)=>Boolean(S.reviewDecisions[i])))});
 checks.push({name:'PA final decision',ok:!!S.reviewDecision});
 const remaining=checks.filter(x=>!x.ok).length;
 get('readiness').innerHTML=checks.map(x=>'<span class="v11-ready '+(x.ok?'done':'pending')+'">'+(x.ok?'✓ ':'○ ')+safe(x.name)+'</span>').join('')+'<span class="v11-ready-total">'+(remaining?' '+remaining+' pending':' Ready for export')+'</span>';
 const covered=Object.values(S.viewChecks||{}).filter(Boolean).length;
 if(get('viewCount'))get('viewCount').textContent=covered+' / 5 confirmed';
}
function changeCase(){
 polygon=[];hover=null;gt=null;gtShow=false;
 S.polygons=[];S.mmPerPixel=null;S.calibration=null;S.qcAcknowledged=false;S.qcReviewNote='';S.viewChecks={};S.compareMode=false;S.compareSplit=50;S.maskValidation=null;
 if(get('knownMm'))get('knownMm').value='';
 if(get('qcReviewNote'))get('qcReviewNote').value='';
 if(get('qcReviewBadge'))get('qcReviewBadge').textContent='Pending';
 if(get('maskResult'))get('maskResult').textContent='No paired reference mask loaded.';
 if(get('compareMode'))get('compareMode').checked=false;
 if(get('compareSplit'))get('compareSplit').value=50;
 if(get('gtOverlay'))get('gtOverlay').checked=false;
 labelScale();renderPolygons();qccheck();renderReadiness();M.draw();
}
async function maskInput(file){
 if(!S.image)return toast('Open an image first.');
 if(!file||file.type!=='image/png'||file.size>30e6)return toast('Select a PNG reference mask under 30 MB.');
 const url=URL.createObjectURL(file),img=new Image();
 try{
  img.src=url;await img.decode();
  if(img.naturalWidth!==S.imageWidth||img.naturalHeight!==S.imageHeight)return toast('Reference mask dimensions must exactly match the source photograph.');
  const d=512,scale=Math.min(1,d/Math.max(S.imageWidth,S.imageHeight)),w=Math.max(1,Math.round(S.imageWidth*scale)),h=Math.max(1,Math.round(S.imageHeight*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0,w,h);
  const dat=context.getImageData(0,0,w,h),arr=dat.data;let hasTransparent=false;
  for(let i=3;i<arr.length;i+=4){if(arr[i]<250){hasTransparent=true;break;}}
  const overlay=document.createElement('canvas');overlay.width=w;overlay.height=h;const maskPixels=new Uint8Array(w*h);
  const maskData=overlay.getContext('2d').createImageData(w,h);
  for(let i=0;i<maskPixels.length;i++){
   const k=i*4,lum=.299*arr[k]+.587*arr[k+1]+.114*arr[k+2],inside=hasTransparent?arr[k+3]>100:lum>127;
   maskPixels[i]=inside?1:0;
   if(inside){maskData.data[k]=255;maskData.data[k+1]=100;maskData.data[k+2]=85;maskData.data[k+3]=145;}
  }
  overlay.getContext('2d').putImageData(maskData,0,0);
  gt={name:file.name,w,h,pixels:maskPixels,overlay,verified:false};S.gtMask={name:file.name,width:w,height:h,paired:true,review_status:'Reference supplied by user; expert status unverified'};
  get('maskResult').textContent='Paired mask loaded ('+file.name+'). Results require polygon annotation and expert-provenance verification.';
  if(get('gtOverlay'))get('gtOverlay').checked=true;gtShow=true;M.draw();validateMask();
 }catch(e){toast('Could not read reference PNG mask.');}
 finally{URL.revokeObjectURL(url);}
}
function validateMask(){
 if(!gt||!S.image)return;
 const w=gt.w,h=gt.h,pred=document.createElement('canvas');pred.width=w;pred.height=h;const ctx=pred.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';
 for(const region of S.polygons||[]){if(region.review==='Rejected'||region.points.length<3)continue;
  ctx.beginPath();region.points.forEach((p,i)=>i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h));ctx.closePath();ctx.fill();}
 const data=ctx.getImageData(0,0,w,h).data;
 let intersection=0,union=0,positive=0,reference=0;
 for(let i=0;i<gt.pixels.length;i++){const a=data[i*4+3]>127&&data[i*4]>127,b=gt.pixels[i]===1;if(a)positive++;if(b)reference++;if(a&&b)intersection++;if(a||b)union++;}
 const dice=positive+reference?2*intersection/(positive+reference):null,iou=union?intersection/union:null;
 S.maskValidation={method:'Human polygon vs uploaded paired PNG mask; 512-px approximate raster',source:gt.name,dice,iou,predicted_pixels:positive,reference_pixels:reference,reference_expert_status:'unverified'};
 get('maskResult').innerHTML='Manual polygons vs supplied mask: <strong>Dice '+(dice==null?'N/A':dice.toFixed(3))+'</strong> · <strong>IoU '+(iou==null?'N/A':iou.toFixed(3))+'</strong><small> These are overlap metrics for the user-drawn regions, NOT a trained AI model.</small>';
}
function exportExtra(){return{calibration:S.calibration||null,manual_polygons:S.polygons||[],image_completeness:S.viewChecks||{},qc_operator_review:{acknowledged:!!S.qcAcknowledged,note:S.qcReviewNote||''},reference_mask_comparison:S.maskValidation||null,context:'Operator review / development prototype. No patient data retained.'};}
function init(){
 const row=document.querySelector('.toolrow');
 if(row&&!get('polygonTool')){
  const button=document.createElement('button');button.id='polygonTool';button.className='btn';button.type='button';button.dataset.tool='polygon';button.textContent='Polygon';
  const before=row.querySelector('[data-tool="measure"]');before.before(button);button.onclick=()=>{M.tool('polygon');toast('Click the outline points; double-click or Finish to close. Esc cancels.');};
  const finish=document.createElement('button');finish.type='button';finish.className='btn';finish.id='finishPoly';finish.textContent='Finish polygon';finish.onclick=finishPolygon;
  button.after(finish);
 }
 const area=document.querySelector('#page-analysis .analysis-area');
 const section=document.createElement('details');section.className='v11-panel';section.open=false;section.innerHTML=
  '<summary>Annotation &amp; measurement tools <span id="polygonCount">0 manual regions</span></summary>'+
  '<div class="v11-grid">'+
  '<div><h3>Calibrated measurements</h3><p>Use Measure on the viewer to span a known ruler distance.</p><div class="v11-inline"><input id="knownMm" type="number" min=".01" max="10000" step=".01" placeholder="Verified span (mm)" aria-label="Known ruler length in millimeters"><button id="calibrateBtn" class="btn small">Set scale</button></div><p id="calibrationState" class="v11-mini">Uncalibrated · pixels only</p><p id="calibrationInfo" class="v11-mini"></p></div>'+
  '<div><h3>Overlay comparison</h3><label class="v11-checkrow"><input type="checkbox" id="compareMode"> Original vs annotated</label><input id="compareSplit" type="range" min="10" max="90" value="50" aria-label="Comparison divider" style="width:100%"><p class="v11-mini">Left: original · Right: outlines, masks and reviewer annotations</p></div></div>'+
  '<h3>Human-drawn polygon regions</h3><div id="polygonRows" class="v11-polyrows"></div>';
 area.append(section);
 get('calibrateBtn').onclick=calibrate;get('compareMode').onchange=e=>{S.compareMode=e.target.checked;M.draw();};
 get('compareSplit').oninput=e=>{S.compareSplit=Number(e.target.value);M.draw();};
 const review=$('#page-review');
 const gate=document.createElement('section');gate.className='panel v11-panel';gate.innerHTML=
  '<div class="section-head"><div><h2>Image QA and completeness</h2><p class="v11-mini">Reviewer verifies technical quality and required views before using results.</p></div><span id="qcReviewBadge" class="case-pill">Pending</span></div>'+
  '<div class="v11-grid"><div><h3>Operator QC acknowledgment</h3><p class="v11-mini">The automated screen is a heuristic, not a release decision.</p><textarea rows="2" id="qcReviewNote" placeholder="Record any image-quality concern or rationale (required if QC flags exist)."></textarea><button class="btn small" id="qcReviewBtn">Mark image QC reviewed</button></div>'+
  '<div><h3>Image-view completeness <span id="viewCount">0 / 5 confirmed</span></h3><div id="viewChecks"></div></div></div>'+
  '<div class="v11-readiness"><h3>Review readiness</h3><div id="readiness"></div></div>';
 const study=review.querySelector('.sponsor-study');if(study)study.before(gate);else review.append(gate);
 get('qcReviewBtn').onclick=qca;
 const models=$('#page-models');const validation=document.createElement('section');validation.className='panel v11-panel';
 validation.innerHTML='<div class="section-head"><h2>Ground-truth segmentation validation</h2><span class="case-pill">Local research only</span></div><p class="v11-mini">Load an aligned binary PNG mask with the exact native image dimensions. Compare only human-drawn polygons, never unverified model boxes. Files stay in this browser.</p><div class="v11-inline"><input type="file" id="gtFile" accept="image/png" aria-label="Upload expert reference mask"><label class="v11-checkrow"><input id="gtOverlay" type="checkbox"> Show mask overlay</label><button id="compareMasks" class="btn small">Calculate overlap</button></div><div id="maskResult" class="v11-result">No paired reference mask loaded.</div><p class="v11-mini">Dice and IoU measure overlap, not diagnosis accuracy. Expert provenance must be established separately.</p>';
 models.append(validation);
 get('gtFile').onchange=e=>maskInput(e.target.files[0]);get('gtOverlay').onchange=e=>{gtShow=!!e.target.checked;M.draw();};
 get('compareMasks').onclick=validateMask;
 cv.addEventListener('pointerdown',canvasDown,true);cv.addEventListener('pointermove',canvasMove,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.tool==='polygon'&&polygon.length){resetPolygon();return;}if(e.key==='Enter'&&S.tool==='polygon'&&polygon.length>=3&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){finishPolygon();}});
 window.addEventListener('mopec:case-changed',changeCase);
 document.addEventListener('click',e=>{if(e.target.closest('[data-decide],[data-case-decision]'))queueMicrotask(renderReadiness);});
 M.renderExtensions=drawExtensions;M.exportAdditions=exportExtra;M.finishPolygon=finishPolygon;M.validateManualMask=validateMask;
 S.polygons=S.polygons||[];S.mmPerPixel=S.mmPerPixel||null;S.viewChecks=S.viewChecks||{};
 qccheck();labelScale();renderPolygons();renderReadiness();M.draw();
}
M.initImaging=init;
})();

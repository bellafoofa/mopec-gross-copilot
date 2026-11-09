
/* v11.1: browser-local connected color region growing. NOT a validated pathology segmentation model. */
(()=>{'use strict';
const M=window.Mopec;if(!M)return;const S=M.S,$=M.$,safe=M.safe,toast=M.toast;
let lastSeed=null,preview=null,debounce=null;
const cap=n=>Math.max(0,Math.min(1,n));
function imagePoint(e){
 const canvas=$('#viewCanvas'),rect=canvas.getBoundingClientRect();if(!S.image||!rect.width)return null;
 const scale=Math.min(canvas.width*.91/S.imageWidth,canvas.height*.91/S.imageHeight)*S.zoom;
 const x=((e.clientX-rect.left)*canvas.width/rect.width-canvas.width/2-S.panX)/scale+S.imageWidth/2;
 const y=((e.clientY-rect.top)*canvas.height/rect.height-canvas.height/2-S.panY)/scale+S.imageHeight/2;
 return {x:cap(x/S.imageWidth),y:cap(y/S.imageHeight)};
}
function targetBox(w,h){
 const box=$('#segUseRoi')?.checked?S.analysis?.candidates?.[S.selected]?.box:null;
 if(!box)return [0,0,w,h];
 const [x,y,bw,bh]=box;
 return [Math.max(0,Math.floor(x/1000*w)),Math.max(0,Math.floor(y/1000*h)),Math.min(w,Math.ceil((x+bw)/1000*w)),Math.min(h,Math.ceil((y+bh)/1000*h))];
}
function compute(seed){
 if(!S.image||!seed)return;
 const maxEdge=640,scale=Math.min(1,maxEdge/Math.max(S.imageWidth,S.imageHeight)),w=Math.max(1,Math.round(S.imageWidth*scale)),h=Math.max(1,Math.round(S.imageHeight*scale));
 const base=document.createElement('canvas');base.width=w;base.height=h;
 const context=base.getContext('2d',{willReadFrequently:true});context.drawImage(S.image,0,0,w,h);
 const rgba=context.getImageData(0,0,w,h).data;
 const box=targetBox(w,h),[x0,y0,x1,y1]=box;let sx=Math.min(w-1,Math.floor(seed.x*w)),sy=Math.min(h-1,Math.floor(seed.y*h));
 if(sx<x0||sx>=x1||sy<y0||sy>=y1){toast('Your seed is outside the selected AI region. Turn off Limit to selected box or choose a point inside the box.');return;}
 const radius=2,avg=[0,0,0];let nseed=0;
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
  const x=sx+dx,y=sy+dy;if(x<x0||x>=x1||y<y0||y>=y1)continue;const p=4*(y*w+x);
  avg[0]+=rgba[p];avg[1]+=rgba[p+1];avg[2]+=rgba[p+2];nseed++;
 }
 if(!nseed)return;avg.forEach((_,i)=>avg[i]/=nseed);
 const threshold=Number($('#segTolerance')?.value||42),maxDiff=threshold*1.35;
 const queue=new Int32Array(w*h),visited=new Uint8Array(w*h),mask=new Uint8Array(w*h);
 let head=0,tail=1,count=0;queue[0]=sy*w+sx;visited[queue[0]]=1;
 while(head<tail){
  const idx=queue[head++],x=idx%w,y=(idx/w)|0,p=idx*4;
  const dr=rgba[p]-avg[0],dg=rgba[p+1]-avg[1],db=rgba[p+2]-avg[2],dist=Math.sqrt(dr*dr*.9+dg*dg*1.05+db*db*.85);
  if(dist>maxDiff)continue;
  mask[idx]=1;count++;
  for(const ni of [idx-1,idx+1,idx-w,idx+w]){
   if(ni<0||ni>=mask.length||visited[ni])continue;
   const nx=ni%w,ny=(ni/w)|0;
   if(nx<x0||nx>=x1||ny<y0||ny>=y1)continue;
   if(Math.abs(nx-x)+Math.abs(ny-y)!==1)continue;
   visited[ni]=1;queue[tail++]=ni;
  }
 }
 if(count===0){toast('No connected color region found near this seed.');return;}
 const display=document.createElement('canvas');display.width=w;display.height=h;
 const dc=display.getContext('2d'),data=dc.createImageData(w,h);
 const maskCanvas=document.createElement('canvas');maskCanvas.width=w;maskCanvas.height=h;
 const maskCtx=maskCanvas.getContext('2d'),binary=maskCtx.createImageData(w,h);
 for(let i=0;i<mask.length;i++){const p=i*4;if(mask[i]){data.data[p]=48;data.data[p+1]=219;data.data[p+2]=167;data.data[p+3]=112;}
  const v=mask[i]?255:0;binary.data[p]=v;binary.data[p+1]=v;binary.data[p+2]=v;binary.data[p+3]=255;}
 dc.putImageData(data,0,0);maskCtx.putImageData(binary,0,0);
 const fraction=count/((x1-x0)*(y1-y0));
 preview={canvas:display,binary:maskCanvas,mask,width:w,height:h,count,fraction,box,seed,tolerance:threshold,origin:'user-seeded connected color region growing',expert_ground_truth:false};
 S.experimentalSegmentation={method:'browser color-connected-component heuristic',seed,tolerance:threshold,mask_width:w,mask_height:h,mask_positive_pixels:count,
  roi_pixel_fraction:+(100*fraction).toFixed(2),calibrated:false,model_training_ground_truth:false,source_native_width:S.imageWidth,source_native_height:S.imageHeight,review_status:'Not reviewed'};
 $('#segStatus').innerHTML='<strong>Connected mask preview ready</strong><span> · '+(100*fraction).toFixed(1)+'% of selected search region</span> · '+w+'×'+h+' preview px';
 if(fraction>.8)$('#segNote').textContent='The mask occupies most of the search region. Reduce tolerance or move the seed to a more representative point.';
 else if(fraction<.002)$('#segNote').textContent='Only a very small pixel area was selected. Increase tolerance or move the seed.';
 else $('#segNote').textContent='Color-connected segmentation preview. Verify tissue boundaries; this is not a trained tumor detector.';
 $('#segExport').disabled=false;$('#segReview').disabled=false;
 M.draw();
}
function seeded(event){
 if(S.tool!=='seed'||!S.image||event.button!==0)return;
 event.preventDefault();event.stopImmediatePropagation();
 const p=imagePoint(event);if(!p)return;lastSeed=p;compute(p);M.tool('move');
}
function compareReference(){
 const reference=M.referenceMask?.();
 if(!reference||!preview){toast('Load a paired reference PNG and create a seed mask first.');return;}
 const {width:w,height:h,pixels:ref}=reference,{width:pw,height:ph,mask:pred}=preview;
 let intersection=0,union=0,aN=0,bN=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const ai=pred[Math.min(ph-1,Math.floor(y*ph/h))*pw+Math.min(pw-1,Math.floor(x*pw/w))]===1,bi=ref[y*w+x]===1;
  if(ai)aN++;if(bi)bN++;if(ai&&bi)intersection++;if(ai||bi)union++;
 }
 const dice=aN+bN?2*intersection/(aN+bN):null,iou=union?intersection/union:null;
 S.segmentationValidation={method:'seeded color-region mask against user-supplied paired PNG',dice,iou,source:reference.filename,
  reference_status:'expert status not independently verified',trained_model:false};
 const r=$('#segOverlap');r.innerHTML='Seed mask vs reference: <strong>Dice '+(dice===null?'N/A':dice.toFixed(3))+'</strong> · <strong>IoU '+(iou===null?'N/A':iou.toFixed(3))+'</strong><small>Measured against a user-supplied mask. Neither source validity nor medical correctness was established.</small>';
}
function exportMask(){
 if(!preview){toast('Create a mask before exporting.');return;}
 preview.binary.toBlob(blob=>{if(!blob){toast('Could not export mask PNG.');return;}
  M.blobDownload(blob,'image/png',(S.caseId||'DEMO')+'-seeded-mask-'+preview.width+'x'+preview.height+'.png');},'image/png');
 toast('Exporting normalized black/white mask at preview resolution; not native camera resolution.');
}
function acceptPreview(){
 if(!preview)return;
 S.experimentalSegmentation.review_status='Operator reviewed (not expert gold standard)';
 S.experimentalSegmentation.reviewed_at=new Date().toISOString();
 $('#segReview').textContent='Marked reviewed';
 toast('Recorded human review of experimental segmentation; do not treat as expert ground truth.');
}
function onCase(){lastSeed=null;preview=null;S.experimentalSegmentation=null;S.segmentationValidation=null;
 if($('#segStatus'))$('#segStatus').textContent='No mask generated';if($('#segOverlap'))$('#segOverlap').textContent='No mask-to-reference comparison';
 if($('#segExport'))$('#segExport').disabled=true;if($('#segReview')){$('#segReview').disabled=true;$('#segReview').textContent='Mark reviewed';}
 M.draw();
}
function init(){
 const row=$('.toolrow');if(!row||$('#seedSegment'))return;
 const seed=document.createElement('button');seed.id='seedSegment';seed.type='button';seed.className='btn';seed.dataset.tool='seed';seed.textContent='Seed mask';
 seed.title='Click within the specimen to segment connected similar-colored pixels, optionally within selected AI box.';
 const before=$('#polygonTool');before.before(seed);seed.onclick=()=>{M.tool('seed');toast('Click inside the visible region to grow an experimental color mask.');};
 const section=document.createElement('details');section.className='v11-panel';section.innerHTML='<summary>Experimental segmentation <span>Click-seeded pixel mask</span></summary>'+
  '<p>This local, color-based segmentation is a research baseline. It cannot reliably label tumors or determine invasion. Use a tissue-trained model when Mopec data become available.</p>'+
  '<div class="v11-grid"><div><h3>Segmentation controls</h3><label class="v11-checkrow"><input type="checkbox" id="segUseRoi" checked> Limit to selected AI feature box</label><div class="v11-inputrow"><label for="segTolerance">Color tolerance <span id="segToleranceValue">42</span></label><input id="segTolerance" type="range" min="12" max="90" value="42"></div><p class="v11-mini">Select Seed mask in the toolbar, then click an interior point in the photograph. Adjust tolerance to refine the connected color region.</p></div><div><h3>Preview and reviewer controls</h3><div id="segStatus" class="v11-result">No mask generated</div><p id="segNote" class="v11-mini">The result is an exploratory mask, not a validated lesion segmentation.</p><div class="v11-inline"><button id="segExport" class="btn small" disabled>Export mask PNG</button><button id="segReview" class="btn small" disabled>Mark reviewed</button><button id="segCompare" class="btn small">Compare reference</button></div><div id="segOverlap" class="v11-mini">No mask-to-reference comparison</div></div></div>';
 const original=$('#page-analysis .analysis-area .v11-panel');if(original)original.after(section);else $('#page-analysis .analysis-area').append(section);
 $('#segTolerance').oninput=e=>{const n=Number(e.target.value);$('#segToleranceValue').textContent=n;clearTimeout(debounce);if(lastSeed)debounce=setTimeout(()=>compute(lastSeed),180);};
 $('#segUseRoi').onchange=()=>{if(lastSeed)compute(lastSeed);};
 $('#segExport').onclick=exportMask;$('#segReview').onclick=acceptPreview;$('#segCompare').onclick=compareReference;
 $('#viewCanvas').addEventListener('pointerdown',seeded,true);
 const oldRender=M.renderExtensions;
 M.renderExtensions=(ctx,opt)=>{
  if(S.overlay&&preview){const tl=opt.toCanvas(0,0);ctx.save();ctx.globalAlpha=.66;ctx.drawImage(preview.canvas,tl.x,tl.y,S.imageWidth*opt.scale,S.imageHeight*opt.scale);ctx.restore();}
  oldRender?.(ctx,opt);
 };
 const originalExport=M.exportAdditions;M.exportAdditions=()=>({...originalExport?.(),experimental_segmentation:S.experimentalSegmentation||null,seed_mask_validation:S.segmentationValidation||null});
 M.exportSeedMask=exportMask;
 window.addEventListener('mopec:case-changed',onCase);
}
M.initSegmentation=init;
})();

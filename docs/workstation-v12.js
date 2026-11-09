
/* Mopec v12 — focused case context and hands-free research workflow.
 * Keeps patient identifiers out of this public prototype.
 * The active model remains Groq until Mopec supplies approved alternatives.
 */
(()=>{'use strict';
const M=window.Mopec;if(!M)return;
const S=M.S,$=M.$,esc=M.safe,toast=M.toast;
let dialog=null,recognizer=null,caseImageTimer=null;
const pages={cases:'cases',case:'cases',capture:'capture',camera:'capture',analysis:'analysis','ai analysis':'analysis',
 review:'review',evidence:'review',guidance:'guidance',protocols:'guidance','grossing reference':'guidance',
 library:'library','image library':'library',models:'models','model settings':'models'};
function parseV12Command(raw){
 const cleaned=String(raw||'').toLowerCase().replace(/^[\s,.!?]+|[\s,.!?]+$/g,'').replace(/\s+/g,' ');
 if(!cleaned)return {kind:'none'};
 let m;
 if((m=cleaned.match(/^(?:open|show|go to|navigate to)\s+(.+)$/))){
  if(pages[m[1]])return {kind:'page',page:pages[m[1]]};
  if(/^(clippy|assistant|chat)$/.test(m[1]))return {kind:'chat',open:true};
  if(/^(case details|current case|case panel)$/.test(m[1]))return {kind:'dock',open:true};
 }
 if(/^(?:close|hide)\s+(?:clippy|assistant|chat)$/.test(cleaned))return {kind:'chat',open:false};
 if(/^(?:close|hide)\s+(?:case details|case panel)$/.test(cleaned))return {kind:'dock',open:false};
 if(/^(?:next step|continue workflow|go to next step)$/.test(cleaned))return {kind:'next'};
 if(/^(?:analyze|analyse)(?: the)? image$|^run (?:ai )?analysis$/.test(cleaned))return {kind:'analyze'};
 if(/^(?:zoom in|magnify)$/.test(cleaned))return {kind:'zoom',direction:1};
 if(/^(?:zoom out|reduce zoom)$/.test(cleaned))return {kind:'zoom',direction:-1};
 if(/^(?:reset view|fit image)$/.test(cleaned))return {kind:'reset'};
 if(/^(?:show|enable) overlay$/.test(cleaned))return {kind:'overlay',show:true};
 if(/^(?:hide|disable) overlay$/.test(cleaned))return {kind:'overlay',show:false};
 if(/^(?:start|open) camera$/.test(cleaned))return {kind:'camera',action:'start'};
 if(/^stop camera$/.test(cleaned))return {kind:'camera',action:'stop'};
 if(/^(?:capture image|take photo|snap photo)$/.test(cleaned))return {kind:'camera',action:'capture'};
 if(/^(?:scan demo barcode|scan barcode)$/.test(cleaned))return {kind:'barcode'};
 if((m=String(raw||'').trim().match(/^(?:ask clippy|ask assistant|clippy ask)\s+(.+)/i)))return {kind:'ask',question:m[1].trim().slice(0,650)};
 if((m=String(raw||'').trim().match(/^(?:dictate note|add note|record observation|note)\s+(.+)/i)))return {kind:'note',note:m[1].trim().slice(0,850)};
 if(/^(?:help|commands|what can i say|show commands)$/.test(cleaned))return {kind:'help'};
 return {kind:'unknown'};
}
M.parseV12Command=parseV12Command;
const cmdExamples=[
 ['Show analysis','Navigation'],
 ['Open review','Navigation'],
 ['Next step','Workflow'],
 ['Analyze image','AI / QC'],
 ['Zoom in','Image viewer'],
 ['Open Clippy','Assistant'],
 ['Ask Clippy what should I verify about this specimen?','Assistant'],
 ['Dictate note specimen orientation documented','Grossing notes'],
 ['Start camera','Camera'],
 ['Scan demo barcode','Synthetic intake']
];
function createControls(){
 const right=$('.top-actions');if(!right||$('#v12CommandToggle'))return;
 const commands=document.createElement('button');commands.id='v12CommandToggle';commands.type='button';
 commands.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg><span class="btn-label">Hands-free</span>';
 commands.title='Voice or keyboard workflow commands · Alt+Shift+V';
 commands.setAttribute('aria-haspopup','dialog');
 right.insertBefore(commands,$('#themeBtn'));
 const dockBtn=document.createElement('button');dockBtn.id='caseDockToggle';dockBtn.type='button';dockBtn.textContent='Case';dockBtn.title='Show or hide the current case inspector';
 dockBtn.setAttribute('aria-pressed','true');
 right.insertBefore(dockBtn,commands);
 commands.onclick=showCommands;
 dockBtn.onclick=()=>{const isHidden=document.body.classList.toggle('v12-dock-hidden');
  if(window.innerWidth<=1040)document.body.classList.toggle('v12-dock-open',!isHidden);
  if(!isHidden&&!$('#assistant').classList.contains('collapsed'))M.openChat?.(false);
  dockBtn.setAttribute('aria-pressed',String(!isHidden));
  M.resizeCanvas?.();};
 const dlg=document.createElement('dialog');dlg.id='v12CommandDialog';dlg.className='v12-command-dialog';
 dlg.setAttribute('aria-label','Hands-free and keyboard commands');
 dlg.innerHTML='<div class="v12-command-head"><div><h2>Hands-free workflow</h2><p>Push to talk or type a command. Speech transcription depends on your browser.</p></div><button class="btn small" type="button" id="v12CmdClose" aria-label="Close commands">×</button></div>'+
  '<form method="dialog" id="v12CmdForm" class="v12-command-main">'+
  '<label for="v12CmdText">Workflow command</label><div class="v12-command-row"><input id="v12CmdText" autocomplete="off" spellcheck="false" maxlength="800" placeholder="e.g. open review or ask Clippy about this image">'+
  '<button type="button" id="v12CmdMic">Start voice</button><button type="submit" class="primary">Run</button></div>'+
  '<p class="v12-command-help">Only the command you choose is acted on. The microphone is never started automatically. Some browsers use cloud speech recognition—use public or synthetic material only.</p>'+
  '<div class="v12-command-examples" id="v12Examples"></div><div id="v12CmdStatus" class="v12-command-response" role="status" aria-live="polite">Ready. Try “show analysis” or “open Clippy.”</div>'+
  '</form>';
 document.body.append(dlg);dialog=dlg;
 $('#v12CmdClose').onclick=()=>closeCommands();
 $('#v12CmdForm').onsubmit=e=>{e.preventDefault();executeCommand($('#v12CmdText').value,{voice:false});};
 $('#v12CmdMic').onclick=toggleMicrophone;
 const container=$('#v12Examples');
 cmdExamples.forEach(([command,label])=>{const b=document.createElement('button');b.type='button';b.textContent=command;b.title=label;b.onclick=()=>{$('#v12CmdText').value=command;executeCommand(command)};container.append(b)});
 document.addEventListener('keydown',e=>{const tag=document.activeElement?.tagName;
  if(e.altKey&&e.shiftKey&&e.key.toLowerCase()==='v'){e.preventDefault();showCommands();return;}
  if(e.key==='/'&&!(tag==='INPUT'||tag==='TEXTAREA'||document.activeElement?.isContentEditable)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();showCommands();}
 });
 if(!(window.SpeechRecognition||window.webkitSpeechRecognition))$('#v12CmdMic').disabled=true;
}
function showCommands(){if(!dialog)return;if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');$('#v12CmdText').focus();}
function closeCommands(){if(recognizer)try{recognizer.stop()}catch{};if(dialog?.open&&typeof dialog.close==='function')dialog.close();else dialog?.removeAttribute('open');}
function report(message){const el=$('#v12CmdStatus');if(el)el.textContent=message;toast(message);}
function executeCommand(raw,options={}){
 const c=parseV12Command(raw);
 let result='';
 switch(c.kind){
 case 'page':M.nav(c.page);result='Opened '+c.page+'.';break;
 case 'next':{const order=['cases','capture','analysis','review'];const idx=order.indexOf(S.page);M.nav(order[Math.min(idx<0?1:idx+1,order.length-1)]);result='Opened the next workflow step.';break;}
 case 'chat':M.openChat?.(c.open);result=c.open?'Clippy opened.':'Clippy closed.';break;
 case 'dock':document.body.classList.toggle('v12-dock-hidden',!c.open);document.body.classList.toggle('v12-dock-open',c.open);$('#caseDockToggle').setAttribute('aria-pressed',String(c.open));result='Case inspector '+(c.open?'opened':'hidden')+'.';break;
 case 'analyze':
   if(!S.image)result='Open a specimen first.';
   else if(!M.remoteAllowed())result='Cloud analysis needs an approved public or synthetic image. Confirm image authorization in Capture.';
   else {M.nav('analysis');$('#analyzeBtn')?.click();result='Image analysis requested. Review the resulting evidence.';}break;
 case 'zoom':M.nav('analysis');$('#'+(c.direction>0?'zoomIn':'zoomOut'))?.click();result='Updated zoom.';break;
 case 'reset':M.nav('analysis');$('#resetView')?.click();result='Reset viewer.';break;
 case 'overlay':S.overlay=c.show;$('#overlayToggle').checked=c.show;M.draw?.();result='Overlay '+(c.show?'shown':'hidden')+'.';break;
 case 'camera':
   if(c.action==='start'){M.nav('capture');$('#startCamera')?.click();result='Requested local camera preview.';}
   else if(c.action==='stop'){M.nav('capture');$('#stopCamera')?.click();result='Camera preview stopped.';}
   else {if(!S.cameraStream)result='Open the camera first before capture.';else {M.nav('capture');$('#snapPhoto')?.click();result='Capturing an image.';}}break;
 case 'barcode':M.nav('capture');$('#barcodeBtn')?.click();result='Requested barcode scan (synthetic IDs only).';break;
 case 'ask':
   M.openChat?.(true);$('#chatInput').value=c.question;
   // Explicit ask-command constitutes a user-initiated request; preserve user confirmation when text is typed.
   $('#chatInput').focus();if(options.voice){queueMicrotask(()=>$('#chatForm')?.requestSubmit());result='Clippy question submitted. Review the response.';}else result='Clippy question prepared. Press Send to submit.';break;
 case 'note':M.nav('capture');$('#captureNotes').value=($('#captureNotes').value?$('#captureNotes').value+'\n':'')+c.note;$('#captureNotes').dispatchEvent(new Event('input',{bubbles:true}));result='Observation added to local capture notes. Verify transcription.';break;
 case 'help':result='Try “Open analysis”, “Analyze image”, “Next step”, “Open Clippy”, “Start camera”, or “Dictate note …”.';break;
 case 'none':result='Enter a workflow command.';break;
 default:result='Command not recognized. Try one of the examples below.';break;
 }
 report(result);refreshDock();if(!['help','none','unknown'].includes(c.kind)){setTimeout(()=>{closeCommands();if(c.kind==='ask'&&!options.voice)$('#chatInput')?.focus({preventScroll:true});},150);}return {command:c,result};
}
function toggleMicrophone(){
 if(recognizer){try{recognizer.stop()}catch{}return;}
 const R=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!R){report('Speech recognition is not available. Type a command instead.');return;}
 const supportsLocal='processLocally' in R.prototype;
 if(!supportsLocal&&!window.confirm('Your browser may send microphone audio to a speech-recognition provider. Do not dictate patient identifiers or restricted specimens. Continue?'))return;
 const rec=new R();rec.lang='en-US';rec.continuous=false;rec.interimResults=false;
 if(supportsLocal)rec.processLocally=true;
 recognizer=rec;
 const button=$('#v12CmdMic');button.textContent='Stop voice';button.classList.add('listening');
 $('#v12CmdStatus').textContent='Listening for one command…';
 rec.onresult=e=>{const sentence=e.results?.[0]?.[0]?.transcript||'';$('#v12CmdText').value=sentence;executeCommand(sentence,{voice:true})};
 rec.onerror=e=>{$('#v12CmdStatus').textContent='Voice recognition unavailable ('+(e.error||'unknown')+'). Use typed commands instead.'};
 rec.onend=()=>{recognizer=null;button.textContent='Start voice';button.classList.remove('listening')};
 try{rec.start()}catch{recognizer=null;button.textContent='Start voice';button.classList.remove('listening');report('Could not start voice recognition; type a command instead.');}
}
function createCaseDock(){
 const station=$('.workstation');if(!station||$('#v12CaseDock'))return;
 const dock=document.createElement('aside');dock.id='v12CaseDock';dock.className='v12-case-dock';dock.setAttribute('aria-label','Current case inspector');
 dock.innerHTML='<div class="v12-case-head"><div><strong>Current case</strong><br><small>Specimen context</small></div><button id="v12CaseCollapse" class="btn small" type="button" aria-label="Hide case inspector">×</button></div>'+
 '<div class="v12-dock-section"><div class="v12-dock-label">Active accession</div><div class="v12-dock-id" id="v12DockAccession">No case</div><div class="v12-dock-meta" id="v12DockSpecimen">Select an image to begin.</div><div class="v12-dock-actions"><button type="button" data-v12nav="cases">Case queue</button><button type="button" data-v12nav="capture">Capture</button></div></div>'+
 '<div class="v12-dock-section"><div class="v12-dock-label">Current image</div><img id="v12DockImage" class="v12-thumb" alt="Current gross specimen thumbnail" hidden><p id="v12DockImageText" class="v12-dock-meta">No image opened</p><p class="v12-dock-meta" id="v12DockSource"></p></div>'+
 '<div class="v12-dock-section"><div class="v12-dock-label">Case progress</div><div class="v12-dock-status"><span>Image QC</span><strong id="v12DockQC">Not reviewed</strong></div><div class="v12-dock-status"><span>AI analysis</span><strong id="v12DockAI">Not run</strong></div><div class="v12-dock-status"><span>PA review</span><strong id="v12DockReview">Pending</strong></div><div class="v12-dock-actions"><button class="v12-accent" type="button" data-v12nav="analysis">Inspect image</button><button type="button" data-v12nav="review">Review</button></div></div>'+
 '<div class="v12-dock-section"><div class="v12-dock-label">Review focus</div><div class="v12-dock-meta" id="v12DockFocus">Open an image to view organ-specific review checks.</div><div class="v12-dock-actions"><button id="v12DockGuide" type="button">Grossing guidance</button><button id="v12DockClippy" type="button">Ask Clippy</button></div></div>'+
 '<div class="v12-dock-note">Local research workflow · No hospital case system connected. Only authorized public or synthetic specimens belong in this prototype.</div>';
 station.append(dock);
 $('#v12CaseCollapse').onclick=()=>$('#caseDockToggle').click();
 dock.querySelectorAll('[data-v12nav]').forEach(b=>b.onclick=()=>M.nav(b.dataset.v12nav));
 $('#v12DockGuide').onclick=()=>M.nav('guidance');
 $('#v12DockClippy').onclick=()=>M.openChat?.(true);
 dock.addEventListener('click',()=>setTimeout(refreshDock,80));
 refreshDock();
}
function refreshDock(){
 if(!$('#v12CaseDock'))return;
 $('#v12DockAccession').textContent=S.caseId||'No active case';
 $('#v12DockSpecimen').textContent=S.image?(S.caseName||'Gross specimen')+' · '+(S.organ||'Unverified organ'):'Select a specimen to begin.';
 $('#v12DockSource').textContent=S.image?(S.imageWidth+'×'+S.imageHeight+' px · '+(S.source||'Imported image')):'';
 $('#v12DockQC').textContent=S.qc?(S.qcAcknowledged?'Acknowledged':S.qc.flags?.length?'Needs review':'Screened'):'Not reviewed';
 $('#v12DockAI').textContent=S.analysis?((S.analysis.candidates?.length||0)+' proposed regions'):'Not run';
 $('#v12DockReview').textContent=S.reviewDecision||'Pending';
 const review=S.priorityChecks||{};
 const reviewed=Object.values(review).filter(x=>x?.status&&x.status!=='Not reviewed').length,follow=Object.values(review).filter(x=>x?.status==='Follow-up required').length;
 const flags=S.organ&&/kidney|renal/i.test(S.organ)?'Renal sinus, perinephric fat, vein and calibrated dimensions'
 :S.organ&&/breast/i.test(S.organ)?'Lesion size, margins, skin/nipple and nodal context'
 :S.organ&&/prostat/i.test(S.organ)?'Orientation, margins and section locations'
 :'Image identity, required views and visible gross findings';
 $('#v12DockFocus').textContent=flags+'. '+reviewed+' review item(s) addressed'+(follow?' · '+follow+' follow-up flagged':'')+'.';
 const image=$('#v12DockImage');
 if(S.image&&S.image.src){if(image.src!==S.image.src){image.src=S.image.src;image.hidden=false;$('#v12DockImageText').hidden=true;}}
 else{image.hidden=true;image.removeAttribute('src');$('#v12DockImageText').hidden=false;}
}
function createReviewAssist(){
 const review=$('#page-review');if(!review||$('#v12ReviewHelp'))return;
 const container=document.createElement('details');container.id='v12ReviewHelp';container.className='panel v11-panel';
 container.innerHTML='<summary>Anatomy &amp; staging-relevant review questions <span>PA-guided · not automatic staging</span></summary>'+
 '<p class="sponsor-lead">Use the candidate locations and the laboratory’s current procedures to verify potentially consequential anatomy. A gross image alone cannot confirm microscopic invasion or assign pathological stage.</p>'+
 '<div class="v12-guide-targets" id="v12Targets"></div>'+
 '<p class="v12-target-note">All suggested questions require source verification and professional review. No automatic reduction in tissue sampling is implied.</p>';
 const target=review.querySelector('.sponsor-review')||review.querySelector('.two-col');
 target?.after(container);
 renderTargets();
}
function renderTargets(){
 const root=$('#v12Targets');if(!root)return;
 const key=/kidney|renal/i.test(S.organ||'')?'kidney':/breast/i.test(S.organ||'')?'breast':/prostat/i.test(S.organ||'')?'prostate':'other';
 const prompts={
 kidney:[
 ['Renal sinus interface','Which visible structures indicate where the PA should inspect renal sinus fat? Do not infer histological invasion.'],
 ['Vascular and perinephric areas','What additional views or sections may be needed to document venous and perinephric relationships? Cite available guidance.'],
 ['Calibrated lesion size','What must be measured or verified before making a size-related staging assessment?']
 ],
 breast:[
 ['Lesion dimensions','How should lesion dimensions and scale be verified against institution-approved guidance?'],
 ['Margins and orientation','Which margin and orientation features should the PA confirm in the current specimen images?'],
 ['Additional views','What image or sampling information is missing for a proper gross specimen review?']
 ],
 prostate:[
 ['Margin orientation','What should the PA verify about inked margins and orientation?'],
 ['Section mapping','What grossing information is necessary to map tissue blocks and cassettes?']
 ],
 other:[
 ['Gross anatomy checks','Which anatomical structures can be reviewed from this image, and which are not assessable?'],
 ['Additional sampling','Which additional photographs or measurements would be useful, subject to the current SOP?'],
 ['Image-quality review','Which image artifacts or missing identifiers should be corrected before analysis?']
 ]};
 root.innerHTML='';
 for(const [title,question] of prompts[key]){
  const b=document.createElement('button');b.type='button';b.innerHTML='<strong>'+esc(title)+'</strong><span>Ask Clippy for a source-linked review prompt ↗</span>';b.onclick=()=>{M.openChat?.(true);$('#chatInput').value=question;$('#chatInput').focus();toast('Question prepared; send when ready.');};root.append(b);
 }
}
function initV12(){
 createControls();createCaseDock();createReviewAssist();
 window.addEventListener('mopec:case-changed',()=>{setTimeout(refreshDock,60);setTimeout(renderTargets,60)});
 window.addEventListener('mopec:analysis-complete',()=>setTimeout(refreshDock,60));
 document.addEventListener('click',e=>{if(e.target.closest('[data-case-decision], [data-decide], #analyzeBtn, #v11WorkNext, #v11QcAck, #v11SaveFeedback'))setTimeout(refreshDock,100)});
 document.addEventListener('change',e=>{if(e.target.closest('#priorityChecks, #reviewChecklist, #caseSelect'))setTimeout(refreshDock,60)});
 const oldNav=M.nav;M.nav=function(...args){const result=oldNav(...args);setTimeout(refreshDock,30);return result};
 window.addEventListener('resize',()=>{if(window.innerWidth>1040)document.body.classList.remove('v12-dock-open')});
 if(window.innerWidth<=1040)document.body.classList.add('v12-dock-hidden');
 if(S.image)refreshDock();
}
M.initV12=initV12;
})();

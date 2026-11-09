
(()=>{'use strict';
const M=window.Mopec,S=M.S,$=M.$,safe=M.safe,toast=M.toast;
async function startCamera(){
 if(!navigator.mediaDevices?.getUserMedia){toast('Camera capture unsupported in this browser. Use Open image instead.');return}
 try{S.cameraStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}});const v=$('#cameraVideo');v.srcObject=S.cameraStream;v.hidden=false;$('#cameraInstruction').hidden=true;await v.play();$('#startCamera').disabled=true;$('#snapPhoto').disabled=false;$('#stopCamera').disabled=false;toast('Camera ready. Nothing is sent to AI automatically.');}catch{toast('Camera permission denied or no usable camera. Try importing a public image.');}}
function stopCamera(){if(S.cameraStream){for(const t of S.cameraStream.getTracks())t.stop();S.cameraStream=null}const v=$('#cameraVideo');v.pause();v.srcObject=null;v.hidden=true;$('#cameraInstruction').hidden=false;$('#startCamera').disabled=false;$('#snapPhoto').disabled=true;$('#stopCamera').disabled=true;}
async function capture(){const v=$('#cameraVideo');if(!v.videoWidth){toast('Camera is not ready.');return}const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));if(blob){stopCamera();await M.importFile(new File([blob],'DEMO-camera-'+new Date().toISOString().slice(0,10)+'.jpg',{type:'image/jpeg'}),'camera');}}
async function scanBarcode(){
 if(!S.cameraStream){toast('Open camera first.');return}if(!('BarcodeDetector' in window)){toast('Browser BarcodeDetector unavailable. Enter a DEMO- ID manually.');return}
 try{const detector=new BarcodeDetector({formats:['qr_code','code_128','code_39','data_matrix']});const found=await detector.detect($('#cameraVideo'));const code=(found[0]?.rawValue||'').trim().toUpperCase();
 if(!code){toast('No barcode detected. Hold a demo code in view.');return}
 if(!/^(DEMO|SYNTHETIC)-[A-Z0-9-]{1,26}$/.test(code)){toast('This public prototype accepts only DEMO- or SYNTHETIC- barcodes.');return}
 $('#accessionInput').value=code;S.caseId=code;M.setTitle();$('#barcodeResult').textContent='Synthetic accession loaded: '+code;
 }catch{toast('Demo barcode not recognized. Use manual entry.');}
}
function command(text){
 const t=text.toLowerCase().trim().replace(/[.!?]+$/,'');
 const navs={'open analysis':'analysis','show analysis':'analysis','open ai analysis':'analysis','open cases':'cases','open case list':'cases','open capture':'capture','open camera':'capture','open protocols':'guidance','open guidance':'guidance','open review':'review','review case':'review','open evidence':'review','show image library':'library','open image library':'library','open model settings':'models'};
 if(navs[t]){M.nav(navs[t]);return true}
 if(['show clippy','open clippy'].includes(t)){M.openChat?.(true);return true}
 if(['hide clippy','close clippy'].includes(t)){M.openChat?.(false);return true}
 if(t==='analyze image'){$('#analyzeBtn').click();return true}
 return false;
}
function dictate(target){
 if(S.recognizer){S.recognizer.stop();return}
 const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){toast('Dictation unavailable in this browser. You can type your notes.');return}
 const rec=new R();rec.lang='en-US';rec.continuous=false;rec.interimResults=false;
 if('processLocally' in rec)rec.processLocally=true;
 else if(!confirm('Your browser may send microphone audio to an external speech service. Only dictate synthetic/public research material. Continue?'))return;
 S.recognizer=rec;const button=target==='notes'?$('#dictateNotes'):$('#dictateChat');button.classList.add('active');
 rec.onresult=e=>{const words=e.results?.[0]?.[0]?.transcript||'';if(!words)return;if(command(words)){toast('Voice command: '+words);return}
 const el=target==='notes'?$('#captureNotes'):$('#chatInput');el.value=(el.value.trim()?el.value.trim()+' ':'')+words;if(target==='notes')S.captureNotes=el.value;toast('Dictation added. Check transcription for accuracy.');};
 rec.onerror=e=>{toast('Speech recognition unavailable: '+(e.error||'unknown')+'. Type instead.');};
 rec.onend=()=>{S.recognizer=null;button.classList.remove('active')};
 try{rec.start();toast('Listening. Try “open analysis” or dictate a note.');}catch{S.recognizer=null;button.classList.remove('active');toast('Speech recognition could not start.');}
}
async function guides(){
 try{const r=await fetch('/api/guides');if(!r.ok)throw Error();const v=await r.json();S.guides=Array.isArray(v)?v:[];renderGuides();}
 catch{$('#guidesList').innerHTML='<div class="empty-data">Guidance library unavailable. No SOP excerpts will be fabricated.</div>';}
}
function renderGuides(){
 const out=$('#guidesList');out.innerHTML='';const q=$('#guideQuery').value.toLowerCase().trim();
 for(const g of S.guides.filter(x=>(x.title+' '+x.content+' '+(x.checklist||[]).join(' ')).toLowerCase().includes(q))){
 const block=document.createElement('article');block.className='ref-item';block.innerHTML='<h3>'+safe(g.title)+' <span class="case-pill">Research draft v'+safe(g.version)+'</span></h3><p>'+safe(g.content)+'</p><details><summary style="font-size:11px;cursor:pointer">Review points</summary><ul>'+(g.checklist||[]).map(t=>'<li>'+safe(t)+'</li>').join('')+'</ul></details><a href="'+safe(g.source_url)+'" target="_blank" rel="noopener noreferrer">Source reference ↗</a>';out.append(block);}
 if(!out.childElementCount)out.innerHTML='<div class="empty-data">No matching research guide found. Check your institution-approved SOP.</div>';
}
async function health(){
 try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();const label=d.configured?((d.model_mode==='cloudflare'?'Mistral AI':String(d.provider||'AI'))+' · configured'):'AI not configured';$('#modelStatus').textContent=label;$('#clippyConnection').textContent=label;$('#modelHealth').textContent=d.configured?'Configured':'Not configured';$('#activeModel').textContent=(d.provider||'Groq')+' / '+(d.model||'Unspecified');}
 catch{$('#modelStatus').textContent='AI offline';$('#clippyConnection').textContent='Unavailable';$('#modelHealth').textContent='Unavailable';}
}
function initWorkflow(){
 $('#captureToAnalyze').onclick=()=>M.nav('analysis');
 $('#startCamera').onclick=startCamera;$('#stopCamera').onclick=stopCamera;$('#snapPhoto').onclick=capture;$('#barcodeBtn').onclick=scanBarcode;
 $('#syntheticCaseBtn').onclick=()=>{$('#accessionInput').value='DEMO-0001';S.caseId='DEMO-0001';M.setTitle();$('#barcodeResult').textContent='Synthetic demo accession prefilled. No patient record loaded.';toast('Synthetic demo accession populated.');};
 $('#accessionInput').onchange=e=>{const value=e.target.value.trim().toUpperCase();if(!/^(DEMO|SYNTHETIC)-[A-Z0-9-]{1,26}$/.test(value)){e.target.value='';toast('Only synthetic IDs beginning DEMO- or SYNTHETIC- are accepted.');return}S.caseId=value;M.setTitle();};
 $('#publicConsent').onchange=e=>{S.consent=e.target.checked;if(!S.consent&&S.sourceType!=='catalog')toast('External AI is disabled until image authorization is confirmed.')};
 $('#captureNotes').oninput=e=>S.captureNotes=e.target.value.slice(0,2200);
 $('#dictateNotes').onclick=()=>dictate('notes');$('#dictateChat').onclick=()=>dictate('chat');
 $('#guideQuery').oninput=renderGuides;$('#testModel').onclick=health;
 window.addEventListener('pagehide',stopCamera);
 guides();health();
}
M.openCamera=startCamera;M.stopCamera=stopCamera;M.renderGuides=renderGuides;M.health=health;M.initWorkflow=initWorkflow;
})();

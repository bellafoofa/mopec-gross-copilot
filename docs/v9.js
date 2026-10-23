
(()=>{'use strict';
const $=s=>document.querySelector(s);
const clipSvg='<svg aria-hidden="true" viewBox="0 0 36 44" fill="none" stroke="currentColor" stroke-width="3.3" stroke-linecap="round"><path d="M26 12v18c0 7-5 11-11 11C8 41 4 36 4 28V14C4 7 10 3 17 3c8 0 13 5 13 14v12c0 6-4 9-9 9-6 0-9-4-9-10V18c0-4 2-7 6-7s6 2 6 7v10"/><circle cx="17" cy="19" r="1.2" stroke="none" fill="currentColor"/><circle cx="26" cy="19" r="1.2" stroke="none" fill="currentColor"/></svg>';
const clippy=$('#clippy'),drawer=$('#drawer'),history=$('#history'),form=$('#ask'),oldClose=$('#close');
if(!clippy||!drawer||!history||!form)return;
let activeRequest=null,analysis=null,source=null,turns=[];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markdown(src){
 const inline=s=>s.replace(/\*\*([^*\n]{1,140})\*\*/g,'<strong>$1</strong>');
 let output=[],items=[];
 const flush=()=>{if(items.length){output.push('<ul>'+items.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>');items=[];}};
 for(const raw of safe(src).split(/\r?\n/)){
  const line=raw.trim();if(!line){flush();continue;}
  let m=line.match(/^#{1,4}\s+(.+)$/);
  if(m){flush();output.push('<h3>'+inline(m[1])+'</h3>');continue;}
  m=line.match(/^\*\*([^*]{2,90})\*\*:?\s*$/);
  if(m){flush();output.push('<h3>'+inline(m[1])+'</h3>');continue;}
  m=line.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);
  if(m){items.push(m[1]);continue;}
  flush();output.push('<p>'+inline(line)+'</p>');
 }
 flush();return output.join('')||'<p>No response returned.</p>';
}
const upper=drawer.querySelector('.drawerhead');
if(upper){upper.querySelector('strong').innerHTML='<span class="cliplogo">'+clipSvg+'</span><span>Clippy</span><span id="aiStatus" class="badge">Checking…</span>';}
const right=$('header .right')||$('header');
let topBtn=$('#chatToggleTop');
if(!topBtn){topBtn=document.createElement('button');topBtn.id='chatToggleTop';topBtn.type='button';topBtn.innerHTML='<span class="paperclip-mini">'+clipSvg+'</span><span>Clippy</span>';right.insertBefore(topBtn,right.firstChild);}
form.innerHTML='<div class="chat-row"><textarea id="question" maxlength="650" rows="2" placeholder="Ask about the image or an SOP…"></textarea><button id="chatSend" class="btn primary" type="submit">Send</button></div><div class="chat-footer"><span>Enter to send · Shift+Enter for a new line</span><span id="chatProgress">Ready</span></div>';
let input=$('#question'),send=$('#chatSend'),progress=$('#chatProgress');
history.querySelectorAll('.message').forEach(el=>el.remove());
let welcome=document.createElement('div');welcome.id='chatEmpty';welcome.innerHTML='Ask about the specimen, candidate findings, morphology, image quality or procedures.';history.appendChild(welcome);
let suggested=document.createElement('div');suggested.id='chatQuestions';suggested.innerHTML='<button data-q="Describe the visible gross findings in this photograph.">Describe image</button><button data-q="What possible patterns should the PA consider, and what is uncertain?">Possible findings</button><button data-q="What image-quality checks are needed before accepting this case?">Quality checks</button><button data-q="Summarize relevant grossing workflow guidance from the available draft SOPs.">SOP guidance</button>';history.appendChild(suggested);
function drawAlign(){setTimeout(()=>window.dispatchEvent(new Event('resize')),220);}
function openChat(){drawer.classList.add('open');document.body.classList.add('clippy-open');topBtn.setAttribute('aria-expanded','true');clippy.setAttribute('aria-expanded','true');drawAlign();input.focus({preventScroll:true});setTimeout(()=>history.scrollTop=history.scrollHeight,35);}
function closeChat(){drawer.classList.remove('open');document.body.classList.remove('clippy-open');topBtn.setAttribute('aria-expanded','false');clippy.setAttribute('aria-expanded','false');drawAlign();}
function toggleChat(){drawer.classList.contains('open')?closeChat():openChat();}
topBtn.onclick=toggleChat;clippy.onclick=toggleChat;oldClose.onclick=closeChat;
topBtn.setAttribute('aria-expanded','false');topBtn.setAttribute('aria-controls','drawer');clippy.setAttribute('aria-controls','drawer');clippy.setAttribute('aria-expanded','false');oldClose.setAttribute('aria-label','Close Clippy');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawer.classList.contains('open')){closeChat();topBtn.focus();}});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});
suggested.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{input.value=b.dataset.q;openChat();form.requestSubmit();});
function append(text,type,extra){
 welcome.style.display='none';suggested.style.display='none';
 const el=document.createElement('div');el.className='message v8-rendered '+(type==='user'?'user':type==='pending'?'pending':'assistant');
 el.innerHTML=(type==='user'?'':type==='pending'?'':'<span class="meta">CLIPPY</span>')+(type==='user'?'<p>'+safe(text)+'</p>':markdown(text));
 if(extra?.length){let div=document.createElement('div');div.className='source-list';div.textContent='Sources: ';for(const [idx,s] of extra.entries()){if(idx)div.append(' · ');const link=document.createElement('a');link.textContent=String(s.title||s.id||'Reference');if(/^https:\/\//.test(s.source_url||'')){link.href=s.source_url;link.target='_blank';link.rel='noopener noreferrer';}div.appendChild(link);}el.appendChild(div);}
 history.appendChild(el);history.scrollTop=history.scrollHeight;return el;
}
function capture(){
 const cnv=$('#canvas'),toggle=$('#overlay');if(!cnv?.width)return '';
 const on=toggle?.checked;if(on){toggle.checked=false;toggle.dispatchEvent(new Event('change'));}
 try{const c=document.createElement('canvas'),max=Math.max(cnv.width,cnv.height),ratio=Math.min(1,730/max);c.width=Math.max(1,Math.round(cnv.width*ratio));c.height=Math.max(1,Math.round(cnv.height*ratio));c.getContext('2d').drawImage(cnv,0,0,c.width,c.height);
  for(const quality of [.73,.59,.42]){let d=c.toDataURL('image/jpeg',quality);if(d.length<1_550_000)return d;}return '';
 }catch{return '';}finally{if(on){toggle.checked=true;toggle.dispatchEvent(new Event('change'));}}
}
async function sendQuestion(e){
 e.preventDefault();e.stopImmediatePropagation();
 const q=input.value.trim();if(!q||activeRequest)return;
 input.value='';append(q,'user');const loading=append('Analyzing the current image and source material…','pending');
 activeRequest=new AbortController();send.disabled=true;progress.textContent='Thinking…';openChat();
 try{const image=capture(),context=analysis?{organ:analysis.organ_hypothesis,findings:analysis.candidates?.map(f=>({label:f.label,visual_support_pct:f.confidence})),considerations:analysis.possible_considerations?.map(f=>({label:f.label,visual_support_pct:f.visual_support_pct}))}:null;
  const body={question:q,image,source:source?.name||$('#subtitle')?.textContent||'Unverified gross specimen',conversation:turns.slice(-6),preliminary_analysis:context};
  const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(62000)});
  let data;try{data=await r.json();}catch{throw Error('Server returned an unreadable response.');}
  loading.remove();if(!r.ok){append(data.error||'Clippy is temporarily unavailable. Please retry.','assistant');progress.textContent='Service unavailable';$('#aiStatus').textContent='Service unavailable';return;}
  const txt=String(data.answer||'No response returned.').trim();append(txt,'assistant',Array.isArray(data.sources)?data.sources:[]);
  turns.push({role:'user',content:q},{role:'assistant',content:txt.slice(0,1600)});turns=turns.slice(-8);progress.textContent='Ready';$('#aiStatus').textContent='Groq · online';
 }catch(ex){loading.remove();append(ex.name==='TimeoutError'?'Clippy exceeded the response time limit. Please retry.':ex.message||'Clippy could not reach the model.','assistant');progress.textContent='Retry';$('#aiStatus').textContent='Service unavailable';}
 finally{activeRequest=null;send.disabled=false;input.focus({preventScroll:true});}
}
form.onsubmit=sendQuestion;
async function aiHealth(){try{const r=await fetch('/api/health',{cache:'no-store'});if(r.ok){let d=await r.json();$('#aiStatus').textContent=d.configured?'Groq · ready':'AI not connected';}}catch{$('#aiStatus').textContent='Offline';}}
aiHealth();
const summary=document.createElement('section');summary.id='analysisSummary';summary.hidden=true;
const detail=$('#analysisDetail');if(detail?.parentNode)detail.after(summary);
function readScore(x){return Number.isFinite(x)?Math.max(0,Math.min(100,Math.round(x)))+'%':null;}
function renderSummary(d){
 analysis=d;summary.hidden=false;
 const head='<div class="summary-header"><strong>AI image findings · '+safe(d.status||'Preliminary')+'</strong><small>'+safe(d.model||'')+'</small></div>';
 const organ='<div class="summary-grid"><div class="hypothesis"><span>Organ: '+safe(d.organ_hypothesis||'Unknown')+'</span><strong>'+(readScore(d.organ_visual_support_pct)||'N/A')+'</strong></div></div>';
 const conditions=(d.possible_considerations||[]).map(x=>'<div class="hypothesis"><span>'+safe(x.label)+'</span><strong>'+(readScore(x.visual_support_pct)||'N/A')+'</strong></div>').join('');
 const regions=(d.candidates||[]).map(x=>'<div class="hypothesis"><span>'+safe(x.id+' · '+x.label)+'</span><strong>'+(readScore(x.confidence)||'N/A')+'</strong></div>').join('');
 summary.innerHTML=head+organ+(conditions?'<div class="summary-grid">'+conditions+'</div>':'')+(regions?'<div class="summary-grid">'+regions+'</div>':'')+(!conditions&&!regions?'<p class="summary-empty">No focal abnormality could be localized from the photograph.</p>':'')+'<div class="risk-note">Scores are the model’s subjective visual-support estimates, not calibrated diagnostic probabilities. Pixel highlights are exploratory; PA review is required.</div>';
}
window.addEventListener('mopec:analysis',e=>renderSummary(e.detail));
window.addEventListener('mopec:specimen',e=>{analysis=null;source=e.detail;summary.hidden=true;});
})();

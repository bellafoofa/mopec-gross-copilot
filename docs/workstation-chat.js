
(()=>{'use strict';
const M=window.Mopec,S=M.S,$=M.$,safe=M.safe,toast=M.toast;
function markdown(src){
 const lineFmt=t=>safe(t).replace(/\*\*([^*\n]{1,170})\*\*/g,'<strong>$1</strong>');
 const out=[],bullets=[];function flush(){if(bullets.length){out.push('<ul>'+bullets.map(x=>'<li>'+lineFmt(x)+'</li>').join('')+'</ul>');bullets.length=0}}
 for(const raw of String(src||'').split(/\r?\n/)){const line=raw.trim();if(!line){flush();continue}
 const h=line.match(/^#{1,4}\s+(.+)$/)||line.match(/^\*\*([^*]+)\*\*:?\s*$/);if(h){flush();out.push('<h4>'+lineFmt(h[1])+'</h4>');continue}
 const b=line.match(/^(?:[-*•]|\d+\.)\s+(.+)$/);if(b){bullets.push(b[1]);continue}flush();out.push('<p>'+lineFmt(line)+'</p>')}flush();return out.join('')||'<p>No usable response was returned.</p>';
}
function openChat(open){
 const show=typeof open==='boolean'?open:$('#assistant').classList.contains('collapsed');
 $('#assistant').classList.toggle('collapsed',!show);$('#chatToggle').setAttribute('aria-expanded',show?'true':'false');
 if(show)$('#chatInput').focus({preventScroll:true});requestAnimationFrame(M.resizeCanvas);
}
function post(text,role,refs){
 const box=$('#chatMessages');box.querySelector('.chat-welcome')?.remove();$('#chatChips')?.remove();
 const el=document.createElement('div');el.className='msg '+(role==='user'?'user':'assistant-msg');
 el.innerHTML='<div class="who">'+(role==='user'?'YOU':'CLIPPY')+'</div>'+markdown(text);
 if(Array.isArray(refs)&&refs.length){const refsEl=document.createElement('div');refsEl.className='cite';refsEl.append('Sources: ');for(const r of refs){const a=document.createElement('a');a.textContent=r.title||r.id||'Reference';if(/^https:\/\//.test(r.source_url||'')){a.href=r.source_url;a.target='_blank';a.rel='noopener noreferrer'}refsEl.append(a,' ')}el.append(refsEl);}
 box.append(el);box.scrollTop=box.scrollHeight;return el;
}
async function sendChat(e){
 e.preventDefault();if(S.chatBusy)return;const inp=$('#chatInput'),question=inp.value.trim();if(question.length<3)return;
 inp.value='';openChat(true);post(question,'user');const pending=post('Reviewing the selected specimen and available sources…','assistant');
 S.chatBusy=true;$('#sendChat').disabled=true;$('#chatFooter').textContent='Thinking…';
 try{
 const focus=S.roiFocus&&S.selected>=0&&S.analysis?.candidates?.[S.selected];
 const image=S.image&&M.remoteAllowed()?(focus&&M.encodeRegion?M.encodeRegion(1150):M.encodeImage(730)):'';
 const roiNote=focus?' [AI ROI CROP · '+String(focus.label||'feature')+' · zoomed from the original image. Region location is preliminary; crop may omit context. Do not infer invasion, stage or disease from this crop alone.]':'';
 const body={question:question+roiNote,image,source:S.image?(S.caseName+'; '+S.organ+'; '+S.source):'No current image',conversation:S.chatTurns.slice(-6),
 preliminary_analysis:S.analysis?{organ:S.analysis.organ_hypothesis,candidates:(S.analysis.candidates||[]).slice(0,3).map(f=>({label:f.label,visual_support_pct:f.confidence})),possible_considerations:S.analysis.possible_considerations}:null};
 const resp=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(61000)});
 const data=await resp.json().catch(()=>({}));pending.remove();
 if(!resp.ok){post(data.error||'AI service is temporarily unavailable.','assistant');return}
 const text=String(data.answer||'No answer returned').trim();post(text,'assistant',Array.isArray(data.sources)?data.sources:[]);
 S.chatTurns.push({role:'user',content:question},{role:'assistant',content:text.slice(0,1600)});S.chatTurns=S.chatTurns.slice(-8);
 }catch(err){pending.remove();post(err.name==='TimeoutError'?'AI response timed out. Please retry.':err.message||'Unable to reach AI service.','assistant');}
 finally{S.chatBusy=false;$('#sendChat').disabled=false;$('#chatFooter').textContent='Enter to send · Shift+Enter for newline';}
}
function initChat(){
 $('#chatToggle').onclick=()=>openChat();$('#chatClose').onclick=()=>openChat(false);
 $('#chatForm').onsubmit=sendChat;$('#chatInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#chatForm').requestSubmit()}};
 document.querySelectorAll('[data-question]').forEach(btn=>btn.onclick=()=>{$('#chatInput').value=btn.dataset.question;$('#chatForm').requestSubmit()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#assistant').classList.contains('collapsed'))openChat(false)});
}
M.openChat=openChat;M.initChat=initChat;
})();

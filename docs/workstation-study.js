(()=>{'use strict';
const M=window.Mopec,$=M.$;let active=null,done=null,tick=null;
function elapsed(){return active?(performance.now()-active.started)/1000:0;}
function paint(){
 if(active){$('#studyStatus').textContent='Recording';$('#studyMetrics').textContent=elapsed().toFixed(1)+' s · '+active.clicks+' interactions · '+active.errors+' use errors';}
 else if(done){$('#studyStatus').textContent='Completed';$('#studyMetrics').textContent=done.duration_seconds+' s · '+done.clicks+' interactions · '+done.use_errors+' use errors';}
 else{$('#studyStatus').textContent='Not running';$('#studyMetrics').textContent='—';}
}
function start(){
 if(active)return;const task=$('#studyTask').value.trim();if(task.length<3){M.toast('Enter a short task description first.');return;}
 done=null;active={task:task.slice(0,140),mode:$('#studyMode').value,case_id:M.S.caseId,started:performance.now(),started_at:new Date().toISOString(),clicks:0,errors:0};
 $('#studyStart').disabled=true;$('#studyStop').disabled=false;$('#studyError').disabled=false;$('#studyExport').disabled=true;
 tick=setInterval(paint,500);paint();M.toast('Task observation started. Record only public/synthetic material.');
}
function stop(){
 if(!active)return;done={schema:'ltu-mopec-pa-usability/1.0',task:active.task,mode:active.mode,case_id:active.case_id,
 started_at:active.started_at,completed_at:new Date().toISOString(),duration_seconds:+elapsed().toFixed(2),clicks:active.clicks,
 use_errors:active.errors,notes:$('#studyNotes').value.slice(0,1500),storage:'in-memory until export',
 limitations:'Prototype button-click count; no role or task-level event logging, no clinical audit connection.'};
 active=null;clearInterval(tick);tick=null;$('#studyStart').disabled=false;$('#studyStop').disabled=true;$('#studyError').disabled=true;$('#studyExport').disabled=false;paint();M.toast('Observation stopped. Export the record to retain it.');
}
function initStudy(){
 $('#studyStart').onclick=start;$('#studyStop').onclick=stop;$('#studyError').onclick=()=>{if(active){active.errors++;paint()}};
 $('#studyExport').onclick=()=>{if(!done)return;M.blobDownload(JSON.stringify({...done,notes:$('#studyNotes').value.slice(0,1500)},null,2),'application/json','mopec-pa-usability-'+done.mode+'.json');};
 document.addEventListener('click',event=>{if(!active)return;const button=event.target.closest?.('button');if((button&&button.id!=='studyError')||event.target.id==='viewCanvas')active.clicks++;},false);
 paint();
}
M.initStudy=initStudy;
})();
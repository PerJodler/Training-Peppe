const EXERCISES = [
  {id:'bench',name:'Bankdrücken',muscle:'Brust',equipment:'Langhantel',icon:'▰'},
  {id:'incline-db',name:'Schrägbank Kurzhantel',muscle:'Brust',equipment:'Kurzhantel',icon:'◩'},
  {id:'fly',name:'Cable Fly',muscle:'Brust',equipment:'Kabelzug',icon:'⌁'},
  {id:'ohp',name:'Schulterdrücken',muscle:'Schultern',equipment:'Langhantel',icon:'↑'},
  {id:'lateral',name:'Seitheben',muscle:'Schultern',equipment:'Kurzhantel',icon:'↔'},
  {id:'triceps',name:'Trizepsdrücken',muscle:'Arme',equipment:'Kabelzug',icon:'↓'},
  {id:'pullup',name:'Klimmzüge',muscle:'Rücken',equipment:'Körpergewicht',icon:'⇧'},
  {id:'latpull',name:'Latzug',muscle:'Rücken',equipment:'Kabelzug',icon:'⇣'},
  {id:'row',name:'Rudern sitzend',muscle:'Rücken',equipment:'Kabelzug',icon:'⇠'},
  {id:'deadlift',name:'Kreuzheben',muscle:'Rücken',equipment:'Langhantel',icon:'◆'},
  {id:'curl',name:'Bizepscurls',muscle:'Arme',equipment:'Kurzhantel',icon:'⌒'},
  {id:'squat',name:'Kniebeuge',muscle:'Beine',equipment:'Langhantel',icon:'◇'},
  {id:'legpress',name:'Beinpresse',muscle:'Beine',equipment:'Maschine',icon:'▧'},
  {id:'legcurl',name:'Beinbeuger',muscle:'Beine',equipment:'Maschine',icon:'◒'},
  {id:'legext',name:'Beinstrecker',muscle:'Beine',equipment:'Maschine',icon:'◓'},
  {id:'calf',name:'Wadenheben',muscle:'Beine',equipment:'Maschine',icon:'△'},
  {id:'hipthrust',name:'Hip Thrust',muscle:'Beine',equipment:'Langhantel',icon:'▱'},
  {id:'plank',name:'Plank',muscle:'Core',equipment:'Körpergewicht',icon:'━'}
];

const DEFAULT_ROUTINES = [
  {id:'push',name:'Push',tag:'Brust · Schulter · Trizeps',exerciseIds:['bench','incline-db','ohp','lateral','triceps'],rest:120},
  {id:'pull',name:'Pull',tag:'Rücken · Bizeps',exerciseIds:['pullup','latpull','row','deadlift','curl'],rest:120},
  {id:'legs',name:'Legs',tag:'Quads · Glutes · Hamstrings',exerciseIds:['squat','legpress','legcurl','legext','calf'],rest:150}
];

const DEMO_HISTORY = [
  {id:'h1',dateOffset:8,routineId:'push',name:'Push',duration:52,volume:8280,sets:15,records:1},
  {id:'h2',dateOffset:5,routineId:'pull',name:'Pull',duration:59,volume:9140,sets:16,records:0},
  {id:'h3',dateOffset:3,routineId:'legs',name:'Legs',duration:64,volume:11280,sets:17,records:2},
  {id:'h4',dateOffset:1,routineId:'push',name:'Push',duration:56,volume:8940,sets:16,records:1}
];

const store = {
  load(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}},
  save(key,value){localStorage.setItem(key,JSON.stringify(value))}
};

let routines = store.load('form_routines',DEFAULT_ROUTINES);
let customExercises = store.load('form_custom_exercises',[]);
let history = store.load('form_history',null);
if(!history){
  history = DEMO_HISTORY.map(x=>({...x,date:new Date(Date.now()-x.dateOffset*86400000).toISOString()}));
  store.save('form_history',history);
}
let activeWorkout = store.load('form_active_workout',null);
let currentView = activeWorkout ? 'workout' : 'home';
let restTimer = null;
let restRemaining = 0;
let elapsedTicker = null;
let libraryFilter = 'Alle';
let libraryQuery = '';

const app = document.getElementById('app');
const modalRoot = document.getElementById('modalRoot');
const toastEl = document.getElementById('toast');

function allExercises(){return [...EXERCISES,...customExercises]}
function getExercise(id){return allExercises().find(e=>e.id===id) || {id,name:'Unbekannte Übung',muscle:'Sonstiges',equipment:'',icon:'•'}}
function formatNumber(n){return new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(n)}
function isoDay(date){return new Date(date).toISOString().slice(0,10)}
function niceDate(date){return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'}).format(new Date(date))}
function secondsToClock(s){const m=Math.floor(s/60),sec=s%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function showToast(text){toastEl.textContent=text;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),1800)}
function saveAll(){store.save('form_routines',routines);store.save('form_custom_exercises',customExercises);store.save('form_history',history);store.save('form_active_workout',activeWorkout)}

function updateNav(){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===currentView))}
function navigate(view){
  if(activeWorkout && view!=='workout' && !['exercises'].includes(view)){
    const ok=confirm('Training läuft noch. Möchtest du den Bildschirm wirklich verlassen? Dein Training bleibt gespeichert.');
    if(!ok)return;
  }
  currentView=view;render();window.scrollTo({top:0,behavior:'smooth'});
}

function render(){
  updateNav();
  clearInterval(elapsedTicker);
  if(currentView==='home') renderHome();
  if(currentView==='routines') renderRoutines();
  if(currentView==='exercises') renderExercises();
  if(currentView==='stats') renderStats();
  if(currentView==='workout') renderWorkout();
}

function weekHistory(){
  const now=Date.now(); return history.filter(h=>now-new Date(h.date).getTime()<=7*86400000);
}
function streakWeeks(){
  if(history.length===0)return 0;
  let streak=0; const now=new Date();
  for(let w=0;w<12;w++){
    const end=new Date(now); end.setDate(now.getDate()-w*7);
    const start=new Date(end); start.setDate(end.getDate()-6); start.setHours(0,0,0,0);
    const count=history.filter(h=>new Date(h.date)>=start && new Date(h.date)<=end).length;
    if(count>=2)streak++; else if(w>0)break;
  }
  return streak;
}

function renderHome(){
  const wh=weekHistory(); const weeklyVol=wh.reduce((s,h)=>s+h.volume,0); const weeklySets=wh.reduce((s,h)=>s+h.sets,0);
  const nextRoutine=routines[history.length%Math.max(1,routines.length)] || routines[0];
  app.innerHTML=`
    <section class="hero-grid">
      <article class="card hero">
        <div class="eyebrow">Dein Training · ${new Intl.DateTimeFormat('de-DE',{weekday:'long'}).format(new Date())}</div>
        <h2>${activeWorkout?'Training läuft.':'Stärker als beim letzten Mal.'}</h2>
        <p class="hero-copy">Logge Sätze ohne Reibung, sieh deine letzten Werte direkt am Satz und lass FORM deine Progression sichtbar machen.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="homeStart">${activeWorkout?'Training fortsetzen':'Training starten'}</button>
          <button class="btn btn-secondary" data-nav="routines">Pläne ansehen</button>
        </div>
      </article>
      <aside class="hero-stat">
        <div class="mini-ring"></div>
        <div><small>TRAININGS DIESE WOCHE</small><div class="big">${wh.length}<span style="font-size:26px">/4</span></div></div>
      </aside>
    </section>
    <section class="section">
      <div class="metric-grid">
        <div class="card metric"><div class="metric-label">Volumen</div><div class="metric-value">${formatNumber(weeklyVol/1000)}k</div><div class="metric-delta">kg · 7 Tage</div></div>
        <div class="card metric"><div class="metric-label">Arbeitssätze</div><div class="metric-value">${weeklySets}</div><div class="metric-delta">${wh.length} Einheiten</div></div>
        <div class="card metric"><div class="metric-label">Streak</div><div class="metric-value">${streakWeeks()}</div><div class="metric-delta">Wochen aktiv</div></div>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h3>Nächster Plan</h3><button data-nav="routines">Alle Pläne</button></div>
      ${nextRoutine?routineCard(nextRoutine,true):'<div class="empty"><b>Noch kein Plan</b>Erstelle deinen ersten Trainingsplan.</div>'}
    </section>
    <section class="section">
      <div class="section-head"><h3>Letzte Trainings</h3><button data-nav="stats">Auswertung</button></div>
      <div class="list">${history.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(h=>`
        <div class="list-row">
          <div class="list-main"><div class="exercise-icon">${h.records?'★':'✓'}</div><div><div class="list-title">${h.name}</div><div class="list-sub">${niceDate(h.date)} · ${h.duration} Min · ${h.sets} Sätze</div></div></div>
          <div class="list-value">${formatNumber(h.volume)} kg<small>${h.records?`${h.records} PR${h.records>1?'s':''}`:'gespeichert'}</small></div>
        </div>`).join('')}</div>
    </section>
    <section class="section"><div class="note"><strong>FORM Prinzip:</strong> Während des Trainings zählt Geschwindigkeit. Deshalb sind „letzter Satz“, Gewicht, Wiederholungen und RIR direkt in einer Zeile editierbar.</div></section>
  `;
  document.getElementById('homeStart').onclick=()=>activeWorkout?navigate('workout'):openStartModal();
  bindNav();bindRoutineStarts();
}

function routineCard(r,wide=false){
  const ex=r.exerciseIds.map(getExercise);
  return `<article class="card routine-card ${wide?'wide':''}" data-routine="${r.id}">
    <span class="tag">${r.exerciseIds.length} Übungen · ${Math.round(r.rest/60)} Min Pause</span>
    <h4>${r.name}</h4><p>${r.tag || ex.map(x=>x.muscle).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')}</p>
    <footer><div class="exercise-dots">${ex.slice(0,5).map(()=>'<span></span>').join('')}</div><div class="play">▶</div></footer>
  </article>`
}

function renderRoutines(){
  app.innerHTML=`
    <div class="page-head"><div><div class="eyebrow">Planung</div><h1>Trainingspläne</h1><p>Wiederholen, anpassen, stärker werden.</p></div><button class="btn btn-primary" id="newRoutine">＋ Neuer Plan</button></div>
    <div class="routine-grid">${routines.map(r=>routineCard(r)).join('')}</div>
    <section class="section"><div class="note"><strong>Tipp:</strong> Für den MVP bleiben Pläne bewusst einfach: Übungen + Standard-Pausenzeit. Satz- und Wiederholungsziele können wir als nächsten Schritt pro Übung ergänzen.</div></section>
  `;
  document.getElementById('newRoutine').onclick=openRoutineModal;
  bindRoutineStarts();
}

function renderExercises(){
  const muscles=['Alle',...new Set(allExercises().map(e=>e.muscle))];
  let filtered=allExercises().filter(e=>(libraryFilter==='Alle'||e.muscle===libraryFilter) && (`${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(libraryQuery.toLowerCase())));
  app.innerHTML=`
    <div class="page-head"><div><div class="eyebrow">Bibliothek</div><h1>Übungen</h1><p>${allExercises().length} Übungen · filterbar nach Muskelgruppe</p></div><button class="btn btn-primary" id="newExercise">＋ Eigene Übung</button></div>
    <div class="searchbar"><input id="exerciseSearch" class="input" placeholder="Übung suchen …" value="${escapeHtml(libraryQuery)}"></div>
    <div class="chip-row">${muscles.map(m=>`<button class="chip ${m===libraryFilter?'active':''}" data-filter="${m}">${m}</button>`).join('')}</div>
    <section class="section" style="margin-top:10px"><div class="list">${filtered.map(e=>`
      <div class="list-row"><div class="list-main"><div class="exercise-icon">${e.icon||'•'}</div><div><div class="list-title">${e.name}</div><div class="list-sub">${e.muscle} · ${e.equipment}</div></div></div><span class="pill">${e.id.startsWith('custom-')?'Eigene':'Standard'}</span></div>`).join('') || '<div class="empty"><b>Nichts gefunden</b>Versuche einen anderen Suchbegriff.</div>'}</div></section>
  `;
  document.getElementById('exerciseSearch').oninput=e=>{libraryQuery=e.target.value;renderExercises()};
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{libraryFilter=b.dataset.filter;renderExercises()});
  document.getElementById('newExercise').onclick=openExerciseModal;
}

function renderStats(){
  const last14=[]; for(let i=13;i>=0;i--){const d=new Date(Date.now()-i*86400000);const day=isoDay(d);last14.push({d,volume:history.filter(h=>isoDay(h.date)===day).reduce((s,h)=>s+h.volume,0)})}
  const max=Math.max(...last14.map(x=>x.volume),1);
  const totalVolume=history.reduce((s,h)=>s+h.volume,0); const totalWorkouts=history.length;
  const prs=[
    {name:'Bankdrücken',value:'105 kg',note:'geschätztes 1RM 112 kg'},
    {name:'Kniebeuge',value:'140 kg',note:'Top-Satz · 5 Wdh.'},
    {name:'Kreuzheben',value:'175 kg',note:'Top-Satz · 3 Wdh.'},
    {name:'Klimmzüge',value:'+25 kg',note:'Top-Satz · 6 Wdh.'}
  ];
  app.innerHTML=`
    <div class="page-head"><div><div class="eyebrow">Analytics</div><h1>Fortschritt</h1><p>Mach sichtbar, was sich im Spiegel langsam verändert.</p></div></div>
    <div class="metric-grid">
      <div class="card metric"><div class="metric-label">Trainings</div><div class="metric-value">${totalWorkouts}</div><div class="metric-delta">gesamt</div></div>
      <div class="card metric"><div class="metric-label">Volumen</div><div class="metric-value">${formatNumber(totalVolume/1000)}k</div><div class="metric-delta">kg bewegt</div></div>
      <div class="card metric"><div class="metric-label">PRs</div><div class="metric-value">${history.reduce((s,h)=>s+(h.records||0),0)}</div><div class="metric-delta">erkannt</div></div>
    </div>
    <section class="section"><div class="card chart-card"><div class="chart-legend"><div><small>Trainingsvolumen</small><br><strong>Letzte 14 Tage</strong></div><span class="pill">kg</span></div><div class="bars">${last14.map(x=>`<div class="bar-wrap" title="${niceDate(x.d)}: ${formatNumber(x.volume)} kg"><div class="bar" style="height:${Math.max(3,Math.round(x.volume/max*100))}%"></div><div class="bar-label">${x.d.getDate()}</div></div>`).join('')}</div></div></section>
    <section class="section"><div class="section-head"><h3>Persönliche Bestleistungen</h3></div><div class="pr-grid">${prs.map((p,i)=>`<div class="card pr-card"><div class="rank">PR #${i+1}</div><h4>${p.name}</h4><div class="pr-value">${p.value}</div><small>${p.note}</small></div>`).join('')}</div></section>
    <section class="section"><div class="note"><strong>Nächste Ausbaustufe:</strong> echte PR-Berechnung aus deinen geloggten Sätzen, e1RM-Kurven, Muskelgruppen-Volumen und Deload-/Progressionshinweise.</div></section>
  `;
}

function startWorkout(routineId){
  const r=routines.find(x=>x.id===routineId) || {id:'quick',name:'Freies Training',exerciseIds:[],rest:120};
  activeWorkout={id:'w-'+Date.now(),routineId:r.id,name:r.name,startedAt:new Date().toISOString(),rest:r.rest||120,exercises:r.exerciseIds.map(id=>({exerciseId:id,sets:[newSet(id,0),newSet(id,1),newSet(id,2)]}))};
  saveAll();closeModal();currentView='workout';render();
}
function newSet(exerciseId,index){
  const prev=lastSetFor(exerciseId,index);
  return {weight:prev?.weight??'',reps:prev?.reps??'',rir:prev?.rir??2,done:false,previous:prev?`${prev.weight} × ${prev.reps}`:'—'};
}
function lastSetFor(exerciseId,index){
  const sessions=history.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  for(const h of sessions){const ex=h.exerciseData?.find(e=>e.exerciseId===exerciseId);if(ex?.sets?.[index]) return ex.sets[index]}
  const demo={bench:[[80,8],[80,8],[80,7]],squat:[[110,8],[110,7],[105,9]],deadlift:[[150,5],[150,4],[140,6]],row:[[72,10],[72,9],[68,11]],'incline-db':[[30,10],[30,9],[28,11]]};
  const d=demo[exerciseId]?.[index]; return d?{weight:d[0],reps:d[1],rir:2}:null;
}

function renderWorkout(){
  if(!activeWorkout){navigate('home');return}
  const elapsed=Math.floor((Date.now()-new Date(activeWorkout.startedAt).getTime())/1000);
  app.innerHTML=`
    <div class="workout-head">
      <div class="workout-title"><h1>${activeWorkout.name}</h1><div class="workout-meta">${activeWorkout.exercises.length} Übungen · live gespeichert</div></div>
      <div style="display:flex;align-items:center;gap:8px"><div class="timer-badge" id="elapsed">${secondsToClock(elapsed)}</div><button class="btn btn-primary btn-small" id="finishWorkout">Beenden</button></div>
    </div>
    <div id="exerciseCards">${activeWorkout.exercises.map((ex,i)=>workoutExerciseCard(ex,i)).join('')}</div>
    <div class="workout-actions"><button class="btn btn-secondary" id="addExercise">＋ Übung hinzufügen</button><button class="btn btn-danger" id="cancelWorkout">Training verwerfen</button></div>
  `;
  elapsedTicker=setInterval(()=>{const el=document.getElementById('elapsed');if(el&&activeWorkout)el.textContent=secondsToClock(Math.floor((Date.now()-new Date(activeWorkout.startedAt).getTime())/1000))},1000);
  bindWorkoutEvents();
}

function workoutExerciseCard(exState,exIndex){
  const ex=getExercise(exState.exerciseId);
  return `<article class="card exercise-card" data-ex-index="${exIndex}">
    <div class="exercise-card-head"><div><h3>${ex.name}</h3><div class="exercise-meta">${ex.muscle} · ${ex.equipment}</div></div><button class="overflow-btn" data-remove-ex="${exIndex}" title="Übung entfernen">×</button></div>
    <div class="set-head"><span>Satz</span><span>Letztes</span><span>kg</span><span>Wdh.</span><span>RIR</span><span>✓</span></div>
    ${exState.sets.map((s,i)=>`<div class="set-row ${s.done?'done':''}" data-set-index="${i}">
      <div class="set-index">${i+1}</div>
      <input class="set-input previous" value="${s.previous}" disabled>
      <input class="set-input" inputmode="decimal" data-field="weight" value="${s.weight}" placeholder="kg">
      <input class="set-input" inputmode="numeric" data-field="reps" value="${s.reps}" placeholder="Wdh">
      <select class="set-input" data-field="rir"><option value="0" ${Number(s.rir)===0?'selected':''}>0</option><option value="1" ${Number(s.rir)===1?'selected':''}>1</option><option value="2" ${Number(s.rir)===2?'selected':''}>2</option><option value="3" ${Number(s.rir)===3?'selected':''}>3</option><option value="4" ${Number(s.rir)===4?'selected':''}>4+</option></select>
      <button class="set-done" data-done="${i}">${s.done?'✓':'○'}</button>
    </div>`).join('')}
    <button class="add-set" data-add-set="${exIndex}">＋ Satz hinzufügen</button>
  </article>`;
}

function bindWorkoutEvents(){
  document.querySelectorAll('.exercise-card').forEach(card=>{
    const exIndex=+card.dataset.exIndex;
    card.querySelectorAll('.set-row').forEach(row=>{
      const setIndex=+row.dataset.setIndex;
      row.querySelectorAll('[data-field]').forEach(input=>input.onchange=e=>{
        const field=e.target.dataset.field;let val=e.target.value;
        if(val!=='' && !Number.isNaN(Number(val))) val=Number(val);
        activeWorkout.exercises[exIndex].sets[setIndex][field]=val;saveAll();
      });
    });
  });
  document.querySelectorAll('[data-done]').forEach(btn=>btn.onclick=()=>{
    const card=btn.closest('.exercise-card');const exIndex=+card.dataset.exIndex;const setIndex=+btn.dataset.done;const s=activeWorkout.exercises[exIndex].sets[setIndex];
    if(!s.weight || !s.reps){showToast('Gewicht und Wiederholungen eintragen');return}
    s.done=!s.done;saveAll();renderWorkout();if(s.done)startRestTimer(activeWorkout.rest);
  });
  document.querySelectorAll('[data-add-set]').forEach(btn=>btn.onclick=()=>{const i=+btn.dataset.addSet;const ex=activeWorkout.exercises[i];ex.sets.push(newSet(ex.exerciseId,ex.sets.length));saveAll();renderWorkout()});
  document.querySelectorAll('[data-remove-ex]').forEach(btn=>btn.onclick=()=>{const i=+btn.dataset.removeEx;if(confirm('Übung aus diesem Training entfernen?')){activeWorkout.exercises.splice(i,1);saveAll();renderWorkout()}});
  document.getElementById('addExercise').onclick=()=>openExercisePicker();
  document.getElementById('finishWorkout').onclick=finishWorkout;
  document.getElementById('cancelWorkout').onclick=()=>{if(confirm('Training wirklich verwerfen?')){activeWorkout=null;saveAll();stopRestTimer();navigate('home')}};
}

function startRestTimer(seconds){
  stopRestTimer();restRemaining=seconds;renderRestToast();restTimer=setInterval(()=>{restRemaining--;renderRestToast();if(restRemaining<=0){stopRestTimer();showToast('Pause vorbei – nächster Satz!')}},1000)
}
function renderRestToast(){
  let el=document.getElementById('restToast');if(!el){el=document.createElement('div');el.id='restToast';el.className='rest-toast';document.body.appendChild(el)}
  el.innerHTML=`<span>Pause</span><strong>${secondsToClock(Math.max(0,restRemaining))}</strong><button id="skipRest">Überspringen</button>`;document.getElementById('skipRest').onclick=stopRestTimer;
}
function stopRestTimer(){clearInterval(restTimer);restTimer=null;document.getElementById('restToast')?.remove()}

function finishWorkout(){
  const completed=activeWorkout.exercises.flatMap(e=>e.sets).filter(s=>s.done);
  if(completed.length===0){showToast('Noch kein Satz abgeschlossen');return}
  const volume=activeWorkout.exercises.reduce((sum,e)=>sum+e.sets.filter(s=>s.done).reduce((s,x)=>s+(Number(x.weight)||0)*(Number(x.reps)||0),0),0);
  const duration=Math.max(1,Math.round((Date.now()-new Date(activeWorkout.startedAt).getTime())/60000));
  const exerciseData=activeWorkout.exercises.map(e=>({exerciseId:e.exerciseId,sets:e.sets.filter(s=>s.done).map(s=>({weight:Number(s.weight)||0,reps:Number(s.reps)||0,rir:Number(s.rir)||2}))})).filter(e=>e.sets.length);
  const records=detectRecords(exerciseData);
  history.push({id:activeWorkout.id,date:new Date().toISOString(),routineId:activeWorkout.routineId,name:activeWorkout.name,duration,volume:Math.round(volume),sets:completed.length,records,exerciseData});
  activeWorkout=null;saveAll();stopRestTimer();showToast(`Training gespeichert · ${completed.length} Sätze`);currentView='stats';render();
}
function detectRecords(exData){
  let prs=0;
  exData.forEach(ex=>{
    const bestNow=Math.max(...ex.sets.map(s=>s.weight*(1+s.reps/30)));
    let old=0;history.forEach(h=>h.exerciseData?.filter(x=>x.exerciseId===ex.exerciseId).forEach(x=>x.sets.forEach(s=>{old=Math.max(old,s.weight*(1+s.reps/30))})));
    if(bestNow>old && old>0)prs++;
  });
  return prs;
}

function openStartModal(){
  modalRoot.innerHTML=modalShell('Training starten',`<div class="routine-grid" style="grid-template-columns:1fr">${routines.map(r=>routineCard(r)).join('')}</div><button class="btn btn-secondary" id="freeWorkout" style="width:100%;margin-top:10px">Freies Training</button>`);
  bindModalClose();bindRoutineStarts();document.getElementById('freeWorkout').onclick=()=>startWorkout('quick');
}

function openRoutineModal(){
  const selected=[];
  modalRoot.innerHTML=modalShell('Neuer Trainingsplan',`
    <div class="form-grid"><label class="label">Name<input id="routineName" class="input" placeholder="z. B. Upper A"></label><label class="label">Standard-Pause<select id="routineRest" class="input"><option value="90">90 Sekunden</option><option value="120" selected>2 Minuten</option><option value="150">2:30 Minuten</option><option value="180">3 Minuten</option></select></label></div>
    <div class="section-head" style="margin-top:18px"><h3>Übungen auswählen</h3></div><div id="selectedExercises" class="selected-stack"></div>
    <div class="exercise-picker">${allExercises().map(e=>`<div class="pick-row" data-pick="${e.id}"><div class="list-main"><div class="exercise-icon">${e.icon||'•'}</div><div><div class="list-title">${e.name}</div><div class="list-sub">${e.muscle}</div></div></div><button>＋</button></div>`).join('')}</div>
    <div class="modal-actions"><button class="btn btn-primary" id="saveRoutine">Plan speichern</button></div>`);
  bindModalClose();
  const refresh=()=>{document.getElementById('selectedExercises').innerHTML=selected.map(id=>`<span class="pill">${getExercise(id).name}</span>`).join('');document.querySelectorAll('[data-pick]').forEach(row=>row.classList.toggle('selected',selected.includes(row.dataset.pick)))};
  document.querySelectorAll('[data-pick]').forEach(row=>row.onclick=()=>{const id=row.dataset.pick;const i=selected.indexOf(id);i>=0?selected.splice(i,1):selected.push(id);refresh()});
  document.getElementById('saveRoutine').onclick=()=>{const name=document.getElementById('routineName').value.trim();if(!name||!selected.length){showToast('Name und mindestens eine Übung wählen');return}routines.push({id:'r-'+Date.now(),name,tag:[...new Set(selected.map(id=>getExercise(id).muscle))].join(' · '),exerciseIds:selected,rest:+document.getElementById('routineRest').value});saveAll();closeModal();renderRoutines();showToast('Trainingsplan gespeichert')};
}

function openExerciseModal(){
  modalRoot.innerHTML=modalShell('Eigene Übung',`<div class="form-grid"><label class="label">Name<input id="customName" class="input" placeholder="z. B. Chest Supported Row"></label><label class="label">Muskelgruppe<select id="customMuscle" class="input">${['Brust','Rücken','Beine','Schultern','Arme','Core','Sonstiges'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="label">Equipment<input id="customEquipment" class="input" placeholder="Maschine, Kurzhantel …"></label></div><div class="modal-actions"><button class="btn btn-primary" id="saveExercise">Übung speichern</button></div>`);
  bindModalClose();document.getElementById('saveExercise').onclick=()=>{const name=document.getElementById('customName').value.trim();if(!name){showToast('Bitte einen Namen eingeben');return}customExercises.push({id:'custom-'+Date.now(),name,muscle:document.getElementById('customMuscle').value,equipment:document.getElementById('customEquipment').value.trim()||'Sonstiges',icon:'＋'});saveAll();closeModal();renderExercises();showToast('Übung angelegt')}
}

function openExercisePicker(){
  const existing=activeWorkout.exercises.map(e=>e.exerciseId);
  modalRoot.innerHTML=modalShell('Übung hinzufügen',`<div class="exercise-picker">${allExercises().filter(e=>!existing.includes(e.id)).map(e=>`<div class="pick-row" data-add-exercise="${e.id}"><div class="list-main"><div class="exercise-icon">${e.icon||'•'}</div><div><div class="list-title">${e.name}</div><div class="list-sub">${e.muscle} · ${e.equipment}</div></div></div><button>＋</button></div>`).join('')}</div>`);
  bindModalClose();document.querySelectorAll('[data-add-exercise]').forEach(row=>row.onclick=()=>{const id=row.dataset.addExercise;activeWorkout.exercises.push({exerciseId:id,sets:[newSet(id,0),newSet(id,1),newSet(id,2)]});saveAll();closeModal();renderWorkout();showToast(`${getExercise(id).name} hinzugefügt`)})
}

function modalShell(title,content){return `<div class="modal-backdrop" id="modalBackdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2>${title}</h2><button class="close-btn" id="closeModal">×</button></div>${content}</div></div>`}
function bindModalClose(){document.getElementById('closeModal').onclick=closeModal;document.getElementById('modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()}}
function closeModal(){modalRoot.innerHTML=''}
function bindNav(){document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav))}
function bindRoutineStarts(){document.querySelectorAll('[data-routine]').forEach(card=>card.onclick=()=>startWorkout(card.dataset.routine))}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
document.getElementById('quickStart').onclick=()=>activeWorkout?navigate('workout'):openStartModal();
document.getElementById('themeToggle').onclick=()=>{document.documentElement.classList.toggle('light');localStorage.setItem('form_theme',document.documentElement.classList.contains('light')?'light':'dark')};
if(localStorage.getItem('form_theme')==='light')document.documentElement.classList.add('light');
render();

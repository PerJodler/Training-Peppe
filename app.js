(() => {
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const fmtDate = d => new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
const iso = d => { const x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,10); };
const mins = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const uid = () => Math.random().toString(36).slice(2,10);
const COLORS=['#ff2d20','#ff8a1f','#f4c842','#33c86f','#24a7ff','#7c62ff','#e952b8','#20c7bd'];
const EXERCISES=[
 {id:'ex1',name:'Beinpresse',muscle:'Beine',equipment:'Maschine',icon:'🦵'},
 {id:'ex2',name:'Beinbeuger sitzend',muscle:'Beinbeuger',equipment:'Maschine',icon:'🦵'},
 {id:'ex3',name:'Beinstrecker',muscle:'Quadrizeps',equipment:'Maschine',icon:'🦵'},
 {id:'ex4',name:'Wadenheben stehend',muscle:'Waden',equipment:'Maschine',icon:'⬆️'},
 {id:'ex5',name:'Bulgarian Split Squat',muscle:'Beine',equipment:'Kurzhantel',icon:'🏋️'},
 {id:'ex6',name:'Bankdrücken',muscle:'Brust',equipment:'Langhantel',icon:'🏋️'},
 {id:'ex7',name:'Schrägbankdrücken',muscle:'Brust',equipment:'Kurzhantel',icon:'🏋️'},
 {id:'ex8',name:'Schulterdrücken',muscle:'Schultern',equipment:'Kurzhantel',icon:'💪'},
 {id:'ex9',name:'Seitheben',muscle:'Schultern',equipment:'Kurzhantel',icon:'💪'},
 {id:'ex10',name:'Trizepsdrücken',muscle:'Trizeps',equipment:'Kabelzug',icon:'💪'},
 {id:'ex11',name:'Latzug',muscle:'Rücken',equipment:'Kabelzug',icon:'🔻'},
 {id:'ex12',name:'Rudern sitzend',muscle:'Rücken',equipment:'Kabelzug',icon:'🔻'},
 {id:'ex13',name:'Bizepscurls',muscle:'Bizeps',equipment:'Kurzhantel',icon:'💪'},
 {id:'ex14',name:'Kreuzheben',muscle:'Rücken/Beine',equipment:'Langhantel',icon:'🏋️'},
 {id:'ex15',name:'Plank',muscle:'Core',equipment:'Körpergewicht',icon:'🧱'},
 {id:'ex16',name:'Laufband',muscle:'Cardio',equipment:'Laufband',icon:'🏃'}
];
const defaults={
 plans:[
  {id:'p1',name:'Beine',color:'#ff2d20',notes:'Fokus Beine',exercises:[
   {exerciseId:'ex1',sets:3,reps:12,weight:90,rest:120}, {exerciseId:'ex2',sets:3,reps:12,weight:35,rest:90},{exerciseId:'ex3',sets:3,reps:12,weight:40,rest:90},{exerciseId:'ex4',sets:3,reps:15,weight:50,rest:60}
  ]},
  {id:'p2',name:'Push',color:'#24a7ff',notes:'Brust, Schulter, Trizeps',exercises:[
   {exerciseId:'ex6',sets:3,reps:8,weight:70,rest:150},{exerciseId:'ex7',sets:3,reps:10,weight:28,rest:120},{exerciseId:'ex8',sets:3,reps:10,weight:22,rest:120},{exerciseId:'ex9',sets:3,reps:15,weight:10,rest:60},{exerciseId:'ex10',sets:3,reps:12,weight:25,rest:60}
  ]},
  {id:'p3',name:'Pull',color:'#33c86f',notes:'Rücken und Bizeps',exercises:[
   {exerciseId:'ex11',sets:3,reps:10,weight:55,rest:120},{exerciseId:'ex12',sets:3,reps:10,weight:50,rest:120},{exerciseId:'ex13',sets:3,reps:12,weight:12,rest:60}
  ]},
  {id:'p4',name:'Cardio',color:'#7c62ff',notes:'Ausdauer',exercises:[{exerciseId:'ex16',sets:1,reps:30,weight:0,rest:0}]}
 ],
 sessions:[], restDays:[], customExercises:[], settings:{defaultRest:90,unit:'kg'}
};
const demoDate = new Date(); demoDate.setDate(demoDate.getDate()-2);
defaults.sessions.push({id:'s0',planId:'p2',planName:'Push',color:'#24a7ff',date:iso(demoDate),duration:3120,sets:[{exerciseId:'ex6',sets:[{weight:67.5,reps:8},{weight:67.5,reps:8},{weight:65,reps:9}]}]});
const load=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem('replog-v2')||'{}')}}catch{return structuredClone(defaults)}};
let state=load(); let view='trainings'; let selectedDate=iso(new Date()); let calDate=new Date(); calDate.setDate(1); let modal=null; let workout=null; let complete=null;
const save=()=>localStorage.setItem('replog-v2',JSON.stringify(state));
const allExercises=()=>[...EXERCISES,...state.customExercises];
const exById=id=>allExercises().find(e=>e.id===id) || {name:'Übung',muscle:'',equipment:'',icon:'•'};
const planById=id=>state.plans.find(p=>p.id===id);
function recentFor(exerciseId){
 const sessions=[...state.sessions].sort((a,b)=>b.date.localeCompare(a.date));
 for(const s of sessions){const e=s.sets?.find(x=>x.exerciseId===exerciseId); if(e?.sets?.length)return e.sets;}
 return null;
}
function lastPlanDate(planId){const s=[...state.sessions].filter(x=>x.planId===planId).sort((a,b)=>b.date.localeCompare(a.date))[0]; if(!s)return 'Noch nie'; const days=Math.floor((new Date()-new Date(s.date+'T12:00:00'))/86400000); return days===0?'Heute':days===1?'Gestern':`vor ${days} Tagen`;}
function app(){
 $('#app').innerHTML=`<main class="shell">${top()}${body()}</main>${nav()}${modal?modalHTML():''}${workout?workoutHTML():''}${complete?completeHTML():''}`;
 bind();
}
function top(){return `<header class="topbar"><div class="brand"><div class="brandmark">R</div><div><div class="eyebrow">REPLOG</div><h1>${view==='trainings'?'Trainings':view==='calendar'?'Kalender':view==='history'?'Verlauf':view==='exercises'?'Übungen':'Einstellungen'}</h1></div></div><button class="iconbtn" data-action="quick">＋</button></header>`}
function body(){return ({trainings:trainingsView,calendar:calendarView,history:historyView,exercises:exercisesView,settings:settingsView})[view]();}
function trainingsView(){
 const thisWeek=state.sessions.filter(s=>{const d=new Date(s.date);const n=new Date();return (n-d)/86400000<7}).length;
 return `<section class="hero"><h2>Was steht heute an?</h2><p>Starte eine Einheit, hake deine Sätze ab und swype direkt zur nächsten Übung.</p></section>
 <div class="statgrid"><div class="stat"><b>${thisWeek}</b><span>Trainings · 7 Tage</span></div><div class="stat"><b>${state.sessions.length}</b><span>Einheiten gesamt</span></div><div class="stat"><b>${state.restDays.length}</b><span>Rest Days</span></div></div>
 <section class="section"><div class="section-head"><h3>Trainingseinheiten</h3><button class="textbtn" data-action="add-plan">+ Neu</button></div><div class="cards">${state.plans.map(planCard).join('')}</div></section>
 <div class="hint">Tipp: Im aktiven Training kannst du horizontal swipen. Nach jedem abgehakten Satz startet automatisch der Pausentimer.</div>`;
}
function planCard(p){return `<article class="card plan-card" style="--plan-color:${p.color}"><div><div class="row"><span class="plan-color"></span><span class="eyebrow">${p.exercises.length} Übungen</span></div><h4>${esc(p.name)}</h4><div class="meta">${esc(p.notes||'')} · ${lastPlanDate(p.id)}</div></div><div class="actions"><button class="primary grow" data-action="start" data-id="${p.id}">Starten</button><button class="secondary" data-action="edit-plan" data-id="${p.id}">Bearbeiten</button></div></article>`}
function nav(){const items=[['trainings','◉','Trainings'],['calendar','◫','Kalender'],['history','▦','Verlauf'],['exercises','⬡','Übungen'],['settings','⚙','Einstellungen']];return `<nav class="bottomnav">${items.map(i=>`<button class="navitem ${view===i[0]?'active':''}" data-nav="${i[0]}"><span class="ico">${i[1]}</span><span>${i[2]}</span></button>`).join('')}</nav>`}
function calendarView(){
 const y=calDate.getFullYear(),m=calDate.getMonth(); const first=new Date(y,m,1); const start=(first.getDay()+6)%7; const days=new Date(y,m+1,0).getDate(); const prevDays=new Date(y,m,0).getDate();
 const cells=[]; for(let i=0;i<42;i++){let d, out=false;if(i<start){d=new Date(y,m-1,prevDays-start+i+1);out=true}else if(i>=start+days){d=new Date(y,m+1,i-start-days+1);out=true}else d=new Date(y,m,i-start+1);cells.push(dayCell(d,out));}
 const daySessions=state.sessions.filter(s=>s.date===selectedDate); const rest=state.restDays.includes(selectedDate);
 return `<section class="hero"><h2>Dein Monat.</h2><p>Jeder Kreis zeigt, welche Einheit du an diesem Tag gemacht hast. Zwei Einheiten teilen sich einen Kreis.</p></section>
 <div class="calendar"><div class="cal-head"><button class="iconbtn" data-action="cal-prev">‹</button><b>${new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(calDate)}</b><button class="iconbtn" data-action="cal-next">›</button></div>
 <div class="cal-grid">${['M','D','M','D','F','S','S'].map(d=>`<div class="dow">${d}</div>`).join('')}${cells.join('')}</div></div>
 <section class="section day-detail"><div class="section-head"><h3>${fmtDate(new Date(selectedDate+'T12:00:00'))}</h3><button class="textbtn" data-action="rest">${rest?'Rest Day entfernen':'Rest Day'}</button></div>
 <div class="card">${daySessions.length?daySessions.map(s=>`<div class="session-mini"><span class="dot" style="background:${s.color}"></span><div class="grow"><b>${esc(s.planName)}</b><div class="muted small">${mins(s.duration||0)} min · ${countSets(s)} Sätze</div></div><button class="textbtn" data-action="session-detail" data-id="${s.id}">Details</button></div>`).join(''):''}${rest?`<div class="session-mini"><span class="dot" style="background:#85858d"></span><div class="grow"><b>Rest Day</b><div class="muted small">Bewusster Erholungstag</div></div></div>`:''}${!daySessions.length&&!rest?`<div class="empty"><div class="big">○</div>Noch kein Eintrag für diesen Tag.</div>`:''}</div></section>`;
}
function dayCell(d,out){const date=iso(d), ss=state.sessions.filter(s=>s.date===date), rest=state.restDays.includes(date), colors=ss.map(s=>s.color).slice(0,4);let bg='transparent';if(colors.length===1)bg=colors[0];if(colors.length===2)bg=`conic-gradient(${colors[0]} 0 50%,${colors[1]} 50% 100%)`;if(colors.length===3)bg=`conic-gradient(${colors[0]} 0 33.33%,${colors[1]} 33.33% 66.66%,${colors[2]} 66.66% 100%)`;if(colors.length>=4)bg=`conic-gradient(${colors[0]} 0 25%,${colors[1]} 25% 50%,${colors[2]} 50% 75%,${colors[3]} 75% 100%)`;return `<button class="day ${out?'out':''} ${date===iso(new Date())?'today':''} ${date===selectedDate?'selected':''}" data-date="${date}"><div class="daybubble" style="background:${bg}">${rest?'<span class="rest-badge">☾</span>':''}<span class="daynum">${d.getDate()}</span></div><span class="daylabel">${ss.length?esc(ss[0].planName)+(ss.length>1?' +'+(ss.length-1):''):rest?'Rest':''}</span></button>`}
function historyView(){const sessions=[...state.sessions].sort((a,b)=>(b.date+(b.id||'')).localeCompare(a.date+(a.id||'')));return `<section class="hero"><h2>Verlauf.</h2><p>Hier steht nicht nur, dass du trainiert hast – sondern was, wie viel und mit welchem Gewicht.</p></section><div class="list">${sessions.length?sessions.map(s=>`<button class="listrow" data-action="session-detail" data-id="${s.id}"><span class="dot" style="background:${s.color}"></span><div class="main"><b>${esc(s.planName)}</b><span>${fmtDate(new Date(s.date+'T12:00:00'))} · ${countSets(s)} Sätze · ${mins(s.duration||0)} min</span></div><span class="chev">›</span></button>`).join(''):`<div class="empty">Noch keine Trainings gespeichert.</div>`}</div>`}
function exercisesView(){return `<section class="hero"><h2>Übungsbibliothek.</h2><p>Suche Übungen oder füge deine eigenen hinzu.</p></section><input class="search" id="ex-search" placeholder="Übung suchen …"><section class="section"><div class="list" id="ex-list">${exerciseRows(allExercises())}</div></section>`}
function exerciseRows(arr){return arr.map(e=>`<div class="listrow"><div class="thumb">${e.icon||'🏋️'}</div><div class="main"><b>${esc(e.name)}</b><span>${esc(e.muscle)} · ${esc(e.equipment)}</span></div></div>`).join('') || `<div class="empty">Keine Übungen gefunden.</div>`}
function settingsView(){return `<section class="hero"><h2>Einfach halten.</h2><p>Nur Einstellungen, die dein Training schneller machen.</p></section><div class="card"><div class="field"><label>Standard-Pausentimer (Sekunden)</label><input id="rest-setting" type="number" min="0" max="600" value="${state.settings.defaultRest}"></div><div class="field"><label>Gewichtseinheit</label><div class="pill">Kilogramm (kg)</div></div><button class="primary" data-action="save-settings">Speichern</button></div><section class="section"><button class="danger" data-action="reset">Demo-Daten zurücksetzen</button></section>`}
function modalHTML(){
 if(modal.type==='plan')return planModal(modal.planId);
 if(modal.type==='exercise')return exerciseModal();
 if(modal.type==='session')return sessionModal(modal.id);
 return '';
}
function planModal(planId){const p=editingPlanDraft||(planId?planById(planId):{id:'',name:'',color:COLORS[0],notes:'',exercises:[]});return `<div class="modalback" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()"><div class="row between"><h3>${planId?'Training bearbeiten':'Training hinzufügen'}</h3><button class="iconbtn" data-action="close-modal">×</button></div><div class="field"><label>Name</label><input id="plan-name" value="${escAttr(p.name)}" placeholder="z. B. Beine"></div><div class="field"><label>Farbe</label><div class="colors">${COLORS.map(c=>`<button class="colorpick ${p.color===c?'active':''}" style="background:${c}" data-color="${c}"></button>`).join('')}</div></div><div class="field"><label>Notiz</label><input id="plan-notes" value="${escAttr(p.notes||'')}" placeholder="z. B. Fokus Beine"></div><div class="field"><label>Übungen</label><div id="plan-exercises">${p.exercises.map((x,i)=>planExerciseRow(x,i)).join('')||'<div class="empty">Noch keine Übungen.</div>'}</div></div><button class="secondary" data-action="pick-exercise">+ Übung hinzufügen</button><div class="row" style="margin-top:18px"><button class="primary grow" data-action="save-plan" data-id="${p.id}">Speichern</button>${planId?`<button class="danger" data-action="delete-plan" data-id="${p.id}">Löschen</button>`:''}</div></div></div>`}
function planExerciseRow(x,i){const e=exById(x.exerciseId);return `<div class="listrow" data-planex="${i}"><div class="thumb">${e.icon||'🏋️'}</div><div class="main"><b>${esc(e.name)}</b><span>${x.sets}× ${x.reps} · ${x.weight}${state.settings.unit} · Pause ${x.rest??state.settings.defaultRest}s</span></div><button class="textbtn" data-action="remove-plan-ex" data-i="${i}">×</button></div>`}
function exerciseModal(){return `<div class="modalback" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()"><div class="row between"><h3>Übung hinzufügen</h3><button class="iconbtn" data-action="close-modal">×</button></div><input id="pick-search" class="search" placeholder="Suchen …"><div class="section"><div class="list" id="pick-list">${allExercises().map(e=>`<button class="listrow" data-action="choose-exercise" data-id="${e.id}"><div class="thumb">${e.icon||'🏋️'}</div><div class="main"><b>${esc(e.name)}</b><span>${esc(e.muscle)} · ${esc(e.equipment)}</span></div><span class="chev">＋</span></button>`).join('')}</div></div><button class="secondary" data-action="new-custom-ex">Eigene Übung erstellen</button></div></div>`}
function sessionModal(id){const s=state.sessions.find(x=>x.id===id); if(!s)return'';return `<div class="modalback" data-action="close-modal"><div class="modal" onclick="event.stopPropagation()"><div class="row between"><div><div class="eyebrow">${fmtDate(new Date(s.date+'T12:00:00'))}</div><h3 style="margin-top:4px">${esc(s.planName)}</h3></div><button class="iconbtn" data-action="close-modal">×</button></div><div class="statgrid"><div class="stat"><b>${mins(s.duration||0)}</b><span>Minuten</span></div><div class="stat"><b>${countSets(s)}</b><span>Sätze</span></div><div class="stat"><b>${Math.round(volume(s))}</b><span>${state.settings.unit} Volumen</span></div></div><section class="section"><div class="list">${(s.sets||[]).map(es=>{const e=exById(es.exerciseId);return `<div class="listrow"><div class="thumb">${e.icon}</div><div class="main"><b>${esc(e.name)}</b><span>${es.sets.map(x=>`${x.weight}${state.settings.unit} × ${x.reps}`).join(' · ')}</span></div></div>`}).join('')}</div></section></div></div>`}
function startWorkout(planId){const p=planById(planId);if(!p||!p.exercises.length)return;workout={planId:p.id,planName:p.name,color:p.color,index:0,startedAt:Date.now(),elapsed:0,restLeft:0,restTimer:null,sets:p.exercises.map(pe=>({exerciseId:pe.exerciseId,rest:pe.rest??state.settings.defaultRest,sets:Array.from({length:pe.sets},(_,i)=>({weight:pe.weight,reps:pe.reps,done:false}))}))};app();startClock();}
let clockInt=null;function startClock(){clearInterval(clockInt);clockInt=setInterval(()=>{if(!workout)return clearInterval(clockInt);workout.elapsed=Math.floor((Date.now()-workout.startedAt)/1000);if(workout.restLeft>0){workout.restLeft--;if(workout.restLeft===0){try{navigator.vibrate?.([120,80,120])}catch{}}}updateTimers();},1000)}
function updateTimers(){const a=$('#elapsed');if(a)a.textContent=mins(workout.elapsed);const r=$('#resttime');if(r){r.textContent=workout.restLeft>0?mins(workout.restLeft):'Pause';r.parentElement?.classList.toggle('resting',workout.restLeft>0)}const pb=$('.progressbar i');if(pb)pb.style.width=`${workoutProgress()}%`;}
function workoutProgress(){const total=workout.sets.reduce((n,e)=>n+e.sets.length,0),done=workout.sets.reduce((n,e)=>n+e.sets.filter(s=>s.done).length,0);return total?done/total*100:0}
function workoutHTML(){const p=planById(workout.planId), current=workout.sets[workout.index], pe=p.exercises.find(x=>x.exerciseId===current.exerciseId), e=exById(current.exerciseId), prev=recentFor(e.id);return `<div class="workout" style="--workout-color:${workout.color}"><div class="workout-top"><div class="line1"><button class="iconbtn" data-action="cancel-workout">×</button><div class="workout-title">${esc(workout.planName)}</div><div class="timerbox"><div class="timerchip">⏱ <span id="elapsed">${mins(workout.elapsed)}</span></div><button class="timerchip ${workout.restLeft>0?'resting':''}" data-action="rest-toggle">⏳ <span id="resttime">${workout.restLeft>0?mins(workout.restLeft):'Pause'}</span></button></div></div><div class="progressbar"><i style="width:${workoutProgress()}%"></i></div></div><div class="exercise-stage"><section class="exercise-slide" id="slide"><div class="ex-kicker"><span>ÜBUNG ${workout.index+1} / ${workout.sets.length}</span><span>${esc(e.muscle)}</span></div><h2 class="ex-name">${esc(e.name)}</h2><div class="ex-sub">${esc(e.equipment)} · ${pe?.sets||current.sets.length} Sätze geplant</div><div class="sets">${current.sets.map((s,i)=>setRow(s,i,prev?.[i])).join('')}<div class="last">Letztes Training: ${prev?prev.map(x=>`${x.weight}${state.settings.unit}×${x.reps}`).join(' · '):'noch keine Daten'}</div></div><button class="addset" data-action="add-set">+ Satz hinzufügen</button></section><div class="workout-bottom"><button class="swipebtn" data-action="prev-ex" ${workout.index===0?'disabled':''}>← Zurück</button><div class="dots">${workout.sets.map((_,i)=>`<i class="${i===workout.index?'active':''}"></i>`).join('')}</div><button class="swipebtn next" data-action="${workout.index===workout.sets.length-1?'finish-workout':'next-ex'}">${workout.index===workout.sets.length-1?'Training beenden':'Weiter →'}</button></div></div></div>`}
function setRow(s,i,prev){return `<div class="setrow ${s.done?'done':''}" data-set="${i}"><div class="setnum">${i+1}</div><div class="setcell"><label>Gewicht (${state.settings.unit})</label><input inputmode="decimal" data-set-weight="${i}" value="${s.weight}"></div><div class="setcell"><label>Wiederholungen</label><input inputmode="numeric" data-set-reps="${i}" value="${s.reps}"></div><button class="check" data-action="toggle-set" data-i="${i}">${s.done?'✓':'○'}</button></div>`}
function finishWorkout(){const s={id:uid(),planId:workout.planId,planName:workout.planName,color:workout.color,date:iso(new Date()),duration:workout.elapsed||Math.floor((Date.now()-workout.startedAt)/1000),sets:workout.sets.map(e=>({exerciseId:e.exerciseId,sets:e.sets.filter(x=>x.done).map(x=>({weight:+x.weight,reps:+x.reps}))})).filter(e=>e.sets.length)};state.sessions.push(s);save();complete={session:s};workout=null;clearInterval(clockInt);app();}
function completeHTML(){const s=complete.session;const prev=[...state.sessions].filter(x=>x.planId===s.planId&&x.id!==s.id).sort((a,b)=>b.date.localeCompare(a.date))[0];const cs=countSets(s),ps=prev?countSets(prev):0,cv=Math.round(volume(s)),pv=prev?Math.round(volume(prev)):0;return `<div class="complete" style="--workout-color:${s.color}"><button class="iconbtn" data-action="close-complete">↓</button><h2>Training<br>abgeschlossen!</h2><div class="bigmetric"><div class="label">Dauer</div><div class="value">${mins(s.duration)} min</div><div class="muted small">${prev?`Letztes ${s.planName}-Training: ${mins(prev.duration)} min`:'Erstes gespeichertes Training dieser Einheit'}</div></div><div class="bigmetric"><div class="label">Leistung</div><div class="value">${cs} <span style="font-size:18px">Sätze</span></div><div class="barcompare"><i style="width:${Math.min(100,cs/Math.max(cs,ps||cs)*100)}%"></i></div><div class="muted small" style="margin-top:8px">${ps?`Vorher: ${ps} Sätze`:'Noch kein Vergleich'}</div></div><div class="bigmetric"><div class="label">Volumen</div><div class="value">${cv.toLocaleString('de-DE')} <span style="font-size:18px">${state.settings.unit}</span></div><div class="muted small">${pv?`${cv>=pv?'▲':'▼'} ${Math.abs(cv-pv).toLocaleString('de-DE')} ${state.settings.unit} zum letzten Mal`:'Startwert gespeichert'}</div></div><button class="primary" style="width:100%" data-action="close-complete">Fertig</button></div>`}
function bind(){
 $$('[data-nav]').forEach(b=>b.onclick=()=>{view=b.dataset.nav;app()});
 $$('[data-action]').forEach(b=>b.onclick=(ev)=>{ev.stopPropagation();action(b.dataset.action,b)});
 $$('[data-date]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.date;app()});
 const q=$('#ex-search');if(q)q.oninput=()=>$('#ex-list').innerHTML=exerciseRows(allExercises().filter(e=>`${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(q.value.toLowerCase())));
 const ps=$('#pick-search');if(ps)ps.oninput=()=>{$$('#pick-list .listrow').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(ps.value.toLowerCase())?'':'none')};
 $$('[data-color]').forEach(b=>b.onclick=()=>{$$('[data-color]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
 if(workout)bindWorkout();
}
let editingPlanDraft=null;
function action(a,b){
 if(a==='quick'){if(view==='exercises'){const name=prompt('Name der Übung:');if(name){const muscle=prompt('Muskelgruppe:','Sonstiges')||'Sonstiges';const equipment=prompt('Equipment:','')||'';state.customExercises.push({id:'cx_'+uid(),name,muscle,equipment,icon:'🏋️'});save();app()}}else{editingPlanDraft=null;modal={type:'plan'};app()}}
 if(a==='add-plan'){editingPlanDraft=null;modal={type:'plan'};app()}
 if(a==='edit-plan'){editingPlanDraft=JSON.parse(JSON.stringify(planById(b.dataset.id)));modal={type:'plan',planId:b.dataset.id};app()}
 if(a==='close-modal'){modal=null;editingPlanDraft=null;app()}
 if(a==='start')startWorkout(b.dataset.id);
 if(a==='cal-prev'){calDate.setMonth(calDate.getMonth()-1);app()} if(a==='cal-next'){calDate.setMonth(calDate.getMonth()+1);app()}
 if(a==='rest'){const i=state.restDays.indexOf(selectedDate);if(i>=0){state.restDays.splice(i,1)}else if(state.sessions.some(s=>s.date===selectedDate)){alert('Für diesen Tag ist bereits ein Training gespeichert.')}else{state.restDays.push(selectedDate)}save();app()}
 if(a==='session-detail'){modal={type:'session',id:b.dataset.id};app()}
 if(a==='pick-exercise'){capturePlanForm();modal={type:'exercise'};app()}
 if(a==='choose-exercise'){chooseExercise(b.dataset.id)}
 if(a==='new-custom-ex'){const name=prompt('Name der Übung:');if(!name)return;const muscle=prompt('Muskelgruppe:','Sonstiges')||'Sonstiges';const equipment=prompt('Equipment:','')||'';const e={id:'cx_'+uid(),name,muscle,equipment,icon:'🏋️'};state.customExercises.push(e);save();chooseExercise(e.id)}
 if(a==='remove-plan-ex'){capturePlanForm();editingPlanDraft.exercises.splice(+b.dataset.i,1);modal={type:'plan',planId:editingPlanDraft.id||null};app()}
 if(a==='save-plan')savePlan(b.dataset.id);
 if(a==='delete-plan'){if(confirm('Trainingseinheit wirklich löschen?')){state.plans=state.plans.filter(p=>p.id!==b.dataset.id);save();modal=null;app()}}
 if(a==='save-settings'){state.settings.defaultRest=+$('#rest-setting').value||0;state.settings.unit='kg';save();app()}
 if(a==='reset'){if(confirm('Alle lokalen Daten zurücksetzen?')){localStorage.removeItem('replog-v2');location.reload()}}
 if(a==='toggle-set')toggleSet(+b.dataset.i);
 if(a==='add-set'){workout.sets[workout.index].sets.push({weight:0,reps:10,done:false});app()}
 if(a==='next-ex'){captureWorkoutInputs();workout.index=Math.min(workout.sets.length-1,workout.index+1);app()}
 if(a==='prev-ex'){captureWorkoutInputs();workout.index=Math.max(0,workout.index-1);app()}
 if(a==='finish-workout'){captureWorkoutInputs();finishWorkout()}
 if(a==='cancel-workout'){if(confirm('Aktuelles Training verwerfen?')){workout=null;clearInterval(clockInt);app()}}
 if(a==='rest-toggle'){if(workout.restLeft>0)workout.restLeft=0;else workout.restLeft=state.settings.defaultRest;updateTimers()}
 if(a==='close-complete'){complete=null;view='calendar';selectedDate=iso(new Date());calDate=new Date();calDate.setDate(1);app()}
}
function capturePlanForm(){if(modal?.type!=='plan')return;const id=modal.planId||'';const original=id?planById(id):null;if(!editingPlanDraft)editingPlanDraft=original?JSON.parse(JSON.stringify(original)):{id:'',name:'',color:COLORS[0],notes:'',exercises:[]};editingPlanDraft.name=$('#plan-name')?.value??editingPlanDraft.name;editingPlanDraft.notes=$('#plan-notes')?.value??editingPlanDraft.notes;editingPlanDraft.color=$('[data-color].active')?.dataset.color||editingPlanDraft.color;}
function chooseExercise(id){if(!editingPlanDraft)editingPlanDraft={id:'',name:'',color:COLORS[0],notes:'',exercises:[]};const sets=+prompt('Wie viele Sätze?',3)||3,reps=+prompt('Wiederholungen pro Satz?',10)||10,weight=+prompt(`Startgewicht (${state.settings.unit})?`,0)||0,rest=+prompt('Pausentimer in Sekunden?',state.settings.defaultRest)||0;editingPlanDraft.exercises.push({exerciseId:id,sets,reps,weight,rest});modal={type:'plan',planId:editingPlanDraft.id||null};app();}
function savePlan(id){capturePlanForm();const d=editingPlanDraft||{};if(!d.name?.trim())return alert('Bitte gib der Trainingseinheit einen Namen.');if(!d.exercises?.length)return alert('Füge mindestens eine Übung hinzu.');if(id){const idx=state.plans.findIndex(p=>p.id===id);d.id=id;state.plans[idx]=d}else{d.id=uid();state.plans.push(d)}save();modal=null;editingPlanDraft=null;app();}
function captureWorkoutInputs(){if(!workout)return;const cur=workout.sets[workout.index];$$('[data-set-weight]').forEach(i=>cur.sets[+i.dataset.setWeight].weight=parseFloat(String(i.value).replace(',','.'))||0);$$('[data-set-reps]').forEach(i=>cur.sets[+i.dataset.setReps].reps=parseInt(i.value)||0);}
function toggleSet(i){captureWorkoutInputs();const cur=workout.sets[workout.index];cur.sets[i].done=!cur.sets[i].done;if(cur.sets[i].done){workout.restLeft=cur.rest||state.settings.defaultRest;try{navigator.vibrate?.(35)}catch{}}app();}
function bindWorkout(){const slide=$('#slide');if(!slide)return;let x0=null,y0=null;slide.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});slide.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4){captureWorkoutInputs();if(dx<0&&workout.index<workout.sets.length-1)workout.index++;else if(dx>0&&workout.index>0)workout.index--;app()}x0=y0=null},{passive:true});}
function countSets(s){return (s.sets||[]).reduce((n,e)=>n+(e.sets?.length||0),0)}function volume(s){return (s.sets||[]).reduce((n,e)=>n+(e.sets||[]).reduce((a,x)=>a+(+x.weight||0)*(+x.reps||0),0),0)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}function escAttr(s=''){return esc(s)}
app();
})();

// Daily Proof — app.js (FULL)
// Mobile-first: Today card + collapsible Proof + collapsible Sessions
// Local-first: data lives in localStorage

// ---------- Keys ----------
const THEME_KEY = "dp_theme";
const TRIAL_KEY = "dp_trial_start";
const PAID_KEY  = "dp_paid"; // "monthly" | "lifetime" (local flag for now)

const SESSIONS_KEY = "dp_sessions";
const ACTIVE_FOCUS_KEY = "dp_active_focus";

// ---------- Date helpers ----------
function isoDate(d = new Date()){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
const todayISO = isoDate();
const FOCUSES_KEY = `dp_focuses_${todayISO}`;

// ---------- Access gate (local-first, no backend yet) ----------
function hasAccess(){
  return !!localStorage.getItem(TRIAL_KEY) || !!localStorage.getItem(PAID_KEY);
}
function getTrialDaysUsed(){
  const start = localStorage.getItem(TRIAL_KEY);
  if (!start) return null;
  return Math.floor((Date.now() - new Date(start)) / (1000*60*60*24));
}
function isPaid(){
  return !!localStorage.getItem(PAID_KEY);
}
function canSave(){
  if (isPaid()) return true;
  const days = getTrialDaysUsed();
  if (days === null) return false;
  return days < 7;
}
if (!hasAccess()){
  window.location.href = "./pricing.html";
}

// ---------- DOM ----------
const todayStr = document.getElementById("todayStr");
const trialStatus = document.getElementById("trialStatus");

const themeBtn = document.getElementById("themeBtn");
const exportBtn = document.getElementById("exportBtn");

const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startTimerBtn");
const resetBtn = document.getElementById("resetTimerBtn");

const focusPillsEl = document.getElementById("focusPills");
const focusEmptyEl = document.getElementById("focusEmpty");
const focusInput = document.getElementById("focusInput");
const addFocusBtn = document.getElementById("addFocusBtn");
const clearFocusesBtn = document.getElementById("clearFocusesBtn");

const entryText = document.getElementById("entryText");
const saveSessionBtn = document.getElementById("saveSessionBtn");
const deleteLastBtn = document.getElementById("deleteLastBtn");

const savedTimeEl = document.getElementById("savedTime");
const sessionsListEl = document.getElementById("sessionsList");
const sessionsEmptyEl = document.getElementById("sessionsEmpty");

// Collapsible controls
const openProofBtn = document.getElementById("openProofBtn");
const closeProofBtn = document.getElementById("closeProofBtn");
const proofPanel = document.getElementById("proofPanel");

const openSessionsBtn = document.getElementById("openSessionsBtn");
const closeSessionsBtn = document.getElementById("closeSessionsBtn");
const sessionsPanel = document.getElementById("sessionsPanel");

const toggleFocusBtn = document.getElementById("toggleFocusBtn");
const focusEditor = document.getElementById("focusEditor");

// ---------- UI helpers ----------
function show(el){ el?.classList.add("show"); }
function hide(el){ el?.classList.remove("show"); }
function toggle(el){ el?.classList.toggle("show"); }

todayStr.textContent = new Date().toDateString();

// ---------- Theme (pill toggle) ----------
function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY) || "night";
  setTheme(saved);
  themeBtn?.addEventListener("click", ()=>{
    const cur = localStorage.getItem(THEME_KEY) || "night";
    setTheme(cur === "night" ? "day" : "night");
  });
}
initTheme();

// ---------- JSON helpers ----------
function loadJSON(key, fallback){
  try{
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  }catch{
    return fallback;
  }
}
function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Trial / Plan status ----------
function renderTrial(){
  if (!trialStatus) return;

  if (isPaid()){
    trialStatus.textContent = `Plan: ${localStorage.getItem(PAID_KEY)}`;
    return;
  }

  const days = getTrialDaysUsed();
  if (days === null){
    trialStatus.innerHTML = `No access · <a href="pricing.html">Choose a plan</a>`;
    return;
  }

  if (days < 7){
    trialStatus.textContent = `Trial: ${7 - days} days left`;
    return;
  }

  trialStatus.innerHTML = `Trial ended · <a href="pricing.html">Upgrade</a>`;
}
renderTrial();

// ---------- Collapsible behavior ----------
openProofBtn?.addEventListener("click", ()=>{
  show(proofPanel);
  setTimeout(()=> entryText?.focus(), 80);
});
closeProofBtn?.addEventListener("click", ()=> hide(proofPanel));

openSessionsBtn?.addEventListener("click", ()=>{
  show(sessionsPanel);
  sessionsPanel?.scrollIntoView({ behavior:"smooth", block:"start" });
});
closeSessionsBtn?.addEventListener("click", ()=> hide(sessionsPanel));

toggleFocusBtn?.addEventListener("click", ()=>{
  toggle(focusEditor);
  toggleFocusBtn.textContent = focusEditor?.classList.contains("show") ? "Done" : "Edit";
});

// ---------- Focuses ----------
let focuses = loadJSON(FOCUSES_KEY, []);
let activeFocus = localStorage.getItem(ACTIVE_FOCUS_KEY) || "";

function setActiveFocus(name){
  activeFocus = name;
  localStorage.setItem(ACTIVE_FOCUS_KEY, name);
  renderFocusPills();
}

function addFocus(name){
  const clean = (name || "").trim();
  if (!clean) return;

  const exists = focuses.some(f => f.toLowerCase() === clean.toLowerCase());
  if (!exists) focuses.push(clean);

  saveJSON(FOCUSES_KEY, focuses);

  if (!activeFocus) setActiveFocus(clean);
  renderFocusPills();
}

function clearFocusesToday(){
  focuses = [];
  saveJSON(FOCUSES_KEY, focuses);
  activeFocus = "";
  localStorage.removeItem(ACTIVE_FOCUS_KEY);
  renderFocusPills();
}

function renderFocusPills(){
  if (!focusPillsEl) return;

  focusPillsEl.innerHTML = "";

  if (!focuses.length){
    focusEmptyEl && (focusEmptyEl.style.display = "block");
    return;
  }
  focusEmptyEl && (focusEmptyEl.style.display = "none");

  if (!activeFocus || !focuses.includes(activeFocus)){
    activeFocus = focuses[0];
    localStorage.setItem(ACTIVE_FOCUS_KEY, activeFocus);
  }

  for (const f of focuses){
    const btn = document.createElement("button");
    btn.className = "focusPill" + (f === activeFocus ? " active" : "");
    btn.type = "button";
    btn.textContent = f;
    btn.addEventListener("click", ()=> setActiveFocus(f));
    focusPillsEl.appendChild(btn);
  }
}

addFocusBtn?.addEventListener("click", ()=>{
  addFocus(focusInput?.value);
  if (focusInput){
    focusInput.value = "";
    focusInput.focus();
  }
});
focusInput?.addEventListener("keydown", (e)=>{
  if (e.key === "Enter"){
    e.preventDefault();
    addFocusBtn?.click();
  }
});
clearFocusesBtn?.addEventListener("click", ()=>{
  const ok = confirm("Clear all focuses for today?");
  if (!ok) return;
  clearFocusesToday();
});

renderFocusPills();

// ---------- Timer (Start → Pause → Resume) ----------
let seconds = 0;
let running = false;
let paused = false;
let interval = null;

function formatTime(totalSeconds){
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2,"0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2,"0");
  const ss = String(totalSeconds % 60).padStart(2,"0");
  return `${hh}:${mm}:${ss}`;
}

function renderTimer(){
  if (!timerEl) return;
  timerEl.textContent = formatTime(seconds);

  if (!running && !paused) startBtn.textContent = "Start";
  else if (running) startBtn.textContent = "Pause";
  else if (paused) startBtn.textContent = "Resume";
}

function startTimer(){
  running = true;
  paused = false;
  interval = setInterval(()=>{ seconds++; renderTimer(); }, 1000);
  renderTimer();
}
function pauseTimer(){
  running = false;
  paused = true;
  clearInterval(interval);
  interval = null;
  renderTimer();
}
function stopTimer(){
  running = false;
  paused = false;
  clearInterval(interval);
  interval = null;
  renderTimer();
}

startBtn?.addEventListener("click", ()=>{
  if (!running && !paused) startTimer();
  else if (running) pauseTimer();
  else if (paused) startTimer();
});

resetBtn?.addEventListener("click", ()=>{
  stopTimer();
  seconds = 0;
  renderTimer();
});

renderTimer();

// ---------- Sessions ----------
let sessions = loadJSON(SESSIONS_KEY, []);

function minutesFromSeconds(s){
  return Math.round(s/60);
}

function sessionsToday(){
  return sessions.filter(x => x.date === todayISO);
}

function totalMinutesToday(){
  return sessionsToday().reduce((sum,x)=>sum+(x.minutes||0),0);
}

function renderSessionsToday(){
  const todays = sessionsToday()
    .slice()
    .sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  if (savedTimeEl) savedTimeEl.textContent = `Saved time today: ${totalMinutesToday()} min`;

  const count = todays.length;
  if (openSessionsBtn) openSessionsBtn.textContent = count ? `Sessions (${count})` : "Sessions";

  if (!sessionsListEl) return;
  sessionsListEl.innerHTML = "";

  if (!todays.length){
    sessionsEmptyEl && (sessionsEmptyEl.style.display = "block");
    return;
  }
  sessionsEmptyEl && (sessionsEmptyEl.style.display = "none");

  for (const s of todays){
    const item = document.createElement("div");
    item.className = "sessionItem";

    const top = document.createElement("div");
    top.className = "sessionTop";

    const time = document.createElement("div");
    time.className = "sessionTime";
    const dt = new Date(s.createdAt);
    time.textContent = dt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

    const mins = document.createElement("div");
    mins.className = "sessionMinutes";
    mins.textContent = `${s.minutes} min`;

    top.appendChild(time);
    top.appendChild(mins);

    const focusTag = document.createElement("div");
    focusTag.className = "sessionFocus";
    focusTag.textContent = s.focus ? `Focus: ${s.focus}` : "";

    const txt = document.createElement("div");
    txt.className = "sessionText";
    txt.textContent = s.text || "";

    item.appendChild(top);
    if (s.focus) item.appendChild(focusTag);
    item.appendChild(txt);

    sessionsListEl.appendChild(item);
  }
}
renderSessionsToday();

// Save session
saveSessionBtn?.addEventListener("click", ()=>{
  pauseTimer();

  if (!canSave()){
    alert("Trial ended. Upgrade to keep saving sessions.");
    window.location.href = "./pricing.html";
    return;
  }

  if (!focuses.length){
    alert("Add at least one focus for today first.");
    return;
  }

  if (!activeFocus || !focuses.includes(activeFocus)){
    setActiveFocus(focuses[0]);
  }

  const text = (entryText?.value || "").trim();
  if (!text){
    alert("Write one honest paragraph.");
    return;
  }

  const mins = minutesFromSeconds(seconds);
  if (mins === 0){
    const ok = confirm("Timer is 0 minutes. Save this session anyway?");
    if (!ok) return;
  }

  const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

  sessions.push({
    id,
    date: todayISO,
    minutes: mins,
    focus: activeFocus,
    text,
    createdAt: new Date().toISOString()
  });

  saveJSON(SESSIONS_KEY, sessions);

  if (entryText) entryText.value = "";
  seconds = 0;
  stopTimer();
  renderSessionsToday();

  hide(proofPanel);
});

// Delete last session today
deleteLastBtn?.addEventListener("click", ()=>{
  const todays = sessionsToday()
    .slice()
    .sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  if (!todays.length){
    alert("No sessions to delete today.");
    return;
  }

  const ok = confirm("Delete the most recent session today?");
  if (!ok) return;

  const lastId = todays[0].id;
  sessions = sessions.filter(x => x.id !== lastId);
  saveJSON(SESSIONS_KEY, sessions);

  renderSessionsToday();
});

// Export
exportBtn?.addEventListener("click", ()=>{
  const payload = {
    date: todayISO,
    focuses,
    activeFocus,
    sessions,
    plan: localStorage.getItem(PAID_KEY) || null,
    trial_start: localStorage.getItem(TRIAL_KEY) || null
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-proof-${todayISO}.json`;
  a.click();

  URL.revokeObjectURL(url);
});


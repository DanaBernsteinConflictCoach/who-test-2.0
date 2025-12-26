/* ==========================
   My WHO Thoughts Assessment™ (Official)
   Static site + Google Form submit
   Emailing handled by Google Apps Script
   ========================== */

const STORAGE_KEY = "who_assessment_official_v3";

/* ---------- SAFE CLONE ---------- */
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- GOOGLE FORM CONFIG ---------- */
const GOOGLE_FORM = {
  enabled: true,
  formResponseUrl: "https://docs.google.com/forms/d/e/YOUR_REAL_FORM_ID/formResponse",
  entry: {
    name: "entry.XXXX",
    email: "entry.XXXX",
    consent: "entry.XXXX",
    confirmedValues: "entry.XXXX",
    confirmedPillars: "entry.XXXX",
    movedToValues: "entry.XXXX",
    idealEmotionPrimary: "entry.XXXX",
    idealEmotionSecondary: "entry.XXXX",
    idealEmotionDesire: "entry.XXXX",
    idealEmotionTarget: "entry.XXXX",
    trigger: "entry.XXXX",
    triggerFeeling: "entry.XXXX",
    resetScript: "entry.XXXX"
  }
};

/* ---------- OPTIONS ---------- */

const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er",
  "Efficient","Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty",
  "Impact","Independence","Inclusivity","Integrity","Justice","Kind","Loyalty",
  "Open Mind","Perseverance","Reliability","Resilience","Respect","Self-Reliance",
  "Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident",
  "Connection","Connector","Creative","Explorer","Faith","Family","Fierce",
  "Grounded","Helper","Humor","Impact","Kind","Listener","Love","Optimist",
  "Passion","Peace","Playful","Present","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Inspired","Joy","Peace","Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "Enough","Fast Enough","Good Enough","Heard","Respected","Seen","Valued"
];

/* ---------- STEPS ---------- */

const STEPS = [
  { key:"welcome" },
  { key:"define" },
  { key:"start" },
  { key:"values_discover" },
  { key:"values_roadtest" },
  { key:"pillars_discover" },
  { key:"pillars_roadtest" },
  { key:"ideal_emotion" },
  { key:"trigger" },
  { key:"snapshot" },
  { key:"submitted" }
];

/* ---------- DEFAULT STATE ---------- */

const DEFAULT_STATE = {
  stepIndex: 0,
  user: { name:"", email:"", consent:false },
  values: {
    proudMoment:"",
    proudWhy:"",
    upsetMoment:"",
    upsetWhy:"",
    candidates:[],
    roadtest:{},
    confirmed:[]
  },
  pillars: {
    bestMoment:"",
    candidates:[],
    roadtest1:{},
    roadtest2:{},
    confirmed:[],
    movedToValues:[]
  },
  idealEmotion: {
    primary:"",
    secondary:"",
    desireLevel:5
  },
  trigger: {
    label:"",
    feeling:"",
    resetScript:""
  },
  submit: {
    status:"idle",
    message:""
  }
};

/* ---------- STATE ---------- */

let state = loadState();

/* ---------- STORAGE ---------- */

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...clone(DEFAULT_STATE), ...JSON.parse(raw) } : clone(DEFAULT_STATE);
  }catch{
    return clone(DEFAULT_STATE);
  }
}

/* ---------- HELPERS ---------- */

const uniq = (a) => [...new Set(a)];
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));

/* ---------- NAV ---------- */

function setStep(i){
  state.stepIndex = clamp(i,0,STEPS.length-1);
  saveState();
  render();
}

function next(){ setStep(state.stepIndex+1); }
function back(){ setStep(state.stepIndex-1); }

/* ---------- COMPUTATION (PURE) ---------- */

function computeValues(){
  const confirmed = Object.entries(state.values.roadtest)
    .filter(([_,v])=>v===true)
    .map(([k])=>k);

  return uniq([...confirmed, ...state.pillars.movedToValues]);
}

function computePillars(){
  const moved = Object.entries(state.pillars.roadtest1)
    .filter(([_,v])=>v===true)
    .map(([k])=>k);

  const kept = Object.entries(state.pillars.roadtest2)
    .filter(([_,v])=>v===true)
    .map(([k])=>k);

  return {
    movedToValues: uniq(moved),
    confirmed: uniq(kept)
  };
}

/* ---------- SUBMISSION ---------- */

async function submit(){
  const pillarResult = computePillars();
  const valuesResult = computeValues();

  state.submit = { status:"submitting", message:"Sending your results…" };
  saveState();
  setStep(STEPS.length-1);

  const fd = new FormData();
  fd.append(GOOGLE_FORM.entry.name, state.user.name);
  fd.append(GOOGLE_FORM.entry.email, state.user.email);
  fd.append(GOOGLE_FORM.entry.consent, state.user.consent ? "Yes":"No");
  fd.append(GOOGLE_FORM.entry.confirmedValues, valuesResult.join(", "));
  fd.append(GOOGLE_FORM.entry.confirmedPillars, pillarResult.confirmed.join(", "));
  fd.append(GOOGLE_FORM.entry.movedToValues, pillarResult.movedToValues.join(", "));
  fd.append(GOOGLE_FORM.entry.idealEmotionPrimary, state.idealEmotion.primary);
  fd.append(GOOGLE_FORM.entry.idealEmotionSecondary, state.idealEmotion.secondary);
  fd.append(GOOGLE_FORM.entry.idealEmotionDesire, String(state.idealEmotion.desireLevel));
  fd.append(GOOGLE_FORM.entry.idealEmotionTarget, "8");
  fd.append(GOOGLE_FORM.entry.trigger, state.trigger.label);
  fd.append(GOOGLE_FORM.entry.triggerFeeling, state.trigger.feeling);
  fd.append(GOOGLE_FORM.entry.resetScript, state.trigger.resetScript);

  try{
    await fetch(GOOGLE_FORM.formResponseUrl,{
      method:"POST",
      mode:"no-cors",
      body:fd
    });

    state.submit = {
      status:"success",
      message:"Your results were sent successfully."
    };
  }catch{
    state.submit = {
      status:"error",
      message:"Submission failed. Please try again."
    };
  }

  saveState();
  render();
}

/* ---------- ESCAPE ---------- */

function esc(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

/* ---------- RENDER (stub – your existing HTML renderer plugs here) ---------- */

function render(){
  // KEEP your existing renderStep(), renderNav(), UI markup
  // This refactor only fixes logic + state safety
}

/* ---------- INIT ---------- */
render();

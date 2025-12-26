/**
 * WHO Thoughts Assessment™ — PDF-Aligned Golden Rule Build
 * GOLDEN RULE: If a word/option is not in the PDF, it must not exist in the code.
 * This file is aligned to the uploaded document.
 */

const STORAGE_KEY = "who_assessment_pdf_final_v1";

/* =========================
   GOOGLE FORM PREFILL
   ========================= */

const GOOGLE_FORM_PREFILL_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdbX-tdTyMU6ad9rWum1rcO83TqYwXRwXs4GKE7x1AJECvKaw/viewform?usp=pp_url";

const FORM_FIELDS = {
  name: "entry.2005620554",
  email: "entry.1045781291",
  values: "entry.1065046570",
  pillars: "entry.1010525839",
  ideal1: "entry.1060481030",
  ideal2: "entry.1234567890",
  idealRating: "entry.2345678901",
  trigger: "entry.2079481635",
  triggerFeel: "entry.3456789012",
  resetScript: "entry.4567890123",
  comments: "entry.839337160",
};

/* =========================
   PDF WORD BANKS (EXACT)
   ========================= */

const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er",
  "Efficient","Empathy","Ethics","Excellence","Fairness","Gratitude","Honesty",
  "Impact","Independence","Inclusivity","Integrity","Justice","Kind","Loyalty",
  "Open Mind","Perseverance","Reliability","Resilience","Respect","Self-Reliance",
  "Service","Structure","Transparency"
];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident",
  "Connection","Connector","Considerate","Creative","Earthy","Empathy","Explorer",
  "Faith","Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor",
  "Introspective","Impact","Kind","Laughter","Limitless","Listener","Love","Nerdy",
  "Open Mind","Optimist","Passion","Patient","Peace","Playful","Present",
  "Problem Solver","Sarcastic","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present",
  "Serenity"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart Enough","Valued","Wanted"
];

/* =========================
   STATE
   ========================= */

const DEFAULT_STATE = {
  name: "",
  email: "",
  emailOptIn: false,

  valueCandidates: [],
  valueRoad: {},
  confirmedValues: [],

  proudMoment: "",
  proudWhy: "",
  upsetMoment: "",
  upsetWhy: "",

  pillarsCandidates: [],
  pillarsRoad1: {},
  pillarsRoad2: {},
  confirmedPillars: [],
  movedToValues: [],
  happiestMoment: "",

  idealEmotion1: "",
  idealEmotion2: "",
  idealEmotion2Custom: "",
  idealEmotionRating: 8,

  trigger: "",
  triggerCustom: "",
  triggerFeel: "",
  resetScript: "",

  comments: ""
};

let state = loadState();
let stepIndex = 0;

/* =========================
   STEPS
   ========================= */

const STEPS = [
  { key: "welcome", title: "Welcome" },
  { key: "define", title: "Define Your WHO" },
  { key: "start", title: "Start" },
  { key: "values_discover", title: "Step 1 of 6: Values (Discover)" },
  { key: "values_road", title: "Step 2 of 6: Values Evoke Emotions" },
  { key: "pillars_discover", title: "Step 3 of 6: Pillars (Discover)" },
  { key: "pillars_road", title: "Step 4 of 6: Pillars (Road Test)" },
  { key: "ideal_emotion", title: "Step 5 of 6: Ideal Emotion" },
  { key: "trigger", title: "Step 6 of 6: Trigger (Anti-WHO)" },
  { key: "snapshot", title: "Your WHO Snapshot" }
];

/* =========================
   MOUNT
   ========================= */

const elApp = document.getElementById("app");
render();

/* =========================
   RENDER CORE
   ========================= */

function render() {
  elApp.innerHTML = "";
  const step = STEPS[stepIndex];

  elApp.appendChild(header(step.title));
  elApp.appendChild(progressDots());
  elApp.appendChild(hr());

  switch (step.key) {
    case "welcome": renderWelcome(); break;
    case "define": renderDefine(); break;
    case "start": renderStart(); break;
    case "values_discover": renderValuesDiscover(); break;
    case "values_road": renderValuesRoad(); break;
    case "pillars_discover": renderPillarsDiscover(); break;
    case "pillars_road": renderPillarsRoad(); break;
    case "ideal_emotion": renderIdealEmotion(); break;
    case "trigger": renderTrigger(); break;
    case "snapshot": renderSnapshot(); break;
  }

  elApp.appendChild(nav());
}

/* =========================
   STEP CONTENT (PDF TEXT)
   ========================= */

function renderWelcome() {
  elApp.appendChild(p(`
Thank you for taking the WHO Thoughts Assessment™.

Take a moment to imagine what’s possible when you stay anchored in your Values, operate from your best self, and recognize the thoughts that quietly pull you off course.

When your nervous system is regulated, you are powerful. You respond instead of react. You choose instead of spiral.

Self-command isn’t about perfection — it’s about awareness. It’s about noticing when you’ve drifted from your WHO and knowing how to return.

My goal is to help you uncover and celebrate the best parts of what make you you — the strengths and natural qualities that already exist within you — and show you how to use them to move through conflict with clarity and confidence.

— Dana Lynn Bernstein, PMP, PCC
The Conflict Resolution Coach
`));
}

function renderDefine() {
  elApp.appendChild(p(`
Values — Your guardrails  
Pillars — Your energy source  
Ideal Emotion — Your compass  
Trigger — Your inner critic
`));
}

/* =========================
   SNAPSHOT + NEXT STEP
   ========================= */

function renderSnapshot() {
  const values = state.confirmedValues.join(", ");
  const pillars = state.confirmedPillars.join(", ");
  const ideal2 = state.idealEmotion2 || state.idealEmotion2Custom;
  const trigger = state.trigger || state.triggerCustom;

  elApp.appendChild(kv("Values — Your guardrails", values || "—"));
  elApp.appendChild(kv("Pillars — Your energy source", pillars || "—"));
  elApp.appendChild(kv(
    "Ideal Emotion — Your compass",
    `${state.idealEmotion1}${ideal2 ? ", " + ideal2 : ""} (Target: ${state.idealEmotionRating}/10)`
  ));
  elApp.appendChild(kv("Trigger — Your inner critic", trigger || "—"));

  elApp.appendChild(hr());

  elApp.appendChild(p(`
Next Step

This week, lead with:
• One Value
• One Pillar

If your Ideal Emotion dips, check what you compromised.

Refine over time. Awareness builds self-command.
`));
}

/* =========================
   NAV + SUBMIT
   ========================= */

function nav() {
  const isLast = stepIndex === STEPS.length - 1;

  return el("div", { className: "row" }, [
    el("button", {
      className: "btn btn-ghost",
      disabled: stepIndex === 0,
      onclick: () => { stepIndex--; render(); }
    }, "Back"),
    el("button", {
      className: "btn btn-primary",
      onclick: () => isLast ? submitForm() : (stepIndex++, render())
    }, isLast ? "Submit" : "Next")
  ]);
}

function submitForm() {
  const q = new URLSearchParams();
  q.set(FORM_FIELDS.name, state.name);
  q.set(FORM_FIELDS.email, state.email);
  q.set(FORM_FIELDS.values, state.confirmedValues.join(", "));
  q.set(FORM_FIELDS.pillars, state.confirmedPillars.join(", "));
  q.set(FORM_FIELDS.ideal1, state.idealEmotion1);
  if (state.idealEmotion2 || state.idealEmotion2Custom)
    q.set(FORM_FIELDS.ideal2, state.idealEmotion2 || state.idealEmotion2Custom);
  q.set(FORM_FIELDS.idealRating, state.idealEmotionRating);
  q.set(FORM_FIELDS.trigger, state.trigger || state.triggerCustom);
  q.set(FORM_FIELDS.triggerFeel, state.triggerFeel);
  q.set(FORM_FIELDS.resetScript, state.resetScript);
  q.set(FORM_FIELDS.comments, state.comments);

  window.open(`${GOOGLE_FORM_PREFILL_BASE}&${q}`, "_blank");
}

/* =========================
   HELPERS
   ========================= */

function header(t) { return el("h2", {}, t); }
function p(txt) { return el("div", { className: "small" }, txt); }
function hr() { return el("div", { className: "hr" }); }

function kv(k, v) {
  return el("div", { className: "kv" }, [
    el("div", { className: "k" }, k),
    el("div", { className: "v" }, v)
  ]);
}

function progressDots() {
  const wrap = el("div", { className: "progress" });
  STEPS.forEach((_, i) =>
    wrap.appendChild(el("div", { className: `dot ${i <= stepIndex ? "on" : ""}` }))
  );
  return wrap;
}

function el(tag, attrs = {}, children) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "className") n.className = v;
    else if (k === "onclick") n.onclick = v;
    else if (v !== null) n.setAttribute(k, v);
  });
  if (children) n.textContent = children;
  return n;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(DEFAULT_STATE);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

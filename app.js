/* ==========================
   My WHO Thoughts Assessment™ (Official)
   Static site + Google Form submit
   Emailing is handled by Google Apps Script on the response sheet.
   ========================== */

const STORAGE_KEY = "who_assessment_official_v2";

/**
 * REQUIRED CONFIG (you must fill these):
 * 1) formResponseUrl must be the Google Form "formResponse" endpoint
 * 2) entry IDs must match your Form questions
 *
 * How to get entry IDs:
 * - Open Google Form > Preview
 * - View page source
 * - Search for "entry."
 */
const GOOGLE_FORM = {
  enabled: true,
  formResponseUrl: "https://docs.google.com/forms/d/e/PASTE_YOUR_FORM_ID/formResponse",
  entry: {
    // Basics
    name: "entry.0000000000",
    email: "entry.0000000001",
    consent: "entry.0000000002",

    // Results
    confirmedValues: "entry.0000000003",
    confirmedPillars: "entry.0000000004",
    movedToValues: "entry.0000000005",

    idealEmotionPrimary: "entry.0000000006",
    idealEmotionSecondary: "entry.0000000007",
    idealEmotionDesire: "entry.0000000008",   // 1–10
    idealEmotionTarget: "entry.0000000009",   // always 8

    trigger: "entry.0000000010",
    triggerFeeling: "entry.0000000011",
    resetScript: "entry.0000000012"
  }
};

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
  "Open Mind","Optimist","Passion","Patient","Peace","Playful","Present","Problem Solver",
  "Sarcastic","Service"
];

const IDEAL_EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Gratitude","Happiness","Inspired","Joy","Peace","Playful","Present","Serenity"
];

const TRIGGER_OPTIONS = [
  "Capable","Enough","Fast Enough","Good Enough","Heard","Listened to","Respected",
  "Seen","Smart Enough","Valued","Wanted"
];

const STEPS = [
  { key:"welcome", title:"Welcome" },
  { key:"define", title:"Define Your WHO" },
  { key:"start", title:"Start" },
  { key:"values_discover", title:"Step 1 of 6: Values (Discover)" },
  { key:"values_roadtest", title:"Step 2 of 6: Values (Road Test)" },
  { key:"pillars_discover", title:"Step 3 of 6: Pillars (Discover)" },
  { key:"pillars_roadtest", title:"Step 4 of 6: Pillars (Road Test)" },
  { key:"ideal_emotion", title:"Step 5 of 6: Ideal Emotion" },
  { key:"trigger", title:"Step 6 of 6: Trigger (Anti-WHO)" },
  { key:"snapshot", title:"Your WHO Snapshot" },
  { key:"submitted", title:"Submitted" }
];

const DEFAULT_STATE = {
  stepIndex: 0,

  user: { name:"", email:"", consent:false },

  values: {
    proudMoment: "",
    proudWhy: "",
    upsetMoment: "",
    upsetWhy: "",
    candidates: [],
    confirmed: [],
    roadtestAnswers: {} // {value: true/false}
  },

  pillars: {
    bestMoment: "",
    candidates: [],
    confirmed: [],
    movedToValues: [],
    roadtest1: {}, // {pillar: true/false} true => move to values
    roadtest2: {}  // {pillar: true/false} true => keep
  },

  idealEmotion: {
    primary: "",
    secondary: "",
    targetLevel: 8,
    desireLevel: 5 // slider 1-10
  },

  trigger: {
    label: "",
    feeling: "",
    resetScript: ""
  },

  lastSubmit: {
    status: "idle", // idle | submitting | success | error
    message: ""
  }
};

let state = loadState();

const elApp = document.getElementById("app");
const elYear = document.getElementById("year");
if (elYear) elYear.textContent = new Date().getFullYear();

const btnReset = document.getElementById("btnReset");
if (btnReset){
  btnReset.addEventListener("click", () => {
    if (!confirm("Reset all answers?")) return;
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  }catch{
    return structuredClone(DEFAULT_STATE);
  }
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function uniq(arr){ return [...new Set(arr.map(s => String(s).trim()).filter(Boolean))]; }
function removeItem(arr, item){ return arr.filter(x => x !== item); }

function setStep(idx){
  state.stepIndex = clamp(idx, 0, STEPS.length - 1);
  saveState();
  render();
}

function nextStep(){
  if (!canProceed()) return;
  setStep(state.stepIndex + 1);
}
function prevStep(){ setStep(state.stepIndex - 1); }

function progressPercent(){
  const effectiveMax = STEPS.length - 2; // exclude "submitted"
  const idx = Math.min(state.stepIndex, effectiveMax);
  return Math.round((idx / effectiveMax) * 100);
}

function canProceed(){
  const k = STEPS[state.stepIndex].key;

  if (k === "start"){
    return state.user.name.trim().length > 0;
  }
  if (k === "values_discover"){
    return state.values.candidates.length >= 3 && state.values.candidates.length <= 6;
  }
  if (k === "values_roadtest"){
    const c = state.values.candidates;
    return c.length > 0 && c.every(v => typeof state.values.roadtestAnswers[v] === "boolean");
  }
  if (k === "pillars_discover"){
    return state.pillars.candidates.length >= 3 && state.pillars.candidates.length <= 6;
  }
  if (k === "pillars_roadtest"){
    const c = state.pillars.candidates;
    if (!(c.length > 0 && c.every(p => typeof state.pillars.roadtest1[p] === "boolean"))) return false;
    const remaining = c.filter(p => state.pillars.roadtest1[p] === false);
    return remaining.every(p => typeof state.pillars.roadtest2[p] === "boolean");
  }
  if (k === "ideal_emotion"){
    return state.idealEmotion.primary.trim().length > 0 && state.idealEmotion.desireLevel >= 1;
  }
  if (k === "trigger"){
    return state.trigger.label.trim().length > 0 && state.trigger.feeling.trim().length > 0;
  }
  return true;
}

function computeConfirmedValues(){
  const confirmed = [];
  for (const v of state.values.candidates){
    if (state.values.roadtestAnswers[v] === true) confirmed.push(v);
  }
  state.values.confirmed = uniq(confirmed);
  state.values.confirmed = uniq([...state.values.confirmed, ...(state.pillars.movedToValues || [])]);
}

function computePillarsOutcomes(){
  const movedToValues = [];
  const remaining = [];

  for (const p of state.pillars.candidates){
    if (state.pillars.roadtest1[p] === true) movedToValues.push(p);
    else remaining.push(p);
  }

  const confirmed = [];
  for (const p of remaining){
    if (state.pillars.roadtest2[p] === true) confirmed.push(p);
  }

  state.pillars.movedToValues = uniq(movedToValues);
  state.pillars.confirmed = uniq(confirmed);

  computeConfirmedValues();
}

function toggleBoundedArray(group, field, value, max){
  const arr = state[group][field];
  if (arr.includes(value)){
    state[group][field] = removeItem(arr, value);
  } else {
    if (arr.length >= max) return;
    state[group][field] = uniq([...arr, value]);
  }
  saveState(); render();
}

function addBoundedArray(group, field, raw, max){
  const v = String(raw || "").trim();
  if (!v) return;

  const arr = state[group][field];
  if (!arr.includes(v) && arr.length >= max) return;

  state[group][field] = uniq([...arr, v]);
  saveState(); render();

  setTimeout(() => {
    const el = document.getElementById(group === "values" ? "addValue" : "addPillar");
    if (el) el.value = "";
  }, 0);
}

function render(){
  const step = STEPS[state.stepIndex];
  elApp.innerHTML = `
    ${renderProgress()}
    ${renderStep(step.key)}
    ${renderNav()}
  `;
  wireCommonHandlers();
}

function renderProgress(){
  const pct = progressPercent();
  const step = STEPS[state.stepIndex];
  return `
    <section class="card">
      <div class="kicker">${escapeHtml(step.title)}</div>
      <div class="progressWrap">
        <div class="progressBar"><div class="progressFill" style="width:${pct}%"></div></div>
        <div class="progressMeta">
          <div>${pct}% complete</div>
          <div>${Math.min(state.stepIndex + 1, STEPS.length - 1)} / ${STEPS.length - 1}</div>
        </div>
      </div>
    </section>
  `;
}

function renderNav(){
  const key = STEPS[state.stepIndex].key;
  const isSubmitted = key === "submitted";

  const canBack = state.stepIndex > 0 && !isSubmitted;
  const canNext = state.stepIndex < STEPS.length - 1 && !isSubmitted;
  const proceed = canProceed();

  const isSnapshot = key === "snapshot";

  return `
    <section class="card">
      <div class="btnrow">
        <div class="leftBtns">
          <button id="btnBack" class="ghost" type="button" ${canBack ? "" : "disabled"}>Back</button>
        </div>

        <div class="leftBtns">
          ${isSnapshot ? `<button id="btnFinalSubmit" class="primary" type="button">Submit Results</button>` : ""}
          ${!isSnapshot && !isSubmitted ? `<button id="btnNext" class="primary" type="button" ${canNext && proceed ? "" : "disabled"}>Next</button>` : ""}
          ${isSubmitted ? `<button id="btnRestart" class="ghost" type="button">Start Over</button>` : ""}
        </div>
      </div>

      ${(!proceed && canNext) ? `<div class="small">Complete the required items on this step to continue.</div>` : ""}
    </section>
  `;
}

function wireCommonHandlers(){
  const btnBack = document.getElementById("btnBack");
  const btnNext = document.getElementById("btnNext");
  const btnFinalSubmit = document.getElementById("btnFinalSubmit");
  const btnRestart = document.getElementById("btnRestart");

  if (btnBack) btnBack.addEventListener("click", prevStep);

  if (btnNext) btnNext.addEventListener("click", () => {
    const k = STEPS[state.stepIndex].key;
    if (k === "values_roadtest") computeConfirmedValues();
    if (k === "pillars_roadtest") computePillarsOutcomes();
    nextStep();
  });

  if (btnFinalSubmit) btnFinalSubmit.addEventListener("click", submitToDana);

  if (btnRestart) btnRestart.addEventListener("click", () => {
    state = structuredClone(DEFAULT_STATE);
    saveState();
    render();
  });
}

function renderStep(key){
  switch(key){
    case "welcome": return stepWelcome();
    case "define": return stepDefine();
    case "start": return stepStart();
    case "values_discover": return stepValuesDiscover();
    case "values_roadtest": return stepValuesRoadtest();
    case "pillars_discover": return stepPillarsDiscover();
    case "pillars_roadtest": return stepPillarsRoadtest();
    case "ideal_emotion": return stepIdealEmotion();
    case "trigger": return stepTrigger();
    case "snapshot": return stepSnapshot();
    case "submitted": return stepSubmitted();
    default: return `<section class="card"><div class="h1">Missing step</div></section>`;
  }
}

/* ========== Steps ========== */

function stepWelcome(){
  return `
    <section class="card">
      <div class="h1">Welcome</div>
      <p class="p">
        Thank you for taking the WHO Thoughts Assessment™.
        Take a moment to imagine what’s possible when you stay anchored in your Values,
        operate from your best self, and recognize the thoughts that quietly pull you off course.
      </p>
      <p class="p">
        When your nervous system is regulated, you are powerful. You respond instead of react.
        You choose instead of spiral.
      </p>
      <p class="p">
        Self-command isn’t about perfection — it’s about awareness. It’s about noticing when you’ve
        drifted from your WHO and knowing how to return.
      </p>
      <hr class="sep" />
      <p class="p">
        — Dana Lynn Bernstein, PMP, PCC<br/>
        The Conflict Resolution Coach
      </p>
    </section>
  `;
}

function stepDefine(){
  return `
    <section class="card">
      <div class="h1">Define Your WHO</div>
      <p class="p">
        Your WHO is defined by:
        <b>Values</b> (guardrails) • <b>Pillars</b> (energy source) • <b>Ideal Emotion</b> (compass) • <b>Trigger</b> (warning signal).
      </p>
      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values — Your guardrails</h3>
          <ul class="ul">
            <li>Non-negotiables</li>
            <li>When crossed, evoke emotion</li>
          </ul>
        </div>
        <div class="snapshotBox">
          <h3>Pillars — Your energy source</h3>
          <ul class="ul">
            <li>Core strengths at your best</li>
            <li>Without them, you feel like a shell</li>
          </ul>
        </div>
        <div class="snapshotBox">
          <h3>Ideal Emotion — Your compass</h3>
          <ul class="ul">
            <li>What you want to feel daily</li>
            <li>Guides choices and responses</li>
          </ul>
        </div>
        <div class="snapshotBox">
          <h3>Trigger — Your warning signal</h3>
          <ul class="ul">
            <li>“I’m not ___ enough” story</li>
            <li>Shows up under pressure</li>
          </ul>
        </div>
      </div>
      <hr class="sep" />
      <div class="notice">
        Dana receives your results when you submit. If you enter an email and check consent, you’ll receive a copy too.
      </div>
    </section>
  `;
}

function stepStart(){
  return `
    <section class="card">
      <div class="h1">Start</div>

      <label class="lbl">Your name <span class="small">(required)</span></label>
      <input id="userName" class="txt" placeholder="Type your name" value="${escapeHtml(state.user.name)}" />

      <label class="lbl">Your email <span class="small">(optional)</span></label>
      <input id="userEmail" class="txt" placeholder="you@email.com" value="${escapeHtml(state.user.email)}" />

      <div style="margin-top:12px;">
        <label style="display:flex; gap:10px; align-items:flex-start; cursor:pointer;">
          <input id="userConsent" type="checkbox" ${state.user.consent ? "checked" : ""} />
          <span>
            Email my results and bonus content. <span class="small">Email is optional.</span>
          </span>
        </label>
        <div class="small">
          If you provide an email + check consent, Dana’s system will send you a copy of your results.
        </div>
      </div>
    </section>
  `;
}

function stepValuesDiscover(){
  const selected = state.values.candidates;

  return `
    <section class="card">
      <div class="h1">Values</div>
      <p class="p">
        Two ways to uncover your Values: (1) your proudest moment, and (2) what makes you upset.
        Build 3–6 candidate Values.
      </p>

      <div class="grid2">
        <div>
          <div class="h2">Prompt A: Proud Moment</div>
          <label class="lbl">When were you most proud of yourself?</label>
          <textarea id="proudMoment" class="ta" placeholder="Example: I accomplished...">${escapeHtml(state.values.proudMoment)}</textarea>

          <label class="lbl">Why were you proud?</label>
          <textarea id="proudWhy" class="ta" placeholder="Example: I overcame obstacles by...">${escapeHtml(state.values.proudWhy)}</textarea>
        </div>

        <div>
          <div class="h2">Prompt B: Upset / Anger Moment</div>
          <label class="lbl">When were you angry, frustrated, or furious?</label>
          <textarea id="upsetMoment" class="ta" placeholder="Example: When someone said/did...">${escapeHtml(state.values.upsetMoment)}</textarea>

          <label class="lbl">What exactly bothered you / why?</label>
          <textarea id="upsetWhy" class="ta" placeholder="Example: They were not being transparent, respectful...">${escapeHtml(state.values.upsetWhy)}</textarea>
        </div>
      </div>

      <hr class="sep" />

      <div class="h2">Select 3–6 Values (tap)</div>
      <div class="small">Or add custom. We’ll road-test next.</div>
      <div class="pills">
        ${VALUE_OPTIONS.map(v => pill(v, selected.includes(v))).join("")}
      </div>

      <div style="margin-top:12px;">
        <label class="lbl">Add a candidate (press Enter)</label>
        <input id="addValue" class="txt" placeholder="Type a Value and press Enter" />
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Current candidates</div>
        ${renderCandidateList(selected, "values")}
        <div class="small">Selected: ${selected.length} / 6</div>
      </div>
    </section>
  `;
}

function stepValuesRoadtest(){
  const candidates = state.values.candidates;

  return `
    <section class="card">
      <div class="h1">Values Road Test</div>
      <p class="p">
        Road test each candidate.
        <span class="small">YES = keep • NO = remove</span>
      </p>

      <div class="list" style="margin-top:12px;">
        ${candidates.map(v => {
          const ans = state.values.roadtestAnswers[v];
          const yesOn = ans === true;
          const noOn = ans === false;

          return `
            <div class="row">
              <div>
                <div class="name">${escapeHtml(v)}</div>
                <div class="small">If someone violates this, do you feel upset / angry / frustrated?</div>
              </div>
              <div class="actions">
                <button class="${yesOn ? "primary" : ""}" data-v-ans="yes" data-v="${escapeHtmlAttr(v)}" type="button">YES</button>
                <button class="${noOn ? "danger" : ""}" data-v-ans="no" data-v="${escapeHtmlAttr(v)}" type="button">NO</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <hr class="sep" />

      <div class="h2">Live results</div>
      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Confirmed Values</h3>
          <ul class="ul">${liveConfirmedValues().map(li).join("") || `<li class="small">Answer YES/NO above.</li>`}</ul>
        </div>
        <div class="snapshotBox">
          <h3>Practical Application</h3>
          <ul class="ul">
            <li>These are your guardrails.</li>
            <li>When crossed, emotions spike.</li>
            <li>Use them to de-escalate faster.</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

function stepPillarsDiscover(){
  const selected = state.pillars.candidates;

  return `
    <section class="card">
      <div class="h1">Pillars</div>
      <p class="p">
        Pillars are positive core characteristics that describe you at your best (not tied to achievement).
      </p>

      <div class="h2">Prompt: Happiest / Best Self</div>
      <label class="lbl">When were you your happiest and most YOU? (Where / with who / doing what?)</label>
      <textarea id="bestMoment" class="ta" placeholder="Example: Hiking in the woods...">${escapeHtml(state.pillars.bestMoment)}</textarea>

      <hr class="sep" />

      <div class="h2">Select 3–6 Pillars (tap)</div>
      <div class="small">Or add custom. We’ll road-test next.</div>
      <div class="pills">
        ${PILLAR_OPTIONS.map(p => pillPillar(p, selected.includes(p))).join("")}
      </div>

      <div style="margin-top:12px;">
        <label class="lbl">Add Pillar candidates (press Enter)</label>
        <input id="addPillar" class="txt" placeholder="Type a trait and press Enter" />
      </div>

      <div style="margin-top:14px;">
        <div class="h2">Current candidates</div>
        ${renderCandidateList(selected, "pillars")}
        <div class="small">Selected: ${selected.length} / 6</div>
      </div>
    </section>
  `;
}

function stepPillarsRoadtest(){
  const candidates = state.pillars.candidates;
  const remaining = candidates.filter(p => state.pillars.roadtest1[p] === false);

  return `
    <section class="card">
      <div class="h1">Pillars Road Test</div>

      <p class="p">
        <b>Road Test 1</b>: If someone crosses this characteristic, do you get angry/frustrated/upset?
        <br/><span class="small">YES = move to Values • NO = keep as a Pillar</span>
      </p>

      <div class="list">
        ${candidates.map(p => {
          const ans = state.pillars.roadtest1[p];
          const yesOn = ans === true;
          const noOn = ans === false;

          return `
            <div class="row">
              <div>
                <div class="name">${escapeHtml(p)}</div>
                <div class="small">Road Test 1</div>
              </div>
              <div class="actions">
                <button class="${yesOn ? "primary" : ""}" data-p1-ans="yes" data-p="${escapeHtmlAttr(p)}" type="button">YES</button>
                <button class="${noOn ? "danger" : ""}" data-p1-ans="no" data-p="${escapeHtmlAttr(p)}" type="button">NO</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <hr class="sep" />

      <p class="p">
        <b>Road Test 2</b>: For remaining Pillars, if you took these away, would you be a shell of yourself?
        <br/><span class="small">YES = keep • NO = remove</span>
      </p>

      <div class="list">
        ${remaining.map(p => {
          const ans = state.pillars.roadtest2[p];
          const yesOn = ans === true;
          const noOn = ans === false;

          return `
            <div class="row">
              <div>
                <div class="name">${escapeHtml(p)}</div>
                <div class="small">Road Test 2</div>
              </div>
              <div class="actions">
                <button class="${yesOn ? "primary" : ""}" data-p2-ans="yes" data-p="${escapeHtmlAttr(p)}" type="button">YES</button>
                <button class="${noOn ? "danger" : ""}" data-p2-ans="no" data-p="${escapeHtmlAttr(p)}" type="button">NO</button>
              </div>
            </div>
          `;
        }).join("") || `<div class="small">Answer Road Test 1 first.</div>`}
      </div>

      <hr class="sep" />

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Confirmed Pillars</h3>
          <ul class="ul">${liveConfirmedPillars().map(li).join("") || `<li class="small">Answer above.</li>`}</ul>
        </div>
        <div class="snapshotBox">
          <h3>Moved to Values</h3>
          <ul class="ul">${uniq(candidates.filter(p => state.pillars.roadtest1[p] === true)).map(li).join("") || `<li class="small">Answer above.</li>`}</ul>
        </div>
      </div>
    </section>
  `;
}

function stepIdealEmotion(){
  return `
    <section class="card">
      <div class="h1">Ideal Emotion</div>
      <p class="p">
        Your Ideal Emotion is what you want to feel each day (it’s okay to have 2).
      </p>

      <label class="lbl">Pick one (or your closest)</label>
      <select id="idealPrimary" class="sel">
        <option value="">Select…</option>
        ${IDEAL_EMOTION_OPTIONS.map(o => `<option ${state.idealEmotion.primary === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
      </select>

      <label class="lbl">How much do you want to feel your Ideal Emotion? (1–10)</label>
      <input id="idealDesire" type="range" min="1" max="10" value="${state.idealEmotion.desireLevel}" style="width:100%;" />
      <div class="small">Current: <b>${state.idealEmotion.desireLevel}/10</b> (Target: <b>8/10</b>)</div>

      <label class="lbl">Second Ideal Emotion (optional)</label>
      <select id="idealSecondary" class="sel">
        <option value="">Select…</option>
        ${IDEAL_EMOTION_OPTIONS.map(o => `<option ${state.idealEmotion.secondary === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
      </select>

      <hr class="sep" />
      <div class="h2">Alignment Check</div>
      <ul class="ul">
        <li>Which Value did I compromise?</li>
        <li>Which Pillar am I not embodying?</li>
        <li>Is my Trigger leading?</li>
        <li>What action realigns me?</li>
      </ul>
    </section>
  `;
}

function stepTrigger(){
  const label = state.trigger.label;

  return `
    <section class="card">
      <div class="h1">Trigger (Anti-WHO)</div>
      <p class="p">
        Pick one from the list OR add a custom one.
      </p>

      <div class="pills">
        ${TRIGGER_OPTIONS.map(t => {
          const full = `I'm not ${t}`;
          const on = label === full;
          return `<button class="pill ${on ? "on" : ""}" data-trigger="${escapeHtmlAttr(full)}" type="button">${escapeHtml(full)}</button>`;
        }).join("")}
      </div>

      <div style="margin-top:12px;">
        <label class="lbl">Custom trigger (optional)</label>
        <input id="customTrigger" class="txt" placeholder="Example: I'm not safe / I'm not in control..." value="${escapeHtml(label.startsWith("I'm not ") ? "" : label)}" />
        <div class="small">Typing here overrides the selection.</div>
      </div>

      <label class="lbl">Name how it makes you feel</label>
      <input id="triggerFeeling" class="txt" placeholder="Example: anxious, small, demoralized..." value="${escapeHtml(state.trigger.feeling)}" />

      <label class="lbl">Optional Reset Script</label>
      <textarea id="resetScript" class="ta" placeholder="That’s my Trigger talking. I’m choosing [Pillar] and honoring [Value].">${escapeHtml(state.trigger.resetScript)}</textarea>
    </section>
  `;
}

function stepSnapshot(){
  computePillarsOutcomes();
  computeConfirmedValues();

  const values = state.values.confirmed;
  const pillars = state.pillars.confirmed;

  return `
    <section class="card">
      <div class="h1">Your WHO Snapshot</div>

      <div class="snapshot">
        <div class="snapshotBox">
          <h3>Values — Your guardrails</h3>
          <ul class="ul">${values.map(li).join("") || `<li class="small">None confirmed yet.</li>`}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Pillars — Your energy source</h3>
          <ul class="ul">${pillars.map(li).join("") || `<li class="small">None confirmed yet.</li>`}</ul>
        </div>

        <div class="snapshotBox">
          <h3>Ideal Emotion — Your compass</h3>
          <ul class="ul">
            ${state.idealEmotion.primary ? `<li>${escapeHtml(state.idealEmotion.primary)} (${state.idealEmotion.desireLevel}/10)</li>` : `<li class="small">Not set.</li>`}
            ${state.idealEmotion.secondary ? `<li>${escapeHtml(state.idealEmotion.secondary)}</li>` : ``}
          </ul>
        </div>

        <div class="snapshotBox">
          <h3>Trigger — your warning signal</h3>
          <ul class="ul">
            ${state.trigger.label ? `<li>${escapeHtml(state.trigger.label)}</li>` : `<li class="small">Not set.</li>`}
            ${state.trigger.feeling ? `<li>Feels like: ${escapeHtml(state.trigger.feeling)}</li>` : ``}
          </ul>
        </div>
      </div>

      <hr class="sep" />

      <div class="h2">Next Step</div>
      <ul class="ul">
        <li>This week, lead with: <b>${escapeHtml(values[0] || "One Value")}</b></li>
        <li>And embody: <b>${escapeHtml(pillars[0] || "One Pillar")}</b></li>
        <li>If your Ideal Emotion dips, check what you compromised.</li>
      </ul>

      <div class="notice" style="margin-top:12px;">
        When you click <b>Submit Results</b>, Dana will receive your results.
        If you provided an email + checked consent, you’ll receive a “thank you” email with your results too.
      </div>
    </section>
  `;
}

function stepSubmitted(){
  const msg = state.lastSubmit.message || "";
  const ok = state.lastSubmit.status === "success";
  const err = state.lastSubmit.status === "error";

  return `
    <section class="card">
      <div class="h1">${ok ? "Submitted!" : err ? "Submission Issue" : "Submitting..."}</div>
      <p class="p">
        ${ok
          ? "Your results were sent successfully."
          : err
            ? "We couldn’t submit your results. Try again or refresh."
            : "Sending your results now..."}
      </p>
      ${msg ? `<div class="notice">${escapeHtml(msg)}</div>` : ""}
      ${err ? `<div class="small" style="margin-top:10px;">Most common fix: Google Form entry IDs aren’t set correctly.</div>` : ""}
    </section>
  `;
}

/* ========== Global Events ========== */

document.addEventListener("input", (e) => {
  const id = e.target?.id;

  if (id === "userName"){ state.user.name = e.target.value; saveState(); render(); }
  if (id === "userEmail"){ state.user.email = e.target.value; saveState(); render(); }

  if (id === "proudMoment"){ state.values.proudMoment = e.target.value; saveState(); }
  if (id === "proudWhy"){ state.values.proudWhy = e.target.value; saveState(); }
  if (id === "upsetMoment"){ state.values.upsetMoment = e.target.value; saveState(); }
  if (id === "upsetWhy"){ state.values.upsetWhy = e.target.value; saveState(); }

  if (id === "bestMoment"){ state.pillars.bestMoment = e.target.value; saveState(); }

  if (id === "idealDesire"){ state.idealEmotion.desireLevel = Number(e.target.value); saveState(); render(); }

  // ✅ THIS WAS THE BUG IN YOUR CURRENT FILE — fixed here:
  if (id === "triggerFeeling"){
    state.trigger.feeling = e.target.value;
    saveState();
    render();
  }

  if (id === "resetScript"){ state.trigger.resetScript = e.target.value; saveState(); }
  if (id === "customTrigger"){
    const v = e.target.value.trim();
    if (v) state.trigger.label = v;
    saveState(); render();
  }
});

document.addEventListener("change", (e) => {
  const id = e.target?.id;

  if (id === "userConsent"){ state.user.consent = !!e.target.checked; saveState(); }
  if (id === "idealPrimary"){ state.idealEmotion.primary = e.target.value; saveState(); render(); }
  if (id === "idealSecondary"){ state.idealEmotion.secondary = e.target.value; saveState(); render(); }
});

document.addEventListener("click", (e) => {
  const t = e.target;

  if (t?.dataset?.value) toggleBoundedArray("values","candidates", t.dataset.value, 6);
  if (t?.dataset?.pillar) toggleBoundedArray("pillars","candidates", t.dataset.pillar, 6);

  if (t?.dataset?.removeValue){
    const v = t.dataset.removeValue;
    state.values.candidates = removeItem(state.values.candidates, v);
    delete state.values.roadtestAnswers[v];
    saveState(); render();
  }
  if (t?.dataset?.removePillar){
    const p = t.dataset.removePillar;
    state.pillars.candidates = removeItem(state.pillars.candidates, p);
    delete state.pillars.roadtest1[p];
    delete state.pillars.roadtest2[p];
    saveState(); render();
  }

  if (t?.dataset?.vAns && t?.dataset?.v){
    const v = t.dataset.v;
    const isYes = t.dataset.vAns === "yes";
    state.values.roadtestAnswers[v] = isYes;

    if (!isYes){
      state.values.candidates = removeItem(state.values.candidates, v);
      delete state.values.roadtestAnswers[v];
    }

    saveState(); render();
  }

  if (t?.dataset?.p1Ans && t?.dataset?.p){
    const p = t.dataset.p;
    const isYes = t.dataset.p1Ans === "yes";
    state.pillars.roadtest1[p] = isYes;
    saveState(); render();
  }

  if (t?.dataset?.p2Ans && t?.dataset?.p){
    const p = t.dataset.p;
    const isYes = t.dataset.p2Ans === "yes";
    state.pillars.roadtest2[p] = isYes;

    if (!isYes){
      state.pillars.candidates = removeItem(state.pillars.candidates, p);
      delete state.pillars.roadtest1[p];
      delete state.pillars.roadtest2[p];
    }

    saveState(); render();
  }

  if (t?.dataset?.trigger){
    state.trigger.label = t.dataset.trigger;
    saveState(); render();
  }
});

document.addEventListener("keydown", (e) => {
  const id = e.target?.id;
  if (id === "addValue" && e.key === "Enter"){ e.preventDefault(); addBoundedArray("values","candidates", e.target.value, 6); }
  if (id === "addPillar" && e.key === "Enter"){ e.preventDefault(); addBoundedArray("pillars","candidates", e.target.value, 6); }
});

/* ========== UI Helpers ========== */

function renderCandidateList(list, group){
  if (!list.length) return `<div class="small">None yet.</div>`;
  return `
    <div class="pills">
      ${list.map(x => `
        <span class="tag">
          ${escapeHtml(x)}
          <button class="ghost" type="button"
            style="margin-left:8px; padding:0 6px; border-radius:10px;"
            data-${group === "values" ? "removeValue" : "removePillar"}="${escapeHtmlAttr(x)}"
            title="Remove">×</button>
        </span>
      `).join("")}
    </div>
  `;
}

function pill(v, on){ return `<button class="pill ${on ? "on" : ""}" data-value="${escapeHtmlAttr(v)}" type="button">${escapeHtml(v)}</button>`; }
function pillPillar(p, on){ return `<button class="pill ${on ? "on" : ""}" data-pillar="${escapeHtmlAttr(p)}" type="button">${escapeHtml(p)}</button>`; }
function li(x){ return `<li>${escapeHtml(x)}</li>`; }

function liveConfirmedValues(){
  const confirmed = [];
  for (const v of state.values.candidates){
    if (state.values.roadtestAnswers[v] === true) confirmed.push(v);
  }
  return uniq([...confirmed, ...(state.pillars.movedToValues || [])]);
}

function liveConfirmedPillars(){
  const confirmed = [];
  const remaining = state.pillars.candidates.filter(p => state.pillars.roadtest1[p] === false);
  for (const p of remaining){
    if (state.pillars.roadtest2[p] === true) confirmed.push(p);
  }
  return uniq(confirmed);
}

/* ========== Submission ========== */

async function submitToDana(){
  computePillarsOutcomes();
  computeConfirmedValues();

  state.lastSubmit = { status:"submitting", message:"Sending your results to Dana..." };
  saveState();
  setStep(STEPS.findIndex(s => s.key === "submitted"));

  if (!GOOGLE_FORM.enabled){
    state.lastSubmit = { status:"error", message:"GOOGLE_FORM.enabled is false." };
    saveState(); render();
    return;
  }

  try{
    await postToGoogleForm(buildPayload());
    state.lastSubmit = {
      status:"success",
      message:"Done. If you provided an email + checked consent, you’ll receive your results email shortly."
    };
    saveState(); render();
  }catch(err){
    console.warn(err);
    state.lastSubmit = {
      status:"error",
      message:"Submission failed. Check Google Form URL + entry IDs in app.js."
    };
    saveState(); render();
  }
}

function buildPayload(){
  return {
    name: state.user.name.trim(),
    email: state.user.email.trim(),
    consent: !!state.user.consent,

    confirmedValues: (state.values.confirmed || []).join(", "),
    confirmedPillars: (state.pillars.confirmed || []).join(", "),
    movedToValues: (state.pillars.movedToValues || []).join(", "),

    idealEmotionPrimary: state.idealEmotion.primary || "",
    idealEmotionSecondary: state.idealEmotion.secondary || "",
    idealEmotionDesire: String(state.idealEmotion.desireLevel || 0),
    idealEmotionTarget: "8",

    trigger: state.trigger.label || "",
    triggerFeeling: state.trigger.feeling || "",
    resetScript: state.trigger.resetScript || ""
  };
}

async function postToGoogleForm(p){
  const fd = new FormData();
  fd.append(GOOGLE_FORM.entry.name, p.name);
  fd.append(GOOGLE_FORM.entry.email, p.email);
  fd.append(GOOGLE_FORM.entry.consent, p.consent ? "Yes" : "No");

  fd.append(GOOGLE_FORM.entry.confirmedValues, p.confirmedValues);
  fd.append(GOOGLE_FORM.entry.confirmedPillars, p.confirmedPillars);
  fd.append(GOOGLE_FORM.entry.movedToValues, p.movedToValues);

  fd.append(GOOGLE_FORM.entry.idealEmotionPrimary, p.idealEmotionPrimary);
  fd.append(GOOGLE_FORM.entry.idealEmotionSecondary, p.idealEmotionSecondary);
  fd.append(GOOGLE_FORM.entry.idealEmotionDesire, p.idealEmotionDesire);
  fd.append(GOOGLE_FORM.entry.idealEmotionTarget, p.idealEmotionTarget);

  fd.append(GOOGLE_FORM.entry.trigger, p.trigger);
  fd.append(GOOGLE_FORM.entry.triggerFeeling, p.triggerFeeling);
  fd.append(GOOGLE_FORM.entry.resetScript, p.resetScript);

  await fetch(GOOGLE_FORM.formResponseUrl, { method:"POST", mode:"no-cors", body: fd });
}

/* ========== HTML escaping ========== */

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(s){ return escapeHtml(s).replaceAll("\n"," "); }

// Initial paint
render();



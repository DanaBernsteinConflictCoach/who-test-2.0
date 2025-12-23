const STORAGE_KEY = "who_assessment_v2";
const MAIN_SITE = "http://MyWHOthoughts.com";
const BOOK_LINK = "https://bit.ly/3PxJ3MD";

const DEFAULTS = {
  meta: { name: "", email: "" },
  fontScale: 1,
  values: [],
  pillars: [],
  idealEmotion: "",
  triggers: [
    { trigger: "", response: "" },
    { trigger: "", response: "" },
    { trigger: "", response: "" },
  ],
  food: { favorite: "", hate: "" },
};

const VALUE_OPTIONS = [
  "Accountability","Adventure","Authenticity","Considerate","Curiosity","Do-er","Efficient","Empathy","Ethics",
  "Excellence","Fairness","Gratitude","Honesty","Impact","Independence","Inclusivity","Integrity","Justice","Kind",
  "Loyalty","Open Mind","Perseverance","Reliability","Resilience","Respect","Self Reliance","Service","Structure","Transparency"
 ];

const PILLAR_OPTIONS = [
  "Adventurer","Bold","Builder","Caretaker","Community","Compassion","Confident","Connection","Connector",
  "Considerate","Creative","Earthy","Explorer","Faith","Family","Fierce","Fun","Goofy","Grounded","Gratitude","Helper","Humor","Introspective","Impact",
  "Kind","Laughter","Limitless","Listener","Love","Nerdy","Open Mind","Optimist","Passion","Patient","Peace","Playful",
  "Present","Problem Solver","Sarcastic","Service"
];

const EMOTION_OPTIONS = [
  "Calm","Carefree","Clear","Connected","Content","Energized","Fulfilled","Freedom",
  "Grateful","Happiness","Inspired","Joy","Peace","Playful","Present","Serenity"
 ];

const TRIGGER_OPTIONS = [
  "I’m not…","Capable","Enough","Fast Enough","Good Enough","Heard","Listened to",
  "Respected","Seen","Smart","Valued","Wanted"
  ];

let state = loadState();
let stepIndex = 0;

const elTitle = document.getElementById("stepTitle");
const elHint = document.getElementById("stepHint");
const elBody = document.getElementById("stepBody");
const elBack = document.getElementById("backBtn");
const elNext = document.getElementById("nextBtn");
const elSave = document.getElementById("saveBtn");
const elProgress = document.getElementById("progressBar");

const elSite = document.getElementById("siteLink");
const elBook = document.getElementById("bookLink");

elSite.href = MAIN_SITE;
elBook.href = BOOK_LINK;

// Font controls
const elFontDown = document.getElementById("fontDown");
const elFontUp = document.getElementById("fontUp");
const elFontSlider = document.getElementById("fontSlider");

console.log(
  elTitle, elHint, elBody,
  elBack, elNext, elSave,
  elProgress, elSite, elBook,
  elFontDown, elFontUp, elFontSlider
);

function applyFontScale(scale){
  const clamped = Math.max(0.9, Math.min(1.3, Number(scale)));
  document.documentElement.style.setProperty("--fontScale", clamped);
  state.fontScale = clamped;
  elFontSlider.value = String(clamped);
  saveState();
}

elFontSlider.value = String(state.fontScale ?? 1);
applyFontScale(state.fontScale ?? 1);

elFontDown.addEventListener("click", () => applyFontScale((state.fontScale ?? 1) - 0.05));
elFontUp.addEventListener("click", () => applyFontScale((state.fontScale ?? 1) + 0.05));
elFontSlider.addEventListener("input", (e) => applyFontScale(e.target.value));

const steps = [
  {
    id: "meta",
    title: "Start",
    hint: "Add your name. Email is optional (only used if you choose to email yourself your results).",
    render: renderMeta,
    validate: validateMeta,
  },
  {
    id: "values",
    title: "Page 1 — Define your Values",
    hint: "Tap to select your Values. Keep it simple: pick 4–6 that, when crossed, evokes an emotion.",
    render: () => renderMultiSelect({
      key: "values",
      options: VALUE_OPTIONS,
      allowCustom: true,
      customLabel: "Add your own value",
      maxHint: "Reflect on what matters to you. What are the non-negotiable rules that drive your success?",
    }),
    validate: () => (state.values.length >= 3) || "Pick at least 3 values.",
  },
  {
    id: "pillars",
    title: "Page 2 — Define your Pillars",
    hint: "Pillars are characteristics that describe who you are as your happiest, most relaxed self.",
    render: () => renderMultiSelect({
      key: "pillars",
      options: PILLAR_OPTIONS,
      allowCustom: true,
      customLabel: "List core characteristcs that describe you, and without them, you would operate as a shell of yourself (your own words)",
      maxHint: "Pick 4–6 if you can.",
    }),
    validate: () => (state.pillars.length >= 2) || "Pick at least 2 pillars.",
  },
  {
    id: "emotion",
    title: "Page 3 — Define your Ideal Emotion",
    hint: "At the end of the day, how would you like to feel? (Yes, it is ok to have 2 Ideal Emotions). You can choose one from the bank or write your own.",
    render: renderIdealEmotion,
    validate: () => (String(state.idealEmotion || "").trim().length > 1) || "Choose or write your ideal emotion.",
  },
  {
    id: "triggers",
    title: "Page 4 — Triggers → Responses",
    hint: "The demoralizing inner critic telling you \"I'm not … enough\" — and the response you’d rather choose instead.",

    render: renderTriggers,
    validate: validateTriggers,
  },
  {
    id: "food",
    title: "Food Check",
    hint: "Quick metaphor check. This is optional, but it makes the framework stick.",
    render: renderFood,
    validate: () => true,
  },
  {
    id: "results",
    title: "Reference Guide",
    hint: "This is your WHO. Save it, copy it, or email it to yourself.",
    render: renderResults,
    validate: () => true,
  },
];

init();

function init(){
  elBack.addEventListener("click", () => go(-1));
  elNext.addEventListener("click", () => go(1));
  elSave.addEventListener("click", () => {
    saveState();
    toast("Saved on this device.");
  });

  renderStep();
}

function go(delta){
  const step = steps[stepIndex];
  const res = step.validate?.();
  if (res !== true){
    toast(res || "Fix the step before continuing.");
    return;
  }

  stepIndex = Math.max(0, Math.min(steps.length - 1, stepIndex + delta));
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStep(){
  const step = steps[stepIndex];
  elTitle.textContent = step.title;
  elHint.textContent = step.hint || "";

  // progress
  const pct = Math.round(((stepIndex) / (steps.length - 1)) * 100);
  elProgress.style.width = `${pct}%`;

  // buttons
  elBack.style.visibility = stepIndex === 0 ? "hidden" : "visible";
  elNext.textContent = stepIndex === steps.length - 1 ? "Done" : "Next";

  // body
  elBody.innerHTML = "";
  step.render();
}

function renderMeta(){
  const wrap = document.createElement("div");

  wrap.appendChild(field("Your name", "name", state.meta.name, "spellcheck", true));
  wrap.appendChild(field("Your email (optional)", "email", state.meta.email, "inputmode", "email"));

  const note = document.createElement("div");
  note.className = "notice";
  note.innerHTML = `
    <strong>No spam.</strong> Email is optional and only used if you press <em>Email my results</em>.
    We will not sign you up for newsletters.
  `;
  wrap.appendChild(note);

  elBody.appendChild(wrap);

  // wire
  wrap.querySelector('input[name="name"]').addEventListener("input", (e) => {
    state.meta.name = e.target.value;
    saveStateDebounced();
  });
  wrap.querySelector('input[name="email"]').addEventListener("input", (e) => {
    state.meta.email = e.target.value;
    saveStateDebounced();
  });
}

function validateMeta(){
  const name = String(state.meta.name || "").trim();
  if (name.length < 2) return "Add your name to continue.";
  return true;
}

function renderMultiSelect({ key, options, allowCustom, customLabel, maxHint }){
  const selected = new Set(state[key] || []);

  const sectionTitle = document.createElement("div");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Word bank (tap to add/remove)";
  elBody.appendChild(sectionTitle);

  const pills = document.createElement("div");
  pills.className = "pills";
  options.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill";
    p.textContent = opt;
    if (selected.has(opt)) p.classList.add("selected");

    p.addEventListener("click", () => {
      if (selected.has(opt)) selected.delete(opt);
      else selected.add(opt);

      state[key] = Array.from(selected);
      saveStateDebounced();
      renderStep(); // re-render to refresh selected UI + list
    });

    pills.appendChild(p);
  });
  elBody.appendChild(pills);

  const hr = document.createElement("div");
  hr.className = "hr";
  elBody.appendChild(hr);

  const listTitle = document.createElement("div");
  listTitle.className = "section-title";
  listTitle.textContent = "Selected";
  elBody.appendChild(listTitle);

  const box = document.createElement("div");
  box.className = "result-box";
  box.textContent = (state[key] && state[key].length) ? state[key].join(", ") : "Nothing selected yet.";
  elBody.appendChild(box);

  if (maxHint){
    const small = document.createElement("div");
    small.className = "small";
    small.style.marginTop = "8px";
    small.textContent = maxHint;
    elBody.appendChild(small);
  }

  if (allowCustom){
    const custom = document.createElement("div");
    custom.className = "field";
    custom.innerHTML = `
      <div class="label">${customLabel}</div>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <input class="input" name="custom_${key}" placeholder="Type and press Add" spellcheck="true" />
        <button class="btn" id="addCustomBtn">Add</button>
      </div>
      <div class="small">Tip: keep words short. One idea per word.</div>
    `;
    elBody.appendChild(custom);

    const input = custom.querySelector(`input[name="custom_${key}"]`);
    const btn = custom.querySelector("#addCustomBtn");

    const add = () => {
      const val = String(input.value || "").trim();
      if (!val) return;
      if (!selected.has(val)) selected.add(val);
      state[key] = Array.from(selected);
      input.value = "";
      saveStateDebounced();
      renderStep();
    };

    btn.addEventListener("click", add);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter"){
        e.preventDefault();
        add();
      }
    });
  }
}

function renderIdealEmotion(){
  const sectionTitle = document.createElement("div");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = "Emotion bank (tap to set)";
  elBody.appendChild(sectionTitle);

  const pills = document.createElement("div");
  pills.className = "pills";

  EMOTION_OPTIONS.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill";
    p.textContent = opt;
    if (state.idealEmotion === opt) p.classList.add("selected");

    p.addEventListener("click", () => {
      state.idealEmotion = opt;
      saveStateDebounced();
      renderStep();
    });

    pills.appendChild(p);
  });

  elBody.appendChild(pills);

  const hr = document.createElement("div");
  hr.className = "hr";
  elBody.appendChild(hr);

  const f = document.createElement("div");
  f.className = "field";
  f.innerHTML = `
    <div class="label">Or write your own (recommended if none fit)</div>
    <input class="input" name="idealEmotion" placeholder="Example: ‘Steady’ or ‘Locked-in’" spellcheck="true" />
    <div class="small">Whatever you write here becomes your Ideal Emotion.</div>
  `;
  elBody.appendChild(f);

  const input = f.querySelector('input[name="idealEmotion"]');
  input.value = state.idealEmotion || "";

  input.addEventListener("input", (e) => {
    state.idealEmotion = e.target.value;
    saveStateDebounced();
  });
}

function renderTriggers(){
  const wrap = document.createElement("div");

  // Trigger bank helper
  const bankTitle = document.createElement("div");
  bankTitle.className = "section-title";
  bankTitle.textContent = "Trigger word bank (tap to copy into the next empty trigger)";
  wrap.appendChild(bankTitle);

  const pills = document.createElement("div");
  pills.className = "pills";
  TRIGGER_OPTIONS.forEach(opt => {
    const p = document.createElement("div");
    p.className = "pill";
    p.textContent = opt;
    p.addEventListener("click", () => {
      const idx = state.triggers.findIndex(t => !String(t.trigger || "").trim());
      const target = idx === -1 ? 0 : idx;
      state.triggers[target].trigger = opt;
      saveStateDebounced();
      renderStep();
    });
    pills.appendChild(p);
  });
  wrap.appendChild(pills);

  const hr = document.createElement("div");
  hr.className = "hr";
  wrap.appendChild(hr);

  state.triggers.forEach((t, i) => {
    const block = document.createElement("div");
    block.className = "result-box";
    block.style.marginBottom = "10px";

    block.innerHTML = `
      <div class="field" style="margin:0;">
        <div class="label">Trigger ${i+1}</div>
        <input class="input" name="trigger_${i}" placeholder="What sets you off?" spellcheck="true" value="${escapeHtml(t.trigger)}" />
      </div>

      <div class="field">
        <div class="label">Preferred response</div>
        <textarea name="response_${i}" placeholder="What do you want to do instead?" spellcheck="true">${escapeHtml(t.response)}</textarea>
      </div>
    `;

    wrap.appendChild(block);
  });

  const small = document.createElement("div");
  small.className = "small";
  small.textContent = "Spellcheck is enabled — you’ll see red underlines for typos.";
  wrap.appendChild(small);

  elBody.appendChild(wrap);

  // wire inputs
  state.triggers.forEach((_, i) => {
    const trig = elBody.querySelector(`input[name="trigger_${i}"]`);
    const resp = elBody.querySelector(`textarea[name="response_${i}"]`);

    trig.addEventListener("input", (e) => {
      state.triggers[i].trigger = e.target.value;
      saveStateDebounced();
    });

    resp.addEventListener("input", (e) => {
      state.triggers[i].response = e.target.value;
      saveStateDebounced();
    });
  });
}

function validateTriggers(){
  const anyFilled = state.triggers.some(t => String(t.trigger || "").trim() || String(t.response || "").trim());
  if (!anyFilled) return "Add at least 1 trigger + response (even a rough one).";
  return true;
}

function renderFood(){
  const wrap = document.createElement("div");

  const fav = document.createElement("div");
  fav.className = "field";
  fav.innerHTML = `
    <div class="label">My favorite food / meal is:</div>
    <input class="input" name="food_fav" placeholder="Example: sushi" spellcheck="true" />
  `;

  const hate = document.createElement("div");
  hate.className = "field";
  hate.innerHTML = `
    <div class="label">I cannot stomach this food / consistency / beverage:</div>
    <input class="input" name="food_hate" placeholder="Example: cottage cheese" spellcheck="true" />
  `;

  const quote = document.createElement("div");
  quote.className = "result-box";
  quote.innerHTML = `
    <em>
      The food you fill your stomach with is no different than the thoughts you fill your head with.
      When your Trigger is loud, it is akin to eating your least favorite food, on purpose!
    </em>
    <div style="height:10px"></div>
    <strong>Thought choice:</strong> When something happens that causes upset—will you lean into your
    <strong>Pillars</strong> to respond, or choose the <strong>Trigger</strong> and react?
  `;

  wrap.appendChild(fav);
  wrap.appendChild(hate);
  wrap.appendChild(quote);

  elBody.appendChild(wrap);

  const favInput = elBody.querySelector('input[name="food_fav"]');
  const hateInput = elBody.querySelector('input[name="food_hate"]');
  favInput.value = state.food.favorite || "";
  hateInput.value = state.food.hate || "";

  favInput.addEventListener("input", (e) => {
    state.food.favorite = e.target.value;
    saveStateDebounced();
  });
  hateInput.addEventListener("input", (e) => {
    state.food.hate = e.target.value;
    saveStateDebounced();
  });
}

function renderResults(){
  const wrap = document.createElement("div");

  const name = String(state.meta.name || "").trim();

  const box = document.createElement("div");
  box.className = "result-box";
  box.innerHTML = `
    <div class="kv">
      <div class="k">Name</div>
      <div class="v">${escapeHtml(name)}</div>
    </div>

    <div class="kv">
      <div class="k">Values</div>
      <div class="v">${escapeHtml((state.values || []).join(", ") || "—")}</div>
    </div>

    <div class="kv">
      <div class="k">Pillars</div>
      <div class="v">${escapeHtml((state.pillars || []).join(", ") || "—")}</div>
    </div>

    <div class="kv">
      <div class="k">Ideal Emotion</div>
      <div class="v">${escapeHtml(state.idealEmotion || "—")}</div>
    </div>

    <div class="kv">
      <div class="k">Triggers → Responses</div>
      <div class="v">${escapeHtml(formatTriggersPlain(state.triggers))}</div>
    </div>

    <div class="kv">
      <div class="k">Food Check</div>
      <div class="v">Favorite: ${escapeHtml(state.food.favorite || "—")}<br/>Hate: ${escapeHtml(state.food.hate || "—")}</div>
    </div>
  `;

  wrap.appendChild(box);

  const hr = document.createElement("div");
  hr.className = "hr";
  wrap.appendChild(hr);

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  btnRow.style.flexWrap = "wrap";

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn";
  copyBtn.textContent = "Copy results";
  copyBtn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(buildEmailBody());
      toast("Copied.");
    }catch{
      toast("Copy failed (browser blocked).");
    }
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "btn";
  downloadBtn.textContent = "Download .txt";
  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([buildEmailBody()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WHO_${(state.meta.name || "results").replace(/\s+/g,"_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const emailBtn = document.createElement("button");
  emailBtn.className = "btn primary";
  emailBtn.textContent = "Email my results";
  emailBtn.addEventListener("click", () => {
    const email = String(state.meta.email || "").trim();
    if (!email){
      toast("Add your email on the Start page first (optional, but required to email).");
      stepIndex = 0;
      renderStep();
      return;
    }
    const subject = encodeURIComponent(`My WHO Results — ${state.meta.name || ""}`.trim());
    const body = encodeURIComponent(buildEmailBody());
    // Opens their mail app. No backend needed.
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  });

  const resetBtn = document.createElement("button");
  resetBtn.className = "btn ghost";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset everything on this device?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState(true);
    stepIndex = 0;
    applyFontScale(state.fontScale ?? 1);
    renderStep();
  });

  btnRow.appendChild(copyBtn);
  btnRow.appendChild(downloadBtn);
  btnRow.appendChild(emailBtn);
  btnRow.appendChild(resetBtn);

  wrap.appendChild(btnRow);

  const note = document.createElement("div");
  note.className = "small";
  note.style.marginTop = "10px";
  note.textContent = "Note: Email uses your device’s mail app (mailto). For true auto-send email, we’d need a simple backend service.";
  wrap.appendChild(note);

  elBody.appendChild(wrap);
}

function field(labelText, name, value, attr, attrVal){
  const d = document.createElement("div");
  d.className = "field";
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = labelText;

  const input = document.createElement("input");
  input.className = "input";
  input.name = name;
  input.value = value || "";
  input.spellcheck = true;
  if (attr) input.setAttribute(attr, attrVal);

  d.appendChild(label);
  d.appendChild(input);
  return d;
}

function buildEmailBody(){
  const lines = [];
  lines.push(`WHO RESULTS`);
  lines.push(`Name: ${state.meta.name || ""}`);
  lines.push(``);
  lines.push(`VALUES:`);
  lines.push(`- ${(state.values || []).join(", ")}`);
  lines.push(``);
  lines.push(`PILLARS:`);
  lines.push(`- ${(state.pillars || []).join(", ")}`);
  lines.push(``);
  lines.push(`IDEAL EMOTION:`);
  lines.push(`- ${state.idealEmotion || ""}`);
  lines.push(``);
  lines.push(`TRIGGERS → RESPONSES:`);
  (state.triggers || []).forEach((t, i) => {
    const trig = String(t.trigger || "").trim();
    const resp = String(t.response || "").trim();
    if (!trig && !resp) return;
    lines.push(`${i+1}) Trigger: ${trig}`);
    lines.push(`   Response: ${resp}`);
  });
  lines.push(``);
  lines.push(`FOOD CHECK:`);
  lines.push(`Favorite: ${state.food.favorite || ""}`);
  lines.push(`Hate: ${state.food.hate || ""}`);
  lines.push(``);
  lines.push(`—`);
  lines.push(`Generated via ${MAIN_SITE}`);
  return lines.join("\n");
}

function formatTriggersPlain(trigs){
  const parts = [];
  (trigs || []).forEach((t, i) => {
    const trig = String(t.trigger || "").trim();
    const resp = String(t.response || "").trim();
    if (!trig && !resp) return;
    parts.push(`${i+1}) ${trig || "—"} → ${resp || "—"}`);
  });
  return parts.length ? parts.join("\n") : "—";
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    console.warn("Save failed", e);
  }
}

let saveTimer = null;
function saveStateDebounced(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 250);
}

function loadState(reset = false){
  if (reset) return structuredClone(DEFAULTS);
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      meta: { ...DEFAULTS.meta, ...(parsed.meta || {}) },
      food: { ...DEFAULTS.food, ...(parsed.food || {}) },
      triggers: Array.isArray(parsed.triggers) ? parsed.triggers : structuredClone(DEFAULTS.triggers),
    };
  }catch{
    return structuredClone(DEFAULTS);
  }
}

function toast(msg){
  // simple no-library toast
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.bottom = "20px";
  t.style.transform = "translateX(-50%)";
  t.style.background = "rgba(10,30,20,.92)";
  t.style.color = "white";
  t.style.padding = "10px 14px";
  t.style.borderRadius = "12px";
  t.style.fontWeight = "800";
  t.style.zIndex = "9999";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

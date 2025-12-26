const { useState } = React;

const TOTAL_STEPS = 12;

function App() {
  const [step, setStep] = useState(1);
  const [fontScale, setFontScale] = useState(1);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div style={{ fontSize: `${fontScale}em` }}>
      <header>
        <div className="header-inner">
          <div>
            <strong>My WHO Thoughts Assessment™</strong>
            <div className="muted">Define Your WHO • Quick clarity. No fluff.</div>
          </div>
          <div>
            <button onClick={() => setFontScale((f) => Math.max(0.9, f - 0.1))}>
              A−
            </button>{" "}
            <button onClick={() => setFontScale((f) => Math.min(1.3, f + 0.1))}>
              A+
            </button>
          </div>
        </div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main>
        {step === 1 && <Welcome />}
        {step === 2 && <DefineWHO />}
        {step === 3 && <Start />}
        {step === 4 && <ValuesDiscover />}
        {step === 5 && <ValuesBuild />}
        {step === 6 && <ValuesRoadTest />}
        {step === 7 && <PillarsDiscover />}
        {step === 8 && <PillarsRoadTest />}
        {step === 9 && <InternalConflict />}
        {step === 10 && <IdealEmotion />}
        {step === 11 && <Trigger />}
        {step === 12 && <Snapshot />}
      </main>

      <footer>
        <div className="footer-inner">
          <button onClick={back} disabled={step === 1}>
            Back
          </button>
          <span className="muted">
            © {new Date().getFullYear()} My WHO Thoughts Assessment™
          </span>
          <button onClick={next} disabled={step === TOTAL_STEPS}>
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---- Pages ---- */

const Section = ({ title, children }) => (
  <section>
    <h2>{title}</h2>
    {children}
  </section>
);

const Welcome = () => (
  <Section title="Welcome">
    <p>Thank you for taking the WHO Thoughts Assessment™.</p>
    <p>
      When your nervous system is regulated, you respond instead of react. You
      choose instead of spiral.
    </p>
    <p className="muted">— Dana Lynn Bernstein, PMP, PCC</p>
  </Section>
);

const DefineWHO = () => (
  <Section title="Define Your WHO">
    <ul>
      <li>Values — Your guardrails</li>
      <li>Pillars — Your energy source</li>
      <li>Ideal Emotion — Your compass</li>
      <li>Trigger — Your warning signal</li>
    </ul>
  </Section>
);

const Start = () => (
  <Section title="Start">
    <input placeholder="Your name" />
    <input placeholder="Your email (optional)" />
    <p className="muted">
      Email is optional. You may receive your results if you choose.
    </p>
  </Section>
);

const ValuesDiscover = () => (
  <Section title="Step 1 of 6: Values — Discover">
    <textarea placeholder="At any point in your life, when were you most proud of yourself?" />
    <textarea placeholder="Why were you proud?" />
    <textarea placeholder="When were you most angry, frustrated, or upset?" />
  </Section>
);

const ValuesBuild = () => (
  <Section title="Build Your Values">
    <input placeholder="Add a Value and press Enter" />
  </Section>
);

const ValuesRoadTest = () => (
  <Section title="Step 2 of 6: Values Road Test">
    <p>If someone violates this Value, do you feel upset or frustrated?</p>
  </Section>
);

const PillarsDiscover = () => (
  <Section title="Step 3 of 6: Pillars — Discover">
    <textarea placeholder="When were you happiest and most YOU?" />
    <input placeholder="Add a Pillar and press Enter" />
  </Section>
);

const PillarsRoadTest = () => (
  <Section title="Step 4 of 6: Pillars Road Test">
    <p>If this characteristic were removed, would you be a shell of yourself?</p>
  </Section>
);

const InternalConflict = () => (
  <Section title="Internal Conflict & Choice">
    <p>
      When emotions arise, intentionally choose which Value or Pillar leads your
      response.
    </p>
  </Section>
);

const IdealEmotion = () => (
  <Section title="Step 5 of 6: Ideal Emotion">
    <select>
      <option>Select your Ideal Emotion</option>
      <option>Calm</option>
      <option>Clear</option>
      <option>Joy</option>
      <option>Peace</option>
    </select>
    <input type="range" min="1" max="10" />
  </Section>
);

const Trigger = () => (
  <Section title="Step 6 of 6: Trigger">
    <input placeholder="I'm not..." />
    <textarea placeholder="Reset script (optional)" />
  </Section>
);

const Snapshot = () => (
  <Section title="Your WHO Snapshot">
    <p>Your Values, Pillars, Ideal Emotion, and Trigger will appear here.</p>
  </Section>
);

/* Render */
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

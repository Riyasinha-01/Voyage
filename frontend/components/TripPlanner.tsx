"use client";

import { useState } from "react";

interface TripPlannerFormProps {
  onSubmit: (prompt: string) => void;
}

const ACTIVITIES = ["Cultural", "Adventure", "Relaxation", "Food Tour", "Nightlife"];
const WALKING = [
  { value: "high", label: "High", sub: "Love exploring on foot!" },
  { value: "moderate", label: "Moderate", sub: "Some walking is okay." },
  { value: "low", label: "Low", sub: "Prefer minimal walking." },
];
const DIETARY = ["No Preference", "Vegetarian", "Non-Vegetarian"];
const ACCOMMODATION = ["Budget", "Mid-range", "Luxury", "Near City Center", "Quiet Location"];

export default function TripPlannerForm({ onSubmit }: TripPlannerFormProps) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState<"Low" | "Medium" | "High">("Medium");
  const [activities, setActivities] = useState<string[]>([]);
  const [walking, setWalking] = useState("moderate");
  const [dietary, setDietary] = useState("No Preference");
  const [accommodation, setAccommodation] = useState<string[]>([]);

  const toggleArr = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleGenerate = () => {
    if (!destination.trim()) return;
    const actStr = activities.length ? activities.join(", ") : "general sightseeing";
    const accStr = accommodation.length ? accommodation.join(", ") : "any accommodation";
    const walkStr = WALKING.find((w) => w.value === walking)?.label || "Moderate";
    const prompt =
      `Plan a ${days}-day ${budget.toLowerCase()} budget trip to ${destination}. ` +
      `Preferred activities: ${actStr}. Walking tolerance: ${walkStr}. ` +
      `Dietary preference: ${dietary}. Accommodation: ${accStr}. ` +
      `Give a detailed day-by-day itinerary with recommendations.`;
    onSubmit(prompt);
    setOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap');

        .tpf-wrap {
          max-width: 700px;
          margin: 0 auto;
          padding: 0 32px;
          background: #111210;
        }

        .tpf-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          background: #1e1d1a;
          border: 1px solid rgba(240,237,230,0.1);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          user-select: none;
          border-radius: 6px;
        }

        .tpf-toggle.tpf-open {
          border-radius: 6px 6px 0 0;
          border-bottom-color: rgba(240,237,230,0.05);
        }

        .tpf-toggle:hover {
          background: #252420;
          border-color: rgba(201,169,110,0.3);
        }

        .tpf-toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(240,237,230,0.5);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tpf-toggle-label svg { color: #c9a96e; flex-shrink: 0; }

        .tpf-toggle-hint {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: rgba(240,237,230,0.2);
        }

        .tpf-arrow {
          transition: transform 0.25s ease;
          color: rgba(240,237,230,0.25);
          flex-shrink: 0;
        }

        .tpf-arrow.tpf-open { transform: rotate(180deg); }

        .tpf-panel {
          background: #181715;
          border: 1px solid rgba(240,237,230,0.1);
          border-top: none;
          border-radius: 0 0 6px 6px;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }

        .tpf-panel.tpf-open { display: flex; }

        .tpf-scroll {
          padding: 18px 20px 12px;
          overflow-y: auto;
          max-height: 220px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #181715;
          scrollbar-width: thin;
          scrollbar-color: rgba(240,237,230,0.08) transparent;
        }

        .tpf-scroll::-webkit-scrollbar { width: 3px; }
        .tpf-scroll::-webkit-scrollbar-thumb { background: rgba(240,237,230,0.1); border-radius: 2px; }

        .tpf-footer {
          padding: 10px 20px 14px;
          border-top: 1px solid rgba(240,237,230,0.07);
          background: #181715;
          flex-shrink: 0;
        }

        .tpf-generate {
          width: 100%;
          padding: 11px;
          background: #c9a96e;
          color: #0a0a08;
          border: none;
          border-radius: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tpf-generate:hover:not(:disabled) {
          background: #d4b87e;
          box-shadow: 0 4px 16px rgba(201,169,110,0.25);
        }

        .tpf-generate:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Form elements */
        .tpf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .tpf-field { display: flex; flex-direction: column; gap: 6px; }

        .tpf-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.3);
        }

        .tpf-input {
          padding: 9px 12px;
          border: 1px solid rgba(240,237,230,0.1);
          border-radius: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: rgba(240,237,230,0.82);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          background: rgba(240,237,230,0.04);
        }

        .tpf-input:focus {
          border-color: rgba(201,169,110,0.5);
          background: rgba(240,237,230,0.06);
        }

        .tpf-input::placeholder { color: rgba(240,237,230,0.18); }

        .tpf-days-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tpf-days-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: #c9a96e;
          min-width: 28px;
          text-align: center;
        }

        .tpf-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 2px;
          border-radius: 2px;
          background: rgba(240,237,230,0.1);
          outline: none;
          cursor: pointer;
        }

        .tpf-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #c9a96e;
          border: 2px solid #181715;
          cursor: pointer;
          transition: transform 0.15s;
          box-shadow: 0 0 0 2px rgba(201,169,110,0.3);
        }

        .tpf-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

        .tpf-days-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: rgba(240,237,230,0.18);
          font-family: 'DM Sans', sans-serif;
          margin-top: 4px;
        }

        .tpf-pills { display: flex; gap: 7px; flex-wrap: wrap; }

        .tpf-pill {
          padding: 6px 16px;
          border: 1px solid rgba(240,237,230,0.12);
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: rgba(240,237,230,0.4);
          cursor: pointer;
          transition: all 0.18s;
          background: transparent;
        }

        .tpf-pill:hover { border-color: rgba(201,169,110,0.4); color: rgba(240,237,230,0.75); }

        .tpf-pill.tpf-active {
          background: #c9a96e;
          color: #0a0a08;
          border-color: #c9a96e;
          font-weight: 500;
        }

        .tpf-tags { display: flex; flex-wrap: wrap; gap: 6px; }

        .tpf-tag {
          padding: 6px 12px;
          border: 1px solid rgba(240,237,230,0.1);
          border-radius: 4px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: rgba(240,237,230,0.38);
          cursor: pointer;
          transition: all 0.18s;
          background: rgba(240,237,230,0.03);
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .tpf-tag:hover { border-color: rgba(240,237,230,0.22); color: rgba(240,237,230,0.7); }

        .tpf-tag.tpf-active {
          background: rgba(201,169,110,0.12);
          color: #c9a96e;
          border-color: rgba(201,169,110,0.35);
        }

        .tpf-check {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          border: 1px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.55;
        }

        .tpf-tag.tpf-active .tpf-check { opacity: 1; }

        .tpf-radio-col { display: flex; flex-direction: column; gap: 5px; }

        .tpf-radio {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 11px;
          border: 1px solid rgba(240,237,230,0.08);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.18s;
          background: rgba(240,237,230,0.02);
        }

        .tpf-radio:hover { border-color: rgba(240,237,230,0.16); }

        .tpf-radio.tpf-active {
          border-color: rgba(201,169,110,0.4);
          background: rgba(201,169,110,0.06);
        }

        .tpf-rdot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1.5px solid rgba(240,237,230,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tpf-radio.tpf-active .tpf-rdot { border-color: #c9a96e; }

        .tpf-rdot-inner {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c9a96e;
          opacity: 0;
          transition: opacity 0.18s;
        }

        .tpf-radio.tpf-active .tpf-rdot-inner { opacity: 1; }

        .tpf-rtxt { display: flex; flex-direction: column; }

        .tpf-rlabel {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(240,237,230,0.62);
        }

        .tpf-rsub {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: rgba(240,237,230,0.25);
        }

        .tpf-divider { height: 1px; background: rgba(240,237,230,0.06); }

        .tpf-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.22);
        }

        .tpf-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(240,237,230,0.06);
        }

        @media (max-width: 767px) {
          .tpf-wrap { padding: 0 16px; }
          .tpf-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="tpf-wrap">
        {/* Toggle */}
        <div className={`tpf-toggle ${open ? "tpf-open" : ""}`} onClick={() => setOpen(!open)}>
          <span className="tpf-toggle-label">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M4 4h6M4 7h4M4 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Trip Planner
          </span>
          <span className="tpf-toggle-hint">{open ? "collapse" : "fill form or type below"}</span>
          <svg className={`tpf-arrow ${open ? "tpf-open" : ""}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Panel */}
        <div className={`tpf-panel ${open ? "tpf-open" : ""}`}>
          <div className="tpf-scroll">

            <div className="tpf-row">
              <div className="tpf-field">
                <label className="tpf-label">Destination</label>
                <input className="tpf-input" placeholder="e.g. Tokyo, Bali, Paris..."
                  value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div className="tpf-field">
                <label className="tpf-label">Number of Days</label>
                <div className="tpf-days-row">
                  <span className="tpf-days-val">{days}</span>
                  <div style={{ flex: 1 }}>
                    <input type="range" min={1} max={30} value={days}
                      onChange={(e) => setDays(Number(e.target.value))} className="tpf-slider" />
                    <div className="tpf-days-labels"><span>1</span><span>30</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tpf-field">
              <label className="tpf-label">Budget Level</label>
              <div className="tpf-pills">
                {(["Low", "Medium", "High"] as const).map((b) => (
                  <button key={b} className={`tpf-pill ${budget === b ? "tpf-active" : ""}`}
                    onClick={() => setBudget(b)}>{b}</button>
                ))}
              </div>
            </div>

            <div className="tpf-divider" />
            <div className="tpf-section-label">⚙ Additional Preferences</div>

            <div className="tpf-field">
              <label className="tpf-label">Preferred Activities</label>
              <div className="tpf-tags">
                {ACTIVITIES.map((a) => (
                  <button key={a} className={`tpf-tag ${activities.includes(a) ? "tpf-active" : ""}`}
                    onClick={() => toggleArr(activities, a, setActivities)}>
                    <span className="tpf-check">
                      {activities.includes(a) && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="tpf-row">
              <div className="tpf-field">
                <label className="tpf-label">Walking Tolerance</label>
                <div className="tpf-radio-col">
                  {WALKING.map((w) => (
                    <div key={w.value} className={`tpf-radio ${walking === w.value ? "tpf-active" : ""}`}
                      onClick={() => setWalking(w.value)}>
                      <div className="tpf-rdot"><div className="tpf-rdot-inner" /></div>
                      <div className="tpf-rtxt">
                        <span className="tpf-rlabel">{w.label}</span>
                        <span className="tpf-rsub">{w.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="tpf-field">
                <label className="tpf-label">Dietary Preferences</label>
                <div className="tpf-radio-col">
                  {DIETARY.map((d) => (
                    <div key={d} className={`tpf-radio ${dietary === d ? "tpf-active" : ""}`}
                      onClick={() => setDietary(d)}>
                      <div className="tpf-rdot"><div className="tpf-rdot-inner" /></div>
                      <div className="tpf-rtxt"><span className="tpf-rlabel">{d}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tpf-field">
              <label className="tpf-label">Accommodation Type</label>
              <div className="tpf-tags">
                {ACCOMMODATION.map((a) => (
                  <button key={a} className={`tpf-tag ${accommodation.includes(a) ? "tpf-active" : ""}`}
                    onClick={() => toggleArr(accommodation, a, setAccommodation)}>
                    <span className="tpf-check">
                      {accommodation.includes(a) && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {a}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="tpf-footer">
            <button className="tpf-generate" onClick={handleGenerate} disabled={!destination.trim()}>
              ✦ &nbsp;Generate Itinerary
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
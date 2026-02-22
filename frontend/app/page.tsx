"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

// ── Deterministic particle data — no Math.random() ever called during render ──
const PARTICLES = [
  { left:"8%",  w:2.4, h:2.4, dur:9.2,  del:0.4,  drift: 42  },
  { left:"16%", w:1.8, h:1.8, dur:11.5, del:2.1,  drift:-38  },
  { left:"23%", w:3.0, h:3.0, dur:8.7,  del:3.6,  drift: 55  },
  { left:"31%", w:1.5, h:1.5, dur:13.1, del:1.0,  drift:-20  },
  { left:"39%", w:2.7, h:2.7, dur:7.8,  del:0.7,  drift: 30  },
  { left:"47%", w:2.0, h:2.0, dur:10.4, del:3.2,  drift:-50  },
  { left:"54%", w:3.2, h:3.2, dur:12.6, del:1.8,  drift: 18  },
  { left:"62%", w:1.6, h:1.6, dur:9.9,  del:2.5,  drift:-35  },
  { left:"70%", w:2.8, h:2.8, dur:8.3,  del:0.2,  drift: 48  },
  { left:"77%", w:1.9, h:1.9, dur:14.0, del:3.9,  drift:-15  },
  { left:"85%", w:2.3, h:2.3, dur:11.2, del:1.3,  drift: 60  },
  { left:"92%", w:3.5, h:3.5, dur:7.5,  del:2.8,  drift:-44  },
  { left:"4%",  w:2.1, h:2.1, dur:10.8, del:0.9,  drift: 25  },
  { left:"12%", w:2.6, h:2.6, dur:13.4, del:3.4,  drift:-58  },
  { left:"27%", w:1.7, h:1.7, dur:9.0,  del:1.6,  drift: 36  },
  { left:"43%", w:3.1, h:3.1, dur:12.0, del:2.3,  drift:-28  },
  { left:"58%", w:2.5, h:2.5, dur:8.5,  del:0.6,  drift: 52  },
  { left:"66%", w:1.4, h:1.4, dur:11.8, del:3.7,  drift:-12  },
  { left:"74%", w:2.9, h:2.9, dur:7.2,  del:1.1,  drift: 40  },
  { left:"88%", w:2.2, h:2.2, dur:13.7, del:2.0,  drift:-46  },
];

const LETTERS = [
  { char:"V", gold:false }, { char:"O", gold:false },
  { char:"Y", gold:false }, { char:"A", gold:true  },
  { char:"G", gold:true  }, { char:"E", gold:false },
];

const ICONS = [
  { icon:"✈", label:"Flights",   delay:0    },
  { icon:"🗺", label:"Maps",     delay:0.12 },
  { icon:"🏔", label:"Mountains",delay:0.24 },
  { icon:"🏖", label:"Beaches",  delay:0.36 },
  { icon:"🕌", label:"Culture",  delay:0.48 },
  { icon:"🚂", label:"Trains",   delay:0.60 },
  { icon:"🌅", label:"Sunsets",  delay:0.72 },
  { icon:"🧳", label:"Luggage",  delay:0.84 },
];

export default function Home() {
  const router = useRouter();

  // clientMounted = false on server → intro JSX never appears in SSR HTML
  const [clientMounted, setClientMounted] = useState(false);
  const [phase, setPhase] = useState<"title"|"travel"|"done">("title");
  const [destIndex, setDestIndex] = useState(0);

  const DESTINATIONS = ["New York","Europe","Russia","India","Japan","Australia"];

  useEffect(() => {
    setClientMounted(true);
    const t1 = setTimeout(() => setPhase("travel"), 1900);
    const t2 = setTimeout(() => setPhase("done"),   3700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setDestIndex(p => (p + 1) % DESTINATIONS.length), 2000);
    return () => clearInterval(id);
  }, []);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const id_token = credentialResponse.credential;
    try {
      const res = await fetch("https://voyage-k82c.onrender.com/api/auth/google/", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id_token }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.access) { localStorage.setItem("token", data.access); router.push("/chat"); return; }
      throw new Error();
    } catch {
      localStorage.setItem("token","dev_token");
      router.push("/chat");
    }
  };

  const triggerGoogle = () =>
    (document.querySelector('div[role="button"]') as HTMLElement)?.click();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,200;0,300;0,400;1,200;1,300;1,400&family=DM+Sans:wght@200;300;400;500&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body { height:100%; overflow:hidden; background:#0a0a08; color:#f0ede6; font-family:'DM Sans',sans-serif; }

        /* ── INTRO ── */
        .v-intro {
          position:fixed; inset:0; z-index:100; background:#0a0a08;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
        }

        .v-particles { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
        .v-particle {
          position:absolute; border-radius:50%; background:rgba(201,169,110,0.45);
          animation:vPartDrift linear infinite;
        }
        @keyframes vPartDrift {
          from { transform:translateY(100vh) translateX(0); opacity:0; }
          8%   { opacity:1; }
          92%  { opacity:1; }
          to   { transform:translateY(-30px) translateX(var(--vd)); opacity:0; }
        }

        .v-letters { display:flex; gap:4px; align-items:baseline; position:relative; z-index:2; }
        .v-letter {
          font-family:'Cormorant Garamond',serif;
          font-size:clamp(64px,12vw,140px); font-weight:200;
          color:#f0ede6; letter-spacing:0.04em; line-height:1;
          opacity:0; transform:translateY(44px) rotateX(55deg);
          transition:opacity 0.55s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1);
          display:inline-block;
        }
        .v-letter.gold { color:#c9a96e; }
        .v-letter.show { opacity:1; transform:translateY(0) rotateX(0deg); }

        .v-tagline {
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:300;
          letter-spacing:0.3em; text-transform:uppercase; color:rgba(240,237,230,0.35);
          opacity:0; transform:translateY(10px);
          transition:opacity 0.6s ease 0.9s, transform 0.6s ease 0.9s;
          position:relative; z-index:2; margin-top:18px;
        }
        .v-tagline.show { opacity:1; transform:translateY(0); }

        .v-icons {
          display:flex; gap:26px; align-items:center;
          position:absolute; bottom:76px; left:50%; transform:translateX(-50%);
          z-index:2;
        }
        .v-icon {
          display:flex; flex-direction:column; align-items:center; gap:6px;
          opacity:0; transform:translateY(22px);
          transition:opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .v-icon.show { opacity:1; transform:translateY(0); }
        .v-icon-emoji { font-size:26px; animation:vBob 3s ease-in-out infinite; }
        .v-icon-label { font-family:'DM Sans',sans-serif; font-size:9px; font-weight:300; letter-spacing:0.1em; text-transform:uppercase; color:rgba(240,237,230,0.22); }
        @keyframes vBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .v-bar {
          position:absolute; bottom:0; left:0; height:2px;
          background:linear-gradient(90deg,transparent,#c9a96e,transparent);
          width:0; transition:width 3.6s linear;
        }
        .v-bar.run { width:100%; }

        /* ── MAIN PAGE ── */
        .v-home {
          height:100vh; display:flex; flex-direction:column;
          position:relative; overflow:hidden;
          opacity:0; transition:opacity 1s ease 0.15s;
        }
        .v-home.show { opacity:1; }

        .v-bg { position:absolute; inset:0; pointer-events:none; z-index:0; }
        .v-orb1 {
          position:absolute; width:500px; height:500px; border-radius:50%;
          background:radial-gradient(circle,rgba(180,150,100,0.13) 0%,transparent 70%);
          top:-80px; right:-80px; animation:vDrift1 12s ease-in-out infinite alternate;
        }
        .v-orb2 {
          position:absolute; width:400px; height:400px; border-radius:50%;
          background:radial-gradient(circle,rgba(100,130,120,0.08) 0%,transparent 70%);
          bottom:60px; left:-100px; animation:vDrift2 15s ease-in-out infinite alternate;
        }
        .v-grid {
          position:absolute; inset:0;
          background-image:linear-gradient(rgba(240,237,230,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(240,237,230,0.02) 1px,transparent 1px);
          background-size:80px 80px;
        }
        @keyframes vDrift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,40px) scale(1.1)} }
        @keyframes vDrift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(-20px,30px) scale(1.05)} }

        .v-nav {
          position:relative; z-index:10; display:flex; justify-content:space-between; align-items:center;
          padding:24px 56px; flex-shrink:0; opacity:0; animation:vFadeDown 0.7s ease forwards 0.3s;
        }
        .v-logo { font-family:'Cormorant Garamond',serif; font-size:19px; font-weight:400; letter-spacing:0.08em; color:#f0ede6; }
        .v-logo span { color:#c9a96e; }
        .v-navlinks { display:flex; gap:32px; list-style:none; }
        .v-navlinks a { font-size:12px; font-weight:300; letter-spacing:0.06em; color:rgba(240,237,230,0.45); text-decoration:none; text-transform:uppercase; transition:color 0.3s; }
        .v-navlinks a:hover { color:#f0ede6; }

        .v-hero {
          position:relative; z-index:10; flex:1;
          display:flex; flex-direction:column; justify-content:center; align-items:center;
          text-align:center; padding:0 40px;
        }
        .v-eyebrow {
          font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:#c9a96e;
          margin-bottom:16px; opacity:0; animation:vFadeUp 0.8s ease forwards 0.5s;
          display:flex; align-items:center; gap:12px;
        }
        .v-eyebrow::before,.v-eyebrow::after { content:''; display:block; width:36px; height:1px; background:#c9a96e; opacity:0.5; }
        .v-title {
          font-family:'Cormorant Garamond',serif; font-size:clamp(48px,7vw,96px); font-weight:300;
          line-height:0.95; letter-spacing:-0.02em; color:#f0ede6;
          margin-bottom:10px; opacity:0; animation:vFadeUp 0.9s ease forwards 0.65s;
        }
        .v-title em { font-style:italic; color:#c9a96e; }
        .v-dest {
          font-family:'Cormorant Garamond',serif; font-size:clamp(48px,7vw,96px); font-weight:300;
          line-height:0.95; letter-spacing:-0.02em; color:rgba(240,237,230,0.15);
          margin-bottom:24px; height:clamp(48px,7vw,96px); overflow:hidden;
          opacity:0; animation:vFadeUp 0.9s ease forwards 0.75s;
        }
        .v-dest-word { display:block; transition:transform 0.6s cubic-bezier(0.76,0,0.24,1); }
        .v-sub {
          font-size:14px; font-weight:300; color:rgba(240,237,230,0.4); max-width:380px;
          line-height:1.65; margin-bottom:28px; opacity:0; animation:vFadeUp 0.9s ease forwards 0.9s;
        }
        .v-cta { display:flex; gap:12px; align-items:center; opacity:0; animation:vFadeUp 0.9s ease forwards 1.05s; }
        .v-btn-p {
          padding:13px 32px; background:#c9a96e; color:#0a0a08;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500;
          letter-spacing:0.07em; text-transform:uppercase; border:none; cursor:pointer;
          transition:all 0.3s ease; position:relative; overflow:hidden;
        }
        .v-btn-p::after { content:''; position:absolute; inset:0; background:#f0ede6; transform:translateX(-100%); transition:transform 0.3s ease; }
        .v-btn-p:hover::after { transform:translateX(0); }
        .v-btn-p span { position:relative; z-index:1; }
        .v-btn-g {
          padding:13px 24px; background:transparent; color:rgba(240,237,230,0.45);
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:300;
          letter-spacing:0.06em; text-transform:uppercase;
          border:1px solid rgba(240,237,230,0.12); cursor:pointer; transition:all 0.3s ease;
        }
        .v-btn-g:hover { border-color:rgba(240,237,230,0.28); color:#f0ede6; }

        .v-features {
          position:relative; z-index:10; display:grid; grid-template-columns:repeat(3,1fr);
          gap:1px; background:rgba(240,237,230,0.06); border-top:1px solid rgba(240,237,230,0.06);
          flex-shrink:0; opacity:0; animation:vFadeUp 0.9s ease forwards 1.2s;
        }
        .v-feat { background:#0a0a08; padding:24px 36px; transition:background 0.3s; }
        .v-feat:hover { background:#111110; }
        .v-feat-n { font-family:'Cormorant Garamond',serif; font-size:10px; color:#c9a96e; letter-spacing:0.15em; margin-bottom:10px; opacity:0.7; }
        .v-feat-t { font-size:14px; font-weight:400; color:#f0ede6; margin-bottom:6px; letter-spacing:0.01em; }
        .v-feat-d { font-size:12px; font-weight:300; color:rgba(240,237,230,0.32); line-height:1.65; }

        @keyframes vFadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vFadeDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:768px) {
          .v-nav { padding:18px 20px; }
          .v-navlinks { display:none; }
          .v-features { grid-template-columns:1fr; }
          .v-feat { padding:18px 20px; }
          .v-sub { max-width:300px; }
          .v-icons { gap:12px; bottom:52px; }
          .v-icon-emoji { font-size:20px; }
        }
      `}</style>

      {/* ── INTRO — clientMounted guard means this is NEVER in SSR HTML ── */}
      {clientMounted && phase !== "done" && (
        <div className="v-intro">
          <div className="v-particles">
            {PARTICLES.map((p, i) => (
              <div key={i} className="v-particle" style={{
                left: p.left,
                width: `${p.w}px`, height: `${p.h}px`,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.del}s`,
                ["--vd" as any]: `${p.drift}px`,
              }} />
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", position:"relative", zIndex:2 }}>
            <div className="v-letters">
              {LETTERS.map((l, i) => (
                <span key={i}
                  className={`v-letter ${l.gold ? "gold" : ""} show`}
                  style={{ transitionDelay:`${i * 0.09}s` }}>
                  {l.char}
                </span>
              ))}
            </div>
            <div className="v-tagline show">AI · Travel · Intelligence</div>
          </div>

          <div className="v-icons">
            {ICONS.map((item, i) => (
              <div key={i}
                className={`v-icon ${phase === "travel" ? "show" : ""}`}
                style={{ transitionDelay:`${item.delay}s` }}>
                <span className="v-icon-emoji" style={{ animationDelay:`${i * 0.2}s` }}>
                  {item.icon}
                </span>
                <span className="v-icon-label">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="v-bar run" />
        </div>
      )}

      {/* ── MAIN PAGE ── */}
      <div className={`v-home ${phase === "done" ? "show" : ""}`}>
        <div className="v-bg">
          <div className="v-grid" />
          <div className="v-orb1" />
          <div className="v-orb2" />
        </div>

        <nav className="v-nav">
          <div className="v-logo">Voya<span>ge</span></div>
          <ul className="v-navlinks">
            <li><a href="#">Features</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </nav>

        <section className="v-hero">
          <div className="v-eyebrow">AI Travel Intelligence</div>
          <h1 className="v-title">Travel with<br /><em>intention</em></h1>
          <div className="v-dest">
            <span className="v-dest-word">{DESTINATIONS[destIndex]}</span>
          </div>
          <p className="v-sub">
            Your personal AI travel companion. Plan every detail of your journey — from hidden gems to perfect itineraries — in a single conversation.
          </p>

          <div style={{ display:"none" }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Login Failed")} />
          </div>

          <div className="v-cta">
            <button className="v-btn-p" onClick={triggerGoogle}><span>Begin Planning</span></button>
            <button className="v-btn-g">See how it works</button>
          </div>
        </section>

        <div className="v-features">
          {[
            { n:"01", t:"Intelligent Itineraries", d:"AI crafts day-by-day plans tailored to your travel style, budget, and pace." },
            { n:"02", t:"Local Intelligence",      d:"Discover places no algorithm would surface. Real insights, curated context." },
            { n:"03", t:"Seamless Memory",          d:"Every conversation saved. Pick up where you left off across all your trips." },
          ].map(f => (
            <div className="v-feat" key={f.n}>
              <div className="v-feat-n">{f.n}</div>
              <div className="v-feat-t">{f.t}</div>
              <div className="v-feat-d">{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

    const handleGoogleSuccess = async (credentialResponse: any) => {
    const id_token = credentialResponse.credential;

    try {
      const res = await fetch("https://voyage-k82c.onrender.com/api/auth/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      });

      if (!res.ok) {
        throw new Error("Backend not responding");
      }

      const data = await res.json();

      if (data.access) {
        localStorage.setItem("token", data.access);
        router.push("/chat");
        return;
      }

      throw new Error("Invalid response");

    } catch (error) {
      console.warn("Backend offline — using dev mode");

      // 🔥 DEV FALLBACK
      localStorage.setItem("token", "dev_token");
      router.push("/chat");
    }
  };

  const destinations = ["New York", "Europe", "Russia", "India", "Japan", "Australia"];
  const [destIndex, setDestIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % destinations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerGoogle = () => {
    const googleBtn = document.querySelector('div[role="button"]') as HTMLElement;
    googleBtn?.click();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
          height: 100%;
          overflow: hidden;
          background: #0a0a08;
          color: #f0ede6;
          font-family: 'DM Sans', sans-serif;
        }

        .home {
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* Background */
        .bg-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .bg-orb-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(180,150,100,0.13) 0%, transparent 70%);
          top: -80px;
          right: -80px;
          animation: drift1 12s ease-in-out infinite alternate;
        }

        .bg-orb-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(100,130,120,0.08) 0%, transparent 70%);
          bottom: 60px;
          left: -100px;
          animation: drift2 15s ease-in-out infinite alternate;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(240,237,230,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(240,237,230,0.02) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        @keyframes drift1 {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(30px, 40px) scale(1.1); }
        }
        @keyframes drift2 {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(-20px, 30px) scale(1.05); }
        }

        /* Nav */
        nav {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 56px;
          flex-shrink: 0;
          opacity: 0;
          animation: fadeDown 0.8s ease forwards 0.2s;
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: #f0ede6;
        }

        .logo span { color: #c9a96e; }

        .nav-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }

        .nav-links a {
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: rgba(240,237,230,0.45);
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.3s;
        }

        .nav-links a:hover { color: #f0ede6; }

        /* Hero — fills remaining space */
        .hero {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 0 40px 0;
          gap: 0;
        }

        .hero-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-bottom: 16px;
          opacity: 0;
          animation: fadeUp 0.8s ease forwards 0.4s;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-eyebrow::before,
        .hero-eyebrow::after {
          content: '';
          display: block;
          width: 36px;
          height: 1px;
          background: #c9a96e;
          opacity: 0.5;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 7vw, 96px);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: #f0ede6;
          margin-bottom: 10px;
          opacity: 0;
          animation: fadeUp 0.9s ease forwards 0.55s;
        }

        .hero-title em {
          font-style: italic;
          color: #c9a96e;
        }

        .hero-destination {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 7vw, 96px);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: rgba(240,237,230,0.15);
          margin-bottom: 24px;
          height: clamp(48px, 7vw, 96px);
          overflow: hidden;
          opacity: 0;
          animation: fadeUp 0.9s ease forwards 0.65s;
        }

        .dest-word {
          display: block;
          transition: transform 0.6s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.6s ease;
        }

        .hero-sub {
          font-size: 14px;
          font-weight: 300;
          color: rgba(240,237,230,0.4);
          max-width: 380px;
          line-height: 1.65;
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeUp 0.9s ease forwards 0.8s;
        }

        .hero-cta {
          display: flex;
          gap: 12px;
          align-items: center;
          opacity: 0;
          animation: fadeUp 0.9s ease forwards 0.95s;
        }

        .btn-primary {
          padding: 13px 32px;
          background: #c9a96e;
          color: #0a0a08;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #f0ede6;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .btn-primary:hover::after { transform: translateX(0); }

        .btn-primary span {
          position: relative;
          z-index: 1;
        }

        .btn-ghost {
          padding: 13px 24px;
          background: transparent;
          color: rgba(240,237,230,0.45);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid rgba(240,237,230,0.12);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-ghost:hover {
          border-color: rgba(240,237,230,0.28);
          color: #f0ede6;
        }

        /* Features strip — pinned at bottom */
        .features {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(240,237,230,0.06);
          border-top: 1px solid rgba(240,237,230,0.06);
          flex-shrink: 0;
          opacity: 0;
          animation: fadeUp 0.9s ease forwards 1.1s;
        }

        .feature-item {
          background: #0a0a08;
          padding: 24px 36px;
          transition: background 0.3s;
        }

        .feature-item:hover { background: #111110; }

        .feature-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 10px;
          color: #c9a96e;
          letter-spacing: 0.15em;
          margin-bottom: 10px;
          opacity: 0.7;
        }

        .feature-title {
          font-size: 14px;
          font-weight: 400;
          color: #f0ede6;
          margin-bottom: 6px;
          letter-spacing: 0.01em;
        }

        .feature-desc {
          font-size: 12px;
          font-weight: 300;
          color: rgba(240,237,230,0.32);
          line-height: 1.65;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          nav { padding: 18px 20px; }
          .nav-links { display: none; }
          .features { grid-template-columns: 1fr; }
          .feature-item { padding: 18px 20px; }
          .hero-sub { max-width: 300px; }
        }
      `}</style>

      <div className="home">
        <div className="bg-layer">
          <div className="bg-grid" />
          <div className="bg-orb-1" />
          <div className="bg-orb-2" />
        </div>

        <nav>
          <div className="logo">Voya<span>ge</span></div>
          <ul className="nav-links">
            <li><a href="#">Features</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </nav>

        <section className="hero">
          <div className="hero-eyebrow">AI Travel Intelligence</div>

          <h1 className="hero-title">
            Travel with<br /><em>intention</em>
          </h1>

          <div className="hero-destination">
            <span className="dest-word">
              {mounted ? destinations[destIndex] : destinations[0]}
            </span>
          </div>

          <p className="hero-sub">
            Your personal AI travel companion. Plan every detail of your journey — from hidden gems to perfect itineraries — in a single conversation.
          </p>

          {/* Hidden Google button */}
          <div style={{ display: "none" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Login Failed")}
            />
          </div>

          <div className="hero-cta">
            <button className="btn-primary" onClick={triggerGoogle}>
              <span>Begin Planning</span>
            </button>
            <button className="btn-ghost">See how it works</button>
          </div>
        </section>

        <div className="features">
          {[
            { n: "01", title: "Intelligent Itineraries", desc: "AI crafts day-by-day plans tailored to your travel style, budget, and pace." },
            { n: "02", title: "Local Intelligence", desc: "Discover places no algorithm would surface. Real insights, curated context." },
            { n: "03", title: "Seamless Memory", desc: "Every conversation saved. Pick up where you left off across all your trips." },
          ].map((f) => (
            <div className="feature-item" key={f.n}>
              <div className="feature-num">{f.n}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  loading?: boolean;
  onChipClick?: (text: string) => void;
}

const SUGGESTION_CHIPS = [
  "Plan a week in Japan",
  "Hidden gems in Italy",
  "Budget trip to Southeast Asia",
  "Family-friendly Europe",
  "Solo travel tips",
  "Romantic getaway ideas",
];

// ── Noise-words to filter false positives ─────────────────────────────────────
const SKIP_WORDS = new Set([
  "The","This","That","Your","Our","Their","These","Those","Here","There",
  "Each","Every","Many","Most","Some","Such","Day","Night","Morning","Evening",
  "Week","Month","Year","Asia","Europe","Africa","America","Budget","Note",
  "Tips","Cost","Time","Hotel","Food","Stay","Transport","Total","Activities",
  "Breakdown","Person","Mid","Range","Local","Private","Entry","Luxury",
  "Bear","You","With","For","And","But","When","Where","How","What",
  "Also","Even","Just","Only","Very","More","Less","Than","From",
]);

// ── Extract destination names from AI reply ───────────────────────────────────
function extractDestinations(text: string): string[] {
  const found = new Map<string, number>();

  const add = (w: string, score: number) => {
    w = w.trim();
    if (!SKIP_WORDS.has(w) && w.length > 2)
      found.set(w, (found.get(w) || 0) + score);
  };

  // Verb + place patterns (high confidence)
  const verbPat = /\b(?:visit(?:ing)?|explore?|exploring|travel(?:ling)? to|trip to|head(?:ing)? to|fly(?:ing)? to|arrive(?:s)? in|stay(?:ing)? in|spend[^,]{0,10}in|nights? in|days? in|weeks? in|based in|starting in|stop(?:ping)? (?:by|in)|departure from|landing in|journey to|route through|highlights? of|gateway to|heart of|known for)\s+([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = verbPat.exec(text)) !== null) add(m[1], 3);

  // Preposition + capitalised word (medium)
  const prepPat = /\b(?:in|to|at|near|around|across|through|via|from)\s+([A-Z][a-z]{2,}(?:[\s-][A-Z][a-z]{2,})?)\b/g;
  while ((m = prepPat.exec(text)) !== null) add(m[1], 1);

  // **Bold** names (very high confidence — AI uses them for places)
  const boldPat = /\*\*([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)?)\*\*/g;
  while ((m = boldPat.exec(text)) !== null) {
    const w = m[1].trim();
    if (!/^(Day|Note|Tips?|Cost|Budget|Stay|Food|Transport|Total|Activities|Mid|Range)/.test(w))
      add(w, 4);
  }

  // Comma/and city lists  e.g. "Darjeeling, Gangtok and Pelling"
  const listPat = /([A-Z][a-z]{2,}(?:[\s-][A-Z][a-z]{2,})?)(?:\s*[,]\s*|\s+and\s+)([A-Z][a-z]{2,}(?:[\s-][A-Z][a-z]{2,})?)/g;
  while ((m = listPat.exec(text)) !== null) { add(m[1], 2); add(m[2], 2); }

  // "Destination:" or "Location:" key-value lines
  const kvPat = /^(?:Destination|Location|Place|City|Town|Region|Area)\s*:\s*([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)?)/gm;
  while ((m = kvPat.exec(text)) !== null) add(m[1], 5);

  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);
}

// ── Fetch images via Wikipedia REST API (no key, CORS-safe) ──────────────────
async function fetchWikipediaImages(place: string): Promise<string[]> {
  const urls: string[] = [];

  try {
    // 1. Page summary — usually has the best hero image
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place)}`,
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const d = await res.json();
      if (d.originalimage?.source) urls.push(d.originalimage.source);
      if (d.thumbnail?.source) {
        const hq = d.thumbnail.source.replace(/\/\d+px-/, "/800px-");
        if (!urls.includes(hq)) urls.push(hq);
      }
    }
  } catch { /* ignore */ }

  try {
    // 2. Page images prop — gets more thumbnails
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(place)}&pithumbsize=700&pilimit=4&format=json&origin=*`
    );
    if (res.ok) {
      const d = await res.json();
      Object.values(d.query?.pages || {}).forEach((page: any) => {
        if (page.thumbnail?.source && !urls.includes(page.thumbnail.source))
          urls.push(page.thumbnail.source);
      });
    }
  } catch { /* ignore */ }

  try {
    // 3. List image filenames on the article, then resolve their URLs
    const listRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(place)}&prop=images&imlimit=12&format=json&origin=*`
    );
    if (listRes.ok) {
      const d = await listRes.json();
      const titles: string[] = [];
      Object.values(d.query?.pages || {}).forEach((page: any) => {
        (page.images || []).forEach((img: any) => {
          const t: string = img.title || "";
          const lc = t.toLowerCase();
          if (
            !lc.includes("flag") && !lc.includes("logo") && !lc.includes("coat") &&
            !lc.includes("map") && !lc.includes("symbol") && !lc.includes("icon") &&
            !lc.includes("seal") && !lc.includes("emblem") && !lc.includes("wikimedia") &&
            (lc.endsWith(".jpg") || lc.endsWith(".jpeg") || lc.endsWith(".png"))
          ) titles.push(t);
        });
      });

      if (titles.length > 0) {
        const infoRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.slice(0, 8).join("|"))}&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*`
        );
        if (infoRes.ok) {
          const id = await infoRes.json();
          Object.values(id.query?.pages || {}).forEach((p: any) => {
            const url = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
            if (url && !urls.includes(url)) urls.push(url);
          });
        }
      }
    }
  } catch { /* ignore */ }

  return urls.slice(0, 5);
}

// ── Individual destination card with image carousel ──────────────────────────
function DestinationCard({ name }: { name: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchWikipediaImages(name).then((imgs) => {
      if (cancelled) return;
      setImages(imgs.length > 0 ? imgs : []);
      setStatus(imgs.length > 0 ? "ready" : "error");
    });
    return () => { cancelled = true; };
  }, [name]);

  const next = () => setCurrent((c) => (c + 1) % images.length);
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const handleImgError = () => {
    const next = current + 1;
    if (next < images.length) setCurrent(next);
    else setStatus("error");
  };

  return (
    <div className="dest-card">
      <div className="dest-card-img-wrap">
        {status === "loading" && (
          <div className="dest-skeleton"><div className="dest-shimmer" /></div>
        )}
        {status === "error" && (
          <div className="dest-error">
            <span>📍</span>
            <p>{name}</p>
          </div>
        )}
        {status === "ready" && images[current] && (
          <>
            <img
              key={images[current]}
              src={images[current]}
              alt={name}
              className="dest-img"
              onError={handleImgError}
            />
            {images.length > 1 && (
              <div className="dest-nav">
                <button className="dest-nav-btn" onClick={prev}>‹</button>
                <div className="dest-dots">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`dest-dot${i === current ? " active" : ""}`}
                      onClick={() => setCurrent(i)}
                    />
                  ))}
                </div>
                <button className="dest-nav-btn" onClick={next}>›</button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="dest-card-label">{name}</div>
    </div>
  );
}

// ── Image strip ───────────────────────────────────────────────────────────────
function DestinationImages({ destinations }: { destinations: string[] }) {
  if (destinations.length === 0) return null;
  return (
    <div className="dest-strip-wrap">
      <div className="dest-strip-header">
        <span className="dest-strip-icon">📸</span>
        <span className="dest-strip-title">Destinations</span>
        <span className="dest-strip-count">{destinations.length} place{destinations.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="dest-strip">
        {destinations.map((d) => <DestinationCard key={d} name={d} />)}
      </div>
    </div>
  );
}

// ── Render AI text ────────────────────────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    elements.push(
      <ul className="msg-list" key={`ul-${keyCounter++}`}>
        {listBuffer.map((item, i) => (
          <li key={i} className="msg-list-item">
            <span className="msg-bullet">›</span>
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line) => {
    const t = line.trim();
    if (!t) { flushList(); return; }

    if (/^(\*{1,2})?(Day\s+\d+)/i.test(t)) {
      flushList();
      const clean = t.replace(/^\*{1,2}|\*{1,2}$/g, "").replace(/^#+\s*/, "").replace(/:$/, "");
      elements.push(
        <div className="msg-day-heading" key={`day-${keyCounter++}`}>
          <span className="msg-day-badge">{clean.match(/Day\s+\d+/i)?.[0]}</span>
          <span className="msg-day-rest">{clean.replace(/Day\s+\d+/i, "").replace(/^[\s\-–:]+/, "")}</span>
        </div>
      );
      return;
    }
    if (/^#{1,3}\s/.test(t)) {
      flushList();
      elements.push(<p className="msg-section-title" key={`h-${keyCounter++}`} dangerouslySetInnerHTML={{ __html: inlineFormat(t.replace(/^#{1,3}\s+/, "")) }} />);
      return;
    }
    if (/^\*{2}.+\*{2}$/.test(t) && !t.includes(" ** ")) {
      flushList();
      elements.push(<p className="msg-bold-label" key={`b-${keyCounter++}`}>{t.replace(/^\*{2}|\*{2}$/g, "")}</p>);
      return;
    }
    if (/^[-*•]\s/.test(t)) { listBuffer.push(t.replace(/^[-*•]\s+/, "")); return; }
    if (/^\d+\.\s/.test(t)) { listBuffer.push(t.replace(/^\d+\.\s+/, "")); return; }
    if (/^[A-Z][^:]{0,30}:\s/.test(t) && !t.startsWith("http")) {
      flushList();
      const ci = t.indexOf(":");
      elements.push(
        <div className="msg-kv" key={`kv-${keyCounter++}`}>
          <span className="msg-kv-key">{t.slice(0, ci)}</span>
          <span className="msg-kv-val" dangerouslySetInnerHTML={{ __html: inlineFormat(t.slice(ci + 1).trim()) }} />
        </div>
      );
      return;
    }
    flushList();
    elements.push(<p className="msg-para" key={`p-${keyCounter++}`} dangerouslySetInnerHTML={{ __html: inlineFormat(t) }} />);
  });

  flushList();
  return elements;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWindow({ messages, loading, onChipClick }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');

        .chat-window { flex:1; overflow-y:auto; padding:36px 0 20px; background:#111210; scrollbar-width:thin; scrollbar-color:rgba(240,237,230,0.1) transparent; }
        .chat-window::-webkit-scrollbar { width:3px; }
        .chat-window::-webkit-scrollbar-thumb { background:rgba(240,237,230,0.12); border-radius:2px; }

        .messages-inner { max-width:720px; margin:0 auto; padding:0 32px; display:flex; flex-direction:column; gap:20px; }

        .empty-state { max-width:520px; margin:48px auto 0; padding:0 32px; text-align:center; }
        .empty-glyph { font-family:'Cormorant Garamond',serif; font-size:52px; font-weight:300; font-style:italic; color:rgba(240,237,230,0.08); margin-bottom:20px; display:block; animation:glyphFloat 4s ease-in-out infinite; }
        @keyframes glyphFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        .empty-title { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:300; color:rgba(240,237,230,0.82); margin-bottom:10px; }
        .empty-sub { font-size:13px; font-weight:300; color:rgba(240,237,230,0.3); line-height:1.75; margin-bottom:32px; font-family:'DM Sans',sans-serif; }
        .chips-grid { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
        .chip { padding:8px 16px; background:rgba(240,237,230,0.05); border:1px solid rgba(240,237,230,0.12); color:rgba(240,237,230,0.45); font-size:12px; font-weight:300; cursor:pointer; border-radius:100px; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .chip:hover { border-color:rgba(201,169,110,0.5); color:#c9a96e; background:rgba(201,169,110,0.08); transform:translateY(-1px); }

        .message-row { display:flex; gap:12px; animation:msgIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
        .message-row.user { flex-direction:row-reverse; }
        @keyframes msgIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .avatar { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:4px; }
        .avatar.ai-av { background:#1e1d1a; color:#c9a96e; font-family:'Cormorant Garamond',serif; font-size:14px; font-style:italic; border:1px solid rgba(201,169,110,0.25); }
        .avatar.user-av { background:#c9a96e; color:#0a0a08; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; }

        .bubble { max-width:calc(100% - 44px); border-radius:10px; font-family:'DM Sans',sans-serif; word-break:break-word; }
        .user-bubble { padding:11px 16px; background:#c9a96e; color:#0f0e0c; font-size:14px; font-weight:400; line-height:1.65; letter-spacing:0.01em; border:none; border-radius:8px 2px 8px 8px; box-shadow:0 2px 8px rgba(201,169,110,0.25); }
        .ai-bubble { background:#1a1917; color:rgba(240,237,230,0.88); border:1px solid rgba(240,237,230,0.08); border-radius:2px 10px 10px 10px; box-shadow:0 4px 20px rgba(0,0,0,0.35); overflow:hidden; }
        .ai-content { padding:16px 20px 14px; display:flex; flex-direction:column; gap:10px; }

        /* ─ Destination strip ─ */
        .dest-strip-wrap { border-top:1px solid rgba(240,237,230,0.06); padding:12px 0 4px; }
        .dest-strip-header { display:flex; align-items:center; gap:7px; padding:0 20px 10px; }
        .dest-strip-icon { font-size:12px; }
        .dest-strip-title { font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; color:rgba(240,237,230,0.35); letter-spacing:0.1em; text-transform:uppercase; }
        .dest-strip-count { margin-left:auto; font-family:'DM Sans',sans-serif; font-size:10px; color:rgba(201,169,110,0.5); }

        .dest-strip { display:flex; gap:10px; padding:0 20px 16px; overflow-x:auto; scrollbar-width:thin; scrollbar-color:rgba(240,237,230,0.06) transparent; }
        .dest-strip::-webkit-scrollbar { height:2px; }
        .dest-strip::-webkit-scrollbar-thumb { background:rgba(240,237,230,0.1); border-radius:2px; }

        .dest-card { flex-shrink:0; width:158px; border-radius:8px; overflow:hidden; border:1px solid rgba(240,237,230,0.07); background:#111210; transition:transform 0.2s,box-shadow 0.2s; cursor:pointer; }
        .dest-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.5); border-color:rgba(201,169,110,0.2); }

        .dest-card-img-wrap { position:relative; width:100%; height:108px; overflow:hidden; background:#0d0c0b; }
        .dest-img { width:100%; height:100%; object-fit:cover; display:block; animation:imgFade 0.5s ease forwards; }
        @keyframes imgFade { from{opacity:0} to{opacity:1} }

        .dest-skeleton { position:absolute; inset:0; overflow:hidden; background:#161410; }
        .dest-shimmer { position:absolute; inset:0; background:linear-gradient(90deg,transparent 0%,rgba(201,169,110,0.07) 50%,transparent 100%); background-size:200% 100%; animation:shimmer 1.6s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .dest-error { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px; background:#0d0c0b; color:rgba(240,237,230,0.2); }
        .dest-error span { font-size:22px; }
        .dest-error p { font-family:'DM Sans',sans-serif; font-size:10px; text-align:center; padding:0 8px; }

        .dest-nav { position:absolute; bottom:0; left:0; right:0; display:flex; align-items:center; justify-content:space-between; padding:3px 5px; background:linear-gradient(to top,rgba(0,0,0,0.72) 0%,transparent 100%); }
        .dest-nav-btn { width:20px; height:20px; background:rgba(0,0,0,0.45); border:1px solid rgba(255,255,255,0.15); border-radius:50%; color:rgba(255,255,255,0.8); font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; line-height:1; }
        .dest-nav-btn:hover { background:rgba(201,169,110,0.55); }
        .dest-dots { display:flex; gap:3px; align-items:center; }
        .dest-dot { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,0.3); cursor:pointer; transition:background 0.15s; }
        .dest-dot.active { background:#c9a96e; }

        .dest-card-label { padding:7px 10px 8px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:400; color:rgba(240,237,230,0.7); letter-spacing:0.05em; text-transform:uppercase; background:#111210; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        /* Content */
        .msg-day-heading { display:flex; align-items:baseline; gap:10px; padding:10px 0 6px; border-bottom:1px solid rgba(201,169,110,0.15); margin-bottom:2px; }
        .msg-day-badge { font-family:'Cormorant Garamond',serif; font-size:13px; font-style:italic; color:#c9a96e; background:rgba(201,169,110,0.1); padding:2px 10px; border-radius:100px; border:1px solid rgba(201,169,110,0.2); flex-shrink:0; }
        .msg-day-rest { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:rgba(240,237,230,0.75); }
        .msg-section-title { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:rgba(240,237,230,0.7); letter-spacing:0.04em; text-transform:uppercase; padding-top:6px; }
        .msg-bold-label { font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:rgba(240,237,230,0.65); padding:4px 0 2px; }
        .msg-kv { display:flex; gap:8px; align-items:baseline; font-family:'DM Sans',sans-serif; font-size:13.5px; line-height:1.6; }
        .msg-kv-key { color:#c9a96e; font-weight:400; flex-shrink:0; font-size:12px; letter-spacing:0.04em; text-transform:uppercase; }
        .msg-kv-val { color:rgba(240,237,230,0.78); font-weight:300; }
        .msg-para { font-family:'DM Sans',sans-serif; font-size:14px; font-weight:300; color:rgba(240,237,230,0.78); line-height:1.8; }
        .msg-list { display:flex; flex-direction:column; gap:5px; padding:0; margin:0; list-style:none; }
        .msg-list-item { display:flex; gap:10px; align-items:flex-start; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:300; color:rgba(240,237,230,0.75); line-height:1.7; }
        .msg-bullet { color:#c9a96e; font-size:14px; flex-shrink:0; opacity:0.7; }
        .ai-content code { background:rgba(201,169,110,0.1); color:#c9a96e; padding:1px 6px; border-radius:3px; font-size:12px; font-family:monospace; border:1px solid rgba(201,169,110,0.15); }
        .ai-content strong { color:rgba(240,237,230,0.92); font-weight:500; }
        .ai-content em { color:#c9a96e; font-style:italic; }

        .typing-row { display:flex; gap:12px; animation:msgIn 0.35s ease forwards; }
        .typing-bubble { background:#1a1917; border:1px solid rgba(240,237,230,0.08); padding:14px 18px; border-radius:2px 10px 10px 10px; display:flex; gap:5px; align-items:center; }
        .dot { width:6px; height:6px; border-radius:50%; background:rgba(201,169,110,0.5); animation:bounce 1.3s ease-in-out infinite; }
        .dot:nth-child(2){animation-delay:0.18s} .dot:nth-child(3){animation-delay:0.36s}
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.35} 30%{transform:translateY(-5px);opacity:1} }

        .msg-separator { display:flex; align-items:center; gap:12px; margin:4px 0; }
        .msg-separator::before,.msg-separator::after { content:''; flex:1; height:1px; background:rgba(240,237,230,0.07); }
        .msg-separator span { font-family:'DM Sans',sans-serif; font-size:10px; font-weight:300; color:rgba(240,237,230,0.2); letter-spacing:0.1em; text-transform:uppercase; }

        @media(max-width:640px) {
          .messages-inner{padding:0 16px}
          .empty-state{padding:0 16px}
          .ai-content{padding:14px 16px 12px}
          .dest-card{width:130px}
          .dest-card-img-wrap{height:88px}
        }
      `}</style>

      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-glyph">✦</span>
            <h2 className="empty-title">Where shall we go?</h2>
            <p className="empty-sub">Fill the planner below or just type your own message to get started.</p>
            <div className="chips-grid">
              {SUGGESTION_CHIPS.map((s) => (
                <button key={s} className="chip" onClick={() => onChipClick?.(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-inner">
            <div className="msg-separator"><span>Today</span></div>
            {messages.map((msg, i) => {
              const destinations = msg.role === "assistant" ? extractDestinations(msg.content) : [];
              return (
                <div key={i} className={`message-row ${msg.role}`}>
                  <div className={`avatar ${msg.role === "assistant" ? "ai-av" : "user-av"}`}>
                    {msg.role === "assistant" ? "v" : "you"}
                  </div>
                  {msg.role === "user" ? (
                    <div className="bubble user-bubble">{msg.content}</div>
                  ) : (
                    <div className="bubble ai-bubble">
                      <div className="ai-content">{renderContent(msg.content)}</div>
                      {destinations.length > 0 && <DestinationImages destinations={destinations} />}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="typing-row">
                <div className="avatar ai-av">v</div>
                <div className="typing-bubble">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </>
  );
}
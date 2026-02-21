"use client";

import { useEffect, useRef } from "react";

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

// ── Render AI message content with structure ──────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
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

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // blank line
    if (!trimmed) {
      flushList();
      return;
    }

    // Day heading: "Day 1", "Day 1:", "Day 1 –", "**Day 1**" etc.
    if (/^(\*{1,2})?(Day\s+\d+)/i.test(trimmed)) {
      flushList();
      const clean = trimmed.replace(/^\*{1,2}|\*{1,2}$/g, "").replace(/^#+\s*/, "").replace(/:$/, "");
      elements.push(
        <div className="msg-day-heading" key={`day-${keyCounter++}`}>
          <span className="msg-day-badge">{clean.match(/Day\s+\d+/i)?.[0]}</span>
          <span className="msg-day-rest">{clean.replace(/Day\s+\d+/i, "").replace(/^[\s\-–:]+/, "")}</span>
        </div>
      );
      return;
    }

    // Markdown heading ## or ###
    if (/^#{1,3}\s/.test(trimmed)) {
      flushList();
      const clean = trimmed.replace(/^#{1,3}\s+/, "");
      elements.push(
        <p className="msg-section-title" key={`h-${keyCounter++}`}
          dangerouslySetInnerHTML={{ __html: inlineFormat(clean) }} />
      );
      return;
    }

    // Bold-only line (acts as a section label)
    if (/^\*{2}.+\*{2}$/.test(trimmed) && !trimmed.includes(" ** ")) {
      flushList();
      const clean = trimmed.replace(/^\*{2}|\*{2}$/g, "");
      elements.push(
        <p className="msg-bold-label" key={`b-${keyCounter++}`}>{clean}</p>
      );
      return;
    }

    // Bullet: -, *, •
    if (/^[-*•]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*•]\s+/, ""));
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    // Key: Value pairs (e.g. "Destination: Bangkok")
    if (/^[A-Z][^:]{0,30}:\s/.test(trimmed) && !trimmed.startsWith("http")) {
      flushList();
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx);
      const val = trimmed.slice(colonIdx + 1).trim();
      elements.push(
        <div className="msg-kv" key={`kv-${keyCounter++}`}>
          <span className="msg-kv-key">{key}</span>
          <span className="msg-kv-val" dangerouslySetInnerHTML={{ __html: inlineFormat(val) }} />
        </div>
      );
      return;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p className="msg-para" key={`p-${keyCounter++}`}
        dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />
    );
  });

  flushList();
  return elements;
}

// Inline: **bold**, *italic*, `code`
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatWindow({ messages, loading, onChipClick }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');

        .chat-window {
          flex: 1;
          overflow-y: auto;
          padding: 36px 0 20px;
          background: #111210;
          scrollbar-width: thin;
          scrollbar-color: rgba(240,237,230,0.1) transparent;
        }

        .chat-window::-webkit-scrollbar { width: 3px; }
        .chat-window::-webkit-scrollbar-track { background: transparent; }
        .chat-window::-webkit-scrollbar-thumb { background: rgba(240,237,230,0.12); border-radius: 2px; }

        .messages-inner {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ---- Empty State ---- */
        .empty-state {
          max-width: 520px;
          margin: 48px auto 0;
          padding: 0 32px;
          text-align: center;
        }

        .empty-glyph {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          font-weight: 300;
          font-style: italic;
          color: rgba(240,237,230,0.08);
          margin-bottom: 20px;
          display: block;
          line-height: 1;
          animation: glyphFloat 4s ease-in-out infinite;
        }

        @keyframes glyphFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 300;
          color: rgba(240,237,230,0.82);
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .empty-sub {
          font-size: 13px;
          font-weight: 300;
          color: rgba(240,237,230,0.3);
          line-height: 1.75;
          margin-bottom: 32px;
          font-family: 'DM Sans', sans-serif;
        }

        .chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .chip {
          padding: 8px 16px;
          background: rgba(240,237,230,0.05);
          border: 1px solid rgba(240,237,230,0.12);
          color: rgba(240,237,230,0.45);
          font-size: 12px;
          font-weight: 300;
          cursor: pointer;
          border-radius: 100px;
          transition: all 0.2s;
          letter-spacing: 0.02em;
          font-family: 'DM Sans', sans-serif;
        }

        .chip:hover {
          border-color: rgba(201,169,110,0.5);
          color: #c9a96e;
          background: rgba(201,169,110,0.08);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(201,169,110,0.1);
        }

        /* ---- Message Rows ---- */
        .message-row {
          display: flex;
          gap: 12px;
          animation: msgIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .message-row.user { flex-direction: row-reverse; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
        }

        .avatar.ai-av {
          background: #1e1d1a;
          color: #c9a96e;
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          font-style: italic;
          font-weight: 300;
          border: 1.5px solid rgba(201,169,110,0.3);
        }

        .avatar.user-av {
          background: #c9a96e;
          color: #0a0a08;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ---- User Bubble ---- */
        .bubble.user-bubble {
          max-width: calc(100% - 44px);
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.65;
          letter-spacing: 0.01em;
          font-family: 'DM Sans', sans-serif;
          background: #c9a96e;
          color: #0f0e0c;
          border: none;
          border-radius: 8px 2px 8px 8px;
          box-shadow: 0 2px 8px rgba(201,169,110,0.25);
        }

        /* ---- AI Bubble ---- */
        .bubble.ai-bubble {
          max-width: calc(100% - 44px);
          background: #1a1917;
          color: rgba(240,237,230,0.88);
          border: 1px solid rgba(240,237,230,0.08);
          border-radius: 2px 10px 10px 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          overflow: hidden;
        }

        /* AI bubble inner padding */
        .ai-content {
          padding: 16px 20px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Day heading block */
        .msg-day-heading {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 10px 0 6px;
          border-bottom: 1px solid rgba(201,169,110,0.15);
          margin-bottom: 2px;
        }

        .msg-day-badge {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 400;
          font-style: italic;
          color: #c9a96e;
          letter-spacing: 0.04em;
          flex-shrink: 0;
          background: rgba(201,169,110,0.1);
          padding: 2px 10px;
          border-radius: 100px;
          border: 1px solid rgba(201,169,110,0.2);
        }

        .msg-day-rest {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,237,230,0.75);
          letter-spacing: 0.01em;
        }

        /* Section title (##) */
        .msg-section-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,237,230,0.7);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding-top: 6px;
        }

        /* Bold-only label */
        .msg-bold-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,237,230,0.65);
          padding: 4px 0 2px;
          letter-spacing: 0.02em;
        }

        /* Key: Value */
        .msg-kv {
          display: flex;
          gap: 8px;
          align-items: baseline;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          line-height: 1.6;
        }

        .msg-kv-key {
          color: #c9a96e;
          font-weight: 400;
          flex-shrink: 0;
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding-top: 1px;
        }

        .msg-kv-val {
          color: rgba(240,237,230,0.78);
          font-weight: 300;
        }

        /* Paragraph */
        .msg-para {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgba(240,237,230,0.78);
          line-height: 1.8;
          letter-spacing: 0.01em;
        }

        /* List */
        .msg-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .msg-list-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 300;
          color: rgba(240,237,230,0.75);
          line-height: 1.7;
        }

        .msg-bullet {
          color: #c9a96e;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
          opacity: 0.7;
        }

        /* Inline code */
        .ai-content code {
          background: rgba(201,169,110,0.1);
          color: #c9a96e;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 12px;
          font-family: monospace;
          border: 1px solid rgba(201,169,110,0.15);
        }

        /* Inline bold/em in paragraphs */
        .ai-content strong {
          color: rgba(240,237,230,0.92);
          font-weight: 500;
        }

        .ai-content em {
          color: #c9a96e;
          font-style: italic;
        }

        /* ---- Typing indicator ---- */
        .typing-row {
          display: flex;
          gap: 12px;
          animation: msgIn 0.35s ease forwards;
        }

        .typing-bubble {
          background: #1a1917;
          border: 1px solid rgba(240,237,230,0.08);
          padding: 14px 18px;
          border-radius: 2px 10px 10px 10px;
          display: flex;
          gap: 5px;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(201,169,110,0.5);
          animation: bounce 1.3s ease-in-out infinite;
        }

        .dot:nth-child(2) { animation-delay: 0.18s; }
        .dot:nth-child(3) { animation-delay: 0.36s; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* ---- Separator ---- */
        .msg-separator {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .msg-separator::before,
        .msg-separator::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(240,237,230,0.07);
        }

        .msg-separator span {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 300;
          color: rgba(240,237,230,0.2);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .messages-inner { padding: 0 16px; }
          .empty-state { padding: 0 16px; }
          .ai-content { padding: 14px 16px 12px; }
        }
      `}</style>

      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-glyph">✦</span>
            <h2 className="empty-title">Where shall we go?</h2>
            <p className="empty-sub">
              Fill the planner below or just type your own message to get started.
            </p>
            <div className="chips-grid">
              {SUGGESTION_CHIPS.map((s) => (
                <button key={s} className="chip" onClick={() => onChipClick?.(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-inner">
            <div className="msg-separator"><span>Today</span></div>

            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className={`avatar ${msg.role === "assistant" ? "ai-av" : "user-av"}`}>
                  {msg.role === "assistant" ? "v" : "you"}
                </div>

                {msg.role === "user" ? (
                  <div className="bubble user-bubble">{msg.content}</div>
                ) : (
                  <div className="bubble ai-bubble">
                    <div className="ai-content">
                      {renderContent(msg.content)}
                    </div>
                  </div>
                )}
              </div>
            ))}

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
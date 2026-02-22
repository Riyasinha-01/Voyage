"use client";

import { useRef } from "react";
import TripPlannerForm from "@/components/TripPlanner";

interface MessageInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  loading?: boolean;
}

export default function MessageInput({ value, onChange, onSend, loading }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleFormSubmit = (prompt: string) => {
    onChange(prompt);
    setTimeout(() => onSend(), 50);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

        .mi-area {
          background: #111210;
          border-top: 1px solid rgba(240,237,230,0.07);
          flex-shrink: 0;
          width: 100%;
          /* Let it breathe on desktop, compact on mobile */
          padding: 8px 0 14px;
        }

        @media (min-width: 768px) {
          .mi-area { padding: 12px 0 22px; }
        }

        .mi-inner {
          max-width: 700px;
          margin: 0 auto;
          padding: 0 16px;
          background: #111210;
        }

        @media (min-width: 768px) {
          .mi-inner { padding: 0 32px; }
        }

        .mi-or {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 0;
          background: #111210;
        }

        @media (min-width: 768px) {
          .mi-or { padding: 8px 0; }
        }

        .mi-or-line {
          flex: 1;
          height: 1px;
          background: rgba(240,237,230,0.07);
        }

        .mi-or-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 300;
          color: rgba(240,237,230,0.18);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .mi-box {
          position: relative;
          background: #1e1d1a;
          border: 1px solid rgba(240,237,230,0.12);
          border-radius: 6px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .mi-box:focus-within {
          border-color: rgba(201,169,110,0.4);
          box-shadow: 0 2px 20px rgba(201,169,110,0.1);
        }

        .mi-textarea {
          width: 100%;
          padding: 11px 48px 11px 14px;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: rgba(240,237,230,0.82);
          resize: none;
          line-height: 1.5;
          max-height: 120px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(240,237,230,0.08) transparent;
          display: block;
          /* Prevent iOS zoom on focus */
          font-size: 16px;
        }

        @media (min-width: 768px) {
          .mi-textarea {
            padding: 14px 52px 14px 18px;
            font-size: 14px;
            max-height: 160px;
          }
        }

        .mi-textarea::placeholder { color: rgba(240,237,230,0.2); }

        .mi-send {
          position: absolute;
          right: 9px;
          bottom: 8px;
          width: 32px;
          height: 32px;
          background: rgba(240,237,230,0.06);
          border: 1px solid rgba(240,237,230,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .mi-send:hover:not(:disabled),
        .mi-send:active:not(:disabled) {
          background: #c9a96e;
          border-color: #c9a96e;
        }

        .mi-send:disabled { opacity: 0.25; cursor: not-allowed; }

        .mi-send-icon {
          width: 14px;
          height: 14px;
          fill: none;
          stroke: rgba(240,237,230,0.65);
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .mi-send:hover:not(:disabled) .mi-send-icon,
        .mi-send:active:not(:disabled) .mi-send-icon { stroke: #0a0a08; }

        .mi-spinner {
          width: 13px;
          height: 13px;
          border: 1.5px solid rgba(240,237,230,0.12);
          border-top-color: #c9a96e;
          border-radius: 50%;
          animation: miSpin 0.7s linear infinite;
        }

        @keyframes miSpin { to { transform: rotate(360deg); } }

        .mi-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 6px;
          background: #111210;
        }

        .mi-hint {
          font-size: 10px;
          color: rgba(240,237,230,0.14);
          letter-spacing: 0.04em;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
        }

        /* Hide keyboard hints on mobile to save space */
        @media (max-width: 767px) {
          .mi-footer { display: none; }
        }

        .mi-dot {
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(240,237,230,0.1);
          display: inline-block;
        }
      `}</style>

      <div className="mi-area">
        <TripPlannerForm onSubmit={handleFormSubmit} />

        <div className="mi-inner">
          <div className="mi-or">
            <div className="mi-or-line" />
            <span className="mi-or-text">or write your own</span>
            <div className="mi-or-line" />
          </div>

          <div className="mi-box">
            <textarea
              ref={textareaRef}
              className="mi-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Ask about destinations, itineraries, hidden gems..."
              rows={1}
            />
            <button className="mi-send" onClick={onSend} disabled={!value.trim() || loading}>
              {loading ? (
                <div className="mi-spinner" />
              ) : (
                <svg className="mi-send-icon" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="mi-footer">
            <span className="mi-hint">Enter to send</span>
            <span className="mi-dot" />
            <span className="mi-hint">Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </>
  );
}
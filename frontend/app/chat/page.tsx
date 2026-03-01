"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, fetchChatHistory } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function ChatPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/"); return; }
      try {
        const res = await fetch("https://voyage-k82c.onrender.com/api/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { localStorage.removeItem("token"); router.push("/"); }
      } catch {
        console.log("Backend offline");
      }
    };
    checkSession();
  }, []);

  const handleSelectChat = async (id: string) => {
    try {
      const data = await fetchChatHistory(id);
      setChatId(id);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch { setMessages([]); }
    if (isMobile) setSidebarOpen(false);
  };

  const handleNewChat = () => {
    setChatId(undefined);
    setMessages([]);
    setInput("");
    if (isMobile) setSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    try {
      const response = await sendMessage(userMessage, chatId);
      if (response.chat_id) setChatId(response.chat_id);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const handleDeleteChat = (deletedId: string) => {
    if (deletedId === chatId) {
      setChatId(undefined);
      setMessages([]);
      setInput("");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #111210; height: 100%; overflow: hidden; }

        .page-layout {
          display: flex;
          height: 100dvh;
          overflow: hidden;
          background: #111210;
          position: relative;
        }

        /* ── Desktop sidebar (pushes content) ── */
        .sidebar-wrapper {
          flex-shrink: 0;
          width: 280px;
          height: 100dvh;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1),
                      opacity 0.3s ease;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        .sidebar-wrapper.collapsed {
          width: 0;
          opacity: 0;
          pointer-events: none;
        }

        /* ── Mobile sidebar (overlay, doesn't push) ── */
        @media (max-width: 767px) {
          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px !important;
            height: 100dvh;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1),
                        opacity 0.3s ease;
            opacity: 1 !important;
          }

          .sidebar-wrapper.open-mobile {
            transform: translateX(0);
          }
        }

        /* Mobile backdrop */
        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 767px) {
          .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(2px);
            z-index: 199;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }

          .sidebar-backdrop.visible {
            opacity: 1;
            pointer-events: all;
          }
        }

        .main-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100dvh;
          background: #111210;
          overflow: hidden;
        }

        /* Topbar */
        .topbar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 20px;
          border-bottom: 1px solid rgba(240,237,230,0.07);
          flex-shrink: 0;
          background: #161512;
        }

        @media (min-width: 768px) {
          .topbar { padding: 16px 32px; }
        }

        .toggle-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
          background: none;
          border: 1px solid rgba(240,237,230,0.1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
          border-radius: 5px;
          flex-shrink: 0;
        }

        .toggle-btn:hover {
          background: rgba(240,237,230,0.05);
          border-color: rgba(240,237,230,0.2);
        }

        .toggle-btn span {
          display: block;
          width: 13px;
          height: 1.5px;
          background: rgba(240,237,230,0.4);
          border-radius: 1px;
        }

        .topbar-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: rgba(240,237,230,0.3);
          letter-spacing: 0.02em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        /* ── What's Nearby button — right-aligned ── */
        .nearby-btn {
          margin-left: auto;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #c9a96e;
          text-decoration: none;
          padding: 6px 14px;
          border: 1px solid rgba(201,169,110,0.35);
          border-radius: 5px;
          background: rgba(201,169,110,0.06);
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .nearby-btn::before {
          content: '';
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c9a96e;
          opacity: 0.75;
          flex-shrink: 0;
        }

        .nearby-btn:hover {
          background: rgba(201,169,110,0.14);
          border-color: rgba(201,169,110,0.65);
          color: #e0c080;
        }

        /* On very small screens, hide the text and show only the dot + icon feel */
        @media (max-width: 380px) {
          .nearby-btn {
            padding: 6px 10px;
            font-size: 11px;
            letter-spacing: 0.04em;
          }

          .nearby-btn-text {
            display: none;
          }

          .nearby-btn::after {
            content: 'Nearby';
            font-size: 11px;
          }
        }
      `}</style>

      <div className="page-layout">

        {/* Mobile backdrop */}
        <div
          className={`sidebar-backdrop ${isMobile && sidebarOpen ? "visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className={`sidebar-wrapper ${
          isMobile
            ? sidebarOpen ? "open-mobile" : ""
            : sidebarOpen ? "" : "collapsed"
        }`}>
          <Sidebar
            activeChatId={chatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        {/* Main panel */}
        <div className="main-panel">
          <div className="topbar">
            <button
              className="toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <span /><span /><span />
            </button>
            <span className="topbar-label">
              {messages.length > 0 ? "AI Travel Planner" : "Start a new journey"}
            </span>
            {/* Nearby button — pushed to far right via margin-left: auto on the element itself */}
            <Link href="/nearby" className="nearby-btn">
              <span className="nearby-btn-text">What&apos;s Nearby</span>
            </Link>
          </div>

          <ChatWindow
            messages={messages}
            loading={loading}
            onChipClick={(text) => setInput(text)}
          />

          <MessageInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
}
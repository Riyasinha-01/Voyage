"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, fetchChatHistory } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if (!token) router.push("/");
  // }, [router]);
  useEffect(() => {
  const checkSession = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        router.push("/");
      }

    } catch {
      // Backend offline → do nothing
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
  };

  const handleNewChat = () => {
    setChatId(undefined);
    setMessages([]);
    setInput("");
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
    // If currently open chat is deleted
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
        body { background: #111210; height: 100vh; overflow: hidden; }

        .page-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #111210;
        }

        .sidebar-wrapper {
          flex-shrink: 0;
          width: 280px;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
          overflow: hidden;
        }

        .sidebar-wrapper.collapsed { width: 0; opacity: 0; }

        .main-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #111210;
        }

        /* Topbar */
        .topbar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(240,237,230,0.07);
          flex-shrink: 0;
          background: #161512;
        }

        .toggle-btn {
          width: 30px;
          height: 30px;
          background: none;
          border: 1px solid rgba(240,237,230,0.1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
          border-radius: 4px;
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
        }

        .topbar-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #c9a96e;
          opacity: 0.5;
          margin-left: auto;
        }
      `}</style>

      <div className="page-layout">
        <div className={`sidebar-wrapper ${sidebarOpen ? "" : "collapsed"}`}>
          <Sidebar
            activeChatId={chatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        <div className="main-panel">
          <div className="topbar">
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
              <span /><span /><span />
            </button>
            <span className="topbar-label">
              {messages.length > 0 ? "AI Travel Planner" : "Start a new journey"}
            </span>
            <div className="topbar-dot" />
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
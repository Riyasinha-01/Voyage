"use client";

import { useEffect, useState } from "react";
import { fetchChats } from "@/lib/api";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeChatId?: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const BASE_URL = "http://127.0.0.1:8000/api";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/profile/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  return {
    name: data.name || "Traveller",
    email: data.email || "",
    avatar: data.image || undefined,
  };
}

async function deleteChat(chatId: string): Promise<void> {
  await fetch(`http://127.0.0.1:8000/api/chat/delete/${chatId}/`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${getToken()}` },
});
}

export default function Sidebar({ activeChatId, onSelectChat, onNewChat, onDeleteChat }: SidebarProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [user, setUser] = useState<UserProfile>({
    name: "Traveller",
    email: "",
    avatar: undefined,
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadChats();
    loadProfile();
  }, []);

  const loadChats = async () => {
    try {
      const data = await fetchChats();
      setChats(Array.isArray(data) ? data : []);
    } catch {
      setChats([]);
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch {
      // keep defaults
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteChat(deleteTarget.id);
      setChats((prev) => prev.filter((c) => (c.chat_id || c.id) !== deleteTarget.id));
    } catch {
      // handle error silently or show toast
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap');

        .sidebar {
          width: 280px;
          min-width: 280px;
          height: 100vh;
          background: #1a1916;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 28px 24px 20px;
          border-bottom: 1px solid rgba(240,237,230,0.07);
          flex-shrink: 0;
        }

        .sidebar-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 400;
          color: #f0ede6;
          letter-spacing: 0.06em;
          margin-bottom: 20px;
          white-space: nowrap;
        }

        .sidebar-logo span { color: #c9a96e; }

        .new-chat-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: rgba(201,169,110,0.1);
          border: 1px solid rgba(201,169,110,0.2);
          color: #c9a96e;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .new-chat-btn:hover {
          background: rgba(201,169,110,0.18);
          border-color: rgba(201,169,110,0.35);
        }

        .sidebar-section-label {
          padding: 20px 24px 8px;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.2);
          white-space: nowrap;
          flex-shrink: 0;
          min-height: 38px;
        }

        .chat-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px 12px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(240,237,230,0.08) transparent;
        }

        .chat-list::-webkit-scrollbar { width: 3px; }
        .chat-list::-webkit-scrollbar-track { background: transparent; }
        .chat-list::-webkit-scrollbar-thumb { background: rgba(240,237,230,0.1); }

        .chat-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
          margin-bottom: 2px;
          overflow: hidden;
          position: relative;
          gap: 8px;
        }

        .chat-item:hover { background: rgba(240,237,230,0.07); }
        .chat-item.active { background: rgba(240,237,230,0.1); }

        .chat-item-main {
          flex: 1;
          min-width: 0;
        }

        .chat-item-icon {
          font-size: 10px;
          color: rgba(201,169,110,0.5);
          margin-bottom: 3px;
        }

        .chat-item-title {
          font-size: 13px;
          font-weight: 300;
          color: rgba(240,237,230,0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }

        .chat-item.active .chat-item-title { color: #f0ede6; }

        .chat-delete-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: none;
          border: none;
          color: rgba(240,237,230,0.0);
          cursor: pointer;
          padding: 0;
          border-radius: 4px;
          transition: color 0.2s, background 0.2s;
        }

        .chat-item:hover .chat-delete-btn {
          color: rgba(240,237,230,0.25);
        }

        .chat-delete-btn:hover {
          color: #e07070 !important;
          background: rgba(224,112,112,0.1) !important;
        }

        .chat-empty {
          padding: 20px 12px;
          font-size: 13px;
          color: rgba(240,237,230,0.18);
          line-height: 1.65;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }

        /* Footer */
        .sidebar-footer {
          border-top: 1px solid rgba(240,237,230,0.07);
          flex-shrink: 0;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px 12px;
        }

        .profile-avatar-wrap {
          position: relative;
          flex-shrink: 0;
          width: 38px;
          height: 38px;
        }

        .profile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #c9a96e 0%, #8b6f3e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(201,169,110,0.25);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #1a1916;
          letter-spacing: 0.04em;
          line-height: 1;
          user-select: none;
        }

        .online-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #1a1916;
        }

        .profile-info {
          flex: 1;
          min-width: 0;
        }

        .profile-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: rgba(240,237,230,0.82);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
          margin-bottom: 3px;
        }

        .profile-email {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          color: rgba(240,237,230,0.26);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.01em;
        }

        .footer-divider {
          height: 1px;
          margin: 0 20px;
          background: rgba(240,237,230,0.05);
        }

        .signout-row {
          padding: 11px 20px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: none;
          border: none;
          color: rgba(240,237,230,0.22);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 300;
          cursor: pointer;
          transition: color 0.2s;
          letter-spacing: 0.04em;
          padding: 0;
          white-space: nowrap;
        }

        .logout-btn:hover { color: rgba(240,237,230,0.55); }
        .logout-btn:hover svg { transform: translateX(2px); }
        .logout-btn svg { transition: transform 0.2s; }

        .app-version {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 300;
          color: rgba(240,237,230,0.1);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Delete Confirmation Modal */
        .delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,9,8,0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: overlayIn 0.18s ease;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .delete-modal {
          background: #211f1c;
          border: 1px solid rgba(240,237,230,0.1);
          width: 320px;
          padding: 28px 28px 24px;
          position: relative;
          animation: modalIn 0.22s cubic-bezier(0.34,1.3,0.64,1);
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .delete-modal-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(224,112,112,0.1);
          border: 1px solid rgba(224,112,112,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #e07070;
        }

        .delete-modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 400;
          color: #f0ede6;
          letter-spacing: 0.02em;
          margin-bottom: 8px;
        }

        .delete-modal-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 300;
          color: rgba(240,237,230,0.38);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .delete-modal-desc strong {
          color: rgba(240,237,230,0.62);
          font-weight: 400;
        }

        .delete-modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-btn-cancel {
          flex: 1;
          padding: 10px;
          background: none;
          border: 1px solid rgba(240,237,230,0.12);
          color: rgba(240,237,230,0.45);
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-cancel:hover {
          background: rgba(240,237,230,0.05);
          color: rgba(240,237,230,0.7);
          border-color: rgba(240,237,230,0.22);
        }

        .modal-btn-delete {
          flex: 1;
          padding: 10px;
          background: rgba(224,112,112,0.12);
          border: 1px solid rgba(224,112,112,0.25);
          color: #e07070;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-btn-delete:hover:not(:disabled) {
          background: rgba(224,112,112,0.2);
          border-color: rgba(224,112,112,0.4);
        }

        .modal-btn-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="delete-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 8.5A1 1 0 004.8 13.5h6.4a1 1 0 001-.95L13 4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="delete-modal-title">Remove this journey?</div>
            <div className="delete-modal-desc">
              <strong>"{deleteTarget.title}"</strong> will be permanently deleted and cannot be recovered.
            </div>
            <div className="delete-modal-actions">
              <button className="modal-btn-cancel" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button
                className="modal-btn-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Removing…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Voya<span>ge</span></div>
          <button className="new-chat-btn" onClick={onNewChat}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New Journey
          </button>
        </div>

        <div className="sidebar-section-label">
          {chats.length > 0 ? "Recent Trips" : ""}
        </div>

        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="chat-empty">
              Your trips will appear here once you start planning.
            </div>
          ) : (
            chats.map((chat: any) => {
              const id = chat.chat_id || chat.id;
              const title = chat.title || "Untitled Trip";
              return (
                <div
                  key={id}
                  className={`chat-item ${id === activeChatId ? "active" : ""}`}
                  onClick={() => onSelectChat(id)}
                >
                  <div className="chat-item-main">
                    <div className="chat-item-icon">✦</div>
                    <div className="chat-item-title">{title}</div>
                  </div>
                  <button
                    className="chat-delete-btn"
                    title="Delete trip"
                    onClick={(e) => handleDeleteClick(e, id, title)}
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1.5 3.5h11M4.5 3.5V2a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1.5M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 7.8a.75.75 0 00.75.7h6.1a.75.75 0 00.75-.7l.7-7.8"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span className="avatar-initials">{getInitials(user.name)}</span>
                )}
              </div>
              <span className="online-dot" />
            </div>
            <div className="profile-info">
              <div className="profile-name">{user.name}</div>
              <div className="profile-email">{user.email}</div>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="signout-row">
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign out
            </button>
            <span className="app-version">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
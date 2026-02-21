const BASE_URL = "https://voyage-k82c.onrender.com/api";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const fetchChats = async () => {
  const res = await fetch(`${BASE_URL}/chat/list/`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
};

export const fetchChatHistory = async (chatId: string) => {
  const res = await fetch(`${BASE_URL}/chat/history/${chatId}/`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
};

export const sendMessage = async (message: string, chatId?: string) => {
  const res = await fetch(`${BASE_URL}/chat/message/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ message, chat_id: chatId })
  });
  return res.json();
};

export async function deleteChat(chatId: string) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `https://voyage-k82c.onrender.com/api/chat/delete/${chatId}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
}
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../services/firebase";
import { ref, push, onValue, update, remove, serverTimestamp, get } from "firebase/database";
import {
  FaComments,
  FaPaperPlane,
  FaTimes,
  FaUserCircle,
  FaTrash,
  FaEdit,
  FaRegCopy,
  FaReply,
  FaThumbsUp,
  FaCheck,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB");
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null); // {id,text,userId,username,photoURL}
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  


// auth listener
useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (u) => {
    if (!u) {
      setUser(null);
      return;
    }

    try {
      // 🔹 Fetch username from Realtime Database
      const snap = await get(ref(db, "users/" + u.uid));
      if (snap.exists()) {
        setUser({
          ...u,
          username: snap.val().username,   // ✅ attach custom username
          photoURL: u.photoURL || "",
        });
      } else {
        setUser({ ...u, username: u.displayName || "Anonymous" });
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setUser({ ...u, username: u.displayName || "Anonymous" });
    }
  });

  return () => unsub();
}, []);

// fetch messages
useEffect(() => {
  const chatsRef = ref(db, "chats");
  const unsub = onValue(chatsRef, (snap) => {
    const val = snap.val();
    if (!val) return setMessages([]);
    const arr = Object.keys(val).map((id) => ({ id, ...val[id] }));
    arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    setMessages(arr);
  });
  return () => unsub();
}, []);

// send message
const sendMessage = async () => {
  if (!user || !input.trim()) return;
  await push(ref(db, "chats"), {
    text: input.trim(),
    userId: user.uid,
    username: user.username || "Anonymous",   // ✅ now using DB username
    photoURL: user.photoURL || "",
    createdAt: serverTimestamp(),
    reactions: {},
    replyTo: replyTo
      ? {
          id: replyTo.id,
          text: replyTo.text,
          userId: replyTo.userId,
          username: replyTo.username || "User",
          photoURL: replyTo.photoURL || "",
        }
      : null,
  });
  setInput("");
  setReplyTo(null);
};


  const deleteMessage = async (m) => {
    if (user?.uid !== m.userId) return;
    await remove(ref(db, `chats/${m.id}`));
  };

  const startEdit = (m) => {
    if (user?.uid !== m.userId) return;
    setEditingId(m.id);
    setEditingText(m.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (m) => {
    const newText = editingText.trim();
    if (!newText) return;
    await update(ref(db, `chats/${m.id}`), { text: newText, edited: true });
    cancelEdit();
  };

  const toggleReaction = async (m) => {
    if (!user) return;
    const hasLiked = (m.reactions || {})[user.uid] === "👍";
    await update(ref(db, `chats/${m.id}/reactions`), { [user.uid]: hasLiked ? null : "👍" });
  };

  // group by date
  const grouped = useMemo(() => {
    const map = {};
    for (let m of messages) {
      const ts = m.createdAt?.toMillis ? m.createdAt.toMillis() : m.createdAt;
      const dateStr = ts ? formatDate(ts) : "Unknown";
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(m);
    }
    return map;
  }, [messages]);

  const Avatar = ({ url, size = 32 }) =>
    url ? (
      <img src={url} alt="avatar" className="rounded-full object-cover" style={{ width: size, height: size }} />
    ) : (
      <FaUserCircle style={{ width: size, height: size }} className="text-gray-400" />
    );

  // Small reply snippet used both in bubbles and in the input preview
  const ReplySnippet = ({ data, compact = false }) => {
    if (!data) return null;
    return (
      <div className={`${compact ? "py-1" : "py-1.5"} px-2 rounded-md ${compact ? "" : "shadow-sm"} bg-black/5 text-gray-800`}>
        <div className="flex items-start gap-2">
          <div className="w-1.5 rounded bg-green-500 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Avatar url={data.photoURL || ""} size={18} />
              <span className="text-[11px] font-semibold text-emerald-900 truncate">
                {data.username || "User"}
              </span>
            </div>
            <div className="text-[11px] opacity-80 line-clamp-2 break-words">
              {data.text}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          if (!user) {
            toast.warning("Please login to use community chat.");
            return;
          }
          setIsOpen((p) => !p);
        }}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center"
      >
        <FaComments className="text-2xl" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div onClick={() => setIsOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-gray-100 w-full sm:max-w-2xl sm:rounded-lg sm:shadow-lg h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold">Community Chat </h3>
              <button onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.keys(grouped).map((date) => (
                <div key={date}>
                  <div className="flex justify-center my-2">
                    <span className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                      {date}
                    </span>
                  </div>

                  {grouped[date].map((m) => {
                    const isMe = m.userId === user?.uid;
                    const ts = m.createdAt?.toMillis ? m.createdAt.toMillis() : m.createdAt;
                    const likeCount = Object.values(m.reactions || {}).filter((r) => r === "👍").length;
                    const userLiked = m.reactions?.[user?.uid] === "👍";

                    return (
                      <div key={m.id} className={`flex items-start gap-2 mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
                        {!isMe && <Avatar url={m.photoURL} />}

                        <div className={`relative max-w-xs sm:max-w-md px-3 py-2 rounded-lg shadow text-sm ${isMe ? "bg-emerald-700 text-white" : "bg-white text-gray-800"}`}>
                          {/* Name next to avatar at top of message */}
                          <div className="flex items-center gap-2 mb-1">
                            {isMe ? null : <span className={`text-[12px] font-semibold ${isMe ? "text-white/90" : "text-green-900"}`}>{m.username || "User"}</span>}
                            {isMe && <span className="text-[12px] font-semibold text-white/90">You</span>}
                          </div>

                          {/* Replied-to snippet inside bubble */}
                          {m.replyTo && (
                            <div className={`${isMe ? "bg-white/15" : "bg-black/5"} rounded mb-2`}>
                              <ReplySnippet data={m.replyTo} compact />
                            </div>
                          )}

                          {/* Content or Inline Editor */}
                          {editingId === m.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={2}
                                className={`w-full resize-none rounded-md border px-2 py-1 text-sm ${isMe ? "text-gray-900" : ""}`}
                                autoFocus
                              />
                              <div className="flex gap-3 text-xs">
                                <button onClick={() => saveEdit(m)} className="flex items-center gap-1 text-emerald-900 font-semibold">
                                  <FaCheck /> Save
                                </button>
                                <button onClick={cancelEdit} className="flex items-center gap-1 text-gray-800">
                                  <FaTimesCircle /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          )}

                          <div className="flex justify-between items-center mt-1 text-[11px] opacity-70">
                            <span>{ts ? formatTime(ts) : ""}{m.edited ? " • edited" : ""}</span>
                          </div>

                          {/* Inline actions */}
                          {editingId !== m.id && (
                            <div className="flex flex-wrap gap-4 mt-2 text-xs">
                              <button onClick={() => toggleReaction(m)} className={`flex items-center gap-1 ${userLiked ? "text-indigo-900 font-semibold" : ""}`}>
                                <FaThumbsUp /> {likeCount > 0 && likeCount}
                              </button>
                              <button
                                onClick={() =>
                                  setReplyTo({
                                    id: m.id,
                                    text: m.text,
                                    userId: m.userId,
                                    username: m.username,
                                    photoURL: m.photoURL,
                                  })
                                }
                                className="flex items-center gap-1"
                              >
                                <FaReply /> Reply
                              </button>
                              <button onClick={() => navigator.clipboard.writeText(m.text)} className="flex items-center gap-1">
                                <FaRegCopy /> Copy
                              </button>
                              {isMe && (
                                <>
                                  <button onClick={() => startEdit(m)} className="flex items-center gap-1">
                                    <FaEdit /> Edit
                                  </button>
                                  <button onClick={() => deleteMessage(m)} className="flex items-center gap-1 text-rose-700">
                                    <FaTrash /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {isMe && <Avatar url={m.photoURL} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Reply preview like WhatsApp */}
            {replyTo && (
              <div className="px-3 pt-2 bg-white border-t">
                <div className="relative rounded-md bg-gray-100">
                  <div className="absolute right-2 top-2">
                    <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-gray-700" aria-label="Cancel reply">
                      <FaTimes />
                    </button>
                  </div>
                  <div className="p-2 pr-8">
                    <ReplySnippet data={replyTo} />
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="bg-white p-3 flex items-center gap-2 border-t">
              <Avatar url={user?.photoURL || ""} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={replyTo ? "Write a reply..." : "Type a message"}
                className="flex-1 px-3 py-2 rounded-full border focus:outline-none text-sm text-gray-500"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-emerald-700 text-white p-2 rounded-full">
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

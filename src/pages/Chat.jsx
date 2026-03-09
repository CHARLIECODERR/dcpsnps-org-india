import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  ref,
  push,
  onValue,
  update,
  remove,
  serverTimestamp,
  get,
} from "firebase/database";
import {
  FaComments,
  FaPaperPlane,
  FaTimes,
  FaUserCircle,
  FaTrash,
  FaEdit,
  FaReply,
  FaThumbsUp,
  FaCheck,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-GB");
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const messageRefs = useRef({});

  // 🔹 Auth listener (optional login)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUser(null);
        return;
      }

      try {
        const snap = await get(ref(db, "users/" + u.uid));
        if (snap.exists()) {
          setUser({
            ...u,
            username: snap.val().username,
            photoURL: u.photoURL || "",
          });
        } else {
          setUser({ ...u, username: u.displayName || "Anonymous" });
        }
      } catch {
        setUser({ ...u, username: u.displayName || "Anonymous" });
      }
    });

    return () => unsub();
  }, []);

  // 🔹 Fetch messages (PUBLIC READ)
  useEffect(() => {
    const chatsRef = ref(db, "chats");
    const unsub = onValue(chatsRef, (snap) => {
      const val = snap.val();
      if (!val) {
        setMessages([]);
        return;
      }
      const arr = Object.keys(val).map((id) => ({ id, ...val[id] }));
      arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMessages(arr);
    });
    return () => unsub();
  }, []);

  // 🔹 Send message (LOGIN REQUIRED)
  const sendMessage = async () => {
    if (!user) {
      toast.warning("Login required to send message");
      return;
    }
    if (!input.trim()) return;

    await push(ref(db, "chats"), {
      text: input.trim(),
      userId: user.uid,
      username: user.username || "Anonymous",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      reactions: {},
      replyTo: replyTo
        ? {
            id: replyTo.id,
            text: replyTo.text,
            userId: replyTo.userId,
            username: replyTo.username,
            photoURL: replyTo.photoURL,
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

  const saveEdit = async (m) => {
    if (!editingText.trim()) return;
    await update(ref(db, `chats/${m.id}`), {
      text: editingText.trim(),
      edited: true,
    });
    setEditingId(null);
    setEditingText("");
  };

  const toggleReaction = async (m) => {
    if (!user) {
      toast.info("Login required to react");
      return;
    }
    const hasLiked = m.reactions?.[user.uid] === "👍";
    await update(ref(db, `chats/${m.id}/reactions`), {
      [user.uid]: hasLiked ? null : "👍",
    });
  };

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-emerald-400");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-emerald-400");
      }, 1500);
    }
  };

  // 🔹 Group messages by date
  const grouped = useMemo(() => {
    const map = {};
    messages.forEach((m) => {
      const ts = m.createdAt?.toMillis
        ? m.createdAt.toMillis()
        : m.createdAt;
      const date = ts ? formatDate(ts) : "Unknown";
      if (!map[date]) map[date] = [];
      map[date].push(m);
    });
    return map;
  }, [messages]);

  const Avatar = ({ url }) =>
    url ? (
      <img src={url} alt="avatar" className="w-8 h-8 rounded-full" />
    ) : (
      <FaUserCircle className="text-3xl text-gray-400" />
    );

  return (
    <>
      {/* 🔹 Floating Button (NO LOGIN REQUIRED) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
      >
        <FaComments className="text-2xl" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-gray-100 w-full sm:max-w-2xl h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between">
              <h3 className="font-semibold">Community Chat</h3>
              <button onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.keys(grouped).map((date) => (
                <div key={date}>
                  <div className="text-center my-3 text-xs text-gray-600">
                    {date}
                  </div>

                  {grouped[date].map((m) => {
                    const isMe = m.userId === user?.uid;
                    const ts = m.createdAt?.toMillis
                      ? m.createdAt.toMillis()
                      : m.createdAt;

                    return (
                      <div
                        key={m.id}
                        ref={(el) => (messageRefs.current[m.id] = el)}
                        className={`flex mb-3 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMe && <Avatar url={m.photoURL} />}

                        <div
                          className={`max-w-md mx-2 p-2 rounded-2xl shadow text-sm ${
                            isMe ? "bg-emerald-100" : "bg-white"
                          }`}
                        >
                          <div className="font-semibold text-xs">
                            {isMe ? "You" : m.username}
                          </div>

                          {editingId === m.id ? (
                            <>
                              <textarea
                                value={editingText}
                                onChange={(e) =>
                                  setEditingText(e.target.value)
                                }
                                className="w-full border rounded"
                              />
                              <div className="flex gap-2 text-xs mt-1">
                                <button
                                  onClick={() => saveEdit(m)}
                                  className="flex items-center gap-1"
                                >
                                  <FaCheck /> Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingText("");
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <FaTimesCircle /> Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {m.replyTo && (
                                <button
                                  type="button"
                                  onClick={() => scrollToMessage(m.replyTo.id)}
                                  className="mb-2 w-full text-left bg-gray-100 border-l-4 border-emerald-500 px-2 py-1 rounded"
                                >
                                  <div className="text-[11px] font-semibold text-emerald-700">
                                    {m.replyTo.userId === user?.uid
                                      ? "You"
                                      : m.replyTo.username}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">
                                    {m.replyTo.text}
                                  </div>
                                </button>
                              )}

                              <p>{m.text}</p>
                            </>
                          )}

                          <div className="text-[11px] opacity-60 mt-1">
                            {ts && formatTime(ts)}
                            {m.edited && " • edited"}
                          </div>

                          <div className="flex gap-3 text-xs mt-1 items-center">
                            <button onClick={() => toggleReaction(m)}>
                              <FaThumbsUp />
                            </button>

                            <button onClick={() => setReplyTo(m)}>
                              <FaReply />
                            </button>

                            {isMe && (
                              <>
                                <button onClick={() => startEdit(m)}>
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => deleteMessage(m)}
                                  className="text-red-600"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {isMe && <Avatar url={m.photoURL} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t">
              {replyTo && (
                <div className="mb-2 flex items-start justify-between bg-gray-100 border-l-4 border-emerald-600 px-3 py-2 rounded">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-700">
                      Replying to{" "}
                      {replyTo.userId === user?.uid
                        ? "yourself"
                        : replyTo.username}
                    </div>
                    <div className="text-sm text-gray-700 truncate">
                      {replyTo.text}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    user
                      ? "Type a message"
                      : "Login to participate in community chat"
                  }
                  disabled={!user}
                  className="flex-1 border rounded-full px-3 py-2 disabled:bg-gray-100"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!user}
                  className="bg-emerald-700 text-white p-2 rounded-full disabled:opacity-50"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
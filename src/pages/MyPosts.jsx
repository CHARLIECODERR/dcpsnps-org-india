// src/pages/MyPosts.jsx
import { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
  FaShareAlt,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLink,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db, storage } from "../services/firebase";
import { ref, onValue, update, remove, push, set } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const postsRef = ref(db, "posts");

    const unsub = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userPosts = Object.entries(data)
          .map(([id, post]) => ({ id, ...post }))
          .filter((post) => post.userId === user.uid);

        setPosts(userPosts.reverse());
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // ================= POST ACTIONS =================

  const toggleLike = async (post) => {
    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);
    post.likes?.[user.uid]
      ? await remove(likeRef)
      : await set(likeRef, true);
  };

  const toggleSave = async (post) => {
    const saveRef = ref(db, `posts/${post.id}/saved/${user.uid}`);
    post.saved?.[user.uid]
      ? await remove(saveRef)
      : await set(saveRef, true);
  };

  const deletePost = async (post) => {
    await remove(ref(db, "posts/" + post.id));
    toast.info("🗑️ Post deleted");
  };

  const saveEditedPost = async (post) => {
    let mediaURL = post.mediaURL;
    let mediaType = post.mediaType;

    if (newMediaFile) {
      const fileRef = sRef(
        storage,
        `posts/${user.uid}/${Date.now()}-${newMediaFile.name}`
      );
      await uploadBytes(fileRef, newMediaFile);
      mediaURL = await getDownloadURL(fileRef);
      mediaType = newMediaFile.type.startsWith("image")
        ? "image"
        : "video";
    }

    await update(ref(db, "posts/" + post.id), {
      title: editTitle,
      content: editContent,
      mediaURL,
      mediaType,
      edited: true,
    });

    setEditingPostId(null);
    setNewMediaFile(null);
    toast.success("✏️ Post updated");
  };

  // ================= COMMENTS =================

  const toggleComments = (postId) => {
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, showComments: !p.showComments } : p
      )
    );
  };

  const addComment = async (postId) => {
    if (!commentInput[postId]?.trim()) return;

    await push(ref(db, `posts/${postId}/comments`), {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      text: commentInput[postId],
      time: Date.now(),
    });

    setCommentInput({ ...commentInput, [postId]: "" });
  };

  const deleteComment = async (postId, cid) => {
    await remove(ref(db, `posts/${postId}/comments/${cid}`));
  };

  // ================= UI =================

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-yellow-300">
          Please Login to Continue
        </h1>
      </div>
    );

  return (
    <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-yellow-300 text-center">
          My Posts
        </h1>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center font-semibold">
            You haven't created any posts yet.
          </p>
        ) : (
          posts.map((post) => {
            const likeCount = post.likes
              ? Object.keys(post.likes).length
              : 0;

            return (
              <div
                key={post.id}
                className="bg-gray-100 rounded-lg shadow-md p-6 mb-6"
              >
                {/* HEADER */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold">{post.username}</p>
                    <p className="text-xs text-gray-500">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === post.id ? null : post.id
                        )
                      }
                      className="text-lg"
                    >
                      ⋮
                    </button>

                    {openMenu === post.id && (
                      <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow">
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditTitle(post.title);
                            setEditContent(post.content);
                            setOpenMenu(null);
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-blue-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            deletePost(post);
                            setOpenMenu(null);
                          }}
                          className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* EDIT MODE */}
                {/* TITLE */}
{editingPostId === post.id ? (
  <input
    type="text"
    value={editTitle}
    onChange={(e) => setEditTitle(e.target.value)}
    className="w-full font-bold text-lg mb-2 border-b outline-none bg-transparent"
  />
) : (
  <h2 className="font-bold text-lg mb-2">{post.title}</h2>
)}

{/* DESCRIPTION */}
{editingPostId === post.id ? (
  <textarea
    value={editContent}
    onChange={(e) => setEditContent(e.target.value)}
    rows={3}
    className="w-full mb-3 outline-none resize-none bg-transparent"
  />
) : (
  <p className="mb-3">
    {post.content}
    {post.edited && (
      <span className="text-xs text-gray-500 ml-2">(edited)</span>
    )}
  </p>
)}

{/* MEDIA */}
{post.mediaURL && (
  <div className="mb-4">
    {post.mediaType === "image" ? (
      <img
        src={post.mediaURL}
        alt="post"
        className="rounded-lg w-full max-h-96 object-contain"
      />
    ) : (
      <video
        src={post.mediaURL}
        controls
        className="rounded-lg w-full max-h-96 object-contain"
      />
    )}
  </div>
)}

{/* SAVE BUTTON */}
{editingPostId === post.id && (
  <div className="flex justify-end gap-4 mb-3">
    <button
      onClick={() => setEditingPostId(null)}
      className="text-gray-500"
    >
      Cancel
    </button>

    <button
      onClick={() => saveEditedPost(post)}
      className="bg-blue-500 text-white px-4 py-1 rounded"
    >
      Save
    </button>
  </div>
)}

                {/* ACTIONS */}
                <div className="flex gap-4 border-t pt-3">
                  <button
                    onClick={() => toggleLike(post)}
                    className="flex items-center gap-1"
                  >
                    {post.likes?.[user.uid] ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart />
                    )}
                    {likeCount}
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1"
                  >
                    <FaRegComment />
                    {post.comments
                      ? Object.keys(post.comments).length
                      : 0}
                  </button>
                </div>

                {/* COMMENTS */}
                {post.showComments && (
                  <div className="mt-3 space-y-2">
                    {post.comments &&
                      Object.entries(post.comments).map(
                        ([cid, c]) => (
                          <div
                            key={cid}
                            className="flex justify-between bg-gray-200 p-2 rounded"
                          >
                            <span>
                              <b>{c.username}:</b> {c.text}
                            </span>
                            {user.uid === c.userId && (
                              <button
                                className="text-xs text-red-400 hover:text-red-600"
                                onClick={() =>
                                  deleteComment(
                                    post.id,
                                    cid
                                  )
                                }
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )
                      )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={commentInput[post.id] || ""}
                        onChange={(e) =>
                          setCommentInput({
                            ...commentInput,
                            [post.id]: e.target.value,
                          })
                        }
                        className="flex-1 border p-2 rounded text-sm"
                      />
                      <button
                        onClick={() =>
                          addComment(post.id)
                        }
                        className="bg-gray-700 text-white px-3 rounded"
                      >
                        <FiSend />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ToastContainer position="bottom-left" theme="dark" />
    </div>
  );
}
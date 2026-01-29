// src/pages/MyPosts.jsx
import { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
  FaEdit,
  FaUserCircle,
  FaShareAlt,
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
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
    const [openShareMenu, setOpenShareMenu] = useState(null);  
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
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
    return () => unsubscribe();
  }, [user]);

  // Like/unlike post
  const toggleLike = async (post) => {
    if (!user) return;
    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);
    if (post.likes && post.likes[user.uid]) {
      await remove(likeRef);
    } else {
      await set(likeRef, true);
    }
  };

  // Save/unsave post
  const toggleSave = async (post) => {
    if (!user) return;
    const saveRef = ref(db, `posts/${post.id}/saved/${user.uid}`);
    if (post.saved && post.saved[user.uid]) {
      await remove(saveRef);
    } else {
      await set(saveRef, true);
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId) => {
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, showComments: !p.showComments } : p
      )
    );
  };

  // Add or Update Comment
  const addComment = async (postId, editingCommentId = null) => {
    if (!commentInput[postId]?.trim()) return;
    const commentData = {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      photoURL: user.photoURL || null,
      text: commentInput[postId],
      time: Date.now(),
      edited: editingCommentId ? true : false,
    };

    if (editingCommentId) {
      await update(ref(db, `posts/${postId}/comments/${editingCommentId}`), commentData);
      toast.success("✏️ Comment updated!");
    } else {
      await push(ref(db, `posts/${postId}/comments`), commentData);
      toast.success("💬 Comment added!");
    }

    setCommentInput({ ...commentInput, [postId]: "" });
    setEditingCommentId(null);
  };

  // Edit post
  const saveEditedPost = async (post) => {
    if (!user || user.uid !== post.userId) return;

    let mediaURL = post.mediaURL;
    let mediaType = post.mediaType;

    if (newMediaFile) {
      const fileRef = sRef(
        storage,
        `posts/${user.uid}/${Date.now()}-${newMediaFile.name}`
      );
      await uploadBytes(fileRef, newMediaFile);
      mediaURL = await getDownloadURL(fileRef);
      mediaType = newMediaFile.type.startsWith("image") ? "image" : "video";
    }

    await update(ref(db, "posts/" + post.id), {
      ...post,
      title: editTitle,
      content: editContent,
      mediaURL,
      mediaType,
      edited: true,
    });

    setEditingPostId(null);
    setNewMediaFile(null);
    toast.success("✏️ Post updated!");
  };

  // Delete post
  const deletePost = async (post) => {
    if (!user || user.uid !== post.userId) return;
    await remove(ref(db, "posts/" + post.id));
    toast.info("🗑️ Post deleted");
  };

  // File handler for editing media
  const handleNewMedia = (e) => {
    const file = e.target.files[0];
    if (file) setNewMediaFile(file);
  };

  // If not logged in, show heading
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--body-color)] pt-24 px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-yellow-300 mb-6 text-center">
          Please Login to Continue
        </h1>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--body-color)" }}
      className="min-h-screen pt-24 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-yellow-300 text-center">My Posts</h1>
        {loading ? (
          <p className="text-center text-gray-500">Loading your posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-900 font-semibold">You haven't created any posts yet.</p>
          
        ) : (
          posts.map((post) => {
            const likeCount = post.likes ? Object.keys(post.likes).filter(uid => post.likes[uid]).length : 0;
            const isLiked = post.likes && post.likes[user.uid];
            const isSaved = post.saved && post.saved[user.uid];

            return (
              <div key={post.id} className="bg-gray-100 rounded-lg shadow-md p-6 mb-6">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-4">
                  {post.photoURL ? (
                    <img
                      src={post.photoURL}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="w-10 h-10 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-500">{post.username || "Anonymous"}</p>
                    <p className="text-sm text-gray-500">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Just now"}
                    </p>
                  </div>
                </div><hr></hr>

                {/* Editable Content */}
                {editingPostId === post.id ? (
                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm text-gray-400"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm text-gray-400"
                    />
                    {newMediaFile ? (
                      <p className="text-sm text-gray-500">New file selected: {newMediaFile.name}</p>
                    ) : (
                      post.mediaURL && (
                        <div className="relative">
                          {post.mediaType === "image" ? (
                            <img
                              src={post.mediaURL}
                              alt="post-media"
                              className="rounded-lg w-full max-h-80 object-contain"
                            />
                          ) : (
                            <video
                              src={post.mediaURL}
                              controls
                              className="rounded-lg w-full max-h-80 object-contain"
                            />
                          )}
                          <label className="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-full cursor-pointer text-white">
                            <FaEdit />
                            <input type="file" className="hidden" onChange={handleNewMedia} />
                          </label>
                        </div>
                      )
                    )}
                    <button
                      onClick={() => saveEditedPost(post)}
                      className="bg-green-500 text-white px-4 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="ml-2 text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-bold text-lg text-gray-800">{post.title}</h2>
                    <p className="text-gray-800 mb-4">
                      {post.content}{" "}
                      {post.edited && <span className="text-xs text-gray-500">(edited)</span>}
                    </p>
                    {post.mediaURL && (
                      <div className="mb-4">
                        {post.mediaType === "image" ? (
                          <img
                            src={post.mediaURL}
                            alt="post-media"
                            className="rounded-lg w-full max-h-80 object-contain"
                          />
                        ) : (
                          <video
                            src={post.mediaURL}
                            controls
                            className="rounded-lg w-full max-h-80 object-contain"
                          />
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500"
                  >
                    {isLiked ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart />
                    )}{" "}
                    {likeCount}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-500"
                  >
                    <FaRegComment />{" "}
                    {post.comments ? Object.keys(post.comments).length : 0}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Save Button */}
                  <button
                    onClick={() => toggleSave(post)}
                    className="text-gray-600 hover:text-yellow-500"
                  >
                    {post.saved && post.saved[auth.currentUser?.uid] ? (
                      <FaBookmark />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>

               
                  {/* Share Menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenShareMenu(
                          openShareMenu === post.id ? null : post.id
                        )
                      }
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <FaShareAlt />
                    </button>

                    {openShareMenu === post.id && (
                      <div
                        className="absolute right-4 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50 
                 animate-fade-in"
                      >
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `${post.title} - ${window.location.origin}/post/${post.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 hover:bg-green-100 transition text-gray-400"
                        >
                          <FaWhatsapp className="text-green-700" /> WhatsApp
                        </a>

                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                            `${window.location.origin}/post/${post.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 hover:bg-blue-100 transition  text-gray-400"
                        >
                          <FaFacebook className="text-blue-600" /> Facebook
                        </a>

                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                            `${window.location.origin}/post/${post.id}`
                          )}&text=${encodeURIComponent(post.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 hover:bg-cyan-100 transition  text-gray-400"
                        >
                          <FaTwitter className="text-sky-500" /> X (Twitter)
                        </a>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/post/${post.id}`
                            );
                            toast.success("📋 Link copied to clipboard!");
                            setOpenShareMenu(null); // close after copy
                          }}
                          className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 transition  text-gray-400"
                        >
                          <FaLink className="text-gray-600" /> Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>


                {/* Edit/Delete for Owner */}
                {user.uid === post.userId && editingPostId !== post.id && (
                  <div className="flex gap-3 mt-2 text-sm text-gray-600">
                    <button
                      onClick={() => {
                        setEditingPostId(post.id);
                        setEditTitle(post.title);
                        setEditContent(post.content);
                      }}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                    <button onClick={() => deletePost(post)} className="text-red-600">
                      Delete
                    </button>
                  </div>
                )}

                {/* Comments */}
                {post.showComments && (
                  <div className="mt-4 space-y-3">
                    {post.comments &&
                      Object.keys(post.comments).map((cid) => {
                        const c = post.comments[cid];
                        const isEditing = editingCommentId === cid;

                        return (
                          <div key={cid} className="bg-gray-200 p-3 rounded-lg flex gap-2">
                            {c.photoURL ? (
                              <img
                                src={c.photoURL}
                                alt="comment-avatar"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <FaUserCircle className="w-8 h-8 text-gray-400" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-400">{c.username}</p>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={commentInput[post.id] || ""}
                                  onChange={(e) =>
                                    setCommentInput({ ...commentInput, [post.id]: e.target.value })
                                  }
                                  className="w-full border rounded-lg p-2 text-sm text-gray-400"
                                />
                              ) : (
                                <p className="text-gray-700 text-sm">
                                  {c.text}{" "}
                                  {c.edited && (
                                    <span className="text-xs text-gray-500">(edited)</span>
                                  )}
                                </p>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(c.time).toLocaleString()}
                              </span>
                            </div>
                            {user.uid === c.userId && (
                              <div className="flex gap-2 text-xs">
                                {isEditing ? (
                                  <>
                                    <button
                                      className="text-green-600"
                                      onClick={() => {
                                        addComment(post.id, cid);
                                        setEditingCommentId(null);
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="text-gray-600"
                                      onClick={() => setEditingCommentId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="text-blue-600"
                                      onClick={() => {
                                        setEditingCommentId(cid);
                                        setCommentInput({ ...commentInput, [post.id]: c.text });
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="text-red-600"
                                      onClick={() =>
                                        remove(ref(db, `posts/${post.id}/comments/${cid}`))
                                      }
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Add Comment */}
                {post.showComments && !editingCommentId && (
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput[post.id] || ""}
                      onChange={(e) =>
                        setCommentInput({ ...commentInput, [post.id]: e.target.value })
                      }
                      className="flex-1 border rounded-lg p-2 text-sm text-gray-500"
                    />
                    <button
                      onClick={() => addComment(post.id)}
                      className="p-2 bg-gray-700 rounded-lg hover:bg-gray-800"
                    >
                      <FiSend />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <ToastContainer
        position="bottom-left"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

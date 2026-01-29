// src/pages/SavedPost.jsx
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
import { auth, db } from "../services/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";

export default function SavedPost() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [showComments, setShowComments] = useState({}); // Track comment visibility per post
    const [openShareMenu, setOpenShareMenu] = useState(null);

  // Listen for auth state changes and update user state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all posts and filter saved by user
  useEffect(() => {
    if (!user) return;
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((post) => post.saved && post.saved[user.uid]);
        setPosts(loaded.reverse());
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Unsave post
  const toggleSave = (post) => {
    if (!user) return;
    const postRef = ref(db, `posts/${post.id}/saved/${user.uid}`);
    remove(postRef);
    toast.info("⚠️ Post unsaved");
  };

  // Like/unlike post (use set for atomic update)
  const toggleLike = (post) => {
    if (!user) return;
    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);
    if (post.likes && post.likes[user.uid]) {
      remove(likeRef);
    } else {
      // Use set to ensure atomic write and avoid race conditions
      import("firebase/database").then(({ set }) => set(likeRef, true));
    }
  };

  // Add or Update Comment
  const addComment = async (postId, editingCommentId = null) => {
    if (!commentInput[postId]?.trim()) return;
    const commentData = {
      userId: auth.currentUser.uid,
      username: auth.currentUser.displayName || "Anonymous",
      photoURL: auth.currentUser.photoURL || null,
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

 
// Toggle comments visibility
// Toggle comments visibility
const toggleComments = (postId) => {
  setShowComments((prev) => ({
    ...prev,
    [postId]: !prev[postId],
  }));
};

  // UI
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
    <div style={{ background: "var(--body-color)" }} className="min-h-screen pt-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-300">Saved Posts</h1>
          <p className="text-white">All posts you have saved are shown here.</p>
        </div>

        {posts.length === 0 && (
          <p className="text-center text-gray-900 font-semibold">No saved posts yet.</p>
        )}

        {posts.map((post) => {
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

              {/* Content */}
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
                                     className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-50 
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

              {/* Comments (show/hide) */}
              {showComments[post.id] && post.comments && (
                <div className="mt-4 space-y-3">
                  {Object.keys(post.comments).map((cid) => {
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
                        {auth.currentUser?.uid === c.userId && (
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

              {/* Add Comment (show only if comments are visible and not editing) */}
              {showComments[post.id] && !editingCommentId && (
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
        })}
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

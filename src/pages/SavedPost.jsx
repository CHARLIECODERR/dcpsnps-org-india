// src/pages/SavedPost.jsx
import { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../services/firebase";
import { ref, onValue, push, remove, set } from "firebase/database";

export default function SavedPost() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const [usersData, setUsersData] = useState({});

  // 🔹 Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 🔹 Load Saved Posts
  useEffect(() => {
    if (!user) return;
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedPosts = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((post) => post.saved && post.saved[user.uid]);
        setPosts(loadedPosts.reverse());
      } else setPosts([]);
    });
    return () => unsubscribe();
  }, [user]);

  // 🔹 Fetch all users (profile photos)
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snap) => {
      if (snap.val()) setUsersData(snap.val());
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Like / Unlike
  const toggleLike = async (post) => {
    if (!user) return toast.info("🔐 Please login to continue");
    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);
    if (post.likes && post.likes[user.uid]) {
      await remove(likeRef);
    } else {
      await set(likeRef, true);
    }
  };

  // 🔹 Unsave Post
  const toggleSave = async (post) => {
    if (!user) return toast.info("🔐 Please login to continue");
    await remove(ref(db, `posts/${post.id}/saved/${user.uid}`));
    toast.info("⚠️ Post unsaved");
  };

  // 🔹 Add Comment
  const addComment = async (postId) => {
    if (!user) return toast.info("🔐 Please login to continue");
    if (!commentInput[postId]?.trim()) return;

    const commentData = {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      photoURL: user.photoURL || null,
      text: commentInput[postId],
      time: Date.now(),
    };

    await push(ref(db, `posts/${postId}/comments`), commentData);

    toast.success("💬 Comment added!");
    setCommentInput({ ...commentInput, [postId]: "" });
  };

  // 🔹 Delete Comment
  const deleteComment = async (postId, commentId) => {
    try {
      await remove(ref(db, `posts/${postId}/comments/${commentId}`));
      toast.success("🗑️ Comment deleted!");
    } catch {
      toast.error("Error deleting comment");
    }
  };

  // 🔹 Toggle Comments Section
  const toggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-yellow-400">
          Please Login to Continue
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-300">
          Saved Posts
        </h1>

        {posts.length === 0 && (
          <p className="text-center text-gray-500">No saved posts yet.</p>
        )}

        {posts.map((post) => {
          const likeCount = post.likes ? Object.keys(post.likes).length : 0;
          const isLiked = user && post.likes?.[user.uid];

          return (
            <div
              key={post.id}
              className="bg-white rounded-lg p-5 mb-6 shadow"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                {usersData[post.userId]?.photoURL ? (
                  <img
                    src={usersData[post.userId].photoURL}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold">
                    {(usersData[post.userId]?.username || post.username || "A")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-700">
                    {usersData[post.userId]?.username || post.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Just now"}
                  </p>
                </div>
              </div>

              {/* Content */}
              <h2 className="font-bold text-lg text-gray-800">{post.title}</h2>
              <p className="text-gray-700 mb-3">{post.content}</p>

              {/* Media */}
              {post.mediaURL && (
                <div className="mb-3">
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
              <div className="flex items-center gap-6 border-t pt-3">
                <button onClick={() => toggleLike(post)} className="flex items-center gap-1">
                  {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                  {likeCount}
                </button>
                <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1">
                  <FaRegComment /> {post.comments ? Object.keys(post.comments).length : 0}
                </button>
                <button onClick={() => toggleSave(post)}>
                  {user && post.saved?.[user.uid] ? <FaBookmark /> : <FaRegBookmark />}
                </button>
              </div>

              {/* Comments */}
              {showComments[post.id] && (
                <div className="mt-3">
                  {post.comments && Object.keys(post.comments).length > 0 ? (
                    Object.entries(post.comments)
                      .sort(([, a], [, b]) => a.time - b.time)
                      .map(([cid, comment]) => (
                        <div key={cid} className="mb-2 flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-gray-700">{comment.username}: </span>
                            <span className="text-gray-800">{comment.text}</span>
                            <div className="text-xs text-gray-500">
                              {new Date(comment.time).toLocaleString()}
                            </div>
                          </div>
                          {user?.uid === comment.userId && (
                            <button
                              onClick={() => deleteComment(post.id, cid)}
                              className="text-xs text-red-500 hover:underline ml-2"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-sm">No comments yet.</p>
                  )}

                  {/* Add Comment */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Add comment..."
                      value={commentInput[post.id] || ""}
                      onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                      className="flex-1 border rounded p-2 text-sm"
                    />
                    <button onClick={() => addComment(post.id)} className="bg-gray-700 text-white px-3 rounded">
                      <FiSend />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ToastContainer position="bottom-left" theme="dark" />
    </div>
  );
}
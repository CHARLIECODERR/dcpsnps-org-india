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
import { ref, onValue, push, update, remove, set } from "firebase/database";

export default function SavedPost() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});

  // 🔹 Get Logged In User
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
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter((post) => post.saved && post.saved[user.uid]);

        setPosts(loadedPosts.reverse());
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 🔹 Like / Unlike
  const toggleLike = async (post) => {
    if (!user) return;

    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);

    if (post.likes && post.likes[user.uid]) {
      await remove(likeRef);
    } else {
      await set(likeRef, true);
    }
  };

  // 🔹 Unsave Post
  const toggleSave = async (post) => {
    if (!user) return;

    await remove(ref(db, `posts/${post.id}/saved/${user.uid}`));
    toast.info("⚠️ Post unsaved");
  };

  // 🔹 Add Comment
  const addComment = async (postId) => {
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

    setCommentInput({
      ...commentInput,
      [postId]: "",
    });
  };

  // 🔹 Delete Comment
  const deleteComment = async (postId, commentId) => {
    try {
      await remove(ref(db, `posts/${postId}/comments/${commentId}`));
      toast.success("🗑️ Comment deleted!");
    } catch (error) {
      toast.error("Error deleting comment");
    }
  };

  // 🔹 Toggle Comment Section
  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
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
    <div className="min-h-screen pt-24 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-500">
          Saved Posts
        </h1>

        {posts.length === 0 && (
          <p className="text-center text-gray-600">
            No saved posts yet.
          </p>
        )}

        {posts.map((post) => {
          const likeCount = post.likes
            ? Object.keys(post.likes).length
            : 0;

          const isLiked =
            post.likes && post.likes[user.uid];

          return (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md p-6 mb-6"
            >
              {/* 🔹 Post Header */}
              <div className="flex items-center gap-3 mb-4">
                {post.photoURL ? (
                  <img
                    src={post.photoURL}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold">
                    {(post.username || "A")[0]}
                  </div>
                )}

                <div>
                  <p className="font-semibold">
                    {post.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleString()
                      : "Just now"}
                  </p>
                </div>
              </div>

              {/* 🔹 Content */}
              <h2 className="font-bold text-lg">
                {post.title}
              </h2>
              <p className="mb-4">{post.content}</p>

              {post.mediaURL && (
                <div className="mb-4">
                  {post.mediaType === "image" ? (
                    <img
                      src={post.mediaURL}
                      alt="media"
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

              {/* 🔹 Actions */}
              <div className="flex justify-between border-t pt-3">

                <div className="flex gap-4">
                  <button
                    onClick={() => toggleLike(post)}
                    className="flex items-center gap-1"
                  >
                    {isLiked ? (
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

                <button
                  onClick={() => toggleSave(post)}
                >
                  {post.saved && post.saved[user.uid] ? (
                    <FaBookmark />
                  ) : (
                    <FaRegBookmark />
                  )}
                </button>
              </div>

              {/* 🔹 Comments Section */}
              {showComments[post.id] && (
                <div className="mt-4 space-y-3">

                  {post.comments ? (
                    Object.entries(post.comments)
                      .sort((a, b) => b[1].time - a[1].time)
                      .map(([commentId, c]) => (
                        <div
                          key={commentId}
                          className="bg-gray-100 p-2 rounded"
                        >
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold">
                              {c.username}
                            </p>

                            {c.userId === user.uid && (
                              <button
                                onClick={() =>
                                  deleteComment(
                                    post.id,
                                    commentId
                                  )
                                }
                                className="text-xs text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <p className="text-sm">
                            {c.text}
                          </p>

                          <span className="text-xs text-gray-500">
                            {new Date(
                              c.time
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No comments yet
                    </p>
                  )}

                  {/* 🔹 Add Comment */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
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
        })}
      </div>

      <ToastContainer
        position="bottom-left"
        autoClose={2000}
        theme="dark"
      />
    </div>
  );
}
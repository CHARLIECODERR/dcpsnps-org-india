// src/pages/Post.jsx
import { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
  FaUserCircle,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Seo from "../components/Seo";
import { auth, db } from "../services/firebase";
import { ref, onValue, update, remove, push } from "firebase/database";

export default function Post() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [usersData, setUsersData] = useState({});
  
  // 🔹 Listen auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  // 🔹 Fetch posts (Realtime DB)
  useEffect(() => {
    const postsRef = ref(db, "posts");
    const unsub = onValue(postsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setPosts([]);
        return;
      }

      const list = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));

      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPosts(list);
    });

    return () => unsub();
  }, []);

  // 🔹 Fetch all users (for profile photo)
useEffect(() => {
  const usersRef = ref(db, "users");
  const unsub = onValue(usersRef, (snap) => {
    const data = snap.val();
    if (data) {
      setUsersData(data);
    }
  });

  return () => unsub();
}, []);

  // 🔒 Auth guard
  const requireLogin = () => {
    toast.info("🔐 Please login to continue");
    return false;
  };

  // Like
  const toggleLike = async (post) => {
    if (!user) return requireLogin();

    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);
    if (post.likes && post.likes[user.uid]) {
      await remove(likeRef);
    } else {
      await update(ref(db, `posts/${post.id}/likes`), {
        [user.uid]: true,
      });
    }
  };

  // Save
  const toggleSave = async (post) => {
    if (!user) return requireLogin();

    const saveRef = ref(db, `posts/${post.id}/saved/${user.uid}`);
    if (post.saved && post.saved[user.uid]) {
      await remove(saveRef);
    } else {
      await update(ref(db, `posts/${post.id}/saved`), {
        [user.uid]: true,
      });
    }
  };

  // Add Comment
  const addComment = async (postId) => {
    if (!user) return requireLogin();
    if (!commentInput[postId]?.trim()) return;

    await push(ref(db, `posts/${postId}/comments`), {
      userId: user.uid,
      username: user.displayName || "Anonymous",
      text: commentInput[postId],
      time: Date.now(),
    });

    setCommentInput({ ...commentInput, [postId]: "" });
  };

   // Delete Comment
const deleteComment = async (postId, commentId) => {
  if (!user) return;

  try {
    await remove(ref(db, `posts/${postId}/comments/${commentId}`));
    toast.success("Comment deleted");
  } catch (err) {
    toast.error("Failed to delete comment");
  }
};
  return (
    <>
      <Seo title="Community Feed" />
      <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-yellow-300 mb-6">
            Community Feed
          </h1>

          {posts.map((post) => {
            const likeCount = post.likes
              ? Object.keys(post.likes).length
              : 0;
            const isLiked = user && post.likes?.[user.uid];

            return (
              <div
                key={post.id}
                className="bg-gray-100 rounded-lg p-5 mb-6 shadow"
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
    {(usersData[post.userId]?.username ||
      post.username ||
      "A")[0].toUpperCase()}
  </div>
)}
                  <div>
                    <p className="font-semibold text-gray-700">
  {usersData[post.userId]?.username ||
    post.username ||
    "Anonymous"}
</p>
                    <p className="text-xs text-gray-500">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <h2 className="font-bold text-lg text-gray-800">
                  {post.title}
                </h2>
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

                  <button className="flex items-center gap-1">
                    <FaRegComment />
                    {post.comments
                      ? Object.keys(post.comments).length
                      : 0}
                  </button>

                  <button onClick={() => toggleSave(post)}>
                    {user && post.saved?.[user.uid] ? (
                      <FaBookmark />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                </div>

                {/* Add Comment */}
                <div className="flex gap-2 mt-3">
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
                    className="flex-1 border rounded p-2 text-sm"
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    className="bg-gray-700 text-white px-3 rounded"
                  >
                    <FiSend />
                  </button>
                </div>

                {/* Show Comments */}
               {/* Show Comments */}
{post.comments && Object.keys(post.comments).length > 0 && (
  <div className="mt-3 border-t pt-2">
    {Object.entries(post.comments)
      .sort(([, a], [, b]) => a.time - b.time)
      .map(([cid, comment]) => (
        <div
          key={cid}
          className="mb-2 flex justify-between items-start"
        >
          <div>
            <span className="font-semibold text-gray-700">
              {comment.username}:{" "}
            </span>
            <span className="text-gray-800">{comment.text}</span>
            <div className="text-xs text-gray-500">
              {new Date(comment.time).toLocaleString()}
            </div>
          </div>

          {/* Delete only for comment owner */}
          {user?.uid === comment.userId && (
            <button
              onClick={() => deleteComment(post.id, cid)}
              className="text-xs text-red-500 hover:underline ml-2"
            >
              Delete
            </button>
          )}
        </div>
      ))}
  </div>
)}
              </div>
            );
          })}
        </div>

        <ToastContainer position="bottom-left" theme="dark" />
      </div>
    </>
  );
}
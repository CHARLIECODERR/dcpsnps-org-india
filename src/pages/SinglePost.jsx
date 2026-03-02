import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaBookmark,
} from "react-icons/fa";
import { FiSend, FiShare2 } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { auth, db } from "../services/firebase";
import { ref, onValue, update, remove, push } from "firebase/database";
import Seo from "../components/Seo";

export default function SinglePost() {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Auth (not required to view)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u || null));
    return unsub;
  }, []);

  // ✅ Users data for name/photo
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (snap.val()) setUsersData(snap.val());
    });
    return unsub;
  }, []);

  // ✅ Get single post (public view)
  useEffect(() => {
    setLoading(true);
    const postRef = ref(db, `posts/${postId}`);
    const unsub = onValue(postRef, (snap) => {
      if (!snap.exists()) {
        setPost(null);
        setLoading(false);
        return;
      }
      setPost({ id: postId, ...snap.val() });
      setLoading(false);
    });
    return unsub;
  }, [postId]);

  const requireLogin = () => toast.info("🔐 Please login first");

  // ✅ Share (same logic, inside this page too)
  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || "GenX Post",
          text: post.content || "Check this post",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("🔗 Link copied!");
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
      }
    } catch (err) {
      toast.error("Failed to share");
    }
  };

  // ✅ Like (login required)
  const toggleLike = async () => {
    if (!user) return requireLogin();
    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);
    if (post.likes?.[user.uid]) await remove(likeRef);
    else await update(ref(db, `posts/${post.id}/likes`), { [user.uid]: true });
  };

  // ✅ Save (login required)
  const toggleSave = async () => {
    if (!user) return requireLogin();
    const saveRef = ref(db, `posts/${post.id}/saved/${user.uid}`);
    if (post.saved?.[user.uid]) await remove(saveRef);
    else await update(ref(db, `posts/${post.id}/saved`), { [user.uid]: true });
  };

  // ✅ Comment (login required)
  const addComment = async () => {
    if (!user) return requireLogin();
    const text = commentInput.trim();
    if (!text) return;

    await push(ref(db, `posts/${post.id}/comments`), {
      userId: user.uid,
      username:
        user.displayName || (user.email ? user.email.split("@")[0] : "User"),
      text,
      time: Date.now(),
    });

    setCommentInput("");
  };

  const deleteComment = async (cid) => {
    if (!user) return requireLogin();
    await remove(ref(db, `posts/${post.id}/comments/${cid}`));
  };

  // UI
  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
        <div className="max-w-2xl mx-auto text-center text-gray-300">
          Loading post...
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
        <div className="max-w-2xl mx-auto text-center text-gray-300 space-y-3">
          <div>Post not found.</div>
          <Link className="text-blue-400 hover:underline" to="/post">
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const likeCount = post.likes ? Object.keys(post.likes).length : 0;
  const commentCount = post.comments ? Object.keys(post.comments).length : 0;
  const isLiked = user && post.likes?.[user.uid];

  const postUser = usersData[post.userId];
  const displayName =
    postUser?.fullName ||
    postUser?.username ||
    postUser?.name ||
    post.username ||
    "Anonymous";

  return (
    <>
      <Seo title={post.title || "Post"} />

      <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-yellow-300">Post</h1>
            <Link className="text-blue-400 hover:underline" to="/post">
              Back to Feed
            </Link>
          </div>

          {!user && (
            <div className="bg-yellow-100 text-yellow-900 p-3 rounded">
              Guest view. Login to Like / Save / Comment.
            </div>
          )}

          <div className="bg-gray-100 rounded-lg shadow p-4">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-2">
              {postUser?.photoURL ? (
                <img
                  src={postUser.photoURL}
                  className="w-10 h-10 rounded-full object-cover"
                  alt="user"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold">
                  {(displayName?.[0] || "A").toUpperCase()}
                </div>
              )}

              <div>
                <div className="font-semibold text-gray-800">{displayName}</div>
                <div className="text-xs text-gray-500">
                  {post.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
                </div>
              </div>
            </div>

            {/* CONTENT */}
            {post.title && <div className="font-bold text-gray-800">{post.title}</div>}
            {post.content && <div className="text-gray-700 mb-2">{post.content}</div>}

            {/* MEDIA */}
            {post.mediaURL && (
              <div className="mb-2">
                {post.mediaType === "image" ? (
                  <img
                    src={post.mediaURL}
                    className="rounded-lg w-full max-h-80 object-contain"
                    alt="post"
                  />
                ) : (
                  <video src={post.mediaURL} controls className="rounded-lg w-full max-h-80" />
                )}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex items-center gap-6 border-t pt-2 text-gray-700">
              <button onClick={toggleLike} className="flex items-center gap-1 hover:text-red-500">
                {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                {likeCount}
              </button>

              <div className="flex items-center gap-1">
                <FaRegComment />
                {commentCount}
              </div>

              <button onClick={toggleSave} className="hover:text-yellow-600" title="Save">
                {user && post.saved?.[user.uid] ? <FaBookmark /> : <FaRegBookmark />}
              </button>

              <button onClick={handleShare} className="hover:text-blue-500" title="Share">
                <FiShare2 size={18} />
              </button>
            </div>

            {/* COMMENT INPUT */}
            <div className="flex gap-2 mt-3">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={user ? "Write a comment..." : "Login to comment"}
                disabled={!user}
                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-200"
              />
              <button
                onClick={addComment}
                disabled={!user}
                className="bg-gray-800 text-white px-3 rounded hover:bg-black disabled:opacity-50"
              >
                <FiSend />
              </button>
            </div>

            {/* COMMENTS LIST */}
            {post.comments && (
              <div className="mt-3 border-t pt-2 space-y-2">
                {Object.entries(post.comments)
                  .sort(([, a], [, b]) => a.time - b.time)
                  .map(([cid, c]) => (
                    <div key={cid} className="bg-white rounded px-2 py-1 flex justify-between">
                      <div>
                        <div className="text-sm">
                          <span className="font-semibold">
                            {c.username || usersData[c.userId]?.fullName || "User"}
                          </span>{" "}
                          {c.text}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(c.time).toLocaleString()}
                        </div>
                      </div>

                      {user?.uid === c.userId && (
                        <button
                          onClick={() => deleteComment(cid)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-left" theme="dark" />
    </>
  );
}
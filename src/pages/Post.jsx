// src/pages/Post.jsx
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
import Seo from "../components/Seo";
import { auth, db } from "../services/firebase";
import { FiShare2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";

import { ref, onValue, update, remove, push, get } from "firebase/database";
export default function Post() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [usersData, setUsersData] = useState({});
  const location = useLocation();
const [sharedPost, setSharedPost] = useState(null);

  // ✅ Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u || null);
    });
    return unsub;
  }, []);

//find post
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const id = params.get("share");

  if (!id) {
    setSharedPost(null);
    return;
  }

  const found = posts.find((p) => p.id === id);
  setSharedPost(found || null);
}, [location.search, posts]);


  // ✅ Fetch posts
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

    return unsub;
  }, []);

  // ✅ Fetch users data
  useEffect(() => {
    const usersRef = ref(db, "users");

    const unsub = onValue(usersRef, (snap) => {
      const data = snap.val();
      if (data) setUsersData(data);
    });

    return unsub;
  }, []);

  // ✅ Require login
  const requireLogin = () => {
    toast.info("🔐 Please login first");
    return;
  };

  // ✅ Like
  const toggleLike = async (post) => {
    if (!user) return requireLogin();

    const likeRef = ref(db, `posts/${post.id}/likes/${user.uid}`);

    if (post.likes?.[user.uid]) {
      await remove(likeRef);
    } else {
      await update(ref(db, `posts/${post.id}/likes`), {
        [user.uid]: true,
      });
    }
  };

  // ✅ Save
  const toggleSave = async (post) => {
    if (!user) return requireLogin();

    const saveRef = ref(db, `posts/${post.id}/saved/${user.uid}`);

    if (post.saved?.[user.uid]) {
      await remove(saveRef);
    } else {
      await update(ref(db, `posts/${post.id}/saved`), {
        [user.uid]: true,
      });
    }
  };
  // ✅ SHARE FUNCTION
  const handleShare = async (post) => {
  const url = `${window.location.origin}/post?share=${post.id}`;

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

  // ✅ Add comment
  const addComment = async (postId) => {
  if (!user) return requireLogin();

  const text = commentInput[postId]?.trim();
  if (!text) return;

  try {

    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);

    let username = "User";

    if (snap.exists()) {

      const data = snap.val();

      username =
        data.fullName ||
        data.username ||
        data.name ||
        user.displayName ||
        user.email.split("@")[0];

      // ✅ FIX old accounts automatically
      if (!data.fullName) {
        await update(userRef, {
          fullName: username,
          username: username
        });
      }

    } else {

      username =
        user.displayName ||
        user.email.split("@")[0];

      await update(userRef, {
        fullName: username,
        username: username,
        email: user.email
      });

    }

    await push(ref(db, `posts/${postId}/comments`), {
      userId: user.uid,
      username: username,
      text: text,
      time: Date.now(),
    });

    setCommentInput(prev => ({
      ...prev,
      [postId]: ""
    }));

  } catch (err) {
    toast.error("Failed to comment");
  }
};

  // ✅ Delete comment
  const deleteComment = async (postId, cid) => {
    try {
      await remove(ref(db, `posts/${postId}/comments/${cid}`));
      toast.success("Comment deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  // ✅ Final ordered list: shared post first, then others newest -> oldest
const sortedPosts = [...posts].sort(
  (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
);

const displayPosts = sharedPost
  ? [sharedPost, ...sortedPosts.filter((p) => p.id !== sharedPost.id)]
  : sortedPosts;

  return (
    <>
      <Seo title="Community Feed" />

      <div className="min-h-screen pt-24 px-4 bg-[var(--body-color)]">
        <div className="max-w-2xl mx-auto space-y-4">

          <h1 className="text-3xl font-bold text-center text-yellow-300">
            Community Feed
          </h1>

          {displayPosts.map((post) => {
            const likeCount = post.likes
              ? Object.keys(post.likes).length
              : 0;

            const commentCount = post.comments
              ? Object.keys(post.comments).length
              : 0;

            const isLiked = user && post.likes?.[user.uid];

            const postUser = usersData[post.userId];

            const displayName =
              postUser?.fullName ||
              postUser?.username ||
              postUser?.name ||
              post.username ||
              "Anonymous";

            return (
<div
  key={post.id}
  className="bg-gray-100 rounded-lg shadow p-4"
>

                {/* HEADER */}
                <div className="flex items-center gap-3 mb-2">

                  {postUser?.photoURL ? (
                    <img
                      src={postUser.photoURL}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold">
                      {displayName[0].toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="font-semibold text-gray-800">
                      {displayName}
                    </div>

                    <div className="text-xs text-gray-500">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString()
                        : ""}
                    </div>
                  </div>

                </div>


                {/* CONTENT */}
                {post.title && (
                  <div className="font-bold text-gray-800">
                    {post.title}
                  </div>
                )}

                {post.content && (
                  <div className="text-gray-700 mb-2">
                    {post.content}
                  </div>
                )}


                {/* MEDIA */}
                {post.mediaURL && (
                  <div className="mb-2">

                    {post.mediaType === "image" ? (
                      <img
                        src={post.mediaURL}
                        className="rounded-lg w-full max-h-80 object-contain"
                      />
                    ) : (
                      <video
                        src={post.mediaURL}
                        controls
                        className="rounded-lg w-full max-h-80"
                      />
                    )}

                  </div>
                )}


                {/* ACTIONS */}
                <div className="flex items-center gap-6 border-t pt-2 text-gray-700">

                  <button
                    onClick={() => toggleLike(post)}
                    className="flex items-center gap-1 hover:text-red-500"
                  >
                    {isLiked
                      ? <FaHeart className="text-red-500"/>
                      : <FaRegHeart/>
                    }
                    {likeCount}
                  </button>

                  <div className="flex items-center gap-1">
                    <FaRegComment/>
                    {commentCount}
                  </div>

                  <button
                    onClick={() => toggleSave(post)}
                    className="hover:text-yellow-600"
                  >
                    {user && post.saved?.[user.uid]
                      ? <FaBookmark/>
                      : <FaRegBookmark/>
                    }
                  </button>
                  <button
  onClick={() => handleShare(post)}
  className="hover:text-blue-500"
  title="Share"
  aria-label="Share"
>
  <FiShare2 size={18} />
</button>

                </div>


                {/* COMMENT INPUT */}
                <div className="flex gap-2 mt-3">

                  <input
                    value={commentInput[post.id] || ""}
                    onChange={(e) =>
                      setCommentInput({
                        ...commentInput,
                        [post.id]: e.target.value
                      })
                    }
                    placeholder="Write a comment..."
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />

                  <button
                    onClick={() => addComment(post.id)}
                    className="bg-gray-800 text-white px-3 rounded hover:bg-black"
                  >
                    <FiSend/>
                  </button>

                </div>


                {/* COMMENTS LIST */}
                {post.comments && (
                  <div className="mt-3 border-t pt-2 space-y-2">

                    {Object.entries(post.comments)
                      .sort(([,a],[,b]) => a.time - b.time)
                      .map(([cid, c]) => (

                      <div
                        key={cid}
                        className="bg-white rounded px-2 py-1 flex justify-between"
                      >

                        <div>

                          <div className="text-sm">
                            <span className="font-semibold">
                              {c.username || usersData[c.userId]?.fullName || "User"}
                            </span>
                            {" "}
                            {c.text}
                          </div>

                          <div className="text-xs text-gray-400">
                            {new Date(c.time).toLocaleString()}
                          </div>

                        </div>

                        {user?.uid === c.userId && (
                          <button
                            onClick={() => deleteComment(post.id, cid)}
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
            );

          })}

        </div>
      </div>

      <ToastContainer position="bottom-left" theme="dark"/>

    </>
  );
}
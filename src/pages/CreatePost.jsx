// src/pages/Create.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiImage, FiVideo, FiX } from "react-icons/fi";
import { auth, db, storage } from "../services/firebase";
import { ref, push, serverTimestamp,get } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Create() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();




useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (u) => {
    if (!u) {
      setUser(null);
      return;
    }

    try {
      const snap = await get(ref(db, "users/" + u.uid));
      if (snap.exists()) {
        setUser({
          ...u,
          username: snap.val().username,   // ✅ store DB username
          photoURL: snap.val().photoURL || "/default-avatar.png",
        });
      } else {
        setUser({ ...u, username: u.displayName || "Anonymous" });
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setUser({ ...u, username: u.displayName || "Anonymous" });
    }
  });

  return () => unsubscribe();
}, []);


  // Word limit helper
  const limitWords = (text, limit) => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > limit) {
      return words.slice(0, limit).join(" ");
    }
    return text;
  };

  // Handle file selection
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  // Remove media
  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("");
  };

  // Handle Publish
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to post!");
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error("Title and Description are required!");
      return;
    }

    setLoading(true);

    let mediaURL = "";
    try {
      if (mediaFile) {
        const fileRef = sRef(
          storage,
          `posts/${user.uid}/${Date.now()}-${mediaFile.name}`
        );
        await uploadBytes(fileRef, mediaFile);
        mediaURL = await getDownloadURL(fileRef);
      }

      await push(ref(db, "posts"), {
        title: limitWords(title, 60),
        content: limitWords(content, 60),
        mediaURL,
        mediaType,
        userId: user.uid,
        username: user.username || "Anonymous",
        photoURL: user.photoURL || "/default-avatar.png",
        createdAt: serverTimestamp(),
      });

      // Reset form
      setTitle("");
      setContent("");
      removeMedia();

      toast.success("✅ Post Published Successfully!");
      navigate("/post");
    } catch (error) {
      console.error("Error publishing post:", error);
      toast.error("❌ Failed to Publish Post.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--body-color)] pt-24 px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-yellow-300 mb-6 text-center">
          Please Login to Continue
        </h1>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--body-color)" }}
      className="min-h-screen pt-24 px-4 mt-10"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-600">Create New Post</h1>
        <p className="text-gray-600 mb-6">
          Share your thoughts, ideas, or feedback with the community.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Post Title (Max 60 words)"
              value={title}
              onChange={(e) => setTitle(limitWords(e.target.value, 60))}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 text-gray-500 focus:ring-green-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.trim().split(/\s+/).filter(Boolean).length}/60 words
            </p>
          </div>

          {/* Description */}
          <div>
            <textarea
              placeholder="What's on your mind? (Max 60 words)"
              value={content}
              onChange={(e) => setContent(limitWords(e.target.value, 60))}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 text-gray-500 focus:ring-green-400"
              rows="5"
              required
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">
              {content.trim().split(/\s+/).filter(Boolean).length}/60 words
            </p>
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative mt-2">
              {mediaType === "image" ? (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="rounded-lg max-h-96 w-auto mx-auto object-contain"
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  className="rounded-lg max-h-96 w-auto mx-auto object-contain"
                />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-gray-800 text-white p-1 rounded-full hover:bg-red-600"
              >
                <FiX size={16} />
              </button>
            </div>
          )}

          {/* Media Upload Buttons */}
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-green-600 cursor-pointer">
              <FiImage size={20} /> Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "image")}
              />
            </label>
            <label className="flex items-center gap-2 text-blue-600 cursor-pointer">
              <FiVideo size={20} /> Video
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "video")}
              />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"
            } text-white px-6 py-2 rounded-lg w-full`}
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

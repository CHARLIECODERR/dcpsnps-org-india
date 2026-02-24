import { useState, useEffect } from 'react';
import './App.css';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLm_yXfa58C9yCtoj4PE0YNxXgCY3RY7Q",
  authDomain: "dcpsnps-fe479.firebaseapp.com",
  projectId: "dcpsnps-fe479",
  storageBucket: "dcpsnps-fe479.appspot.com",
  messagingSenderId: "144799129608",
  appId: "1:144799129608:web:9a030aef68f2f20293b1bd",
  measurementId: "G-JWK7ZTTS78",
  databaseURL: "https://dcpsnps-fe479-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function OldFeedDemo() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const postList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : data.createdAt || "",
          };
        });
        setPosts(postList);
      } catch (err) {
        setError("Error fetching posts");
        console.error("Error fetching posts:", err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
        padding: "40px 0",
        fontFamily: "Segoe UI, Arial, sans-serif",
        color: "#222",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "auto" }}>
        <h1 style={{ textAlign: "center", color: "#2b5876", marginBottom: "30px", letterSpacing: "2px" }}>
          🚀 Firestore Old Posts
        </h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "center" }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "#fff",
                border: "1px solid #b6c2d1",
                borderRadius: "18px",
                boxShadow: "0 4px 16px rgba(44, 62, 80, 0.08)",
                padding: "22px 18px",
                width: "320px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                transition: "box-shadow 0.2s",
                color: "#34495e",
              }}
            >
              <p style={{ fontWeight: "bold", color: "#2b5876", marginBottom: "8px" }}>
                Email: <span style={{ color: "#34495e", fontWeight: "normal" }}>{post.email}</span>
              </p>
              <p style={{ whiteSpace: "pre-line", marginBottom: "10px", color: "#222" }}>{post.content}</p>
              <p style={{ fontSize: "0.95em", color: "#7f8c8d", marginBottom: "10px" }}>
                <b>Created At:</b> {post.createdAt}
              </p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="post"
                  style={{ width: "100%", borderRadius: "10px", marginTop: "10px", background: "#f4f8fb" }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OldFeedDemo;
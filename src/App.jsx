import { Routes, Route } from "react-router-dom";
import React, { Suspense, useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import MyPosts from "./pages/MyPosts.jsx";
import SinglePost from "./pages/SinglePost";

const Home2 = React.lazy(() => import("./pages/Home2"));
const Home3 = React.lazy(() => import("./pages/Home3"));
const Home4 = React.lazy(() => import("./pages/Home4"));
const About = React.lazy(() => import("./pages/About"));
const ContactUS = React.lazy(() => import("./pages/ContactUs"));

const Post = React.lazy(() => import("./pages/Post")); // Feed Page
const Create = React.lazy(() => import("./pages/CreatePost")); // Create Post Page
const SavedPost = React.lazy(() => import("./pages/SavedPost")); // Saved Post Page

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import emailjs from "@emailjs/browser";
import "./App.css";

function App() {
  useEffect(() => {
    emailjs.init("u8itjQTl3n-K0a0Nh");
  }, []);

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Navbar />

      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={
            <>
              <Home />
              <Home2 />
              <Home3 />
              <Home4 />
              <About />
              <ContactUS />
              <Footer />
            </>
          }
        />

        {/* Community Section */}
        <Route path="/post" element={<Post />} />              {/* FEED */}
        <Route path="/post/:postId" element={<SinglePost />} /> {/* SINGLE POST (SHARE LINK) */}

        <Route path="/create" element={<Create />} />
        <Route path="/saved" element={<SavedPost />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/myposts" element={<MyPosts />} />
      </Routes>

      <ToastContainer position="top-center" autoClose={3000} />
    </Suspense>
  );
}

export default App;
import React, { Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import MyPosts from "./pages/MyPosts.jsx";
import SinglePost from "./pages/SinglePost";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import emailjs from "@emailjs/browser";
import "./App.css";

const Home2 = React.lazy(() => import("./pages/Home2"));
const Home3 = React.lazy(() => import("./pages/Home3"));
const Home4 = React.lazy(() => import("./pages/Home4"));
const About = React.lazy(() => import("./pages/About"));
const ContactUS = React.lazy(() => import("./pages/ContactUs"));

const Post = React.lazy(() => import("./pages/Post")); // Feed Page
const Create = React.lazy(() => import("./pages/CreatePost")); // Create Post Page
const SavedPost = React.lazy(() => import("./pages/SavedPost")); // Saved Post Page

function App() {
  useEffect(() => {
    emailjs.init("u8itjQTl3n-K0a0Nh");
  }, []);

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Navbar />

      <Routes>
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

        <Route path="/post" element={<Post />} />
        <Route path="/post/:postId" element={<SinglePost />} />

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
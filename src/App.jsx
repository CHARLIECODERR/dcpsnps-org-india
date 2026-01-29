import { Routes, Route } from 'react-router-dom';
import React, { Suspense } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
const Home2 = React.lazy(() => import("./pages/Home2"));
const Home3 = React.lazy(() => import("./pages/Home3"));
const Home4 = React.lazy(() => import("./pages/Home4"));
const About = React.lazy(() => import("./pages/About"));
const ContactUS = React.lazy(() => import("./pages/ContactUs"));
import Footer from "./components/Footer";

const Post = React.lazy(() => import("./pages/Post")); // Feed Page
const Create = React.lazy(() => import("./pages/CreatePost")); // Create Post Page
const SavedPost = React.lazy(() => import("./pages/SavedPost")); // Saved Post Page
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "./pages/Profile";
import MyPosts from './pages/MyPosts.jsx';
import emailjs from "@emailjs/browser";

import "./App.css";
// ✅ Initialize EmailJS globally
emailjs.init("u8itjQTl3n-K0a0Nh");

function App() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          {/* Home Page (all sections) */}
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
          <Route path="/post" element={<Post />} />       {/* Feed */}
          <Route path="/create" element={<Create />} />   {/* Create Post */}
          <Route path="/saved" element={<SavedPost />} /> {/* Saved Posts */}
          <Route path="/profile" element={<Profile />} /> {/* User Profile */}
          <Route path="/myposts" element={<MyPosts />} />
        </Routes>
      </Suspense>
     <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}

export default App;

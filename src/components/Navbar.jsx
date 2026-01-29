import logo from "../assets/logo1.png";
import { useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import AuthModalManager from "../features/auth/ModalManager";
import { FaUserCircle } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [profileDropdown, setProfileDropdown] = useState(false);

  const location = useLocation();
  const currentPath = location.pathname;

  const isPostsPage = ["/post", "/create", "/saved", "/myposts"].includes(
    currentPath
  );
  const isProfilePage = currentPath === "/profile";

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const snapshot = await get(ref(db, "users/" + currentUser.uid));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPhotoURL(data.photoURL || currentUser.photoURL || null);
        }
      } else {
        setUser(null);
        setPhotoURL(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthOpen = () => setShowAuthModal(true);
  const handleAuthClose = () => setShowAuthModal(false);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPhotoURL(null);
    setProfileDropdown(false);
  };

  /** Tailwind class generator for active links */
  const navLink = (path) =>
    `px-3 py-2 font-medium relative group ${
      currentPath === path
        ? "text-yellow-300 after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-yellow-300"
        : "text-gray-200 hover:text-yellow-300"
    }`;

  /** -------------------- NAV LINKS -------------------- */
  const renderLinks = () => {
    if (isPostsPage) {
      return (
        <>
          <Link to="/" className={navLink("/")}>
            Home
          </Link>
          <Link to="/post" className={navLink("/post")}>
            Feed
          </Link>
          <Link to="/create" className={navLink("/create")}>
            Create Post
          </Link>
          <Link to="/saved" className={navLink("/saved")}>
            Saved Posts
          </Link>
          <Link to="/myposts" className={navLink("/myposts")}>
            My Posts
          </Link>
        </>
      );
    }
    if (isProfilePage) {
      return (
        <>
          <Link to="/" className={navLink("/")}>
            Home
          </Link>
          <Link to="/profile" className={navLink("/profile")}>
            Profile
          </Link>
          <Link to="/myposts" className={navLink("/myposts")}>
            My Posts
          </Link>
        </>
      );
    }
    // Default = Home Section
    return (
      <>
        <a
          href="#Home"
          className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium"
        >
          Home
        </a>
        <a
          href="#About"
          className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium"
        >
          About
        </a>
        <a
          href="#Contact"
          className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium"
        >
          Contact
        </a>
        <Link to="/post" className={navLink("/post")}>
          Posts
        </Link>
      </>
    );
  };

  return (
    <>
      {/* Navbar */}
      <nav
        style={{ background: "var(--body-color)" }}
        className="shadow-md w-full fixed top-0 left-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={logo} alt="DCPS Logo" className="h-12" />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            {isOpen ? (
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            {renderLinks()}

            {/* Profile/Login Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown((prev) => !prev)}
                  className="focus:outline-none"
                >
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <FaUserCircle size={28} className="text-white" />
                  )}
                </button>
                {profileDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdown(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthOpen}
                className="bg-green-600 text-white font-medium rounded-md px-4 py-2"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-gray-800 flex flex-col space-y-4 px-6 py-4">
            {/* Nav Links */}
            {renderLinks()}

            {/* Profile/Login Section (Mobile) */}
            {user ? (
              <div className="flex flex-col items-start ml-2.5">
                {/* Profile Icon aligned left and vertically with nav links */}
                <button
                  onClick={() => setProfileDropdown((p) => !p)}
                  className="flex items-center focus:outline-none mt-1"
                >
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <FaUserCircle size={24} className="text-white" />
                  )}
                </button>

                {/* Dropdown appears below icon only when open */}
                {profileDropdown && (
                  <div className="mt-2 w-full bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setProfileDropdown(false);
                        setIsOpen(false);
                      }}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleAuthOpen();
                }}
                className="bg-green-700 text-white font-medium rounded-md px-4 py-2"
              >
                Login
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      {showAuthModal && <AuthModalManager onClose={handleAuthClose} />}
    </>
  );
}

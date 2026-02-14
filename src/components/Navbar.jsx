// src/components/Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo1.png";
import AuthModalManager from "../features/auth/ModalManager"; // keep normal import

export default function Navbar() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthOpen = () => setShowAuthModal(true);
  const handleAuthClose = () => setShowAuthModal(false);

  return (
    <>
      <nav className="bg-gray-800 fixed w-full top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="h-12" />
            <span className="text-white font-bold text-xl">DCPS</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium">
              Home
            </Link>
            <a href="#About" className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium">
              About
            </a>
            <a href="#Contact" className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium">
              Contact
            </a>
            <Link to="/post" className="text-gray-200 hover:text-yellow-300 px-3 py-2 font-medium">
              Posts
            </Link>

            {/* LOGIN BUTTON - always visible */}
            <button
              onClick={handleAuthOpen}
              className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && <AuthModalManager onClose={handleAuthClose} />}
    </>
  );
}

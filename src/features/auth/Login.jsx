import { useState } from "react";
import logo from "../../assets/logo1.png";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { auth, db } from "../../services/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  ref,
  get,
  set,   // ✅ added
} from "firebase/database";

import { toast } from "react-toastify";

const LoginModal = ({ onClose, onSwitchToRegister, onSwitchToForgot }) => {

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });


  const handleLogin = async () => {

    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {

      setLoading(true);

      // ✅ Firebase Authentication login
      const { user } = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );


      // ✅ Check Realtime Database record
      const userRef = ref(db, `users/${user.uid}`);

      const snapshot = await get(userRef);


      // ✅ If old user → create record automatically
      if (!snapshot.exists()) {

        await set(userRef, {

          email: user.email,

          fullName: user.displayName || "",

          emailVerified: true,

          createdAt: Date.now(),

        });

      }


      toast.success("Login successful ✅");

      onClose();


    } catch (error) {

      console.error(error);

      if (error.code === "auth/user-not-found") {

        toast.error("No account found with this email");

      }
      else if (error.code === "auth/wrong-password") {

        toast.error("Incorrect password");

      }
      else if (error.code === "auth/invalid-email") {

        toast.error("Invalid email");

      }
      else {

        toast.error("Login failed");

      }

    }
    finally {

      setLoading(false);

    }

  };


  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      />

      <div className="relative bg-white w-[95%] max-w-lg p-8 rounded-lg shadow-xl">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl"
        >
          ×
        </button>


        <div className="flex justify-center mb-4">

          <img
            src={logo}
            alt="logo"
            className="h-12"
          />

        </div>


        <h2 className="text-center text-2xl font-semibold mb-4">

          Login

        </h2>



        <div className="relative mb-4">

          <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full pl-10 py-2 border rounded"
          />

        </div>



        <div className="relative mb-2">

          <FaLock className="absolute left-3 top-3.5 text-gray-400" />

          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={handleChange}
            className="w-full pl-10 pr-10 py-2 border rounded"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-3 top-3.5"
          >

            {showPassword
              ? <FaEyeSlash />
              : <FaEye />
            }

          </button>

        </div>



        <div className="text-right mb-4">

          <button
            onClick={onSwitchToForgot}
            className="text-sm text-orange-600"
          >

            Forgot Password?

          </button>

        </div>



        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-2 rounded"
        >

          {loading
            ? "Logging in..."
            : "Login"
          }

        </button>



        <p className="text-center mt-4 text-sm">

          Don’t have an account?{" "}

          <button
            onClick={onSwitchToRegister}
            className="text-orange-600"
          >

            Register

          </button>

        </p>


      </div>

    </div>

  );

};

export default LoginModal;
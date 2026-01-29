import { useState } from "react";
import logo from "../../assets/logo1.png";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { auth } from "../../services/firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { toast } from "react-toastify";

const LoginModal = ({ onClose, onSwitchToRegister, onSwitchToForgot }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const { user } = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 🔐 BLOCK LOGIN IF EMAIL NOT VERIFIED
      if (!user.emailVerified) {
        await signOut(auth); // ✅ CRITICAL FIX
        setUnverifiedUser(user);
        toast.error("Please verify your email before login");
        return;
      }

      toast.success("Login successful");
      onClose();
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!unverifiedUser) return;

    try {
      await sendEmailVerification(unverifiedUser);
      toast.info("Verification email resent. Check your inbox.");
    } catch {
      toast.error("Failed to resend verification email");
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
          <img src={logo} alt="logo" className="h-12" />
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
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
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
          {loading ? "Logging in..." : "Login"}
        </button>

        {unverifiedUser && (
          <button
            onClick={resendVerification}
            className="block mx-auto mt-3 text-sm text-blue-600"
          >
            Resend Verification Email
          </button>
        )}

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

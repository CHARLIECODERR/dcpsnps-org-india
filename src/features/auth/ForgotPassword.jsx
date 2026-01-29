import { useState } from "react";
import logo from "../../assets/logo1.png";
import { FaEnvelope } from "react-icons/fa";
import { auth } from "../../services/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";

const ForgotPassword = ({ onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Check your inbox.");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-[95%] max-w-lg p-8 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl">×</button>

        <div className="flex justify-center mb-5">
          <img src={logo} alt="Logo" className="h-12" />
        </div>

        <h2 className="text-center text-2xl font-semibold text-gray-800 mb-1">Reset Password</h2>
        <p className="text-center text-sm text-gray-600 mb-6">Enter the email associated with your account</p>

        <div className="relative mb-4">
          <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button onClick={handleReset} disabled={loading} className="mt-2 w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition">{loading ? 'Sending...' : 'Send Reset Email'}</button>

        <p className="text-center text-sm text-gray-600 mt-4">Remembered password? <button onClick={onSwitchToLogin} className="text-orange-600 hover:underline">Login</button></p>
      </div>
    </div>
  );
};

export default ForgotPassword;

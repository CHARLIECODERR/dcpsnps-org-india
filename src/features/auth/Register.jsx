import { useState } from "react";
import { auth, db } from "../../services/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { toast } from "react-toastify";

const Register = ({ onClose, onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // OTP (demo)
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    dob: "",
    village: "",
    district: "",
    state: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 📲 SEND OTP (DEMO)
  const sendOtp = () => {
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error("Enter valid 10-digit mobile number");
      return;
    }

    const otp = "123456";
    setGeneratedOtp(otp);
    setOtpSent(true);

    console.log("DEMO OTP:", otp);
    toast.success("OTP sent (demo: 123456)");
  };

  // ✅ VERIFY OTP
  const verifyOtp = () => {
    if (enteredOtp === generatedOtp) {
      setPhoneVerified(true);
      toast.success("Mobile number verified");
    } else {
      toast.error("Invalid OTP");
    }
  };

  const validateForm = () => {
    if (Object.values(formData).some((v) => !v)) {
      toast.error("Please fill all fields");
      return false;
    }

    if (!phoneVerified) {
      toast.error("Please verify mobile number");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  // 🧾 REGISTER
  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.fullName,
      });

      await set(ref(db, `users/${user.uid}`), {
        fullName: formData.fullName,
        gender: formData.gender,
        dob: formData.dob,
        email: formData.email,
        phone: formData.phone,
        phoneVerified: true,
        address: {
          village: formData.village,
          district: formData.district,
          state: formData.state,
        },
        createdAt: Date.now(),
      });

      await sendEmailVerification(user, {
        url: window.location.origin,
      });

      await signOut(auth);

      setRegisteredEmail(formData.email);
      setSuccess(true);
    } catch (error) {
      toast.error(
        error.code === "auth/email-already-in-use"
          ? "Email already registered"
          : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="relative bg-white w-[95%] max-w-md rounded-lg shadow-lg p-5"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* ❌ CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
          title="Close"
        >
          ✕
        </button>

        {!success ? (
          <>
            <h2 className="text-xl font-semibold text-center text-black mb-3">
              User Registration
            </h2>

            <input className="input" name="fullName" placeholder="Full Name" onChange={handleChange} />
            <select className="input" name="gender" onChange={handleChange}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <input className="input" type="date" name="dob" onChange={handleChange} />
            <input className="input" name="village" placeholder="Village" onChange={handleChange} />
            <input className="input" name="district" placeholder="District" onChange={handleChange} />
            <input className="input" name="state" placeholder="State" onChange={handleChange} />
            <input className="input" name="email" placeholder="Email Address" onChange={handleChange} />
            <input className="input" name="phone" placeholder="Mobile Number" onChange={handleChange} />

            <button onClick={sendOtp} className="btn-blue">Send OTP</button>

            <input
              className="input"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              disabled={!otpSent}
            />

            <button onClick={verifyOtp} disabled={!otpSent} className="btn-green">
              Verify OTP
            </button>

            <input
              className="input"
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
            />

            <button onClick={handleRegister} disabled={loading} className="btn-orange">
              {loading ? "Creating Account..." : "Register"}
            </button>

            <p className="text-center text-sm text-black mt-2">
              Already have an account?{" "}
              <button onClick={onSwitchToLogin} className="text-orange-600 font-medium">
                Login
              </button>
            </p>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-green-600">
              🎉 Registration Successful
            </h2>
            <p className="text-black mt-2">
              Verification email sent to
            </p>
            <p className="font-semibold text-orange-600">
              {registeredEmail}
            </p>

            <button onClick={onSwitchToLogin} className="btn-orange mt-4">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;

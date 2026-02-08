import { useEffect, useState } from "react";
import { auth, db } from "../../services/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { toast } from "react-toastify";
import emailjs from "@emailjs/browser";

import {
  getStatesOfIndia,
  getDistrictsOfState,
} from "../../services/locationApi";

const OTP_EXPIRY_TIME = 300;
const OTP_MAX_ATTEMPTS = 3;

const Register = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // UI
  const [showPassword, setShowPassword] = useState(false);

  // Location
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dob: "",
    mobile: "",
    state: "",
    stateIso: "",
    district: "",
    village: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const fieldStyle =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm " +
    "font-normal text-slate-600 placeholder:text-slate-400 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500";

  /* ================= OTP TIMERS ================= */

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setInterval(() => setResendTimer((v) => v - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setInterval(() => setOtpTimer((v) => v - 1), 1000);
      return () => clearInterval(t);
    }
    if (otpTimer === 0 && otpSent && !emailVerified) {
      toast.error("OTP expired. Please resend OTP.");
      setOtpSent(false);
    }
  }, [otpTimer, otpSent, emailVerified]);

  /* ================= OTP LOGIC ================= */

  const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const sendEmailOtp = async () => {
    if (!formData.email) {
      toast.error("Enter email first");
      return;
    }

    const otp = generateOtp();
    setGeneratedOtp(otp);
    setOtpSent(true);
    setOtpTimer(OTP_EXPIRY_TIME);
    setOtpAttempts(0);
    setResendTimer(60);

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { to_email: formData.email, otp },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      toast.success("OTP sent to email");
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const verifyOtp = () => {
    if (otpAttempts >= OTP_MAX_ATTEMPTS) {
      toast.error("Too many attempts. Please resend OTP.");
      return;
    }

    if (enteredOtp !== generatedOtp) {
      setOtpAttempts((v) => v + 1);
      toast.error(
        `Invalid OTP (${OTP_MAX_ATTEMPTS - otpAttempts - 1} attempts left)`
      );
      return;
    }

    setEmailVerified(true);
    toast.success("Email verified successfully");
  };

  /* ================= LOCATION ================= */

  useEffect(() => {
    getStatesOfIndia().then(setStates);
  }, []);

  const handleStateChange = async (e) => {
    const s = states.find((x) => x.name === e.target.value);
    if (!s) return;
    setFormData({ ...formData, state: s.name, stateIso: s.iso2, district: "" });
    setDistricts(await getDistrictsOfState(s.iso2));
  };

  /* ================= PASSWORD STRENGTH ================= */

  const passwordStrength = () => {
    const p = formData.password;
    if (p.length < 6) return "Weak";
    if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) return "Strong";
    return "Medium";
  };

  /* ================= REGISTER (FIXED) ================= */

  const handleRegister = async () => {
    if (!emailVerified) {
      toast.error("Verify email first");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`;
      await updateProfile(user, { displayName: fullName });

      await set(ref(db, `users/${user.uid}`), {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        fullName,
        gender: formData.gender,
        dob: formData.dob,
        mobile: formData.mobile,
        email: formData.email,
        emailVerified: true,
        address: {
          state: formData.state,
          district: formData.district,
          village: formData.village,
        },
        createdAt: Date.now(),
      });

      await signOut(auth);
      setRegisteredEmail(formData.email);
      setSuccess(true);

    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Please login.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-white w-[95%] max-w-md rounded-lg shadow-lg p-5 max-h-[90vh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-slate-500 hover:text-red-500"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center mb-4">
          User Registration
        </h2>

        {!success ? (
          <>
            <input className={fieldStyle} placeholder="First Name" onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            <input className={fieldStyle} placeholder="Middle Name" onChange={e => setFormData({ ...formData, middleName: e.target.value })} />
            <input className={fieldStyle} placeholder="Last Name" onChange={e => setFormData({ ...formData, lastName: e.target.value })} />

            <select className={fieldStyle} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <input className={fieldStyle} type="date" onChange={e => setFormData({ ...formData, dob: e.target.value })} />
            <input className={fieldStyle} placeholder="Mobile Number" onChange={e => setFormData({ ...formData, mobile: e.target.value })} />

            <select className={fieldStyle} onChange={handleStateChange}>
              <option value="">Select State</option>
              {states.map(s => <option key={s.iso2}>{s.name}</option>)}
            </select>

            <select className={fieldStyle} onChange={e => setFormData({ ...formData, district: e.target.value })}>
              <option value="">Select District</option>
              {districts.map(d => <option key={d.id}>{d.name}</option>)}
            </select>

            <input className={fieldStyle} placeholder="Village" onChange={e => setFormData({ ...formData, village: e.target.value })} />
            <input className={fieldStyle} placeholder="Email Address" onChange={e => setFormData({ ...formData, email: e.target.value })} />

            <button onClick={sendEmailOtp} disabled={resendTimer > 0} className="btn-blue w-full mt-2">
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Send Email OTP"}
            </button>

            <input className={fieldStyle} placeholder="Enter OTP" onChange={e => setEnteredOtp(e.target.value)} />
            <button onClick={verifyOtp} className="btn-green w-full mt-1">
              Verify OTP
            </button>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={fieldStyle}
                placeholder="Password"
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 cursor-pointer text-sm text-blue-500"
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>

            <p className="text-sm mt-1">
              Strength: <b>{passwordStrength()}</b>
            </p>

            <input
              type="password"
              className={fieldStyle}
              placeholder="Confirm Password"
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            <button
              onClick={handleRegister}
              disabled={!emailVerified || loading}
              className="btn-orange w-full mt-3"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-green-600 font-semibold text-lg">
              Registration Successful
            </h2>
            <p>{registeredEmail}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;

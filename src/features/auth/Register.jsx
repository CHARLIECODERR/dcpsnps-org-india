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
import logo from "../../assets/logo1.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import enGB from "date-fns/locale/en-GB";

registerLocale("en-GB", enGB);


const OTP_EXPIRY_TIME = 60;
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
const [dobDate, setDobDate] = useState(null);

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
    "w-full rounded-md border border-blue-200 px-4 py-2.5 text-sm " +
    "text-black placeholder:text-black bg-white appearance-none " +
    "focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-400 mb-3";

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

   setEmailVerified(false);
  setEnteredOtp("");

  // 🔴 Check ALL required fields before OTP
  if (
    !formData.firstName ||
    !formData.middleName ||
    !formData.lastName ||
    !formData.gender ||
    !dobDate ||
    !formData.mobile ||
    !formData.state ||
    !formData.district ||
    !formData.village ||
    !formData.email
  ) {
    toast.error("Please fill all fields before sending OTP");
    return;
  }

  // 🔴 Mobile validation (exact 10 digits)
  if (!/^\d{10}$/.test(formData.mobile)) {
    toast.error("Mobile number must be exactly 10 digits");
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

  // ❌ If OTP expired
  if (!otpSent) {
    toast.error("Please resend OTP");
    return;
  }

  // ❌ Wrong OTP
  if (enteredOtp !== generatedOtp) {
    toast.error("Invalid OTP. Please resend OTP.");

    // 🔴 Immediately invalidate OTP
    setOtpSent(false);
    setGeneratedOtp("");
    setEnteredOtp("");
    setOtpTimer(0);
    setResendTimer(0);

    return;
  }

  // ✅ Correct OTP
  setEmailVerified(true);
  setResendTimer(0);
  setOtpTimer(0);
  setOtpSent(false);

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

  /* ================= REGISTER ================= */
const handleRegister = async () => {

  // 🔴 Final check - no field empty
  if (
    !formData.firstName ||
    !formData.middleName ||
    !formData.lastName ||
    !formData.gender ||
    !dobDate ||
    !formData.mobile ||
    !formData.state ||
    !formData.district ||
    !formData.village ||
    !formData.email ||
    !formData.password ||
    !formData.confirmPassword
  ) {
    toast.error("Please fill all fields");
    return;
  }

  // 🔴 Mobile validation
  if (!/^\d{10}$/.test(formData.mobile)) {
    toast.error("Mobile number must be exactly 10 digits");
    return;
  }

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
      ...formData,
      fullName,
      emailVerified: true,
      createdAt: Date.now(),
    });

    await signOut(auth);
    setRegisteredEmail(formData.email);
    setSuccess(true);

  } catch (error) {

  if (error.code === "auth/email-already-in-use") {
    toast.error("This email is already registered. Please login.");
  } 
  else if (error.code === "auth/invalid-email") {
    toast.error("Invalid email address");
  } 
  else if (error.code === "auth/weak-password") {
    toast.error("Password should be at least 6 characters");
  } 
  else {
    toast.error("Registration failed");
  }

} finally {
  setLoading(false);
}

};


  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-white w-[95%] max-w-md rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
        {/* Scrollable content */}
        <div className="p-5 max-h-[90vh] overflow-y-auto no-scrollbar">

          <button
          type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-xl text-gray-400 hover:text-red-500"
          >
            ✕
          </button>

          <div className="flex justify-center mb-4">
            <img src={logo} alt="logo" className="h-12" />
          </div>

          <h2 className="text-xl font-semibold text-center mb-4">User Registration</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Create your account</p>

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
  <DatePicker
  selected={dobDate}
  onChange={(date) => {
    setDobDate(date);

    if (date) {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();

      setFormData({
        ...formData,
        dob: `${d}/${m}/${y}`, // ✅ 19/12/2002
      });
    }
  }}
  placeholderText="Date of Birth"
  className={fieldStyle}
  wrapperClassName="w-full mb-3"
  dateFormat="dd/MM/yyyy"   // ✅ DISPLAY
  locale="en-GB"            // ✅ DAY FIRST
  isClearable
/>

<input
  className={fieldStyle}
  placeholder="Mobile Number"
  value={formData.mobile}
  maxLength={10} // restrict typing to 10 digits
  onChange={(e) => {
    const value = e.target.value;

    // Allow only digits
    if (!/^\d*$/.test(value)) return;

    setFormData({ ...formData, mobile: value });
  }}
  onBlur={() => {
    // Validate on leaving the field
    if (formData.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
    }
  }}
/>

              <select className={fieldStyle} onChange={handleStateChange}>
                <option value="">Select State</option>
                {states.map(s => <option key={s.iso2}>{s.name}</option>)}
              </select>
              <select className={fieldStyle} onChange={e => setFormData({ ...formData, district: e.target.value })}>
                <option value="">Select District</option>
                {districts.map(d => <option key={d.id}>{d.name}</option>)}
              </select>

              <input className={fieldStyle} placeholder="Village" onChange={e => setFormData({ ...formData, village: e.target.value })} />

              {/* OTP Section */}
              <div className="mb-3">
                <input
                  className={fieldStyle}
                  placeholder="Email Address"
                  value={formData.email}
                  disabled={emailVerified} 
                  onChange={e => {
                    setFormData({ ...formData, email: e.target.value });
                    setOtpSent(false);
                    setEnteredOtp("");
                    setEmailVerified(false);
                    setOtpAttempts(0);
                  }}
                />
                <button
                type="button"
  onClick={sendEmailOtp}
 disabled={!formData.email || emailVerified}
  className={`w-full py-2 rounded-lg font-medium mb-2 ${
    emailVerified
      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
      : "bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
  }`}
>
  {resendTimer > 0
    ? `Resend OTP in ${resendTimer}s`
    : emailVerified
    ? "Email Verified"
    : "Send Email OTP"}
</button>

                <input
                  className={fieldStyle}
                  placeholder="Enter OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                />
                <button
                type="button"
                  onClick={verifyOtp}
                  disabled={!otpSent || emailVerified}
                  className={`w-full py-2 rounded-lg font-medium mb-3 ${
                    emailVerified
                      ? "bg-orange-100 text-orange-600 cursor-not-allowed"
                      : "bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                  }`}
                >
                  {emailVerified ? "OTP Verified ✅" : "Verify OTP"}
                </button>
                {otpSent && !emailVerified && (
                  <p className="text-sm text-gray-500">
                    OTP valid for {otpTimer}s | Attempts left: {OTP_MAX_ATTEMPTS - otpAttempts}
                  </p>
                )}
              </div>

              <input type={showPassword ? "text" : "password"} className={fieldStyle} placeholder="Password" onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <input type="password" className={fieldStyle} placeholder="Confirm Password" onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />

              <button onClick={handleRegister} className="w-full bg-orange-500 text-white py-3 rounded-xl mt-2">
                Register
              </button>
            </>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-orange-600 font-semibold text-lg">Registration Successful</h2>
              <p>{registeredEmail}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
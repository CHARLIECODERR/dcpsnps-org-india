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
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";


const normalize = (str) =>
  str
    .toLowerCase()
    .replace("district", "")
    .replace(/\s+/g, "")
    .trim();
const DISTRICT_ALIASES = {
  buldhana: "Buldhana",
  raigad: "Raigad",
  mumbai: "Mumbai City",
  mumbaisuburban: "Mumbai Suburban",
  "mumbai city": "Mumbai City",
  "mumbai suburban": "Mumbai Suburban"
};





const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad",
  "Beed", "Bhandara", "Buldhana", "Chandrapur",
  "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur",
  "Mumbai City", "Mumbai Suburban", "Nagpur",
  "Nanded", "Nandurbar", "Nashik", "Osmanabad",
  "Palghar", "Parbhani", "Pune", "Raigad",
  "Ratnagiri", "Sangli", "Satara", "Sindhudurg",
  "Solapur", "Thane", "Wardha", "Washim",
  "Yavatmal"
];



const OTP_EXPIRY_TIME = 60;
const OTP_MAX_ATTEMPTS = 3;
const muiFieldStyle = {
  mb: 1.2,
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: "14px",
    height: "44px",
    backgroundColor: "#fff",
  },
  "& label.Mui-focused": {
    color: "#f97316", // orange
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#bfdbfe", // blue-200
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#f97316",
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#f97316",
  },
};


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
  const [otpLocked, setOtpLocked] = useState(false);

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
  if (otpSent && otpTimer > 0 && !otpLocked) {
    // OTP is still valid, do nothing
    toast.info(`OTP already sent. Please wait ${otpTimer}s`);
    return;
  }

  setOtpLocked(false); // 🔓 UNLOCK OTP on resend
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
  setOtpAttempts(0);

  // Only start timer if OTP is new
  setOtpTimer(OTP_EXPIRY_TIME);
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
  setOtpLocked(true); //locked

  // ❌ If OTP expired
  if (enteredOtp !== generatedOtp) {
  const newAttempts = otpAttempts + 1;
  setOtpAttempts(newAttempts);

  toast.error("Invalid OTP");

  if (newAttempts >= OTP_MAX_ATTEMPTS) {
    setOtpSent(false);
    setGeneratedOtp("");
    setEnteredOtp("");
    setOtpTimer(0);
    setResendTimer(60);
  }

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
  const stateName = e.target.value;
  const s = states.find((x) => x.name === stateName);
  if (!s) return;

  setFormData((prev) => ({
    ...prev,
    state: stateName,
    stateIso: s.iso2,
    district: ""
  }));

  let data = await getDistrictsOfState(s.iso2);

  // Normalize API district names
  let finalDistricts = data.map(d => {
    const key = d.name.toLowerCase().replace("district", "").replace(/\s+/g, "").trim();
    const aliasName = DISTRICT_ALIASES[key] || d.name.trim();
    return { ...d, name: aliasName };
  });

  // ✅ If state is Maharashtra, filter to known districts and force add missing
  if (stateName.toLowerCase() === "maharashtra") {
    finalDistricts = finalDistricts.filter(d =>
      MAHARASHTRA_DISTRICTS.some(md => md.toLowerCase() === d.name.toLowerCase())
    );

    ["Buldhana", "Raigad"].forEach(dName => {
      if (!finalDistricts.some(d => d.name.toLowerCase() === dName.toLowerCase())) {
        finalDistricts.push({ name: dName });
      }
    });
  }

  // Sort alphabetically
  finalDistricts.sort((a, b) => a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase()));

  setDistricts(finalDistricts);
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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

          {!success ? (
            <>
              {/* 🔽 ONLY SHOW WHEN NOT SUCCESS */}
              <h2 className="text-xl font-semibold text-center mb-4">
                User Registration
              </h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                Create your account
              </p>
              <TextField
  label="First Name"
  fullWidth
  sx={muiFieldStyle}
  value={formData.firstName}
  onChange={(e) =>
    setFormData({ ...formData, firstName: e.target.value })
  }
/>


              <TextField
  label="Middle Name"
  fullWidth
  sx={muiFieldStyle}
  value={formData.middleName}
  onChange={(e) =>
    setFormData({ ...formData, middleName: e.target.value })
  }
/>

              <TextField
  label="Last Name"
  fullWidth
  sx={muiFieldStyle}
  value={formData.lastName}
  onChange={(e) =>
    setFormData({ ...formData, lastName: e.target.value })
  }
/>

             <TextField
  select
  label="Gender"
  fullWidth
  sx={muiFieldStyle}
  value={formData.gender}
  onChange={(e) =>
    setFormData({ ...formData, gender: e.target.value })
  }
>
  <MenuItem value="">Select Gender</MenuItem>
  <MenuItem value="Male">Male</MenuItem>
  <MenuItem value="Female">Female</MenuItem>
  <MenuItem value="Other">Other</MenuItem>
</TextField>


  <DatePicker
  label="Date of Birth"
  value={dobDate}
  onChange={(date) => {
    setDobDate(date);
    if (date) {
      const d = String(date.$D).padStart(2, "0");
      const m = String(date.$M + 1).padStart(2, "0");
      const y = date.$y;
      setFormData({ ...formData, dob: `${d}/${m}/${y}` });
    }
  }}
  slotProps={{
    textField: {
      fullWidth: true,
      sx: muiFieldStyle
    },
  }}
/>




<TextField
  label="Mobile Number"
  fullWidth
  sx={muiFieldStyle}
  value={formData.mobile}
  inputProps={{ maxLength: 10 }}
  onChange={(e) => {
    if (!/^\d*$/.test(e.target.value)) return;
    setFormData({ ...formData, mobile: e.target.value });
  }}
/>


              <TextField
  select
  label="State"
  fullWidth
  sx={muiFieldStyle}
  value={formData.state}
  onChange={handleStateChange}
>
  <MenuItem value="">Select State</MenuItem>
  {states.map((s) => (
    <MenuItem key={s.iso2} value={s.name}>
      {s.name}
    </MenuItem>
  ))}
</TextField>

            <TextField
  select
  label="District"
  fullWidth
  sx={muiFieldStyle}
  value={formData.district}
  onChange={(e) =>
    setFormData({ ...formData, district: e.target.value })
  }
>
  <MenuItem value="">Select District</MenuItem>
  {districts.map((d) => (
    <MenuItem key={d.name} value={d.name}>

      {d.name}
    </MenuItem>
  ))}
</TextField>



              <TextField
  label="Village"
  fullWidth
  sx={muiFieldStyle}
  value={formData.village}
  onChange={(e) =>
    setFormData({ ...formData, village: e.target.value })
  }
/>


              {/* OTP Section */}
              <div className="mb-3">
                <TextField
  label="Email Address"
  fullWidth
  sx={muiFieldStyle}
  disabled={otpSent || emailVerified}
  value={formData.email}
  onChange={(e) => {
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

                <TextField
  label="Enter OTP"
  fullWidth
  sx={muiFieldStyle}
  disabled={otpLocked}
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

              <TextField
  label="Password"
  type="password"
  fullWidth
  sx={muiFieldStyle}
  onChange={(e) =>
    setFormData({ ...formData, password: e.target.value })
  }
/>


              <TextField
  label="Confirm Password"
  type="password"
  fullWidth
  sx={muiFieldStyle}
  onChange={(e) =>
    setFormData({ ...formData, confirmPassword: e.target.value })
  }
/>



              <button onClick={handleRegister} className="w-full bg-orange-500 text-white py-3 rounded-xl mt-2">
                Register
              </button>
            </>
          ) : (
          <div className="text-center py-6 px-4 flex flex-col items-center gap-3">
    {/* Removed extra logo from success screen */}

    {/* Congratulations with emoji inline */}
    <h2 className="text-orange-600 font-semibold text-2xl mb-2">
      Congratulations, {formData.firstName} {formData.middleName} {formData.lastName}{" "}
      <span className="align-middle text-2xl">🎉</span>
    </h2>

    <p className="text-gray-600 text-sm">
      Your account has been created successfully.
    </p>
    <p className="text-gray-600 text-sm">
      You can now access your profile and services.
    </p>

    <button
      onClick={onClose}
      className="w-full bg-orange-500 text-white py-3 rounded-lg mt-4 hover:bg-orange-600 transition-colors"
    >
      Back to Home
    </button>
  </div>


          )}
        </div>
      </LocalizationProvider>
    </div>
      
    </div>
   
  );
  
};

export default Register;
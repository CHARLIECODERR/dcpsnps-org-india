import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { ref, get, update } from "firebase/database";
import { getStatesOfIndia, getDistrictsOfState } from "../services/locationApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import dayjs from "dayjs";

/* Maharashtra districts */
const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar","Akola","Amravati","Chhatrapati Sambhajinagar",
  "Beed","Bhandara","Buldhana","Chandrapur","Dhule",
  "Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna",
  "Kolhapur","Latur","Mumbai City","Mumbai Suburban",
  "Nagpur","Nanded","Nandurbar","Nashik","Dharashiv",
  "Palghar","Parbhani","Pune","Raigad","Ratnagiri",
  "Sangli","Satara","Sindhudurg","Solapur","Thane",
  "Wardha","Washim","Yavatmal"
];

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [dobDate, setDobDate] = useState(null);

  const navigate = useNavigate();

  /* Load user */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      const snap = await get(ref(db, "users/" + user.uid));
      if (snap.exists()) {
        setUserData(snap.val());
        if (snap.val().dob) {
          setDobDate(dayjs(snap.val().dob, "DD/MM/YYYY"));
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  /* States */
  useEffect(() => {
    getStatesOfIndia().then(setStates);
  }, []);

  /* Districts */
  useEffect(() => {
    if (!userData?.state) return;

    if (userData.state.toLowerCase() === "maharashtra") {
      setDistricts(
        MAHARASHTRA_DISTRICTS
          .map((d) => ({ name: d }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return;
    }

    const s = states.find((x) => x.name === userData.state);
    if (!s) return;

    getDistrictsOfState(s.iso2).then((data) => {
      setDistricts(
        data
          .map((d) => ({ name: d.name.replace("District", "").trim() }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
  }, [userData?.state, states]);

  if (!userData) return null;

  const muiStyle = {
    mb: 1.5,
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      height: "44px",
    },
  };

  /* Save */
  const handleSave = async () => {
    try {
      const uid = auth.currentUser.uid;
      await update(ref(db, "users/" + uid), {
        mobile: userData.mobile,
        state: userData.state,
        district: userData.district,
        village: userData.village,
      });
      toast.success("Profile updated successfully");
      setEditMode(false);
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9EF] flex justify-center px-3 py-6 pt-24 md:pt-28">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT */}
        <div className="w-full lg:w-1/3 bg-[#E3ECD3] p-6 flex flex-row lg:flex-col items-center gap-4 lg:gap-6 border-b lg:border-b-0 lg:border-r">
          <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-[#6E8F3D] flex items-center justify-center text-white text-3xl lg:text-4xl font-semibold">
            {userData.fullName?.charAt(0).toUpperCase()}
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-base lg:text-lg">
              {userData.fullName}
            </h3>
            <p className="text-sm text-gray-600">User</p>
          </div>

          <button className="hidden lg:block w-full bg-[#8FAF5A] text-white py-2 rounded-lg font-medium">
            Personal Information
          </button>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-2/3 p-5 lg:p-8">
          <h2 className="text-lg lg:text-xl font-semibold mb-5">
            Personal Information
          </h2>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField label="Full Name" value={userData.fullName} disabled fullWidth sx={muiStyle} />
              <TextField label="Email" value={userData.email} disabled fullWidth sx={muiStyle} />

              <TextField
                label="Mobile"
                value={userData.mobile}
                disabled={!editMode}
                onChange={(e) => setUserData({ ...userData, mobile: e.target.value })}
                fullWidth
                sx={muiStyle}
              />

              <DatePicker
                label="Date of Birth"
                value={dobDate}
                disabled
                slotProps={{ textField: { fullWidth: true, sx: muiStyle } }}
              />

              <TextField
                select
                label="State"
                value={userData.state}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({ ...userData, state: e.target.value, district: "" })
                }
                fullWidth
                sx={muiStyle}
              >
                {states.map((s) => (
                  <MenuItem key={s.iso2} value={s.name}>{s.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="District"
                value={userData.district}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({ ...userData, district: e.target.value })
                }
                fullWidth
                sx={muiStyle}
              >
                {districts.map((d) => (
                  <MenuItem key={d.name} value={d.name}>{d.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Village"
                value={userData.village}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({ ...userData, village: e.target.value })
                }
                fullWidth
                sx={muiStyle}
              />
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-[#8FAF5A] hover:bg-[#7C9F4F] text-white px-6 py-2 rounded-lg w-full sm:w-auto"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="bg-[#8FAF5A] hover:bg-[#7C9F4F] text-white px-6 py-2 rounded-lg w-full sm:w-auto"
                >
                  Save Changes
                </button>
              )}

              <button
                onClick={() => navigate(-1)}
                className="border border-gray-400 px-6 py-2 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
              >
                ← Back
              </button>
            </div>
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}
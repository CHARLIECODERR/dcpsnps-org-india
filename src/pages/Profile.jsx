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

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [dobDate, setDobDate] = useState(null);

  const navigate = useNavigate();

  // Load profile
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      const snap = await get(ref(db, "users/" + user.uid));
      if (snap.exists()) {
        const data = snap.val();
        setUserData(data);
        if (data.dob) {
          setDobDate(dayjs(data.dob, "DD/MM/YYYY"));
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  // Load states
  useEffect(() => {
    getStatesOfIndia().then(setStates);
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (userData?.state) {
      const s = states.find((x) => x.name === userData.state);
      if (s) {
        getDistrictsOfState(s.iso2).then(setDistricts);
      }
    }
  }, [userData?.state, states]);

  if (!userData) return null;

  const muiStyle = {
    mb: 1.2,
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      fontSize: "14px",
      height: "44px",
    },
  };

  // SAVE ONLY REQUIRED FIELDS
  const handleSave = async () => {
    try {
      const uid = auth.currentUser.uid;
      await update(ref(db, "users/" + uid), {
        gender: userData.gender,
        dob: userData.dob,
        mobile: userData.mobile,
        state: userData.state,
        district: userData.district,
        village: userData.village,
      });
      toast.success("Profile updated");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow">

        {/* HEADER */}
        <div className="bg-orange-500 text-white p-4 text-center rounded-t-xl">
          <div className="w-16 h-16 bg-white text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
            {userData.fullName?.[0]?.toUpperCase()}
          </div>
          <h2 className="mt-2 font-semibold">{userData.fullName}</h2>
          <p className="text-sm opacity-90">{userData.email}</p>
        </div>

        {/* VIEW MODE */}
        {!editMode && (
          <div className="p-4 text-sm space-y-2">
            <Row label="Gender" value={userData.gender} />
            <Row label="DOB" value={userData.dob} />
            <Row label="Mobile" value={userData.mobile} />
            <Row label="State" value={userData.state} />
            <Row label="District" value={userData.district} />
            <Row label="Village" value={userData.village} />

            <button
              onClick={() => setEditMode(true)}
              className="w-full mt-4 bg-orange-500 text-white py-2 rounded-lg"
            >
              Edit Profile
            </button>

            <button
              onClick={() => navigate(-1)}
              className="w-full mt-2 border border-orange-400 text-orange-600 py-2 rounded-lg"
            >
              ← Go Back
            </button>
          </div>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="p-4">

              {/* Name (disabled) */}
              <TextField
                label="Full Name"
                fullWidth
                sx={muiStyle}
                value={userData.fullName}
                disabled
              />

              {/* Gender */}
              <TextField
  select
  label="Gender"
  fullWidth
  sx={muiStyle}
  value={userData.gender}
  disabled   // 🔒 locked
/>


              {/* DOB */}
              <DatePicker
  label="DOB"
  value={dobDate}
  disabled   // 🔒 locked
  slotProps={{
    textField: { fullWidth: true, sx: muiStyle },
  }}
/>


              {/* Mobile */}
              <TextField
                label="Mobile"
                fullWidth
                sx={muiStyle}
                value={userData.mobile}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    mobile: e.target.value,
                  }))
                }
              />

              {/* State */}
              <TextField
                select
                label="State"
                fullWidth
                sx={muiStyle}
                value={userData.state}
                onChange={async (e) => {
                  const stateName = e.target.value;
                  const s = states.find((x) => x.name === stateName);
                  setUserData((prev) => ({
                    ...prev,
                    state: stateName,
                    district: "",
                  }));
                  if (s) {
                    const d = await getDistrictsOfState(s.iso2);
                    setDistricts(d);
                  }
                }}
              >
                {states.map((s) => (
                  <MenuItem key={s.iso2} value={s.name}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* District */}
              <TextField
                select
                label="District"
                fullWidth
                sx={muiStyle}
                value={userData.district}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    district: e.target.value,
                  }))
                }
              >
                {districts.map((d) => (
                  <MenuItem key={d.name} value={d.name}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Village */}
              <TextField
                label="Village"
                fullWidth
                sx={muiStyle}
                value={userData.village}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    village: e.target.value,
                  }))
                }
              />

              <button
                onClick={handleSave}
                className="w-full bg-orange-500 text-white py-2 rounded-lg mt-2"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditMode(false)}
                className="w-full mt-2 border border-gray-300 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </LocalizationProvider>
        )}
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between border-b py-1">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">{value || "N/A"}</span>
  </div>
);

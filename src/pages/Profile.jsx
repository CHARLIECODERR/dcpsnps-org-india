import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { ref, get, update } from "firebase/database";
import { getStatesOfIndia, getDistrictsOfState } from "../services/locationApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import dayjs from "dayjs";
import { FaCamera } from "react-icons/fa";

import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/* Maharashtra districts */
const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar",
  "Akola",
  "Amravati",
  "Chhatrapati Sambhajinagar",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Dharashiv",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal",
];

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [dobDate, setDobDate] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  /* ✅ Load user profile */
useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (user) => {

    if (!user) {
      navigate("/");
      return;
    }

    try {

      const userRef = ref(db, "users/" + user.uid);

      const snap = await get(userRef);

      let data;

      if (snap.exists()) {

        data = snap.val();

      } else {

        // create entry for very old auth users
        data = {
          email: user.email || "",
          mobile: "",
          state: "",
          district: "",
          village: "",
          photoURL: user.photoURL || "",
          dob: "",
        };

        await update(userRef, data);
      }


      /* ✅ NORMALIZE NAME (supports all old formats) */
      const resolvedName =
        data.fullName ||
        data.name ||
        data.username ||
        user.displayName ||
        (user.email ? user.email.split("@")[0] : "");

      data.fullName = resolvedName;


      setUserData(data);
      setOriginalData(data);


      if (data.dob) {
  const parsed = dayjs(data.dob, "DD/MM/YYYY", true);

  if (parsed.isValid()) {
    setDobDate(parsed);
  }
}

    } catch (err) {

      console.error(err);
      toast.error("Failed to load profile");

    }

  });

  return () => unsub();

}, [navigate]);

  /* Load states */
  useEffect(() => {
    getStatesOfIndia().then(setStates);
  }, []);

  /* Load districts */
  useEffect(() => {
    if (!userData?.state) return;

    if (userData.state.toLowerCase() === "maharashtra") {
      setDistricts(MAHARASHTRA_DISTRICTS.map((d) => ({ name: d })));
      return;
    }

    const stateObj = states.find((s) => s.name === userData.state);

    if (!stateObj) return;

    getDistrictsOfState(stateObj.iso2).then((data) => {
      setDistricts(
        data.map((d) => ({
          name: d.name.replace("District", "").trim(),
        }))
      );
    });
  }, [userData?.state, states]);

  if (!userData) return null;

  const muiStyle = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "#f9faf7",
    },
  };

  /* Save */
  const handleSave = async () => {
  try {
    setSaving(true);

    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    const uid = user.uid;

    let photoURL = userData.photoURL || "";

    // Upload image only if new file selected
    if (imageFile) {
      const storage = getStorage();
      const imageRef = sRef(storage, "profileImages/" + uid);

      await uploadBytes(imageRef, imageFile);
      photoURL = await getDownloadURL(imageRef);
    }

    // ✅ Update ONLY editable fields
    await update(ref(db, "users/" + uid), {
      mobile: userData.mobile || "",
      state: userData.state || "",
      district: userData.district || "",
      village: userData.village || "",
      photoURL,
    });

    // ✅ Update local state properly
    const updatedData = {
      ...originalData,
      mobile: userData.mobile,
      state: userData.state,
      district: userData.district,
      village: userData.village,
      photoURL,
    };

    setUserData(updatedData);
    setOriginalData(updatedData);
    setEditMode(false);
    setImageFile(null);
    setPreview(null);

    toast.success("Profile updated successfully");
  } catch (error) {
    console.error(error);
    toast.error("Update failed");
  } finally {
    setSaving(false);
  }
};

  /* Cancel */
  const handleCancel = () => {
    setUserData(originalData);
    setPreview(null);
    setImageFile(null);
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F8F1] flex justify-center px-4 py-10 pt-24">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT */}
        <div className="lg:w-1/3 bg-[#6E8F3D] p-8 flex flex-col items-center text-center text-white">

          <div className="relative group">
            {preview || userData.photoURL ? (
              <img
                src={preview || userData.photoURL}
                alt="profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-[#6E8F3D] text-5xl font-bold">
                {userData.fullName?.charAt(0)?.toUpperCase()}
              </div>
            )}

            {editMode && (
              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <FaCamera className="text-white text-2xl" />

                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (file) {
                      setImageFile(file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}
          </div>

          {editMode && (
            <button
  onClick={() => {
    setUserData({
      ...userData,
      photoURL: "",
    });

    setPreview(null);
    setImageFile(null);

    toast.info("Profile photo removed");
  }}
  className="text-sm mt-3 text-red-300 hover:text-red-500 underline"
>
  Remove Profile Photo
</button>
          )}

          <h3 className="mt-5 text-xl font-semibold">
            {userData.fullName}
          </h3>

          <p className="text-sm opacity-90">
            User
          </p>
        </div>

        {/* RIGHT */}
        <div className="lg:w-2/3 p-8">

          <h2 className="text-2xl font-semibold mb-6 text-[#6E8F3D]">
            Personal Information
          </h2>

          <LocalizationProvider dateAdapter={AdapterDayjs}>

            <div className="grid md:grid-cols-2 gap-4">

              <TextField
                label="Full Name"
                value={userData.fullName}
                disabled
                fullWidth
                sx={muiStyle}
              />

              <TextField
                label="Email"
                value={userData.email}
                disabled
                fullWidth
                sx={muiStyle}
              />

              <TextField
  label="Mobile"
  value={userData.mobile}
  disabled={!editMode}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ""); // remove non-digits

    // Allow only up to 10 digits
    if (value.length <= 10) {
      setUserData({
        ...userData,
        mobile: value,
      });
    }
  }}
  inputProps={{
    maxLength: 10,
    inputMode: "numeric",
    pattern: "[0-9]*",
  }}
  fullWidth
  sx={muiStyle}
/>
             <DatePicker
  label="Date of Birth"
  value={dobDate}
  disabled
  format="DD/MM/YYYY"
  slotProps={{
    textField: {
      fullWidth: true,
      sx: muiStyle,
    },
  }}
/>

              <TextField
                select
                label="State"
                value={userData.state}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    state: e.target.value,
                    district: "",
                  })
                }
                fullWidth
                sx={muiStyle}
              >

                {states.map((s) => (
                  <MenuItem key={s.iso2} value={s.name}>
                    {s.name}
                  </MenuItem>
                ))}

              </TextField>

              <TextField
                select
                label="District"
                value={userData.district}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    district: e.target.value,
                  })
                }
                fullWidth
                sx={muiStyle}
              >

                {districts.map((d) => (
                  <MenuItem key={d.name} value={d.name}>
                    {d.name}
                  </MenuItem>
                ))}

              </TextField>

              <TextField
                label="Village"
                value={userData.village}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    village: e.target.value,
                  })
                }
                fullWidth
                sx={muiStyle}
              />

            </div>

            <div className="flex gap-4 mt-8">

              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-[#6E8F3D] text-white px-8 py-3 rounded-xl hover:bg-[#5c7a32]"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#6E8F3D] text-white px-8 py-3 rounded-xl hover:bg-[#5c7a32] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}

              <button
                onClick={() => {
                  if (editMode)
                    handleCancel();
                  else
                    navigate("/");
                }}
                className="border border-gray-300 px-8 py-3 rounded-xl hover:bg-gray-100"
              >
                {editMode ? "Cancel" : "Back"}
              </button>

            </div>

          </LocalizationProvider>

        </div>

      </div>
    </div>
  );
}
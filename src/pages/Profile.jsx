import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { ref, get, update } from "firebase/database";
import { getStatesOfIndia, getDistrictsOfState } from "../services/locationApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import dayjs from "dayjs";
import { FaCamera } from "react-icons/fa";

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
  const [originalData, setOriginalData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [dobDate, setDobDate] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  /* Load User */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      const snap = await get(ref(db, "users/" + user.uid));
      if (snap.exists()) {
        setUserData(snap.val());
        setOriginalData(snap.val());

        if (snap.val().dob) {
          setDobDate(dayjs(snap.val().dob, "DD/MM/YYYY"));
        }
      }
    });

    return () => unsub();
  }, [navigate]);

  /* Load States */
  useEffect(() => {
    getStatesOfIndia().then(setStates);
  }, []);

  /* Load Districts based on state */
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
      const uid = auth.currentUser.uid;
      let photoURL = userData.photoURL || "";

      if (imageFile) {
        const storage = getStorage();
        const imageRef = sRef(storage, "profileImages/" + uid);
        await uploadBytes(imageRef, imageFile);
        photoURL = await getDownloadURL(imageRef);
      }

      await update(ref(db, "users/" + uid), {
        mobile: userData.mobile,
        state: userData.state,
        district: userData.district,
        village: userData.village,
        photoURL,
      });

      const updatedData = { ...userData, photoURL };
      setUserData(updatedData);
      setOriginalData(updatedData);
      setEditMode(false);
      setImageFile(null);
      setPreview(null);

      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* Cancel Edit */
  const handleCancel = () => {
    setUserData(originalData);
    setPreview(null);
    setImageFile(null);
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F8F1] flex justify-center px-4 py-10 pt-24">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT PANEL */}
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
                {userData.fullName?.charAt(0).toUpperCase()}
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
                setUserData({ ...userData, photoURL: "" });
                setPreview(null);
                setImageFile(null);
              }}
              className="text-sm mt-3 underline"
            >
              Remove Profile Photo
            </button>
          )}

          <h3 className="mt-5 text-xl font-semibold">
            {userData.fullName}
          </h3>
          <p className="text-sm opacity-90">User</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:w-2/3 p-8">
          <h2 className="text-2xl font-semibold mb-6 text-[#6E8F3D]">
            Personal Information
          </h2>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid md:grid-cols-2 gap-4">

              <TextField label="Full Name" value={userData.fullName} disabled fullWidth sx={muiStyle} />
              <TextField label="Email" value={userData.email} disabled fullWidth sx={muiStyle} />

              <TextField
                label="Mobile"
                value={userData.mobile}
                disabled={!editMode}
                onChange={(e) =>
                  setUserData({ ...userData, mobile: e.target.value })
                }
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
                  setUserData({ ...userData, district: e.target.value })
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
                  setUserData({ ...userData, village: e.target.value })
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
                  if (editMode) {
                    handleCancel();
                  } else {
                    navigate("/");
                  }
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
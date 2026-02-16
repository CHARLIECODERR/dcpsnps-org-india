import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { ref, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBirthdayCake,
  FaMapMarkerAlt,
  FaPhone,
  FaVenusMars,
  FaEnvelope,
  FaEdit,
  FaSave,
} from "react-icons/fa";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      const snapshot = await get(ref(db, "users/" + user.uid));
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleSave = async () => {
    const user = auth.currentUser;
    await update(ref(db, "users/" + user.uid), userData);
    setEditMode(false);
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen pt-24 bg-gray-100 flex justify-center">
      <div className="w-full max-w-xl bg-white p-6 rounded-xl shadow-md">

        <h1 className="text-2xl font-bold text-center mb-6 text-orange-600">
          User Profile
        </h1>

        <ProfileField icon={<FaUser />} label="Full Name">
          <input
            disabled={!editMode}
            value={userData.fullName || ""}
            onChange={(e) =>
              setUserData({ ...userData, fullName: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaVenusMars />} label="Gender">
          <input
            disabled={!editMode}
            value={userData.gender || ""}
            onChange={(e) =>
              setUserData({ ...userData, gender: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaBirthdayCake />} label="DOB">
          <input
            disabled={!editMode}
            value={userData.dob || ""}
            onChange={(e) =>
              setUserData({ ...userData, dob: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaMapMarkerAlt />} label="State">
          <input
            disabled={!editMode}
            value={userData.state || ""}
            onChange={(e) =>
              setUserData({ ...userData, state: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaMapMarkerAlt />} label="District">
          <input
            disabled={!editMode}
            value={userData.district || ""}
            onChange={(e) =>
              setUserData({ ...userData, district: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaMapMarkerAlt />} label="Village">
          <input
            disabled={!editMode}
            value={userData.village || ""}
            onChange={(e) =>
              setUserData({ ...userData, village: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaPhone />} label="Mobile">
          <input
            disabled={!editMode}
            value={userData.mobile || ""}
            onChange={(e) =>
              setUserData({ ...userData, mobile: e.target.value })
            }
            className={inputStyle(editMode)}
          />
        </ProfileField>

        <ProfileField icon={<FaEnvelope />} label="Email">
          <input
            disabled
            value={auth.currentUser.email}
            className="w-full bg-gray-100 px-3 py-1 rounded"
          />
        </ProfileField>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <FaEdit /> Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <FaSave /> Save Changes
            </button>
          )}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-4 w-full text-orange-600 border border-orange-400 py-2 rounded-lg"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}

const ProfileField = ({ icon, label, children }) => (
  <div className="flex items-center border-b py-2 gap-2">
    <span className="text-orange-500">{icon}</span>
    <span className="w-28 font-medium">{label}:</span>
    <div className="flex-1">{children}</div>
  </div>
);

const inputStyle = (editMode) =>
  `w-full px-3 py-1 rounded ${
    editMode
      ? "border border-orange-300 bg-white"
      : "bg-gray-100 border-none"
  }`;

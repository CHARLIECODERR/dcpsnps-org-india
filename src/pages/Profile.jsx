import { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBirthdayCake,
  FaMapMarkerAlt,
  FaPhone,
  FaVenusMars,
  FaEnvelope,
} from "react-icons/fa";

export default function Profile() {
  const [userData, setUserData] = useState(null);
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

  if (!userData) return null;

  return (
    <div className="min-h-screen pt-24 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">

        <h1 className="text-2xl font-bold text-center mb-6">
          User Profile
        </h1>

        <ProfileField icon={<FaUser />} label="Full Name" value={userData.fullName} />
        <ProfileField icon={<FaVenusMars />} label="Gender" value={userData.gender} />
        <ProfileField icon={<FaBirthdayCake />} label="Date of Birth" value={userData.dob} />

        <ProfileField
          icon={<FaMapMarkerAlt />}
          label="Village"
          value={userData.address?.village}
        />
        <ProfileField
          icon={<FaMapMarkerAlt />}
          label="District"
          value={userData.address?.district}
        />
        <ProfileField
          icon={<FaMapMarkerAlt />}
          label="State"
          value={userData.address?.state}
        />

        <ProfileField icon={<FaPhone />} label="Mobile" value={userData.phone} />
        <ProfileField
          icon={<FaEnvelope />}
          label="Email"
          value={auth.currentUser.email}
        />
      </div>
    </div>
  );
}

const ProfileField = ({ icon, label, value }) => (
  <div className="flex items-center border-b py-2">
    <span className="mr-3 text-gray-600">{icon}</span>
    <span className="font-medium w-32">{label}:</span>
    <span className="text-gray-700">{value || "N/A"}</span>
  </div>
);

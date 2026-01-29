import { useState } from "react";
import LoginModal from "./Login.jsx";
import Register from "./Register.jsx";
import ForgotPassword from "./ForgotPassword.jsx";

const ModalManager = ({ onClose }) => {
  const [activeModal, setActiveModal] = useState("login");

  const handleClose = () => {
    setActiveModal("login");
    onClose?.();
  };

  return (
    <>
      {activeModal === "login" && (
        <LoginModal
          onClose={handleClose}
          onSwitchToRegister={() => setActiveModal("register")}
          onSwitchToForgot={() => setActiveModal("forgot")}
        />
      )}

      {activeModal === "register" && (
        <Register
          onClose={handleClose}
          onSwitchToLogin={() => setActiveModal("login")}
        />
      )}

      {activeModal === "forgot" && (
        <ForgotPassword
          onClose={handleClose}
          onSwitchToLogin={() => setActiveModal("login")}
        />
      )}
    </>
  );
};

export default ModalManager;

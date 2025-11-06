import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";
import "./App.css";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleRoleSelect = (role) => {
    if (role === "Seller") navigate("/seller");
    if (role === "User") navigate("/user");
  };

  if (showSplash) {
    return (
      <div className="splash-screen">
        <img src={logo} className="logo" alt="Derm Doc logo" />
      </div>
    );
  }

  return (
    <div className="login-page-container">
      <div className="login-box">
        <h1 className="catchy-text">Get in as!</h1>
        <div className="button-container">
          <button
            className="role-button user-button"
            onClick={() => handleRoleSelect("User")}
          >
            User
          </button>
          <button
            className="role-button seller-button"
            onClick={() => handleRoleSelect("Seller")}
          >
            Seller
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

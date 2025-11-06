import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import BackButton from "./components/BackButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faBars, faTimes, faUser, faCamera, faUpload, faArrowLeft, faSave, faEdit, faTrash, faSearch } from "@fortawesome/free-solid-svg-icons";
function SellerLog() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    business_license_id: "", // Use this
    seller_phno: "" // And this
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false); // new state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed");
      } else {
        setSuccess("Signup successful! Redirecting to login...");
        setTimeout(() => navigate("/seller-login"), 1500);
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="login-page-container">
      <BackButton />

      <div className="login-box">
        <h2 className="catchy-text">Seller Signup</h2>

        <form className="form-container" onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Seller Name" value={formData.name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />

          {/* Password input with toggle */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer"
              }}
            >
            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </span>
          </div>
<input type="text" name="business_license_id" placeholder="Business License ID" value={formData.business_license_id} onChange={handleChange} required />
<input type="tel" name="seller_phno" placeholder="Phone Number" value={formData.seller_phno} onChange={handleChange} required />

          <button type="submit" className="signup-button">Sign Up</button>

          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
          {success && <p style={{ color: "green", textAlign: "center" }}>{success}</p>}
        </form>

        <p className="switch-text">
          Already have an account?{" "}
          <span className="link-text" onClick={() => navigate("/seller-login")}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

export default SellerLog;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css"; // Assuming App.css contains relevant styling for login
import BackButton from "./components/BackButton"; // Assuming you have this component
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faBars, faTimes, faUser, faCamera, faUpload, faArrowLeft, faSave, faEdit, faTrash, faSearch } from "@fortawesome/free-solid-svg-icons";
function SellerLog2() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Changed the URL to localhost:5000 for consistency and local development best practice
      const response = await fetch("http://localhost:5000/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
      } else {
        // ✅ flag user as logged in (e.g., in local storage, though a real app would use a token)
        localStorage.setItem("sellerLoggedIn", "true");
        // Store seller_id, name, and email if needed for frontend display/further requests
        localStorage.setItem("sellerId", data.seller.seller_id); 
        localStorage.setItem("sellerName", data.seller.name);
        localStorage.setItem("sellerEmail", data.seller.email);

        // ✅ redirect to dashboard
        navigate("/seller-dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server error. Please try again. Ensure the backend is running on port 5000.");
    }
  };

  return (
    <div className="login-page-container relative">
      <div className="absolute top-4 left-4">
        <BackButton />
      </div>

      <div className="login-box">
        <h2 className="catchy-text">Seller Login</h2>

        <form className="form-container" onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={loginData.email}
            onChange={handleChange}
            required
          />

          {/* Password input with eye toggle */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleChange}
              required
              style={{ width: "100%", paddingRight: "2.5rem" }} // leave space for eye icon
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "1.2rem"
              }}
            >
             <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </span>
          </div>

          <button type="submit" className="signup-button">Log In</button>

          <p
            style={{ marginTop: "0.8rem", textAlign: "center", fontSize: "0.9rem", cursor: "pointer" }}
            onClick={() => alert("Reset password flow coming soon!")}
          >
            Forgot Password?
          </p>

          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default SellerLog2;

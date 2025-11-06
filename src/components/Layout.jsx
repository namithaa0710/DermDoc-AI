import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Layout.css";
import logo from "./assets/logo_cut.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser } from "@fortawesome/free-solid-svg-icons";

function Layout({ children }) {
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({ name: "", email: "" });

  useEffect(() => {
    async function fetchSeller() {
      try {
        const res = await fetch("http://192.168.1.100:5000/current-seller");
        const data = await res.json();
        setSellerInfo({ name: data.name, email: data.email });
      } catch (err) {
        console.error("Failed to fetch seller info", err);
      }
    }
    fetchSeller();
  }, []);

  const handleLogout = () => {
    navigate("/seller-log");
  };

  return (
    <div className="layout-container">
      <div className="taskbar">
        {/* Mobile-only Hamburger Menu */}
        <button
          className="mobile-menu-btn"
          onClick={() => setAccountOpen(!accountOpen)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        {/* Logo */}
        <img src={logo} alt="Logo" className="taskbar-logo" />

        {/* Search Bar */}
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products"
            className="search-input"
          />
        </div>

        {/* Page Navigation */}
        <div className="nav-icons">
          <span onClick={() => navigate("/upload-product")}>
            Upload Product
          </span>
          <span onClick={() => navigate("/rejected-products")}>
            Rejected Product
          </span>
          <span onClick={() => navigate("/accepted-products")}>
            Accepted Product
          </span>
        </div>

        {/* Account Button - visible only on desktop */}
        <div className="account-container">
          <button
            className="account-btn"
            onClick={() => setAccountOpen(!accountOpen)}
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
        </div>
      </div>

      {/* The single, universal dropdown menu */}
      {accountOpen && (
        <div className="account-dropdown">
          <p>
            <strong>{sellerInfo.name}</strong>
          </p>
          <p>{sellerInfo.email}</p>
          <button onClick={() => navigate("/more")}>Account Details</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}

      {/* Main content will be rendered here */}
      <div className="main-content">{children}</div>
    </div>
  );
}

export default Layout;
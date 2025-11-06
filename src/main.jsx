import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./0_App.jsx";
import SellerLog from "./1_Seller_log.jsx";
import SellerLog2 from "./1_Seller_log2.jsx";
import SellerDashboard from "./3_SellerDashboard.jsx";   // ⬅️ Import Dashboard
import User from "./4_User.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/seller" element={<SellerLog />} />
        <Route path="/seller-login" element={<SellerLog2 />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} /> {/* ⬅️ Dashboard route */}
        <Route path="/user" element={<User />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

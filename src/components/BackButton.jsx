import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: "fixed",
        top: "12px",
        left: "12px",
        width: "40px",            // square width
        height: "40px",           // square height
        backgroundColor: "#e5e5e5",
        color: "#000",
        borderRadius: "10px",     // blunt edges
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        cursor: "pointer",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
      }}
    >
      ←
    </button>
  );
}

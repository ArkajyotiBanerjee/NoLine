import { useState } from "react";
import { createUserProfile } from "../services/profile";

function UserSetup({ uid, onComplete }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    city: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserProfile(uid, formData);
      onComplete();
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#f5f6f8",
    fontFamily: "Arial, sans-serif",
    padding: "30px 0 30px 0",
    width: "100%",
    boxSizing: "border-box"
  };

  const cardStyle = {
    backgroundColor: "white",
    padding: "40px 24px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
    width: "100%",
    textAlign: "left"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#374151",
    fontWeight: "600",
    textAlign: "left",
    fontSize: "14px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    marginBottom: "20px",
    boxSizing: "border-box",
    transition: "border-color 0.3s, box-shadow 0.3s",
    backgroundColor: "#ffffff"
  };

  const selectStyle = {
    ...inputStyle,
    marginBottom: "25px"
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    backgroundColor: loading ? "#9ca3af" : "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "background-color 0.3s, transform 0.2s",
    fontWeight: "bold"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginBottom: "30px", color: "#0f172a", fontSize: "24px", fontWeight: "bold" }}>Complete Your Profile</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0f172a";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0f172a";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              style={selectStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0f172a";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#0f172a";
                e.target.style.borderColor = "#0f172a";
                e.target.style.boxShadow = "0 0 0 3px rgba(15, 23, 42, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = "#1e293b")}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = "#0f172a")}
          >
            {loading ? "Creating Profile..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserSetup;
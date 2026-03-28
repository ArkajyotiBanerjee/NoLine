import { useState, useEffect } from "react";
import { createQueue } from "../services/admin";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

function CreateQueue({ onQueueCreated, onBack }) {
  const [queueName, setQueueName] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminCity, setAdminCity] = useState("");
  const [user, setUser] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Misc");
  const [mapLink, setMapLink] = useState("");

  // 🔥 FETCH USER + ADMIN CITY
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      setUser(currentUser);

      try {
        const adminRef = doc(db, "admins", currentUser.uid);
        const snapshot = await getDoc(adminRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log("Admin city:", data.city);
          setAdminCity(data.city);
        }
      } catch (error) {
        console.error("Error fetching admin city:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!queueName.trim()) return;

    if (!adminCity) {
      alert("Please wait, loading your profile...");
      return;
    }

    if (!user) {
      alert("User not logged in");
      return;
    }

    setLoading(true);

    try {
      console.log("Creating queue for:", user.uid);
      console.log("Using city:", adminCity);

      await createQueue(
        user.uid,
        queueName.trim(),
        adminCity,
        businessName.trim(),
        category,
        mapLink.trim()
      );

      alert("Queue created successfully!");
      setQueueName("");
      setBusinessName("");
      setCategory("Misc");
      setMapLink("");

      if (onQueueCreated) onQueueCreated();

    } catch (error) {
      console.error("Error creating queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    fontSize: "14px",
    fontFamily: "var(--font)",
    border: "1.5px solid #e2e8f0",
    borderRadius: "9px",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  };

  const fieldGroupStyle = {
    marginBottom: "18px"
  };

  return (
    <div style={{ fontFamily: "var(--font)" }}>

      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            color: "#64748b", fontSize: "13px", fontWeight: "500",
            padding: "0", marginBottom: "14px",
            transition: "color 0.15s", fontFamily: "var(--font)"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "#0f172a"}
          onMouseOut={(e) => e.currentTarget.style.color = "#64748b"}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{
          fontSize: "22px", fontWeight: "800", color: "#0f172a",
          marginBottom: "4px", letterSpacing: "-0.3px"
        }}>
          Create New Queue
        </h1>
        <p style={{ color: "#64748b", fontSize: "13px" }}>
          Fill in the details below to create a new queue in {adminCity || "your city"}
        </p>
      </div>

      {/* Form Card */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        maxWidth: "560px"
      }}>
        <form onSubmit={handleSubmit}>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Queue Name *</label>
            <input
              type="text"
              placeholder="e.g. Morning OPD Queue"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                e.target.style.backgroundColor = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "#f8fafc";
              }}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Business Name</label>
            <input
              type="text"
              placeholder="e.g. City General Hospital"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                e.target.style.backgroundColor = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "#f8fafc";
              }}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                e.target.style.backgroundColor = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "#f8fafc";
              }}
            >
              <option value="Hospital">🏥 Hospital</option>
              <option value="Restaurant">🍽️ Restaurant</option>
              <option value="Government">🏛️ Government</option>
              <option value="Public Place">🏙️ Public Place</option>
              <option value="Misc">📌 Misc</option>
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Google Maps Link</label>
            <input
              type="text"
              placeholder="https://maps.google.com/..."
              value={mapLink}
              onChange={(e) => setMapLink(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
                e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                e.target.style.backgroundColor = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "#f8fafc";
              }}
            />
          </div>

          {/* City Info (read-only) */}
          {adminCity && (
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "9px",
              padding: "10px 14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ fontSize: "14px" }}>📍</span>
              <p style={{ fontSize: "13px", color: "#166534" }}>
                Queue will be created in <strong>{adminCity}</strong>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !queueName.trim()}
            style={{
              width: "100%",
              padding: "13px",
              fontSize: "14px",
              fontWeight: "600",
              fontFamily: "var(--font)",
              backgroundColor: loading || !queueName.trim() ? "#e2e8f0" : "#6366f1",
              color: loading || !queueName.trim() ? "#94a3b8" : "white",
              border: "none",
              borderRadius: "10px",
              cursor: loading || !queueName.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading || !queueName.trim() ? "none" : "0 2px 8px rgba(99,102,241,0.3)"
            }}
            onMouseOver={(e) => {
              if (!loading && queueName.trim()) {
                e.currentTarget.style.backgroundColor = "#4f46e5";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading && queueName.trim()) {
                e.currentTarget.style.backgroundColor = "#6366f1";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "Creating Queue..." : "Create Queue →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateQueue;
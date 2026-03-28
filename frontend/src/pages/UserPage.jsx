import { useState, useEffect } from "react";
import { joinQueue } from "../services/token";
import { db } from "../services/firebase";
import { onSnapshot, doc } from "firebase/firestore";

function UserPage() {
  const [name, setName] = useState("");
  const [token, setToken] = useState(null);
  const [position, setPosition] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsubscribe;

    if (token !== null) {
      const queueRef = doc(db, "queues", "queue1");

      unsubscribe = onSnapshot(queueRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const pos = Math.max(0, token - data.current_token);
          const et = pos * data.avg_service_time;

          setPosition(pos);
          setEta(et);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token]);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const tokenNum = await joinQueue("queue1", name);
      setToken(tokenNum);
    } catch (error) {
      console.error("Error joining queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (position === 1) return "🔔 It's your turn!";
    if (position <= 2) return "⚡ Get ready, you're next!";
    return null;
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        maxWidth: "400px",
        width: "100%",
        textAlign: "center"
      }}>
        <h1 style={{ marginBottom: "30px", color: "#333" }}>NoLine Queue System</h1>

        {!token ? (
          <div>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "2px solid #ddd",
                borderRadius: "6px",
                marginBottom: "20px",
                boxSizing: "border-box"
              }}
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim() || loading}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                backgroundColor: loading ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.3s"
              }}
            >
              {loading ? "Joining..." : "Join Queue"}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ color: "#28a745", margin: "10px 0" }}>Token: {token}</h2>
              <h3 style={{ color: "#333", margin: "10px 0" }}>Position: {position}</h3>
              <h3 style={{ color: "#333", margin: "10px 0" }}>Estimated Wait: {eta} mins</h3>
              {getStatusMessage() && (
                <p style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: position === 1 ? "#dc3545" : "#ffc107",
                  margin: "20px 0"
                }}>
                  {getStatusMessage()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPage;
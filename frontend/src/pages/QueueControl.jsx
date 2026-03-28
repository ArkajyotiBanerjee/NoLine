import { useState, useEffect } from "react";
import { serveNext, togglePause, setAnnouncement, endQueue, toggleAccepting } from "../services/admin";
import { db } from "../services/firebase";
import { onSnapshot, doc, collection, updateDoc } from "firebase/firestore";

function QueueControl({ queue, goBack }) {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  // ✅ NEW: Announcement local state
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  useEffect(() => {
    const queueRef = doc(db, "queues", queue.id);

    const unsubscribe = onSnapshot(queueRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        console.log("LIVE DATA:", data); // 🔥 debug

        setQueueData({
          id: docSnap.id,
          ...data,
          isPaused: Boolean(data.isPaused), // ✅ FORCE BOOLEAN
        });
        // Sync announcement text input with Firestore value
        setAnnouncementText(data.announcement || "");
      }
    });

    return () => unsubscribe();
  }, [queue.id]);

  useEffect(() => {
    if (!queue?.id) return;

    const tokensRef = collection(db, "queues", queue.id, "tokens");

    const unsubscribe = onSnapshot(tokensRef, (snapshot) => {
      const tokenList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // sort by token number
      tokenList.sort((a, b) => a.tokenNumber - b.tokenNumber);

      setTokens(tokenList);
    });

    return () => unsubscribe();
  }, [queue.id]);

  const handleServeNext = async () => {
    setLoading(true);
    try {
      const enteredPin = prompt("Enter customer PIN");

      if (!enteredPin) {
        setLoading(false);
        return;
      }

      // find matching arrived user
      const matchedToken = tokens.find(
        (t) =>
          t.status === "arrived" &&
          String(t.pin) === String(enteredPin)
      );

      if (!matchedToken) {
        alert("Invalid PIN or user not arrived");
        setLoading(false);
        return;
      }

      const tokenRef = doc(
        db,
        "queues",
        queue.id,
        "tokens",
        matchedToken.id
      );

      // mark verified
      await updateDoc(tokenRef, {
        status: "completed",
        verified: true
      });

      // move queue forward
      await serveNext(queue.id);

    } catch (error) {
      console.error("Error verifying PIN:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePause = async () => {
    try {
      await togglePause(queue.id);
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  // ✅ NEW: Save announcement
  const handleSaveAnnouncement = async () => {
    setAnnouncementSaving(true);
    try {
      await setAnnouncement(queue.id, announcementText.trim());
    } catch (error) {
      console.error("Error saving announcement:", error);
    } finally {
      setAnnouncementSaving(false);
    }
  };

  // ✅ NEW: End queue with confirmation
  const handleEndQueue = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to END this queue? This cannot be undone and users will be notified."
    );
    if (!confirmed) return;
    try {
      await endQueue(queue.id);
    } catch (error) {
      console.error("Error ending queue:", error);
    }
  };

  // ✅ NEW: Toggle accepting new users
  const handleToggleAccepting = async () => {
    try {
      const current = queueData.isAccepting ?? true;
      await toggleAccepting(queue.id, current);
    } catch (error) {
      console.error("Error toggling accepting:", error);
    }
  };

  if (!queueData) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "300px", gap: "12px"
      }}>
        <div style={{
          width: "20px", height: "20px",
          border: "2px solid #e2e8f0",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite"
        }} />
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading queue...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const arrivedCount = tokens.filter(t => t.status === "arrived").length;
  const waitingCount = tokens.filter(t => t.status === "waiting").length;

  return (
    <div style={{ fontFamily: "var(--font)" }}>

      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={goBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
            color: "#64748b", fontSize: "13px", fontWeight: "500",
            padding: "0", marginBottom: "14px",
            transition: "color 0.15s"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "#0f172a"}
          onMouseOut={(e) => e.currentTarget.style.color = "#64748b"}
        >
          ← Back to Dashboard
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{
              fontSize: "22px", fontWeight: "800", color: "#0f172a",
              marginBottom: "3px", letterSpacing: "-0.3px"
            }}>
              {queue.name}
            </h1>
            <p style={{ color: "#64748b", fontSize: "13px" }}>
              {queue.businessName || "Queue Management"} • Live Control Panel
            </p>
          </div>
          <span style={{
            fontSize: "11px", fontWeight: "700",
            padding: "5px 12px",
            borderRadius: "999px",
            backgroundColor: queueData.isPaused ? "#fef3c7" : "#d1fae5",
            color: queueData.isPaused ? "#92400e" : "#065f46",
            border: `1px solid ${queueData.isPaused ? "#fbbf24" : "#6ee7b7"}`
          }}>
            {queueData.isPaused ? "⏸ PAUSED" : "● ACTIVE"}
          </span>
        </div>
      </div>

      {/* Top Stats Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "14px",
        marginBottom: "24px"
      }}>
        {[
          {
            label: "Current Token",
            value: `#${queueData.current_token || 0}`,
            icon: "🎫",
            color: "#6366f1",
            bg: "#eef2ff"
          },
          {
            label: "Waiting",
            value: waitingCount,
            icon: "⏱",
            color: "#d97706",
            bg: "#fef3c7"
          },
          {
            label: "Arrived",
            value: arrivedCount,
            icon: "✅",
            color: "#059669",
            bg: "#d1fae5"
          },
          {
            label: "Total in Queue",
            value: tokens.length,
            icon: "👥",
            color: "#475569",
            bg: "#f1f5f9"
          },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              width: "38px", height: "38px",
              backgroundColor: stat.bg,
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "22px",
        marginBottom: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" }}>
          Queue Actions
        </h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleServeNext}
            disabled={loading || queueData.isPaused}
            style={{
              flex: 1,
              minWidth: "160px",
              padding: "13px 20px",
              fontSize: "14px",
              fontWeight: "600",
              backgroundColor: loading || queueData.isPaused ? "#e2e8f0" : "#0f172a",
              color: loading || queueData.isPaused ? "#94a3b8" : "white",
              border: "none",
              borderRadius: "10px",
              cursor: loading || queueData.isPaused ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}
            onMouseOver={(e) => {
              if (!loading && !queueData.isPaused) {
                e.currentTarget.style.backgroundColor = "#1e293b";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading && !queueData.isPaused) {
                e.currentTarget.style.backgroundColor = "#0f172a";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <span>{loading ? "⏳" : "✓"}</span>
            {loading ? "Verifying..." : "Verify & Serve Next"}
          </button>

          <button
            onClick={handleTogglePause}
            style={{
              flex: 1,
              minWidth: "140px",
              padding: "13px 20px",
              fontSize: "14px",
              fontWeight: "600",
              backgroundColor: queueData.isPaused ? "#d1fae5" : "#fef3c7",
              color: queueData.isPaused ? "#065f46" : "#92400e",
              border: `1px solid ${queueData.isPaused ? "#6ee7b7" : "#fbbf24"}`,
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {queueData.isPaused ? "▶ Resume Queue" : "⏸ Pause Queue"}
          </button>
        </div>
      </div>

      {/* ✅ NEW: Announcement Panel */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "22px",
        marginBottom: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "16px" }}>📢</span>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
            Queue Announcement
          </h3>
          {queueData.announcement && (
            <span style={{
              fontSize: "10px", fontWeight: "700",
              backgroundColor: "#fef3c7", color: "#92400e",
              padding: "2px 8px", borderRadius: "999px"
            }}>LIVE</span>
          )}
        </div>
        <textarea
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          placeholder="Type an announcement for waiting users... (e.g. Please carry ID proof)"
          maxLength={200}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "13px",
            fontFamily: "var(--font)",
            border: "1.5px solid #e2e8f0",
            borderRadius: "9px",
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: "10px",
            lineHeight: "1.5"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#6366f1";
            e.target.style.backgroundColor = "#fff";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.backgroundColor = "#f8fafc";
          }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSaveAnnouncement}
            disabled={announcementSaving}
            style={{
              padding: "9px 18px",
              fontSize: "13px", fontWeight: "600",
              backgroundColor: announcementSaving ? "#e2e8f0" : "#6366f1",
              color: announcementSaving ? "#94a3b8" : "white",
              border: "none", borderRadius: "8px",
              cursor: announcementSaving ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => { if (!announcementSaving) e.currentTarget.style.backgroundColor = "#4f46e5"; }}
            onMouseOut={(e) => { if (!announcementSaving) e.currentTarget.style.backgroundColor = "#6366f1"; }}
          >
            {announcementSaving ? "Saving..." : "📢 Post Announcement"}
          </button>
          {announcementText && (
            <button
              onClick={() => { setAnnouncementText(""); setAnnouncement(queue.id, ""); }}
              style={{
                padding: "9px 14px",
                fontSize: "13px", fontWeight: "500",
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#dc2626"}
              onMouseOut={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              Clear
            </button>
          )}
        </div>
        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
          {announcementText.length}/200 characters — shown to all users in this queue
        </p>
      </div>

      {/* ✅ NEW: Queue Control Settings */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "22px",
        marginBottom: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" }}>
          Queue Settings
        </h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>

          {/* Stop / Allow Accepting */}
          <button
            onClick={handleToggleAccepting}
            style={{
              padding: "11px 18px",
              fontSize: "13px", fontWeight: "600",
              backgroundColor: (queueData.isAccepting ?? true) ? "#fff7ed" : "#f0fdf4",
              color: (queueData.isAccepting ?? true) ? "#c2410c" : "#15803d",
              border: `1px solid ${(queueData.isAccepting ?? true) ? "#fdba74" : "#86efac"}`,
              borderRadius: "9px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            {(queueData.isAccepting ?? true) ? "🚫 Stop Accepting Users" : "✅ Allow New Users"}
          </button>

          {/* End Queue */}
          {!queueData.isEnded ? (
            <button
              onClick={handleEndQueue}
              style={{
                padding: "11px 18px",
                fontSize: "13px", fontWeight: "600",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: "9px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              🔚 End Queue
            </button>
          ) : (
            <div style={{
              padding: "11px 18px",
              fontSize: "13px", fontWeight: "600",
              backgroundColor: "#f1f5f9",
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
              borderRadius: "9px"
            }}>
              ✓ Queue Ended
            </div>
          )}
        </div>
      </div>

      {/* Queue Members */}
      <div style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "18px"
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
            Queue Members
          </h3>
          <span style={{
            fontSize: "12px", color: "#64748b",
            backgroundColor: "#f1f5f9",
            padding: "3px 10px", borderRadius: "999px"
          }}>
            {tokens.length} total
          </span>
        </div>

        {tokens.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🪑</div>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>No users in queue yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {tokens.map((t) => {
              const isArrived = t.status === "arrived";
              const isCompleted = t.status === "completed";
              return (
                <div key={t.id} style={{
                  border: `1px solid ${isArrived ? "#6ee7b7" : isCompleted ? "#e2e8f0" : "#e2e8f0"}`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  backgroundColor: isArrived ? "#f0fdf4" : isCompleted ? "#f8fafc" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "38px", height: "38px",
                      backgroundColor: isArrived ? "#d1fae5" : "#f1f5f9",
                      borderRadius: "9px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: "800",
                      color: isArrived ? "#059669" : "#64748b",
                      flexShrink: 0
                    }}>
                      #{t.tokenNumber}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                        {t.name}
                      </p>
                      {isArrived && t.arrivedAt && (
                        <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Arrived at {new Date(t.arrivedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: "600",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor:
                        isArrived ? "#d1fae5" :
                        isCompleted ? "#f1f5f9" : "#fef3c7",
                      color:
                        isArrived ? "#065f46" :
                        isCompleted ? "#94a3b8" : "#92400e"
                    }}>
                      {isArrived ? "✓ Arrived" : isCompleted ? "Completed" : "Waiting"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueueControl;
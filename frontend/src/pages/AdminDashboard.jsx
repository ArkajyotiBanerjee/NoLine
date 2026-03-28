import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { getAdminQueues } from "../services/admin";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function AdminDashboardComponent({ onOpenQueue, onCreateQueue }, ref) {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueues = useCallback(async (uid) => {
    if (!uid) {
      console.log("UID not ready yet");
      return;
    }

    try {
      const adminQueues = await getAdminQueues(uid);
      console.log("Fetched queues:", adminQueues); // 🔥 debug
      setQueues(adminQueues);
    } catch (error) {
      console.error("Error loading queues:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User UID:", user.uid); // 🔥 debug
        loadQueues(user.uid);
      }
    });

    return () => unsubscribe();
  }, [loadQueues]);

  // Expose refreshQueues method
  useImperativeHandle(ref, () => ({
    refreshQueues: async () => {
      const user = getAuth().currentUser;
      if (user) {
        await loadQueues(user.uid);
      }
    }
  }));

  if (loading) {
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
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading queues...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font)" }}>

      {/* Page Header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "4px",
            letterSpacing: "-0.4px"
          }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Manage your queues and monitor activity
          </p>
        </div>

        <button
          onClick={onCreateQueue}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#4f46e5";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.45)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#6366f1";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "16px" }}>+</span>
          Create New Queue
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "28px"
      }}>
        {[
          { label: "Total Queues", value: queues.length, icon: "◈", color: "#6366f1", bg: "#eef2ff" },
          { label: "Active Queues", value: queues.filter(q => !q.isPaused).length, icon: "●", color: "#059669", bg: "#d1fae5" },
          { label: "Paused Queues", value: queues.filter(q => q.isPaused).length, icon: "⏸", color: "#d97706", bg: "#fef3c7" },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
          }}>
            <div style={{
              width: "40px", height: "40px",
              backgroundColor: stat.bg,
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: stat.color,
              flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Queue Grid / Empty State */}
      {queues.length === 0 ? (
        <div style={{
          backgroundColor: "white",
          border: "2px dashed #e2e8f0",
          borderRadius: "14px",
          padding: "60px 24px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📋</div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>
            No queues yet
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
            Create your first queue to get started serving customers
          </p>
          <button
            onClick={onCreateQueue}
            style={{
              padding: "10px 24px",
              fontSize: "14px", fontWeight: "600",
              backgroundColor: "#6366f1", color: "white",
              border: "none", borderRadius: "8px", cursor: "pointer"
            }}
          >
            Create New Queue
          </button>
        </div>
      ) : (
        <div>
          <p style={{
            fontSize: "12px", fontWeight: "600", color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.6px",
            marginBottom: "14px"
          }}>
            Your Queues ({queues.length})
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px"
          }}>
            {queues.map((queue) => (
              <div key={queue.id} style={{
                backgroundColor: "white",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                overflow: "hidden",
                transition: "box-shadow 0.2s, transform 0.2s"
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Card Top Accent */}
                <div style={{
                  height: "4px",
                  backgroundColor: queue.isPaused ? "#f59e0b" : "#6366f1"
                }} />

                <div style={{ padding: "20px" }}>
                  {/* Queue Name + Status Badge */}
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "12px"
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#0f172a",
                        marginBottom: "3px"
                      }}>
                        {queue.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                        {queue.businessName || "Business"}
                      </p>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      backgroundColor: queue.isPaused ? "#fef3c7" : "#d1fae5",
                      color: queue.isPaused ? "#92400e" : "#065f46",
                      flexShrink: 0
                    }}>
                      {queue.isPaused ? "⏸ Paused" : "● Active"}
                    </span>
                  </div>

                  {/* Token Counter */}
                  <div style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500", marginBottom: "2px" }}>
                        CURRENT TOKEN
                      </p>
                      <p style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", lineHeight: 1 }}>
                        #{queue.current_token || 0}
                      </p>
                    </div>
                    <div style={{
                      fontSize: "28px", opacity: 0.15
                    }}>
                      🎫
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onOpenQueue(queue)}
                    style={{
                      width: "100%",
                      padding: "11px",
                      fontSize: "13px",
                      fontWeight: "600",
                      backgroundColor: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "9px",
                      cursor: "pointer",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1e293b"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0f172a"}
                  >
                    Open Queue Control →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AdminDashboard = forwardRef(AdminDashboardComponent);

export default AdminDashboard;
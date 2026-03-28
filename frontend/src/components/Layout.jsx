import { getAuth, signOut } from "firebase/auth";

function Layout({ children, role = "admin", activeSection = "dashboard", onNavSelect }) {
  // ✅ FIX #3: Role-specific nav items
  const adminNavItems = [
    { label: "Dashboard",     icon: "⊞", key: "dashboard" },
    { label: "Manage Queues", icon: "◈", key: "queues",   badge: "LIVE" },
    { label: "Announcements", icon: "◎", key: "announcements" },
    { label: "Settings",      icon: "⊙", key: "settings" },
  ];
  const userNavItems = [
    { label: "Dashboard", icon: "⊞", key: "dashboard" },
    { label: "Queues",    icon: "◈", key: "queues" },
  ];
  const navItems = role === "user" ? userNavItems : adminNavItems;

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "var(--font)"
    }}>
      {/* Sidebar */}
      <div style={{
        width: "240px",
        minWidth: "240px",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid rgba(255,255,255,0.06)"
      }}>
        {/* Top */}
        <div>
          {/* Brand */}
          <div style={{
            padding: "22px 20px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "34px", height: "34px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                borderRadius: "9px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0
              }}>
                ⚡
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", letterSpacing: "-0.3px" }}>
                  NoLine
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Queue System
                </div>
              </div>
            </div>
          </div>

          {/* Section: Navigation */}
          <div style={{ padding: "20px 12px 0" }}>
            <p style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              padding: "0 8px",
              marginBottom: "8px"
            }}>
              Navigation
            </p>

            {navItems.map((item) => {
              const isActive = activeSection === item.key;
              return (
              <div
                key={item.label}
                onClick={() => onNavSelect && onNavSelect(item.key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                  backgroundColor: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                  cursor: "pointer",
                  transition: "background-color 0.15s"
                }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", color: isActive ? "#818cf8" : "#64748b" }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: isActive ? "600" : "400",
                    color: isActive ? "#e2e8f0" : "#94a3b8"
                  }}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: "9px",
                    fontWeight: "700",
                    backgroundColor: "#dc2626",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px"
                  }}>
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <span style={{ fontSize: "12px", color: "#818cf8" }}>›</span>
                )}
              </div>
            );})}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          padding: "16px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <div style={{
              width: "8px", height: "8px",
              backgroundColor: "#10b981",
              borderRadius: "50%",
              flexShrink: 0,
              boxShadow: "0 0 6px #10b981"
            }} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#e2e8f0" }}>System Online</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>All services active</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "10px 14px",
              fontSize: "12px",
              fontWeight: "600",
              fontFamily: "var(--font)",
              backgroundColor: "transparent",
              color: "#64748b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              transition: "all 0.2s",
              letterSpacing: "0.2px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            <span style={{ fontSize: "13px" }}>→</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden"
      }}>
        {/* Top Header */}
        <div style={{
          height: "60px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }}>
              Queue Dashboard
            </h2>
            <div style={{
              display: "flex", alignItems: "center", gap: "5px",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "600"
            }}>
              <span style={{
                width: "6px", height: "6px",
                backgroundColor: "#059669",
                borderRadius: "50%",
                display: "inline-block"
              }} />
              Online
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px", height: "32px",
              backgroundColor: "#f1f5f9",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", cursor: "pointer",
              border: "1px solid #e2e8f0"
            }}>
              🔔
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "6px 12px",
              cursor: "pointer"
            }}>
              <div style={{
                width: "26px", height: "26px",
                backgroundColor: role === "user" ? "#059669" : "#6366f1",
                borderRadius: "6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", color: "white", fontWeight: "700"
              }}>
                {role === "user" ? "U" : "A"}
              </div>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>
                {role === "user" ? "User" : "Admin"}
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px"
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
function Home({ setRole }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "var(--font)",
      padding: "24px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background accents */}
      <div style={{
        position: "absolute", top: "8%", left: "8%",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "8%",
        width: "280px", height: "280px",
        background: "radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />

      {/* Card */}
      <div style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "22px",
        padding: "52px 44px",
        width: "100%",
        maxWidth: "440px",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{
          width: "56px", height: "56px",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          borderRadius: "16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "24px",
          boxShadow: "0 8px 24px rgba(99,102,241,0.4)"
        }}>
          ⚡
        </div>

        <h1 style={{
          fontSize: "28px",
          fontWeight: "800",
          color: "#f8fafc",
          marginBottom: "8px",
          letterSpacing: "-0.5px"
        }}>
          NoLine
        </h1>
        <p style={{
          color: "#94a3b8",
          fontSize: "15px",
          marginBottom: "40px"
        }}>
          Choose your role to continue
        </p>

        {/* User Button */}
        <button
          onClick={() => setRole("user")}
          style={{
            width: "100%",
            padding: "16px 20px",
            fontSize: "15px",
            fontWeight: "600",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "12px",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#4f46e5";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#6366f1";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.4)";
          }}
        >
          <span style={{ fontSize: "18px" }}>👤</span>
          Continue as User
        </button>

        {/* Admin Button */}
        <button
          onClick={() => setRole("admin")}
          style={{
            width: "100%",
            padding: "16px 20px",
            fontSize: "15px",
            fontWeight: "600",
            backgroundColor: "transparent",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>🛡️</span>
          Continue as Admin
        </button>

        <div style={{
          marginTop: "32px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center"
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#059669" }} />
          <p style={{ color: "#475569", fontSize: "12px" }}>System Online — All services operational</p>
        </div>
      </div>
    </div>
  );
}

export default Home;

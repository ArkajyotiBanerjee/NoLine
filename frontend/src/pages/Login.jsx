import { signInWithGoogle } from "../services/auth";

function Login({ setUser }) {
  const handleLogin = async () => {
    const user = await signInWithGoogle();
    setUser(user);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "var(--font)",
      padding: "24px"
    }}>
      {/* Decorative background blobs */}
      <div style={{
        position: "absolute", top: "10%", left: "5%",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: "15%", right: "8%",
        width: "250px", height: "250px",
        background: "radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />

      {/* Card */}
      <div style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "52px 44px",
        width: "100%",
        maxWidth: "420px",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* Logo / Brand */}
        <div style={{
          width: "52px", height: "52px",
          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
          borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "22px",
          boxShadow: "0 8px 20px rgba(99,102,241,0.4)"
        }}>
          ⚡
        </div>

        <h1 style={{
          fontSize: "26px",
          fontWeight: "800",
          color: "#f8fafc",
          marginBottom: "8px",
          letterSpacing: "-0.5px"
        }}>
          NoLine
        </h1>
        <p style={{
          color: "#94a3b8",
          fontSize: "14px",
          marginBottom: "36px"
        }}>
          Smart Queue Management System
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px 20px",
            fontSize: "15px",
            fontWeight: "600",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.3)";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: "24px", fontSize: "12px", color: "#475569" }}>
          By continuing, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}

export default Login;
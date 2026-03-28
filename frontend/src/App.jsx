import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./services/firebase";

import Login from "./pages/Login";
import Home from "./pages/Home";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import UserSetup from "./pages/UserSetup";
import AdminSetup from "./pages/AdminSetup";
import UserDashboard from "./pages/UserDashboard";
import Layout from "./components/Layout";

import { checkProfile } from "./services/profile";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileExists, setProfileExists] = useState(null);
  const [loading, setLoading] = useState(true);
  // ✅ FIX #3 & #4: Track which nav section user is on
  const [userSection, setUserSection] = useState("dashboard");

  const auth = getAuth(app); // 🔥 NEW

  // 🔥 AUTH PERSISTENCE FIX
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // stop loading after auth check
    });

    return () => unsubscribe();
  }, [auth]);

  // 🔥 PROFILE CHECK
  useEffect(() => {
    const checkUserProfile = async () => {
      if (user && role) {
        try {
          const exists = await checkProfile(user.uid, role);
          setProfileExists(exists);
        } catch (error) {
          console.error("Error checking profile:", error);
        }
      }
    };

    checkUserProfile();
  }, [user, role]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setProfileExists(null); // reset when role changes
  };

  const handleSetupComplete = () => {
    setProfileExists(true);
  };

  // 🔥 GLOBAL LOADING (VERY IMPORTANT)
  const LoadingScreen = () => (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "14px",
      backgroundColor: "#f8fafc",
      fontFamily: "var(--font)"
    }}>
      <div style={{
        width: "24px", height: "24px",
        border: "2px solid #e2e8f0",
        borderTopColor: "#6366f1",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading...</p>
    </div>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  // 🔐 LOGIN
  if (!user) {
    return <Login setUser={setUser} />;
  }

  // 🎭 ROLE SELECT
  if (!role) {
    return <Home setRole={handleRoleSelect} />;
  }

  // 👤 USER FLOW
  if (role === "user") {
    if (profileExists === null) {
      return <LoadingScreen />;
    }

    if (profileExists) {
      return (
        <Layout role="user" activeSection={userSection} onNavSelect={setUserSection}>
          <UserDashboard activePage={userSection} />
        </Layout>
      );
    } else {
      return <UserSetup uid={user.uid} onComplete={handleSetupComplete} />;
    }
  }

  // 🧑‍💼 ADMIN FLOW
  if (role === "admin") {
    if (profileExists === null) {
      return <LoadingScreen />;
    }

    if (profileExists) {
      return <AdminPage />;
    } else {
      return <AdminSetup uid={user.uid} onComplete={handleSetupComplete} />;
    }
  }
}

export default App;
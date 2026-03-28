import { useState, useEffect, useCallback, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getQueuesByCity, joinQueue, getUserToken } from "../services/user";

function UserDashboard({ activePage = "dashboard" }) {
  const [user, setUser] = useState(null);
  const [autoShowToken] = useState(false); // Control auto-showing token view
  const [userCity, setUserCity] = useState("");
  const [queues, setQueues] = useState([]);
  const [joinedToken, setJoinedToken] = useState(null);
  const [joinedQueues, setJoinedQueues] = useState(new Set()); // Track joined queue IDs
  const [currentToken, setCurrentToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [history, setHistory] = useState([]);
  // Ref to store token doc unsubscribe for real-time status updates
  const tokenUnsubscribeRef = useRef(null);

  const auth = getAuth();

  // ✅ DEFINE FIRST (IMPORTANT FIX)
  const setupQueueListener = useCallback((queueId) => {
    const queueRef = doc(db, "queues", queueId);

    const unsubscribe = onSnapshot(queueRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentToken(data.current_token || 0);
      }
    });

    return unsubscribe;
  }, []);

  // ✅ FIX #1: Real-time listener on the TOKEN doc so status changes ("completed") update UI immediately
  const setupTokenListener = useCallback((queueId, tokenId) => {
    // Clean up previous listener
    if (tokenUnsubscribeRef.current) {
      tokenUnsubscribeRef.current();
      tokenUnsubscribeRef.current = null;
    }
    const tokenRef = doc(db, "queues", queueId, "tokens", tokenId);
    tokenUnsubscribeRef.current = onSnapshot(tokenRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setJoinedToken((prev) => prev ? { ...prev, ...data } : prev);
      }
    });
  }, []);

  const loadUserData = useCallback(async (currentUser) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserCity(userData.city);

        const cityQueues = await getQueuesByCity(userData.city);
        setQueues(cityQueues);

        // Check if user already has a token in any queue
        const joinedQueueIds = new Set();
        for (const queue of cityQueues) {
          const token = await getUserToken(queue.id, currentUser.uid);
          if (token) {
            joinedQueueIds.add(queue.id);

            if (autoShowToken && !joinedToken) {
              setJoinedToken({
                ...token,
                queueId: queue.id,
                queueName: queue.name
              });

              setupQueueListener(queue.id);
            }
          }
        }
        setJoinedQueues(joinedQueueIds);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, [setupQueueListener, autoShowToken, joinedToken]);

  // ✅ FIX AUTH LISTENER (IMPORTANT)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadUserData(currentUser);

        // Load history
        const storedHistory = JSON.parse(localStorage.getItem("queueHistory") || "[]");
        setHistory(storedHistory);
      }
    });

    return () => unsubscribe();
  }, [auth, loadUserData]);

  // ✅ FIX #2: Save history on completion — deduplicated, updates UI immediately
  useEffect(() => {
    if (!joinedToken) return;
    if (joinedToken.status !== "completed") return;

    try {
      const existing = JSON.parse(localStorage.getItem("queueHistory") || "[]");

      // Prevent duplicates: check tokenNumber + queueId pair
      const alreadyExists = existing.some(
        (h) => h.tokenNumber === joinedToken.tokenNumber && h.queueId === joinedToken.queueId
      );
      if (alreadyExists) return;

      const updatedHistory = [
        {
          ...joinedToken,
          completedAt: Date.now()
        },
        ...existing
      ];

      localStorage.setItem("queueHistory", JSON.stringify(updatedHistory));
      setHistory(updatedHistory); // ← update UI immediately without reload
    } catch (err) {
      console.error("Error saving history:", err);
    }
  }, [joinedToken]);

  const handleJoinQueue = async (queue) => {
    if (!user) return;

    setJoining(true);

    try {
      const tokenData = await joinQueue(queue.id, user);

      setJoinedToken({
        ...tokenData,
        queueId: queue.id,
        queueName: queue.name,
        businessName: queue.businessName,
        category: queue.category,
        userId: user.uid,
        name: user.displayName || user.email
      });

      // Add to joined queues
      setJoinedQueues(prev => new Set([...prev, queue.id]));

      setupQueueListener(queue.id);
      // ✅ FIX #1: Also listen to THIS user's token doc for real-time status updates
      if (tokenData.id) setupTokenListener(queue.id, tokenData.id);

    } catch (error) {
      console.error("Error joining queue:", error);
    } finally {
      setJoining(false);
    }
  };

  const getPosition = () => {
    if (!joinedToken) return 0;
    return Math.max(0, joinedToken.tokenNumber - currentToken);
  };

  // Check if user already joined this specific queue
  const hasUserJoinedQueue = (queueId) => {
    return joinedQueues.has(queueId);
  };

  const getCrowdLevel = (queue) => {
    const people = queue.current_token || 0;

    if (people < 5) {
      return { label: "Light", color: "#16a34a", bg: "#dcfce7", people };
    } else if (people <= 10) {
      return { label: "Medium", color: "#ca8a04", bg: "#fef9c3", people };
    } else {
      return { label: "Busy", color: "#dc2626", bg: "#fee2e2", people };
    }
  };

  // ================= RENDER =================

  const handleArrived = async () => {
    if (!joinedToken?.id) {
      console.error("Token ID missing!");
      return;
    }
    if (!joinedToken) return;
    if (joinedToken.status === "completed") return;

    try {
      const pin = Math.floor(1000 + Math.random() * 9000);

      const tokenRef = doc(
        db,
        "queues",
        joinedToken.queueId,
        "tokens",
        joinedToken.id
      );
      console.log("Arriving token:", joinedToken);
      await updateDoc(tokenRef, {
        status: "arrived",
        pin: pin,
        arrivedAt: Date.now()
      });

      // Update local UI
      setJoinedToken((prev) => ({
        ...prev,
        status: "arrived",
        pin: pin
      }));

    } catch (error) {
      console.error("Error marking arrived:", error);
    }
  };

  // ---- LOADING STATE ----
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        flexDirection: "column",
        gap: "14px"
      }}>
        <div style={{
          width: "24px", height: "24px",
          border: "2px solid #e2e8f0",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite"
        }} />
        <p style={{ color: "#94a3b8", fontSize: "14px", fontFamily: "var(--font)" }}>
          Loading your queues...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ---- COMPLETED STATE ----
  if (joinedToken && joinedToken?.status === "completed") {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font)"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          padding: "48px 40px",
          maxWidth: "460px",
          width: "100%",
          textAlign: "center"
        }}>
          <div style={{
            width: "72px", height: "72px",
            backgroundColor: "#d1fae5",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "32px",
            margin: "0 auto 24px"
          }}>
            ✅
          </div>
          <h2 style={{
            fontSize: "22px", fontWeight: "800",
            color: "#0f172a", marginBottom: "10px"
          }}>
            You've been served!
          </h2>
          <p style={{
            color: "#64748b", fontSize: "14px",
            marginBottom: "32px", lineHeight: "1.6"
          }}>
            Thank you for using NoLine. Your visit to{" "}
            <strong style={{ color: "#0f172a" }}>{joinedToken.queueName}</strong>{" "}
            has been completed.
          </p>
          <button
            onClick={() => {
              if (joinedToken?.queueId) {
                setJoinedQueues(prev => {
                  const updated = new Set(prev);
                  updated.delete(joinedToken.queueId);
                  return updated;
                });
              }
              setJoinedToken(null);
            }}
            style={{
              width: "100%",
              padding: "13px",
              fontSize: "14px", fontWeight: "600",
              backgroundColor: "#0f172a",
              color: "white",
              border: "none", borderRadius: "10px", cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1e293b"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0f172a"}
          >
            Back to Queues
          </button>
        </div>
      </div>
    );
  }

  // ---- TOKEN VIEW ----
  if (joinedToken) {
    const position = getPosition();
    const statusConfig =
      position === 0
        ? { bg: "#fef3c7", color: "#92400e", border: "#fbbf24", msg: "🔔 It's your turn! Head to the counter." }
        : position === 1
        ? { bg: "#dbeafe", color: "#1e40af", border: "#60a5fa", msg: "⚡ You're next in line!" }
        : { bg: "#f0fdf4", color: "#166534", border: "#86efac", msg: `⏱ Est. wait: ~${position * 2} minutes` };

    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font)"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          padding: "40px",
          maxWidth: "500px",
          width: "100%"
        }}>
          {/* Queue Name */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "6px" }}>
              Your Active Queue
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
              {joinedToken.queueName}
            </h2>
          </div>

          {/* ✅ NEW: isEnded alert on token screen */}
          {joinedToken.isEnded && (
            <div style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <span style={{ fontSize: "16px" }}>🔚</span>
              <p style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                This queue has been closed by the admin.
              </p>
            </div>
          )}

          {/* ✅ NEW: Announcement banner on token screen */}
          {joinedToken.announcement && (
            <div style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fbbf24",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
              display: "flex", alignItems: "flex-start", gap: "8px"
            }}>
              <span style={{ fontSize: "16px", flexShrink: 0 }}>📢</span>
              <p style={{ fontSize: "13px", color: "#92400e", fontWeight: "500", lineHeight: "1.5" }}>
                {joinedToken.announcement}
              </p>
            </div>
          )}

          {/* Token Number */}
          <div style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "28px",
            textAlign: "center",
            marginBottom: "20px"
          }}>
            <p style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "8px" }}>
              Your Token
            </p>
            <div style={{
              fontSize: "72px",
              fontWeight: "800",
              color: "#059669",
              lineHeight: 1,
              letterSpacing: "-2px"
            }}>
              #{joinedToken.tokenNumber}
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "10px" }}>
              Currently serving: <strong style={{ color: "#0f172a" }}>#{currentToken}</strong>
              {"  ·  "}
              Position: <strong style={{ color: "#0f172a" }}>{position} ahead</strong>
            </p>
            {/* ✅ FIX #5: ETA display on token screen */}
            {position > 0 && (
              <p style={{
                fontSize: "13px", fontWeight: "700",
                color: "#6366f1", marginTop: "6px"
              }}>
                ⏱ ETA: ~{position * 2} min
              </p>
            )}
          </div>

          {/* Status Banner */}
          <div style={{
            backgroundColor: statusConfig.bg,
            color: statusConfig.color,
            border: `1.5px solid ${statusConfig.border}`,
            borderRadius: "12px",
            padding: "14px 18px",
            fontSize: "14px",
            fontWeight: "600",
            textAlign: "center",
            marginBottom: "20px"
          }}>
            {statusConfig.msg}
          </div>

          {/* PIN Display (arrived state) */}
          {joinedToken.status === "arrived" && (
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1.5px solid #86efac",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              marginBottom: "16px"
            }}>
              <p style={{ fontSize: "12px", color: "#166534", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                Your Verification PIN
              </p>
              <div style={{
                fontSize: "42px",
                fontWeight: "800",
                color: "#065f46",
                letterSpacing: "10px",
                lineHeight: 1
              }}>
                {joinedToken.pin}
              </div>
              <p style={{ fontSize: "12px", color: "#4ade80", marginTop: "10px" }}>
                Show this PIN to the staff at the counter
              </p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {joinedToken.status !== "arrived" && joinedToken.status !== "completed" && (
              <button
                onClick={handleArrived}
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: "14px", fontWeight: "600",
                  backgroundColor: "#059669",
                  color: "white",
                  border: "none", borderRadius: "10px", cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#047857";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#059669";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                📍 I Have Arrived
              </button>
            )}

            <button
              onClick={() => setJoinedToken(null)}
              style={{
                width: "100%",
                padding: "11px",
                fontSize: "13px", fontWeight: "500",
                backgroundColor: "transparent",
                color: "#64748b",
                border: "1.5px solid #e2e8f0",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#94a3b8";
                e.currentTarget.style.color = "#475569";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              ← Back to Queues
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- QUEUE LIST VIEW ----
  const activeQueues = queues.filter((q) => !joinedQueues.has(q.id));

  const getCategoryStyle = (category) => {
    const map = {
      Hospital:     { bg: "#dbeafe", color: "#1e40af" },
      Restaurant:   { bg: "#fef3c7", color: "#92400e" },
      Government:   { bg: "#fee2e2", color: "#991b1b" },
      "Public Place": { bg: "#dcfce7", color: "#065f46" },
    };
    return map[category] || { bg: "#f1f5f9", color: "#475569" };
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "var(--font)",
      padding: "32px 24px"
    }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* ✅ FIX #4: Page Header changes based on activePage */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "4px",
            letterSpacing: "-0.4px"
          }}>
            {activePage === "queues" ? "Browse Queues" : "Dashboard"}
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            {userCity ? `Showing queues in ${userCity}` : "Fetching your city..."}
            {" · "}
            <span style={{ fontWeight: "600", color: "#0f172a" }}>
              {activeQueues.length} available
            </span>
          </p>
        </div>

        {/* Queue Grid */}
        {activeQueues.length === 0 ? (
          <div style={{
            backgroundColor: "white",
            border: "2px dashed #e2e8f0",
            borderRadius: "16px",
            padding: "60px 24px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>🏙️</div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>
              No active queues nearby
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              There are no active queues in {userCity} right now. Check back later!
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "16px",
            marginBottom: "40px"
          }}>
            {activeQueues.map((queue) => {
              const crowd = getCrowdLevel(queue);
              const catStyle = getCategoryStyle(queue.category);
              return (
                <div
                  key={queue.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s, transform 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Top Accent Bar */}
                  <div style={{
                    height: "4px",
                    backgroundColor: queue.is_paused ? "#f59e0b" : "#6366f1"
                  }} />

                  <div style={{ padding: "18px 20px" }}>
                    {/* Business Name + Status */}
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: "10px"
                    }}>
                      <p style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>
                        {queue.businessName || "Business"}
                      </p>
                      <span style={{
                        fontSize: "10px", fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        backgroundColor:
                          queue.isEnded ? "#f1f5f9" :
                          queue.is_paused ? "#fef3c7" : "#d1fae5",
                        color:
                          queue.isEnded ? "#64748b" :
                          queue.is_paused ? "#92400e" : "#065f46"
                      }}>
                        {queue.isEnded ? "✓ Ended" : queue.is_paused ? "⏸ Paused" : "● Active"}
                      </span>
                    </div>

                    {/* Queue Name */}
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "12px",
                      lineHeight: "1.3"
                    }}>
                      {queue.name}
                    </h3>

                    {/* Badges Row */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: catStyle.bg,
                        color: catStyle.color
                      }}>
                        {queue.category || "Misc"}
                      </span>
                      <span style={{
                        fontSize: "11px", fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: crowd.bg,
                        color: crowd.color
                      }}>
                        {crowd.label} · {crowd.people} ahead
                      </span>
                      {/* ✅ FIX #5: ETA on queue card */}
                      <span style={{
                        fontSize: "11px", fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        backgroundColor: "#eef2ff",
                        color: "#6366f1"
                      }}>
                        ⏱ ~{Math.max(0, crowd.people * 2)} min wait
                      </span>
                    </div>

                    {/* ✅ NEW Feature 1: Announcement banner on queue card */}
                    {queue.announcement && (
                      <div style={{
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fbbf24",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px"
                      }}>
                        <span style={{ fontSize: "14px", flexShrink: 0 }}>📢</span>
                        <p style={{
                          fontSize: "12px", color: "#92400e",
                          fontWeight: "500", lineHeight: "1.5"
                        }}>
                          {queue.announcement}
                        </p>
                      </div>
                    )}

                    {/* Token Info */}
                    <div style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", marginBottom: "2px" }}>
                          Now Serving
                        </p>
                        <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                          #{queue.current_token || 0}
                        </p>
                      </div>
                      <div style={{ fontSize: "22px", opacity: 0.15 }}>🎫</div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleJoinQueue(queue)}
                        disabled={
                          joining ||
                          queue.is_paused ||
                          queue.isEnded ||
                          !(queue.isAccepting ?? true) ||
                          hasUserJoinedQueue(queue.id)
                        }
                        style={{
                          flex: 1,
                          padding: "11px 12px",
                          fontSize: "13px", fontWeight: "600",
                          backgroundColor:
                            hasUserJoinedQueue(queue.id) ? "#d1fae5" :
                            joining ? "#e2e8f0" :
                            queue.isEnded ? "#f1f5f9" :
                            !(queue.isAccepting ?? true) ? "#f1f5f9" :
                            queue.is_paused ? "#fef3c7" :
                            "#0f172a",
                          color:
                            hasUserJoinedQueue(queue.id) ? "#065f46" :
                            joining ? "#94a3b8" :
                            queue.isEnded ? "#64748b" :
                            !(queue.isAccepting ?? true) ? "#64748b" :
                            queue.is_paused ? "#92400e" :
                            "white",
                          border:
                            hasUserJoinedQueue(queue.id) ? "1px solid #86efac" :
                            (queue.isEnded || !(queue.isAccepting ?? true)) ? "1px solid #e2e8f0" :
                            queue.is_paused ? "1px solid #fbbf24" :
                            "none",
                          borderRadius: "9px",
                          cursor:
                            hasUserJoinedQueue(queue.id) || joining || queue.is_paused ||
                            queue.isEnded || !(queue.isAccepting ?? true)
                              ? "default" : "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                          const canJoin = !joining && !queue.is_paused && !queue.isEnded &&
                            (queue.isAccepting ?? true) && !hasUserJoinedQueue(queue.id);
                          if (canJoin) e.currentTarget.style.backgroundColor = "#1e293b";
                        }}
                        onMouseOut={(e) => {
                          const canJoin = !joining && !queue.is_paused && !queue.isEnded &&
                            (queue.isAccepting ?? true) && !hasUserJoinedQueue(queue.id);
                          if (canJoin) e.currentTarget.style.backgroundColor = "#0f172a";
                        }}
                      >
                        {hasUserJoinedQueue(queue.id) ? "✓ Joined" :
                         joining ? "Joining..." :
                         queue.isEnded ? "🔚 Queue Ended" :
                         !(queue.isAccepting ?? true) ? "🚫 Not Accepting" :
                         queue.is_paused ? "⏸ Paused" :
                         "Join Queue"}
                      </button>

                      {queue.mapLink && (
                        <button
                          onClick={() => window.open(queue.mapLink, "_blank")}
                          style={{
                            padding: "11px 14px",
                            fontSize: "12px", fontWeight: "600",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #e2e8f0",
                            borderRadius: "9px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                        >
                          📍 View Map
                        </button>
                      )}

                      {hasUserJoinedQueue(queue.id) && (
                        <button
                          onClick={async () => {
                            const token = await getUserToken(queue.id, user.uid);
                            if (token) {
                              setJoinedToken({
                                ...token, // MUST include id
                                queueId: queue.id,
                                queueName: queue.name,
                                businessName: queue.businessName,
                                category: queue.category,
                                status: token.status || "waiting"
                              });
                              setupQueueListener(queue.id);
                              // ✅ FIX #1: Setup token listener on View Status
                              if (token.id) setupTokenListener(queue.id, token.id);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: "11px 12px",
                            fontSize: "13px", fontWeight: "600",
                            backgroundColor: "#6366f1",
                            color: "white",
                            border: "none",
                            borderRadius: "9px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#6366f1"}
                        >
                          View Status →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ✅ FIX #4: History only shown on Dashboard view, not Queues view */}
        {activePage !== "queues" && <div>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "16px"
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
              Previous Queues
            </h2>
            {history.length > 0 && (
              <span style={{
                fontSize: "11px", fontWeight: "600",
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                padding: "3px 9px",
                borderRadius: "999px"
              }}>
                {history.length}
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{
              padding: "32px 20px",
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              textAlign: "center"
            }}>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                No past queues — your history will appear here once served.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {history.map((h, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "38px", height: "38px",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "9px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0
                    }}>
                      ✅
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                        {h.queueName}
                      </p>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                        {h.businessName || "Business"} · {h.category || "Misc"} · Token #{h.tokenNumber}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: "700",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    backgroundColor: "#d1fae5",
                    color: "#065f46"
                  }}>
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}

export default UserDashboard;
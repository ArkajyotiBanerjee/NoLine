import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";

// 🔥 CREATE QUEUE (UPGRADED — WITH NEW FIELDS)
export const createQueue = async (
  adminId,
  name,
  city,
  businessName = "",
  category = "Misc",
  mapLink = ""
) => {
  try {
    await addDoc(collection(db, "queues"), {
      adminId: adminId,
      name: name,
      city: city,

      // ✅ NEW FIELDS (SAFE DEFAULTS)
      businessName: businessName,
      category: category,
      mapLink: mapLink,
      phone: "",

      // ✅ EXISTING
      current_token: 0,
      isPaused: false,

      // ✅ NEW CONTROL FLAG
      isClosed: false,

      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("Error creating queue:", error);
  }
};

// 🔥 GET ADMIN QUEUES
export const getAdminQueues = async (adminId) => {
  const q = query(
    collection(db, "queues"),
    where("adminId", "==", adminId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 🔥 SERVE NEXT
export const serveNext = async (queueId) => {
  const queueRef = doc(db, "queues", queueId);

  const snapshot = await getDoc(queueRef);
  const data = snapshot.data();

  await updateDoc(queueRef, {
    current_token: (data.current_token || 0) + 1,
  });
};

// 🔥 TOGGLE PAUSE
export const togglePause = async (queueId) => {
  const queueRef = doc(db, "queues", queueId);

  const snapshot = await getDoc(queueRef);
  const data = snapshot.data();

  await updateDoc(queueRef, {
    isPaused: !data.isPaused,
  });
};

// ✅ NEW: SET ANNOUNCEMENT (single string, overwrites previous)
export const setAnnouncement = async (queueId, text) => {
  const queueRef = doc(db, "queues", queueId);
  await updateDoc(queueRef, { announcement: text });
};

// ✅ NEW: END QUEUE
export const endQueue = async (queueId) => {
  const queueRef = doc(db, "queues", queueId);
  await updateDoc(queueRef, { isEnded: true });
};

// ✅ NEW: TOGGLE isAccepting
export const toggleAccepting = async (queueId, currentValue) => {
  const queueRef = doc(db, "queues", queueId);
  await updateDoc(queueRef, { isAccepting: !currentValue });
};
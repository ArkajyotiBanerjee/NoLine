import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";

// 🔥 GET QUEUES BY CITY
export const getQueuesByCity = async (city) => {
  try {
    const queuesRef = collection(db, "queues");
    const q = query(queuesRef, where("city", "==", city));
    const querySnapshot = await getDocs(q);

    const queues = [];
    querySnapshot.forEach((docSnap) => {
      queues.push({ id: docSnap.id, ...docSnap.data() });
    });

    return queues;
  } catch (error) {
    console.error("Error fetching queues by city:", error);
    throw error;
  }
};

// 🔥 JOIN QUEUE (SAFE + NO DUPLICATES)
export const joinQueue = async (queueId, user) => {
  try {
    const tokensRef = collection(db, "queues", queueId, "tokens");

    // ✅ 1. CHECK IF USER ALREADY JOINED
    const existingQuery = query(tokensRef, where("userId", "==", user.uid));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      const existingToken = existingSnapshot.docs[0].data();
      const existingId = existingSnapshot.docs[0].id;
      return {
        tokenNumber: existingToken.tokenNumber,
        id: existingId
      };
    }

    // ✅ 2. GET QUEUE
    const queueRef = doc(db, "queues", queueId);
    const queueSnap = await getDoc(queueRef);

    if (!queueSnap.exists()) {
      throw new Error("Queue not found");
    }

    const queueData = queueSnap.data();

    // ✅ 3. USE next_token (SAFE COUNTER)
    const tokenNumber = queueData.next_token || 1;

    // ✅ 4. ADD TOKEN
    const docRef = await addDoc(tokensRef, {
      tokenNumber,
      userId: user.uid,
      name: user.displayName || user.email,
      joinedAt: serverTimestamp(),

      // 🔥 NEW FIELDS
      status: "waiting",
      pin: null,
      arrivedAt: null,
      verified: false
    });

    // ✅ 5. INCREMENT next_token
    await updateDoc(queueRef, {
      next_token: increment(1)
    });

    return {
      tokenNumber,
      id: docRef.id
    };

  } catch (error) {
    console.error("Error joining queue:", error);
    throw error;
  }
};

// 🔥 GET USER TOKEN (CHECK EXISTING)
export const getUserToken = async (queueId, userId) => {
  try {
    const tokensRef = collection(db, "queues", queueId, "tokens");
    const q = query(tokensRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const tokenDoc = querySnapshot.docs[0];
      return { id: tokenDoc.id, ...tokenDoc.data() };
    }

    return null;
  } catch (error) {
    console.error("Error getting user token:", error);
    throw error;
  }
};
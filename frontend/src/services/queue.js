import { db } from "./firebase";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";

export const getAdminQueues = async (adminId) => {
  const queuesRef = collection(db, "queues");
  const q = query(queuesRef, where("admin_id", "==", adminId));
  const querySnapshot = await getDocs(q);

  const queues = [];
  querySnapshot.forEach((doc) => {
    queues.push({ id: doc.id, ...doc.data() });
  });

  return queues;
};

export const createQueue = async (adminId, name) => {
  const queueData = {
    name,
    admin_id: adminId,
    current_token: 0,
    total_tokens: 0,
    avg_service_time: 5, // default 5 minutes
    is_paused: false,
    created_at: new Date()
  };

  const docRef = await addDoc(collection(db, "queues"), queueData);
  return docRef.id;
};

export const togglePause = async (queueId) => {
  const queueRef = doc(db, "queues", queueId);
  const queueSnap = await getDoc(queueRef);

  if (!queueSnap.exists()) return;

  const data = queueSnap.data();
  await updateDoc(queueRef, {
    is_paused: !data.is_paused
  });
};
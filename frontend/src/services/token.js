import { db } from "./firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";

export const serveNext = async (queue_id) => {
  const queueRef = doc(db, "queues", queue_id);
  const queueSnap = await getDoc(queueRef);

  if (!queueSnap.exists()) return;

  const data = queueSnap.data();

  await updateDoc(queueRef, {
    current_token: data.current_token + 1
  });
};

export const joinQueue = async (queue_id, user_name) => {
  const queueRef = doc(db, "queues", queue_id);
  const queueSnap = await getDoc(queueRef);

  if (!queueSnap.exists()) {
    console.error("Queue does not exist");
    return;
  }

  const data = queueSnap.data();
  const newToken = data.total_tokens + 1;

  // add token
  await addDoc(collection(db, "tokens"), {
    queue_id,
    token_number: newToken,
    user_name,
    status: "waiting",
    joined_at: Date.now()
  });

  // update queue
  await updateDoc(queueRef, {
    total_tokens: newToken
  });

  return newToken;
};

export const getQueueStatus = async (queue_id, token_number) => {
  const queueRef = doc(db, "queues", queue_id);
  const queueSnap = await getDoc(queueRef);

  if (!queueSnap.exists()) {
    throw new Error("Queue does not exist");
  }

  const data = queueSnap.data();
  const position = token_number - data.current_token;
  const eta = position * data.avg_service_time;

  return { position, eta };
};

export const togglePause = async (queueId) => {
  const queueRef = doc(db, "queues", queueId);

  const snapshot = await getDoc(queueRef);
  const data = snapshot.data();

  await updateDoc(queueRef, {
    isPaused: !data.isPaused,
  });
};
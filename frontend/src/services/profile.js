import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const checkProfile = async (uid, role) => {
  const collection = role === "user" ? "users" : "admins";
  const docRef = doc(db, collection, uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

export const createUserProfile = async (uid, data) => {
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, {
    name: data.name,
    phone: data.phone,
    gender: data.gender,
    city: data.city,
    createdAt: new Date()
  });
};

export const createAdminProfile = async (uid, data) => {
  const docRef = doc(db, "admins", uid);
  await setDoc(docRef, {
    business_name: data.business_name,
    address: data.address,
    phone: data.phone,
    city: data.city,
    createdAt: new Date()
  });
};
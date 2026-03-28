import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_YXyxnVHwWvyfU92iIKjTwMWmT9vKRhA",
  authDomain: "noline-15d1c.firebaseapp.com",
  projectId: "noline-15d1c",
  storageBucket: "noline-15d1c.firebasestorage.app",
  messagingSenderId: "645343583850",
  appId: "1:645343583850:web:4246fd52f2bb0523e63413",
  measurementId: "G-PS95BHWH5Q"
};

export const app = initializeApp(firebaseConfig);

// 🔥 THIS IS THE IMPORTANT PART
export const db = getFirestore(app);
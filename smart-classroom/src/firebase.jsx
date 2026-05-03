import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBXCy2FfPdMlxUtFuospWn452YlErDhHYY",
  authDomain: "roomproject-cef6c.firebaseapp.com",
  databaseURL: "https://roomproject-cef6c-default-rtdb.firebaseio.com",
  projectId: "roomproject-cef6c",
  storageBucket: "roomproject-cef6c.firebasestorage.app",
  messagingSenderId: "813487601652",
  appId: "1:813487601652:web:40ad2ac9e6147c6617eba1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
// firebase-config.js — MiLatido Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, increment, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase, ref, set, push, onValue, off, serverTimestamp as rtServerTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9oat9dd0S9vlxkg1osH4dW3XhRDGiOiw",
  authDomain: "charlasrf4.firebaseapp.com",
  databaseURL: "https://charlasrf4-default-rtdb.firebaseio.com",
  projectId: "charlasrf4",
  storageBucket: "charlasrf4.firebasestorage.app",
  messagingSenderId: "345019626508",
  appId: "1:345019626508:web:d099ca499acb29eac12a29"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export {
  auth, db, rtdb,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, increment, arrayUnion, arrayRemove,
  ref, set, push, onValue, off, rtServerTimestamp
};

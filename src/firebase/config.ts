import { initializeApp, getApps, getApp } from "firebase/app"
import { getStorage } from "firebase/storage"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC8lso_FRfFnYhCK0UciGmnoMa2BrlrD-o",
  authDomain: "yuksalish-sari.firebaseapp.com",
  projectId: "yuksalish-sari",
  storageBucket: "yuksalish-sari.appspot.com",
  messagingSenderId: "61916922480",
  appId: "1:61916922480:web:85fb4ae941c40c9f346ab5",
  measurementId: "G-069D3RYNWY"
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const storage = getStorage(app)
const db = getFirestore(app)

export { storage, db }
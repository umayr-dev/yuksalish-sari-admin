// lib/firebaseCrud.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment
} from "firebase/firestore";
import { db } from "./firebase";

const postsRef = collection(db, "posts");

// CREATE
export const createPost = async (post) => {
  const docRef = await addDoc(postsRef, post);
  return docRef.id;
};

// READ all
export const getAllPosts = async () => {
  const snapshot = await getDocs(postsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// READ one with view count increment
export const getPostWithView = async (id) => {
  const postDoc = doc(db, "posts", id);

  // Increase view count
  await updateDoc(postDoc, {
    views: increment(1)
  });

  const snapshot = await getDoc(postDoc);
  return { id: snapshot.id, ...snapshot.data() };
};

// UPDATE
export const updatePost = async (id, newData) => {
  const postDoc = doc(db, "posts", id);
  await updateDoc(postDoc, newData);
};

// DELETE
export const deletePost = async (id) => {
  const postDoc = doc(db, "posts", id);
  await deleteDoc(postDoc);
};

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { initializeApp, getApps, getApp } from "firebase/app"
import styles from "./manager.module.css"

// Firebase konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyC8lso_FRfFnYhCK0UciGmnoMa2BrlrD-o",
  authDomain: "yuksalish-sari.firebaseapp.com",
  projectId: "yuksalish-sari",
  storageBucket: "yuksalish-sari.appspot.com", // To'g'ri storage bucket
  messagingSenderId: "61916922480",
  appId: "1:61916922480:web:85fb4ae941c40c9f346ab5",
  measurementId: "G-069D3RYNWY"
}

// Firebase ilovasini ishga tushirish yoki mavjudini olish
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const storage = getStorage(app)

interface PdfBook {
  id: string
  fileUrl: string
  title: string
  description: string
  coverImageUrl: string
  fileName: string
}

export default function PdfManager() {
  const [books, setBooks] = useState<PdfBook[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Firebase'dan ma'lumotlarni olish
  useEffect(() => {
    const fetchBooks = async () => {
      const booksCollection = collection(db, "books")
      const booksSnapshot = await getDocs(booksCollection)
      const booksList = booksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PdfBook[]
      setBooks(booksList)
    }

    fetchBooks()
  }, [])

  const uploadFile = async (file: File, folder: string) => {
    const fileRef = ref(storage, `${folder}/${file.name}`)
    await uploadBytes(fileRef, file)
    return await getDownloadURL(fileRef)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pdfFile && coverImage) {
      try {
        const fileUrl = await uploadFile(pdfFile, "pdfs")
        const coverImageUrl = await uploadFile(coverImage, "covers")

        const newBook: PdfBook = {
          id: editingId || Date.now().toString(),
          fileUrl,
          title,
          description,
          coverImageUrl,
          fileName: pdfFile.name,
        }

        if (editingId) {
          // Firebase'da mavjud kitobni yangilash
          const bookDoc = doc(db, "books", editingId)
          await updateDoc(bookDoc, {
            title,
            description,
            coverImageUrl,
            fileUrl,
            fileName: pdfFile.name,
          })
          setBooks(books.map((book) => (book.id === editingId ? newBook : book)))
          setEditingId(null)
        } else {
          // Firebase'da yangi kitob qo'shish
          const booksCollection = collection(db, "books")
          const docRef = await addDoc(booksCollection, {
            title,
            description,
            coverImageUrl,
            fileUrl,
            fileName: pdfFile.name,
          })
          setBooks([...books, { ...newBook, id: docRef.id }])
        }

        // Formani tozalash
        setPdfFile(null)
        setCoverImage(null)
        setCoverPreview("")
        setTitle("")
        setDescription("")
      } catch (error) {
        console.error("Xatolik yuz berdi:", error)
        alert("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const book = books.find((b) => b.id === id)
      if (book && book.fileName && book.coverImageUrl) {
        // Firebase Storage'dan fayllarni o'chirish
        const fileRef = ref(storage, `pdfs/${book.fileName}`)
        const coverRef = ref(storage, `covers/${book.fileName}`)
        await deleteObject(fileRef)
        await deleteObject(coverRef)

        // Firebase Firestore'dan kitobni o'chirish
        const bookDoc = doc(db, "books", id)
        await deleteDoc(bookDoc)
        setBooks(books.filter((book) => book.id !== id))
      }
    } catch (error) {
      console.error("Xatolik yuz berdi:", error)
      alert("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
    }
  }

  const handleEdit = (book: PdfBook) => {
    setEditingId(book.id)
    setTitle(book.title)
    setDescription(book.description)
    setCoverPreview(book.coverImageUrl)
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPdfFile(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCoverImage(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setPdfFile(null)
    setCoverImage(null)
    setCoverPreview("")
    setTitle("")
    setDescription("")
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>PDF Kitoblar boshqaruvi</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="pdfFile">PDF fayl tanlang</label>
          <input
            type="file"
            id="pdfFile"
            accept=".pdf"
            onChange={handlePdfChange}
            className={styles.fileInput}
            required={!editingId}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">Kitob sarlavhasi</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.textInput}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Tavsif</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="coverImage">Muqova rasmi</label>
          <input
            type="file"
            id="coverImage"
            accept="image/*"
            onChange={handleCoverChange}
            className={styles.fileInput}
            required={!editingId}
          />
        </div>

        {coverPreview && (
          <div className={styles.previewContainer}>
            <h3>Muqova oldindan ko'rish</h3>
            <img src={coverPreview || "/placeholder.svg"} alt="Cover Preview" className={styles.preview} />
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={(!editingId && (!pdfFile || !coverImage)) || !title || !description}
          >
            {editingId ? "Yangilash" : "Qo'shish"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Bekor qilish
            </button>
          )}
        </div>
      </form>

      <div className={styles.itemsGrid}>
        {books.map((book) => (
          <div key={book.id} className={styles.item}>
            <div className={styles.bookItem}>
              <img src={book.coverImageUrl || "/placeholder.svg"} alt={book.title} className={styles.bookCover} />
              <div className={styles.bookInfo}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                <p className={styles.bookFileName}>{book.fileName}</p>
                <p className={styles.bookDescription}>{book.description}</p>
              </div>
            </div>
            <div className={styles.itemActions}>
              <button onClick={() => handleEdit(book)} className={styles.editButton}>
                Tahrirlash
              </button>
              <button onClick={() => handleDelete(book.id)} className={styles.deleteButton}>
                O'chirish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

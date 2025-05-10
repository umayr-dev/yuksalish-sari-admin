"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getStorage, getDownloadURL, deleteObject } from "firebase/storage"
import { storage, db } from "@/firebase/config"
import styles from "./manager.module.css"

interface Book {
  id: string
  title: string
  description: string
  fileUrl: string
  fileName: string
}

export default function PdfManager() {
  const [books, setBooks] = useState<Book[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Kitoblarni Firebase'dan olish
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, "books")
        const snapshot = await getDocs(booksCollection)
        const booksList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[]
        setBooks(booksList)
      } catch (error) {
        console.error("Xatolik:", error)
        alert("Kitoblarni yuklashda xatolik yuz berdi")
      }
    }

    fetchBooks()
  }, [])

  // PDF faylni Firebase Storage'ga yuklash
  const uploadPdf = async (file: File) => {
    const storage = getStorage(app); // Firebase Storage instance olamiz
  const storageRef = ref(storage, `pdfs/${file.name}`); // Shu yerda 'storageRef' aniqlanmoqda

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;

    try {
      // Create safe filename
      const cleanFileName = file.name
  .replace(/[^a-z0-9_.-]/gi, "_") // faqat ruxsat berilgan belgilar
const timestamp = Date.now()
const finalFileName = `${timestamp}_${cleanFileName}`
      
      // Set metadata
      const metadata = {
        contentType: 'application/pdf',
        customMetadata: {
          'originalName': file.name
        }
      }

      // Upload file
      console.log('Starting upload...')
      const uploadResult = await uploadBytes(storageRef, file, metadata)
      console.log('Upload completed:', uploadResult)

      // Get URL
      const downloadURL = await getDownloadURL(uploadResult.ref)
      console.log('Download URL:', downloadURL)

      return downloadURL
    } catch (error: any) {
      console.error('Upload error details:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }
  }

  // Yangi kitob qo'shish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile || !title || !description) {
      alert("Barcha maydonlarni to'ldiring");
      return;
    }

    try {
      // Fayl hajmini tekshirish (maksimum 100MB)
      if (pdfFile.size > 100 * 1024 * 1024) {
        throw new Error("Fayl hajmi 100MB dan oshmasligi kerak");
      }

      // PDF faylni yuklash
      const fileUrl = await uploadPdf(pdfFile);
      console.log("Uploaded URL:", fileUrl);

      // Firestore'ga ma'lumotlarni saqlash
      const booksCollection = collection(db, "books");
      const docRef = await addDoc(booksCollection, {
        title,
        description,
        fileUrl,
        fileName: pdfFile.name,
        createdAt: new Date().toISOString()
      });

      // State'ni yangilash
      const newBook = {
        id: docRef.id,
        title,
        description,
        fileUrl,
        fileName: pdfFile.name
      };
      setBooks([...books, newBook]);

      // Formani tozalash
      setTitle("");
      setDescription("");
      setPdfFile(null);
      (document.getElementById("pdfFile") as HTMLInputElement).value = "";

      alert("Kitob muvaffaqiyatli yuklandi!");
    } catch (error: any) {
      console.error("Xatolik:", error);
      setError(error.message);
      alert(`Kitobni yuklashda xatolik: ${error.message}`);
    }
  }

  // Kitobni o'chirish
  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm("Haqiqatan ham bu kitobni o'chirmoqchimisiz?")) return

    try {
      // Storage'dan faylni o'chirish
      const fileRef = ref(storage, `pdfs/${fileName}`)
      await deleteObject(fileRef)

      // Firestore'dan hujjatni o'chirish
      await deleteDoc(doc(db, "books", id))

      // State'ni yangilash
      setBooks(books.filter(book => book.id !== id))
      alert("Kitob muvaffaqiyatli o'chirildi!")
    } catch (error) {
      console.error("Xatolik:", error)
      alert("Kitobni o'chirishda xatolik yuz berdi")
    }
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>PDF Kitoblar boshqaruvi</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Kitob nomi</label>
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
          <label htmlFor="pdfFile">PDF fayl</label>
          <input
            type="file"
            id="pdfFile"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className={styles.fileInput}
            required
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Yuklash
        </button>
      </form>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {books.map((book) => (
          <div key={book.id} className={styles.item}>
            <div className={styles.bookInfo}>
              <h3>{book.title}</h3>
              <p>{book.description}</p>
              <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadLink}>
                Yuklab olish
              </a>
            </div>
            <button onClick={() => handleDelete(book.id, book.fileName)} className={styles.deleteButton}>
              O'chirish
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

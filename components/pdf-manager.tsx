"use client"

import type React from "react"

import { useState, useEffect } from "react"
import styles from "./manager.module.css"

interface PdfBook {
  id: string
  file: File
  title: string
  description: string
  coverImage: string
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

  useEffect(() => {
    // Load saved books from localStorage
    const savedBooks = localStorage.getItem("pdfBooks")
    if (savedBooks) {
      try {
        // We can't store File objects in localStorage, so we'll just use the metadata
        const parsedBooks = JSON.parse(savedBooks)
        setBooks(parsedBooks)
      } catch (error) {
        console.error("Error parsing saved books:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Save books to localStorage whenever they change
    localStorage.setItem("pdfBooks", JSON.stringify(books))
  }, [books])

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

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (pdfFile && coverImage) {
      if (editingId) {
        // Update existing book
        setBooks(
          books.map((book) =>
            book.id === editingId
              ? {
                  ...book,
                  title,
                  description,
                  coverImage: coverPreview,
                  file: pdfFile,
                  fileName: pdfFile.name,
                }
              : book,
          ),
        )
        setEditingId(null)
      } else {
        // Add new book
        const newBook: PdfBook = {
          id: Date.now().toString(),
          file: pdfFile,
          title,
          description,
          coverImage: coverPreview,
          fileName: pdfFile.name,
        }
        setBooks([...books, newBook])
      }

      // Reset form
      setPdfFile(null)
      setCoverImage(null)
      setCoverPreview("")
      setTitle("")
      setDescription("")

      // Reset file inputs
      const pdfInput = document.getElementById("pdfFile") as HTMLInputElement
      const coverInput = document.getElementById("coverImage") as HTMLInputElement
      if (pdfInput) pdfInput.value = ""
      if (coverInput) coverInput.value = ""
    }
  }

  const handleEdit = (book: PdfBook) => {
    setEditingId(book.id)
    setTitle(book.title)
    setDescription(book.description)
    setCoverPreview(book.coverImage)
    // We can't set the files back since they're not actually stored
  }

  const handleDelete = (id: string) => {
    setBooks(books.filter((book) => book.id !== id))
  }

  const handleCancel = () => {
    setEditingId(null)
    setPdfFile(null)
    setCoverImage(null)
    setCoverPreview("")
    setTitle("")
    setDescription("")

    // Reset file inputs
    const pdfInput = document.getElementById("pdfFile") as HTMLInputElement
    const coverInput = document.getElementById("coverImage") as HTMLInputElement
    if (pdfInput) pdfInput.value = ""
    if (coverInput) coverInput.value = ""
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
              <img src={book.coverImage || "/placeholder.svg"} alt={book.title} className={styles.bookCover} />
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

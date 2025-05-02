"use client"

import type React from "react"

import { useState, useEffect } from "react"
import styles from "./manager.module.css"

interface Image {
  id: string
  file: File
  preview: string
}

export default function ImageManager() {
  const [images, setImages] = useState<Image[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Load saved images from localStorage
    const savedImages = localStorage.getItem("images")
    if (savedImages) {
      try {
        // We can't store File objects in localStorage, so we'll just use the previews
        const parsedImages = JSON.parse(savedImages)
        setImages(parsedImages)
      } catch (error) {
        console.error("Error parsing saved images:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Save images to localStorage whenever they change
    localStorage.setItem("images", JSON.stringify(images))
  }, [images])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFile) {
      if (editingId) {
        // Update existing image
        setImages(images.map((img) => (img.id === editingId ? { ...img, file: selectedFile, preview } : img)))
        setEditingId(null)
      } else {
        // Add new image
        const newImage: Image = {
          id: Date.now().toString(),
          file: selectedFile,
          preview,
        }
        setImages([...images, newImage])
      }

      // Reset form
      setSelectedFile(null)
      setPreview("")

      // Reset file input
      const fileInput = document.getElementById("imageFile") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    }
  }

  const handleEdit = (image: Image) => {
    setEditingId(image.id)
    setPreview(image.preview)
    // We can't set the file back since it's not actually stored
  }

  const handleDelete = (id: string) => {
    setImages(images.filter((img) => img.id !== id))
  }

  const handleCancel = () => {
    setEditingId(null)
    setSelectedFile(null)
    setPreview("")

    // Reset file input
    const fileInput = document.getElementById("imageFile") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Rasmlar boshqaruvi</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="imageFile">Rasm tanlang</label>
          <input
            type="file"
            id="imageFile"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
            required={!editingId}
          />
        </div>

        {preview && (
          <div className={styles.previewContainer}>
            <h3>Oldindan ko'rish</h3>
            <img src={preview || "/placeholder.svg"} alt="Preview" className={styles.preview} />
          </div>
        )}

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton}>
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
        {images.map((image) => (
          <div key={image.id} className={styles.item}>
            <img src={image.preview || "/placeholder.svg"} alt="Uploaded" className={styles.itemImage} />
            <div className={styles.itemActions}>
              <button onClick={() => handleEdit(image)} className={styles.editButton}>
                Tahrirlash
              </button>
              <button onClick={() => handleDelete(image.id)} className={styles.deleteButton}>
                O'chirish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

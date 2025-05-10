"use client"

import type React from "react"
import { useState, useEffect } from "react"
import styles from "./manager.module.css"

interface Video {
  id: string
  url: string
}

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([])
  const [url, setUrl] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // API'dan ma'lumotlarni olish
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("https://4e439b85aa8b8540.mokky.dev/videos")
        if (!response.ok) {
          throw new Error("Videolarni yuklashda xatolik yuz berdi")
        }
        const data = await response.json()
        setVideos(data)
      } catch (error) {
        console.error("Xatolik yuz berdi:", error)
        alert("Videolarni yuklashda xatolik yuz berdi.")
      }
    }

    fetchVideos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Mavjud videoni yangilash
        const response = await fetch(`https://4e439b85aa8b8540.mokky.dev/videos/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error("Videoni yangilashda xatolik")
        }

        const updatedVideo = await response.json()
        setVideos(videos.map((video) => (video.id === editingId ? updatedVideo : video)))
        setEditingId(null)
      } else {
        // Yangi video qo'shish
        const response = await fetch("https://4e439b85aa8b8540.mokky.dev/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error("Videoni qo'shishda xatolik")
        }

        const newVideo = await response.json()
        setVideos([...videos, newVideo])
      }

      // Formani tozalash
      setUrl("")
    } catch (error) {
      console.error("Xatolik yuz berdi:", error)
      alert(`Xatolik yuz berdi: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Haqiqatan ham bu videoni o'chirmoqchimisiz?")) {
      try {
        const response = await fetch(`https://4e439b85aa8b8540.mokky.dev/videos/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Videoni o'chirishda xatolik")
        }

        setVideos(videos.filter((video) => video.id !== id))
      } catch (error) {
        console.error("Xatolik yuz berdi:", error)
        alert(`O'chirishda xatolik: ${error.message}`)
      }
    }
  }

  const handleEdit = (video: Video) => {
    setEditingId(video.id)
    setUrl(video.url)
  }

  const handleCancel = () => {
    setEditingId(null)
    setUrl("")
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Videolar boshqaruvi</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="videoUrl">Video URL</label>
          <input
            type="url"
            id="videoUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={styles.textInput}
            required
          />
        </div>

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
        {videos.map((video) => (
          <div key={video.id} className={styles.item}>
            <div className={styles.videoItem}>
              <div className={styles.videoUrl}>{video.url}</div>
            </div>
            <div className={styles.itemActions}>
              <button onClick={() => handleEdit(video)} className={styles.editButton}>
                Tahrirlash
              </button>
              <button onClick={() => handleDelete(video.id)} className={styles.deleteButton}>
                O'chirish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

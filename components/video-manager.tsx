"use client"

import type React from "react"

import { useState, useEffect } from "react"
import styles from "./manager.module.css"

interface Video {
  id: string
  url: string
  title: string
  thumbnailUrl: string
}

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[]>([])
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Load saved videos from localStorage
    const savedVideos = localStorage.getItem("videos")
    if (savedVideos) {
      try {
        setVideos(JSON.parse(savedVideos))
      } catch (error) {
        console.error("Error parsing saved videos:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Save videos to localStorage whenever they change
    localStorage.setItem("videos", JSON.stringify(videos))
  }, [videos])

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const videoId = extractVideoId(url)

    if (!videoId) {
      alert("Noto'g'ri YouTube URL. Iltimos, to'g'ri URL kiriting.")
      return
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`

    if (editingId) {
      // Update existing video
      setVideos(videos.map((video) => (video.id === editingId ? { ...video, url, title, thumbnailUrl } : video)))
      setEditingId(null)
    } else {
      // Add new video
      const newVideo: Video = {
        id: Date.now().toString(),
        url,
        title,
        thumbnailUrl,
      }
      setVideos([...videos, newVideo])
    }

    // Reset form
    setUrl("")
    setTitle("")
  }

  const handleEdit = (video: Video) => {
    setEditingId(video.id)
    setUrl(video.url)
    setTitle(video.title)
  }

  const handleDelete = (id: string) => {
    setVideos(videos.filter((video) => video.id !== id))
  }

  const handleCancel = () => {
    setEditingId(null)
    setUrl("")
    setTitle("")
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Videolar boshqaruvi</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="videoUrl">YouTube video URL</label>
          <input
            type="url"
            id="videoUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={styles.textInput}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="videoTitle">Video sarlavhasi</label>
          <input
            type="text"
            id="videoTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
              <img src={video.thumbnailUrl || "/placeholder.svg"} alt={video.title} className={styles.videoThumbnail} />
              <h3 className={styles.videoTitle}>{video.title}</h3>
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./admin.module.css"
// import ImageManager from "@/components/image-manager"
import VideoManager from "@/components/video-manager"
import PdfManager from "@/components/pdf-manager"

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("videos")
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn !== "true") {
      router.push("/")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    router.push("/")
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1>Admin Panel</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Chiqish
        </button>
      </header>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {/* <button
            className={`${styles.tabButton} ${activeTab === "images" ? styles.active : ""}`}
            onClick={() => setActiveTab("images")}
          >
            Rasmlar
          </button> */}
          <button
            className={`${styles.tabButton} ${activeTab === "videos" ? styles.active : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            Videolar
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "pdfs" ? styles.active : ""}`}
            onClick={() => setActiveTab("pdfs")}
          >
            PDF Kitoblar
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* {activeTab === "images" && <ImageManager />} */}
          {activeTab === "videos" && <VideoManager />}
          {activeTab === "pdfs" && <PdfManager />}
        </div>
      </div>
    </div>
  )
}

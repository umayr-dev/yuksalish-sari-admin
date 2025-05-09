// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import styles from "./manager.module.css"

// interface Image {
//   id: string
//   url: string
// }

// export default function ImageManager() {
//   const [images, setImages] = useState<Image[]>([])
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [preview, setPreview] = useState<string>("")
//   const [editingId, setEditingId] = useState<string | null>(null)

//   // API'dan ma'lumotlarni olish
//   useEffect(() => {
//     const fetchImages = async () => {
//       try {
//         console.log("Fetching images...")
//         const response = await fetch("https://4e439b85aa8b8540.mokky.dev/images")
//         console.log("Fetch response:", response)
        
//         if (!response.ok) {
//           throw new Error("Rasmlarni yuklashda xatolik yuz berdi")
//         }
        
//         const data = await response.json()
//         console.log("Fetched data:", data)
//         setImages(data)
//       } catch (error) {
//         console.error("Fetch error:", error)
//         alert("Rasmlarni yuklashda xatolik yuz berdi.")
//       }
//     }

//     fetchImages()
//   }, [])

//   const uploadFile = async (file: File) => {
//     const formData = new FormData()
    
//     // Asosiy rasm faylini qo'shamiz
//     formData.append("image", file) // yoki API talab qilgan boshqa nom
    
//     // API ga yuborish
//     try {
//         const response = await fetch("https://4e439b85aa8b8540.mokky.dev/images", {
//             method: "POST",
//             body: formData
//         })

//         if (!response.ok) {
//             const errorData = await response.json().catch(() => ({}))
//             throw new Error(errorData.message || "Faylni yuklashda xatolik")
//         }

//         const data = await response.json()
//         console.log("Upload response:", data) // Response'ni tekshirish

//         if (!data.url) {
//             // Agar API url qaytarmasa, local URL yaratamiz
//             const localUrl = URL.createObjectURL(file)
//             return {
//                 id: data.id,
//                 url: localUrl
//             }
//         }

//         return {
//             id: data.id,
//             url: data.url
//         }
//     } catch (error) {
//         console.error("Upload error:", error)
//         throw error
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (selectedFile) {
//         try {
//             const newImage = await uploadFile(selectedFile)
//             console.log("Uploaded image:", newImage) // Response'ni tekshirish uchun

//             if (editingId) {
//                 setImages(prevImages =>
//                     prevImages.map(img => (img.id === editingId ? newImage : img))
//                 )
//                 setEditingId(null)
//             } else {
//                 setImages(prevImages => [...prevImages, newImage])
//             }

//             // Formani tozalash
//             setSelectedFile(null)
//             setPreview("")
//             const fileInput = document.getElementById("imageFile") as HTMLInputElement
//             if (fileInput) fileInput.value = ""
//         } catch (error) {
//             console.error("Submit error:", error)
//             alert(`Xatolik yuz berdi: ${error.message}`)
//         }
//     }
//   }

//   const handleDelete = async (id: string) => {
//     if (window.confirm("Haqiqatan ham bu rasmni o'chirmoqchimisiz?")) {
//         try {
//             const response = await fetch(`https://4e439b85aa8b8540.mokky.dev/images/${id}`, {
//                 method: "DELETE",
//                 // headers ni olib tashlaymiz
//             })

//             if (!response.ok) {
//                 const errorData = await response.json().catch(() => ({}))
//                 throw new Error(errorData.message || "Rasmni o'chirishda xatolik")
//             }

//             // O'chirish muvaffaqiyatli bo'lsa
//             setImages(prevImages => prevImages.filter(img => img.id !== id))
//             alert("Rasm muvaffaqiyatli o'chirildi")
//         } catch (error) {
//             console.error("Delete error:", error)
//             alert(`O'chirishda xatolik: ${error.message}`)
//         }
//     }
//   }

//   const handleEdit = (image: Image) => {
//     setEditingId(image.id)
//     setPreview(image.url)
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0]
//       setSelectedFile(file)

//       // Create preview
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         setPreview(reader.result as string)
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const handleCancel = () => {
//     setEditingId(null)
//     setSelectedFile(null)
//     setPreview("")
//     const fileInput = document.getElementById("imageFile") as HTMLInputElement
//     if (fileInput) fileInput.value = ""
//   }

//   return (
//     <div>
//       <h2 className={styles.sectionTitle}>Rasmlar boshqaruvi</h2>

//       <form onSubmit={handleSubmit} className={styles.form}>
//         <div className={styles.formGroup}>
//           <label htmlFor="imageFile">Rasm tanlang</label>
//           <input
//             type="file"
//             id="imageFile"
//             accept="image/*"
//             onChange={handleFileChange}
//             className={styles.fileInput}
//             required={!editingId}
//           />
//         </div>

//         {preview && (
//           <div className={styles.previewContainer}>
//             <h3>Oldindan ko'rish</h3>
//             <img src={preview || "/placeholder.svg"} alt="Preview" className={styles.preview} />
//           </div>
//         )}

//         <div className={styles.formActions}>
//           <button type="submit" className={styles.submitButton}>
//             {editingId ? "Yangilash" : "Qo'shish"}
//           </button>
//           {editingId && (
//             <button type="button" onClick={handleCancel} className={styles.cancelButton}>
//               Bekor qilish
//             </button>
//           )}
//         </div>
//       </form>

//       <div className={styles.itemsGrid}>
//         {images.map((image) => (
//           <div key={image.id} className={styles.item}>
//             <img src={image.url || "/placeholder.svg"} alt="Uploaded" className={styles.itemImage} />
//             <div className={styles.itemActions}>
//               <button onClick={() => handleEdit(image)} className={styles.editButton}>
//                 Tahrirlash
//               </button>
//               <button onClick={() => handleDelete(image.id)} className={styles.deleteButton}>
//                 O'chirish
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

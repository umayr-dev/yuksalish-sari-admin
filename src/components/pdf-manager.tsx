'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadToS3, deleteFromS3, getSignedDownloadUrl } from '../../lib/s3';
import styles from './manager.module.css';

interface Book {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  createdAt?: string;
}

export default function PdfManager() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Kitoblarni Firebase'dan olish
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const booksCollection = collection(db, 'books');
        const snapshot = await getDocs(booksCollection);
        const booksList = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            // Get a fresh signed URL for each book
            const signedUrl = await getSignedDownloadUrl(data.fileName);
            return {
              id: doc.id,
              ...data,
              fileUrl: signedUrl,
            } as Book;
          }),
        );
        setBooks(booksList);
      } catch (error) {
        console.error('Xatolik:', error);
        setError('Kitoblarni yuklashda xatolik yuz berdi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // PDF faylni S3'ga yuklash
  const uploadPdf = async (file: File): Promise<string> => {
    try {
      // Create safe filename
      const cleanFileName = file.name.replace(/[^a-z0-9_.-]/gi, '_');
      const timestamp = Date.now();
      const finalFileName = `${timestamp}_${cleanFileName}`;

      // Upload to S3
      const fileUrl = await uploadToS3(file, finalFileName);
      return fileUrl;
    } catch (error: any) {
      console.error('Upload error details:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  // Yangi kitob qo'shish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploadProgress('');

    if (!pdfFile || !title || !description) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress('Fayl hajmi tekshirilmoqda...');

      // Fayl hajmini tekshirish (maksimum 100MB)
      if (pdfFile.size > 100 * 1024 * 1024) {
        throw new Error('Fayl hajmi 100MB dan oshmasligi kerak');
      }

      let fileUrl: string;
      try {
        setUploadProgress('Fayl yuklanmoqda...');
        // PDF faylni yuklash
        fileUrl = await uploadPdf(pdfFile);
        console.log('Uploaded URL:', fileUrl);
        setUploadProgress("Fayl yuklandi. Ma'lumotlar saqlanmoqda...");
      } catch (uploadError: any) {
        console.error('Upload error:', uploadError);
        throw new Error(`Faylni yuklashda xatolik: ${uploadError.message}`);
      }

      let docRef;
      try {
        // Firestore'ga ma'lumotlarni saqlash
        const booksCollection = collection(db, 'books');
        docRef = await addDoc(booksCollection, {
          title,
          description,
          fileUrl,
          fileName: pdfFile.name,
          createdAt: new Date().toISOString(),
        });
      } catch (dbError: any) {
        setUploadProgress("Xatolik yuz berdi. Fayl o'chirilmoqda...");
        // If Firestore save fails, try to delete the uploaded file
        try {
          await deleteFromS3(pdfFile.name);
        } catch (deleteError) {
          console.error('Failed to delete file after DB error:', deleteError);
        }
        throw new Error(`Ma\'lumotlarni saqlashda xatolik: ${dbError.message}`);
      }

      // State'ni yangilash
      const newBook = {
        id: docRef.id,
        title,
        description,
        fileUrl,
        fileName: pdfFile.name,
        createdAt: new Date().toISOString(),
      };
      setBooks((prevBooks) => [...prevBooks, newBook]);

      // Formani tozalash
      setTitle('');
      setDescription('');
      setPdfFile(null);
      const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      setUploadProgress('Muvaffaqiyatli yakunlandi!');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error: any) {
      console.error('Xatolik:', error);
      setError(error.message || 'Xatolik yuz berdi');
      setUploadProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  // Kitobni o'chirish
  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm("Haqiqatan ham bu kitobni o'chirmoqchimisiz?")) return;

    try {
      setIsLoading(true);
      // S3'dan faylni o'chirish
      await deleteFromS3(fileName);

      // Firestore'dan hujjatni o'chirish
      await deleteDoc(doc(db, 'books', id));

      // State'ni yangilash
      setBooks(books.filter((book) => book.id !== id));
      alert("Kitob muvaffaqiyatli o'chirildi!");
    } catch (error) {
      console.error('Xatolik:', error);
      setError("Kitobni o'chirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p>{uploadProgress || 'Yuklanmoqda...'}</p>
        </div>
      </div>
    );
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Yuklanmoqda...' : 'Yuklash'}
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
              <div className={styles.bookHeader}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                <span className={styles.bookDate}>
                  {new Date(book.createdAt || '').toLocaleDateString('uz-UZ')}
                </span>
              </div>
              <p className={styles.bookDescription}>{book.description}</p>
              <div className={styles.bookMeta}>
                <span className={styles.fileName}>{book.fileName}</span>
              </div>
              <div className={styles.bookActions}>
                <a
                  href={book.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadLink}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Yuklab olish
                </a>
                <button
                  onClick={() => handleDelete(book.id, book.fileName)}
                  className={styles.deleteButton}
                  disabled={isLoading}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react"
import axios from "axios"

function FileLibrary({ onFileSelect }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/upload/files`)
      setFiles(res.data)
    } catch (err) {
      console.error("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/upload/files/${id}`)
      fetchFiles()
    } catch (err) {
      console.error("Failed to delete file")
    }
  }

  if (loading || files.length === 0) return null

  return (
    <div style={{
      background: "rgba(0, 180, 210, 0.06)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(0, 220, 240, 0.12)",
      borderRadius: "18px",
      padding: "1.5rem",
      marginBottom: "1.25rem",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(0,220,240,0.3), transparent)"
      }} />

      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "0.72rem",
        fontWeight: 700,
        color: "rgba(0, 220, 240, 0.5)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "1rem"
      }}>My Textbooks</p>

      {files.map((file) => (
        <div key={file.id} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 0",
          borderBottom: "1px solid rgba(0,200,220,0.07)"
        }}>
          <div>
            <span style={{ fontWeight: 500, color: "#e0f0f8" }}>{file.filename}</span>
            <span style={{ fontSize: "0.78rem", color: "rgba(200,235,245,0.3)", marginLeft: "0.5rem" }}>
              {file.chapters.length} chapters
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => onFileSelect({
                filename: file.filename,
                file_path: file.file_path,
                file_type: file.file_type,
                chapters: file.chapters
              })}
              style={{
                padding: "0.3rem 0.75rem",
                background: "rgba(0, 180, 220, 0.2)",
                color: "#00e5ff",
                border: "1px solid rgba(0, 220, 240, 0.3)",
                borderRadius: "7px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Load
            </button>
            <button
              onClick={() => handleDelete(file.id)}
              style={{
                padding: "0.3rem 0.75rem",
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "7px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FileLibrary
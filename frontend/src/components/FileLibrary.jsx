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
      const res = await axios.get("http://127.0.0.1:8000/upload/files")
      setFiles(res.data)
    } catch (err) {
      console.error("Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/upload/files/${id}`)
      fetchFiles()
    } catch (err) {
      console.error("Failed to delete file")
    }
  }

  if (loading) return <p style={{ color: "#666" }}>Loading your files...</p>

  if (files.length === 0) return null

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>My Textbooks</h3>
      {files.map((file) => (
        <div key={file.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
          <div>
            <strong>{file.filename}</strong>
            <span style={{ color: "#666", fontSize: "0.85rem", marginLeft: "0.5rem" }}>
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
              style={{ padding: "0.3rem 0.75rem", background: "#6c63ff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Load
            </button>
            <button
              onClick={() => handleDelete(file.id)}
              style={{ padding: "0.3rem 0.75rem", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
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
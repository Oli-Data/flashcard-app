import { useState } from "react"
import axios from "axios"

function Upload({ onUpload }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload/", formData)
      onUpload(res.data)
    } catch (err) {
      setError("Failed to upload file. Make sure it's a PDF, DOCX, or EPUB.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: "2px dashed #ccc", padding: "2rem", textAlign: "center", borderRadius: "8px", marginBottom: "1rem" }}>
      <h2>Upload Textbook</h2>
      <p>Supported formats: PDF, DOCX, EPUB</p>
      <input type="file" accept=".pdf,.docx,.epub" onChange={handleUpload} />
      {loading && <p>Uploading and parsing file...</p>}
      {fileName && !loading && <p>Loaded: {fileName}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  )
}

export default Upload
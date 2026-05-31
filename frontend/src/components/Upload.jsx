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
    <div style={{
      background: "rgba(0, 180, 210, 0.06)",
      backdropFilter: "blur(24px)",
      border: "2px dashed rgba(0, 220, 240, 0.2)",
      borderRadius: "18px",
      padding: "2rem",
      marginBottom: "1.25rem",
      textAlign: "center",
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
        marginBottom: "0.75rem"
      }}>Upload Textbook</p>

      <p style={{ color: "rgba(200, 235, 245, 0.4)", fontSize: "0.85rem", marginBottom: "1rem" }}>
        Supported formats: PDF, DOCX, EPUB
      </p>

      <input
        type="file"
        accept=".pdf,.docx,.epub"
        onChange={handleUpload}
        style={{
          color: "rgba(200,235,245,0.6)",
          fontSize: "0.88rem"
        }}
      />

      {loading && <p style={{ color: "rgba(0,220,240,0.7)", marginTop: "0.75rem", fontSize: "0.88rem" }}>Uploading and parsing file...</p>}
      {fileName && !loading && <p style={{ color: "rgba(0,220,240,0.6)", marginTop: "0.75rem", fontSize: "0.88rem" }}>Loaded: {fileName}</p>}
      {error && <p style={{ color: "#f87171", marginTop: "0.75rem", fontSize: "0.88rem" }}>{error}</p>}
    </div>
  )
}

export default Upload
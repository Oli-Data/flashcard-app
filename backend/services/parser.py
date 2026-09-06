import fitz  # PyMuPDF
import docx
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import os
import zipfile

def parse_pdf(file_path: str) -> dict:
    """
    Parse a PDF file and extract chapters as a dictionary.
    Uses the table of contents if available, otherwise splits by page groups.
    """
    with fitz.open(file_path) as doc:
        chapters = {}
        if len(doc) > 2000:
            raise ValueError("PDFs must have 2,000 pages or fewer")
        toc = [entry for entry in doc.get_toc()
               if entry[0] == 1 and 1 <= entry[2] <= len(doc)]
        toc.sort(key=lambda entry: entry[2])
        if toc:
            # Subsections must not truncate their parent chapter.
            for i, (_, title, page) in enumerate(toc):
                end_page = next((e[2] - 1 for e in toc[i + 1:] if e[2] > page), len(doc))
                label = title if title not in chapters else f"{title} (page {page})"
                chapters[label] = "\n".join(doc[p].get_text() for p in range(page - 1, end_page)).strip()
        else:
            for i in range(0, len(doc), 10):
                end = min(i + 10, len(doc))
                chapters[f"Pages {i+1}-{end}"] = "\n".join(doc[p].get_text() for p in range(i, end)).strip()
        return chapters

def parse_docx(file_path: str) -> dict:
    """
    Parse a DOCX file and extract chapters based on Heading 1 styles.
    Falls back to a single 'Introduction' chapter if no headings are found.
    """
    doc = docx.Document(file_path)
    chapters = {}
    current_chapter = "Introduction"
    current_text = []

    for para in doc.paragraphs:
        if para.style.name.startswith("Heading 1"):
            # Save previous chapter when a new heading is found
            if current_text:
                chapters[current_chapter] = " ".join(current_text).strip()
            current_chapter = para.text
            current_text = []
        else:
            if para.text.strip():
                current_text.append(para.text)

    # Save the final chapter
    if current_text:
        chapters[current_chapter] = " ".join(current_text).strip()

    return chapters

def parse_epub(file_path: str) -> dict:
    """
    Parse an EPUB file and extract chapters from document items.
    Uses BeautifulSoup to strip HTML tags from content.
    """
    book = epub.read_epub(file_path)
    chapters = {}

    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_DOCUMENT:
            soup = BeautifulSoup(item.get_content(), "html.parser")
            title = soup.find(["h1", "h2"])
            title_text = title.get_text() if title else item.get_name()
            body_text = soup.get_text(separator=" ", strip=True)
            if body_text:
                chapters[title_text] = body_text

    return chapters

def parse_file(file_path: str) -> dict:
    """
    Route a file to the correct parser based on its extension.
    Supports PDF, DOCX, and EPUB formats.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext in {".docx", ".epub"}:
        with zipfile.ZipFile(file_path) as archive:
            if sum(item.file_size for item in archive.infolist()) > 100 * 1024 * 1024:
                raise ValueError("Document expands beyond the supported size")

    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext == ".docx":
        return parse_docx(file_path)
    elif ext == ".epub":
        return parse_epub(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

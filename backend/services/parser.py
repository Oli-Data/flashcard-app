import fitz  # PyMuPDF
import docx
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import os

def parse_pdf(file_path: str) -> dict:
    """
    Parse a PDF file and extract chapters as a dictionary.
    Uses the table of contents if available, otherwise splits by page groups.
    """
    doc = fitz.open(file_path)
    chapters = {}
    toc = doc.get_toc()

    if toc:
        # Use table of contents to identify chapter boundaries
        for i, entry in enumerate(toc):
            level, title, page = entry
            if level == 1:  # Top level chapters only
                start_page = page - 1
                end_page = toc[i + 1][2] - 1 if i + 1 < len(toc) else len(doc)
                text = ""
                for p in range(start_page, end_page):
                    text += doc[p].get_text()
                chapters[title] = text.strip()
    else:
        # No TOC available — split into chunks of 10 pages
        total_pages = len(doc)
        chunk_size = 10
        for i in range(0, total_pages, chunk_size):
            text = ""
            for p in range(i, min(i + chunk_size, total_pages)):
                text += doc[p].get_text()
            chapters[f"Pages {i+1}-{min(i+chunk_size, total_pages)}"] = text.strip()

    doc.close()
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

    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext == ".docx":
        return parse_docx(file_path)
    elif ext == ".epub":
        return parse_epub(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
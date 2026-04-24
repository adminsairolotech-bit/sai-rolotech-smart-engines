# Attachment Fetcher

## Triggers
- User wants to analyze/download chat attachments
- User says "attachment", "download file", "analyze image", "read PDF"

## What It Does

### 1. Attachment Detection
```
Message → Check for Attachments → Fetch Metadata

Types:
- Images: jpg, png, gif, webp
- Documents: pdf, doc, docx, xls, xlsx
- Audio: mp3, wav, ogg, aac
- Video: mp4, mov, avi
- Archives: zip, rar, 7z
- Other: Any file type
```

### 2. Metadata Extraction
```
For Images:
- Dimensions (width × height)
- File size
- Format/Codec
- EXIF data (if available)
- OCR text (if requested)

For Documents:
- Page count
- File size
- Title/Author (from metadata)
- First 500 characters (preview)

For PDFs:
- Page count
- Text content (searchable)
- Images embedded
```

### 3. Analysis Options
```
IMAGE:
- "describe" → What is in this image?
- "extract text" → OCR
- "read" → Full analysis (screenshots, docs)

AUDIO:
- "transcribe" → Convert to text
- "summarize" → Key points

DOCUMENT:
- "summarize" → Executive summary
- "extract key points" → Bullet summary
- "find X" → Search within
```

### 4. Storage & Forwarding
```
Download to:
- Local project folder
- Cloud storage
- Forward to email
- Forward to another chat

Naming:
Auto-generate: {date}_{sender}_{type}_{sequence}
Example: 2024-01-15_john_invoice_001.pdf
```

## Quick Commands
| Command | Action |
|---------|--------|
| `get attachments` | Show all in chat |
| `download last` | Download last attachment |
| `analyze image` | AI analysis |
| `ocr` | Extract text from image |

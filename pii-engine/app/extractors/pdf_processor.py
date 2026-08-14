import fitz
import io
from typing import List, Dict, Any

class PDFProcessor:
    def redact_pdf(self, file_bytes: bytes, entities: List[Dict[str, Any]]) -> bytes:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        # We collect all unique texts to redact. We use the actual detected text to search the PDF.
        # This is because mapping linear text offsets back to PDF bounding boxes across
        # node (pdf-parse) and python (PyMuPDF) is highly unreliable due to different text extraction algorithms.
        strings_to_redact = set()
        for e in entities:
            if e.get("redact", False):
                # We need the original text that was detected as PII
                original_text = e.get("text") or e.get("original")
                if original_text:
                    strings_to_redact.add(original_text.strip())
        
        for page in doc:
            for text in strings_to_redact:
                # search for the text on the page
                text_instances = page.search_for(text)
                for inst in text_instances:
                    # Add redaction annotation (a black box by default)
                    page.add_redact_annot(inst, fill=(0, 0, 0))
            
            # Apply all redaction annotations on the page
            page.apply_redactions()
            
        output_buffer = io.BytesIO()
        doc.save(output_buffer, garbage=3, deflate=True)
        doc.close()
        return output_buffer.getvalue()

import sys
import io
import asyncio
from app.services.pii_service import PIIService
from app.extractors.document_processor import DocumentProcessor

class MockUploadFile:
    def __init__(self, content):
        self.content = content
    
    async def read(self):
        return self.content

async def main():
    if len(sys.argv) < 3:
        print("Usage: python redact.py <input.docx> <output.docx>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    print(f"[*] Reading {input_path}...")
    try:
        with open(input_path, 'rb') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find file {input_path}")
        sys.exit(1)
        
    pii_service = PIIService()
    processor = DocumentProcessor(pii_service)
    
    # 1. Analyze Document
    print("[*] Analyzing document for PII...")
    file_mock = MockUploadFile(content)
    stats = await processor.analyze_document(file_mock, input_path)
    
    entities = stats.get("entities", [])
    print(f"[*] Detected {len(entities)} PII instances.")
    
    if len(entities) == 0:
        print("[*] No PII detected. Saving a copy of original document.")
        with open(output_path, 'wb') as f:
            f.write(content)
        sys.exit(0)
        
    # 2. Redact Document
    print("[*] Redacting document...")
    file_mock = MockUploadFile(content)
    redacted_content, ext = await processor.redact_document(file_mock, input_path, entities)
    
    # 3. Save Output
    with open(output_path, 'wb') as f:
        f.write(redacted_content)
        
    print(f"[+] Successfully saved redacted document to {output_path}")

if __name__ == "__main__":
    asyncio.run(main())

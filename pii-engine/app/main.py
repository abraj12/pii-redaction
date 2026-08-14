from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from typing import Optional, List, Dict, Any
import uvicorn
import os
import json
import traceback

from app.services.pii_service import PIIService
from app.extractors.document_processor import DocumentProcessor
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    text: str
    filename: str

from contextlib import asynccontextmanager
import threading

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] Starting FastAPI")
    threading.Thread(target=pii_service.initialize).start()
    yield
    print("[SHUTDOWN] Application shutting down")

app = FastAPI(title="PII Redaction Engine API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pii_service = PIIService()
document_processor = DocumentProcessor(pii_service)

@app.get("/healthz")
async def health_check_z():
    return {"status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "pii-redaction-engine"}

@app.post("/api/v1/analyze")
async def analyze_document(request: AnalyzeRequest):
    try:
        stats = await document_processor.analyze_document_text(request.text, request.filename)
        return JSONResponse(content=stats)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/redact")
async def redact_document(
    file: UploadFile = File(...),
    entities: str = Form(...) # JSON string of entities array
):
    try:
        entities_list = json.loads(entities)
        redacted_bytes, ext = await document_processor.redact_document(file, file.filename, entities_list)
        
        if ext == "docx":
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif ext == "pdf":
            media_type = "application/pdf"
        else:
            media_type = "text/plain"
        
        headers = {
            "X-File-Extension": ext,
            "Access-Control-Expose-Headers": "X-File-Extension"
        }
        
        return Response(content=redacted_bytes, media_type=media_type, headers=headers)
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

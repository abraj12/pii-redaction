FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for pymupdf, tesseract OCR, and others
RUN apt-get update && apt-get install -y gcc g++ libffi-dev tesseract-ocr tesseract-ocr-eng

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_lg

COPY ./app ./app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

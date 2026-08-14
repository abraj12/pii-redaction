# PII Engine

This directory contains the Python microservice responsible for heavy-lifting NLP and data redaction.

## Tech Stack
- Python 3.10+
- FastAPI
- Microsoft Presidio (Analyzer & Anonymizer)
- spaCy (`en_core_web_lg`)
- PyMuPDF / python-docx

## Detection Architecture
The engine uses Microsoft Presidio's `AnalyzerEngine` backed by the `en_core_web_lg` spaCy model.
We detect 9 specific entity types:
- `PERSON` (NER)
- `EMAIL_ADDRESS` (Regex)
- `PHONE_NUMBER` (Regex/Context)
- `ORGANIZATION` (NER)
- `LOCATION` / `ADDRESS` (NER)
- `US_SSN` (Regex with checksum)
- `CREDIT_CARD` (Regex with Luhn checksum validation)
- `DATE_TIME` (Contextual NLP)
- `IP_ADDRESS` (Regex)

## Redaction Strategy
To ensure consistency (e.g. "Rashi Patil" is mapped to "John Doe" everywhere in the document), we implemented a custom `Operator` named `ConsistentFakerOperator` which hooks into the `AnonymizerEngine`. It maintains a document-level dictionary mapping original strings to synthetic fake replacements.

## Running Locally
```bash
python -m venv venv
# Activate virtual environment
pip install -r requirements.txt
python -m spacy download en_core_web_lg
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Server starts on `http://localhost:8000`.

# PII Redaction Tool

Protect, redact, and preserve documents with a React frontend, Express/MongoDB backend, and FastAPI PII engine powered by Presidio and spaCy.

## Architecture

- `frontend/`: React, Vite, Tailwind UI for upload, processing, review, redaction, and results.
- `backend/`: Express API, MongoDB models, auth, upload/download authorization, in-process document jobs.
- `pii-engine/`: FastAPI service for PII analysis and redaction.
- `mongodb`: Stores users, document records, PII metadata, status, retention expiry, and audit logs.

Processing flow:

1. Upload creates a document record with status `uploaded`.
2. Processing job validates and extracts text.
3. Backend sends text to the PII engine in chunks.
4. Entities are merged, deduplicated, and saved.
5. User reviews selected entities.
6. Redaction job generates an output file.
7. Backend extracts the output again and verifies selected original values are gone.

## Environment

Copy `.env.example` and set:

- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: required; no fallback secret is used.
- `PII_ENGINE_URL`: local development uses `http://localhost:8000`; Docker uses `http://pii-engine:8000`.
- `MAX_FILE_SIZE`: upload limit in MB.
- `ANONYMOUS_RETENTION_HOURS`: anonymous document retention.
- `USER_FILE_RETENTION_DAYS` or `RETENTION_DAYS`: authenticated document retention.
- `EXTRACTION_TIMEOUT_MS`, `PII_TIMEOUT_MS`, `REDACTION_TIMEOUT_MS`, `TOTAL_PROCESSING_TIMEOUT_MS`: processing safety limits.
- `PII_CHUNK_SIZE`, `PII_CHUNK_OVERLAP`: large document PII chunking.

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

```bash
cd pii-engine
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_lg
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Start MongoDB locally on `mongodb://127.0.0.1:27017`.

## Docker

```bash
docker compose up --build
```

Docker service-to-service communication must not use localhost. Backend uses:

```env
PII_ENGINE_URL=http://pii-engine:8000
MONGODB_URI=mongodb://mongodb:27017/pii-redaction
```

## Supported Formats

- TXT
- DOCX
- PDF with a text layer

Image-only/scanned PDF detection is recognized as an OCR requirement. If a PDF has insufficient text and OCR is unavailable, processing fails with `OCR_UNAVAILABLE` instead of returning fake `0 PII`.

## PII Types

The detector supports names, emails, phone numbers, organizations, locations, addresses, SSNs, credit cards, dates/DOB, IP addresses, PAN, Aadhaar, passport, driving licence, bank account, and IFSC.

## Status Lifecycle

Canonical statuses:

`uploaded`, `validating`, `extracting`, `ocr_processing`, `detecting_pii`, `classifying`, `redacting`, `verifying`, `completed`, `completed_no_pii`, `redacted`, `failed`, `extraction_failed`, `redaction_verification_failed`, `cancelled`.

Polling `GET /api/documents/:id/status` is read-only and never starts work.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/documents/upload`
- `GET /api/documents`
- `GET /api/documents/:id`
- `POST /api/documents/:id/process`
- `GET /api/documents/:id/status`
- `GET /api/documents/:id/results`
- `POST /api/documents/:id/redact`
- `GET /api/documents/:id/download`
- `DELETE /api/documents/:id`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/audit-logs`

Anonymous users can upload, analyze, review, redact, and download using their `x-anonymous-session-id`. Login adds saved history and admin/account capabilities.

## Security And Privacy

- JWT secret is required at startup.
- Protected requests verify JWT and reload the current user from MongoDB.
- Disabled or deleted users lose access immediately.
- Anonymous document access requires the matching anonymous session id.
- Download authorization checks document ownership/session before serving files.
- Upload validation checks extension, MIME, size, and extraction-time file signatures.
- Raw PII should not be logged.
- Retention uses a MongoDB TTL index on `expiresAt`.

## DOCX Extraction

DOCX extraction uses Mammoth first and validates minimum text and word count. If output is empty or suspiciously small, it falls back to OOXML package parsing for `word/document.xml`, headers, footers, footnotes, endnotes, comments, tables, and text boxes represented by `w:t` nodes. Fragmented character sequences are normalized conservatively.

## Redaction

DOCX redaction traverses paragraphs, tables, headers, and footers with `python-docx`, builds logical paragraph text from runs, replaces selected entities, and preserves document structure. After redaction, backend extracts the generated output again and verifies selected original values are absent before marking `redacted`.

## Evaluation

Run:

```bash
python scripts/evaluate.py
```

It generates:

- `reports/evaluation-report.md`
- `reports/evaluation-report.json`

Metrics include TP, FP, FN, precision, recall, F1, accuracy, and category breakdown.

## Testing

Useful checks:

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```

```bash
cd pii-engine
python -m pytest
```

Large document regression should include the simple PII DOCX and the Red Herring Prospectus DOCX when those files are available locally.

## Known Limitations

- OCR is surfaced as unavailable unless OCR tooling is installed and wired in.
- PDF redaction still emits DOCX output for text PDFs.
- DOCX run-aware redaction preserves structure but may simplify formatting within a paragraph that contains a replacement.
- Verification currently checks selected original strings are absent; a stronger future verifier can rerun full PII analysis on the output and compare categories.

## PRODUCTION DEPLOYMENT

The application is configured to be securely deployed using Vercel (Frontend), Render (Backend), and MongoDB Atlas.

### 1. MongoDB Atlas
1. Create a free/paid cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with a strong password.
3. Under "Network Access", allow access from anywhere (`0.0.0.0/0`) or specifically Render's outbound IPs.
4. Obtain your connection string. It will look like: `mongodb+srv://<username>:<password>@cluster0.../pii-redaction`

### 2. GitHub
Ensure your repository is pushed to GitHub, GitLab, or BitBucket as Render and Vercel will link directly to it.

### 3. Render: Infrastructure setup (`render.yaml`)
The project contains a `render.yaml` Blueprint which defines:
- **`pii-engine`**: A **Private Service** running via Docker (includes Tesseract OCR).
- **`pii-backend`**: A **Web Service** running Node.js.

1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml`.
5. You will be prompted to supply the environment variables defined in the blueprint:
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string.
   - `FRONTEND_URL`: Leave blank for now, or put a temporary URL. You will update this after deploying to Vercel.
6. Render will build and deploy the PII Engine (privately) and the Backend Web Service.
7. Once the `pii-backend` finishes deploying, copy its public URL (e.g., `https://pii-backend-abc.onrender.com`).

### 4. Vercel: Frontend Deployment
1. Go to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. **Root Directory**: Click Edit and select `frontend`.
5. **Framework Preset**: Vite (should be auto-detected).
6. **Environment Variables**: Add exactly one variable:
   - Name: `VITE_API_URL`
   - Value: `https://pii-backend-abc.onrender.com/api` (The URL you copied from Render, with `/api` appended).
7. Click **Deploy**.
8. Once deployed, copy your Vercel frontend URL (e.g., `https://pii-frontend-xyz.vercel.app`).

### 5. Finalize Configuration (CORS)
1. Go back to your Render Dashboard.
2. Select your `pii-backend` Web Service.
3. Go to **Environment**.
4. Update the `FRONTEND_URL` to match your Vercel URL exactly (e.g., `https://pii-frontend-xyz.vercel.app`).
5. Render will automatically restart the backend with the updated CORS policy.

### 6. Verification & Health Checks
- **Backend Health**: Visit `https://pii-backend-abc.onrender.com/healthz`. You should see `{"status":"ok"}`.
- **Frontend Connectivity**: Open your Vercel app. Register an account, log in, and attempt to upload a test document. The complete pipeline (Extraction -> Detection -> Redaction -> Verification) should complete successfully.

### Security Warning
- The PII Engine is purposefully deployed as a **Private Service**. It is entirely isolated from the public internet and can only be accessed internally by the Node.js backend. Do **NOT** change it to a public Web Service.
- Never commit `.env` files. The repository is locked down via `.gitignore`.
- Production JWT secrets are dynamically generated and injected by Render.

import express from 'express';
import { uploadDocument, processDocument, getDocuments, getLatestRedacted, getDocument, getDocumentResults, downloadRedacted, deleteDocument, getDocumentStatus, redactDocument, getDocumentReport, downloadReport } from '../controllers/document.controller';
import { protect, optionalAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

router.post('/upload', optionalAuth, upload.single('file'), uploadDocument);
router.post('/:id/process', optionalAuth, processDocument);
router.post('/:id/redact', optionalAuth, redactDocument);
router.get('/latest-redacted', optionalAuth, getLatestRedacted);
router.get('/', optionalAuth, getDocuments);
router.get('/:id', optionalAuth, getDocument);
router.get('/:id/status', optionalAuth, getDocumentStatus);
router.get('/:id/report', optionalAuth, getDocumentReport);
router.get('/:id/report/download', optionalAuth, downloadReport);
router.get('/:id/results', optionalAuth, getDocumentResults);
router.get('/:id/download', optionalAuth, downloadRedacted);
router.delete('/:id', optionalAuth, deleteDocument);

export default router;

import fs from 'fs';
import path from 'path';
import { Document } from '../models/Document';
import { DOCUMENT_STATUSES } from '../constants/documentStatus';
import { extractDocumentText } from './documentExtractionService';
import { analyzeText } from './pii.service';
import { env } from '../config/env';

const uploadsDir = () => path.join(process.cwd(), 'uploads');

const failDocument = async (docId: string, status: string, code: string, message: string) => {
    await Document.findByIdAndUpdate(docId, {
        status,
        errorCode: code,
        statusMessage: message
    }, { runValidators: true });
};

export const startProcessingJob = (docId: string): void => {
    void processDocumentJob(docId);
};

export const processDocumentJob = async (docId: string): Promise<void> => {
    const started = Date.now();
    const timeout = setTimeout(() => {
        void failDocument(docId, DOCUMENT_STATUSES.FAILED, 'TOTAL_PROCESSING_TIMEOUT', 'Document processing timed out.');
    }, env.totalProcessingTimeoutMs);

    try {
        const doc: any = await Document.findById(docId);
        if (!doc) return;

        const filePath = path.join(uploadsDir(), doc.storedFilename);
        if (!fs.existsSync(filePath)) {
            await failDocument(docId, DOCUMENT_STATUSES.FAILED, 'FILE_NOT_FOUND', 'Uploaded file was not found on disk.');
            return;
        }

        await Document.findByIdAndUpdate(docId, {
            status: DOCUMENT_STATUSES.EXTRACTING,
            statusMessage: 'Extracting document text...'
        }, { runValidators: true });

        let extraction;
        try {
            extraction = await extractDocumentText(filePath, doc.originalFilename);
        } catch (error: any) {
            await failDocument(docId, DOCUMENT_STATUSES.EXTRACTION_FAILED, 'EXTRACTION_FAILED', error.message);
            return;
        }

        await Document.findByIdAndUpdate(docId, {
            extractedCharacters: extraction.characterCount,
            extractedWords: extraction.wordCount,
            extractionMetadata: {
                characterCount: extraction.characterCount,
                wordCount: extraction.wordCount,
                paragraphCount: extraction.paragraphCount,
                tableCount: extraction.tableCount,
                extractionMethod: extraction.extractionMethod,
                warnings: extraction.warnings,
                durationMs: extraction.durationMs,
                ocrUsed: extraction.ocrUsed,
                pagesProcessed: extraction.pagesProcessed
            }
        });

        await Document.findByIdAndUpdate(docId, {
            status: DOCUMENT_STATUSES.DETECTING_PII,
            statusMessage: 'Scanning for personally identifiable information...'
        }, { runValidators: true });

        let stats;
        try {
            stats = await analyzeText(extraction.text, doc.originalFilename);
        } catch (error: any) {
            await failDocument(docId, DOCUMENT_STATUSES.FAILED, 'PII_DETECTION_FAILED', `PII detection failed: ${error.message}`);
            return;
        }

        await Document.findByIdAndUpdate(docId, {
            status: DOCUMENT_STATUSES.CLASSIFYING,
            statusMessage: 'Classifying detected information...'
        }, { runValidators: true });

        const finalStatus = stats.total_pii > 0 ? DOCUMENT_STATUSES.COMPLETED : DOCUMENT_STATUSES.COMPLETED_NO_PII;
        await Document.findByIdAndUpdate(docId, {
            status: finalStatus,
            statusMessage: stats.total_pii > 0 ? 'Analysis complete' : 'No PII found',
            totalPII: stats.total_pii,
            piiBreakdown: stats.breakdown,
            detectedEntities: stats.entities,
            processingTime: Date.now() - started
        }, { runValidators: true });
    } catch (error: any) {
        await failDocument(docId, DOCUMENT_STATUSES.FAILED, 'PROCESSING_FAILED', error.message);
    } finally {
        clearTimeout(timeout);
    }
};

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { Document } from '../models/Document';
import { DOCUMENT_STATUSES } from '../constants/documentStatus';
import { env } from '../config/env';
import { extractDocumentText } from './documentExtractionService';
import type { PiiEntity } from './pii.service';

const uploadsDir = () => path.join(process.cwd(), 'uploads');
const generatedDir = () => path.join(process.cwd(), 'generated');

export const startRedactionJob = (docId: string, entities: PiiEntity[]): void => {
    void redactDocumentJob(docId, entities);
};

const selectedOriginalTexts = (entities: PiiEntity[]): string[] => (
    Array.from(new Set(entities.filter((entity) => entity.redact !== false).map((entity) => entity.text).filter(Boolean)))
);

export const redactDocumentJob = async (docId: string, entities: PiiEntity[]): Promise<void> => {
    const started = Date.now();
    try {
        const doc: any = await Document.findById(docId);
        if (!doc) return;

        const filePath = path.join(uploadsDir(), doc.storedFilename);
        if (!fs.existsSync(filePath)) {
            await Document.findByIdAndUpdate(docId, {
                status: DOCUMENT_STATUSES.FAILED,
                errorCode: 'FILE_NOT_FOUND',
                statusMessage: 'Uploaded file was not found on disk.'
            }, { runValidators: true });
            return;
        }

        await Document.findByIdAndUpdate(docId, {
            status: DOCUMENT_STATUSES.REDACTING,
            statusMessage: 'Replacing sensitive information...'
        }, { runValidators: true });

        const entitiesToRedact = entities && entities.length > 0 ? entities : (doc.detectedEntities || []);

        // Deduplicate overlapping entities to send a significantly smaller payload to FastAPI
        const uniqueEntitiesMap = new Map<string, PiiEntity>();
        let deduplicatedCount = 0;
        let overlapCount = 0;

        for (const e of entitiesToRedact) {
            if (e.redact === false) continue;
            if (e.text && !uniqueEntitiesMap.has(e.text)) {
                uniqueEntitiesMap.set(e.text, e);
                deduplicatedCount++;
            } else if (e.text) {
                overlapCount++;
            }
        }
        
        const deduplicatedEntities = Array.from(uniqueEntitiesMap.values());
        
        console.log(`[REDACTION DEBUG] Detected: ${doc.totalPII} | Deduplicated: ${deduplicatedCount} | Overlapping: ${overlapCount} | Final Targets: ${deduplicatedEntities.length}`);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), doc.originalFilename);
        formData.append('entities', JSON.stringify(deduplicatedEntities));

        const response = await axios.post(`${env.piiEngineUrl}/api/v1/redact`, formData, {
            headers: { ...formData.getHeaders() },
            responseType: 'arraybuffer',
            timeout: env.redactionTimeoutMs
        });

        if (!fs.existsSync(generatedDir())) fs.mkdirSync(generatedDir(), { recursive: true });
        const ext = response.headers['x-file-extension'] || 'docx';
        const redactedFilename = `redacted-${doc._id}.${ext}`;
        const redactedPath = path.join(generatedDir(), redactedFilename);
        
        console.log(`[REDACTION DEBUG]\nCREATED OUTPUT:\n${redactedPath}`);
        fs.writeFileSync(redactedPath, response.data);

        // Check if output is identical
        const crypto = require('crypto');
        const inHash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
        const outHash = crypto.createHash('sha256').update(fs.readFileSync(redactedPath)).digest('hex');
        
        if (inHash === outHash) {
            console.log(`[REDACTION DEBUG] OUTPUT IDENTICAL TO INPUT. FAILING CLOSED.`);
            await Document.findByIdAndUpdate(docId, {
                status: DOCUMENT_STATUSES.FAILED,
                errorCode: 'REDACTION_OUTPUT_UNCHANGED',
                statusMessage: 'Redacted file is identical to original file.'
            }, { runValidators: true });
            return;
        }

        await Document.findByIdAndUpdate(docId, {
            status: DOCUMENT_STATUSES.VERIFYING,
            statusMessage: 'Verifying redacted output...',
            redactedFilename
        }, { runValidators: true });

        const verificationStarted = Date.now();
        const verificationExtraction = await extractDocumentText(redactedPath, `redacted.${ext}`);
        
        // Remove redaction placeholders from the extracted text before verifying,
        // so that original PII values that happen to be substrings of the placeholder
        // (like "PAN" inside "[REDACTED_PAN]") do not trigger false positives.
        const textWithoutPlaceholders = verificationExtraction.text.replace(/\[REDACTED_[A-Z_]+\]/g, '');
        const remaining = selectedOriginalTexts(entitiesToRedact).filter((text) => textWithoutPlaceholders.includes(text));

        if (remaining.length > 0) {
            console.log(`[VERIFICATION DEBUG] ----------------------------------------`);
            console.log(`[VERIFICATION DEBUG] FAILED PII ITEMS: ${remaining.length}`);
            remaining.forEach((r, idx) => {
                const safeValue = r.substring(0, 2) + '*'.repeat(Math.max(1, r.length - 2));
                const originalType = entitiesToRedact.find((e: any) => e.text === r)?.type || 'UNKNOWN';
                console.log(`[VERIFICATION DEBUG] Item ${idx + 1} | Type: ${originalType} | Length: ${r.length} | Masked: ${safeValue}`);
            });
            console.log(`[VERIFICATION DEBUG] ----------------------------------------`);
        }

        const verificationTimeMs = Date.now() - verificationStarted;
        const totalProcessingTimeMs = Date.now() - started;

        await Document.findByIdAndUpdate(docId, {
            status: remaining.length === 0 ? DOCUMENT_STATUSES.REDACTED : DOCUMENT_STATUSES.REDACTION_VERIFICATION_FAILED,
            statusMessage: remaining.length === 0 ? 'Document successfully redacted and verified.' : 'Redaction verification failed.',
            processingTime: totalProcessingTimeMs,
            verificationMetadata: {
                verificationPassed: remaining.length === 0,
                remainingPiiCount: remaining.length,
                failedEntities: remaining.slice(0, 5), // Keep up to 5 as a sample (if we wanted to show them, but we mask them in UI anyway)
                deduplicatedEntities: deduplicatedCount,
                overlapCount: overlapCount,
                finalRedactionTargets: deduplicatedEntities.length,
                redactionTimeMs: verificationStarted - started,
                verificationTimeMs,
                totalTimeMs: totalProcessingTimeMs
            }
        }, { runValidators: true });
        
        if (remaining.length > 0) return;
    } catch (error: any) {
        await Document.findByIdAndUpdate(docId, {
            status: DOCUMENT_STATUSES.FAILED,
            errorCode: 'REDACTION_FAILED',
            statusMessage: `Redaction failed: ${error.message}`
        }, { runValidators: true });
    }
};

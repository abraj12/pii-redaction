import { Response } from 'express';
import fs from 'fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import path from 'path';
import { Document } from '../models/Document';
import { DOCUMENT_STATUSES } from '../constants/documentStatus';
import { env } from '../config/env';
import { startProcessingJob } from '../services/processing.service';
import { startRedactionJob } from '../services/redaction.service';

const uploadPath = (filename: string) => path.join(process.cwd(), 'uploads', filename);
const generatedPath = (filename: string) => path.join(process.cwd(), 'generated', filename);

export const checkDocumentAccess = (doc: any, req: any): boolean => {
    if (doc.userId) {
        return Boolean(req.user && (req.user.id === doc.userId.toString() || req.user.role === 'admin'));
    }

    const anonId = req.headers['x-anonymous-session-id'];
    return Boolean(anonId && doc.anonymousSessionId === anonId);
};

export const uploadDocument = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const userId = req.user ? req.user.id : null;
        const anonymousSessionId = !userId ? req.headers['x-anonymous-session-id'] : null;
        if (!userId && !anonymousSessionId) {
            res.status(400).json({ error: 'Anonymous uploads require x-anonymous-session-id' });
            return;
        }

        const expiresAt = userId
            ? new Date(Date.now() + env.userFileRetentionDays * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + env.anonymousRetentionHours * 60 * 60 * 1000);

        const doc = await Document.create({
            userId,
            anonymousSessionId,
            originalFilename: req.file.originalname,
            storedFilename: req.file.filename,
            fileType: path.extname(req.file.originalname).toLowerCase(),
            fileSize: req.file.size,
            status: DOCUMENT_STATUSES.UPLOADED,
            statusMessage: 'Document uploaded',
            expiresAt
        });

        res.status(201).json(doc);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const processDocument = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        startProcessingJob(req.params.id);
        res.status(202).json({ message: 'Processing started', documentId: req.params.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const redactDocument = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const { rejectedIndices } = req.body;
        
        let entities = doc.detectedEntities || [];
        
        if (rejectedIndices && Array.isArray(rejectedIndices)) {
            const rejectedSet = new Set(rejectedIndices);
            doc.detectedEntities.forEach((e: any, index: number) => {
                e.redact = !rejectedSet.has(index);
            });
            await doc.save();
            entities = doc.detectedEntities;
        }

        startRedactionJob(req.params.id, entities as any);
        res.status(202).json({ message: 'Redaction started', documentId: req.params.id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDocumentStatus = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        res.json({
            documentId: doc._id,
            status: doc.status,
            statusMessage: (doc as any).statusMessage,
            errorCode: (doc as any).errorCode,
            progress: (doc as any).progress,
            totalPII: doc.totalPII,
            extractedCharacters: (doc as any).extractedCharacters,
            extractedWords: (doc as any).extractedWords,
            extractionMetadata: (doc as any).extractionMetadata,
            verificationMetadata: (doc as any).verificationMetadata
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDocuments = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user ? req.user.id : null;
        const anonymousSessionId = !userId ? req.headers['x-anonymous-session-id'] : null;

        if (!userId && !anonymousSessionId) {
            res.status(401).json({ error: 'Authentication or anonymous session required' });
            return;
        }

        const query = userId ? { userId } : { anonymousSessionId };
        const docs = await Document.find(query).sort({ createdAt: -1 });
        res.json(docs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getLatestRedacted = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user ? req.user.id : null;
        const anonymousSessionId = !userId ? req.headers['x-anonymous-session-id'] : null;

        if (!userId && !anonymousSessionId) {
            res.status(401).json({ error: 'Authentication or anonymous session required' });
            return;
        }

        const query = userId ? { userId } : { anonymousSessionId };
        
        const latestDoc = await Document.findOne({
            ...query,
            status: DOCUMENT_STATUSES.REDACTED,
            redactedFilename: { $exists: true, $ne: null }
        }).sort({ createdAt: -1 });

        if (!latestDoc) {
            res.status(404).json({ error: 'No redacted document available' });
            return;
        }

        res.json(latestDoc);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDocument = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        res.json(doc);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDocumentReport = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        // Generate a report payload
        const report = {
            id: doc._id,
            originalFilename: doc.originalFilename,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
            status: doc.status,
            createdAt: doc.createdAt,
            processingTimeMs: doc.processingTime,
            extraction: {
                characters: doc.extractedCharacters || 0,
                words: doc.extractedWords || 0,
                method: (doc.extractionMetadata as any)?.extractionMethod || 'Unknown'
            },
            pii: {
                total: doc.totalPII || 0,
                breakdown: doc.piiBreakdown || {}
            },
            verification: {
                passed: (doc.verificationMetadata as any)?.verificationPassed ?? true,
                remainingPII: (doc.verificationMetadata as any)?.remainingPiiCount ?? 0,
                deduplicatedEntities: (doc.verificationMetadata as any)?.deduplicatedEntities ?? 0,
                overlapCount: (doc.verificationMetadata as any)?.overlapCount ?? 0,
                finalRedactionTargets: (doc.verificationMetadata as any)?.finalRedactionTargets ?? 0,
                redactionTimeMs: (doc.verificationMetadata as any)?.redactionTimeMs ?? 0,
                verificationTimeMs: (doc.verificationMetadata as any)?.verificationTimeMs ?? 0,
                totalTimeMs: (doc.verificationMetadata as any)?.totalTimeMs ?? doc.processingTime ?? 0
            }
        };

        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const downloadReport = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const format = req.query.format as string;
        
        const remainingPii = (doc.verificationMetadata as any)?.remainingPiiCount || 0;
        const piiRedacted = (doc.totalPII || 0) - remainingPii;
        const verificationStatus = doc.status === DOCUMENT_STATUSES.REDACTION_VERIFICATION_FAILED ? 'FAILED' : 'PASSED';
        
        if (format === 'pdf') {
            const pdfDoc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Report_${doc.originalFilename}.pdf`);
            pdfDoc.pipe(res);
            
            pdfDoc.fontSize(20).text('PII REDACTION REPORT', { align: 'center' });
            pdfDoc.moveDown();
            pdfDoc.fontSize(14).text('Document Information', { underline: true });
            pdfDoc.fontSize(12).text(`Filename: ${doc.originalFilename}`);
            pdfDoc.text(`File type: ${doc.fileType}`);
            pdfDoc.text(`Upload date: ${new Date(doc.createdAt).toLocaleString()}`);
            pdfDoc.moveDown();
            pdfDoc.fontSize(14).text('Processing Summary', { underline: true });
            pdfDoc.fontSize(12).text(`Status: ${doc.status}`);
            pdfDoc.text(`Processing duration: ${doc.processingTime || 0} ms`);
            pdfDoc.moveDown();
            pdfDoc.fontSize(14).text('PII Summary', { underline: true });
            pdfDoc.fontSize(12).text(`Total detected: ${doc.totalPII || 0}`);
            pdfDoc.text(`Total redacted: ${piiRedacted}`);
            pdfDoc.text(`Remaining after verification: ${remainingPii}`);
            pdfDoc.text(`Verification status: ${verificationStatus}`);
            pdfDoc.moveDown();
            pdfDoc.fontSize(14).text('Performance & Scalability', { underline: true });
            pdfDoc.fontSize(12).text(`Total entities detected: ${doc.totalPII || 0}`);
            pdfDoc.text(`Deduplicated target strings: ${(doc.verificationMetadata as any)?.finalRedactionTargets ?? 0}`);
            pdfDoc.text(`Total processing time: ${(doc.verificationMetadata as any)?.totalTimeMs ?? doc.processingTime ?? 0} ms`);
            pdfDoc.text(`Redaction engine time: ${(doc.verificationMetadata as any)?.redactionTimeMs ?? 0} ms`);
            pdfDoc.text(`Verification time: ${(doc.verificationMetadata as any)?.verificationTimeMs ?? 0} ms`);
            pdfDoc.moveDown();
            pdfDoc.fontSize(14).text('Categories', { underline: true });
            if (doc.piiBreakdown) {
                for (const [key, value] of Object.entries(doc.piiBreakdown)) {
                    pdfDoc.fontSize(12).text(`${key.replace(/_/g, ' ')}: ${value}`);
                }
            }
            pdfDoc.end();
            return;
        } else if (format === 'docx') {
            const children = [
                new Paragraph({ text: 'PII REDACTION REPORT', heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: 'Document Information', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Filename: ${doc.originalFilename}` }),
                new Paragraph({ text: `File type: ${doc.fileType}` }),
                new Paragraph({ text: `Upload date: ${new Date(doc.createdAt).toLocaleString()}` }),
                new Paragraph({ text: 'Processing Summary', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Status: ${doc.status}` }),
                new Paragraph({ text: `Processing duration: ${doc.processingTime || 0} ms` }),
                new Paragraph({ text: 'PII Summary', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Total detected: ${doc.totalPII || 0}` }),
                new Paragraph({ text: `Total redacted: ${piiRedacted}` }),
                new Paragraph({ text: `Remaining after verification: ${remainingPii}` }),
                new Paragraph({ text: `Verification status: ${verificationStatus}` }),
                new Paragraph({ text: 'Performance Metrics', heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ text: `Total entities detected: ${doc.totalPII || 0}` }),
                new Paragraph({ text: `Deduplicated target strings: ${(doc.verificationMetadata as any)?.finalRedactionTargets ?? 0}` }),
                new Paragraph({ text: `Total processing time: ${(doc.verificationMetadata as any)?.totalTimeMs ?? doc.processingTime ?? 0} ms` }),
                new Paragraph({ text: `Redaction time: ${(doc.verificationMetadata as any)?.redactionTimeMs ?? 0} ms` }),
                new Paragraph({ text: `Verification time: ${(doc.verificationMetadata as any)?.verificationTimeMs ?? 0} ms` }),
                new Paragraph({ text: 'Categories', heading: HeadingLevel.HEADING_2 }),
            ];
            
            if (doc.piiBreakdown) {
                for (const [key, value] of Object.entries(doc.piiBreakdown)) {
                    children.push(new Paragraph({ text: `${key.replace(/_/g, ' ')}: ${value}` }));
                }
            }
            
            const docxFile = new DocxDocument({
                sections: [{ properties: {}, children }]
            });
            
            const b64string = await Packer.toBase64String(docxFile);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename=Report_${doc.originalFilename}.docx`);
            res.send(Buffer.from(b64string, 'base64'));
            return;
        } else {
            res.status(400).json({ error: 'Unsupported format. Use pdf or docx' });
            return;
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDocumentResults = getDocument;

export const downloadRedacted = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc || !doc.redactedFilename) {
            res.status(404).json({ error: 'Document not found or not redacted yet' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        const filePath = generatedPath(doc.redactedFilename);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found on disk' });
            return;
        }

        console.log(`[DOWNLOAD DEBUG]\nSERVING FILE:\n${filePath}`);
        const baseName = doc.originalFilename.replace(/\.[^/.]+$/, '').replace(/[^\w.-]+/g, '_');
        res.download(filePath, `redacted_${baseName}.${doc.redactedFilename.split('.').pop()}`);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteDocument = async (req: any, res: Response): Promise<void> => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            res.status(404).json({ error: 'Document not found' });
            return;
        }
        if (!checkDocumentAccess(doc, req)) {
            res.status(403).json({ error: 'Not authorized' });
            return;
        }

        for (const filePath of [
            doc.storedFilename ? uploadPath(doc.storedFilename) : '',
            doc.redactedFilename ? generatedPath(doc.redactedFilename) : ''
        ]) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

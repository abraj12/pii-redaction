import fs from 'fs';
import path from 'path';

export interface ExtractionResult {
    text: string;
    characterCount: number;
    wordCount: number;
    paragraphCount: number;
    tableCount: number;
    extractionMethod: string;
    warnings: string[];
    durationMs: number;
    ocrUsed?: boolean;
    pagesProcessed?: number;
}

const DOCX_TEXT_MIN_CHARS = 50;
const DOCX_TEXT_MIN_WORDS = 10;

const wordCount = (text: string): number => (text.match(/\b[\p{L}\p{N}][\p{L}\p{N}'&.-]*\b/gu) || []).length;

const normalizeFragmentedText = (text: string): string => {
    let normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n');

    // Rebuild obvious character-by-character words while leaving ordinary prose,
    // emails, numbers, addresses, and punctuation-separated values intact.
    normalized = normalized.replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) => {
        const compact = match.replace(/\s+/g, '');
        return compact.length >= 3 ? compact : match;
    });

    return normalized.trim();
};

const assertReadableFile = (filePath: string): fs.Stats => {
    if (!fs.existsSync(filePath)) {
        throw new Error('FILE_NOT_FOUND: temporary file does not exist on disk');
    }
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
        throw new Error('EMPTY_FILE: temporary file is 0 bytes');
    }
    return stats;
};

const validateSignature = (filePath: string, ext: string): void => {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    if (ext === '.docx' && !(buffer[0] === 0x50 && buffer[1] === 0x4b)) {
        throw new Error('INVALID_DOCX_SIGNATURE: DOCX must be a ZIP/OOXML package');
    }
    if (ext === '.pdf' && buffer.toString('utf8', 0, 4) !== '%PDF') {
        throw new Error('INVALID_PDF_SIGNATURE: PDF signature is missing');
    }
}

const extractDocxWithMammoth = async (filePath: string): Promise<{ text: string; warnings: string[] }> => {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return {
        text: normalizeFragmentedText(result.value || ''),
        warnings: (result.messages || []).map((m: any) => m.message)
    };
};

const extractOoxmlText = (filePath: string): { text: string; paragraphCount: number; tableCount: number; warnings: string[] } => {
    const AdmZip = require('adm-zip');
    const { DOMParser } = require('@xmldom/xmldom');
    const warnings: string[] = [];
    let zip;

    try {
        zip = new AdmZip(filePath);
    } catch (error: any) {
        throw new Error(`INVALID_DOCX_ZIP: ${error.message}`);
    }

    const entries = zip.getEntries();
    if (!entries.some((e: any) => e.entryName === '[Content_Types].xml')) {
        throw new Error('INVALID_DOCX_PACKAGE: missing [Content_Types].xml');
    }
    if (!entries.some((e: any) => e.entryName === 'word/document.xml')) {
        throw new Error('INVALID_DOCX_PACKAGE: missing word/document.xml');
    }

    const targetFiles = entries.filter((entry: any) => {
        const name = entry.entryName;
        return name === 'word/document.xml'
            || /^word\/header\d+\.xml$/.test(name)
            || /^word\/footer\d+\.xml$/.test(name)
            || name === 'word/footnotes.xml'
            || name === 'word/endnotes.xml'
            || name === 'word/comments.xml';
    });

    const paragraphs: string[] = [];
    let tableCount = 0;

    for (const entry of targetFiles) {
        try {
            const xml = zip.readAsText(entry);
            const doc = new DOMParser().parseFromString(xml, 'text/xml');
            const tables = doc.getElementsByTagName('w:tbl');
            tableCount += tables.length || 0;
            const pNodes = doc.getElementsByTagName('w:p');

            for (let i = 0; i < pNodes.length; i++) {
                // To avoid merging text across runs/cells incorrectly, we'll replace specific tags first
                let pXml = pNodes[i].toString();
                let pText = pXml.replace(/<w:br[^>]*>/g, '\n')
                                .replace(/<w:tab[^>]*>/g, '\t')
                                .replace(/<w:tc[^>]*>/g, ' ')
                                .replace(/<[^>]+>/g, '');
                
                const paragraph = normalizeFragmentedText(pText);
                if (paragraph) paragraphs.push(paragraph);
            }
        } catch (error: any) {
            warnings.push(`OOXML parse warning for ${entry.entryName}: ${error.message}`);
        }
    }

    const text = normalizeFragmentedText(paragraphs.join('\n'));
    return { text, paragraphCount: paragraphs.length, tableCount, warnings };
};

const extractPdfText = async (filePath: string): Promise<{ text: string; pagesProcessed: number; warnings: string[], ocrUsed: boolean }> => {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = normalizeFragmentedText(data.text || '');
    const pagesProcessed = data.numpages || 0;
    const warnings: string[] = [];

    if (!text || wordCount(text) < 10) {
        warnings.push('Native text layer empty. Attempting OCR...');
        try {
            // Tesseract.js requires image buffers. PDF-to-Image rasterization requires Ghostscript/ImageMagick on host OS.
            // Since this is a generic Node environment without guaranteed OS binaries, we gracefully fail OCR for PDFs.
            throw new Error('OCR_UNAVAILABLE: PDF rasterization dependencies (Ghostscript/ImageMagick) are unavailable on this host to process scanned PDFs.');
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    return { text, pagesProcessed, warnings, ocrUsed: false };
};

export const extractDocumentText = async (filePath: string, originalFilename: string): Promise<ExtractionResult> => {
    const start = Date.now();
    assertReadableFile(filePath);

    const ext = path.extname(originalFilename).toLowerCase();
    validateSignature(filePath, ext);

    let text = '';
    let warnings: string[] = [];
    let extractionMethod = '';
    let paragraphCount = 0;
    let tableCount = 0;
    let pagesProcessed = 0;
    let ocrUsed = false;

    if (ext === '.txt') {
        text = normalizeFragmentedText(fs.readFileSync(filePath, 'utf8'));
        extractionMethod = 'text';
        paragraphCount = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    } else if (ext === '.docx') {
        const fallback = extractOoxmlText(filePath);
        text = fallback.text;
        extractionMethod = 'ooxml_fallback';
        paragraphCount = fallback.paragraphCount;
        tableCount = fallback.tableCount;
        warnings = fallback.warnings;
    } else if (ext === '.pdf') {
        const pdf = await extractPdfText(filePath);
        text = pdf.text;
        extractionMethod = 'pdf_text_layer';
        pagesProcessed = pdf.pagesProcessed;
        warnings = pdf.warnings;
        ocrUsed = pdf.ocrUsed;
    } else {
        throw new Error(`UNSUPPORTED_FILE_TYPE: ${ext}`);
    }

    const characterCount = text.length;
    const words = wordCount(text);
    if (characterCount === 0 || words === 0) {
        throw new Error(`${ext.toUpperCase()}_EXTRACTION_EMPTY: extraction returned 0 usable text characters`);
    }

    return {
        text,
        characterCount,
        wordCount: words,
        paragraphCount,
        tableCount,
        extractionMethod,
        warnings,
        durationMs: Date.now() - start,
        pagesProcessed,
        ocrUsed
    };
};

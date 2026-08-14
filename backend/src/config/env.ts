import dotenv from 'dotenv';

dotenv.config();

const required = (name: string): string => {
    const value = process.env[name];
    if (!value || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const numberValue = (name: string, fallback: number): number => {
    const value = process.env[name];
    if (!value) return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid numeric environment variable: ${name}`);
    }
    return parsed;
};

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: numberValue('PORT', 5000),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    mongodbUri: required('MONGODB_URI'),
    jwtSecret: required('JWT_SECRET'),
    piiEngineUrl: required('PII_ENGINE_URL').replace(/\/$/, ''),
    maxFileSizeMb: numberValue('MAX_FILE_SIZE', 50),
    anonymousRetentionHours: numberValue('ANONYMOUS_RETENTION_HOURS', 24),
    userFileRetentionDays: numberValue('USER_FILE_RETENTION_DAYS', numberValue('RETENTION_DAYS', 30)),
    extractionTimeoutMs: numberValue('EXTRACTION_TIMEOUT_MS', 60000),
    piiTimeoutMs: numberValue('PII_TIMEOUT_MS', 120000),
    redactionTimeoutMs: numberValue('REDACTION_TIMEOUT_MS', 120000),
    totalProcessingTimeoutMs: numberValue('TOTAL_PROCESSING_TIMEOUT_MS', 300000),
    chunkSize: numberValue('PII_CHUNK_SIZE', 45000),
    chunkOverlap: numberValue('PII_CHUNK_OVERLAP', 500)
};

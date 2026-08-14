import mongoose from 'mongoose';
import { DOCUMENT_STATUSES } from '../constants/documentStatus';

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // null for anonymous
    anonymousSessionId: { type: String, required: false },
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    redactedFilename: { type: String },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    status: { 
        type: String, 
        enum: Object.values(DOCUMENT_STATUSES), 
        default: DOCUMENT_STATUSES.UPLOADED
    },
    progress: { type: Number, default: 0 },
    statusMessage: { type: String, default: 'Uploading document...' },
    totalPII: { type: Number, default: 0 },
    piiBreakdown: { type: mongoose.Schema.Types.Mixed }, // e.g. { "PERSON": 10, "EMAIL_ADDRESS": 2 }
    detectedEntities: [{
        type: { type: String }, // e.g. "EMAIL_ADDRESS"
        text: { type: String }, // original text
        fakeValue: { type: String }, // the generated fake text
        score: { type: Number }, // confidence
        start: { type: Number }, // position
        end: { type: Number },
        redact: { type: Boolean, default: true } // whether the user chose to redact it
    }],
    extractedCharacters: { type: Number, default: 0 },
    extractedWords: { type: Number, default: 0 },
    extractionMetadata: { type: Object, default: {} },
    verificationMetadata: { type: Object, default: {} },
    errorCode: { type: String },
    processingTime: { type: Number },
    expiresAt: { type: Date, required: false },
}, { timestamps: true });

documentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Document = mongoose.model('Document', documentSchema);

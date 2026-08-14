import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true });
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx' && ext !== '.txt') {
        return cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
    const allowedMime = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/octet-stream'
    ];
    if (file.mimetype && !allowedMime.includes(file.mimetype)) {
        return cb(new Error('Uploaded file MIME type does not match a supported format'));
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
    fileFilter
});

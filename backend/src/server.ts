import app from './app';
import mongoose from 'mongoose';
import fs from 'fs';
import { env } from './config/env';

import { startCleanupJob } from './jobs/cleanup.job';

// Ensure upload directories exist
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

ensureDir('uploads');
ensureDir('generated');

mongoose.connect(env.mongodbUri)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(env.port, '0.0.0.0', () => {
            console.log(`Server running on 0.0.0.0:${env.port}`);
            startCleanupJob();
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

// Delete files older than 24 hours
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const cleanupDirectory = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) return;

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${dirPath}:`, err);
            return;
        }

        const now = Date.now();
        files.forEach(file => {
            if (file === '.gitkeep') return; // Don't delete placeholder

            const filePath = path.join(dirPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Error getting stats for ${filePath}:`, err);
                    return;
                }

                if (now - stats.mtimeMs > MAX_AGE_MS) {
                    fs.unlink(filePath, err => {
                        if (err) console.error(`Error deleting old file ${filePath}:`, err);
                        else console.log(`Deleted expired file: ${filePath}`);
                    });
                }
            });
        });
    });
};

export const startCleanupJob = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', () => {
        console.log('Running scheduled cleanup job...');
        cleanupDirectory(path.join(__dirname, '../../uploads'));
        cleanupDirectory(path.join(__dirname, '../../generated'));
    });
    console.log('File cleanup cron job scheduled.');
};

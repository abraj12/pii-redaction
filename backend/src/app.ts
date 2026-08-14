import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

import { env } from './config/env';

const app = express();

app.use(helmet());

const allowedOrigins = [env.frontendUrl, 'http://localhost:5173'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Static path for uploads (if using local storage)
app.use('/uploads', express.static('uploads'));
app.use('/generated', express.static('generated'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'pii-redaction-backend' });
});

// Basic Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;

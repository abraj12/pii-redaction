import { Request, Response } from 'express';
import { User } from '../models/User';
import { Document } from '../models/Document';
import { AuditLog } from '../models/AuditLog';
import { DOCUMENT_STATUSES, PROCESSING_DOCUMENT_STATUSES } from '../constants/documentStatus';

export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDocuments = await Document.countDocuments();
        const totalAnonymousJobs = await Document.countDocuments({ userId: null });
        const completedAnalyses = await Document.countDocuments({ status: DOCUMENT_STATUSES.COMPLETED });
        const redactedDocuments = await Document.countDocuments({ status: DOCUMENT_STATUSES.REDACTED });
        const noPiiDocuments = await Document.countDocuments({ status: DOCUMENT_STATUSES.COMPLETED_NO_PII });
        const failedDocuments = await Document.countDocuments({
            status: {
                $in: [
                    DOCUMENT_STATUSES.FAILED,
                    DOCUMENT_STATUSES.EXTRACTION_FAILED,
                    DOCUMENT_STATUSES.REDACTION_VERIFICATION_FAILED
                ]
            }
        });
        const processingDocuments = await Document.countDocuments({ status: { $in: PROCESSING_DOCUMENT_STATUSES } });

        const docs = await Document.find({
            status: { $in: [DOCUMENT_STATUSES.COMPLETED, DOCUMENT_STATUSES.REDACTED] }
        }).select('totalPII processingTime');
        const totalPIIDetected = docs.reduce((sum, doc) => sum + (doc.totalPII || 0), 0);
        const avgProcessingTime = docs.length ? docs.reduce((sum, doc) => sum + (doc.processingTime || 0), 0) / docs.length : 0;

        res.json({
            totalUsers,
            totalDocuments,
            totalAnonymousJobs,
            totalPIIDetected,
            completedAnalyses,
            redactedDocuments,
            noPiiDocuments,
            failedDocuments,
            processingDocuments,
            avgProcessingTime
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUserStatus = async (req: any, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        
        await AuditLog.create({
            adminId: req.user.id,
            action: `User status changed to ${status}`,
            target: `User ${req.params.id}`,
            ipAddress: req.ip
        });

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await AuditLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

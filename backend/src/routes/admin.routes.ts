import express from 'express';
import { getStats, getUsers, getUser, updateUserStatus, getAuditLogs } from '../controllers/admin.controller';
import { protect, adminProtect } from '../middleware/auth.middleware';

const router = express.Router();

// All admin routes are protected and require admin role
router.use(protect, adminProtect);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;

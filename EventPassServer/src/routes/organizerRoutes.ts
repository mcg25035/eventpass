import { Router } from 'express';
import { getEvents, getEvent, getAllEvents, createEvent, updateEvent, deleteEvent, getBadges, createBadge } from '../controllers/EventController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply middleware to all routes in this router
router.use(authenticateToken);

// Events
router.get('/events/all', getAllEvents); // Public discovery
router.get('/events', getEvents);
router.get('/events/:id', getEvent);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// Badges
router.get('/events/:id/badges', getBadges);
router.post('/events/:id/badges', createBadge);

// Online Verification (Phase 2)
import { generateOnlineToken, issueRecordOnline, claimBadge } from '../controllers/ValidationController';
router.post('/events/online/token', generateOnlineToken);
router.post('/records/issue', issueRecordOnline);
router.post('/events/claim', claimBadge); // Participant claim

export default router;

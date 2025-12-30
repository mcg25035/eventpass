import { Router } from 'express';
import { getEvents, getEvent, getAllEvents, createEvent, updateEvent, deleteEvent, getBadges, createBadge, getPublicEvent, generateHandshake } from '../controllers/EventController';
import { authenticateToken } from '../middleware/authMiddleware';
import { generateOnlineToken, issueRecordOnline, claimBadge, getUserRecords, syncValidations, claimEncryptedBadge } from '../controllers/ValidationController';

const router = Router();
// Public routes
/**
 * @swagger
 * tags:
 *   name: Organizer
 *   description: Event management endpoints
 */

/**
 * @swagger
 * /organizer/events/all:
 *   get:
 *     summary: Get all published events (Public)
 *     tags: [Organizer]
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/events/all', getAllEvents); // Public discovery

/**
 * @swagger
 * /organizer/events/public/{id}:
 *   get:
 *     summary: Get public details of an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
router.get('/events/public/:id', getPublicEvent); // Public detail

// router.post('/events/claim', claimBadge); // Moved to protected

// Protected routes
router.use(authenticateToken);

// Events
/**
 * @swagger
 * /organizer/events:
 *   get:
 *     summary: Get my events (Protected)
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of owned events
 */
router.get('/events', getEvents);
/**
 * @swagger
 * /organizer/events/{id}:
 *   get:
 *     summary: Get specific event details
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/events/:id', getEvent);

/**
 * @swagger
 * /organizer/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Organizer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - start_time
 *               - end_time
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/events', createEvent);

/**
 * @swagger
 * /organizer/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/events/:id', updateEvent);

/**
 * @swagger
 * /organizer/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete('/events/:id', deleteEvent);

// Badges
/**
 * @swagger
 * /organizer/events/{id}/badges:
 *   get:
 *     summary: Get badges for an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of badges
 */
router.get('/events/:id/badges', getBadges);

/**
 * @swagger
 * /organizer/events/{id}/badges:
 *   post:
 *     summary: Create a badge for an event
 *     tags: [Organizer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Badge created
 */
router.post('/events/:id/badges', createBadge);

// Online Verification (Phase 2)
/**
 * @swagger
 * /organizer/events/online/token:
 *   post:
 *     summary: Generate a short-lived online token for badge claim
 *     tags: [Validation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token generated
 */
router.post('/events/online/token', generateOnlineToken);

/**
 * @swagger
 * /organizer/records/issue:
 *   post:
 *     summary: Issue a badge record manually
 *     tags: [Validation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Badge issued
 */
router.post('/records/issue', issueRecordOnline);

/**
 * @swagger
 * /organizer/events/claim:
 *   post:
 *     summary: Claim a badge using an online token
 *     tags: [Validation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Badge claimed
 */
router.post('/events/claim', claimBadge); // Authenticated participant claim

/**
 * @swagger
 * /organizer/events/claim-encrypted:
 *   post:
 *     summary: Claim a badge using a secure offline blob
 *     tags: [Validation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, encryptedBlob]
 *             properties:
 *               eventId:
 *                 type: string
 *               encryptedBlob:
 *                 type: string
 *     responses:
 *       200:
 *         description: Claim processed
 */
router.post('/events/claim-encrypted', claimEncryptedBadge); // Secure offline claim

/**
 * @swagger
 * /organizer/records:
 *   get:
 *     summary: Get all badges claimed by the user
 *     tags: [Validation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user records
 */
router.get('/records', getUserRecords); // Get user's claimed badges

// Offline Secure Mode
/**
 * @swagger
 * /organizer/events/{id}/handshake:
 *   post:
 *     summary: Perform handshake to get session key for offline mode
 *     tags: [Validation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session key returned
 */
router.post('/events/:id/handshake', generateHandshake);

/**
 * @swagger
 * /organizer/events/sync-validations:
 *   post:
 *     summary: Sync offline validations to the server
 *     tags: [Validation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               validations:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Sync complete
 */
router.post('/events/sync-validations', syncValidations);

export default router;

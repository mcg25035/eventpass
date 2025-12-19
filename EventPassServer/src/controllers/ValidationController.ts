import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Record, Event, BadgeTemplate } from '../models';

import { AuthRequest } from '../middleware/authMiddleware';

// In-memory cache for tokens (use Redis in production)
export const tokenCache = new Map<string, { eventId: string, expiresAt: number }>();

// POST /api/org/events/online/token
export const generateOnlineToken = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.body;

        // Simple validation: check if event exists
        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const token = uuidv4();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        tokenCache.set(token, { eventId, expiresAt });

        res.json({ token, expiresAt });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/org/records/issue
export const issueRecordOnline = async (req: Request, res: Response) => {
    try {
        const { token, userId, badgeTemplateId, specificData } = req.body;

        // Verify Token
        const session = tokenCache.get(token);
        if (!session) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (Date.now() > session.expiresAt) {
            tokenCache.delete(token);
            return res.status(401).json({ error: 'Token expired' });
        }

        // Check Badge Template
        const badge = await BadgeTemplate.findByPk(badgeTemplateId);
        if (!badge) {
            return res.status(404).json({ error: 'Badge Template not found' });
        }
        if (badge.event_id !== session.eventId) {
            return res.status(400).json({ error: 'Badge does not belong to this event' });
        }

        // Issue Record
        // In real app: check limits, check if already issued, etc.
        const record = await Record.create({
            user_id: userId,
            event_id: session.eventId,
            badge_template_id: badgeTemplateId,
            issued_at: new Date(),
            data: specificData || {}, // JSON
            hash: 'pending_impl' // TODO: Implement proper hashing
        });

        res.status(201).json({ success: true, recordId: record.id });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /organizer/events/claim
export const claimBadge = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { token } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Verify Token
        const session = tokenCache.get(token);
        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        if (Date.now() > session.expiresAt) {
            tokenCache.delete(token);
            return res.status(401).json({ error: 'Token expired' });
        }

        // Find a suitable badge template for this event
        // For simplicity in this demo, we pick the first "Record" type badge, or any badge
        const badge = await BadgeTemplate.findOne({
            where: { event_id: session.eventId }
        });

        if (!badge) {
            return res.status(404).json({ error: 'No badges available for this event' });
        }

        // Check if already claimed? (Optional but good)
        const existing = await Record.findOne({
            where: { user_id: userId, event_id: session.eventId, badge_template_id: badge.id }
        });
        if (existing) {
            return res.status(400).json({ error: 'Badge already claimed' });
        }

        // Issue Record
        const record = await Record.create({
            user_id: userId,
            event_id: session.eventId,
            badge_template_id: badge.id,
            issued_at: new Date(),
            data: {},
            hash: 'claimed_via_token'
        });

        res.status(201).json({ success: true, recordId: record.id, badge: badge });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

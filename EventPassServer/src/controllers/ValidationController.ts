import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Record, Event, BadgeTemplate, User, PendingValidation } from '../models';
import crypto from 'crypto';

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
            return res.status(401).json({ error: 'Unauthorized: User ID missing' });
        }


        // Removed strict 401 check for demo purposes
        // if (!userId) {
        //     return res.status(401).json({ error: 'Unauthorized' });
        // }

        // Verify Token
        // Verify Token or Static JSON
        let eventId: string;
        let badgeTemplateId: string | undefined;

        if (token.startsWith('{')) {
            // Determine if it is a static offline token
            try {
                const staticRef = JSON.parse(token);
                if (staticRef.type === 'static') {
                    eventId = staticRef.eid;
                    badgeTemplateId = staticRef.bid;
                    // Verify event exists
                    const evt = await Event.findByPk(eventId);
                    if (!evt) return res.status(404).json({ error: 'Event from QR not found' });
                } else if (staticRef.type === 'secure') {
                    // Forward to claimEncryptedBadge logic internally
                    // Need to mock Request/Response or extract logic to shared function.
                    // For now, simpler to tell checking client "Secure Token Detected"
                    // But to fix user issue, we should handle it.
                    req.body.eventId = staticRef.eid;
                    req.body.encryptedBlob = staticRef.blob;
                    return claimEncryptedBadge(req, res);
                } else {
                    return res.status(400).json({ error: 'Invalid token format' });
                }
            } catch (e) {
                return res.status(400).json({ error: 'Invalid JSON token' });
            }
        } else {
            // Standard Online Session Token
            const session = tokenCache.get(token);
            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            if (Date.now() > session.expiresAt) {
                tokenCache.delete(token);
                return res.status(401).json({ error: 'Token expired' });
            }
            eventId = session.eventId;
        }

        // Find a suitable badge template for this event
        // If static token provided specific badge, use it. Otherwise find first available.
        let badge;
        if (badgeTemplateId) {
            badge = await BadgeTemplate.findByPk(badgeTemplateId);
        } else {
            badge = await BadgeTemplate.findOne({
                where: { event_id: eventId }
            });
        }

        if (!badge) {
            return res.status(404).json({ error: 'No badges available for this event' });
        }

        // Check if already claimed? (Optional but good)
        // Check if already claimed? (Optional but good)
        const existing = await Record.findOne({
            where: { user_id: userId, event_id: eventId, badge_template_id: badge.id }
        });
        if (existing) {
            return res.status(400).json({ error: 'Badge already claimed' });
        }

        // Issue Record
        console.log('--- Debugging Claim Badge ---');
        console.log('User ID:', userId);
        console.log('Event ID:', eventId);
        console.log('Badge Template ID:', badge.id);

        try {
            const userExists = await User.findByPk(userId);
            console.log('User Exists inside DB?', !!userExists, userExists?.toJSON());
        } catch (e) { console.log('Checking User failed', e); }

        const record = await Record.create({
            user_id: userId,
            event_id: eventId,
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

// GET /organizer/records
export const getUserRecords = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;

        // Fetch records including Event and BadgeTemplate details
        const records = await Record.findAll({
            where: { user_id: userId },
            include: [
                { model: Event, attributes: ['title', 'start_time', 'end_time'] },
                { model: BadgeTemplate, attributes: ['name', 'description', 'image_url', 'criteria'] }
            ],
            order: [['issued_at', 'DESC']]
        });

        res.json(records);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /organizer/events/sync-validations
export const syncValidations = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id; // Organizer ID
        const { validations } = req.body; // Array of { eventId, userId, hash, timestamp }

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!Array.isArray(validations)) return res.status(400).json({ error: 'Invalid format' });

        let count = 0;
        for (const val of validations) {
            await PendingValidation.create({
                event_id: val.eventId,
                user_id: val.userId,
                verification_hash: val.hash,
                created_at: val.timestamp || new Date()
            });
            count++;
        }

        res.json({ success: true, synced: count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /events/claim-encrypted
export const claimEncryptedBadge = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id; // Participant ID
        const { eventId, encryptedBlob } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const event = await Event.findByPk(eventId);
        if (!event || !event.session_key) {
            return res.status(404).json({ error: 'Event or Session Key not found' });
        }

        // 1. Decrypt Blob using Session Key (AES-256-CBC implied)
        const parts = encryptedBlob.split(':');
        // Expecting IV:Ciphertext
        if (parts.length !== 2) return res.status(400).json({ error: 'Invalid blob format' });

        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = Buffer.from(parts[1], 'hex');
        const key = Buffer.from(event.session_key, 'hex'); // 32 bytes

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const payload = JSON.parse(decrypted.toString()); // { bid: badgeId, salt, ts }

        // 2. Calculate Hash Match
        // Hash = SHA256(Encrypted_Blob + User_ID)
        const checkHash = crypto.createHash('sha256').update(encryptedBlob + userId).digest('hex');

        // 3. Check PendingValidation
        const pending = await PendingValidation.findOne({
            where: {
                event_id: eventId,
                user_id: userId,
                verification_hash: checkHash
            }
        });

        if (!pending) {
            // Specific error code so frontend knows to save for retry
            return res.status(400).json({ error: 'ORGANIZER_NOT_SYNCED', message: 'No matching pending validation found. Organizer may need to sync.' });
        }

        // 4. Mint Record
        const badgeId = payload.bid;

        // Check if already claimed
        const existing = await Record.findOne({
            where: { user_id: userId, event_id: eventId, badge_template_id: badgeId }
        });
        if (existing) {
            return res.status(400).json({ error: 'Badge already claimed' });
        }

        await Record.create({
            user_id: userId,
            event_id: eventId,
            badge_template_id: badgeId,
            issued_at: new Date(),
            data: payload,
            hash: checkHash
        });

        // Cleanup Pending
        await pending.destroy();

        res.json({ success: true });

    } catch (error: any) {
        console.error('Claim Encrypted Error:', error);
        res.status(500).json({ error: 'Decryption or Validation Failed' });
    }
};

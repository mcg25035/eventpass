import { Request, Response } from 'express';
import { Event, BadgeTemplate, Record, PendingValidation } from '../models';
import { AuthRequest } from '../middleware/authMiddleware';
import { Op } from 'sequelize';
import crypto from 'crypto';

// GET /organizer/events/all (Public Discovery)
export const getAllEvents = async (req: Request, res: Response) => {
    try {
        // Fetch valid events (not ended yet), ordered by date
        const events = await Event.findAll({
            where: {
                end_time: {
                    [Op.gt]: new Date()
                }
            },
            order: [['start_time', 'ASC']]
        });
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET /organizer/events/public/:id (Public Detail)
export const getPublicEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const event = await Event.findByPk(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET /organizer/events
export const getEvents = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const events = await Event.findAll({
            where: { organizer_id: userId },
            order: [['start_time', 'DESC']]
        });
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET /organizer/events/:id
export const getEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { id } = req.params;

        const event = await Event.findOne({ where: { id, organizer_id: userId } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /organizer/events
export const createEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { title, description, start_time, end_time, is_offline_active } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const event = await Event.create({
            organizer_id: userId,
            title,
            description,
            start_time,
            end_time,
            is_offline_active
        });

        res.status(201).json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// PUT /organizer/events/:id
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { id } = req.params;
        const { title, description, start_time, end_time, is_offline_active } = req.body;

        const event = await Event.findOne({ where: { id, organizer_id: userId } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        console.log('Updating Event:', id);
        console.log('Payload:', req.body);

        await event.update({
            title,
            description,
            start_time,
            end_time,
            is_offline_active
        });

        console.log('Event Updated. is_offline_active:', event.is_offline_active);

        res.json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /organizer/events/:id/handshake
export const generateHandshake = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { id } = req.params;

        const event = await Event.findOne({ where: { id, organizer_id: userId } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Generate 32-byte Session Key (AES-256)
        const sessionKey = crypto.randomBytes(32).toString('hex');

        await event.update({ session_key: sessionKey });

        res.json({ session_key: sessionKey });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE /organizer/events/:id
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        const { id } = req.params;

        const event = await Event.findOne({ where: { id, organizer_id: userId } });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Manually delete related badges first to avoid FK constraint error
        // Also delete Records and PendingValidations
        await PendingValidation.destroy({ where: { event_id: id } });
        await Record.destroy({ where: { event_id: id } });
        await BadgeTemplate.destroy({ where: { event_id: id } });

        await event.destroy();
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// GET /organizer/events/:id/badges
export const getBadges = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const badges = await BadgeTemplate.findAll({
            where: { event_id: id }
        });
        res.json(badges);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// POST /organizer/events/:id/badges
export const createBadge = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, icon_ref, limit, metadata_schema } = req.body;

        const badge = await BadgeTemplate.create({
            event_id: id,
            name,
            type,
            icon_ref,
            limit,
            metadata_schema
        });

        res.status(201).json(badge);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';

export const register = async (req: Request, res: Response) => {
    try {
        const { type, role, name, username, email, password } = req.body;
        const accountName = name || username;

        // As per request: Default all users can be organizers for now
        // Or respect the 'role' field properly
        const isOrganizer = (role === 'organizer' || type === 'organizer') ? true : true;

        if (!accountName) {
            return res.status(400).json({ error: 'Username/Name is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: accountName,
            email,
            password_hash: hashedPassword,
            isOrganizer: isOrganizer
        });

        res.status(201).json({ message: 'User registered successfully', id: user.id });
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const account = await User.findOne({ where: { email } });

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const match = await bcrypt.compare(password, account.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: account.id, type: account.isOrganizer ? 'organizer' : 'user', email: account.email },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({ token, type: account.isOrganizer ? 'organizer' : 'user', id: account.id, name: account.username });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const renewToken = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Issue a new token with refreshed 7-day expiry
        const newToken = jwt.sign(
            { id: user.id, type: user.type, email: user.email },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({ token: newToken });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


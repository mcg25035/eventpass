import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Organizer } from '../models';

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';

export const register = async (req: Request, res: Response) => {
    try {
        const { type, role, name, username, email, password } = req.body;
        // Accept both 'type' and 'role' from frontend
        const accountType = type || role || 'user';
        // Accept both 'name' and 'username'
        const accountName = name || username;

        if (!accountName) {
            return res.status(400).json({ error: 'Username/Name is required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (accountType === 'organizer') {
            const org = await Organizer.create({
                name: accountName,
                email,
                password_hash: hashedPassword
            });
            res.status(201).json({ message: 'Organizer registered successfully', id: org.id });
        } else {
            const user = await User.create({
                username: accountName,
                email,
                password_hash: hashedPassword
            });
            res.status(201).json({ message: 'User registered successfully', id: user.id });
        }
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { type, role, email, password } = req.body;
        const accountType = type || role || 'user';

        let account: any;
        if (accountType === 'organizer') {
            account = await Organizer.findOne({ where: { email } });
        } else {
            account = await User.findOne({ where: { email } });
        }

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const match = await bcrypt.compare(password, account.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: account.id, type: type || 'user', email: account.email },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({ token, type, id: account.id, name: account.name || account.username });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

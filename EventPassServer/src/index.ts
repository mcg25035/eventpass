import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initModels } from './models';
import authRoutes from './routes/authRoutes';
import organizerRoutes from './routes/organizerRoutes';

dotenv.config();

const app = express();
//@ts-ignore
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/organizer', organizerRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('EventPass Server is running');
});

// Start Server
const startServer = async () => {
    await initModels();
    //@ts-ignore
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();

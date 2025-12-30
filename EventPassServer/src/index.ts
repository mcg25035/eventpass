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

// Debug Logging Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    next();
});

// Routes
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

app.use('/open-api', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/auth', authRoutes);
app.use('/organizer', organizerRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('EventPass Server is running');
});

import { startCleanupJob } from './cron/cleanup';

// Start Server
const startServer = async () => {
    await initModels();
    startCleanupJob();
    //@ts-ignore
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();

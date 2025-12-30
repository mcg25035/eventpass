import { sequelize, connectDB } from '../config/database';
import { User } from './Auth';
import { Event, BadgeTemplate } from './Event';
import { Record, PendingValidation } from './Record';

const initModels = async () => {
    await connectDB();
    // Start fresh for dev if needed, or use alter
    // await sequelize.sync({ force: true }); 
};

export {
    sequelize,
    connectDB,
    initModels,
    User,

    Event,
    BadgeTemplate,
    Record,
    PendingValidation
};

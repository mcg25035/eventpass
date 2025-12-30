import cron from 'node-cron';
import { Op } from 'sequelize';
import { PendingValidation } from '../models';

export const startCleanupJob = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running PendingValidation cleanup job...');
        const threshold = new Date();
        threshold.setHours(threshold.getHours() - 720); // 30 days ago

        try {
            const result = await PendingValidation.destroy({
                where: {
                    created_at: {
                        [Op.lt]: threshold
                    }
                }
            });
            console.log(`Cleanup complete. Deleted ${result} expired pending validations.`);
        } catch (error) {
            console.error('Error during cleanup job:', error);
        }
    });

    console.log('Daily Cleanup Job initialized (0 0 * * *)');
};

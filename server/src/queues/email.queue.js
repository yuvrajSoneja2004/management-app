const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const emailQueue = new Queue('email', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600,
            count: 100,
        },
        removeOnFail: {
            age: 7 * 24 * 3600,
        },
    },
});

const queueEmail = async (type, data) => {
    try {
        const job = await emailQueue.add(type, data, {
            priority: type === 'passwordReset' ? 1 : 5,
        });
        console.log(`Email job ${job.id} queued: ${type}`);
        return job;
    } catch (error) {
        console.error('Failed to queue email:', error);
        throw error;
    }
};

const getQueueStats = async () => {
    try {
        const [waiting, active, completed, failed] = await Promise.all([
            emailQueue.getWaitingCount(),
            emailQueue.getActiveCount(),
            emailQueue.getCompletedCount(),
            emailQueue.getFailedCount(),
        ]);

        return { waiting, active, completed, failed };
    } catch (error) {
        console.error('Failed to get queue stats:', error);
        return null;
    }
};

module.exports = {
    emailQueue,
    queueEmail,
    getQueueStats,
};

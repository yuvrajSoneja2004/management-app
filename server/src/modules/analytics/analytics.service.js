const Task = require('../task/task.model');
const Activity = require('../project/activity.model');
const mongoose = require('mongoose');

const getProjectStatistics = async (projectId) => {
    const stats = await Task.aggregate([
        { $match: { project: new mongoose.Types.ObjectId(projectId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const formattedStats = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = formattedStats['Completed'] || 0;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
        taskDistribution: formattedStats,
        totalTasks,
        progress: Math.round(progress * 100) / 100
    };
};

const getUserActivityStats = async (userId) => {
    const activityStats = await Activity.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 } // Last 7 days
    ]);

    return activityStats;
};

module.exports = {
    getProjectStatistics,
    getUserActivityStats
};

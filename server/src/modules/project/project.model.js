const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['Active', 'Archived'],
        default: 'Active'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['Admin', 'Member', 'Viewer'],
            default: 'Viewer'
        }
    }]
}, {
    timestamps: true
});

// Indexes for performance
projectSchema.index({ owner: 1 });
projectSchema.index({ owner: 1, status: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;

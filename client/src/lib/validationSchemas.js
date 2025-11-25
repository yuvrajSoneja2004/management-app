import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
});

// Project schemas
export const projectSchema = z.object({
    name: z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must be less than 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(500, 'Description must be less than 500 characters')
        .optional()
        .or(z.literal('')),
    startDate: z.string()
        .refine((date) => !date || !isNaN(Date.parse(date)), {
            message: 'Invalid start date',
        })
        .optional(),
    endDate: z.string()
        .refine((date) => !date || !isNaN(Date.parse(date)), {
            message: 'Invalid end date',
        })
        .optional(),
    tags: z.string()
        .max(200, 'Tags must be less than 200 characters')
        .refine((tags) => {
            if (!tags) return true;
            const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            return tagArray.every(tag => tag.length <= 30);
        }, {
            message: 'Each tag must be 30 characters or less',
        })
        .optional(),
}).refine((data) => {
    // Validate that end date is after start date
    if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
});

// Task schemas
export const taskSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be less than 200 characters')
        .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters'),
    description: z.string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional()
        .or(z.literal('')),
    status: z.enum(['Todo', 'In Progress', 'Review', 'Completed'], {
        errorMap: () => ({ message: 'Please select a valid status' }),
    }),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical'], {
        errorMap: () => ({ message: 'Please select a valid priority' }),
    }),
    assignees: z.array(z.string()).optional(),
    dueDate: z.string()
        .refine((date) => !date || !isNaN(Date.parse(date)), {
            message: 'Invalid due date',
        })
        .refine((date) => {
            if (!date) return true;
            return new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0));
        }, {
            message: 'Due date cannot be in the past',
        })
        .optional(),
    estimatedTime: z.string()
        .refine((time) => !time || (!isNaN(Number(time)) && Number(time) > 0 && Number(time) <= 1000), {
            message: 'Estimated time must be between 1 and 1000 hours',
        })
        .optional(),
    tags: z.string()
        .max(200, 'Tags must be less than 200 characters')
        .refine((tags) => {
            if (!tags) return true;
            const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            return tagArray.every(tag => tag.length <= 30);
        }, {
            message: 'Each tag must be 30 characters or less',
        })
        .optional(),
});

// Invite member schema
export const inviteMemberSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['Admin', 'Member', 'Viewer']),
});

// File upload schema
export const fileUploadSchema = z.object({
    file: z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, {
        message: 'File size must be less than 10MB',
    }),
});

const { body, param, query, validationResult } = require('express-validator');
const ValidationError = require('../errors/ValidationError');
const mongoose = require('mongoose');

/**
 * Middleware to handle validation results
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));
        throw new ValidationError('Validation failed', formattedErrors);
    }
    next();
};

/**
 * Custom validator for MongoDB ObjectId
 */
const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

/**
 * Sanitize and escape HTML to prevent XSS
 */
const sanitizeHtml = (value) => {
    if (typeof value !== 'string') return value;
    // Remove HTML tags and escape special characters
    return value
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[&<>"']/g, (char) => {
            const escapeChars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return escapeChars[char];
        });
};

// ============ AUTH VALIDATION ============

exports.validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
        .customSanitizer(sanitizeHtml),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .customSanitizer(sanitizeHtml),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

exports.validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

exports.validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    handleValidationErrors
];

exports.validateResetPassword = [
    param('token')
        .notEmpty().withMessage('Reset token is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

// ============ PROJECT VALIDATION ============

exports.validateCreateProject = [
    body('name')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Project name must be 3-100 characters')
        .customSanitizer(sanitizeHtml),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
        .customSanitizer(sanitizeHtml),
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format')
        .custom((endDate, { req }) => {
            if (req.body.startDate && new Date(endDate) < new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .trim()
        .isLength({ max: 30 }).withMessage('Each tag must be max 30 characters')
        .customSanitizer(sanitizeHtml),
    handleValidationErrors
];

exports.validateUpdateProject = [
    param('id')
        .custom(isValidObjectId).withMessage('Invalid project ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Project name must be 3-100 characters')
        .customSanitizer(sanitizeHtml),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
        .customSanitizer(sanitizeHtml),
    body('startDate')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
        .optional()
        .isISO8601().withMessage('Invalid end date format'),
    body('status')
        .optional()
        .isIn(['Active', 'Archived']).withMessage('Status must be Active or Archived'),
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    handleValidationErrors
];

exports.validateProjectId = [
    param('id')
        .custom(isValidObjectId).withMessage('Invalid project ID'),
    handleValidationErrors
];

exports.validateAddMember = [
    param('id')
        .custom(isValidObjectId).withMessage('Invalid project ID'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('role')
        .optional()
        .isIn(['Admin', 'Member', 'Viewer']).withMessage('Role must be Admin, Member, or Viewer'),
    handleValidationErrors
];

exports.validateInviteMember = [
    param('id')
        .custom(isValidObjectId).withMessage('Invalid project ID'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('role')
        .optional()
        .isIn(['Admin', 'Member', 'Viewer']).withMessage('Role must be Admin, Member, or Viewer'),
    handleValidationErrors
];

exports.validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

// ============ TASK VALIDATION ============

exports.validateCreateTask = [
    body('title')
        .trim()
        .notEmpty().withMessage('Task title is required')
        .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters')
        .customSanitizer(sanitizeHtml),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
        .customSanitizer(sanitizeHtml),
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .custom(isValidObjectId).withMessage('Invalid project ID'),
    body('status')
        .optional()
        .isIn(['Todo', 'In Progress', 'Review', 'Completed']).withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
    body('assignees')
        .optional()
        .isArray().withMessage('Assignees must be an array'),
    body('assignees.*')
        .optional()
        .custom(isValidObjectId).withMessage('Invalid assignee ID'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('Invalid due date format'),
    body('estimatedTime')
        .optional()
        .isFloat({ min: 0 }).withMessage('Estimated time must be a positive number'),
    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    handleValidationErrors
];

exports.validateUpdateTask = [
    param('id')
        .custom(isValidObjectId).withMessage('Invalid task ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters')
        .customSanitizer(sanitizeHtml),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
        .customSanitizer(sanitizeHtml),
    body('status')
        .optional()
        .isIn(['Todo', 'In Progress', 'Review', 'Completed']).withMessage('Invalid status'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
    body('assignees')
        .optional()
        .isArray().withMessage('Assignees must be an array'),
    body('assignees.*')
        .optional()
        .custom(isValidObjectId).withMessage('Invalid assignee ID'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('Invalid due date format'),
    body('estimatedTime')
        .optional()
        .isFloat({ min: 0 }).withMessage('Estimated time must be a positive number'),
    body('actualTime')
        .optional()
        .isFloat({ min: 0 }).withMessage('Actual time must be a positive number'),
    handleValidationErrors
];

exports.validateTaskId = [
    param('id')
        .custom(isValidObjectId).withMessage('Invalid task ID'),
    handleValidationErrors
];

exports.validateBulkOperation = [
    body('taskIds')
        .notEmpty().withMessage('Task IDs are required')
        .isArray({ min: 1 }).withMessage('Task IDs must be a non-empty array'),
    body('taskIds.*')
        .custom(isValidObjectId).withMessage('Invalid task ID in array'),
    handleValidationErrors
];

exports.validateBulkUpdateStatus = [
    body('taskIds')
        .notEmpty().withMessage('Task IDs are required')
        .isArray({ min: 1 }).withMessage('Task IDs must be a non-empty array'),
    body('taskIds.*')
        .custom(isValidObjectId).withMessage('Invalid task ID in array'),
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['Todo', 'In Progress', 'Review', 'Completed']).withMessage('Invalid status'),
    handleValidationErrors
];

exports.validateBulkAssign = [
    body('taskIds')
        .notEmpty().withMessage('Task IDs are required')
        .isArray({ min: 1 }).withMessage('Task IDs must be a non-empty array'),
    body('taskIds.*')
        .custom(isValidObjectId).withMessage('Invalid task ID in array'),
    body('assigneeIds')
        .notEmpty().withMessage('Assignee IDs are required')
        .isArray({ min: 1 }).withMessage('Assignee IDs must be a non-empty array'),
    body('assigneeIds.*')
        .custom(isValidObjectId).withMessage('Invalid assignee ID in array'),
    handleValidationErrors
];

// ============ FILE VALIDATION ============

exports.validateFileUpload = [
    param('taskId')
        .custom(isValidObjectId).withMessage('Invalid task ID'),
    handleValidationErrors
];

module.exports = exports;

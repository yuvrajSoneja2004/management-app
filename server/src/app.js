const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/error.middleware');
const NotFoundError = require('./errors/NotFoundError');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/project/project.routes');
const taskRoutes = require('./modules/task/task.routes');
const fileRoutes = require('./modules/file/file.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const seedRoutes = require('./routes/seed.routes');

const app = express();

// Security Middleware
// Helmet - Security headers with enhanced configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", process.env.SERVER_URL || 'http://localhost:5000', 'ws://localhost:5000', 'ws://*'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for file previews
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsing with size limits to prevent DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// NOTE: XSS Protection is handled by validation middleware (sanitizeHtml function)
// xss-clean package is incompatible with Express 5.x
// All user inputs are sanitized in validation.middleware.js

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Jello API',
        version: '1.0.0',
        status: 'running',
        docs: '/api-docs'
    });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Jello API Documentation',
    customCss: '.swagger-ui .topbar { display: none }'
}));

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Apply global rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/seed', seedRoutes);


// 404 Handler - must be after all routes
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Centralized Error Handling Middleware - must be last
app.use(errorHandler);

module.exports = app;

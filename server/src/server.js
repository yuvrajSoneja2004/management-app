require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinProject', (projectId) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
    });

    socket.on('leaveProject', (projectId) => {
        socket.leave(projectId);
        console.log(`Socket ${socket.id} left project ${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible to our router
app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Backend server started');
});

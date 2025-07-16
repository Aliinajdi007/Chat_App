// server.js
// Main server file for the Realtime Chat App

const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Map userId -> socketId
let userSockets = {};

// Listen for client connections
io.on('connection', (socket) => {
    console.log(`[SERVER] Socket connected: ${socket.id}`);

    // When a user joins with a userId
    socket.on('join', (userId) => {
        if (userId) {
            userSockets[userId] = socket.id;
            console.log(`[SERVER] User '${userId}' joined with socket ID '${socket.id}'`);
        }
    });

    // When a user sends a chat message
    socket.on('chat-message', (msg, recipientId) => {
        const senderId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
        if (!senderId || !recipientId) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageData = { userId: senderId, msg, timestamp, recipient_id: recipientId };

        // Send to recipient if online
        if (userSockets[recipientId]) {
            io.to(userSockets[recipientId]).emit('chat-message', messageData);
        }
        // Always send to sender
        if (userSockets[senderId]) {
            io.to(userSockets[senderId]).emit('chat-message', messageData);
        }
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        // Remove user from userSockets
        for (const [userId, sid] of Object.entries(userSockets)) {
            if (sid === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
        console.log(`[SERVER] Socket disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 
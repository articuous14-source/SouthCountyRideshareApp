const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Send message
router.post('/', requireAuth, async (req, res) => {
    try {
        const { toUsername, toName, message } = req.body;
        const user = req.session.driver || req.session.admin;
        
        const newMessage = new Message({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            fromUsername: user.username,
            fromName: user.name,
            toUsername,
            toName,
            message
        });
        
        await newMessage.save();
        res.json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversation between two users
router.get('/conversation/:otherUsername', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        const { otherUsername } = req.params;
        
        const messages = await Message.find({
            $or: [
                { fromUsername: user.username, toUsername: otherUsername },
                { fromUsername: otherUsername, toUsername: user.username }
            ]
        }).sort({ timestamp: 1 });
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all conversations for current user
router.get('/conversations', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        const userRole = user.role || (req.session.admin ? 'admin' : 'driver');
        
        // Get all messages for this user
        const messages = await Message.find({
            $or: [
                { fromUsername: user.username },
                { toUsername: user.username }
            ]
        }).sort({ timestamp: -1 });
        
        // Group by conversation partner
        const conversations = {};
        messages.forEach(msg => {
            let otherUser, otherName;
            if (msg.fromUsername === user.username) {
                otherUser = msg.toUsername;
                otherName = msg.toName;
            } else {
                otherUser = msg.fromUsername;
                otherName = msg.fromName;
            }
            
            if (!conversations[otherUser]) {
                conversations[otherUser] = {
                    username: otherUser,
                    name: otherName,
                    lastMessage: msg,
                    unreadCount: 0
                };
            }
            
            if (new Date(msg.timestamp) > new Date(conversations[otherUser].lastMessage.timestamp)) {
                conversations[otherUser].lastMessage = msg;
            }
            
            if (msg.toUsername === user.username && !msg.read) {
                conversations[otherUser].unreadCount++;
            }
        });
        
        // Get all users that should be visible
        let allUsers = [];
        if (userRole === 'admin') {
            // Admin should see all drivers
            allUsers = await User.find({ role: 'driver' });
        } else {
            // Driver should see all other drivers and all admins
            const otherDrivers = await User.find({ role: 'driver', username: { $ne: user.username } });
            const admins = await User.find({ role: 'admin' });
            allUsers = [...otherDrivers, ...admins];
        }
        
        // Add users that don't have conversations yet
        allUsers.forEach(otherUser => {
            if (!conversations[otherUser.username]) {
                conversations[otherUser.username] = {
                    username: otherUser.username,
                    name: otherUser.name,
                    lastMessage: null,
                    unreadCount: 0
                };
            }
        });
        
        // Convert to array and sort
        const conversationsArray = Object.values(conversations);
        
        // Sort: conversations with messages first (by timestamp), then users without messages (alphabetically)
        conversationsArray.sort((a, b) => {
            if (a.lastMessage && b.lastMessage) {
                // Both have messages - sort by timestamp (newest first)
                return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
            } else if (a.lastMessage && !b.lastMessage) {
                // a has message, b doesn't - a comes first
                return -1;
            } else if (!a.lastMessage && b.lastMessage) {
                // b has message, a doesn't - b comes first
                return 1;
            } else {
                // Neither has messages - sort alphabetically by name
                return a.name.localeCompare(b.name);
            }
        });
        
        res.json(conversationsArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark conversation as read
router.post('/conversation/:otherUsername/read', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        const { otherUsername } = req.params;
        
        await Message.updateMany(
            { fromUsername: otherUsername, toUsername: user.username, read: false },
            { read: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get unread message count
router.get('/unread-count', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        const count = await Message.countDocuments({ 
            toUsername: user.username, 
            read: false 
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== GROUP MESSAGING ROUTES ==========

// Send group message
router.post('/group', requireAuth, async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.session.driver || req.session.admin;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        const newGroupMessage = new GroupMessage({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            fromUsername: user.username,
            fromName: user.name,
            fromRole: user.role || (req.session.admin ? 'admin' : 'driver'),
            message: message.trim(),
            readBy: [{
                username: user.username,
                readAt: new Date()
            }]
        });
        
        await newGroupMessage.save();
        res.json({ success: true, message: newGroupMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all group messages
router.get('/group', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        const { limit = 100 } = req.query;
        
        const messages = await GroupMessage.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        // Mark messages as read for this user if not already read
        const unreadMessages = messages.filter(msg => 
            !msg.readBy.some(r => r.username === user.username)
        );
        
        if (unreadMessages.length > 0) {
            await Promise.all(unreadMessages.map(msg => {
                msg.readBy.push({
                    username: user.username,
                    readAt: new Date()
                });
                return msg.save();
            }));
        }
        
        // Return messages in chronological order (oldest first)
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get unread group message count
router.get('/group/unread-count', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        const messages = await GroupMessage.find().sort({ timestamp: -1 });
        
        const unreadCount = messages.filter(msg => 
            !msg.readBy.some(r => r.username === user.username)
        ).length;
        
        res.json({ count: unreadCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all group messages as read
router.post('/group/read-all', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        
        const messages = await GroupMessage.find({
            'readBy.username': { $ne: user.username }
        });
        
        await Promise.all(messages.map(msg => {
            msg.readBy.push({
                username: user.username,
                readAt: new Date()
            });
            return msg.save();
        }));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;





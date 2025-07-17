const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const { protect, notificationAccess } = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(protect);
router.use(notificationAccess);

// Fetch notifications for a user or their roles
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { since, limit = 20, page = 1, domain } = req.query;
    try {
        const query = {
            $or: [
                { recipients: userId },
                { roles: { $in: req.user?.roles || ['Admin'] } }
            ],
            isRead: false
        };
        if (since) {
            query.createdAt = { $gt: new Date(since) };
        }
        if (domain && domain !== 'all') { // Add domain filter
            query.domain = domain;
        }
        console.log('Fetching notifications with query:', query);
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await Notification.countDocuments(query);
        console.log('Notifications fetched:', notifications.length, 'Total:', total);
        res.json({ success: true, data: notifications, total, page, limit });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
    }
});

// Fetch all notifications (for admin or debugging)
router.get('/all', async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching all notifications', error: error.message });
    }
});

// Get unread notification count
router.get('/count/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const count = await Notification.countDocuments({
            $or: [
                { recipients: userId },
                { roles: { $in: req.user?.roles || ['Admin'] } }
            ],
            isRead: false
        });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notification count', error: error.message });
    }
});

// Mark a notification as read
router.patch('/mark-read/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking notification as read', error: error.message });
    }
});

// Mark all notifications as read for a user
router.patch('/mark-all-read/:userId', async (req, res) => {
    try {
        await Notification.updateMany(
            {
                $or: [
                    { recipients: req.params.userId },
                    { roles: { $in: req.user?.roles || ['Admin'] } }
                ],
                isRead: false
            },
            { isRead: true, readAt: new Date() }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking all notifications as read', error: error.message });
    }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting notification', error: error.message });
    }
});

module.exports = router;
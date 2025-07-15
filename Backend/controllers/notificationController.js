const Notification = require('../models/notificationModel');

const getAllNotifications = async (req, res) => {
    try {
        const { domain, type, isRead, limit = 50, page = 1 } = req.query;

        const filter = {};
        if (req.notificationFilter) {
            Object.assign(filter, req.notificationFilter);
        }
        if (domain) filter.domain = domain;
        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const notifications = await Notification.find(filter)
            .sort({ dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            count: notifications.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
            count: 0,
            total: 0,
            page: 1,
            pages: 1,
            data: [],
            fallback: true
        });
    }
};

const getNotificationById = async (req, res) => {
    try {
        let query = { _id: req.params.id };
        if (req.notificationFilter) {
            Object.assign(query, req.notificationFilter);
        }

        const notification = await Notification.findOne(query);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
                count: 0,
                fallback: true
            });
        }

        res.json({
            success: true,
            count: 1,
            data: notification
        });
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification',
            error: error.message,
            count: 0,
            fallback: true
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        let query = { _id: req.params.id };
        if (req.notificationFilter) {
            Object.assign(query, req.notificationFilter);
        }

        const notification = await Notification.findOneAndUpdate(
            query,
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
                count: 0,
                fallback: true
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read',
            count: 1,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
            count: 0,
            fallback: true
        });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const { domain, type } = req.body;
        const filter = { isRead: false };
        if (req.notificationFilter) {
            Object.assign(filter, req.notificationFilter);
        }
        if (domain) filter.domain = domain;
        if (type) filter.type = type;

        const result = await Notification.updateMany(
            filter,
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read',
            error: error.message,
            count: 0,
            fallback: true
        });
    }
};

const deleteNotification = async (req, res) => {
    try {
        let query = { _id: req.params.id };
        if (req.notificationFilter) {
            Object.assign(query, req.notificationFilter);
        }

        const notification = await Notification.findOneAndDelete(query);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
                count: 0,
                fallback: true
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully',
            count: 1
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message,
            count: 0,
            fallback: true
        });
    }
};

const getUnreadCounts = async (req, res) => {
    try {
        const { domain } = req.query;
        const baseMatch = { isRead: false };
        if (req.notificationFilter) {
            Object.assign(baseMatch, req.notificationFilter);
        }
        if (domain) baseMatch.domain = domain;

        const counts = await Notification.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    type: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        const totalCount = counts.reduce((sum, item) => sum + item.count, 0);

        res.json({
            success: true,
            totalUnread: totalCount,
            count: counts.length,
            counts
        });
    } catch (error) {
        console.error('Error getting notification counts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification counts',
            error: error.message,
            count: 0,
            totalUnread: 0,
            counts: [],
            fallback: true
        });
    }
};

module.exports = {
    getAllNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCounts
};
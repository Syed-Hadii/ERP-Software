import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import AuthService from '../utils/auth';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [prevUnreadCount, setPrevUnreadCount] = useState(0);
    const [notificationStatus, setNotificationStatus] = useState(null);

    // Get user from AuthService
    const user = AuthService.getUser();
    const userId = user?._id;
    const userRole = user?.role;

    // Helper function to get auth token with expiry check
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            AuthService.logout();
            setError('Session expired. Please log in again.');
            return {};
        }
        return { Authorization: `Bearer ${token}` };
    };

    // Fetch user-specific notifications with pagination
    const fetchNotifications = useCallback(async (page = 1, append = false) => {
        if (!userId) {
            setError('Please log in to view notifications');
            setNotifications([]);
            return { success: false, data: [] };
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_ENDPOINTS.notifications.all(userId), {
                headers: getAuthHeader(),
                params: { limit: 50, page },
            });

            if (response.data && response.data.success) {
                setNotifications((prev) => append ? [...prev, ...(response.data.data || [])] : response.data.data || []);
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Failed to fetch notifications');
            }
        } catch (err) {
            const errorMsg =
                err.response?.status === 401
                    ? 'Session expired. Please log in again.'
                    : err.response?.status === 500
                        ? 'Server error. Please try later.'
                        : err.message || 'Failed to fetch notifications';
            setError(errorMsg);
            if (!append) setNotifications([]);
            return { success: false, data: [] };
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Fetch user-specific unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!userId) {
            setError('Please log in to view notifications');
            return 0;
        }
        try {
            const response = await axios.get(API_ENDPOINTS.notifications.count(userId), {
                headers: getAuthHeader(),
            });

            if (response.data && response.data.success) {
                const newCount = response.data.count || 0;
                setUnreadCount(newCount);
                return newCount;
            }
            throw new Error(response.data?.message || 'Failed to fetch unread count');
        } catch (err) {
            const errorMsg =
                err.response?.status === 401
                    ? 'Session expired. Please log in again.'
                    : err.response?.status === 500
                        ? 'Server error. Please try later.'
                        : err.message || 'Failed to fetch unread count';
            setError(errorMsg);
            return 0;
        }
    }, [userId]);

    // Mark a single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const response = await axios.patch(
                API_ENDPOINTS.notifications.markAsRead(notificationId),
                {},
                { headers: getAuthHeader() }
            );

            if (response.data && response.data.success) {
                setNotifications(prev => prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true, readAt: new Date() }
                        : notification
                ));
                await fetchUnreadCount();
            } else {
                throw new Error(response.data?.message || 'Failed to mark notification as read');
            }
        } catch (err) {
            const errorMsg =
                err.response?.status === 401
                    ? 'Session expired. Please log in again.'
                    : err.response?.status === 500
                        ? 'Server error. Please try later.'
                        : err.message || 'Failed to mark as read';
            setError(errorMsg);
        }
    }, []);

    // Mark all notifications as read for the user
    const markAllAsRead = useCallback(async () => {
        if (!userId) {
            setError('Please log in to mark notifications');
            return;
        }
        try {
            const response = await axios.patch(
                API_ENDPOINTS.notifications.markAllAsRead(userId),
                {},
                { headers: getAuthHeader() }
            );

            if (response.data && response.data.success) {
                setNotifications(prev => prev.map(notification => ({
                    ...notification,
                    isRead: true,
                    readAt: new Date()
                })));
                setUnreadCount(0);
            } else {
                throw new Error(response.data?.message || 'Failed to mark all notifications as read');
            }
        } catch (err) {
            const errorMsg =
                err.response?.status === 401
                    ? 'Session expired. Please log in again.'
                    : err.response?.status === 500
                        ? 'Server error. Please try later.'
                        : err.message || 'Failed to mark all as read';
            setError(errorMsg);
        }
    }, [userId]);

    // Generate notifications with feedback
    const generateNotifications = useCallback(async (type) => {
        const endpoints = {
            all: API_ENDPOINTS.notifications.generate,
            agriculture: API_ENDPOINTS.agricultureNotifications.generateAll,
            cattle: API_ENDPOINTS.cattleNotifications.generateAll,
            inventory: API_ENDPOINTS.inventoryNotifications.generateAll,
            hr: API_ENDPOINTS.hrNotifications.generateAll,
            finance: API_ENDPOINTS.financeNotifications.generateAll
        };

        const endpoint = endpoints[type] || API_ENDPOINTS.notifications.generate;
        setIsLoading(true);
        setNotificationStatus(null);
        try {
            const response = await axios.post(endpoint, {}, { headers: getAuthHeader() });
            if (response.data && response.data.success) {
                setNotificationStatus({ type: 'success', message: `Successfully generated ${type} notifications` });
                await fetchNotifications();
                await fetchUnreadCount();
                return true;
            }
            throw new Error(response.data?.message || `Failed to generate ${type} notifications`);
        } catch (err) {
            const errorMsg =
                err.response?.status === 401
                    ? 'Session expired. Please log in again.'
                    : err.response?.status === 500
                        ? 'Server error. Please try later.'
                        : err.message || `Failed to generate ${type} notifications`;
            setError(errorMsg);
            setNotificationStatus({ type: 'error', message: errorMsg });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch and optimized polling
    useEffect(() => {
        if (!userId) return;

        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(async () => {
            const newCount = await fetchUnreadCount();
            if (newCount > prevUnreadCount) {
                await fetchNotifications();
            }
            setPrevUnreadCount(newCount);
        }, 60000);

        return () => clearInterval(interval);
    }, [userId, fetchNotifications, fetchUnreadCount, prevUnreadCount]);

    return {
        notifications,
        unreadCount,
        prevUnreadCount,
        isLoading,
        error,
        notificationStatus,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        generateNotifications,
        harvestAlerts: notifications.filter(n => n.type === 'harvest'),
        scheduleAlerts: notifications.filter(n => n.type === 'schedule'),
        inventoryAlerts: notifications.filter(n => n.type === 'inventory'),
        cattleAlerts: notifications.filter(n =>
            n.type === 'cattle-health' ||
            n.type === 'cattle-milking' ||
            (n.type === 'inventory' && n.domain === 'cattle') ||
            n.type === 'sales-approval'
        ),
        inventoryRequestAlerts: notifications.filter(n => n.type === 'inventory-request'),
        inventoryResponseAlerts: notifications.filter(n => n.type === 'inventory-request-response'),
        hrAlerts: notifications.filter(n =>
            n.domain === 'hr' ||
            n.type === 'payroll-request' ||
            n.type === 'payroll-approval'
        ),
        financeAlerts: notifications.filter(n =>
            n.domain === 'finance' ||
            n.type === 'purchase-invoice' ||
            n.type === 'sales-invoice' ||
            n.type === 'purchase-approval' ||
            n.type === 'sales-approval'
        ),
        userRole,
        showAgricultureControls: userRole === 'Admin' || userRole === 'Crop Manager',
        showCattleControls: userRole === 'Admin' || userRole === 'Dairy Manager',
        showInventoryControls: userRole === 'Admin' || userRole === 'Inventory Manager',
        showHRControls: userRole === 'Admin' || userRole === 'HR Manager',
        showFinanceControls: userRole === 'Admin' || userRole === 'Finance Manager'
    };
};

export default useNotifications;
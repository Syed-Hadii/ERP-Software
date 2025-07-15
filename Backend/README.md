# Farm Management Dashboard Notification System - Backend

This backend implements a comprehensive notification system for a farm management dashboard, supporting both agriculture and cattle management domains.

## Features

- **Multi-Domain Support**: Handles both agriculture and cattle notifications
- **Multiple Alert Types**:
  - **Harvest Alerts**: Notifies about upcoming harvest dates
  - **Schedule Alerts**: Tracks irrigation, fertilization, and pesticide application schedules
  - **Inventory Alerts**: Monitors low stock levels across both domains
  - **Cattle-Specific Alerts**: Framework for health checks, breeding, and milking (placeholders for future implementation)
- **Scheduled Notifications**: Automatic generation of alerts on a scheduled basis
- **Read Status Tracking**: Tracks which notifications have been read
- **Filtering and Pagination**: API supports filtering by type, domain, and read status

## Getting Started

### Installation

1. Install the required dependencies:

```bash
cd Backend
npm install
# Make sure node-cron and axios are installed
npm install node-cron axios
```

2. Start the server:

```bash
npm run dev
```

## API Endpoints

### Common Notification Endpoints

- `GET /notifications/all` - Get all notifications (supports query parameters for filtering)
- `GET /notifications/count` - Get count of unread notifications by type
- `GET /notifications/:id` - Get a specific notification by ID
- `PATCH /notifications/mark-read/:id` - Mark a specific notification as read
- `PATCH /notifications/mark-all-read` - Mark all notifications as read (can filter by domain/type)
- `DELETE /notifications/:id` - Delete a specific notification

### Agriculture Notification Generators

- `POST /agriculture-notifications/generate/harvest` - Generate harvest notifications
- `POST /agriculture-notifications/generate/schedule` - Generate schedule notifications
- `POST /agriculture-notifications/generate/inventory` - Generate inventory notifications
- `POST /agriculture-notifications/generate/all` - Generate all agriculture notifications

### Cattle Notification Generators

- `POST /cattle-notifications/generate/health` - Generate health check notifications (placeholder)
- `POST /cattle-notifications/generate/breeding` - Generate breeding notifications (placeholder)
- `POST /cattle-notifications/generate/milking` - Generate milking notifications (placeholder)
- `POST /cattle-notifications/generate/inventory` - Generate inventory notifications
- `POST /cattle-notifications/generate/all` - Generate all cattle notifications

### Manual Trigger

- `POST /api/generate-all-notifications` - Manually trigger all notification generators

## Integrating with the Frontend

To connect this backend with the frontend notification system:

1. Update the frontend `useNotifications` hook to fetch data from the backend:

```javascript
// src/hooks/useNotifications.js
import { useState, useEffect } from "react";
import axios from "axios";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3002/notifications/all"
      );
      setNotifications(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to fetch notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const getUnreadCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3002/notifications/count"
      );
      return response.data.totalUnread;
    } catch (err) {
      console.error("Error fetching unread count:", err);
      return 0;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:3002/notifications/mark-read/${notificationId}`
      );
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId)
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch("http://localhost:3002/notifications/mark-all-read");
      setNotifications([]);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
    getUnreadCount,
    harvestAlerts: notifications.filter((n) => n.type === "harvest"),
    scheduleAlerts: notifications.filter((n) => n.type === "schedule"),
    inventoryAlerts: notifications.filter((n) => n.type === "inventory"),
  };
};

export default useNotifications;
```

2. Update the `NotificationsMenu` component to handle the backend notification format:

```jsx
// Adjust the rendering of notifications to match the backend data structure
<Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
  {notification.title}
</Typography>
<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
  {notification.message}
</Typography>
```

## Scheduled Tasks

The system automatically generates notifications using node-cron:

- Agriculture notifications: Every hour at the top of the hour
- Cattle notifications: Every hour at 30 minutes past the hour

## Models

### Notification Model

This is the core model used to store all notifications:

```javascript
const NotificationSchema = new Schema({
  type: {
    type: String,
    enum: [
      "harvest",
      "schedule",
      "inventory",
      "cattle-health",
      "cattle-breeding",
      "cattle-milking",
    ],
    required: true,
  },
  title: String,
  message: String,
  domain: {
    type: String,
    enum: ["agriculture", "cattle"],
    required: true,
  },
  entityId: Schema.Types.ObjectId, // Reference to related entity
  entityModel: String, // Model name of related entity
  dueDate: Date,
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  // Plus additional specific fields for each notification type
});
```

## Extending the System

### Adding New Notification Types

1. Add the new type to the `type` enum in the notification model
2. Create a generator function in the appropriate controller
3. Add a route to the appropriate router
4. Update the frontend to handle the new notification type

### Integrating with Cattle Models

When cattle models are implemented:

1. Update the cattle notification controller with actual implementations
2. Connect to the real cattle data sources
3. Uncomment the cattle notification generators in the scheduler

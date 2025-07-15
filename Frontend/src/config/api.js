/**
 * API Configuration for Farm Management Dashboard
 */
import { BASE_URL } from "./config";

// API endpoints 
export const API_ENDPOINTS = {
    // Notification endpoints
    notifications: {
        all: (userId) => `${BASE_URL}/notifications/${userId}`,
        count: (userId) => `${BASE_URL}/notifications/count/${userId}`,
        markAsRead: (id) => `${BASE_URL}/notifications/mark-read/${id}`,
        markAllAsRead: (userId) => `${BASE_URL}/notifications/mark-all-read/${userId}`,
        generate: `${BASE_URL}/notifications/all`,
        delete: (id) => `${BASE_URL}/notifications/${id}`
    },

    // Agriculture notification generators
    agricultureNotifications: {
        generateHarvest: `${BASE_URL}/agriculture-notifications/generate/harvest`,
        generateSchedule: `${BASE_URL}/agriculture-notifications/generate/schedule`,
        generateAll: `${BASE_URL}/agriculture-notifications/generate/all`,
    },

    // Cattle notification generators
    cattleNotifications: {
        generateHealth: `${BASE_URL}/cattle-notifications/generate/health`,
        generateMilkProduction: `${BASE_URL}/cattle-notifications/generate/milk-production`,
        generateAll: `${BASE_URL}/cattle-notifications/generate/all`,
    },

    // Inventory notification generators
    inventoryNotifications: {
        generateLowStock: `${BASE_URL}/inventory-notifications/generate/low-stock`,
        generateRequests: `${BASE_URL}/inventory-notifications/generate/requests`,
        generateRequestResponses: `${BASE_URL}/inventory-notifications/generate/request-responses`,
        generateAll: `${BASE_URL}/inventory-notifications/generate/all`,
    },

    // HR notification generators
    hrNotifications: {
        generatePayrollRequests: `${BASE_URL}/hr-notifications/generate/payroll-requests`,
        generatePayrollApprovals: `${BASE_URL}/hr-notifications/generate/payroll-approvals`,
        generateAll: `${BASE_URL}/hr-notifications/generate/all`,
    },

    // Finance notification generators
    financeNotifications: {
        generatePurchaseInvoice: `${BASE_URL}/finance-notifications/generate/purchase-invoices`,
        generateSalesInvoice: `${BASE_URL}/finance-notifications/generate/sales-invoices`,
        generatePurchaseApproval: `${BASE_URL}/finance-notifications/generate/purchase-approvals`,
        generateSalesApproval: `${BASE_URL}/finance-notifications/generate/sales-approvals`,
        generateAll: `${BASE_URL}/finance-notifications/generate/all`,
    }
};

export default API_ENDPOINTS;
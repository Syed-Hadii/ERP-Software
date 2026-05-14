// DNS setup for MongoDB Atlas on Windows
require('./dns-setup.js');

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db.js");
const userRouter = require("./routes/userRoute.js");
const landRouter = require("./routes/Agriculture/landRoute.js");
const farmerRouter = require("./routes/Agriculture/farmerRoute.js");
const cropSowRouter = require("./routes/Agriculture/crop-sow.js");
const supplierRouter = require("./routes/Inventory/supplierRoute.js");
const inventoryRouter = require("./routes/Inventory/Inventory.js");
const bankRouter = require("./routes/Finance/bankAccountRoute.js");
const itemRoter = require("./routes/Inventory/itemRoute.js");
const stockConsumeRouter = require("./routes/Inventory/stockConsumeRoute.js");
const chartAccountRouter = require("./routes/Finance/chartAccountsRoute.js");
const transactionEntryRouter = require("./routes/Finance/transactionEntry.js");
const journalVoucherRouter = require("./routes/Finance/journalVoucherRoute.js");
const reminderRouter = require("./routes/reminderRoute.js");
const { errorHandler } = require("./middlewares/errorMiddleware.js");
const cropRouter = require("./routes/Agriculture/crop_variety.js");
const scheduleRouter = require("./routes/Agriculture/crop_schedule.js");
const RequestRouter = require("./routes/Inventory/inventoryRequest.js");
const purchaseInvoiceRouter = require("./routes/Inventory/PurchaseInvoice.js");
const notificationRouter = require("./routes/notificationRoute.js");
const agricultureNotificationRouter = require("./routes/Agriculture/agricultureNotificationRoute.js");
const { setupNotificationScheduler } = require("./utils/notificationScheduler.js");
const inventoryNotificationRouter = require("./routes/Inventory/inventoryNotificationRoutes");
const hrNotificationRouter = require("./routes/HR/hrNotificationRoute.js");
const financeNotificationRouter = require("./routes/Finance/financeNotificationRoute.js");
const cattleRegRouter = require("./routes/Cattle/cattle-Register.js");
const exitEventsRouter = require("./routes/Cattle/exit-events.js");
const healthRouter = require("./routes/Cattle/healthEvents.js");
const milkRouter = require("./routes/Cattle/milkProductionRoutes.js");
const dairyProductRouter = require("./routes/Cattle/dairyProduct.js");
const dairyInventoryRouter = require("./routes/Cattle/dairyInventory.js");
const dairyProcessRouter = require("./routes/Cattle/dairyProcessing.js");
const feedProcessRouter = require("./routes/Cattle/feed-process.js");
const cattleDashboardRouter = require("./routes/Cattle/cattleDashboardRoute.js");
const feedUsageRouter = require("./routes/Cattle/feedUsageRoute.js");
const dairySaleRouter = require("./routes/Cattle/dairySalesRoute.js");
const cropDashboardRouter = require("./routes/Agriculture/cropDashboard.js");
const cattleNotificationRouter = require("./routes/Cattle/cattleNotificationRoute.js");
const employeeRouter = require("./routes/HR/employee.js");
const attendanceRouter = require("./routes/HR/attendance.js");
const loanRouter = require("./routes/HR/loan.js");
const payrollRouter = require("./routes/HR/payroll.js");
const analyticRouter = require("./routes/HR/employeeAnalytics.js");
const incrementRouter = require("./routes/HR/increment.js");
const financeDashboardRouter = require("./routes/Finance/financeDashboard.js");
const closingRouter = require("./routes/Finance/closingRoute.js");
const customerRouter = require("./routes/Inventory/CustomerRoute.js");
const dashboardRouter = require("./routes/dashboardRoute.js");
const InvoiceApprovalRouter = require("./routes/Inventory/InvoiceApprovalRoute.js");
const InventoryWriteOffRouter = require("./routes/Inventory/InventoryWriteOffRoute.js");
const payrollRequestRouter = require("./routes/HR/payrollRequest.js");
const inventoryDashboardRouter = require("./routes/Inventory/InventoryDashboardRoute.js");
const agricultureDashboardRouter = require("./routes/Agriculture/AgricultureDashboardRoute.js");
const agroInventoryRouter = require("./routes/Agriculture/agroInventory.js");
const batchEntryRouter = require("./routes/Finance/batchEntry.js");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({ origin: "*" }));

// Connect to MongoDB
(async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.log("Warning: Running without database connection. Some features may not work.");
    }
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.log("Server starting without database connection. Some features may not work.");
  }
})();

// Routes
app.use("/erp-system/backend/dashboard", dashboardRouter);
app.use("/erp-system/backend/user", userRouter);
// agriculture routes
app.use("/erp-system/backend/agriculture-dashboard", agricultureDashboardRouter);
app.use("/erp-system/backend/land", landRouter);
app.use("/erp-system/backend/farmer", farmerRouter);
app.use("/erp-system/backend/crop", cropRouter);
app.use("/erp-system/backend/agro-inventory", agroInventoryRouter);
app.use("/erp-system/backend/schedule", scheduleRouter);
app.use("/erp-system/backend/cropSow", cropSowRouter);
// cattle routes 
app.use("/erp-system/backend/cattle-dashboard", cattleDashboardRouter);
app.use("/erp-system/backend/cattle", cattleRegRouter);
app.use("/erp-system/backend/health", healthRouter);
app.use("/erp-system/backend/cattle-outgoing", exitEventsRouter);
app.use("/erp-system/backend/milk-production", milkRouter);
app.use("/erp-system/backend/dairy-product", dairyProductRouter);
app.use("/erp-system/backend/dairy-process", dairyProcessRouter);
app.use("/erp-system/backend/feed-process", feedProcessRouter);
app.use("/erp-system/backend/feed-usage", feedUsageRouter);
app.use("/erp-system/backend/dairy-inventory", dairyInventoryRouter);
app.use("/erp-system/backend/dairy-sale", dairySaleRouter);
// Inventory routes
app.use("/erp-system/backend/supplier", supplierRouter);
app.use("/erp-system/backend/inventory-dashboard", inventoryDashboardRouter);
app.use("/erp-system/backend/customer", customerRouter);
app.use("/erp-system/backend/invoice-approval", InvoiceApprovalRouter);
app.use("/erp-system/backend/inventory", inventoryRouter);
app.use("/erp-system/backend/purchase", purchaseInvoiceRouter);
app.use("/erp-system/backend/items", itemRoter);
app.use("/erp-system/backend/inventoryRequest", RequestRouter);
app.use("/erp-system/backend/stockconsume", stockConsumeRouter);
app.use("/erp-system/backend/inventory-write-off", InventoryWriteOffRouter);
// HR routes
app.use("/erp-system/backend/employees", employeeRouter);
app.use("/erp-system/backend/analytic", analyticRouter);
app.use("/erp-system/backend/increment", incrementRouter);
app.use("/erp-system/backend/attendance", attendanceRouter);
app.use("/erp-system/backend/payroll", payrollRouter);
app.use("/erp-system/backend/payroll", payrollRequestRouter);
app.use("/erp-system/backend/loan", loanRouter);
// Finance routes
app.use("/erp-system/backend/bank", bankRouter);
app.use("/erp-system/backend/finance-dashboard", financeDashboardRouter);
app.use("/erp-system/backend/chartaccount", chartAccountRouter);
app.use("/erp-system/backend/transaction-entry", transactionEntryRouter);
app.use("/erp-system/backend/batch-entry", batchEntryRouter);
app.use("/erp-system/backend/journalvoucher", journalVoucherRouter);
app.use("/erp-system/backend/closePeriod", closingRouter);
app.use("/erp-system/backend/reminder", reminderRouter);

// Notification routes
app.use('/erp-system/backend/notifications', notificationRouter);
app.use('/erp-system/backend/agriculture-notifications', agricultureNotificationRouter);
app.use('/erp-system/backend/cattle-notifications', cattleNotificationRouter);
app.use('/erp-system/backend/inventory-notifications', inventoryNotificationRouter);
app.use('/erp-system/backend/hr-notifications', hrNotificationRouter);
app.use('/erp-system/backend/finance-notifications', financeNotificationRouter);

// Root route
app.get("/erp-system/backend/", (req, res) => {
  res.json({
    message: "Farm Management Dashboard API",
    version: "1.0.0",
    endpoints: {
      notifications: "/erp-system/backend/notifications",
      agricultureNotifications: "/erp-system/backend/agriculture-notifications",
      cattleNotifications: "/erp-system/backend/cattle-notifications",
      inventoryNotifications: "/erp-system/backend/inventory-notifications",
      hrNotifications: "/erp-system/backend/hr-notifications",
      financeNotifications: "/erp-system/backend/finance-notifications",
      manualTrigger: "/erp-system/backend/notifications/all"
    }
  });
});

// Set up notification scheduler
try {
  setupNotificationScheduler(app);
} catch (error) {
  console.error("Error setting up notification scheduler:", error);
}

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

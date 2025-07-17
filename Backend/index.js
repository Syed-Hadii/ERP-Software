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
app.use("/dashboard", dashboardRouter);
app.use("/user", userRouter);
// agriculture routes
app.use("/agriculture-dashboard", agricultureDashboardRouter);
app.use("/land", landRouter);
app.use("/farmer", farmerRouter);
app.use("/crop", cropRouter);
app.use("/agro-inventory", agroInventoryRouter);
app.use("/schedule", scheduleRouter);
app.use("/cropSow", cropSowRouter);
// cattle routes 
app.use("/cattle-dashboard", cattleDashboardRouter);
app.use("/cattle", cattleRegRouter);
app.use("/health", healthRouter);
app.use("/cattle-outgoing", exitEventsRouter);
app.use("/milk-production", milkRouter);
app.use("/dairy-product", dairyProductRouter);
app.use("/dairy-process", dairyProcessRouter);
app.use("/feed-process", feedProcessRouter);
app.use("/feed-usage", feedUsageRouter);
app.use("/dairy-inventory", dairyInventoryRouter);
app.use("/dairy-sale", dairySaleRouter);
// Inventory routes
app.use("/supplier", supplierRouter);
app.use("/inventory-dashboard", inventoryDashboardRouter);
app.use("/customer", customerRouter);
app.use("/invoice-approval", InvoiceApprovalRouter);
app.use("/inventory", inventoryRouter);
app.use("/purchase", purchaseInvoiceRouter);
app.use("/items", itemRoter);
app.use("/inventoryRequest", RequestRouter);
app.use("/stockconsume", stockConsumeRouter);
app.use("/inventory-write-off", InventoryWriteOffRouter);
// HR routes
app.use("/employees", employeeRouter);
app.use("/analytic", analyticRouter);
app.use("/increment", incrementRouter);
app.use("/attendance", attendanceRouter);
app.use("/payroll", payrollRouter);
app.use("/payroll", payrollRequestRouter);
app.use("/loan", loanRouter);
// Finance routes
app.use("/bank", bankRouter);
app.use("/finance-dashboard", financeDashboardRouter);
app.use("/chartaccount", chartAccountRouter);
app.use("/transaction-entry", transactionEntryRouter);
app.use("/batch-entry", batchEntryRouter);
app.use("/journalvoucher", journalVoucherRouter);
app.use("/closePeriod", closingRouter);
app.use("/reminder", reminderRouter);

// Notification routes
app.use('/notifications', notificationRouter);
app.use('/agriculture-notifications', agricultureNotificationRouter);
app.use('/cattle-notifications', cattleNotificationRouter);
app.use('/inventory-notifications', inventoryNotificationRouter);
app.use('/hr-notifications', hrNotificationRouter);
app.use('/finance-notifications', financeNotificationRouter);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Farm Management Dashboard API",
    version: "1.0.0",
    endpoints: {
      notifications: "/notifications",
      agricultureNotifications: "/agriculture-notifications",
      cattleNotifications: "/cattle-notifications",
      inventoryNotifications: "/inventory-notifications",
      hrNotifications: "/hr-notifications",
      financeNotifications: "/finance-notifications",
      manualTrigger: "/notifications/all"
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

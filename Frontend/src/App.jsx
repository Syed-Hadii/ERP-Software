import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import Loading from "./components/Loading";
import ProtectedRoute from "./components/ProtectedRoute";
import "react-datepicker/dist/react-datepicker.css";
// Import all page components
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard";
import User from "./pages/User";
import Land from "./pages/Agriculture/Land";
import Farmer from "./pages/Agriculture/Farmer";
import CropSow from "./pages/Agriculture/Crop_Sow";
import Suppliers from "./pages/Inventory/Suppliers";
import Store from "./pages/Inventory/Store";
import Item from "./pages/Inventory/Item";
import StockConsume from "./pages/Inventory/StockConsume";
import BankAccounts from "./pages/Finance/BankAccounts";
import ChartsofAccounts from "./pages/Finance/ChartsofAccounts";
import PaymentVoucherList from "./pages/Finance/PaymentVoucherList";
import PaymentForm from "./pages/Finance/PaymentVoucherForm";
import RecieveVoucherList from "./pages/Finance/RecieveVoucherList";
import RecieveForm from "./pages/Finance/RecieveVoucherForm";
import JournalVoucherList from "./pages/Finance/JournalVoucherList";
import JournalForm from "./pages/Finance/JournalVoucherForm";
import Welcome from "./pages/Welcome";
import CattleDashboard from "./pages/Cattle/Cattle-Dashboard";
import CattleRegister from "./pages/Cattle/Cattle-Register";
import CattleOutgoing from "./pages/Cattle/Cattle-Outgoing";
import MilkProduction from "./pages/Cattle/Milk-Production";
import DairySales from "./pages/Cattle/Dairy-Sales";
import Crop_Variety from "./pages/Agriculture/Crop_Variety";
import CropDetails from "./pages/Agriculture/Crop-Details";
import Calendar from "./pages/Agriculture/Calender";
import PurchaseInvoice from "./pages/Inventory/StockReceived";
import CropInventory from "./pages/Agriculture/Crop_Inventory";
import CropRequests from "./pages/Agriculture/CropRequests";
import { HealthManagement } from "./pages/Cattle";
import StockRequests from "./pages/Cattle/StockRequest";
import CattleInventory from "./pages/Cattle/DairyInventory";
import CattleFeedUsage from "./pages/Cattle/Cattle-FeedUsage"; 
import Employees from "./pages/HR/Employees";
import EmployeeDetails from "./pages/HR/EmployeeDetails";
import Attendance from "./pages/HR/Attendance";
import Increments from "./pages/HR/Increments";
import Loans from "./pages/HR/Loans";
import EmployeeAnalytics from "./pages/HR/EmployeeAnalytics";
import Payroll from "./pages/HR/Payroll";
import BankLedger from "./pages/Finance/BankLedger";
import CoaLedger from "./pages/Finance/CoaLedger";
import CashBankSummary from "./pages/Finance/CashAndCashEquivalent";
import FinanceDashboard from "./pages/Finance/FinanceDashboard";
import Customers from "./pages/Inventory/Customers";
import InvoiceApproval from "./pages/Finance/InvoiceApproval";
import PurchaseInvoiceForm from "./components/PurchaseInvoiceForm";
import InventoryWriteOff from "./pages/Inventory/InventoryWriteOff";
import CattleWriteOff from "./pages/Cattle/CattleInventoryWrtieOff";
import CropWriteOff from "./pages/Agriculture/CropInventoryWriteOff";
import InventoryDashboard from "./pages/Inventory/InventoryDashboard";
import AgricultureDashboard from "./pages/Agriculture/AgricultureDashboard";

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Default route redirects to welcome */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          {/* Public route - Login */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/unauthorized"
            element={<div>Unauthorized Access</div>}
          />
          {/* Protected routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["Admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute
                roles={[
                  "Admin",
                  "HR Manager",
                  "Finance Manager",
                  "Crop Manager",
                  "Dairy Manager",
                  "Inventory Manager",
                  "Operations Manager",
                  "Reporting Manager",
                ]}
              >
                <Welcome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <User />
              </ProtectedRoute>
            }
          />
          {/* Agriculture Routes */}
          <Route
            path="/land"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <Land />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <Farmer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agriculture-dashboard"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <AgricultureDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <Crop_Variety />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-sow"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <CropSow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-details/:id"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <CropDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-calendar"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-inventory"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <CropInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop/inventory-write-off"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <CropWriteOff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-requests"
            element={
              <ProtectedRoute roles={["Admin", "Crop Manager"]}>
                <CropRequests />
              </ProtectedRoute>
            }
          />
          {/* Cattle Section */}
          <Route
            path="/cattle/dashboard"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <CattleDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/register"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <CattleRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/feed-usage"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <CattleFeedUsage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/health"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <HealthManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/outgoing"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <CattleOutgoing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/milk-production"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <MilkProduction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/inventory"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <CattleInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/inventory-write-off"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <CattleWriteOff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/cattle-requests"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <StockRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cattle/sales"
            element={
              <ProtectedRoute roles={["Admin", "Dairy Manager"]}>
                <DairySales />
              </ProtectedRoute>
            }
          />
          {/* HR Section */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/:id"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <EmployeeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/increments"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <Increments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <Loans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-analytics"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <EmployeeAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute roles={["Admin", "HR Manager"]}>
                <Payroll />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-dashboard"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <InventoryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute
                roles={[
                  "Admin",
                  "Inventory Manager",
                  "Crop Manager",
                  "Dairy Manager",
                ]}
              >
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <Store />
              </ProtectedRoute>
            }
          />
          <Route
            path="/item"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <Item />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock_request"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <StockConsume />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock_purchase"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <PurchaseInvoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock_purchase/form"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <PurchaseInvoiceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory/write-off"
            element={
              <ProtectedRoute roles={["Admin", "Inventory Manager"]}>
                <InventoryWriteOff />
              </ProtectedRoute>
            }
          />
          {/* Accounting Module */}
          <Route
            path="/finance-dashboard"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <FinanceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice-approval"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <InvoiceApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bankaccount"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <BankAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chartsofaccounts"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <ChartsofAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coa-ledger/:id"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <CoaLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bank-ledger/:id"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <BankLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cash-bank-summary"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <CashBankSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paymentvoucher"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <PaymentVoucherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paymentvoucher/paymentform"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <PaymentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receivevoucher"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <RecieveVoucherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receivevoucher/recieveform"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <RecieveForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journalvoucher"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <JournalVoucherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journalvoucher/journalform"
            element={
              <ProtectedRoute roles={["Admin", "Finance Manager"]}>
                <JournalForm />
              </ProtectedRoute>
            }
          />
          {/* Catch-all for invalid routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

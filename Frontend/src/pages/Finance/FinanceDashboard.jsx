import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Lock,
  CalendarToday,
  AccountBalance,
  Inventory,
  People,
  Store,
  ListAlt,
  Delete,
} from "@mui/icons-material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Default dashboard data structure
const defaultDashboardData = {
  financialSummary: {
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    netIncome: 0,
    totalBankBalance: 0,
    totalCashFlow: 0,
  },
  categoryBreakdown: [],
  topInventoryItems: [],
  recentTransactions: [],
  recentWriteOffs: [],
  inventorySummary: {
    totalItems: 0,
    totalQty: 0,
    totalValue: 0,
  },
  customerSummary: {
    totalCustomers: 0,
    totalBalance: 0,
  },
  supplierSummary: {
    totalSuppliers: 0,
    totalBalance: 0,
  },
  currentPeriod: {
    status: "No period",
    startDate: null,
    endDate: null,
  },
};

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [closingInProgress, setClosingInProgress] = useState(false);
  const [periodEndDate, setPeriodEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/finance-dashboard/dashboard`
      );
      console.log(response);
      if (response.data.success) {
        // Merge API data with default structure to ensure all fields exist
        setDashboardData({
          ...defaultDashboardData,
          ...response.data.data,
          financialSummary: {
            ...defaultDashboardData.financialSummary,
            ...(response.data.data.financialSummary || {}),
          },
          inventorySummary: {
            ...defaultDashboardData.inventorySummary,
            ...(response.data.data.inventorySummary || {}),
          },
          customerSummary: {
            ...defaultDashboardData.customerSummary,
            ...(response.data.data.customerSummary || {}),
          },
          supplierSummary: {
            ...defaultDashboardData.supplierSummary,
            ...(response.data.data.supplierSummary || {}),
          },
          currentPeriod: {
            ...defaultDashboardData.currentPeriod,
            ...(response.data.data.currentPeriod || {}),
          },
        });
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to fetch dashboard data"
        );
        setDashboardData(defaultDashboardData); // Fallback to default data
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      Wrapper.toast.error("Failed to fetch dashboard data");
      setError(err.message);
      setDashboardData(defaultDashboardData); // Fallback to default data
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction details
  const fetchTransactionDetails = async (id) => {
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/finance-dashboard/transaction/${id}`
      );
      if (response.data.success) {
        setTransactionDetails(response.data.data || {});
        setModalOpen(true);
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to fetch transaction details"
        );
      }
    } catch (err) {
      console.error("Error fetching transaction details:", err);
      Wrapper.toast.error("Failed to fetch transaction details");
    }
  };

  // Handle period closing
  const handleClosePeriod = async (e) => {
    e.preventDefault();
    if (!periodEndDate) {
      Wrapper.toast.error("Please select a valid period end date");
      return;
    }
    setClosingInProgress(true);
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/closePeriod`, {
        periodEndDate,
      });
      if (response.data.success) {
        Wrapper.toast.success("Period closed successfully");
        setClosingModalOpen(false);
        fetchDashboardData();
      } else {
        Wrapper.toast.error(response.data.message || "Failed to close period");
      }
    } catch (err) {
      console.error("Error closing period:", err);
      Wrapper.toast.error(
        err.response?.data?.message || "Failed to close period"
      );
    } finally {
      setClosingInProgress(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Financial Overview Chart Data
  const financialChartData = {
    labels: [
      "Assets",
      "Liabilities",
      "Equity",
      "Net Income",
      "Bank Balance",
      "Cash Flow",
    ],
    datasets: [
      {
        label: "Financial Metrics (PKR)",
        data: [
          dashboardData.financialSummary.totalAssets,
          dashboardData.financialSummary.totalLiabilities,
          dashboardData.financialSummary.totalEquity,
          dashboardData.financialSummary.netIncome,
          dashboardData.financialSummary.totalBankBalance,
          dashboardData.financialSummary.totalCashFlow,
        ],
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
    ],
  };

  const financialChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Financial Overview" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `PKR ${value.toLocaleString()}`,
        },
      },
    },
  };

  // Category Breakdown Chart Data
  const categoryChartData = {
    labels: dashboardData.categoryBreakdown.map((cat) => cat.category) || [],
    datasets: [
      {
        label: "Balance by Category (PKR)",
        data: dashboardData.categoryBreakdown.map((cat) => cat.total) || [],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Category Breakdown" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `PKR ${value.toLocaleString()}`,
        },
      },
    },
  };

  // Top Inventory Items Chart Data
  const inventoryChartData = {
    labels: Array.isArray(dashboardData.topInventoryItems)
      ? dashboardData.topInventoryItems.map((item) => item.name || "N/A")
      : [],
    datasets: [
      {
        label: "Inventory Value (PKR)",
        data: Array.isArray(dashboardData.topInventoryItems)
          ? dashboardData.topInventoryItems.map((item) => item.totalCost || 0)
          : [],
        borderColor: "rgba(236, 72, 153, 1)",
        backgroundColor: "rgba(236, 72, 153, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const inventoryChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Top Inventory Items by Value" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `PKR ${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <Wrapper.Box
      sx={{ minHeight: "100vh", bgcolor: "grey.100", p: { xs: 2, md: 4 } }}
    >
      {/* Header */}
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Wrapper.Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", color: "grey.800" }}
        >
          Financial Dashboard
        </Wrapper.Typography>
        <Wrapper.Button
          variant="contained"
          color="success"
          startIcon={<Lock />}
          onClick={() => setClosingModalOpen(true)}
          sx={{ textTransform: "none" }}
        >
          Close Period
        </Wrapper.Button>
      </Wrapper.Box>

      {/* Error Message */}
      {error && (
        <Wrapper.Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Wrapper.Alert>
      )}

      {/* Financial Summary */}
      <Wrapper.Grid container spacing={2} sx={{ mb: 4 }}>
        {loading
          ? [...Array(6)].map((_, i) => (
              <Wrapper.Grid item xs={12} sm={6} lg={4} key={i}>
                <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3 }}>
                  <Wrapper.Box sx={{ p: 2 }}>
                    <Wrapper.Skeleton variant="rectangular" height={80} />
                  </Wrapper.Box>
                </Wrapper.Paper>
              </Wrapper.Grid>
            ))
          : [
              {
                label: "Total Assets",
                value: dashboardData.financialSummary.totalAssets,
                icon: <AccountBalance />,
              },
              {
                label: "Total Liabilities",
                value: dashboardData.financialSummary.totalLiabilities,
                icon: <AccountBalance />,
              },
              {
                label: "Total Equity",
                value: dashboardData.financialSummary.totalEquity,
                icon: <AccountBalance />,
              },
              {
                label: "Net Income",
                value: dashboardData.financialSummary.netIncome,
                icon: <AccountBalance />,
              },
              {
                label: "Bank Balance",
                value: dashboardData.financialSummary.totalBankBalance,
                icon: <AccountBalance />,
              },
              {
                label: "Cash Flow",
                value: dashboardData.financialSummary.totalCashFlow,
                icon: <AccountBalance />,
              },
            ].map((item, index) => (
              <Wrapper.Grid item xs={12} sm={6} lg={4} key={index}>
                <Wrapper.Paper
                  sx={{
                    bgcolor: "white",
                    boxShadow: 3,
                    "&:hover": { boxShadow: 6 },
                    p: 2,
                  }}
                >
                  <Wrapper.Box
                    sx={{ display: "flex", alignItems: "center", mb: 1 }}
                  >
                    {item.icon}
                    <Wrapper.Typography sx={{ ml: 1, color: "grey.600" }}>
                      {item.label}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                  <Wrapper.Typography
                    variant="h5"
                    sx={{ color: "success.main", fontWeight: "bold" }}
                  >
                    PKR {item.value.toLocaleString()}
                  </Wrapper.Typography>
                </Wrapper.Paper>
              </Wrapper.Grid>
            ))}
      </Wrapper.Grid>

      {/* Charts Section */}
      {!loading && (
        <Wrapper.Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Financial Overview Chart */}
          <Wrapper.Grid item xs={12} lg={6}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "grey.800", mb: 2 }}
              >
                Financial Overview
              </Wrapper.Typography>
              <Bar data={financialChartData} options={financialChartOptions} />
            </Wrapper.Paper>
          </Wrapper.Grid>

          {/* Category Breakdown Chart */}
          <Wrapper.Grid item xs={12} lg={6}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "grey.800", mb: 2 }}
              >
                Category Breakdown
              </Wrapper.Typography>
              <Bar data={categoryChartData} options={categoryChartOptions} />
            </Wrapper.Paper>
          </Wrapper.Grid>
        </Wrapper.Grid>
      )}

      {/* Inventory and Party Summary */}
      {!loading && (
        <Wrapper.Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Inventory Summary */}
          <Wrapper.Grid item xs={12} lg={4}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Box
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <Inventory sx={{ mr: 1 }} />
                <Wrapper.Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "grey.800" }}
                >
                  Inventory Summary
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.Box
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Items:{" "}
                  <strong>{dashboardData.inventorySummary.totalItems}</strong>
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Quantity:{" "}
                  <strong>{dashboardData.inventorySummary.totalQty}</strong>
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Value:{" "}
                  <strong>
                    PKR{" "}
                    {dashboardData.inventorySummary.totalValue.toLocaleString()}
                  </strong>
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Paper>
          </Wrapper.Grid>

          {/* Customer Summary */}
          <Wrapper.Grid item xs={12} lg={4}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Box
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <People sx={{ mr: 1 }} />
                <Wrapper.Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "grey.800" }}
                >
                  Customer Summary
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.Box
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Customers:{" "}
                  <strong>
                    {dashboardData.customerSummary.totalCustomers}
                  </strong>
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Receivables:{" "}
                  <strong>
                    PKR{" "}
                    {dashboardData.customerSummary.totalBalance.toLocaleString()}
                  </strong>
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Paper>
          </Wrapper.Grid>

          {/* Supplier Summary */}
          <Wrapper.Grid item xs={12} lg={4}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Box
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <Store sx={{ mr: 1 }} />
                <Wrapper.Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "grey.800" }}
                >
                  Supplier Summary
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.Box
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Suppliers:{" "}
                  <strong>
                    {dashboardData.supplierSummary.totalSuppliers}
                  </strong>
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                  Total Payables:{" "}
                  <strong>
                    PKR{" "}
                    {dashboardData.supplierSummary.totalBalance.toLocaleString()}
                  </strong>
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Paper>
          </Wrapper.Grid>
        </Wrapper.Grid>
      )}

      {/* Top Inventory Items Chart */}
      {!loading && (
        <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, mb: 4, p: 2 }}>
          <Wrapper.Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "grey.800", mb: 2 }}
          >
            Top Inventory Items
          </Wrapper.Typography>
          <Line data={inventoryChartData} options={inventoryChartOptions} />
        </Wrapper.Paper>
      )}

      {/* Recent Transactions and Write-Offs */}
      {!loading && (
        <Wrapper.Grid container spacing={2} sx={{ mb: 4 }}>
          {/* Recent Transactions */}
          <Wrapper.Grid item xs={12} lg={6}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Box
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <ListAlt sx={{ mr: 1 }} />
                <Wrapper.Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "grey.800" }}
                >
                  Recent Transactions
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.TableContainer component={Wrapper.Paper}>
                <Wrapper.Table>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow sx={{ bgcolor: "grey.100" }}>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Date
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Type
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Reference
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Description
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          textAlign: "right",
                        }}
                      >
                        Amount
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          textAlign: "right",
                        }}
                      >
                        Status
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {dashboardData.recentTransactions.length > 0 ? (
                      dashboardData.recentTransactions.map((tx, index) => (
                        <Wrapper.TableRow
                          key={index}
                          hover
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "grey.50" },
                          }}
                          onClick={() => fetchTransactionDetails(tx.id)}
                        >
                          <Wrapper.TableCell>
                            {new Date(tx.date).toLocaleDateString()}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {tx.type || "N/A"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {tx.reference || "N/A"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {tx.description || "N/A"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell
                            sx={{ textAlign: "right", color: "success.main" }}
                          >
                            PKR {(tx.amount || 0).toLocaleString()}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell sx={{ textAlign: "right" }}>
                            {tx.status || "N/A"}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                      ))
                    ) : (
                      <Wrapper.TableRow>
                        <Wrapper.TableCell
                          colSpan={6}
                          sx={{ textAlign: "center", color: "grey.600" }}
                        >
                          No transactions found
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    )}
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.TableContainer>
            </Wrapper.Paper>
          </Wrapper.Grid>

          {/* Recent Inventory Write-Offs */}
          <Wrapper.Grid item xs={12} lg={6}>
            <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, p: 2 }}>
              <Wrapper.Box
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <Delete sx={{ mr: 1 }} />
                <Wrapper.Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "grey.800" }}
                >
                  Recent Inventory Write-Offs
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.TableContainer component={Wrapper.Paper}>
                <Wrapper.Table>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow sx={{ bgcolor: "grey.100" }}>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Date
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Reference
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                        }}
                      >
                        Item
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          textAlign: "right",
                        }}
                      >
                        Quantity
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {dashboardData.recentWriteOffs.length > 0 ? (
                      dashboardData.recentWriteOffs.flatMap((wo, index) =>
                        (wo.items || []).map((item, i) => (
                          <Wrapper.TableRow
                            key={`${index}-${i}`}
                            sx={{ "&:hover": { bgcolor: "grey.50" } }}
                          >
                            <Wrapper.TableCell>
                              {new Date(wo.date).toLocaleDateString()}
                            </Wrapper.TableCell>
                            <Wrapper.TableCell>
                              {wo.reference || "N/A"}
                            </Wrapper.TableCell>
                            <Wrapper.TableCell>
                              {item.itemName || "N/A"} ({item.itemCode || "N/A"}
                              )
                            </Wrapper.TableCell>
                            <Wrapper.TableCell sx={{ textAlign: "right" }}>
                              {item.quantity || 0}
                            </Wrapper.TableCell>
                          </Wrapper.TableRow>
                        ))
                      )
                    ) : (
                      <Wrapper.TableRow>
                        <Wrapper.TableCell
                          colSpan={4}
                          sx={{ textAlign: "center", color: "grey.600" }}
                        >
                          No write-offs found
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    )}
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.TableContainer>
            </Wrapper.Paper>
          </Wrapper.Grid>
        </Wrapper.Grid>
      )}

      {/* Current Period */}
      {!loading && (
        <Wrapper.Paper sx={{ bgcolor: "white", boxShadow: 3, mb: 4, p: 2 }}>
          <Wrapper.Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CalendarToday sx={{ mr: 1 }} />
            <Wrapper.Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "grey.800" }}
            >
              Current Period
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              Status: <strong>{dashboardData.currentPeriod.status}</strong>
            </Wrapper.Typography>
            {dashboardData.currentPeriod.startDate && (
              <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                Start:{" "}
                <strong>
                  {new Date(
                    dashboardData.currentPeriod.startDate
                  ).toLocaleDateString()}
                </strong>
              </Wrapper.Typography>
            )}
            {dashboardData.currentPeriod.endDate && (
              <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                End:{" "}
                <strong>
                  {new Date(
                    dashboardData.currentPeriod.endDate
                  ).toLocaleDateString()}
                </strong>
              </Wrapper.Typography>
            )}
          </Wrapper.Box>
        </Wrapper.Paper>
      )}

      {/* Transaction Details Modal */}
      <Wrapper.Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Wrapper.Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            maxWidth: 600,
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: 24,
          }}
        >
          <Wrapper.Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "grey.800", mb: 2 }}
          >
            Transaction Details
          </Wrapper.Typography>
          <Wrapper.Box
            sx={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Date:</strong>{" "}
              {transactionDetails
                ? new Date(transactionDetails.date).toLocaleDateString()
                : "N/A"}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Type:</strong> {transactionDetails?.type || "N/A"}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Reference:</strong>{" "}
              {transactionDetails?.reference || "N/A"}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Description:</strong>{" "}
              {transactionDetails?.description || "N/A"}
            </Wrapper.Typography>
            {transactionDetails?.paymentMethod && (
              <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                <strong>Payment Method:</strong>{" "}
                {transactionDetails.paymentMethod}
              </Wrapper.Typography>
            )}
            {transactionDetails?.bankAccount && (
              <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                <strong>Bank Account:</strong>{" "}
                {transactionDetails.bankAccount.bankName || "N/A"} (
                {transactionDetails.bankAccount.accountNumber || "N/A"})
              </Wrapper.Typography>
            )}
            {transactionDetails?.cashAccount && (
              <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
                <strong>Cash Account:</strong>{" "}
                {transactionDetails.cashAccount || "N/A"}
              </Wrapper.Typography>
            )}
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Party:</strong> {transactionDetails?.party || "N/A"}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Total Amount:</strong> PKR{" "}
              {(transactionDetails?.totalAmount || 0).toLocaleString()}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" sx={{ color: "grey.600" }}>
              <strong>Status:</strong> {transactionDetails?.status || "N/A"}
            </Wrapper.Typography>
            {transactionDetails?.accounts?.length > 0 && (
              <>
                <Wrapper.Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "grey.800", mt: 2 }}
                >
                  Accounts Involved
                </Wrapper.Typography>
                <Wrapper.TableContainer component={Wrapper.Paper}>
                  <Wrapper.Table>
                    <Wrapper.TableHead>
                      <Wrapper.TableRow sx={{ bgcolor: "grey.100" }}>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Account
                        </Wrapper.TableCell>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Debit
                        </Wrapper.TableCell>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Credit
                        </Wrapper.TableCell>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Narration
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    </Wrapper.TableHead>
                    <Wrapper.TableBody>
                      {(transactionDetails.accounts || []).map((acc, index) => (
                        <Wrapper.TableRow key={index}>
                          <Wrapper.TableCell>
                            {acc.accountName || "N/A"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell
                            sx={{ textAlign: "right", color: "success.main" }}
                          >
                            {acc.debit
                              ? `PKR ${acc.debit.toLocaleString()}`
                              : "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell
                            sx={{ textAlign: "right", color: "error.main" }}
                          >
                            {acc.credit
                              ? `PKR ${acc.credit.toLocaleString()}`
                              : "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {acc.narration || "N/A"}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                      ))}
                    </Wrapper.TableBody>
                  </Wrapper.Table>
                </Wrapper.TableContainer>
              </>
            )}
            {transactionDetails?.items?.length > 0 && (
              <>
                <Wrapper.Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "grey.800", mt: 2 }}
                >
                  Items
                </Wrapper.Typography>
                <Wrapper.TableContainer component={Wrapper.Paper}>
                  <Wrapper.Table>
                    <Wrapper.TableHead>
                      <Wrapper.TableRow sx={{ bgcolor: "grey.100" }}>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                          }}
                        >
                          Item
                        </Wrapper.TableCell>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Quantity
                        </Wrapper.TableCell>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Unit Price
                        </Wrapper.TableCell>
                        <Wrapper.TableCell
                          sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            textAlign: "right",
                          }}
                        >
                          Discount
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    </Wrapper.TableHead>
                    <Wrapper.TableBody>
                      {(transactionDetails.items || []).map((item, index) => (
                        <Wrapper.TableRow key={index}>
                          <Wrapper.TableCell>
                            {item.itemName || "N/A"} ({item.itemCode || "N/A"})
                          </Wrapper.TableCell>
                          <Wrapper.TableCell sx={{ textAlign: "right" }}>
                            {item.quantity || 0}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell sx={{ textAlign: "right" }}>
                            PKR {(item.unitPrice || 0).toLocaleString()}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell sx={{ textAlign: "right" }}>
                            {item.discount ? `${item.discount}%` : "-"}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                      ))}
                    </Wrapper.TableBody>
                  </Wrapper.Table>
                </Wrapper.TableContainer>
              </>
            )}
          </Wrapper.Box>
          <Wrapper.Box
            sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
          >
            <Wrapper.Button
              variant="contained"
              color="primary"
              onClick={() => setModalOpen(false)}
              sx={{ textTransform: "none" }}
            >
              Close
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.Box>
      </Wrapper.Modal>

      {/* Period Closing Modal */}
      <Wrapper.Modal
        open={closingModalOpen}
        onClose={() => !closingInProgress && setClosingModalOpen(false)}
      >
        <Wrapper.Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            maxWidth: 400,
            width: "100%",
            boxShadow: 24,
          }}
        >
          <Wrapper.Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "grey.800", mb: 2 }}
          >
            Close Accounting Period
          </Wrapper.Typography>
          <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
            This action will close the accounting period and update account
            balances. Ensure all transactions are recorded.
          </Wrapper.Alert>
          <Wrapper.TextField
            type="date"
            value={periodEndDate}
            onChange={(e) => setPeriodEndDate(e.target.value)}
            InputProps={{
              inputProps: { max: new Date().toISOString().split("T")[0] },
            }}
            label="Period End Date"
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <Wrapper.Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Wrapper.Button
              variant="outlined"
              color="error"
              onClick={() => setClosingModalOpen(false)}
              disabled={closingInProgress}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Wrapper.Button>
            <Wrapper.Button
              variant="contained"
              color="success"
              onClick={handleClosePeriod}
              disabled={closingInProgress || !periodEndDate}
              startIcon={
                closingInProgress ? (
                  <Wrapper.CircularProgress size={20} />
                ) : (
                  <Lock />
                )
              }
              sx={{ textTransform: "none" }}
            >
              {closingInProgress ? "Closing..." : "Close Period"}
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.Box>
      </Wrapper.Modal>
    </Wrapper.Box>
  );
};

export default FinanceDashboard;

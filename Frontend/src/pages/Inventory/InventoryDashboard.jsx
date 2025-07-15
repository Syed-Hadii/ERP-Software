import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { PieChart, BarChart } from "@mui/x-charts";
import { BASE_URL } from "../../config/config";
import {
  Inventory as InventoryIcon,
  AttachMoney,
  Warning as WarningIcon,
  SwapHoriz,
  Receipt,
} from "@mui/icons-material";

// Styled components inspired by Employee Analytics
const StyledCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid rgba(46, 125, 50, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  },
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
  borderRadius: "16px",
  color: "white",
  boxShadow: "0 4px 20px rgba(46, 125, 50, 0.3)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 30px rgba(46, 125, 50, 0.4)",
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: "#2E7D32",
  borderBottom: "2px solid #E8F5E8",
}));

const StatusChip = styled(Chip)(({ status }) => ({
  backgroundColor:
    status === "completed"
      ? "#4CAF50"
      : status === "pending"
      ? "#FF9800"
      : status === "in-progress"
      ? "#2196F3"
      : "#757575",
  color: "white",
  fontWeight: 600,
}));

const InventoryDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/inventory-dashboard?page=1&limit=10`
        );
        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err) {
        setError(`Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Chart data preparation
  const inventoryChartData =
    dashboardData?.inventorySummary.map((item, index) => ({
      id: index,
      value: item.totalQuantity,
      label: item.owner,
    })) || [];

  const financialChartData = {
    labels: ["Accounts Receivable", "Accounts Payable"],
    datasets: [
      {
        label: "Current Balance",
        data: [
          dashboardData?.financialMetrics.accountsReceivable
            .totalCurrentBalance || 0,
          dashboardData?.financialMetrics.accountsPayable.totalCurrentBalance ||
            0,
        ],
        backgroundColor: "#2E7D32",
      },
    ],
  };

  if (loading) {
    return (
      <Box className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <CircularProgress size={60} sx={{ color: "#2E7D32", mb: 2 }} />
        <Typography variant="h6" className="text-gray-600">
          Loading Inventory Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-6 bg-gradient-to-br from-red-50 to-orange-50 min-h-screen">
        <Alert severity="error" className="max-w-md mx-auto">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="flex bg-gradient-to-br from-gray-50 to-green-50 min-h-screen">
      <Box className="flex-1 p-6 overflow-auto">
        <Typography variant="h4" className="text-[#2E7D32] font-bold mb-6">
          Inventory Dashboard
        </Typography>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent className="text-center">
                <InventoryIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.inventorySummary.reduce(
                    (sum, item) => sum + item.itemCount,
                    0
                  )}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Items
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.inventorySummary[0]?.itemCount || 0}{" "}
                    {dashboardData?.inventorySummary[0]?.owner || "N/A"} •{" "}
                    {dashboardData?.inventorySummary[1]?.itemCount || 0}{" "}
                    {dashboardData?.inventorySummary[1]?.owner || "N/A"}
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              sx={{
                background: "linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)",
              }}
            >
              <CardContent className="text-center">
                <AttachMoney className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  PKR {dashboardData?.financialMetrics.accountsReceivable.totalCurrentBalance?.toFixed(
                    2
                  ) || "0.00"}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Accounts Receivable
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.financialMetrics.accountsReceivable
                      .transactions?.length || 0}{" "}
                    Transactions
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              sx={{
                background: "linear-gradient(135deg, #7B1FA2 0%, #AB47BC 100%)",
              }}
            >
              <CardContent className="text-center">
                <AttachMoney className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  PKR {dashboardData?.financialMetrics.accountsPayable.totalCurrentBalance?.toFixed(
                    2
                  ) || "0.00"}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Accounts Payable
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.financialMetrics.accountsPayable
                      .transactions?.length || 0}{" "}
                    Transactions
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              sx={{
                background: "linear-gradient(135deg, #F57C00 0%, #FF9800 100%)",
              }}
            >
              <CardContent className="text-center">
                <WarningIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.lowStockAlerts.total}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Low Stock Alerts
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.lowStockAlerts.items.length} Items
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} lg={6}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <InventoryIcon className="mr-2 text-green-600" />
                  Inventory by Owner
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: inventoryChartData,
                        highlightScope: {
                          faded: "global",
                          highlighted: "item",
                        },
                      },
                    ]}
                    height={300}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} lg={6}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <AttachMoney className="mr-2 text-green-600" />
                  Financial Metrics
                </Typography>
                <Box className="h-80">
                  <BarChart
                    dataset={financialChartData.datasets[0].data.map(
                      (value, index) => ({
                        label: financialChartData.labels[index],
                        value: value,
                      })
                    )}
                    xAxis={[{ scaleType: "band", dataKey: "label" }]}
                    series={[
                      {
                        dataKey: "value",
                        label: "Current Balance",
                        color: "#2E7D32",
                      },
                    ]}
                    height={300}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Low Stock Alerts */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <WarningIcon className="mr-2 text-green-600" />
                Low Stock Alerts ({dashboardData?.lowStockAlerts.total})
              </Typography>
              <Chip
                label={`Items: ${dashboardData?.lowStockAlerts.items.length}`}
                color="warning"
                variant="outlined"
              />
            </Box>
            <TableContainer
              component={Paper}
              className="rounded-xl overflow-hidden"
            >
              <Table>
                <TableHead className="bg-gradient-to-r from-green-50 to-blue-50">
                  <TableRow>
                    <StyledTableCell>Item Name</StyledTableCell>
                    <StyledTableCell>Unit</StyledTableCell>
                    <StyledTableCell>Quantity</StyledTableCell>
                    <StyledTableCell>Threshold</StyledTableCell>
                    <StyledTableCell>Owner</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.lowStockAlerts.items.map((item, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.lowStockThreshold}</TableCell>
                      <TableCell>{item.owner}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Pending Requests */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <SwapHoriz className="mr-2 text-green-600" />
                Pending Inventory Requests (
                {dashboardData?.pendingRequests.total})
              </Typography>
              <Chip
                label={`Total: ${dashboardData?.pendingRequests.requests.reduce(
                  (sum, req) => sum + req.quantityRequested,
                  0
                )}`}
                color="warning"
                variant="outlined"
              />
            </Box>
            <TableContainer
              component={Paper}
              className="rounded-xl overflow-hidden"
            >
              <Table>
                <TableHead className="bg-gradient-to-r from-green-50 to-blue-50">
                  <TableRow>
                    <StyledTableCell>Item Name</StyledTableCell>
                    <StyledTableCell>Unit</StyledTableCell>
                    <StyledTableCell>Quantity Requested</StyledTableCell>
                    <StyledTableCell>Requestor Type</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.pendingRequests.requests.map(
                    (request, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{request.item?.name}</TableCell>
                        <TableCell>{request.item?.unit}</TableCell>
                        <TableCell>{request.quantityRequested}</TableCell>
                        <TableCell>{request.requestorType}</TableCell>
                        <TableCell>
                          {new Date(request.requestDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Recent Transactions */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <SwapHoriz className="mr-2 text-green-600" />
                Recent Transactions
              </Typography>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderBottom: "1px solid #2E7D32" }}
              >
                <Tab label="Customers" sx={{ color: "#2E7D32" }} />
                <Tab label="Suppliers" sx={{ color: "#2E7D32" }} />
              </Tabs>
            </Box>
            <TableContainer
              component={Paper}
              className="rounded-xl overflow-hidden"
            >
              <Table>
                <TableHead className="bg-gradient-to-r from-green-50 to-blue-50">
                  <TableRow>
                    <StyledTableCell>
                      {tabValue === 0 ? "Customer" : "Supplier"}
                    </StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell>Amount</StyledTableCell>
                    <StyledTableCell>Reference</StyledTableCell>
                    <StyledTableCell>Description</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recentTransactions?.[
                    tabValue === 0 ? 'customers' : 'suppliers'
                  ]?.map((transaction, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>
                        {transaction?.[
                          tabValue === 0 ? 'customerName' : 'supplierName'
                        ]}
                      </TableCell>
                      <TableCell>
                        {transaction?.date
                          ? new Date(transaction.date).toLocaleDateString()
                          : ''}
                      </TableCell>
                      <TableCell>{transaction?.type}</TableCell>
                      <TableCell>
                        PKR {(transaction?.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{transaction?.reference}</TableCell>
                      <TableCell>{transaction?.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Recent Invoices */}
        <StyledCard>
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <Receipt className="mr-2 text-green-600" />
                Recent Purchase Invoices ({dashboardData?.recentInvoices.total})
              </Typography>
              <Chip
                label={`Total: PKR ${dashboardData?.recentInvoices.invoices
                  .reduce((sum, inv) => sum + inv.totalAmount, 0)
                  .toFixed(2)}`}
                color="success"
                variant="outlined"
              />
            </Box>
            <TableContainer
              component={Paper}
              className="rounded-xl overflow-hidden"
            >
              <Table>
                <TableHead className="bg-gradient-to-r from-green-50 to-blue-50">
                  <TableRow>
                    <StyledTableCell>Invoice Number</StyledTableCell>
                    <StyledTableCell>Supplier</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                    <StyledTableCell>Total Amount</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recentInvoices.invoices.map(
                    (invoice, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.supplier?.name}</TableCell>
                        <TableCell>
                          {new Date(invoice.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>PKR {invoice.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusChip
                            label={invoice.status}
                            status={invoice.status.toLowerCase()}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </Box>
    </Box>
  );
};

export default InventoryDashboard;

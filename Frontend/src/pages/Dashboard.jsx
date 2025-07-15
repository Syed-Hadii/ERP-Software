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
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Agriculture as AgricultureIcon,
  Pets as PetsIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AccountBalance as FinanceIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import axios from "axios";
import { PieChart, BarChart, LineChart } from "@mui/x-charts";
import { BASE_URL } from "../config/config";
import NotificationControlPanel from "../components/NotificationControlPanel";

// Styled components
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

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
   

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/dashboard?page=1&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
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

  // Chart data preparation
  const pendingActionsData =
    dashboardData?.pendingActions.summary.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.module,
    })) || [];

  const financialData = [
    {
      category: "Assets",
      value: dashboardData?.summary.finance.totalAssets || 0,
    },
    {
      category: "Liabilities",
      value: dashboardData?.summary.finance.totalLiabilities || 0,
    },
    {
      category: "Equity",
      value: dashboardData?.summary.finance.totalEquity || 0,
    },
    {
      category: "Net Income",
      value: dashboardData?.summary.finance.netIncome || 0,
    },
  ];

  const trendsData =
    dashboardData?.revenueExpenseTrends.map((item) => ({
      date: item.date,
      revenue: item.revenue,
      expense: item.expense,
    })) || [];

  if (loading) {
    return (
      <Box className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <CircularProgress size={60} sx={{ color: "#2E7D32", mb: 2 }} />
        <Typography variant="h6" className="text-gray-600">
          Loading Dashboard...
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
      {/* Dashboard Content */}
      <Box className="flex-1 p-6 overflow-auto">
        {/* Key Metrics Cards */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent className="text-center">
                <AgricultureIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.summary.agriculture.totalFarmers}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Farmers
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.summary.agriculture.totalLands} Lands •{" "}
                    {dashboardData?.summary.agriculture.totalActiveCrops} Active
                    Crops
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
                <PetsIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.summary.cattleDairy.totalCattle}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Cattle
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.summary.cattleDairy.totalMilkVolume}L Milk •{" "}
                    {dashboardData?.summary.cattleDairy.totalPendingProcessing}{" "}
                    Pending
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
                <PeopleIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.summary.hr.totalEmployees}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Employees
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    PKR {dashboardData?.summary.hr.totalPayrollAmount} Payroll • $
                    {dashboardData?.summary.hr.totalOutstandingLoans} Loans
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
                <InventoryIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.summary.inventory.totalItems}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Inventory Items
                </Typography>
                <Box className="mt-2 flex items-center justify-center">
                  <Warning className="text-red-200 mr-1" fontSize="small" />
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.summary.inventory.totalLowStock} Low Stock
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
        <Box className="mb-8">
          <NotificationControlPanel />
        </Box>
        {/* Charts Section */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} lg={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <DashboardIcon className="mr-2 text-green-600" />
                  Pending Actions by Module
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: pendingActionsData,
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

          <Grid item xs={12} lg={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <FinanceIcon className="mr-2 text-green-600" />
                  Financial Overview
                </Typography>
                <Box className="h-80">
                  <BarChart
                    dataset={financialData}
                    xAxis={[{ scaleType: "band", dataKey: "category" }]}
                    series={[{ dataKey: "value", color: "#2E7D32" }]}
                    height={300}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} lg={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <TrendingUp className="mr-2 text-green-600" />
                  Revenue vs Expense Trends
                </Typography>
                <Box className="h-80">
                  <LineChart
                    dataset={trendsData}
                    xAxis={[{ scaleType: "point", dataKey: "date" }]}
                    series={[
                      {
                        dataKey: "revenue",
                        label: "Revenue",
                        color: "#2E7D32",
                      },
                      {
                        dataKey: "expense",
                        label: "Expense",
                        color: "#4CAF50",
                      },
                    ]}
                    height={300}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Pending Actions Table */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <Warning className="mr-2 text-orange-500" />
                Pending Actions ({dashboardData?.pendingActions.total})
              </Typography>
              <Chip
                label={`${dashboardData?.pendingActions.total} Total`}
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
                    <StyledTableCell>Module</StyledTableCell>
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell>Details</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.pendingActions.actions.map(
                    (action, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {action.module}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={action.type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{action.details}</TableCell>
                        <TableCell>
                          <StatusChip
                            label="Pending"
                            status="pending"
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

        {/* Recent Transactions */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <FinanceIcon className="mr-2 text-green-600" />
                Recent Transactions ({dashboardData?.recentTransactions.total})
              </Typography>
              <Chip label="Last 30 Days" color="primary" variant="outlined" />
            </Box>
            <TableContainer
              component={Paper}
              className="rounded-xl overflow-hidden"
            >
              <Table>
                <TableHead className="bg-gradient-to-r from-green-50 to-blue-50">
                  <TableRow>
                    <StyledTableCell>Date</StyledTableCell>
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell>Reference</StyledTableCell>
                    <StyledTableCell>Description</StyledTableCell>
                    <StyledTableCell align="right">Amount</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recentTransactions.transactions.map(
                    (tx, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {new Date(tx.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.type}
                            size="small"
                            color={tx.type === "Income" ? "success" : "error"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {tx.reference}
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell align="right" className="font-semibold">
                          <Typography
                            variant="body2"
                            className={
                              tx.type === "Income"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            PKR {tx.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Employee Task Analytics */}
        <StyledCard>
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <PeopleIcon className="mr-2 text-green-600" />
                Employee Task Analytics ({dashboardData?.taskAnalytics.total})
              </Typography>
              <Box className="flex space-x-2">
                <Chip
                  label="Active Employees"
                  color="success"
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label="Performance Overview"
                  color="info"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
            <TableContainer
              component={Paper}
              className="rounded-xl overflow-hidden"
            >
              <Table>
                <TableHead className="bg-gradient-to-r from-green-50 to-blue-50">
                  <TableRow>
                    <StyledTableCell>Employee</StyledTableCell>
                    <StyledTableCell>Department</StyledTableCell>
                    <StyledTableCell>Pending</StyledTableCell>
                    <StyledTableCell>Completed</StyledTableCell>
                    <StyledTableCell>In Progress</StyledTableCell>
                    <StyledTableCell>Milk Tasks</StyledTableCell>
                    <StyledTableCell>Feed Tasks</StyledTableCell>
                    <StyledTableCell>Performance</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.taskAnalytics.employees.map((emp, index) => {
                    const totalTasks =
                      emp.tasks.pending +
                      emp.tasks.completed +
                      emp.tasks.inProgress;
                    const completionRate =
                      totalTasks > 0
                        ? (emp.tasks.completed / totalTasks) * 100
                        : 0;

                    return (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <Box className="flex items-center">
                            <Avatar className="mr-3 bg-green-600 w-8 h-8 text-sm">
                              {emp.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" className="font-medium">
                              {emp.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.department}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.tasks.pending}
                            size="small"
                            color="warning"
                            className="min-w-12"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.tasks.completed}
                            size="small"
                            color="success"
                            className="min-w-12"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.tasks.inProgress}
                            size="small"
                            color="info"
                            className="min-w-12"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.tasks.milkTasks}
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.tasks.feedProcessTasks +
                            emp.tasks.feedUsageTasks}
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center space-x-2">
                            <LinearProgress
                              variant="determinate"
                              value={completionRate}
                              className="flex-1 h-2 rounded"
                              sx={{
                                backgroundColor: "#E8F5E8",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor:
                                    completionRate > 75
                                      ? "#4CAF50"
                                      : completionRate > 50
                                      ? "#FF9800"
                                      : "#F44336",
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              className="min-w-12 text-right"
                            >
                              {completionRate.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </Box>
    </Box>
  );
};

export default AdminDashboard;

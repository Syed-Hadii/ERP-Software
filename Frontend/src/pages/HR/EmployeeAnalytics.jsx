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
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { PieChart, BarChart } from "@mui/x-charts";
import { BASE_URL } from "../../config/config";
import {
  People as PeopleIcon,
  AttachMoney,
  MoneyOff,
  Event,
  Work,
} from "@mui/icons-material";

// Styled components (same as Admin Dashboard)
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

const EmployeeAnalytics = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch dashboard data (unchanged)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/analytic?page=1&limit=10`
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
  const departmentData =
    dashboardData?.employeeSummary.byDepartment.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.department,
    })) || [];

  const attendanceData =
    dashboardData?.attendance.summary.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.status,
    })) || [];

  const taskData = {
    employees:
      dashboardData?.taskAnalytics.employees.map((emp) => emp.name) || [],
    pending:
      dashboardData?.taskAnalytics.employees.map((emp) => emp.tasks.pending) ||
      [],
    completed:
      dashboardData?.taskAnalytics.employees.map(
        (emp) => emp.tasks.completed
      ) || [],
    inProgress:
      dashboardData?.taskAnalytics.employees.map(
        (emp) => emp.tasks.inProgress
      ) || [],
  };

  if (loading) {
    return (
      <Box className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <CircularProgress size={60} sx={{ color: "#2E7D32", mb: 2 }} />
        <Typography variant="h6" className="text-gray-600">
          Loading HR Dashboard...
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
        <Typography variant="h4" className="text-[#2E7D32] font-bold mb-6">
          HR Dashboard
        </Typography>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent className="text-center">
                <PeopleIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.employeeSummary.totalEmployees}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Employees
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.employeeSummary.byDepartment[0]?.count || 0}{" "}
                    {dashboardData?.employeeSummary.byDepartment[0]?.department}{" "}
                    •{" "}
                    {dashboardData?.employeeSummary.byDepartment[1]?.count || 0}{" "}
                    {dashboardData?.employeeSummary.byDepartment[1]?.department}
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
                  PKR {dashboardData?.payroll.summary.find(
                    (s) => s.status === "Approved"
                  )?.totalAmount || 0}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Payroll (30 Days)
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.payroll.pendingRequests.total} Pending •{" "}
                    {dashboardData?.payroll.summary.find(
                      (s) => s.status === "Rejected"
                    )?.totalAmount || 0}{" "}
                    Rejected
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
                <MoneyOff className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  PKR {dashboardData?.loans.summary.outstanding.totalAmount || 0}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Outstanding Loans
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.loans.outstandingList.total} Active •{" "}
                    {dashboardData?.loans.summary.paid?.totalAmount || 0} Paid
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
                <Event className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.attendance.summary.find(
                    (a) => a.status === "Present"
                  )?.count || 0}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Present Today
                </Typography>
                <Box className="mt-2 flex items-center justify-center">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.attendance.summary.find(
                      (a) => a.status === "Absent"
                    )?.count || 0}{" "}
                    Absent •{" "}
                    {dashboardData?.attendance.summary.find(
                      (a) => a.status === "Late"
                    )?.count || 0}{" "}
                    Late
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} lg={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <PeopleIcon className="mr-2 text-green-600" />
                  Employees by Department
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: departmentData,
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
                  <Event className="mr-2 text-green-600" />
                  Attendance Status (30 Days)
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: attendanceData,
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
                  <Work className="mr-2 text-green-600" />
                  Task Status per Employee
                </Typography>
                <Box className="h-80">
                  <BarChart
                    dataset={taskData.employees.map((emp, index) => ({
                      employee: emp,
                      pending: taskData.pending[index],
                      completed: taskData.completed[index],
                      inProgress: taskData.inProgress[index],
                    }))}
                    xAxis={[{ scaleType: "band", dataKey: "employee" }]}
                    series={[
                      {
                        dataKey: "pending",
                        label: "Pending",
                        color: "#2E7D32",
                      },
                      {
                        dataKey: "completed",
                        label: "Completed",
                        color: "#4CAF50",
                      },
                      {
                        dataKey: "inProgress",
                        label: "In Progress",
                        color: "#81C784",
                      },
                    ]}
                    height={300}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Recent Attendance */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <Event className="mr-2 text-green-600" />
                Recent Attendance ({dashboardData?.attendance.totalRecent})
              </Typography>
              <Chip
                label={`Present: ${
                  dashboardData?.attendance.summary.find(
                    (a) => a.status === "Present"
                  )?.count || 0
                }`}
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
                    <StyledTableCell>Employee</StyledTableCell>
                    <StyledTableCell>Department</StyledTableCell>
                    <StyledTableCell>Designation</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.attendance.records.map((record, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>{`${record.employee?.firstName} ${record.employee?.lastName}`}</TableCell>
                      <TableCell>{record.employee?.department}</TableCell>
                      <TableCell>{record.employee?.designation}</TableCell>
                      <TableCell>
                        <StatusChip
                          label={record.status}
                          status={record.status.toLowerCase()}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Pending Payroll Requests */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <AttachMoney className="mr-2 text-green-600" />
                Pending Payroll Requests (
                {dashboardData?.payroll.pendingRequests.total})
              </Typography>
              <Chip
                label={`Total: PKR ${dashboardData?.payroll.pendingRequests.requests.reduce(
                  (sum, req) => sum + req.totalAmount,
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
                    <StyledTableCell>Month</StyledTableCell>
                    <StyledTableCell>Year</StyledTableCell>
                    <StyledTableCell>Total Amount</StyledTableCell>
                    <StyledTableCell>Payrolls</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.payroll.pendingRequests.requests.map(
                    (request, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{request.month}</TableCell>
                        <TableCell>{request.year}</TableCell>
                        <TableCell>${request.totalAmount}</TableCell>
                        <TableCell>
                          {request.payrolls
                            .map(
                              (p) =>
                                `${
                                  p.employee
                                    ? `${p.employee.firstName} ${p.employee.lastName}`
                                    : "User"
                                }: $${p.netPay}`
                            )
                            .join(", ")}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Outstanding Loans */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <MoneyOff className="mr-2 text-green-600" />
                Outstanding Loans ({dashboardData?.loans.outstandingList.total})
              </Typography>
              <Chip
                label={`Total: PKR ${dashboardData?.loans.summary.outstanding.totalAmount}`}
                color="error"
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
                    <StyledTableCell>Employee</StyledTableCell>
                    <StyledTableCell>Total Amount</StyledTableCell>
                    <StyledTableCell>Installments Paid</StyledTableCell>
                    <StyledTableCell>Remaining Amount</StyledTableCell>
                    <StyledTableCell>Start Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.loans.outstandingList.loans.map(
                    (loan, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{`${loan.employee?.firstName} ${loan.employee?.lastName}`}</TableCell>
                        <TableCell>${loan.totalAmount}</TableCell>
                        <TableCell>
                          {loan.installmentsPaid}/{loan.totalInstallments}
                        </TableCell>
                        <TableCell>
                          PKR {loan.totalAmount -
                            loan.installmentsPaid * loan.installmentAmount}
                        </TableCell>
                        <TableCell>
                          {new Date(loan.startDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Task Analytics */}
        <StyledCard>
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <Work className="mr-2 text-green-600" />
                Employee Task Analytics ({dashboardData?.taskAnalytics.total})
              </Typography>
              <Box className="flex space-x-2">
                <Chip
                  label={`Pending: ${dashboardData?.taskAnalytics.employees.reduce(
                    (sum, emp) => sum + emp.tasks.pending,
                    0
                  )}`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`Completed: ${dashboardData?.taskAnalytics.employees.reduce(
                    (sum, emp) => sum + emp.tasks.completed,
                    0
                  )}`}
                  color="success"
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
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={emp.tasks.pending}
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.tasks.completed}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emp.tasks.inProgress}
                            size="small"
                            color="info"
                          />
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

export default EmployeeAnalytics;

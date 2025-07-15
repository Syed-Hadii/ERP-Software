import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Chip,
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { PieChart, BarChart } from "@mui/x-charts";
import { BASE_URL } from "../../config/config";
import { Agriculture as AgricultureIcon, Warning } from "@mui/icons-material";

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

const AgricultureDashboard = () => {
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
          `${BASE_URL}/agriculture-dashboard?page=1&limit=10`
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
  const cropStatusData =
    dashboardData?.cropAssignments.summary.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.status,
    })) || [];

  const schedulesData = [
    {
      status: "Pending",
      value:
        (dashboardData?.schedules.overview.irrigation.find(
          (s) => s.status === "pending"
        )?.count || 0) +
        (dashboardData?.schedules.overview.fertilization.find(
          (s) => s.status === "pending"
        )?.count || 0) +
        (dashboardData?.schedules.overview.pesticide.find(
          (s) => s.status === "pending"
        )?.count || 0),
    },
    {
      status: "Completed",
      value:
        (dashboardData?.schedules.overview.irrigation.find(
          (s) => s.status === "completed"
        )?.count || 0) +
        (dashboardData?.schedules.overview.fertilization.find(
          (s) => s.status === "completed"
        )?.count || 0) +
        (dashboardData?.schedules.overview.pesticide.find(
          (s) => s.status === "completed"
        )?.count || 0),
    },
  ];

  if (loading) {
    return (
      <Box className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <CircularProgress size={60} sx={{ color: "#2E7D32", mb: 2 }} />
        <Typography variant="h6" className="text-gray-600">
          Loading Agriculture Dashboard...
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
          Agriculture Dashboard
        </Typography>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent className="text-center">
                <AgricultureIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.summary.totalFarmers}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Farmers
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.summary.totalLands} Lands •{" "}
                    {dashboardData?.summary.assignedLands} Assigned
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
                <AgricultureIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.cropAssignments.totalActive}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Active Crops
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.schedules.pending.irrigation.total}{" "}
                    Irrigation •{" "}
                    {dashboardData?.schedules.pending.fertilization.total}{" "}
                    Fertilization
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
                <AgricultureIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.inventoryRequests.total}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Pending Requests
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.lowStockAlerts.total} Low Stock •{" "}
                    {dashboardData?.schedules.pending.pesticide.total} Pesticide
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
                <Warning className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.schedules.pending.total}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Pending Schedules
                </Typography>
                <Box className="mt-2 flex items-center justify-center">
                  <Warning className="text-red-200 mr-1" fontSize="small" />
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.schedules.overdue} Overdue
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
                  <AgricultureIcon className="mr-2 text-green-600" />
                  Crop Assignment Status
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: cropStatusData,
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
                  <AgricultureIcon className="mr-2 text-green-600" />
                  Schedules Overview
                </Typography>
                <Box className="h-80">
                  <BarChart
                    dataset={schedulesData}
                    xAxis={[{ scaleType: "band", dataKey: "status" }]}
                    series={[{ dataKey: "value", color: "#2E7D32" }]}
                    height={300}
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Active Crop Assignments */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <AgricultureIcon className="mr-2 text-green-600" />
                Active Crop Assignments (
                {dashboardData?.cropAssignments.totalActive})
              </Typography>
              <Chip
                label={`${dashboardData?.cropAssignments.totalActive} Active`}
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
                    <StyledTableCell>Crop</StyledTableCell>
                    <StyledTableCell>Variety</StyledTableCell>
                    <StyledTableCell>Farmer</StyledTableCell>
                    <StyledTableCell>Land</StyledTableCell>
                    <StyledTableCell>Seed</StyledTableCell>
                    <StyledTableCell>Quantity</StyledTableCell>
                    <StyledTableCell>Sowing Date</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.cropAssignments.assignments.map(
                    (assignment, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{assignment.crop?.name}</TableCell>
                        <TableCell>{assignment.variety?.variety}</TableCell>
                        <TableCell>{assignment.farmer?.name}</TableCell>
                        <TableCell>{assignment.land?.name}</TableCell>
                        <TableCell>{assignment.seed?.name}</TableCell>
                        <TableCell>
                          {assignment.quantity} {assignment.seed?.unit}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            assignment.seedSowingDate
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{assignment.cropStatus}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Pending Schedules */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <Warning className="mr-2 text-orange-500" />
                Pending Schedules ({dashboardData?.schedules.pending.total})
              </Typography>
              <Box className="flex space-x-2">
                <Chip
                  label={`Irrigation: ${dashboardData?.schedules.pending.irrigation.total}`}
                  size="small"
                  color="warning"
                />
                <Chip
                  label={`Fertilization: ${dashboardData?.schedules.pending.fertilization.total}`}
                  size="small"
                  color="warning"
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
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell>Crop</StyledTableCell>
                    <StyledTableCell>Farmer</StyledTableCell>
                    <StyledTableCell>Land</StyledTableCell>
                    <StyledTableCell>Item/Method</StyledTableCell>
                    <StyledTableCell>Quantity</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const irrigationSchedules =
                      dashboardData?.schedules?.pending?.irrigation
                        ?.schedules || [];
                    const fertilizationSchedules =
                      dashboardData?.schedules?.pending?.fertilization
                        ?.schedules || [];
                    const pesticideSchedules =
                      dashboardData?.schedules?.pending?.pesticide?.schedules ||
                      [];

                    const allSchedules = [
                      ...irrigationSchedules.map((s) => ({
                        ...s,
                        type: "Irrigation",
                      })),
                      ...fertilizationSchedules.map((s) => ({
                        ...s,
                        type: "Fertilization",
                      })),
                      ...pesticideSchedules.map((s) => ({
                        ...s,
                        type: "Pesticide",
                      })),
                    ];

                    return allSchedules
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 10)
                      .map((schedule, index) => {
                        const itemName =
                          schedule.type === "Irrigation"
                            ? schedule.method
                            : schedule.type === "Fertilization"
                            ? schedule.fertilizer?.name
                            : schedule.pesticide?.name;

                        const unit =
                          schedule.type === "Irrigation"
                            ? ""
                            : schedule.type === "Fertilization"
                            ? schedule.fertilizer?.unit
                            : schedule.pesticide?.unit;

                        return (
                          <TableRow
                            key={`schedule-${index}-${schedule.date}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell>{schedule.type}</TableCell>
                            <TableCell>
                              {schedule.crop?.crop?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {schedule.crop?.farmer?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              {schedule.crop?.land?.name || "N/A"}
                            </TableCell>
                            <TableCell>{itemName || "N/A"}</TableCell>
                            <TableCell>{`${schedule.quantity || 0} ${
                              unit || ""
                            }`}</TableCell>
                            <TableCell>
                              {schedule.date
                                ? new Date(schedule.date).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        );
                      });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Pending Inventory Requests */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <AgricultureIcon className="mr-2 text-green-600" />
                Pending Inventory Requests (
                {dashboardData?.inventoryRequests.total})
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
                    <StyledTableCell>Item Name</StyledTableCell>
                    <StyledTableCell>Unit</StyledTableCell>
                    <StyledTableCell>Quantity Requested</StyledTableCell>
                    <StyledTableCell>Requestor Type</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.inventoryRequests.requests.map(
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
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Low Stock Alerts */}
        <StyledCard>
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <Warning className="mr-2 text-orange-500" />
                Low Stock Alerts ({dashboardData?.lowStockAlerts.total})
              </Typography>
              <Chip label="Critical Items" color="error" variant="outlined" />
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </Box>
    </Box>
  );
};

export default AgricultureDashboard;

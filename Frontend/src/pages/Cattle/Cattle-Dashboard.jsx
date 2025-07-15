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
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { PieChart, BarChart } from "@mui/x-charts";
import { BASE_URL } from "../../config/config";
import {
  Pets as PetsIcon,
  Warning,
  LocalHospital,
  LocalShipping,
} from "@mui/icons-material";

// Styled components (same as Agriculture Dashboard)
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

const CattleDashboard = () => {
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
          `${BASE_URL}/cattle-dashboard?page=1&limit=10`
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
  const healthStatusData =
    dashboardData?.cattleSummary.byHealth.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.healthStatus,
    })) || [];

  const processingStatusData =
    dashboardData?.dairyProcessing.overview.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.status,
    })) || [];

  const milkProductionData =
    dashboardData?.milkProduction.summary.map((item) => ({
      type: item.type,
      totalVolume: item.totalVolume,
      averageVolume: item.averageVolume,
    })) || [];

  if (loading) {
    return (
      <Box className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <CircularProgress size={60} sx={{ color: "#2E7D32", mb: 2 }} />
        <Typography variant="h6" className="text-gray-600">
          Loading Cattle Dashboard...
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
          Cattle & Dairy Dashboard
        </Typography>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent className="text-center">
                <PetsIcon className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.cattleSummary.totalCattle}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Cattle
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.healthEvents.overview.upcoming} Health
                    Events • {dashboardData?.milkProduction.totalRecent} Milk
                    Records
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
                <LocalHospital className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  {dashboardData?.healthEvents.upcoming.total}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Upcoming Health Events
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.healthEvents.overview.pending} Pending •{" "}
                    {dashboardData?.healthEvents.overview.completed} Completed
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
                <LocalShipping className="text-4xl mb-2 opacity-80" />
                <Typography variant="h4" className="font-bold mb-1">
                  $
                  {dashboardData?.dairySales.summary.find(
                    (s) => s.status === "approved"
                  )?.totalSales || 0}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Total Sales (30 Days)
                </Typography>
                <Box className="mt-2">
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.dairySales.pending.total} Pending •{" "}
                    {dashboardData?.dairySales.summary.find(
                      (s) => s.status === "rejected"
                    )?.totalSales || 0}{" "}
                    Rejected
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
                  {dashboardData?.dairyProcessing.pending.total}
                </Typography>
                <Typography variant="body2" className="opacity-90">
                  Pending Processing
                </Typography>
                <Box className="mt-2 flex items-center justify-center">
                  <Warning className="text-red-200 mr-1" fontSize="small" />
                  <Typography variant="caption" className="opacity-75">
                    {dashboardData?.inventoryRequests.total} Inventory Requests
                  </Typography>
                </Box>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <PetsIcon className="mr-2 text-green-600" />
                  Cattle Health Status
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: healthStatusData,
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

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <LocalShipping className="mr-2 text-green-600" />
                  Dairy Processing Status
                </Typography>
                <Box className="h-80">
                  <PieChart
                    series={[
                      {
                        data: processingStatusData,
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

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold mb-4 flex items-center"
                >
                  <PetsIcon className="mr-2 text-green-600" />
                  Milk Production (30 Days)
                </Typography>
                <Box className="h-80">
                  <BarChart
                    dataset={milkProductionData}
                    xAxis={[{ scaleType: "band", dataKey: "type" }]}
                    series={[
                      {
                        dataKey: "totalVolume",
                        label: "Total Volume (L)",
                        color: "#2E7D32",
                      },
                      {
                        dataKey: "averageVolume",
                        label: "Avg Volume (L)",
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

        {/* Recent Milk Production */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <PetsIcon className="mr-2 text-green-600" />
                Recent Milk Production (
                {dashboardData?.milkProduction.totalRecent})
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
                    <StyledTableCell>Cattle ID</StyledTableCell>
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell>Breed</StyledTableCell>
                    <StyledTableCell>Shift</StyledTableCell>
                    <StyledTableCell>Volume (L)</StyledTableCell>
                    <StyledTableCell>Employee</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.milkProduction.records.map(
                    (record, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{record.cattleId?.cattleId}</TableCell>
                        <TableCell>{record.cattleId?.type}</TableCell>
                        <TableCell>{record.cattleId?.breed}</TableCell>
                        <TableCell>{record.shift}</TableCell>
                        <TableCell>{record.volume}</TableCell>
                        <TableCell>{record.employee?.name}</TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Pending Dairy Processing */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <LocalShipping className="mr-2 text-green-600" />
                Pending Dairy Processing (
                {dashboardData?.dairyProcessing.pending.total})
              </Typography>
              <Chip
                label={`${dashboardData?.dairyProcessing.pending.total} Pending`}
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
                    <StyledTableCell>Batch Number</StyledTableCell>
                    <StyledTableCell>Raw Milk</StyledTableCell>
                    <StyledTableCell>Input Quantity</StyledTableCell>
                    <StyledTableCell>Output Products</StyledTableCell>
                    <StyledTableCell>Employee</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.dairyProcessing.pending.records.map(
                    (record, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{record.batchNumber}</TableCell>
                        <TableCell>{record.rawMilkProductId?.name}</TableCell>
                        <TableCell>
                          {record.inputMilkQuantity}{" "}
                          {record.rawMilkProductId?.unit}
                        </TableCell>
                        <TableCell>
                          {record.outputProducts
                            .map(
                              (op) =>
                                `${op.productId?.name}: ${op.quantity} ${op.productId?.unit}`
                            )
                            .join(", ")}
                        </TableCell>
                        <TableCell>{record.employee?.name}</TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Upcoming Health Events */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <LocalHospital className="mr-2 text-green-600" />
                Upcoming Health Events (
                {dashboardData?.healthEvents.upcoming.total})
              </Typography>
              <Box className="flex space-x-2">
                <Chip
                  label={`Vaccination: ${dashboardData?.healthEvents.upcoming.vaccination}`}
                  size="small"
                  color="info"
                />
                <Chip
                  label={`Treatment: ${dashboardData?.healthEvents.upcoming.treatment}`}
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
                    <StyledTableCell>Cattle ID</StyledTableCell>
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell>Event Type</StyledTableCell>
                    <StyledTableCell>Medicine</StyledTableCell>
                    <StyledTableCell>Vet Technician</StyledTableCell>
                    <StyledTableCell>Next Due Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.healthEvents.upcoming.events.map(
                    (event, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{event.cattleId?.cattleId}</TableCell>
                        <TableCell>{event.cattleId?.type}</TableCell>
                        <TableCell>{event.eventType}</TableCell>
                        <TableCell>{event.medicineId?.name || "-"}</TableCell>
                        <TableCell>{event.vetTechnician?.name}</TableCell>
                        <TableCell>
                          {new Date(event.nextDueDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </StyledCard>

        {/* Pending Dairy Sales */}
        <StyledCard className="mb-8">
          <CardContent>
            <Box className="flex items-center justify-between mb-4">
              <Typography
                variant="h6"
                className="text-gray-800 font-semibold flex items-center"
              >
                <LocalShipping className="mr-2 text-green-600" />
                Pending Dairy Sales ({dashboardData?.dairySales.pending.total})
              </Typography>
              <Chip
                label="Awaiting Approval"
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
                    <StyledTableCell>Invoice Number</StyledTableCell>
                    <StyledTableCell>Customer</StyledTableCell>
                    <StyledTableCell>Items</StyledTableCell>
                    <StyledTableCell>Total Price</StyledTableCell>
                    <StyledTableCell>Date</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.dairySales.pending.sales.map(
                    (sale, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>{sale.invoiceNumber}</TableCell>
                        <TableCell>{sale.customer?.name}</TableCell>
                        <TableCell>
                          {sale.items
                            .map(
                              (item) =>
                                `${item.item?.name}: ${item.quantity} ${item.item?.unit}`
                            )
                            .join(", ")}
                        </TableCell>
                        <TableCell>${sale.totalPrice}</TableCell>
                        <TableCell>
                          {new Date(sale.date).toLocaleDateString()}
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
                    <StyledTableCell>Reorder Level</StyledTableCell>
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
                      <TableCell>{item.reorderLevel}</TableCell>
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

export default CattleDashboard;

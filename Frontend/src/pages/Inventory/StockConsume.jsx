import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";

const getItemName = (item) => {
  return item || "Unknown Item";
};

const StockConsume = () => {
  const theme = Wrapper.useTheme();
  const [requests, setRequests] = useState([]);
  const [currentTab, setCurrentTab] = useState("viewRequests");
  const [requestFilter, setRequestFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestType, setRequestType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  }); 

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let url = `${BASE_URL}/inventoryRequest/inventory-requests`;
      const params = [];
      if (requestFilter !== "all") params.push(`status=${requestFilter}`);
      if (requestType !== "all") params.push(`type=${requestType}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (params.length) url += `?${params.join("&")}`;
      const response = await Wrapper.axios.get(url);
      setRequests(response.data.requests);
    } catch (error) {
      console.error("Error fetching inventory requests:", error);
      showNotification("Failed to load requests. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (id, status) => {
    try {
      setLoading(true);
      await Wrapper.axios.post(
        `${BASE_URL}/inventoryRequest/inventory-requests/${id}/handle`,
        {
          status,
        }
      );
      showNotification(
        `Request ${
          status === "approved" ? "Approved" : "Rejected"
        } Successfully!`,
        "success"
      );
      fetchRequests();
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      showNotification(
        error.response?.data?.message ||
          `Error ${
            status === "approved" ? "approving" : "rejecting"
          } request. Please try again.`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  useEffect(() => {
    fetchRequests();
  }, [currentTab, requestFilter, requestType, searchQuery]);

  const requestColumns = [
    {
      key: "item",
      label: "Item",
      render: (row) =>
        row.item && typeof row.item === "object"
          ? row.item.name
          : getItemName(row.item),
    },
    {
      key: "unit",
      label: "Unit",
      render: (row) =>
        row.item && typeof row.item === "object"
          ? row.item.unit || "N/A"
          : "N/A",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (row) => row.quantityRequested,
      align: "center",
    },
    {
      key: "details",
      label: "Details",
      render: (row) => row.details || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Wrapper.Chip
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          color={
            row.status === "approved"
              ? "success"
              : row.status === "rejected"
              ? "error"
              : "warning"
          }
          size="small"
          sx={{ fontWeight: "medium" }}
        />
      ),
      align: "center",
    },
    {
      key: "requestDate",
      label: "Request Date",
      render: (row) => new Date(row.requestDate).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        row.status === "pending" && currentTab === "approveRequests" ? (
          <Wrapper.Box
            sx={{ display: "flex", justifyContent: "center", gap: 1 }}
          >
            <Wrapper.IconButton
              color="success"
              onClick={() => handleRequest(row._id, "approved")}
              title="Approve"
            >
              <Wrapper.CheckCircleIcon />
            </Wrapper.IconButton>
            <Wrapper.IconButton
              color="error"
              onClick={() => handleRequest(row._id, "rejected")}
              title="Reject"
            >
              <Wrapper.CancelIcon />
            </Wrapper.IconButton>
          </Wrapper.Box>
        ) : null,
      align: "center",
    },
  ];

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
      <Wrapper.Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 4,
          gap: 2,
        }}
      >
        <Wrapper.Box>
          <Wrapper.Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{
              position: "relative",
              "&:after": {
                content: '""',
                position: "absolute",
                bottom: "-8px",
                left: 0,
                width: "40px",
                height: "4px",
                bgcolor: "#10b981",
                borderRadius: "2px",
              },
            }}
          >
            Inventory Requests
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage and approve inventory requests
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          aria-label="inventory request tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Wrapper.Tab
            label="View Requests"
            value="viewRequests"
            icon={<Wrapper.ViewListIcon />}
            iconPosition="start"
          />
          <Wrapper.Tab
            label="Approve Requests"
            value="approveRequests"
            icon={<Wrapper.CheckCircleOutlineIcon />}
            iconPosition="start"
          />
        </Wrapper.Tabs>
      </Wrapper.Box>

      <Wrapper.Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Wrapper.TextField
          label="Search"
          placeholder="Search by item name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 200 } }}
          InputProps={{
            startAdornment: (
              <Wrapper.InputAdornment position="start">
                <Wrapper.SearchIcon fontSize="small" />
              </Wrapper.InputAdornment>
            ),
          }}
        />
        <Wrapper.FormControl
          size="small"
          sx={{ width: { xs: "100%", sm: 150 } }}
        >
          <Wrapper.InputLabel>Status</Wrapper.InputLabel>
          <Wrapper.Select
            value={requestFilter}
            label="Status"
            onChange={(e) => setRequestFilter(e.target.value)}
          >
            <Wrapper.MenuItem value="all">All</Wrapper.MenuItem>
            <Wrapper.MenuItem value="pending">Pending</Wrapper.MenuItem>
            <Wrapper.MenuItem value="approved">Approved</Wrapper.MenuItem>
            <Wrapper.MenuItem value="rejected">Rejected</Wrapper.MenuItem>
          </Wrapper.Select>
        </Wrapper.FormControl>
        <Wrapper.FormControl
          size="small"
          sx={{ width: { xs: "100%", sm: 150 } }}
        >
          <Wrapper.InputLabel>Type</Wrapper.InputLabel>
          <Wrapper.Select
            value={requestType}
            label="Type"
            onChange={(e) => setRequestType(e.target.value)}
          >
            <Wrapper.MenuItem value="all">All Types</Wrapper.MenuItem>
            <Wrapper.MenuItem value="agriculture">
              Crop Manager
            </Wrapper.MenuItem>
            <Wrapper.MenuItem value="cattle">Dairy Manager</Wrapper.MenuItem>
          </Wrapper.Select>
        </Wrapper.FormControl>
        <Wrapper.Button
          variant="contained"
          color="primary"
          startIcon={<Wrapper.RefreshIcon />}
          onClick={fetchRequests}
          sx={{
            borderRadius: 2,
            px: 2,
            bgcolor: "#348d39",
            "&:hover": { bgcolor: "#2e7d32" },
          }}
        >
          Refresh
        </Wrapper.Button>
      </Wrapper.Box>

      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : requests.length === 0 ? (
        <Wrapper.Card
          sx={{
            p: 6,
            borderRadius: 2,
            textAlign: "center",
            bgcolor: Wrapper.alpha(theme.palette.background.paper, 0.7),
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Wrapper.InventoryIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Wrapper.Typography variant="h5" gutterBottom>
            No inventory requests found
          </Wrapper.Typography>
          <Wrapper.Typography color="text.secondary" sx={{ mb: 3 }}>
            Try changing your filter criteria.
          </Wrapper.Typography>
        </Wrapper.Card>
      ) : (
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: 3,
            "&:hover": { boxShadow: 6 },
          }}
        >
          <Wrapper.Box
            sx={{
              p: 2,
              bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.05),
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              Inventory Requests
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.TableContainer
            sx={{ maxHeight: "calc(100vh - 350px)", minHeight: "300px" }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  {requestColumns.map((column) => (
                    <Wrapper.TableCell
                      key={column.key}
                      sx={{ fontWeight: "bold" }}
                      align={column.align || "left"}
                    >
                      {column.label}
                    </Wrapper.TableCell>
                  ))}
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {requests.map((row) => (
                  <Wrapper.TableRow key={row._id} hover>
                    {requestColumns.map((column) => (
                      <Wrapper.TableCell
                        key={column.key}
                        align={column.align || "left"}
                      >
                        {column.render
                          ? column.render(row)
                          : row[column.key] || "-"}
                      </Wrapper.TableCell>
                    ))}
                  </Wrapper.TableRow>
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
        </Wrapper.Card>
      )}

      <Wrapper.Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Wrapper.Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </Wrapper.Box>
  );
};

export default StockConsume;

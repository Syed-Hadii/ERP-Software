import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import { format } from "date-fns";
import moment from "moment";

// Utility function to safely format dates with fallback
const safeFormatDate = (date, formatStr = "dd MMM yyyy") => {
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return "N/A"; // Fallback for invalid dates
    }
    return format(parsedDate, formatStr);
  } catch {
    return "N/A"; // Fallback for any parsing errors
  }
};

const InvoiceApproval = () => {
  const theme = Wrapper.useTheme();
  const [invoices, setInvoices] = useState([]);
  const [payrollRequests, setPayrollRequests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPayrollRequest, setSelectedPayrollRequest] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState({});
  const [rejectLoading, setRejectLoading] = useState({});
  const [viewLoading, setViewLoading] = useState({});
  const [payrollViewLoading, setPayrollViewLoading] = useState({});
  const [payrollApproveLoading, setPayrollApproveLoading] = useState({});
  const [payrollRejectLoading, setPayrollRejectLoading] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const limit = 7;
  const userId = "user123"; // Replace with actual user ID from auth context

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/invoice-approval/`,
        {
          params: {
            page: currentPage,
            limit,
            search,
            status: statusFilter,
            type: typeFilter,
          },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setInvoices(response.data.data);
      setTotalPages(response.data.totalPages);
      showNotification("Invoices fetched successfully", "success");
    } catch (error) {
      console.error("Error fetching invoices:", error);
      showNotification(
        error.response?.data?.message || "Error fetching invoices",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollRequests = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/payroll/request`, {
        params: {
          page: currentPage,
          limit,
          status: statusFilter,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPayrollRequests(response.data.data);
      setTotalPages(response.data.totalPages || 1);
      showNotification("Payroll requests fetched successfully", "success");
    } catch (error) {
      console.error("Error fetching payroll requests:", error);
      showNotification(
        error.response?.data?.message || "Error fetching payroll requests",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (type, id) => {
    try {
      setViewLoading((prev) => ({ ...prev, [id]: true }));
      const response = await Wrapper.axios.get(
        `${BASE_URL}/invoice-approval/${type}/${id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSelectedInvoice(response.data.data);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      showNotification(
        error.response?.data?.message || "Error fetching invoice details",
        "error"
      );
    } finally {
      setViewLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const fetchPayrollRequestDetails = async (id) => {
    try {
      setPayrollViewLoading((prev) => ({ ...prev, [id]: true }));
      const response = await Wrapper.axios.get(`${BASE_URL}/payroll/request`, {
        params: { id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log(response);
      setSelectedPayrollRequest(response.data.data[0]);
    } catch (error) {
      console.error("Error fetching payroll request details:", error);
      showNotification(
        error.response?.data?.message ||
          "Error fetching payroll request details",
        "error"
      );
    } finally {
      setPayrollViewLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleInvoiceAction = async (id, type, action) => {
    try {
      if (action === "approve") {
        setApproveLoading((prev) => ({ ...prev, [id]: true }));
      } else if (action === "reject") {
        setRejectLoading((prev) => ({ ...prev, [id]: true }));
      }
      const response = await Wrapper.axios.post(
        `${BASE_URL}/invoice-approval/${action}`,
        {
          id,
          type,
          approvedBy: userId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      showNotification(
        `Invoice ${
          action === "approve" ? "Approved" : "Rejected"
        } Successfully!`,
        "success"
      );
      fetchInvoices();
      setSelectedInvoice(null);
    } catch (error) {
      console.error(`Error ${action}ing invoice:`, error);
      showNotification(
        error.response?.data?.message ||
          `Error ${action === "approve" ? "approving" : "rejecting"} invoice`,
        "error"
      );
    } finally {
      // Reset loading state
      if (action === "approve") {
        setApproveLoading((prev) => ({ ...prev, [id]: false }));
      } else if (action === "reject") {
        setRejectLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const handlePayrollRequestAction = async (requestId, status) => {
    try {
      if (status === "Approved") {
        setPayrollApproveLoading((prev) => ({ ...prev, [requestId]: true }));
      } else {
        setPayrollRejectLoading((prev) => ({ ...prev, [requestId]: true }));
      }
      const response = await Wrapper.axios.post(
        `${BASE_URL}/payroll/request/process`,
        {
          requestId,
          status,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      showNotification(
        `Payroll request ${
          status === "Approved" ? "Approved" : "Rejected"
        } Successfully!`,
        "success"
      );
      fetchPayrollRequests();
      setSelectedPayrollRequest(null);
      setNotes("");
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing payroll request:`, error);
      showNotification(
        error.response?.data?.message ||
          `Error ${status.toLowerCase()}ing payroll request`,
        "error"
      );
    } finally {
      if (status === "Approved") {
        setPayrollApproveLoading((prev) => ({ ...prev, [requestId]: false }));
      } else {
        setPayrollRejectLoading((prev) => ({ ...prev, [requestId]: false }));
      }
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      fetchInvoices();
    } else {
      fetchPayrollRequests();
    }
  }, [tabValue, currentPage, search, statusFilter, typeFilter]);

  const invoiceColumns = [
    {
      key: "type",
      label: "Type",
      render: (row) => row.type.charAt(0).toUpperCase() + row.type.slice(1),
    },
    {
      key: "invoiceNumber",
      label: "Invoice No",
      render: (row) => row.invoiceNumber,
    },
    {
      key: "party",
      label: "Party",
      render: (row) => row.supplier?.name || row.customer?.name || "-",
    },
    {
      key: "issueDate",
      label: "Issue Date",
      render: (row) => safeFormatDate(row.issueDate),
    },
    {
      key: "subtotal",
      label: "Total (PKR)",
      render: (row) => row.subtotal.toLocaleString(),
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
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Wrapper.Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Wrapper.IconButton
            color="primary"
            onClick={() => fetchInvoiceDetails(row.type, row._id)}
            title="View"
            disabled={viewLoading[row._id]}
          >
            {viewLoading[row._id] ? (
              <Wrapper.CircularProgress size={24} />
            ) : (
              <Wrapper.VisibilityIcon />
            )}
          </Wrapper.IconButton>
          {row.status === "pending" && (
            <>
              <Wrapper.IconButton
                color="success"
                onClick={() =>
                  handleInvoiceAction(row._id, row.type, "approve")
                }
                title="Approve"
                disabled={approveLoading[row._id]}
              >
                {approveLoading[row._id] ? (
                  <Wrapper.CircularProgress size={24} />
                ) : (
                  <Wrapper.CheckCircleIcon />
                )}
              </Wrapper.IconButton>
              <Wrapper.IconButton
                color="error"
                onClick={() => handleInvoiceAction(row._id, row.type, "reject")}
                title="Reject"
                disabled={rejectLoading[row._id]}
              >
                {rejectLoading[row._id] ? (
                  <Wrapper.CircularProgress size={24} />
                ) : (
                  <Wrapper.CancelIcon />
                )}
              </Wrapper.IconButton>
            </>
          )}
        </Wrapper.Box>
      ),
      align: "center",
    },
  ];

  const payrollRequestColumns = [
    {
      key: "month",
      label: "Month",
      render: (row) =>
        moment()
          .month(row.month - 1)
          .format("MMMM"),
    },
    {
      key: "year",
      label: "Year",
      render: (row) => row.year,
    },
    {
      key: "totalAmount",
      label: "Total Amount (PKR)",
      render: (row) => row.totalAmount.toLocaleString(),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Wrapper.Chip
          label={row.status}
          color={
            row.status === "Approved"
              ? "success"
              : row.status === "Rejected"
              ? "error"
              : "warning"
          }
          size="small"
          sx={{ fontWeight: "medium" }}
        />
      ),
    },
    {
      key: "createdBy",
      label: "Created By",
      render: (row) => row.createdBy?.name || "-",
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (row) => safeFormatDate(row.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Wrapper.Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Wrapper.IconButton
            color="primary"
            onClick={() => fetchPayrollRequestDetails(row._id)}
            title="View"
            disabled={payrollViewLoading[row._id]}
          >
            {payrollViewLoading[row._id] ? (
              <Wrapper.CircularProgress size={24} />
            ) : (
              <Wrapper.VisibilityIcon />
            )}
          </Wrapper.IconButton>
        </Wrapper.Box>
      ),
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
            Approval Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Review and approve invoices and payroll requests
          </Wrapper.Typography>
        </Wrapper.Box>
      </Wrapper.Box>

      <Wrapper.Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 3 }}
      >
        <Wrapper.Tab label="Invoices" />
        <Wrapper.Tab label="Payroll Requests" />
      </Wrapper.Tabs>

      <Wrapper.Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        {tabValue === 0 && (
          <Wrapper.TextField
            label="Search"
            placeholder="Search by reference or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        )}
        <Wrapper.FormControl
          size="small"
          sx={{ width: { xs: "100%", sm: 150 } }}
        >
          <Wrapper.InputLabel>Status</Wrapper.InputLabel>
          <Wrapper.Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <Wrapper.MenuItem value="">All Statuses</Wrapper.MenuItem>
            <Wrapper.MenuItem value="Pending">Pending</Wrapper.MenuItem>
            <Wrapper.MenuItem value="Approved">Approved</Wrapper.MenuItem>
            <Wrapper.MenuItem value="Rejected">Rejected</Wrapper.MenuItem>
          </Wrapper.Select>
        </Wrapper.FormControl>
        {tabValue === 0 && (
          <Wrapper.FormControl
            size="small"
            sx={{ width: { xs: "100%", sm: 150 } }}
          >
            <Wrapper.InputLabel>Type</Wrapper.InputLabel>
            <Wrapper.Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <Wrapper.MenuItem value="">All Types</Wrapper.MenuItem>
              <Wrapper.MenuItem value="purchase">Purchase</Wrapper.MenuItem>
              <Wrapper.MenuItem value="sales">Sales</Wrapper.MenuItem>
            </Wrapper.Select>
          </Wrapper.FormControl>
        )}
      </Wrapper.Box>

      {tabValue === 0 && (
        <>
          {loading ? (
            <Wrapper.Box sx={{ width: "100%" }}>
              <Wrapper.Skeleton variant="rectangular" height={50} />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
            </Wrapper.Box>
          ) : invoices.length === 0 ? (
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
                No invoices found
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
                  Invoice Approval
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.TableContainer
                sx={{ maxHeight: "calc(100vh - 350px)", minHeight: "300px" }}
              >
                <Wrapper.Table stickyHeader>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      {invoiceColumns.map((column) => (
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
                    {invoices.map((row) => (
                      <Wrapper.TableRow key={`${row.type}-${row._id}`} hover>
                        {invoiceColumns.map((column) => (
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
              <Wrapper.Box
                sx={{
                  py: 2,
                  px: 3,
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Wrapper.Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  shape="rounded"
                  color="primary"
                />
              </Wrapper.Box>
            </Wrapper.Card>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {loading ? (
            <Wrapper.Box sx={{ width: "100%" }}>
              <Wrapper.Skeleton variant="rectangular" height={50} />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
            </Wrapper.Box>
          ) : payrollRequests.length === 0 ? (
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
                No payroll requests found
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
                  Payroll Request Approval
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.TableContainer
                sx={{ maxHeight: "calc(100vh - 350px)", minHeight: "300px" }}
              >
                <Wrapper.Table stickyHeader>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      {payrollRequestColumns.map((column) => (
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
                    {payrollRequests.map((row) => (
                      <Wrapper.TableRow key={row._id} hover>
                        {payrollRequestColumns.map((column) => (
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
              <Wrapper.Box
                sx={{
                  py: 2,
                  px: 3,
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Wrapper.Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  shape="rounded"
                  color="primary"
                />
              </Wrapper.Box>
            </Wrapper.Card>
          )}
        </>
      )}

      {selectedInvoice && (
        <Wrapper.Dialog
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              overflow: "hidden",
            },
          }}
        >
          <Wrapper.Box
            sx={{
              p: 4,
              backgroundColor: "white",
            }}
          >
            <Wrapper.Typography variant="h4" fontWeight="bold" mb={4}>
              {selectedInvoice.type.charAt(0).toUpperCase() +
                selectedInvoice.type.slice(1)}{" "}
              Invoice Details
            </Wrapper.Typography>
            <Wrapper.Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 4,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Wrapper.Box>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Invoice Details:
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Invoice No: {selectedInvoice.invoiceNumber}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Party:{" "}
                  {selectedInvoice.supplier?.name ||
                    selectedInvoice.customer?.name ||
                    "N/A"}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Issue Date: {safeFormatDate(selectedInvoice.issueDate)}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Due Date: {safeFormatDate(selectedInvoice.dueDate)}
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.Box sx={{ textAlign: "right" }}>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Additional Info:
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Total: PKR {selectedInvoice.subtotal.toLocaleString()}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Status:{" "}
                  {selectedInvoice.status.charAt(0).toUpperCase() +
                    selectedInvoice.status.slice(1)}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Description: {selectedInvoice.description || "N/A"}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Reference: {selectedInvoice.reference || "N/A"}
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Box>
            <Wrapper.Typography variant="h6" fontWeight="medium" mb={2}>
              Items
            </Wrapper.Typography>
            <Wrapper.TableContainer
              component={Wrapper.Paper}
              sx={{ mb: 4, borderRadius: 1, boxShadow: 1 }}
            >
              <Wrapper.Table>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Item
                    </Wrapper.TableCell>
                    <Wrapper.TableCell
                      sx={{ fontWeight: "bold" }}
                      align="center"
                    >
                      Quantity
                    </Wrapper.TableCell>
                    <Wrapper.TableCell
                      sx={{ fontWeight: "bold" }}
                      align="center"
                    >
                      Unit Price (PKR)
                    </Wrapper.TableCell>
                    <Wrapper.TableCell
                      sx={{ fontWeight: "bold" }}
                      align="right"
                    >
                      Total (PKR)
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {selectedInvoice.items.map((item, index) => (
                    <Wrapper.TableRow key={index}>
                      <Wrapper.TableCell>
                        {item.item?.name || "N/A"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="center">
                        {item.quantity}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="center">
                        {item.unitPrice.toLocaleString()}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
            <Wrapper.Box
              sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
            >
              {selectedInvoice.status === "pending" && (
                <>
                  <Wrapper.Button
                    variant="contained"
                    color="success"
                    onClick={() =>
                      handleInvoiceAction(
                        selectedInvoice._id,
                        selectedInvoice.type,
                        "approve"
                      )
                    }
                    sx={{ borderRadius: 1 }}
                  >
                    Approve
                  </Wrapper.Button>
                  <Wrapper.Button
                    variant="contained"
                    color="error"
                    onClick={() =>
                      handleInvoiceAction(
                        selectedInvoice._id,
                        selectedInvoice.type,
                        "reject"
                      )
                    }
                    sx={{ borderRadius: 1 }}
                  >
                    Reject
                  </Wrapper.Button>
                </>
              )}
              <Wrapper.Button
                variant="outlined"
                onClick={() => setSelectedInvoice(null)}
                sx={{ borderRadius: 1 }}
              >
                Close
              </Wrapper.Button>
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.Dialog>
      )}

      {selectedPayrollRequest && (
        <Wrapper.Dialog
          open={!!selectedPayrollRequest}
          onClose={() => {
            setSelectedPayrollRequest(null);
            setNotes("");
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              overflow: "hidden",
            },
          }}
        >
          <Wrapper.Box
            sx={{
              p: 4,
              backgroundColor: "white",
            }}
          >
            <Wrapper.Typography variant="h4" fontWeight="bold" mb={4}>
              Payroll Request Details
            </Wrapper.Typography>
            <Wrapper.Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 4,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Wrapper.Box>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Request Details:
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Month:{" "}
                  {moment()
                    .month(selectedPayrollRequest.month - 1)
                    .format("MMMM")}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Year: {selectedPayrollRequest.year}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Total Amount: PKR{" "}
                  {selectedPayrollRequest.totalAmount.toLocaleString()}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Status: {selectedPayrollRequest.status}
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.Box sx={{ textAlign: "right" }}>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Additional Info:
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Created By: {selectedPayrollRequest.createdBy?.name || "N/A"}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Created At: {safeFormatDate(selectedPayrollRequest.createdAt)}
                </Wrapper.Typography>
                {selectedPayrollRequest.processedBy && (
                  <>
                    <Wrapper.Typography variant="body1">
                      Processed By:{" "}
                      {selectedPayrollRequest.processedBy?.name || "N/A"}
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      Processed At:{" "}
                      {safeFormatDate(selectedPayrollRequest.processedAt)}
                    </Wrapper.Typography>
                  </>
                )}
                <Wrapper.Typography variant="body1">
                  Notes: {selectedPayrollRequest.notes || "N/A"}
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Box>
            <Wrapper.Typography variant="h6" fontWeight="medium" mb={2}>
              Payrolls
            </Wrapper.Typography>
            <Wrapper.TableContainer
              component={Wrapper.Paper}
              sx={{ mb: 4, borderRadius: 1, boxShadow: 1 }}
            >
              <Wrapper.Table>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Name
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Type
                    </Wrapper.TableCell>
                    <Wrapper.TableCell
                      sx={{ fontWeight: "bold" }}
                      align="right"
                    >
                      Net Pay (PKR)
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {selectedPayrollRequest.payrolls.map((payroll) => (
                    <Wrapper.TableRow key={payroll._id}>
                      <Wrapper.TableCell>
                        {payroll.employee
                          ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
                          : payroll.user?.name || "-"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>{payroll.type}</Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {payroll.netPay.toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
            {selectedPayrollRequest.status === "Pending" && (
              <Wrapper.Box sx={{ mb: 4 }}>
                <Wrapper.TextField
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Wrapper.Box>
            )}
            <Wrapper.Box
              sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
            >
              {selectedPayrollRequest.status === "Pending" && (
                <>
                  <Wrapper.Button
                    variant="contained"
                    color="success"
                    onClick={() =>
                      handlePayrollRequestAction(
                        selectedPayrollRequest._id,
                        "Approved"
                      )
                    }
                    sx={{ borderRadius: 1 }}
                    disabled={payrollApproveLoading[selectedPayrollRequest._id]}
                  >
                    {payrollApproveLoading[selectedPayrollRequest._id] ? (
                      <Wrapper.Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Wrapper.CircularProgress size={20} color="inherit" />
                        Approving...
                      </Wrapper.Box>
                    ) : (
                      "Approve"
                    )}
                  </Wrapper.Button>
                  <Wrapper.Button
                    variant="contained"
                    color="error"
                    onClick={() =>
                      handlePayrollRequestAction(
                        selectedPayrollRequest._id,
                        "Rejected"
                      )
                    }
                    sx={{ borderRadius: 1 }}
                    disabled={payrollRejectLoading[selectedPayrollRequest._id]}
                  >
                    {payrollRejectLoading[selectedPayrollRequest._id] ? (
                      <Wrapper.Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Wrapper.CircularProgress size={20} color="inherit" />
                        Rejecting...
                      </Wrapper.Box>
                    ) : (
                      "Reject"
                    )}
                  </Wrapper.Button>
                </>
              )}
              <Wrapper.Button
                variant="outlined"
                onClick={() => {
                  setSelectedPayrollRequest(null);
                  setNotes("");
                }}
                sx={{ borderRadius: 1 }}
              >
                Close
              </Wrapper.Button>
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.Dialog>
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

export default InvoiceApproval;

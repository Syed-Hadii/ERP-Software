import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import moment from "moment";

const loanFields = [
  {
    name: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "Employee", label: "Employee" },
      { value: "User", label: "User" },
    ],
    validation: { required: true },
    icon: <Wrapper.CategoryIcon fontSize="small" color="action" />,
  },
  {
    name: "entity",
    label: "Entity",
    type: "select",
    options: [], // Populated dynamically
    validation: { required: true },
    icon: <Wrapper.PersonIcon fontSize="small" color="action" />,
  },
  {
    name: "totalAmount",
    label: "Total Amount",
    type: "number",
    validation: { required: true, min: 0.01 },
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
  {
    name: "installmentAmount",
    label: "Installment Amount",
    type: "number",
    validation: { required: true, min: 0.01 },
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
  {
    name: "totalInstallments",
    label: "Total Installments",
    type: "number",
    validation: { required: true, min: 1 },
    icon: <Wrapper.FormatListNumberedIcon fontSize="small" color="action" />,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    validation: { required: true },
    InputLabelProps: { shrink: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
];

const paymentFields = [
  {
    name: "amount",
    label: "Payment Amount",
    type: "number",
    validation: { required: true, min: 0.01 },
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
  {
    name: "note",
    label: "Note",
    type: "text",
    multiline: true,
    rows: 4,
    icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
  },
];

const Loans = () => {
  const theme = Wrapper.useTheme();
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    type: "Employee",
    entity: "",
    totalAmount: "",
    installmentAmount: "",
    totalInstallments: "",
    startDate: moment().format("YYYY-MM-DD"),
  });
  const [paymentData, setPaymentData] = useState({ amount: "", note: "" });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null,
  });
  const [filterEntity, setFilterEntity] = useState({ type: "", id: "" });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const fetchEmployees = async () => {
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/employees`, {
        params: { status: "active" },
      });
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await Wrapper.axios.get(`${BASE_URL}/user/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log(data);
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEntity.type === "Employee" && filterEntity.id) {
        params.employeeId = filterEntity.id;
      } else if (filterEntity.type === "User" && filterEntity.id) {
        params.userId = filterEntity.id;
      }
      const response = await Wrapper.axios.get(`${BASE_URL}/loan`, { params });
      if (response.data.success) {
        setLoans(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load loans",
          "error"
        );
      }
    } catch (err) {
      console.error("Fetch loans error:", err);
      showNotification("Failed to load loans", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
    fetchLoans();
  }, [filterEntity]);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "type") {
        newData.entity = ""; // Reset entity when type changes
      }
      return newData;
    });
  };

  const handlePaymentFieldChange = (name, value) => {
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (payload) => {
    try {
      const submitPayload = {
        type: payload.type,
        totalAmount: Number(payload.totalAmount),
        installmentAmount: Number(payload.installmentAmount),
        totalInstallments: Number(payload.totalInstallments),
        startDate: payload.startDate,
      };
      if (payload.type === "Employee") {
        submitPayload.employee = payload.entity;
      } else {
        submitPayload.user = payload.entity;
      }

      const response = await Wrapper.axios.post(
        `${BASE_URL}/loan`,
        submitPayload
      );
      if (response.data.success) {
        showNotification("Loan added", "success");
        setModalOpen(false);
        setFormData({
          type: "Employee",
          entity: "",
          totalAmount: "",
          installmentAmount: "",
          totalInstallments: "",
          startDate: moment().format("YYYY-MM-DD"),
        });
        fetchLoans();
      } else {
        showNotification(response.data.message || "Operation failed", "error");
      }
    } catch (err) {
      console.error("Submit error:", err);
      showNotification(
        err.response?.data?.message || "Operation failed",
        "error"
      );
    }
  };

  const handlePaymentSubmit = async (payload) => {
    try {
      const response = await Wrapper.axios.put(
        `${BASE_URL}/loan/${selectedLoan._id}`,
        payload
      );
      if (response.data.success) {
        showNotification("Payment recorded", "success");
        setPaymentModalOpen(false);
        setPaymentData({ amount: "", note: "" });
        setSelectedLoan(null);
        fetchLoans();
      } else {
        showNotification(response.data.message || "Operation failed", "error");
      }
    } catch (err) {
      console.error("Payment submit error:", err);
      showNotification(
        err.response?.data?.message || "Operation failed",
        "error"
      );
    }
  };

  const handleDelete = async () => {
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/loan/${deleteConfirmation.id}`
      );
      if (response.data.success) {
        showNotification("Loan deleted", "success");
        setDeleteConfirmation({ isOpen: false, id: null });
        fetchLoans();
      } else {
        showNotification(response.data.message || "Delete failed", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showNotification(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const dynamicLoanFields = loanFields.map((field) => {
    if (field.name === "entity") {
      return {
        ...field,
        options:
          formData.type === "Employee"
            ? employees.map((emp) => ({
                value: emp._id,
                label: `${emp.firstName} ${emp.lastName}`,
              }))
            : users.map((user) => ({
                value: user._id,
                label: user.name,
              })),
      };
    }
    return field;
  });

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
      {/* Header */}
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
          <Wrapper.Typography variant="h4" fontWeight="bold">
            Loan Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage loans and payments for employees and users
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.Button
          variant="contained"
          startIcon={<Wrapper.AddIcon />}
          onClick={() => {
            setFormData({
              type: "Employee",
              entity: "",
              totalAmount: "",
              installmentAmount: "",
              totalInstallments: "",
              startDate: moment().format("YYYY-MM-DD"),
            });
            setModalOpen(true);
          }}
          sx={{
            borderRadius: 2,
            bgcolor: "#348d39",
            "&:hover": { bgcolor: "#2e7d32", transform: "translateY(-2px)" },
          }}
        >
          Add New Loan
        </Wrapper.Button>
      </Wrapper.Box>

      {/* Filter */}
      <Wrapper.Box sx={{ mb: 3 }}>
        <Wrapper.Paper sx={{ p: 2 }}>
          <Wrapper.Grid container spacing={2}>
            <Wrapper.Grid item xs={12} md={4}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Filter by Type</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filterEntity.type}
                  onChange={(e) =>
                    setFilterEntity({ type: e.target.value, id: "" })
                  }
                >
                  <Wrapper.MenuItem value="">All Types</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Employee">Employee</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="User">User</Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            {filterEntity.type && (
              <Wrapper.Grid item xs={12} md={4}>
                <Wrapper.FormControl fullWidth>
                  <Wrapper.InputLabel>
                    Filter by {filterEntity.type}
                  </Wrapper.InputLabel>
                  <Wrapper.Select
                    value={filterEntity.id}
                    onChange={(e) =>
                      setFilterEntity({ ...filterEntity, id: e.target.value })
                    }
                  >
                    <Wrapper.MenuItem value="">
                      All {filterEntity.type}s
                    </Wrapper.MenuItem>
                    {(filterEntity.type === "Employee" ? employees : users).map(
                      (entity) => (
                        <Wrapper.MenuItem key={entity._id} value={entity._id}>
                          {filterEntity.type === "Employee"
                            ? `${entity.firstName} ${entity.lastName}`
                            : entity.name}
                        </Wrapper.MenuItem>
                      )
                    )}
                  </Wrapper.Select>
                </Wrapper.FormControl>
              </Wrapper.Grid>
            )}
          </Wrapper.Grid>
        </Wrapper.Paper>
      </Wrapper.Box>

      {/* Table */}
      {loading ? (
        <Wrapper.Skeleton variant="rectangular" height={300} />
      ) : loans.length === 0 ? (
        <Wrapper.Card sx={{ p: 4, textAlign: "center" }}>
          <Wrapper.Typography variant="h5">No Loans Found</Wrapper.Typography>
        </Wrapper.Card>
      ) : (
        <Wrapper.Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Wrapper.TableContainer>
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Name
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Type
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Total Amount
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Installment Amount
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Installments
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Start Date
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Status
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {loans.map((loan) => (
                  <Wrapper.TableRow key={loan._id}>
                    <Wrapper.TableCell>
                      {loan.employee
                        ? `${loan.employee.firstName} ${loan.employee.lastName}`
                        : loan.user?.name || "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{loan.type}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      PKR {loan.totalAmount.toLocaleString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      PKR {loan.installmentAmount.toLocaleString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {loan.installmentsPaid}/{loan.totalInstallments}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {moment(loan.startDate).format("DD/MM/YYYY")}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Chip
                        label={loan.isPaid ? "Paid" : "Active"}
                        color={loan.isPaid ? "success" : "warning"}
                        size="small"
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.IconButton
                          size="small"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setPaymentData({
                              amount: loan.installmentAmount,
                              note: "",
                            });
                            setPaymentModalOpen(true);
                          }}
                          disabled={loan.isPaid}
                          sx={{ color: "#4caf50" }}
                        >
                          <Wrapper.PaymentIcon fontSize="small" />
                        </Wrapper.IconButton>
                        <Wrapper.IconButton
                          size="small"
                          onClick={() =>
                            setDeleteConfirmation({
                              isOpen: true,
                              id: loan._id,
                            })
                          }
                          sx={{ color: "error.main" }}
                        >
                          <Wrapper.DeleteIcon fontSize="small" />
                        </Wrapper.IconButton>
                      </Wrapper.Box>
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
        </Wrapper.Paper>
      )}

      {/* Loan Modal */}
      <ReusableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title="Add Loan"
        fields={dynamicLoanFields}
        initialData={formData}
        values={formData}
        submitButtonText="Add"
        onFieldChange={handleFieldChange}
        loading={loading}
      />

      {/* Payment Modal */}
      <ReusableModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        title="Record Loan Payment"
        fields={paymentFields}
        initialData={paymentData}
        values={paymentData}
        submitButtonText="Record Payment"
        onFieldChange={handlePaymentFieldChange}
        loading={loading}
      />

      {/* Delete Confirmation */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
      >
        <Wrapper.DialogTitle>Confirm Deletion</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography>
            Are you sure you want to delete this loan?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button
            onClick={() => setDeleteConfirmation({ isOpen: false, id: null })}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Notification */}
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

export default Loans;

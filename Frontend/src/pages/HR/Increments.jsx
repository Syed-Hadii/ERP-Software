import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import moment from "moment";

const incrementFields = [
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
    name: "amount",
    label: "Amount",
    type: "number",
    validation: { required: true, min: 0.01 },
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
  {
    name: "date",
    label: "Date",
    type: "date",
    validation: { required: true },
    InputLabelProps: { shrink: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "remarks",
    label: "Remarks",
    type: "text",
    multiline: true,
    rows: 4,
    icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
  },
];

const Increments = () => {
  const theme = Wrapper.useTheme();
  const [increments, setIncrements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    type: "Employee",
    entity: "",
    amount: "",
    date: moment().format("YYYY-MM-DD"),
    remarks: "",
  });
  const [selectedIncrement, setSelectedIncrement] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const fetchIncrements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEntity.type === "Employee" && filterEntity.id) {
        params.employeeId = filterEntity.id;
      } else if (filterEntity.type === "User" && filterEntity.id) {
        params.userId = filterEntity.id;
      }
      const response = await Wrapper.axios.get(`${BASE_URL}/increment`, {
        params,
      });
      if (response.data.success) {
        setIncrements(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load increments",
          "error"
        );
      }
    } catch (err) {
      console.error("Fetch increments error:", err);
      showNotification("Failed to load increments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
    fetchIncrements();
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

  const handleSubmit = async (payload) => {
    try {
      const submitPayload = {
        type: payload.type,
        amount: Number(payload.amount),
        date: payload.date,
        remarks: payload.remarks,
      };
      if (payload.type === "Employee") {
        submitPayload.employee = payload.entity;
      } else {
        submitPayload.user = payload.entity;
      }

      let response;
      if (selectedIncrement) {
        response = await Wrapper.axios.put(
          `${BASE_URL}/increment/${selectedIncrement._id}`,
          {
            amount: Number(payload.amount),
            date: payload.date,
            remarks: payload.remarks,
          }
        );
      } else {
        response = await Wrapper.axios.post(
          `${BASE_URL}/increment`,
          submitPayload
        );
      }
      if (response.data.success) {
        showNotification(
          selectedIncrement ? "Increment updated" : "Increment added",
          "success"
        );
        setModalOpen(false);
        setSelectedIncrement(null);
        setFormData({
          type: "Employee",
          entity: "",
          amount: "",
          date: moment().format("YYYY-MM-DD"),
          remarks: "",
        });
        fetchIncrements();
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

  const handleDelete = async () => {
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/increment/${deleteConfirmation.id}`
      );
      if (response.data.success) {
        showNotification("Increment deleted", "success");
        setDeleteConfirmation({ isOpen: false, id: null });
        fetchIncrements();
      } else {
        showNotification(response.data.message || "Delete failed", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showNotification(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const dynamicFields = incrementFields.map((field) => {
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
            Increment Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage salary increments for employees and users
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.Button
          variant="contained"
          startIcon={<Wrapper.AddIcon />}
          onClick={() => {
            setSelectedIncrement(null);
            setFormData({
              type: "Employee",
              entity: "",
              amount: "",
              date: moment().format("YYYY-MM-DD"),
              remarks: "",
            });
            setModalOpen(true);
          }}
          sx={{
            borderRadius: 2,
            bgcolor: "#348d39",
            "&:hover": { bgcolor: "#2e7d32", transform: "translateY(-2px)" },
          }}
        >
          Add New Increment
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
      ) : increments.length === 0 ? (
        <Wrapper.Card sx={{ p: 4, textAlign: "center" }}>
          <Wrapper.Typography variant="h5">
            No Increments Found
          </Wrapper.Typography>
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
                    Amount
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Date
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Remarks
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {increments.map((inc) => (
                  <Wrapper.TableRow key={inc._id}>
                    <Wrapper.TableCell>
                      {inc.employee
                        ? `${inc.employee.firstName} ${inc.employee.lastName}`
                        : inc.user?.name || "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{inc.type}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      PKR {inc.amount.toLocaleString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {moment(inc.date).format("DD/MM/YYYY")}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{inc.remarks || "-"}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.IconButton
                          size="small"
                          onClick={() => {
                            setSelectedIncrement(inc);
                            setFormData({
                              type: inc.type,
                              entity: inc.employee?._id || inc.user?._id || "",
                              amount: inc.amount,
                              date: moment(inc.date).format("YYYY-MM-DD"),
                              remarks: inc.remarks || "",
                            });
                            setModalOpen(true);
                          }}
                          sx={{ color: "#FBC02D" }}
                        >
                          <Wrapper.EditIcon fontSize="small" />
                        </Wrapper.IconButton>
                        <Wrapper.IconButton
                          size="small"
                          onClick={() =>
                            setDeleteConfirmation({ isOpen: true, id: inc._id })
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

      {/* Modal */}
      <ReusableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={selectedIncrement ? "Edit Increment" : "Add Increment"}
        fields={dynamicFields}
        initialData={formData}
        values={formData}
        submitButtonText={selectedIncrement ? "Update" : "Add"}
        onFieldChange={handleFieldChange}
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
            Are you sure you want to delete this increment?
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

export default Increments;

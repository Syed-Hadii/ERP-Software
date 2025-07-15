import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import moment from "moment";

const employeeFields = [
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    validation: { required: true },
    icon: <Wrapper.PersonIcon fontSize="small" color="action" />,
  },
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    validation: { required: true },
    icon: <Wrapper.PersonIcon fontSize="small" color="action" />,
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    validation: { required: true, email: true },
    icon: <Wrapper.EmailIcon fontSize="small" color="action" />,
  },
  {
    name: "phone",
    label: "Phone",
    type: "text",
    icon: <Wrapper.PhoneIcon fontSize="small" color="action" />,
  },
  {
    name: "department",
    label: "Department",
    type: "select",
    options: [
      { value: "Agriculture", label: "Agriculture" },
      { value: "Cattle", label: "Cattle" },
    ],
    validation: { required: true },
    icon: <Wrapper.WorkIcon fontSize="small" color="action" />,
  },
  {
    name: "designation",
    label: "Designation",
    type: "text",
    validation: { required: true },
    icon: <Wrapper.BadgeIcon fontSize="small" color="action" />,
  },
  {
    name: "initialSalary",
    label: "Initial Salary",
    type: "number",
    validation: { required: true, min: 0 },
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
  {
    name: "joinDate",
    label: "Join Date",
    type: "date",
    validation: { required: true },
    InputLabelProps: { shrink: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    validation: { required: true },
    icon: <Wrapper.CheckCircleIcon fontSize="small" color="action" />,
  },
];

const Employees = () => {
  const theme = Wrapper.useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState(
    employeeFields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "joinDate",
    direction: "desc",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null,
  });
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
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

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/employees`);
      if (response.data.success) {
        console.log(response.data);
        setEmployees(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load employees",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const displayedEmployees = employees
    .filter(
      (e) =>
        `${e.firstName} ${e.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const vA = a[sortConfig.key];
      const vB = b[sortConfig.key];
      if (sortConfig.direction === "asc") return vA > vB ? 1 : -1;
      return vA < vB ? 1 : -1;
    });

  const handleFieldChange = (name, value) => {
    setFormData((d) => ({ ...d, [name]: value }));
  };

  const handleSubmit = async (payload) => {
    try {
      let response;
      if (selectedEmployee) {
        response = await Wrapper.axios.put(
          `${BASE_URL}/employees/${selectedEmployee._id}`,
          payload
        );
      } else {
        response = await Wrapper.axios.post(`${BASE_URL}/employees`, payload);
      }

      if (response.data.success) {
        await fetchEmployees();
        showNotification(
          response.data.message ||
            (selectedEmployee ? "Employee updated" : "Employee added"),
          "success"
        );
        setAddModalOpen(false);
        setEditModalOpen(false);
        setSelectedEmployee(null);
        setFormData(
          employeeFields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
        );
      } else {
        showNotification(response.data.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showNotification(
        error.response?.data?.message || "Operation failed",
        "error"
      );
    }
  };

  const handleDelete = async () => {
    const { id } = deleteConfirmation;
    if (!id) {
      showNotification("No employee selected for deletion", "error");
      return;
    }
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/employees/${id}`
      );
      if (response.data.success) {
        showNotification(
          response.data.message || "Deleted successfully",
          "success"
        );
        setDeleteConfirmation({ isOpen: false, id: null });
        fetchEmployees();
      } else {
        showNotification(response.data.message || "Delete failed", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification(
        error.response?.data?.message || "Delete failed",
        "error"
      );
    }
  };

  const handleConfirmMultipleDelete = async () => {
    try {
      await Wrapper.axios.post(`${BASE_URL}/employees/delete-multiple`, {
        ids: selectedEmployees,
      });
      showNotification(
        `${selectedEmployees.length} employees deleted successfully`,
        "success"
      );
      setSelectedEmployees([]);
      fetchEmployees();
    } catch (error) {
      showNotification("Failed to delete selected employees", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
    }
  };

  const handleSelectEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(displayedEmployees.map((emp) => emp._id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const openAdd = () => {
    setSelectedEmployee(null);
    setFormData(
      employeeFields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
    );
    setAddModalOpen(true);
  };

  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || "",
      department: emp.department,
      designation: emp.designation,
      initialSalary: emp.initialSalary,
      joinDate: moment(emp.joinDate).format("YYYY-MM-DD"),
      status: emp.status,
    });
    setEditModalOpen(true);
  };

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
            Employee Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your farm employees
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Wrapper.TextField
            placeholder="Search Employees..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 220 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": { borderColor: "#2e7d32" },
                "&:hover fieldset": { borderColor: "#2e7d32" },
                "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
              },
            }}
            InputProps={{
              startAdornment: (
                <Wrapper.InputAdornment position="start">
                  <Wrapper.SearchIcon fontSize="small" />
                </Wrapper.InputAdornment>
              ),
            }}
          />
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={openAdd}
            sx={{
              borderRadius: 2,
              px: 2,
              bgcolor: "#348d39",
              "&:hover": {
                bgcolor: "#2e7d32",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              },
              boxShadow: 2,
            }}
          >
            Add New Employee
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() => {
              if (selectedEmployees.length > 0) {
                setMultipleDeleteConfirmation({ isOpen: true });
              } else {
                showNotification("No employees selected", "warning");
              }
            }}
            disabled={selectedEmployees.length === 0}
            sx={{
              borderRadius: 2,
              px: 2,
              borderColor: "error.main",
              color: "error.main",
              "&:hover": {
                bgcolor: Wrapper.alpha(theme.palette.error.main, 0.1),
                borderColor: "error.dark",
              },
              "&.Mui-disabled": { opacity: 0.6 },
            }}
          >
            Delete Selected
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      {/* Stats Cards */}
      <Wrapper.Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 3,
          mb: 4,
        }}
      >
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
            borderLeft: "4px solid",
            borderColor: "#10b981",
          }}
        >
          <Wrapper.CardContent sx={{ p: 3 }}>
            <Wrapper.Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
            >
              Total Employees
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {employees.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
            borderLeft: "4px solid",
            borderColor: "#10b981",
          }}
        >
          <Wrapper.CardContent sx={{ p: 3 }}>
            <Wrapper.Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
            >
              Selected
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {selectedEmployees.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {/* Table or Loading */}
      {loading ? (
        <>
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="rectangular" height={200} />
        </>
      ) : (
        <Wrapper.Card>
          <Wrapper.TableContainer>
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell padding="checkbox">
                    <Wrapper.Checkbox
                      indeterminate={
                        selectedEmployees.length > 0 &&
                        selectedEmployees.length < displayedEmployees.length
                      }
                      checked={
                        displayedEmployees.length > 0 &&
                        selectedEmployees.length === displayedEmployees.length
                      }
                      onChange={handleSelectAll}
                      sx={{ "&.Mui-checked": { color: "primary.main" } }}
                    />
                  </Wrapper.TableCell>
                  {[
                    "Name",
                    "Email",
                    "Department",
                    "Designation",
                    "Join Date",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <Wrapper.TableCell
                      key={h}
                      onClick={() =>
                        setSortConfig((s) => ({
                          key:
                            h === "Name"
                              ? "firstName"
                              : h === "Join Date"
                              ? "joinDate"
                              : h.toLowerCase(),
                          direction: s.direction === "asc" ? "desc" : "asc",
                        }))
                      }
                      sx={{ cursor: "pointer", fontWeight: "bold" }}
                    >
                      {h}
                    </Wrapper.TableCell>
                  ))}
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {displayedEmployees.map((emp) => (
                  <Wrapper.TableRow
                    key={emp._id}
                    sx={{
                      ...(selectedEmployees.includes(emp._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedEmployees.includes(emp._id)}
                        onChange={() => handleSelectEmployee(emp._id)}
                        sx={{ "&.Mui-checked": { color: "primary.main" } }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{`${emp.firstName} ${emp.lastName}`}</Wrapper.TableCell>
                    <Wrapper.TableCell>{emp.email}</Wrapper.TableCell>
                    <Wrapper.TableCell>{emp.department}</Wrapper.TableCell>
                    <Wrapper.TableCell>{emp.designation}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {moment(emp.joinDate).format("DD/MM/YYYY")}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Chip
                        label={emp.status}
                        color={emp.status === "active" ? "success" : "warning"}
                        size="small"
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit Employee">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => openEdit(emp)}
                            sx={{ color: "#FBC02D" }}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete Employee">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                id: emp._id,
                              })
                            }
                            sx={{ color: "error.main" }}
                          >
                            <Wrapper.DeleteIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="View Details">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => navigate(`/employee/${emp._id}`)}
                            sx={{ color: "primary.main" }}
                          >
                            <Wrapper.InfoIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                      </Wrapper.Box>
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>

          <Wrapper.Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: Wrapper.alpha(theme.palette.background.paper, 0.5),
            }}
          >
            <Wrapper.Typography variant="body2" color="text.secondary">
              {selectedEmployees.length > 0 ? (
                <span>
                  <b>{selectedEmployees.length}</b> employees selected
                </span>
              ) : (
                <span>Select employees to perform actions</span>
              )}
            </Wrapper.Typography>
            {selectedEmployees.length > 0 && (
              <Wrapper.Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Wrapper.DeleteIcon />}
                onClick={() => setMultipleDeleteConfirmation({ isOpen: true })}
                sx={{ borderRadius: 1 }}
              >
                Delete Selected
              </Wrapper.Button>
            )}
          </Wrapper.Box>
        </Wrapper.Card>
      )}

      {/* Modals */}
      <ReusableModal
        open={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
        }}
        onSubmit={handleSubmit}
        title={selectedEmployee ? "Edit Employee" : "Add New Employee"}
        fields={employeeFields}
        initialData={selectedEmployee || {}}
        values={formData}
        onFieldChange={handleFieldChange}
        submitButtonText={selectedEmployee ? "Update" : "Add"}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24,
            maxWidth: "400px",
            width: "100%",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ pb: 1 }}>
          Confirm Deletion
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Wrapper.Alert>
          <Wrapper.Typography variant="body1">
            Are you sure you want to delete this employee?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() => setDeleteConfirmation({ isOpen: false, id: null })}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            sx={{ borderRadius: 1 }}
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Multiple Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={multipleDeleteConfirmation.isOpen}
        onClose={() => setMultipleDeleteConfirmation({ isOpen: false })}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24,
            maxWidth: "400px",
            width: "100%",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ pb: 1 }}>
          Confirm Multiple Deletion
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Wrapper.Alert>
          <Wrapper.Typography variant="body1">
            Are you sure you want to delete {selectedEmployees.length} selected
            employees?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() => setMultipleDeleteConfirmation({ isOpen: false })}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleConfirmMultipleDelete}
            sx={{ borderRadius: 1 }}
          >
            Delete Selected
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Notification Snackbar */}
      <Wrapper.Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Wrapper.Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </Wrapper.Box>
  );
};

export default Employees;

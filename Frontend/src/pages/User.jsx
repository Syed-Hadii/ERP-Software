// User.jsx
"use client";

import { useEffect, useState } from "react";
import ReusableModal from "../components/Modals/ReusableModal";
import { BASE_URL } from "../config/config";
import "../components/styles/productManage.css";
import Loading from "../components/Loading";
import Wrapper from "../utils/wrapper";
import { Person, Email, Phone, Lock, Badge } from "@mui/icons-material";
import AuthService from "../utils/auth";

const roles = [
  { value: "Admin", label: "Admin", salary: false },
  { value: "HR Manager", label: "HR Manager", salary: true },
  { value: "Finance Manager", label: "Finance Manager", salary: true },
  { value: "Crop Manager", label: "Crop Manager", salary: true },
  { value: "Dairy Manager", label: "Dairy Manager", salary: true },
  { value: "Inventory Manager", label: "Inventory Manager", salary: true },
  { value: "Operations Manager", label: "Operations Manager", salary: true },
  { value: "Reporting Manager", label: "Reporting Manager", salary: true },
];

const userFields = [
  {
    name: "name",
    label: "Name",
    placeholder: "Enter name",
    type: "text",
    icon: <Person fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    options: roles,
    icon: <Badge fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "email",
    label: "Email",
    placeholder: "Enter email",
    type: "email",
    icon: <Email fontSize="small" color="action" />,
    validation: {
      required: true,
      pattern: /\S+@\S+\.\S+/,
      patternMessage: "Email is invalid",
    },
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: "Enter phone",
    type: "text",
    icon: <Phone fontSize="small" color="action" />,
  },
  {
    name: "password",
    label: "New Password",
    placeholder: "Enter new password (optional)",
    type: "password",
    icon: <Lock fontSize="small" color="action" />,
    validation: {
      required: false,
      minLength: 6,
    },
  },
  {
    name: "initialSalary",
    label: "Initial Salary",
    type: "number",
    validation: { min: 0 },
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
];

const editUserFields = userFields.map((field) => {
  if (field.name === "password") {
    return {
      ...field,
      validation: {
        ...field.validation,
        required: false, // Make password optional for editing
      },
    };
  }
  return field;
});

const User = () => {
  const theme = Wrapper.useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    userId: null,
  });
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
  const [passwordResetDialog, setPasswordResetDialog] = useState({
    isOpen: false,
    temporaryPassword: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // Users.jsx ke component ke andar
  const currentUser = AuthService.getUser();
  const isAdmin = currentUser?.role === "Admin";
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await Wrapper.axios.get(`${BASE_URL}/user/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      showNotification("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (form) => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.post(`${BASE_URL}/user/`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data) {
        setAddOpen(false);
        fetchUsers();
        showNotification("User added successfully", "success");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      showNotification("Failed to add user", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (user) => {
    setSelectedUser({
      ...user,
    });
    setEditOpen(true);
  };

  const handleEdit = async (form) => {
    try {
      setLoading(true);
      await Wrapper.axios.put(`${BASE_URL}/user/${selectedUser._id}`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEditOpen(false);
      fetchUsers();
      showNotification("User updated successfully", "success");
    } catch (error) {
      console.error("Error updating user:", error);
      showNotification("Failed to update user", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.post(
        `${BASE_URL}/user/${selectedUser._id}/reset-password`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setPasswordResetDialog({
        isOpen: true,
        temporaryPassword: response.data.temporaryPassword,
      });
      showNotification("Password reset successfully", "success");
    } catch (error) {
      console.error("Error resetting password:", error);
      showNotification("Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    const { userId } = deleteConfirmation;
    if (!userId) return;
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
      showNotification("User deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting user:", err.response?.data || err.message);
      showNotification("Failed to delete user", "error");
    } finally {
      setDeleteConfirmation({ isOpen: false, userId: null });
      setLoading(false);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/user/`, {
        data: { ids: selectedUsers },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSelectedUsers([]);
      fetchUsers();
      showNotification(
        `${selectedUsers.length} users deleted successfully`,
        "success"
      );
    } catch (err) {
      console.error("Error deleting users:", err.response?.data || err.message);
      showNotification("Failed to delete selected users", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map((user) => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSort = (field) => {
    const newDirection =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  const handleClosePasswordResetDialog = () => {
    setPasswordResetDialog({ isOpen: false, temporaryPassword: "" });
  };

  // Filter users based on search term
  const roleFilteredUsers = isAdmin
    ? users
    : users.filter((user) => user.role !== "Admin");
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField] || "";
    const bValue = b[sortField] || "";
    if (sortDirection === "asc") {
      return String(aValue).localeCompare(String(bValue));
    } else {
      return String(bValue).localeCompare(String(aValue));
    }
  });

  if (loading && users.length === 0) {
    return (
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loading />
      </Wrapper.Box>
    );
  }

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
      {/* Header Section */}
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
            User Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your organization&apos;s user accounts and permissions
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
            placeholder="Search users..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 220 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "#2e7d32",
                },
                "&:hover fieldset": {
                  borderColor: "#2e7d32",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#2e7d32",
                },
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
            onClick={() => setAddOpen(true)}
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
            Add User
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() => {
              if (selectedUsers.length > 0) {
                setMultipleDeleteConfirmation({ isOpen: true });
              } else {
                showNotification("No users selected", "warning");
              }
            }}
            disabled={selectedUsers.length === 0}
            sx={{
              borderRadius: 2,
              px: 2,
              borderColor: "error.main",
              color: "error.main",
              "&:hover": {
                bgcolor: Wrapper.alpha(theme.palette.error.main, 0.1),
                borderColor: "error.dark",
              },
              "&.Mui-disabled": {
                opacity: 0.6,
              },
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
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: 4,
            },
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
              Total Users
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {users.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>

        <Wrapper.Card
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: 4,
            },
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
              {selectedUsers.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {/* Users Table */}
      {users.length === 0 ? (
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
          <Wrapper.PersonOutlineIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Wrapper.Typography variant="h5" gutterBottom>
            No users found
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Add your first user to get started
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Add User
          </Wrapper.Button>
        </Wrapper.Card>
      ) : (
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: 3,
            transition: "box-shadow 0.3s",
            "&:hover": {
              boxShadow: 6,
            },
          }}
        >
          <Wrapper.Box
            sx={{
              p: 2,
              bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.05),
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "User" : "Users"}{" "}
              {searchTerm && `matching "${searchTerm}"`}
            </Wrapper.Typography>
            <Wrapper.Tooltip title="Filter list">
              <Wrapper.IconButton size="small">
                <Wrapper.FilterListIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
          </Wrapper.Box>

          <Wrapper.TableContainer
            sx={{
              maxHeight: "calc(100vh - 350px)",
              minHeight: "300px",
              "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: Wrapper.alpha(theme.palette.primary.main, 0.2),
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: Wrapper.alpha(
                  theme.palette.primary.main,
                  0.05
                ),
              },
            }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell padding="checkbox">
                    <Wrapper.Checkbox
                      indeterminate={
                        selectedUsers.length > 0 &&
                        selectedUsers.length < filteredUsers.length
                      }
                      checked={
                        filteredUsers.length > 0 &&
                        selectedUsers.length === filteredUsers.length
                      }
                      onChange={handleSelectAll}
                      sx={{
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("name")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.05
                        ),
                      },
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Name
                      {sortField === "name" &&
                        (sortDirection === "asc" ? (
                          <Wrapper.ArrowUpwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: 16 }}
                          />
                        ) : (
                          <Wrapper.ArrowDownwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: 16 }}
                          />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("role")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.05
                        ),
                      },
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Role
                      {sortField === "role" &&
                        (sortDirection === "asc" ? (
                          <Wrapper.ArrowUpwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: 16 }}
                          />
                        ) : (
                          <Wrapper.ArrowDownwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: 16 }}
                          />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Email
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Phone
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("salary")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.05
                        ),
                      },
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Salary
                      {sortField === "salary" &&
                        (sortDirection === "asc" ? (
                          <Wrapper.ArrowUpwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: 16 }}
                          />
                        ) : (
                          <Wrapper.ArrowDownwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: 16 }}
                          />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {sortedUsers.map((user) => (
                  <Wrapper.TableRow
                    key={user._id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.04
                        ),
                      },
                      ...(selectedUsers.includes(user._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Typography variant="body1" fontWeight="medium">
                        {user.name}
                      </Wrapper.Typography>
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Chip
                        label={user.role}
                        size="small"
                        sx={{
                          bgcolor: getRoleColor(user.role),
                          color: "white",
                          fontWeight: "medium",
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{user.email}</Wrapper.TableCell>
                    <Wrapper.TableCell>{user.phone}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {user.basicSalary !== undefined
                        ? `Rs ${user.basicSalary}`
                        : "--"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit user">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => handleEditOpen(user)}
                            sx={{
                              color: "#FBC02D",
                              "&:hover": {
                                bgcolor: Wrapper.alpha(
                                  theme.palette.info.main,
                                  0.1
                                ),
                              },
                            }}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete user">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                userId: user._id,
                              })
                            }
                            sx={{
                              color: "error.main",
                              "&:hover": {
                                bgcolor: Wrapper.alpha(
                                  theme.palette.error.main,
                                  0.1
                                ),
                              },
                            }}
                          >
                            <Wrapper.DeleteIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                      </Wrapper.Box>
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>

          {filteredUsers.length === 0 && (
            <Wrapper.Box sx={{ p: 4, textAlign: "center" }}>
              <Wrapper.Typography variant="body1" color="text.secondary">
                No users match your search criteria
              </Wrapper.Typography>
            </Wrapper.Box>
          )}

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
              {selectedUsers.length > 0 ? (
                <span>
                  <b>{selectedUsers.length}</b> users selected
                </span>
              ) : (
                <span>Select users to perform actions</span>
              )}
            </Wrapper.Typography>

            {selectedUsers.length > 0 && (
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
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New User"
        fields={userFields.map((field) =>
          field.name === "role"
            ? {
                ...field,
                options: isAdmin
                  ? roles
                  : roles.filter((r) => r.value !== "Admin"),
              }
            : field
        )}
        submitButtonText="Add User"
      />

      <ReusableModal
        key={selectedUser?._id || "edit-modal"}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        title="Edit User"
        fields={editUserFields.map((field) =>
          field.name === "role"
            ? {
                ...field,
                options: isAdmin
                  ? roles
                  : roles.filter((r) => r.value !== "Admin"),
              }
            : field
        )}
        initialData={selectedUser}
        submitButtonText="Save Changes"
        additionalButtons={[
          {
            label: "Reset Password",
            color: "warning",
            onClick: handleResetPassword,
            variant: "contained",
          },
        ]}
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, userId: null })}
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
            Are you sure you want to delete this user?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() =>
              setDeleteConfirmation({ isOpen: false, userId: null })
            }
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
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
            Are you sure you want to delete {selectedUsers.length} selected
            users?
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

      {/* Password Reset Confirmation Dialog */}
      <Wrapper.Dialog
        open={passwordResetDialog.isOpen}
        onClose={handleClosePasswordResetDialog}
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
          Password Reset Successful
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography variant="body1" gutterBottom>
            The user&apos;s password has been reset. Please share the temporary
            password with the user:
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              mt: 2,
              p: 2,
              bgcolor: "#f5f5f5",
              borderRadius: 1,
            }}
          >
            Temporary Password: {passwordResetDialog.temporaryPassword}
          </Wrapper.Typography>
          <Wrapper.Alert severity="info" sx={{ mt: 2 }}>
            The user should change their password after logging in.
          </Wrapper.Alert>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            variant="contained"
            onClick={handleClosePasswordResetDialog}
            sx={{ borderRadius: 1 }}
          >
            Close
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

// Helper function to get role color
const getRoleColor = (role) => {
  const roleColors = {
    Admin: "#2E7D32", // green
    "HR Manager": "#1976D2", // blue
    "Finance Manager": "#7B1FA2", // purple
    "Crop Manager": "#F57C00", // orange
    "Dairy Manager": "#0288D1", // light blue
    "Inventory Manager": "#C2185B", // pink
    "Operations Manager": "#00796B", // teal
    "Reporting Manager": "#5D4037", // brown
  };

  return roleColors[role] || "#757575"; // default gray
};

export default User;

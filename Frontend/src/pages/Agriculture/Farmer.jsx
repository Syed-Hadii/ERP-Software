"use client";

import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";

const farmerFields = [
  {
    name: "name",
    label: "Name",
    placeholder: "Enter name",
    type: "text",
    icon: <Wrapper.PersonIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: "Enter phone",
    type: "text",
    icon: <Wrapper.CallMadeIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "address",
    label: "Address",
    placeholder: "Enter address",
    type: "text",
    icon: <Wrapper.MapIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "nic",
    label: "NIC",
    placeholder: "Enter NIC",
    type: "text",
    icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
];

const Farmer = () => {
  const theme = Wrapper.useTheme();
  const [farmerList, setFarmerList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    farmerId: null,
  });
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const recordsPerPage = 3;

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

  // Fetch farmer records from the API
  const fetchFarmer = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/farmer/getfarmer?page=${currentPage}&limit=${recordsPerPage}&search=${searchQuery}`
      );
      setFarmerList(response.data.farmer);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error("Error fetching Farmer records:", error);
      showNotification("Failed to fetch Farmer records", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add new farmer
  const handleAddFarmer = async (form) => {
    try {
      const response = await Wrapper.axios.post(
        `${BASE_URL}/farmer/addfarmer`,
        form
      );
      if (response.data.success) {
        showNotification("Farmer Added Successfully!", "success");
        setAddModalOpen(false);
        fetchFarmer();
      }
    } catch (error) {
      console.error("Error adding Farmer:", error);
      showNotification("Failed to add Farmer", "error");
    }
  };

  // Update farmer
  const handleUpdateFarmer = async (form) => {
    try {
      const response = await Wrapper.axios.put(
        `${BASE_URL}/farmer/updatefarmer`,
        {
          id: selectedFarmer._id,
          ...form,
        }
      );
      if (response.data.success) {
        showNotification("Farmer updated successfully", "success");
        setEditModalOpen(false);
        fetchFarmer();
      }
    } catch (error) {
      console.error("Error updating Farmer:", error);
      showNotification("Failed to update Farmer", "error");
    }
  };

  // Delete single farmer
  const handleDeleteFarmer = async () => {
    const { farmerId } = deleteConfirmation;
    if (!farmerId) return;
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/farmer/deletefarmer`, {
        data: { id: farmerId },
      });
      showNotification("Farmer deleted successfully!", "success");
      setDeleteConfirmation({ isOpen: false, farmerId: null });
      fetchFarmer();
    } catch (error) {
      console.error("Error deleting Farmer:", error);
      showNotification("Error deleting Farmer", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete multiple farmers
  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/farmer/deletefarmers`, {
        data: { ids: selectedFarmers },
      });
      setSelectedFarmers([]);
      fetchFarmer();
      showNotification(
        `${selectedFarmers.length} farmers deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting farmers:", error);
      showNotification("Failed to delete selected farmers", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEditClick = (farmer) => {
    setSelectedFarmer(farmer);
    setEditModalOpen(true);
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Handle farmer selection
  const handleSelectFarmer = (id) => {
    setSelectedFarmers((prev) =>
      prev.includes(id)
        ? prev.filter((farmerId) => farmerId !== id)
        : [...prev, id]
    );
  };

  // Handle select all farmers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFarmers(filteredFarmer.map((farmer) => farmer._id));
    } else {
      setSelectedFarmers([]);
    }
  };

  // Filter and sort farmer records
  const filteredFarmer = farmerList
    .filter((farmer) =>
      farmer.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortConfig.key) {
        if (sortConfig.direction === "asc") {
          return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
        } else {
          return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
        }
      }
      return 0;
    });

  // Fetch records on page or search change
  useEffect(() => {
    fetchFarmer();
  }, [currentPage, searchQuery]);

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
            Farmer Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your Farmer records and details
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
            placeholder="Search Farmer..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onClick={() => setAddModalOpen(true)}
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
            Add Farmer
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() => {
              if (selectedFarmers.length > 0) {
                setMultipleDeleteConfirmation({ isOpen: true });
              } else {
                showNotification("No farmers selected", "warning");
              }
            }}
            disabled={selectedFarmers.length === 0}
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
              Total Farmers
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {farmerList.length}
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
              {selectedFarmers.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {/* Farmer Table */}
      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
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
              {filteredFarmer.length} Farmer
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
            }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell padding="checkbox">
                    <Wrapper.Checkbox
                      indeterminate={
                        selectedFarmers.length > 0 &&
                        selectedFarmers.length < filteredFarmer.length
                      }
                      checked={
                        filteredFarmer.length > 0 &&
                        selectedFarmers.length === filteredFarmer.length
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
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Name
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <Wrapper.ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <Wrapper.ArrowDownwardIcon fontSize="small" />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("phone")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Phone
                      {sortConfig.key === "phone" &&
                        (sortConfig.direction === "asc" ? (
                          <Wrapper.ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <Wrapper.ArrowDownwardIcon fontSize="small" />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    NIC
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredFarmer.map((farmer) => (
                  <Wrapper.TableRow
                    key={farmer._id}
                    sx={{
                      ...(selectedFarmers.includes(farmer._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedFarmers.includes(farmer._id)}
                        onChange={() => handleSelectFarmer(farmer._id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{farmer.name}</Wrapper.TableCell>
                    <Wrapper.TableCell>{farmer.phone}</Wrapper.TableCell>
                    <Wrapper.TableCell>{farmer.nic}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit Farmer">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => handleEditClick(farmer)}
                            sx={{ color: "#FBC02D" }}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete Farmer">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                farmerId: farmer._id,
                              })
                            }
                            sx={{ color: "error.main" }}
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

          {/* Footer with pagination and selected actions */}
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
              {selectedFarmers.length > 0 ? (
                <span>
                  <b>{selectedFarmers.length}</b> farmers selected
                </span>
              ) : (
                <span>Select farmers to perform actions</span>
              )}
            </Wrapper.Typography>

            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
              <Wrapper.Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
              {selectedFarmers.length > 0 && (
                <Wrapper.Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Wrapper.DeleteIcon />}
                  onClick={() =>
                    setMultipleDeleteConfirmation({ isOpen: true })
                  }
                  sx={{ borderRadius: 1 }}
                >
                  Delete Selected
                </Wrapper.Button>
              )}
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.Card>
      )}

      {/* Modals */}
      <ReusableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddFarmer}
        title="Add New Farmer"
        fields={farmerFields}
        submitButtonText="Add Farmer"
      />

      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateFarmer}
        title="Edit Farmer"
        fields={farmerFields}
        initialData={selectedFarmer}
        submitButtonText="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, farmerId: null })}
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
            Are you sure you want to delete this Farmer?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() =>
              setDeleteConfirmation({ isOpen: false, farmerId: null })
            }
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDeleteFarmer}
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
            Are you sure you want to delete {selectedFarmers.length} selected
            farmers?
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

export default Farmer;

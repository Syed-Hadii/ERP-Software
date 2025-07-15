"use client";

import { useState, useEffect } from "react";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";
import Wrapper from "../../utils/wrapper";
import { LocationOn, SquareFoot, Terrain } from "@mui/icons-material";
import Loading from "../../components/Loading";

const landFields = [
  {
    name: "name",
    label: "Land Name",
    placeholder: "Enter land name",
    type: "text",
    icon: <Terrain fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "area",
    label: "Land Area",
    placeholder: "Enter land area",
    type: "text",
    icon: <SquareFoot fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "size",
    label: "Unit",
    placeholder: "Enter unit (e.g., sq. ft, acres)",
    type: "text",
    icon: <SquareFoot fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "location",
    label: "Location",
    placeholder: "Enter location",
    type: "text",
    icon: <LocationOn fontSize="small" color="action" />,
    validation: { required: true },
  },
];

const Land = () => {
  const theme = Wrapper.useTheme();
  const [landRecords, setLandRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState({ key: "name", order: "asc" });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const [selectedLands, setSelectedLands] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    landId: null,
  });
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const recordsPerPage = 7;

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

  // Fetch land records from the API
  const fetchLandRecords = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/land/?page=${currentPage}&limit=${recordsPerPage}&search=${searchQuery}`
      );
      if (response) {
        setLandRecords(response.data?.land);
        setTotalPages(response.data?.totalPages);
      } else {
        showNotification("Failed to fetch data", "error");
      }
    } catch (error) {
      console.error("Error fetching land records:", error);
      showNotification("Failed to fetch land records", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add new land
  const handleAddLand = async (form) => {
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/land/`, form);
      if (response.data.success) {
        fetchLandRecords();
        setAddModalOpen(false);
        showNotification("Land Added Successfully!", "success");
      }
    } catch (error) {
      console.error("Error adding land:", error);
      showNotification("Failed to add land", "error");
    }
  };

  // Delete single land
  const handleDeleteLand = async () => {
    const { landId } = deleteConfirmation;
    if (!landId) return;
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/land/${landId}`);
      showNotification("Land deleted successfully!", "success");
      setDeleteConfirmation({ isOpen: false, landId: null });
      fetchLandRecords();
    } catch (error) {
      console.error("Error deleting land:", error);
      showNotification("Error deleting land", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete multiple lands
  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/land/delete`, {
        data: { ids: selectedLands },
      });
      setSelectedLands([]);
      fetchLandRecords();
      showNotification(
        `${selectedLands.length} lands deleted successfully`,
        "success"
      );
    } catch (err) {
      console.error("Error deleting lands:", err.response?.data || err.message);
      showNotification("Failed to delete selected lands", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
  };

  // Update land
  const handleUpdateLand = async (form) => {
    try {
      const response = await Wrapper.axios.put(`${BASE_URL}/land/`, {
        id: selectedLand._id,
        ...form,
      });
      if (response.data.success) {
        setEditModalOpen(false);
        fetchLandRecords();
        showNotification("Land updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating land:", error);
      showNotification("Failed to update land", "error");
    }
  };

  // Handle edit button click
  const handleEditClick = (land) => {
    setSelectedLand(land);
    setEditModalOpen(true);
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortOrder((prevSortOrder) => ({
      key,
      order:
        prevSortOrder.key === key && prevSortOrder.order === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Handle land selection
  const handleSelectLand = (id) => {
    setSelectedLands((prev) =>
      prev.includes(id) ? prev.filter((landId) => landId !== id) : [...prev, id]
    );
  };

  // Handle select all lands
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLands(filteredLand.map((land) => land._id));
    } else {
      setSelectedLands([]);
    }
  };

  // Filter and sort land records
  const filteredLand = landRecords
    .filter((land) =>
      land.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder.key) {
        if (sortOrder.order === "asc") {
          return a[sortOrder.key] > b[sortOrder.key] ? 1 : -1;
        } else {
          return a[sortOrder.key] < b[sortOrder.key] ? 1 : -1;
        }
      }
      return 0;
    });

  // Fetch records on page or search change
  useEffect(() => {
    fetchLandRecords();
  }, [currentPage, searchQuery]);

  if (loading && landRecords.length === 0) {
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
              transition: "transform 0.2s, box-shadow 0.3s",
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
            Land Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your land records and details
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
            placeholder="Search lands..."
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
            Add Land
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() => {
              if (selectedLands.length > 0) {
                setMultipleDeleteConfirmation({ isOpen: true });
              } else {
                showNotification("No lands selected", "warning");
              }
            }}
            disabled={selectedLands.length === 0}
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
              Total Lands
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {landRecords.length}
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
              {selectedLands.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {/* Lands Table */}
      {landRecords.length === 0 ? (
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
          <Wrapper.TerrainIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Wrapper.Typography variant="h5" gutterBottom>
            No land records found
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Add your first land record to get started
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Land
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
              {filteredLand.length}{" "}
              {filteredLand.length === 1 ? "Land" : "Lands"}{" "}
              {searchQuery && `matching "${searchQuery}"`}
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
                        selectedLands.length > 0 &&
                        selectedLands.length < filteredLand.length
                      }
                      checked={
                        filteredLand.length > 0 &&
                        selectedLands.length === filteredLand.length
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
                      Land Name
                      {sortOrder.key === "name" &&
                        (sortOrder.order === "asc" ? (
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
                    onClick={() => handleSort("area")}
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
                      Land Area
                      {sortOrder.key === "area" &&
                        (sortOrder.order === "asc" ? (
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
                    Unit
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Location
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredLand.map((land) => (
                  <Wrapper.TableRow
                    key={land._id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.04
                        ),
                      },
                      ...(selectedLands.includes(land._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedLands.includes(land._id)}
                        onChange={() => handleSelectLand(land._id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Typography variant="body1" fontWeight="medium">
                        {land.name}
                      </Wrapper.Typography>
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{land.area}</Wrapper.TableCell>
                    <Wrapper.TableCell>{land.size}</Wrapper.TableCell>
                    <Wrapper.TableCell>{land.location}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit land">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => handleEditClick(land)}
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
                        <Wrapper.Tooltip title="Delete land">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                landId: land._id,
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

          {filteredLand.length === 0 && (
            <Wrapper.Box sx={{ p: 4, textAlign: "center" }}>
              <Wrapper.Typography variant="body1" color="text.secondary">
                No lands match your search criteria
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
              {selectedLands.length > 0 ? (
                <span>
                  <b>{selectedLands.length}</b> lands selected
                </span>
              ) : (
                <span>Select lands to perform actions</span>
              )}
            </Wrapper.Typography>

            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
              {totalPages > 1 && (
                <>
                  <Wrapper.Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    sx={{ borderRadius: 1 }}
                  >
                    Previous
                  </Wrapper.Button>
                  <Wrapper.Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    sx={{ borderRadius: 1 }}
                  >
                    Next
                  </Wrapper.Button>
                </>
              )}
              {selectedLands.length > 0 && (
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
        onSubmit={handleAddLand}
        title="Add New Land"
        fields={landFields}
        submitButtonText="Add Land"
      />

      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateLand}
        title="Edit Land"
        fields={landFields}
        initialData={selectedLand}
        submitButtonText="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, landId: null })}
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
            Are you sure you want to delete this land?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() =>
              setDeleteConfirmation({ isOpen: false, landId: null })
            }
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDeleteLand}
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
            Are you sure you want to delete {selectedLands.length} selected
            lands?
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

export default Land;

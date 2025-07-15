"use client";

import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";

const cropFields = [
  {
    name: "name",
    label: "Crop Name",
    placeholder: "Enter crop name",
    type: "text",
    icon: <Wrapper.GrassIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
];

const Crop_Variety = () => {
  const theme = Wrapper.useTheme();
  const [cropList, setCropList] = useState([]);
  const [cropVarietyList, setCropVarietyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [addCropModalOpen, setAddCropModalOpen] = useState(false);
  const [addVarietyModalOpen, setAddVarietyModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [expandedCrops, setExpandedCrops] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    cropId: null,
    isVariety: false,
  });

  // Fetch crop and variety records from the API
  const fetchCrop = async () => {
    setLoading(true);
    try {
      const [cropResponse, varietyResponse] = await Promise.all([
        Wrapper.axios.get(`${BASE_URL}/crop/getcrop`),
        Wrapper.axios.get(`${BASE_URL}/crop/getVariety`),
      ]);

      setCropList(cropResponse.data.crop);
      setCropVarietyList(varietyResponse.data.crop || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      Wrapper.toast.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  // Add new crop
  const handleAddCrop = async (form) => {
    try {
      const response = await Wrapper.axios.post(
        `${BASE_URL}/crop/addcrop`,
        form
      );
      if (response.data.success) {
        Wrapper.toast.success("Crop Added Successfully!");
        setAddCropModalOpen(false);
        fetchCrop();
      }
    } catch (error) {
      console.error("Error adding Crop:", error);
      Wrapper.toast.error("Failed to add Crop");
    }
  };

  // Add new crop variety
  const handleAddVariety = async (form) => {
    try {
      const response = await Wrapper.axios.post(
        `${BASE_URL}/crop/addcrop_variety`,
        form
      );
      if (response.data.success) {
        Wrapper.toast.success("Crop Variety Added Successfully!");
        setAddVarietyModalOpen(false);
        fetchCrop();
      }
    } catch (error) {
      console.error("Error adding Crop Variety:", error);
      Wrapper.toast.error("Failed to add Crop Variety");
    }
  };

  // Update crop
  const handleUpdateCrop = async (form) => {
    try {
      const response = await Wrapper.axios.put(`${BASE_URL}/crop/updatecrop`, {
        id: selectedCrop._id,
        ...form,
      });
      if (response.data.success) {
        Wrapper.toast.success("Crop updated successfully");
        setEditModalOpen(false);
        fetchCrop();
      }
    } catch (error) {
      console.error("Error updating Crop:", error);
      Wrapper.toast.error("Failed to update Crop");
    }
  };

  // Delete crop or variety
  const handleDelete = async () => {
    setLoading(true);
    try {
      let response;

      if (deleteConfirmation.isVariety) {
        response = await Wrapper.axios.delete(
          `${BASE_URL}/crop/deletecrop_variety`,
          {
            data: { id: deleteConfirmation.cropId },
          }
        );
      } else {
        response = await Wrapper.axios.delete(`${BASE_URL}/crop/deletecrop`, {
          data: { id: deleteConfirmation.cropId },
        });
      }

      if (response.data.success) {
        Wrapper.toast.success(
          `${
            deleteConfirmation.isVariety ? "Variety" : "Crop"
          } deleted successfully!`
        );
        setDeleteConfirmation({
          isOpen: false,
          cropId: null,
          isVariety: false,
        });
        fetchCrop();
      } else {
        Wrapper.toast.error(
          `Error deleting ${deleteConfirmation.isVariety ? "Variety" : "Crop"}`
        );
      }
    } catch (error) {
      console.error("Error deleting:", error);
      Wrapper.toast.error("Error deleting");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEditClick = (crop) => {
    setSelectedCrop(crop);
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

  // Toggle crop expansion to show varieties
  const toggleCropExpansion = (cropId) => {
    setExpandedCrops((prev) => ({
      ...prev,
      [cropId]: !prev[cropId],
    }));
  };

  // Get varieties for a specific crop
  const getVarietiesForCrop = (cropId) => {
    return cropVarietyList.filter((variety) => variety.crop === cropId);
  };

  // Filter and sort crop records
  const filteredCrop = cropList
    .filter((crop) =>
      crop.name?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // Fetch records on mount
  useEffect(() => {
    fetchCrop();
  }, []);

  // Define crop_Variety_Fields with cropList options
  const crop_Variety_Fields = [
    {
      name: "cropId",
      label: "Crop",
      placeholder: "Select crop",
      type: "select",
      options: cropList.map((crop) => ({ value: crop._id, label: crop.name })),
      icon: <Wrapper.GrassIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "variety",
      label: "Variety",
      placeholder: "Enter variety",
      type: "text",
      icon: <Wrapper.SpaIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
  ];

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
            Crop Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your crops and varieties
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
            placeholder="Search Crop..."
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
            onClick={() => setAddCropModalOpen(true)}
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
            Add New Crop
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddVarietyModalOpen(true)}
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
            Add New Crop Variety
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      {/* Crop Table */}
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
            "&:hover": { boxShadow: 6 },
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
              {filteredCrop.length} Crop(s) with {cropVarietyList.length}{" "}
              Varieties
            </Wrapper.Typography>
            <Wrapper.Tooltip title="Filter list">
              <Wrapper.IconButton size="small">
                <Wrapper.FilterListIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
          </Wrapper.Box>

          <Wrapper.TableContainer
            sx={{ maxHeight: "calc(100vh - 350px)", minHeight: "300px" }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell width="5%" />
                  <Wrapper.TableCell
                    onClick={() => handleSort("name")}
                    sx={{ cursor: "pointer", fontWeight: "bold", width: "65%" }}
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
                  <Wrapper.TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredCrop.map((crop) => (
                  <React.Fragment key={crop._id}>
                    <Wrapper.TableRow
                      sx={{
                        backgroundColor: Wrapper.alpha(
                          theme.palette.success.light,
                          0.1
                        ),
                        "&:hover": {
                          backgroundColor: Wrapper.alpha(
                            theme.palette.success.light,
                            0.2
                          ),
                        },
                      }}
                    >
                      <Wrapper.TableCell>
                        <Wrapper.IconButton
                          size="small"
                          onClick={() => toggleCropExpansion(crop._id)}
                        >
                          {expandedCrops[crop._id] ? (
                            <Wrapper.KeyboardArrowDownIcon />
                          ) : (
                            <Wrapper.KeyboardArrowRightIcon />
                          )}
                        </Wrapper.IconButton>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Box
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Wrapper.GrassIcon
                            fontSize="small"
                            sx={{ color: "success.main", mr: 1 }}
                          />
                          <Wrapper.Typography
                            variant="body1"
                            fontWeight="medium"
                          >
                            {crop.name}
                          </Wrapper.Typography>
                        </Wrapper.Box>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                          <Wrapper.Tooltip title="Edit Crop">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => handleEditClick(crop)}
                              sx={{ color: "#FBC02D" }}
                            >
                              <Wrapper.EditIcon fontSize="small" />
                            </Wrapper.IconButton>
                          </Wrapper.Tooltip>
                          <Wrapper.Tooltip title="Delete Crop">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() =>
                                setDeleteConfirmation({
                                  isOpen: true,
                                  cropId: crop._id,
                                  isVariety: false,
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

                    {expandedCrops[crop._id] &&
                      getVarietiesForCrop(crop._id).map((variety) => (
                        <Wrapper.TableRow
                          key={variety._id}
                          sx={{
                            backgroundColor: Wrapper.alpha(
                              theme.palette.grey[100],
                              0.5
                            ),
                            "&:hover": {
                              backgroundColor: Wrapper.alpha(
                                theme.palette.grey[200],
                                0.5
                              ),
                            },
                          }}
                        >
                          <Wrapper.TableCell />
                          <Wrapper.TableCell>
                            <Wrapper.Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                pl: 4,
                              }}
                            >
                              <Wrapper.SpaIcon
                                fontSize="small"
                                sx={{ color: "info.main", mr: 1 }}
                              />
                              <Wrapper.Typography variant="body2">
                                {variety.variety}
                              </Wrapper.Typography>
                            </Wrapper.Box>
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                              <Wrapper.Tooltip title="Delete Variety">
                                <Wrapper.IconButton
                                  size="small"
                                  onClick={() =>
                                    setDeleteConfirmation({
                                      isOpen: true,
                                      cropId: variety._id,
                                      isVariety: true,
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

                    {expandedCrops[crop._id] &&
                      getVarietiesForCrop(crop._id).length === 0 && (
                        <Wrapper.TableRow
                          sx={{
                            backgroundColor: Wrapper.alpha(
                              theme.palette.grey[100],
                              0.3
                            ),
                          }}
                        >
                          <Wrapper.TableCell />
                          <Wrapper.TableCell colSpan={2}>
                            <Wrapper.Typography
                              variant="body2"
                              sx={{
                                fontStyle: "italic",
                                pl: 4,
                                color: "text.secondary",
                              }}
                            >
                              No varieties found for this crop
                            </Wrapper.Typography>
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                      )}
                  </React.Fragment>
                ))}

                {filteredCrop.length === 0 && (
                  <Wrapper.TableRow>
                    <Wrapper.TableCell colSpan={3} align="center">
                      <Wrapper.Box sx={{ py: 3 }}>
                        <Wrapper.Typography
                          variant="body1"
                          color="text.secondary"
                        >
                          No crops found
                        </Wrapper.Typography>
                      </Wrapper.Box>
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                )}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
        </Wrapper.Card>
      )}

      {/* Modals */}
      <ReusableModal
        open={addCropModalOpen}
        onClose={() => setAddCropModalOpen(false)}
        onSubmit={handleAddCrop}
        title="Add New Crop"
        fields={cropFields}
        submitButtonText="Add Crop"
      />
      <ReusableModal
        open={addVarietyModalOpen}
        onClose={() => setAddVarietyModalOpen(false)}
        onSubmit={handleAddVariety}
        title="Add New Crop Variety"
        fields={crop_Variety_Fields}
        submitButtonText="Add Crop Variety"
      />
      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateCrop}
        title="Edit Crop"
        fields={cropFields}
        initialData={selectedCrop}
        submitButtonText="Save Changes"
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({
            isOpen: false,
            cropId: null,
            isVariety: false,
          })
        }
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
            Are you sure you want to delete this{" "}
            {deleteConfirmation.isVariety ? "Crop Variety" : "Crop"}?
            {!deleteConfirmation.isVariety && (
              <Wrapper.Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Note: Deleting a crop will also delete all its varieties!
              </Wrapper.Typography>
            )}
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() =>
              setDeleteConfirmation({
                isOpen: false,
                cropId: null,
                isVariety: false,
              })
            }
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
    </Wrapper.Box>
  );
};

export default Crop_Variety;

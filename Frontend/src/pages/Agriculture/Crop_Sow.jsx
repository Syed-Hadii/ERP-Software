import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";
import CropCard from "../../components/crop-card";
import { motion } from "framer-motion";

// Utility function to safely access nested properties
const safeGet = (obj, path, defaultValue = "N/A") => {
  if (!obj || !path) return defaultValue;
  try {
    const value = path.split(".").reduce((o, k) => o?.[k], obj);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

// Utility function to safely format dates
const safeFormatDate = (date, defaultValue = "") => {
  if (!date) return defaultValue;
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return defaultValue;
    return parsedDate.toISOString().split("T")[0];
  } catch {
    return defaultValue;
  }
};

const cropSowFields = [
  {
    name: "farmer",
    label: "Farmer",
    placeholder: "Select farmer",
    type: "select",
    options: [],
    icon: <Wrapper.PersonIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "land",
    label: "Land",
    placeholder: "Select land",
    type: "select",
    options: [],
    icon: <Wrapper.LandscapeIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "crop",
    label: "Crop",
    placeholder: "Select crop",
    type: "select",
    options: [],
    icon: <Wrapper.GrassIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "variety",
    label: "Variety",
    placeholder: "Select variety",
    type: "select",
    options: [],
    icon: <Wrapper.SpaIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "seed",
    label: "Seed",
    placeholder: "Select seed",
    type: "select",
    options: [],
    icon: <Wrapper.SpaIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "quantity",
    label: "Seed Quantity (kg)",
    placeholder: "Enter quantity",
    type: "number",
    icon: <Wrapper.NumbersIcon fontSize="small" color="action" />,
    validation: { required: true, min: 0.01 },
  },
  {
    name: "seedSowingDate",
    label: "Sowing Date",
    placeholder: "Select sowing date",
    type: "date",
    icon: <Wrapper.EventIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "expectedHarvestDate",
    label: "Expected Harvest Date",
    placeholder: "Select harvest date",
    type: "date",
    icon: <Wrapper.EventIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "cropStatus",
    label: "Status",
    placeholder: "Select status",
    type: "select",
    options: [
      { value: "Planned", label: "Planned" },
      { value: "Active", label: "Active" },
      { value: "Harvested", label: "Harvested" },
    ],
    icon: <Wrapper.InfoIcon fontSize="small" color="action" />,
  },
  {
    name: "yieldEstimate",
    label: "Yield Estimate",
    placeholder: "Enter yield estimate",
    type: "text",
    icon: <Wrapper.AssessmentIcon fontSize="small" color="action" />,
  },
  {
    name: "notes",
    label: "Notes",
    placeholder: "Enter notes",
    type: "textarea",
    icon: <Wrapper.NoteIcon fontSize="small" color="action" />,
  },
];

const CropSow = () => {
  const theme = Wrapper.useTheme();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [lands, setLands] = useState([]);
  const [crops, setCrops] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [allVarieties, setAllVarieties] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    assignmentId: null,
  });

  // Fetch all dependent data
  const fetchDependencies = async () => {
    try {
      const [farmersRes, landsRes, cropsRes, varietiesRes, seedsRes] =
        await Promise.all([
          Wrapper.axios.get(`${BASE_URL}/farmer/getfarmer?all=true`),
          Wrapper.axios.get(`${BASE_URL}/land/?all=true`),
          Wrapper.axios.get(`${BASE_URL}/crop/getcrop`),
          Wrapper.axios.get(`${BASE_URL}/crop/getVariety`),
          Wrapper.axios.get(`${BASE_URL}/inventory/agriculture?all=true`),
        ]);

      setFarmers(farmersRes?.data?.farmer || []);
      setLands(landsRes?.data?.land || []);
      setCrops(cropsRes?.data?.crop || []);
      setAllVarieties(varietiesRes?.data?.crop || []);
      setSeeds(seedsRes?.data?.inventoryList || []);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      Wrapper.toast.error("Failed to load dropdown data");
      setFarmers([]);
      setLands([]);
      setCrops([]);
      setAllVarieties([]);
      setSeeds([]);
    }
  };

  // Filter varieties when crop is selected
  const filterVarieties = (cropId) => {
    if (!cropId || !Array.isArray(allVarieties)) {
      setVarieties([]);
      return;
    }
    const filteredVarieties = allVarieties.filter(
      (variety) =>
        safeGet(variety, "cropId", null) === cropId ||
        safeGet(variety, "crop", null) === cropId
    );
    setVarieties(filteredVarieties);
  };

  // Main data fetch
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await Wrapper.axios.get(
        `${BASE_URL}/cropSow/?page=${currentPage}&limit=9`
      );
      setAssignments(res?.data?.cropList || []);
      setTotalPages(res?.data?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      Wrapper.toast.error("Error loading crop assignments");
      setAssignments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Validate dates and quantity
  const validateForm = (form) => {
    if (
      form.expectedHarvestDate &&
      form.seedSowingDate &&
      new Date(form.expectedHarvestDate) <= new Date(form.seedSowingDate)
    ) {
      Wrapper.toast.warning("Harvest date must be after sowing date");
      return false;
    }
    if (Number(form.quantity) <= 0) {
      Wrapper.toast.warning("Seed quantity must be greater than 0");
      return false;
    }
    const seedInventory = seeds.find(
      (s) => safeGet(s, "item._id", null) === form.seed
    );
    if (
      !seedInventory ||
      Number(safeGet(seedInventory, "quantity", 0)) < Number(form.quantity)
    ) {
      Wrapper.toast.warning(
        `Insufficient seed quantity. Available: ${
          seedInventory ? safeGet(seedInventory, "quantity", 0) : 0
        } kg`
      );
      return false;
    }
    return true;
  };

  // Handle add assignment
  const handleAddAssignment = async (form) => {
    if (!validateForm(form)) return;
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/cropSow`, {
        ...form,
        quantity: Number(form.quantity),
      });
      if (response?.data?.success) {
        Wrapper.toast.success("Assignment added successfully!");
        setAddModalOpen(false);
        fetchAssignments();
      } else {
        Wrapper.toast.error(
          safeGet(response, "data.message", "Operation failed")
        );
      }
    } catch (error) {
      console.error("Error adding assignment:", error);
      const msg = safeGet(error, "response.data.message", "Operation failed");
      Wrapper.toast.error(msg);
    }
  };

  // Handle update assignment
  const handleUpdateAssignment = async (form) => {
    if (!validateForm(form)) return;
    try {
      await Wrapper.axios.put(
        `${BASE_URL}/cropSow/${safeGet(selectedAssignment, "_id", "")}`,
        {
          ...form,
          quantity: Number(form.quantity),
        }
      );
      Wrapper.toast.success("Assignment updated successfully!");
      setEditModalOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error updating assignment:", error);
      const msg = safeGet(error, "response.data.message", "Operation failed");
      Wrapper.toast.error(msg);
    }
  };

  // Handle delete
  const handleDeleteAssignment = async () => {
    const assignmentId = safeGet(deleteConfirmation, "assignmentId", null);
    if (!assignmentId) {
      Wrapper.toast.error("Invalid assignment ID");
      setDeleteConfirmation({ isOpen: false, assignmentId: null });
      return;
    }
    try {
      await Wrapper.axios.delete(`${BASE_URL}/cropSow/${assignmentId}`);
      Wrapper.toast.success("Deleted successfully!");
      setDeleteConfirmation({ isOpen: false, assignmentId: null });
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting:", error);
      Wrapper.toast.error("Delete failed");
    }
  };

  // Handle edit click
  const handleEditClick = (assignment) => {
    const cropId = safeGet(assignment.crop, "_id", null);
    if (cropId) {
      filterVarieties(cropId);
    }
    setSelectedAssignment({
      ...assignment,
      crop: safeGet(assignment.crop, "_id", ""),
      variety: safeGet(assignment.variety, "_id", ""),
      farmer: safeGet(assignment.farmer, "_id", ""),
      land: safeGet(assignment.land, "_id", ""),
      seed: safeGet(assignment.seed, "_id", ""),
      quantity: safeGet(assignment, "quantity", ""),
      seedSowingDate: safeFormatDate(assignment.seedSowingDate),
      expectedHarvestDate: safeFormatDate(assignment.expectedHarvestDate),
    });
    setEditModalOpen(true);
  };

  // Handle view details
  const handleViewDetails = (assignment) => {
    const assignmentId = safeGet(assignment, "_id", null);
    if (!assignmentId) {
      Wrapper.toast.error("Invalid assignment ID");
      return;
    }
    navigate(`/crop-details/${assignmentId}`);
  };

  // Handle field change
  const handleFieldChange = (name, value, setForm) => {
    if (name === "crop") {
      filterVarieties(value);
    }
    // Removed setForm call to avoid overwriting ReusableModal's form state
  };

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    const query = String(searchQuery || "").toLowerCase();
    return (assignments || []).filter(
      (row) =>
        safeGet(row.farmer, "name", "Unknown Farmer")
          .toLowerCase()
          .includes(query) ||
        safeGet(row.land, "name", "Unknown Land")
          .toLowerCase()
          .includes(query) ||
        safeGet(row.crop, "name", "Unknown Crop")
          .toLowerCase()
          .includes(query) ||
        safeGet(
          row.variety,
          "variety",
          safeGet(row.variety, "name", "Unknown Variety")
        )
          .toLowerCase()
          .includes(query) ||
        safeGet(row.seed, "name", "Unknown Seed").toLowerCase().includes(query)
    );
  }, [assignments, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchDependencies();
    fetchAssignments();
  }, [currentPage]);

  // Log allVarieties when updated
  useEffect(() => {
    console.log("All varieties updated:", allVarieties);
  }, [allVarieties]);

  // Dynamic modal fields
  const dynamicFields = useMemo(
    () =>
      cropSowFields.map((field) => {
        if (field.name === "farmer") {
          return {
            ...field,
            options: Array.isArray(farmers)
              ? farmers.map((f) => ({
                  value: safeGet(f, "_id", ""),
                  label: safeGet(f, "name", "Unknown Farmer"),
                }))
              : [{ value: "", label: "No farmers available" }],
          };
        }
        if (field.name === "land") {
          return {
            ...field,
            options: Array.isArray(lands)
              ? lands.map((l) => ({
                  value: safeGet(l, "_id", ""),
                  label: safeGet(l, "name", "Unknown Land"),
                  disabled: safeGet(l, "isAssigned", false),
                }))
              : [{ value: "", label: "No lands available" }],
          };
        }
        if (field.name === "crop") {
          return {
            ...field,
            options: Array.isArray(crops)
              ? crops.map((c) => ({
                  value: safeGet(c, "_id", ""),
                  label: safeGet(c, "name", "Unknown Crop"),
                }))
              : [{ value: "", label: "No crops available" }],
          };
        }
        if (field.name === "variety") {
          return {
            ...field,
            options: Array.isArray(varieties)
              ? varieties.map((v) => ({
                  value: safeGet(v, "_id", ""),
                  label: safeGet(
                    v,
                    "variety",
                    safeGet(v, "name", "Unknown Variety")
                  ),
                }))
              : [{ value: "", label: "No varieties available" }],
          };
        }
        if (field.name === "seed") {
          return {
            ...field,
            options: Array.isArray(seeds)
              ? seeds.map((s) => ({
                  value: safeGet(s, "item._id", ""),
                  label: `${safeGet(
                    s,
                    "item.name",
                    "Unknown Seed"
                  )} (Available: ${safeGet(s, "quantity", 0)} kg)`,
                }))
              : [{ value: "", label: "No seeds available" }],
          };
        }
        return field;
      }),
    [farmers, lands, crops, varieties, seeds]
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

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
            Crop Assignments
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your crop sowing assignments
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
            placeholder="Search Assignments..."
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
            Add Assignment
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      {/* Assignments Cards */}
      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Wrapper.Grid item xs={12} sm={6} md={4} key={item}>
                <Wrapper.Skeleton
                  variant="rounded"
                  height={200}
                  sx={{ borderRadius: 2 }}
                />
              </Wrapper.Grid>
            ))}
          </Wrapper.Grid>
        </Wrapper.Box>
      ) : (
        <>
          <Wrapper.Box
            sx={{
              p: 2,
              mb: 3,
              bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: 1,
            }}
          >
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              {filteredAssignments.length} Assignment(s)
            </Wrapper.Typography>
            <Wrapper.Tooltip title="Filter list">
              <Wrapper.IconButton size="small">
                <Wrapper.FilterListIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
          </Wrapper.Box>

          {filteredAssignments.length === 0 ? (
            <Wrapper.Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Wrapper.SpaIcon
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Wrapper.Typography variant="h6" color="text.secondary">
                No crop assignments found
              </Wrapper.Typography>
              <Wrapper.Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Try adjusting your search or add a new assignment
              </Wrapper.Typography>
              <Wrapper.Button
                variant="contained"
                startIcon={<Wrapper.AddIcon />}
                onClick={() => setAddModalOpen(true)}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  px: 3,
                  bgcolor: "#348d39",
                  "&:hover": {
                    bgcolor: "#2e7d32",
                  },
                }}
              >
                Add Assignment
              </Wrapper.Button>
            </Wrapper.Box>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Wrapper.Grid container spacing={3}>
                {filteredAssignments.map((assignment) => (
                  <Wrapper.Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={safeGet(assignment, "_id", "unknown")}
                  >
                    <CropCard
                      assignment={{
                        ...assignment,
                        seed: {
                          name: safeGet(
                            assignment.seed,
                            "name",
                            "Unknown Seed"
                          ),
                        },
                        quantity: Number(safeGet(assignment, "quantity", 0)),
                      }}
                      onEdit={() => handleEditClick(assignment)}
                      onDelete={() =>
                        setDeleteConfirmation({
                          isOpen: true,
                          assignmentId: safeGet(assignment, "_id", null),
                        })
                      }
                      onClick={() => handleViewDetails(assignment)}
                    />
                  </Wrapper.Grid>
                ))}
              </Wrapper.Grid>
            </motion.div>
          )}

          {/* Pagination */}
          <Wrapper.Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 4,
              p: 2,
            }}
          >
            <Wrapper.Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
              size="large"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: 1,
                },
              }}
            />
          </Wrapper.Box>
        </>
      )}

      {/* Modals */}
      <ReusableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddAssignment}
        title="Add New Crop Assignment"
        fields={dynamicFields}
        submitButtonText="Add Assignment"
        onFieldChange={handleFieldChange}
      />
      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateAssignment}
        title="Edit Crop Assignment"
        fields={dynamicFields}
        initialData={selectedAssignment}
        submitButtonText="Save Changes"
        onFieldChange={handleFieldChange}
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, assignmentId: null })
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
            Are you sure you want to delete this crop assignment?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() =>
              setDeleteConfirmation({ isOpen: false, assignmentId: null })
            }
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDeleteAssignment}
            sx={{ borderRadius: 1 }}
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
    </Wrapper.Box>
  );
};

export default CropSow;

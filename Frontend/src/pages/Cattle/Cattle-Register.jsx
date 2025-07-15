import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";

const breedOptionsMap = {
  buffalo: [
    { value: "murrah", label: "Murrah" },
    { value: "nili-ravi", label: "Nili-Ravi" },
    { value: "jafarabadi", label: "Jafarabadi" },
  ],
  cow: [
    { value: "cholistani", label: "Cholistani" },
    { value: "sahiwal", label: "Sahiwal" },
    { value: "brahman", label: "Brahman" },
  ],
  goat: [
    { value: "kamori", label: "Kamori" },
    { value: "barbari", label: "Barbari" },
    { value: "beetal", label: "Beetal" },
  ],
  sheep: [
    { value: "baluchi", label: "Baluchi" },
    { value: "cholistani", label: "Cholistani" },
    { value: "dumbi", label: "Dumbi" },
  ],
};

const CattleRegister = () => {
  const theme = Wrapper.useTheme();
  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "type",
    direction: "asc",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [selectedCattleList, setSelectedCattleList] = useState([]);
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
  const recordsPerPage = 3;

  // Base fields definition
  const fieldsBase = [
    {
      name: "type",
      label: "Animal Type",
      type: "select",
      options: [
        { value: "buffalo", label: "Buffalo" },
        { value: "cow", label: "Cow" },
        { value: "goat", label: "Goat" },
        { value: "sheep", label: "Sheep" },
      ],
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "cattleId",
      label: "Animal ID",
      type: "text",
      icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
      validation: { required: false },
    },
    {
      name: "breed",
      label: "Breed Type",
      type: "select",
      options: [],
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ],
      icon: <Wrapper.WcIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "dob",
      label: "Date of Birth",
      type: "date",
      icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "source",
      label: "Source",
      type: "select",
      options: [
        { value: "own farm", label: "Own Farm" },
        { value: "purchased", label: "Purchased" },
        { value: "gifted", label: "Gifted" },
      ],
      icon: <Wrapper.LocalHospitalIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "purchaseDate",
      label: "Purchase Date",
      type: "date",
      icon: <Wrapper.DateRangeIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "purchaseCost",
      label: "Purchase Cost",
      type: "number",
      icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "weightAtArrival",
      label: "Weight At Arrival (kg)",
      type: "number",
      icon: <Wrapper.FitnessCenterIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "healthStatus",
      label: "Health Status",
      type: "select",
      options: [
        { value: "good", label: "Good" },
        { value: "fair", label: "Fair" },
        { value: "critical", label: "Critical" },
      ],
      icon: <Wrapper.HealthAndSafetyIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      icon: <Wrapper.ToggleOnIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
      validation: { required: false },
    },
  ];

  const [formFields, setFormFields] = useState(fieldsBase);
  const [formData, setFormData] = useState(
    fieldsBase.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );

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

  // fetch
  const fetchCattle = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: recordsPerPage,
        sortBy: sortConfig.key,
        ...(searchQuery && { breed: searchQuery }),
      });

      const { data } = await Wrapper.axios.get(
        `${BASE_URL}/cattle/all?${queryParams}`
      );
      console.log("Cattle Data:", data);
      if (data.success) {
        setCattleList(data.cattle);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      showNotification(error.message || "Failed to fetch cattle", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattle();
  }, [currentPage, searchQuery]);

  // update breed when type changes
  useEffect(() => {
    setFormFields((fs) =>
      fs.map((f) =>
        f.name === "breed"
          ? { ...f, options: breedOptionsMap[formData.type] || [] }
          : f
      )
    );
  }, [formData.type]);

  // fields shown in modal (hide purchase fields unless purchased)
  const modalFields = formFields.filter((f) =>
    ["purchaseDate", "purchaseCost"].includes(f.name)
      ? formData.source === "purchased"
      : true
  );

  // parent-side handler for field changes
  const handleFieldChange = (name, value) => {
    setFormData((d) => {
      if (name === "type") return { ...d, type: value, breed: "" };
      if (name === "source")
        return { ...d, source: value, purchaseDate: "", purchaseCost: "" };
      return { ...d, [name]: value };
    });
  };

  // Sorting handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedCattle) {
        const response = await Wrapper.axios.put(
          `${BASE_URL}/cattle/${selectedCattle._id}`,
          data
        );
        if (response.data.success) {
          showNotification("Updated successfully", "success");
        }
      } else {
        const response = await Wrapper.axios.post(
          `${BASE_URL}/cattle/register`,
          data
        );
        if (response.data.success) {
          showNotification("Added successfully", "success");
        }
      }
      setAddModalOpen(false);
      setEditModalOpen(false);
      fetchCattle();
    } catch {
      showNotification("Save failed", "error");
    }
  };

  const openAdd = () => {
    setSelectedCattle(null);
    setFormData(fieldsBase.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {}));
    setAddModalOpen(true);
  };

  const openEdit = (item) => {
    setSelectedCattle(item);
    setFormData(item);
    setEditModalOpen(true);
  };

  // Delete single cattle
  const handleDelete = async () => {
    try {
      await Wrapper.axios.delete(`${BASE_URL}/cattle/${deleteConfirmation.id}`);
      showNotification("Deleted successfully", "success");
      setDeleteConfirmation({ isOpen: false, id: null });
      fetchCattle();
    } catch {
      showNotification("Delete failed", "error");
    }
  };
  // Delete multiple cattle
  const handleConfirmMultipleDelete = async () => {
    try {
      console.log("Selected Cattle List:", selectedCattleList);
      if (!selectedCattleList.length) {
        showNotification("No cattle selected for deletion", "error");
        return;
      }

      const response = await Wrapper.axios.delete(
        `${BASE_URL}/cattle/delete-multiple`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          data: { ids: selectedCattleList },
        }
      );

      if (response.data.success) {
        showNotification(
          `${response.data.modifiedCount} cattle marked as inactive`,
          "success"
        );
        setSelectedCattleList([]);
        fetchCattle();
      } else {
        showNotification(response.data.message || "Delete failed", "error");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to delete selected cattle",
        "error"
      );
      console.error("Delete error:", error);
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
    }
  };

  // Handle cattle selection
  const handleSelectCattle = (id) => {
    setSelectedCattleList((prev) =>
      prev.includes(id)
        ? prev.filter((cattleId) => cattleId !== id)
        : [...prev, id]
    );
  };

  // Handle select all cattle
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCattleList(displayed.map((cattle) => cattle._id));
    } else {
      setSelectedCattleList([]);
    }
  };

  // filtered & sorted list
  const displayed = cattleList
    .filter((c) => c.type.toLowerCase().includes(searchQuery))
    .sort((a, b) => {
      if (sortConfig.key) {
        return sortConfig.direction === "asc"
          ? a[sortConfig.key] > b[sortConfig.key]
            ? 1
            : -1
          : a[sortConfig.key] < b[sortConfig.key]
          ? 1
          : -1;
      }
      return 0;
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
            Cattle Register
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your cattle records here
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
            placeholder="Search Animal..."
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
            Add Animal
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() => {
              if (selectedCattleList.length > 0) {
                setMultipleDeleteConfirmation({ isOpen: true });
              } else {
                showNotification("No cattle selected", "warning");
              }
            }}
            disabled={selectedCattleList.length === 0}
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
              Total Cattle
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {cattleList.length}
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
              {selectedCattleList.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {/* Table */}
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
              {displayed.length} Records
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
                  <Wrapper.TableCell padding="checkbox">
                    <Wrapper.Checkbox
                      indeterminate={
                        selectedCattleList.length > 0 &&
                        selectedCattleList.length < displayed.length
                      }
                      checked={
                        displayed.length > 0 &&
                        selectedCattleList.length === displayed.length
                      }
                      onChange={handleSelectAll}
                      sx={{
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  </Wrapper.TableCell>
                  {[
                    "Type",
                    "Breed",
                    "Cattle ID",
                    "Gender",
                    "DOB",
                    "Age",
                    "Weight",
                    "Health",
                    "Status",
                    "Actions",
                  ].map((head) => (
                    <Wrapper.TableCell
                      key={head}
                      onClick={() => handleSort(head.toLowerCase())}
                      sx={{ cursor: "pointer", fontWeight: "bold" }}
                    >
                      {head}
                    </Wrapper.TableCell>
                  ))}
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {displayed.map((item) => (
                  <Wrapper.TableRow
                    key={item._id}
                    sx={{
                      ...(selectedCattleList.includes(item._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedCattleList.includes(item._id)}
                        onChange={() => handleSelectCattle(item._id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{item.type}</Wrapper.TableCell>
                    <Wrapper.TableCell>{item.breed}</Wrapper.TableCell>
                    <Wrapper.TableCell>{item.cattleId}</Wrapper.TableCell>
                    <Wrapper.TableCell>{item.gender}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {new Date(item.dob).toLocaleDateString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{item.age}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {item.weightAtArrival}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{item.healthStatus}</Wrapper.TableCell>
                    <Wrapper.TableCell>{item.status}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit Animal">
                          <Wrapper.IconButton
                            size="small"
                            sx={{ color: "#FBC02D" }}
                            onClick={() => openEdit(item)}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete Animal">
                          <Wrapper.IconButton
                            size="small"
                            sx={{ color: "error.main" }}
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                id: item._id,
                              })
                            }
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
              {selectedCattleList.length > 0 ? (
                <span>
                  <b>{selectedCattleList.length}</b> cattle selected
                </span>
              ) : (
                <span>Select cattle to perform actions</span>
              )}
            </Wrapper.Typography>

            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
              <Wrapper.Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, v) => setCurrentPage(v)}
                color="primary"
              />
              {selectedCattleList.length > 0 && (
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
        onSubmit={handleSubmit}
        title="Add New Animal"
        fields={modalFields}
        values={formData}
        onFieldChange={handleFieldChange}
        submitButtonText="Add Animal"
      />
      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleSubmit}
        title="Edit Animal"
        fields={modalFields}
        initialData={selectedCattle}
        values={formData}
        onFieldChange={handleFieldChange}
        submitButtonText="Save Changes"
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
            Are you sure you want to delete this record?
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
            Are you sure you want to delete {selectedCattleList.length} selected
            cattle records?
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

export default CattleRegister;

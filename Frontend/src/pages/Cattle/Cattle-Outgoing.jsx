import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";

// Define modal fields
const exitEventFields = [
  {
    name: "type",
    label: "Cattle Type",
    type: "select",
    options: [], // will be populated with unique types
    icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "breed",
    label: "Breed",
    type: "select",
    options: [], // will be populated based on type
    icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
    validation: { required: true },
    hidden: (formData) => !formData.type,
  },
  {
    name: "cattleId",
    label: "Cattle ID",
    type: "select",
    options: [], // will be populated based on type and breed
    icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
    validation: { required: true },
    hidden: (formData) => !formData.breed,
  },
  {
    name: "date",
    label: "Date",
    type: "date",
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "exitType",
    label: "Exit Type",
    type: "select",
    options: [
      { value: "Sale", label: "Sale" },
      { value: "Transfer", label: "Transfer" },
      { value: "Death", label: "Death" },
    ],
    icon: <Wrapper.ExitToAppIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "reason",
    label: "Reason",
    type: "text",
    multiline: true,
    rows: 4,
    icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "salePrice",
    label: "Sale Price",
    type: "number",
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "newOwnerDestination",
    label: "New Owner/Destination",
    type: "text",
    icon: <Wrapper.PlaceIcon fontSize="small" color="action" />,
    validation: { required: true },
  },
];

const CattleOutgoing = () => {
  const theme = Wrapper.useTheme();
  const [events, setEvents] = useState([]);
  const [formFields, setFormFields] = useState(exitEventFields);
  const [formData, setFormData] = useState(
    exitEventFields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [cattleData, setCattleData] = useState([]);
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

  // Define modal fields with conditional logic
  const modalFields = formFields.filter((f) => {
    if (f.name === "salePrice") {
      return formData.exitType === "Sale";
    }
    if (f.name === "newOwnerDestination") {
      return ["Sale", "Transfer"].includes(formData.exitType);
    }
    return true;
  });

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evtRes, catRes] = await Promise.all([
        Wrapper.axios.get(`${BASE_URL}/cattle-outgoing`, {
          params: { page, limit: 10 },
        }),
        Wrapper.axios.get(`${BASE_URL}/cattle/active`),
      ]);
console.log("Cattle data:", catRes);  
      // Exit events response
      if (evtRes.data.success) {
        setEvents(evtRes.data.events);
        setTotalPages(evtRes.data.pagination.pages);
      }

      // Store cattle data
      const cattle = catRes.data.cattle;
      setCattleData(cattle);

      // Build type options (unique types)
      const uniqueTypes = [...new Set(cattle.map((c) => c.type))].map(
        (type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        })
      );

      // Update form fields with type options
      setFormFields((fs) =>
        fs.map((f) => (f.name === "type" ? { ...f, options: uniqueTypes } : f))
      );
    } catch (err) {
      console.error(err);
      showNotification("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update breed and cattleId options based on formData
  useEffect(() => {
    // Update breed options when type changes
    if (formData.type) {
      const filteredBreeds = [
        ...new Set(
          cattleData.filter((c) => c.type === formData.type).map((c) => c.breed)
        ),
      ].map((breed) => ({
        value: breed,
        label: breed.charAt(0).toUpperCase() + breed.slice(1),
      }));
      setFormFields((fs) =>
        fs.map((f) =>
          f.name === "breed" ? { ...f, options: filteredBreeds } : f
        )
      );
    } else {
      // Reset breed options if no type selected
      setFormFields((fs) =>
        fs.map((f) => (f.name === "breed" ? { ...f, options: [] } : f))
      );
    }

    // Update cattleId options when type and breed are selected
    if (formData.type && formData.breed) {
      const filteredCattle = cattleData
        .filter((c) => c.type === formData.type && c.breed === formData.breed)
        .map((c) => ({
          value: c._id,
          label: `${c.cattleId} (${c.breed})`,
        }));
      setFormFields((fs) =>
        fs.map((f) =>
          f.name === "cattleId" ? { ...f, options: filteredCattle } : f
        )
      );
    } else {
      // Reset cattleId options if type or breed is not selected
      setFormFields((fs) =>
        fs.map((f) => (f.name === "cattleId" ? { ...f, options: [] } : f))
      );
    }
  }, [formData.type, formData.breed, cattleData]);

  // Sort & filter client-side
  const displayed = events
    .filter((e) => e.exitType.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const vA = a[sortConfig.key];
      const vB = b[sortConfig.key];
      if (sortConfig.direction === "asc") return vA > vB ? 1 : -1;
      return vA < vB ? 1 : -1;
    });

  // Field change handler
  const handleFieldChange = (name, value) => {
    setFormData((d) => {
      // Reset dependent fields
      if (name === "type") {
        return {
          ...d,
          type: value,
          breed: "",
          cattleId: "",
          date: "",
          exitType: "",
          reason: "",
          salePrice: "",
          newOwnerDestination: "",
        };
      }
      if (name === "breed") {
        return {
          ...d,
          breed: value,
          cattleId: "",
          date: "",
          exitType: "",
          reason: "",
          salePrice: "",
          newOwnerDestination: "",
        };
      }
      if (name === "exitType") {
        return {
          ...d,
          exitType: value,
          salePrice: "",
          newOwnerDestination: "",
        };
      }
      return { ...d, [name]: value };
    });
  };

  // Create/update
  const handleSubmit = async (payload) => {
    try {
      const submitPayload = payload;
      let response;

      if (selectedEvent) {
        // Edit existing event
        response = await Wrapper.axios.put(
          `${BASE_URL}/cattle-outgoing/${selectedEvent._id}`,
          submitPayload
        );
      } else {
        // Create new event
        response = await Wrapper.axios.post(
          `${BASE_URL}/cattle-outgoing`,
          submitPayload
        );
      }

      if (response.data.success) {
        await fetchData(); // First fetch new data
        showNotification(
          response.data.message ||
            (selectedEvent ? "Event updated" : "Event recorded"),
          "success"
        );
        setAddModalOpen(false);
        setEditModalOpen(false);
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

  // Delete single event
  const handleDelete = async () => {
    const { id } = deleteConfirmation;
    if (!id) {
      showNotification("No event selected for deletion", "error");
      return;
    }
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/cattle-outgoing/${id}`
      );
      if (response.data.success) {
        showNotification(
          response.data.message || "Deleted successfully",
          "success"
        );
        setDeleteConfirmation({ isOpen: false, id: null });
        fetchData();
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

  // Delete multiple events
  const handleConfirmMultipleDelete = async () => {
    try {
      console.log("Sending IDs for deletion:", selectedEvents);
      await Wrapper.axios.delete(
        `${BASE_URL}/cattle-outgoing/delete-multiple`,
        {
          data: { ids: selectedEvents },
        }
      );
      showNotification(
        `${selectedEvents.length} events deleted successfully`,
        "success"
      );
      setSelectedEvents([]);
      fetchData();
    } catch (error) {
      showNotification("Failed to delete selected events", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
    }
  };

  // Handle event selection
  const handleSelectEvent = (id) => {
    setSelectedEvents((prev) =>
      prev.includes(id)
        ? prev.filter((eventId) => eventId !== id)
        : [...prev, id]
    );
  };

  // Handle select all events
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEvents(displayed.map((event) => event._id));
    } else {
      setSelectedEvents([]);
    }
  };

  // Open Add
  const openAdd = () => {
    setSelectedEvent(null);
    setFormData(
      exitEventFields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {})
    );
    setAddModalOpen(true);
  };

  // Open Edit
  const openEdit = (evt) => {
    setSelectedEvent(evt);
    setFormData({
      type: evt.cattleId.type,
      breed: evt.cattleId.breed,
      cattleId: evt.cattleId._id, // Use _id for cattleId
      date: evt.date.split("T")[0],
      exitType: evt.exitType,
      reason: evt.reason,
      salePrice: evt.salePrice ?? "",
      newOwnerDestination: evt.newOwnerDestination ?? "",
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
            Cattle Outgoing Events
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Record all exit events for your cattle
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
            Record Exit Event
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() => {
              if (selectedEvents.length > 0) {
                setMultipleDeleteConfirmation({ isOpen: true });
              } else {
                showNotification("No events selected", "warning");
              }
            }}
            disabled={selectedEvents.length === 0}
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
              Total Events
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {events.length}
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
              {selectedEvents.length}
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
                        selectedEvents.length > 0 &&
                        selectedEvents.length < displayed.length
                      }
                      checked={
                        displayed.length > 0 &&
                        selectedEvents.length === displayed.length
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
                    "Date",
                    "Cattle Type",
                    "Breed",
                    "Cattle ID",
                    "Type",
                    "Reason",
                    "Sale Price",
                    "Destination",
                    "Actions",
                  ].map((h) => (
                    <Wrapper.TableCell
                      key={h}
                      onClick={() =>
                        setSortConfig((s) => ({
                          key: h
                            .toLowerCase()
                            .replace(" ", "")
                            .replace("saleprice", "salePrice")
                            .replace("destination", "newOwnerDestination"),
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
                {displayed.map((evt) => (
                  <Wrapper.TableRow
                    key={evt._id}
                    sx={{
                      ...(selectedEvents.includes(evt._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedEvents.includes(evt._id)}
                        onChange={() => handleSelectEvent(evt._id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {new Date(evt.date).toLocaleDateString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{evt.cattleId.type}</Wrapper.TableCell>
                    <Wrapper.TableCell>{evt.cattleId.breed}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {evt.cattleId.cattleId}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{evt.exitType}</Wrapper.TableCell>
                    <Wrapper.TableCell>{evt.reason}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {evt.exitType === "Sale" ? `$${evt.salePrice}` : "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {["Sale", "Transfer"].includes(evt.exitType)
                        ? evt.newOwnerDestination
                        : "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit Event">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => openEdit(evt)}
                            sx={{ color: "#FBC02D" }}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete Event">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                id: evt._id,
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
              {selectedEvents.length > 0 ? (
                <span>
                  <b>{selectedEvents.length}</b> events selected
                </span>
              ) : (
                <span>Select events to perform actions</span>
              )}
            </Wrapper.Typography>

            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
              <Wrapper.Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
              {selectedEvents.length > 0 && (
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
        open={addModalOpen || editModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
        }}
        onSubmit={handleSubmit}
        title={selectedEvent ? "Edit Exit Event" : "Record Exit Event"}
        fields={modalFields}
        initialData={selectedEvent || {}}
        values={formData}
        onFieldChange={handleFieldChange}
        submitButtonText={selectedEvent ? "Update" : "Record"}
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
            Are you sure you want to delete this event?
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
            Are you sure you want to delete {selectedEvents.length} selected
            events?
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

export default CattleOutgoing;

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { BASE_URL } from "../../config/config";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import EventDetailsModal from "../../components/Modals/Event-details";

const localizer = momentLocalizer(moment);

const HealthManagement = () => {
  const theme = Wrapper.useTheme();
  const [events, setEvents] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [isCalendarEdit, setIsCalendarEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    eventType: "",
    cattleId: "",
    fromDate: "",
    toDate: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [filterSelectionState, setFilterSelectionState] = useState({
    type: "",
    breed: "",
  });
  const [formData, setFormData] = useState({
    cattleId: "",
    eventDate: "",
    eventType: "",
    medicineId: "",
    dosage: "",
    vetTechnician: "",
    nextDueDate: "",
    notes: "",
    status: "Pending",
    type: "",
    breed: "",
  });
  const [selectionState, setSelectionState] = useState({
    type: "",
    breed: "",
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const healthFields = [
    {
      name: "type",
      label: "Cattle Type",
      type: "select",
      options: [...new Set(cattleList.map((cattle) => cattle.type))].map(
        (type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        })
      ),
      validation: { required: true },
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
    },
    {
      name: "breed",
      label: "Breed",
      type: "select",
      options: selectionState.type
        ? [
            ...new Set(
              cattleList
                .filter((cattle) => cattle.type === selectionState.type)
                .map((cattle) => cattle.breed)
            ),
          ].map((breed) => ({
            value: breed,
            label: breed.charAt(0).toUpperCase() + breed.slice(1),
          }))
        : [],
      validation: { required: true },
      disabled: !selectionState.type,
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
    },
    {
      name: "cattleId",
      label: "Cattle ID",
      type: "select",
      options:
        selectionState.type && selectionState.breed
          ? cattleList
              .filter(
                (cattle) =>
                  cattle.type === selectionState.type &&
                  cattle.breed === selectionState.breed
              )
              .map((cattle) => ({
                value: cattle._id,
                label: `${cattle.cattleId} (${cattle.breed})`,
              }))
          : [],
      validation: { required: true },
      disabled: !selectionState.breed,
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
    },
    {
      name: "eventType",
      label: "Event Type",
      type: "select",
      options: [
        { value: "Vaccination", label: "Vaccination" },
        { value: "Treatment", label: "Treatment" },
        { value: "Check-up", label: "Check-up" },
      ],
      validation: { required: true },
      icon: <Wrapper.MedicalServicesIcon fontSize="small" color="action" />,
    },
    {
      name: "eventDate",
      label: "Event Date",
      type: "date",
      validation: { required: true },
      InputLabelProps: { shrink: true },
      icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
    },
    {
      name: "medicineId",
      label: "Vaccine/Medicine Name",
      type: "select",
      options: items
        .filter((item) => item.item?.category === "medicine")
        .map((item) => ({
          value: item._id,
          label: `${item?.item?.name} (Available: ${item.quantity})`,
        })),
      disabled:
        items.filter((item) => item?.item?.category === "medicine").length ===
        0,
      validation: {
        required: (form) =>
          ["Vaccination", "Treatment"].includes(form.eventType),
      },
      hidden: (form) => !["Vaccination", "Treatment"].includes(form.eventType),
      icon: <Wrapper.MedicationIcon fontSize="small" color="action" />,
    },
    {
      name: "dosage",
      label: "Dosage",
      type: "text",
      validation: {
        required: (form) =>
          ["Vaccination", "Treatment"].includes(form.eventType),
      },
      hidden: (form) => !["Vaccination", "Treatment"].includes(form.eventType),
      icon: <Wrapper.MedicationIcon fontSize="small" color="action" />,
    },
    {
      name: "vetTechnician",
      label: "Vet Technician",
      type: "select",
      options: employees.map((i) => ({
        value: i._id,
        label: (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{`${i.firstName} ${i.lastName}`}</span>
            <span
              style={{
                backgroundColor: "#e0e0e0",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "12px",
                marginLeft: "8px",
              }}
            >
              {i.designation}
            </span>
          </div>
        ),
      })),
      validation: { required: true },
    },
    {
      name: "nextDueDate",
      label: "Next Due Date",
      type: "date",
      validation: {
        required: (form) =>
          ["Vaccination", "Check-up"].includes(form.eventType),
      },
      hidden: (form) => !["Vaccination", "Check-up"].includes(form.eventType),
      InputLabelProps: { shrink: true },
      icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Pending", label: "Pending" },
        { value: "Completed", label: "Completed" },
      ],
      validation: { required: true },
      icon: <Wrapper.CheckCircleIcon fontSize="small" color="action" />,
    },
    {
      name: "notes",
      label: "Notes",
      type: "text",
      fullWidth: true,
      multiline: true,
      rows: 4,
      icon: <Wrapper.DescriptionIcon fontSize="small" color="action" />,
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        eventType: filters.eventType,
        cattleId: filters.cattleId,
        page: filters.page,
        limit: filters.limit,
      };
      const [healthResponse, cattleResponse, itemsRes, employeeRes] =
        await Promise.all([
          axios.get(`${BASE_URL}/health`, { params }),
          axios.get(`${BASE_URL}/cattle/all`, { params: { status: "active" } }),
          axios.get(`${BASE_URL}/inventory/cattle?all=true`),
          axios.get(`${BASE_URL}/employees/`),
        ]);
      console.log(itemsRes);
console.log(healthResponse);
      let formattedEvents = healthResponse.data.data.map((event) => ({
        ...event,
        start: new Date(event.eventDate),
        end: new Date(event.eventDate),
        title: `${event.eventType} - ${event.cattleId?.type || "Unknown"} - ${
          event.cattleId?.cattleId || "Unknown"
        }`,
      }));

      // Apply client-side filtering for fromDate, toDate, and status
      formattedEvents = formattedEvents.filter((event) => {
        let matches = true;
        if (filters.fromDate) {
          matches =
            matches && new Date(event.eventDate) >= new Date(filters.fromDate);
        }
        if (filters.toDate) {
          matches =
            matches && new Date(event.eventDate) <= new Date(filters.toDate);
        }
        if (filters.status) {
          matches = matches && event.status === filters.status;
        }
        return matches;
      });

      setEvents(formattedEvents);
      setPagination({
        page: healthResponse.data.pagination.page,
        pages: healthResponse.data.pagination.pages,
        total: healthResponse.data.pagination.total,
      });

      if (cattleResponse.data.success) {
        setCattleList(cattleResponse.data.cattle);
      } else {
        throw new Error(cattleResponse.data.message);
      }
      if (itemsRes.data) {
        setItems(
          Array.isArray(itemsRes.data.inventoryList)
            ? itemsRes.data.inventoryList
            : []
        );
      } else {
        throw new Error(itemsRes.data.message);
      }
      setEmployees(
        Array.isArray(employeeRes.data.data)
          ? employeeRes.data.data.filter((emp) => emp.department === "Cattle")
          : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to fetch data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFieldChange = (name, value) => {
    if (name === "type") {
      setSelectionState({ type: value, breed: "" });
      setFormData({ ...formData, cattleId: "", type: value, breed: "" });
    } else if (name === "breed") {
      setSelectionState({ ...selectionState, breed: value });
      setFormData({ ...formData, cattleId: "", breed: value });
    } else if (name === "eventType") {
      setFormData({
        ...formData,
        eventType: value,
        medicineId: "",
        dosage: "",
        nextDueDate: "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFilterFieldChange = (name, value) => {
    if (name === "type") {
      setFilterSelectionState({ type: value, breed: "" });
      setFilters({ ...filters, cattleId: "", page: 1 });
    } else if (name === "breed") {
      setFilterSelectionState({ ...filterSelectionState, breed: value });
      setFilters({ ...filters, cattleId: "", page: 1 });
    } else {
      setFilters({ ...filters, [name]: value, page: 1 });
    }
  };

  const handleSubmit = async (form) => {
    try {
      setLoading(true);
      const payload = {
        cattleId: form.cattleId,
        eventDate: form.eventDate,
        eventType: form.eventType,
        medicineId: form.medicineId,
        dosage: form.dosage,
        vetTechnician: form.vetTechnician,
        nextDueDate: form.nextDueDate,
        notes: form.notes,
        status: form.status,
      };

      if (selectedEvent) {
        await axios.put(`${BASE_URL}/health/${selectedEvent._id}`, payload);
        setNotification({
          open: true,
          message: "Health event updated successfully",
          severity: "success",
        });
      } else {
        await axios.post(`${BASE_URL}/health`, payload);
        setNotification({
          open: true,
          message: "Health event created successfully",
          severity: "success",
        });
      }
      setOpenModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error saving health event:", error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Failed to save health event",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/health/${id}`);
      setNotification({
        open: true,
        message: "Health event deleted successfully",
        severity: "success",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting health event:", error);
      setNotification({
        open: true,
        message:
          error.response?.data?.message || "Failed to delete health event",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cattleId: "",
      eventDate: "",
      eventType: "",
      medicineId: "",
      dosage: "",
      vetTechnician: "",
      nextDueDate: "",
      notes: "",
      status: "Pending",
      type: "",
      breed: "",
    });
    setSelectionState({
      type: "",
      breed: "",
    });
    setSelectedEvent(null);
    setIsCalendarEdit(false);
  };

  const resetFilters = () => {
    setFilters({
      eventType: "",
      cattleId: "",
      fromDate: "",
      toDate: "",
      status: "",
      page: 1,
      limit: 10,
    });
    setFilterSelectionState({
      type: "",
      breed: "",
    });
  };

  const handlePageChange = (event, newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleEventUpdate = (updatedEvent) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event._id === updatedEvent._id
          ? { ...event, status: updatedEvent.status }
          : event
      )
    );
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.status === "Completed" ? "#4caf50" : "#ff9800",
      borderRadius: "5px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
    };
    return { style };
  };

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
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
            Health Events Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Track and manage cattle health events
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.Button
          variant="contained"
          color="primary"
          startIcon={<Wrapper.AddIcon />}
          onClick={() => {
            resetForm();
            setOpenModal(true);
          }}
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
          Add Health Event
        </Wrapper.Button>
      </Wrapper.Box>

      <Wrapper.Box sx={{ mb: 3 }}>
        <Wrapper.Paper sx={{ p: 2 }}>
          <Wrapper.Grid container spacing={2}>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Event Type</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.eventType}
                  onChange={(e) =>
                    handleFilterFieldChange("eventType", e.target.value)
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Vaccination">
                    Vaccination
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Treatment">
                    Treatment
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Check-up">Check-up</Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Cattle Type</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filterSelectionState.type}
                  onChange={(e) =>
                    handleFilterFieldChange("type", e.target.value)
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  {[...new Set(cattleList.map((cattle) => cattle.type))].map(
                    (type) => (
                      <Wrapper.MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Wrapper.MenuItem>
                    )
                  )}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Breed</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filterSelectionState.breed}
                  onChange={(e) =>
                    handleFilterFieldChange("breed", e.target.value)
                  }
                  disabled={!filterSelectionState.type}
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  {filterSelectionState.type &&
                    [
                      ...new Set(
                        cattleList
                          .filter(
                            (cattle) =>
                              cattle.type === filterSelectionState.type
                          )
                          .map((cattle) => cattle.breed)
                      ),
                    ].map((breed) => (
                      <Wrapper.MenuItem key={breed} value={breed}>
                        {breed.charAt(0).toUpperCase() + breed.slice(1)}
                      </Wrapper.MenuItem>
                    ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Cattle ID</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.cattleId}
                  onChange={(e) =>
                    handleFilterFieldChange("cattleId", e.target.value)
                  }
                  disabled={!filterSelectionState.breed}
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  {filterSelectionState.type &&
                    filterSelectionState.breed &&
                    cattleList
                      .filter(
                        (cattle) =>
                          cattle.type === filterSelectionState.type &&
                          cattle.breed === filterSelectionState.breed
                      )
                      .map((cattle) => (
                        <Wrapper.MenuItem key={cattle._id} value={cattle._id}>
                          {cattle.cattleId} ({cattle.breed})
                        </Wrapper.MenuItem>
                      ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  handleFilterFieldChange("fromDate", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  handleFilterFieldChange("toDate", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Status</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.status}
                  onChange={(e) =>
                    handleFilterFieldChange("status", e.target.value)
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Completed">
                    Completed
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Pending">Pending</Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.Button
                variant="outlined"
                color="primary"
                onClick={resetFilters}
                fullWidth
                sx={{
                  borderRadius: 2,
                  borderColor: "primary.main",
                  "&:hover": {
                    bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.1),
                    borderColor: "primary.dark",
                  },
                }}
              >
                Clear Filters
              </Wrapper.Button>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.Paper>
      </Wrapper.Box>

      <Wrapper.Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
        <Wrapper.Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Wrapper.Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Wrapper.Tab label="Calendar View" />
            <Wrapper.Tab label="List View" />
          </Wrapper.Tabs>
        </Wrapper.Box>

        {loading ? (
          <Wrapper.Box sx={{ p: 4, textAlign: "center" }}>
            <Wrapper.CircularProgress />
          </Wrapper.Box>
        ) : events.length === 0 ? (
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
            <Wrapper.EventIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Wrapper.Typography variant="h5" gutterBottom>
              No Health Events Found
            </Wrapper.Typography>
            <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
              Add a new health event or adjust filters to view records
            </Wrapper.Typography>
            <Wrapper.Button
              variant="contained"
              color="primary"
              startIcon={<Wrapper.RefreshIcon />}
              onClick={fetchData}
            >
              Refresh
            </Wrapper.Button>
          </Wrapper.Card>
        ) : (
          <>
            {tabValue === 0 ? (
              <Wrapper.Box sx={{ height: 600 }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={(event) => {
                    setSelectedEvent(event);
                    setIsCalendarEdit(true);
                    setOpenDetailsModal(true);
                  }}
                  style={{ height: "100%" }}
                />
              </Wrapper.Box>
            ) : (
              <>
                <Wrapper.TableContainer
                  sx={{
                    maxHeight: "calc(100vh - 350px)",
                    "&::-webkit-scrollbar": { width: "8px", height: "8px" },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: Wrapper.alpha(
                        theme.palette.primary.main,
                        0.2
                      ),
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
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Date
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Cattle ID
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Event Type
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Vaccine/Medicine
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Dosage
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Vet Technician
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Next Due Date
                        </Wrapper.TableCell>
                        <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                          Notes
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
                      {events.map((event) => (
                        <Wrapper.TableRow
                          key={event._id}
                          hover
                          sx={{
                            "&:hover": {
                              bgcolor: Wrapper.alpha(
                                theme.palette.primary.main,
                                0.04
                              ),
                            },
                          }}
                        >
                          <Wrapper.TableCell>
                            {moment(event.eventDate).format("DD/MM/YYYY")}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {typeof event.cattleId === "object" &&
                            event.cattleId?.cattleId &&
                            event.cattleId?.type
                              ? `${event.cattleId.type} - ${event.cattleId.cattleId}`
                              : typeof event.cattleId === "string"
                              ? event.cattleId
                              : "Unknown"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {event.eventType || "N/A"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {typeof event.medicineId === "object" &&
                            event.medicineId?.name
                              ? event.medicineId.name
                              : typeof event.medicineId === "string"
                              ? items.find(
                                  (item) => item._id === event.medicineId
                                )?.name || event.medicineId
                              : "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {event.dosage || "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {typeof event.vetTechnician === "object" &&
                            event.vetTechnician?.firstName &&
                            event.vetTechnician?.lastName
                              ? `${event.vetTechnician.firstName} ${event.vetTechnician.lastName}`
                              : typeof event.vetTechnician === "string"
                              ? event.vetTechnician
                              : "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {event.nextDueDate
                              ? moment(event.nextDueDate).format("DD/MM/YYYY")
                              : "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {event.notes || "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            <Wrapper.Chip
                              label={event.status || "N/A"}
                              color={
                                event.status === "Completed"
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                              <Wrapper.IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  const selectedCattle = cattleList.find(
                                    (cattle) =>
                                      cattle._id ===
                                      (typeof event.cattleId === "object"
                                        ? event.cattleId?._id
                                        : event.cattleId)
                                  );
                                  setFormData({
                                    cattleId:
                                      typeof event.cattleId === "object"
                                        ? event.cattleId?._id
                                        : event.cattleId || "",
                                    eventDate: moment(event.eventDate).format(
                                      "YYYY-MM-DD"
                                    ),
                                    eventType: event.eventType || "",
                                    medicineId:
                                      typeof event.medicineId === "object"
                                        ? event.medicineId?._id
                                        : event.medicineId || "",
                                    dosage: event.dosage || "",
                                    vetTechnician:
                                      typeof event.vetTechnician === "object"
                                        ? event.vetTechnician?._id
                                        : event.vetTechnician || "",
                                    nextDueDate: event.nextDueDate
                                      ? moment(event.nextDueDate).format(
                                          "YYYY-MM-DD"
                                        )
                                      : "",
                                    notes: event.notes || "",
                                    status: event.status || "Pending",
                                    type: selectedCattle?.type || "",
                                    breed: selectedCattle?.breed || "",
                                  });
                                  setSelectionState({
                                    type: selectedCattle?.type || "",
                                    breed: selectedCattle?.breed || "",
                                  });
                                  setIsCalendarEdit(false);
                                  setOpenModal(true);
                                }}
                                sx={{
                                  bgcolor: Wrapper.alpha(
                                    theme.palette.primary.main,
                                    0.1
                                  ),
                                  "&:hover": {
                                    bgcolor: Wrapper.alpha(
                                      theme.palette.primary.main,
                                      0.2
                                    ),
                                  },
                                }}
                              >
                                <Wrapper.EditIcon fontSize="small" />
                              </Wrapper.IconButton>
                              <Wrapper.IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(event._id)}
                                sx={{
                                  bgcolor: Wrapper.alpha(
                                    theme.palette.error.main,
                                    0.1
                                  ),
                                  "&:hover": {
                                    bgcolor: Wrapper.alpha(
                                      theme.palette.error.main,
                                      0.2
                                    ),
                                  },
                                }}
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
                <Wrapper.Box
                  sx={{ mt: 2, display: "flex", justifyContent: "center" }}
                >
                  <Wrapper.Pagination
                    count={pagination.pages}
                    page={pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                    sx={{
                      "& .MuiPaginationItem-root": {
                        borderRadius: 1,
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "white",
                          "&:hover": { bgcolor: "primary.dark" },
                        },
                      },
                    }}
                  />
                </Wrapper.Box>
              </>
            )}
          </>
        )}
      </Wrapper.Paper>

      <ReusableModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        title={
          selectedEvent && !isCalendarEdit
            ? "Edit Health Event"
            : "Add Health Event"
        }
        fields={healthFields.filter(
          (field) => !field.hidden || !field.hidden(formData)
        )}
        initialData={formData}
        values={formData}
        submitButtonText={selectedEvent && !isCalendarEdit ? "Update" : "Add"}
        onFieldChange={handleFieldChange}
        loading={loading}
      />

      <EventDetailsModal
        open={openDetailsModal}
        onClose={() => setOpenDetailsModal(false)}
        event={{
          id: selectedEvent?._id || "",
          date: selectedEvent?.eventDate
            ? moment(selectedEvent.eventDate).format("YYYY-MM-DD")
            : "",
          cattleId:
            typeof selectedEvent?.cattleId === "object" &&
            selectedEvent?.cattleId?.cattleId
              ? selectedEvent.cattleId.cattleId
              : selectedEvent?.cattleId || "Unknown",
          eventType: selectedEvent?.eventType || "N/A",
          medicineId: selectedEvent?.medicineId
            ? items.find(
                (item) =>
                  item._id ===
                  (typeof selectedEvent.medicineId === "object"
                    ? selectedEvent.medicineId._id
                    : selectedEvent.medicineId)
              )?.name ||
              selectedEvent.medicineId ||
              "-"
            : "-",
          dosage: selectedEvent?.dosage || "-",
          vetTechnician:
            typeof selectedEvent?.vetTechnician === "object" &&
            selectedEvent?.vetTechnician?.firstName &&
            selectedEvent?.vetTechnician?.lastName
              ? `${selectedEvent.vetTechnician.firstName} ${selectedEvent.vetTechnician.lastName}`
              : typeof selectedEvent?.vetTechnician === "string"
              ? selectedEvent.vetTechnician
              : "-",
          nextDueDate: selectedEvent?.nextDueDate
            ? moment(selectedEvent.nextDueDate).format("YYYY-MM-DD")
            : "-",
          notes: selectedEvent?.notes || "-",
          status: selectedEvent?.status || "N/A",
          type: selectedEvent?.eventType?.toLowerCase() || "",
        }}
        module="cattle"
        onEventUpdate={handleEventUpdate}
      />

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

export default HealthManagement;

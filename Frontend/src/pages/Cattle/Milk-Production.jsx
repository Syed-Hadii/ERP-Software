import { useState, useEffect, useCallback } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { BASE_URL } from "../../config/config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MilkProduction = () => {
  const theme = Wrapper.useTheme();
  const [records, setRecords] = useState([]);
  const [cattleList, setCattleList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    breed: "",
    cattleId: "",
    date: new Date().toISOString().split("T")[0],
    shift: "Morning",
    volume: "",
    employee: "",
    notes: "",
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortOrder, setSortOrder] = useState({ key: "date", order: "desc" });
  const [filters, setFilters] = useState({
    animalType: "",
    shift: "",
    fromDate: "",
    toDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectionState, setSelectionState] = useState({
    type: "",
    breed: "",
  });
  const [inventoryData, setInventoryData] = useState({
    Buffalo: 0,
    Cow: 0,
    Goat: 0,
    Sheep: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const recordsPerPage = 7;

  const columns = [
    { key: "date", label: "Date", sortable: true },
    { key: "cattleId.cattleId", label: "Cattle ID", sortable: true },
    { key: "shift", label: "Shift", sortable: true },
    { key: "volume", label: "Volume (L)", sortable: true },
    { key: "employee", label: "employee", sortable: true },
  ];

  const milkProductionFields = [
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
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
      validation: { required: true },
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
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
      validation: { required: true },
      disabled: !selectionState.type,
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
      icon: <Wrapper.PetsIcon fontSize="small" color="action" />,
      validation: { required: true },
      disabled: !selectionState.breed,
    },
    {
      name: "date",
      label: "Date",
      type: "date",
      icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "shift",
      label: "Shift",
      type: "select",
      options: [
        { value: "Morning", label: "Morning" },
        { value: "Afternoon", label: "Afternoon" },
        { value: "Evening", label: "Evening" },
      ],
      icon: <Wrapper.ScheduleIcon fontSize="small" color="action" />,
      validation: { required: true },
    },
    {
      name: "volume",
      label: "Volume (L)",
      type: "number",
      icon: <Wrapper.LocalDrinkIcon fontSize="small" color="action" />,
      validation: { required: true, min: 0 },
    },
    {
      name: "employee",
      label: "Employee",
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
      name: "notes",
      label: "Notes",
      type: "text",
      multiline: true,
      rows: 4,
      icon: <Wrapper.NotesIcon fontSize="small" color="action" />,
    },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: recordsPerPage,
        sortBy: `${sortOrder.order === "desc" ? "-" : ""}${sortOrder.key}`,
        animalType: filters.animalType || undefined, // Changed from cattleId to animalType
        shift: filters.shift || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      const chartParams = {
        limit: 1000,
        sortBy: "date",
        animalType: filters.animalType || undefined, // Changed from cattleId to animalType
        shift: filters.shift || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      const [
        milkProductionResponse,
        cattleResponse,
        chartResponse,
        inventoryResponse,
        employeeRes,
      ] = await Promise.all([
        Wrapper.axios.get(`${BASE_URL}/milk-production/`, { params }),
        Wrapper.axios.get(`${BASE_URL}/cattle/active`),
        Wrapper.axios.get(`${BASE_URL}/milk-production/`, {
          params: chartParams,
        }),
        Wrapper.axios.get(`${BASE_URL}/dairy-inventory/`), // New endpoint to fetch inventory
        Wrapper.axios.get(`${BASE_URL}/employees/`),
      ]);

      // Handle milk production data
      if (milkProductionResponse.data.success) {
        setRecords(milkProductionResponse.data.data || []);
        setTotalRecords(milkProductionResponse.data.pagination.total || 0);
      } else {
        throw new Error(
          milkProductionResponse.data.message || "Failed to fetch records"
        );
      }
      setEmployees(
        Array.isArray(employeeRes.data.data)
          ? employeeRes.data.data.filter((emp) => emp.department === "Cattle")
          : []
      );
      // Handle cattle data
      setCattleList(cattleResponse.data.cattle || []);

      // Handle chart data
      if (chartResponse.data.success) {
        const chartLabels = chartResponse.data.data.map((record) =>
          new Date(record.date).toLocaleDateString()
        );
        const volumes = chartResponse.data.data.map((record) => record.volume);

        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: "Milk Production (Liters)",
              data: volumes,
              fill: false,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
            },
          ],
        });
      }

      // Handle inventory data
      if (inventoryResponse.data.success) {
        const inventory = inventoryResponse.data.data;
        const updatedInventory = {
          Buffalo: 0,
          Cow: 0,
          Goat: 0,
          Sheep: 0,
        };
        inventory.forEach((item) => {
          if (item.productId.name === "Buffalo Raw Milk") {
            updatedInventory.Buffalo = item.quantity;
          } else if (item.productId.name === "Cow Raw Milk") {
            updatedInventory.Cow = item.quantity;
          } else if (item.productId.name === "Goat Raw Milk") {
            updatedInventory.Goat = item.quantity;
          } else if (item.productId.name === "Sheep Raw Milk") {
            updatedInventory.Sheep = item.quantity;
          }
        });
        setInventoryData(updatedInventory);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification(error.message || "Error loading data", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortOrder, filters, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshRecords = () => {
    setRefreshTrigger((prev) => prev + 1);
    showNotification("Refreshing milk production data...", "info");
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => {
      if (name === "type") {
        return {
          ...prev,
          type: value,
          breed: "",
          cattleId: "",
        };
      } else if (name === "breed") {
        return {
          ...prev,
          breed: value,
          cattleId: "",
        };
      } else {
        return { ...prev, [name]: value };
      }
    });
    setSelectionState((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type" ? { breed: "" } : {}),
    }));
  };

  const handleSubmit = async (form) => {
    try {
      setLoading(true);
      const payload = {
        date: form.date,
        cattleId: form.cattleId,
        shift: form.shift,
        volume: parseFloat(form.volume),
        employee: form.employee,
        notes: form.notes || undefined,
      };

      let response;
      if (selectedRecord) {
        response = await Wrapper.axios.put(
          `${BASE_URL}/milk-production/${selectedRecord._id}`,
          payload
        );
      } else {
        response = await Wrapper.axios.post(
          `${BASE_URL}/milk-production/`,
          payload
        );
      }

      if (response.data.success) {
        showNotification(
          selectedRecord
            ? "Record updated successfully"
            : "Record added successfully",
          "success"
        );
        setAddModalOpen(false);
        setEditModalOpen(false);
        fetchData();
        resetForm();
      } else {
        throw new Error(response.data.message || "Failed to save record");
      }
    } catch (error) {
      console.error("Error saving milk production:", error);
      let errorMessage = error.message || "Error saving record";
      if (error.response?.data?.message?.includes("duplicate key")) {
        errorMessage =
          "A record for this cattle, date, and shift already exists";
      } else if (error.response?.data?.message?.includes("Raw Milk")) {
        errorMessage = "Raw Milk product not found in dairy products";
      }
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/milk-production/${deleteId}`
      );
      if (response.data.success) {
        showNotification("Record deleted successfully", "success");
        fetchData();
      } else {
        throw new Error(response.data.message || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting milk production:", error);
      showNotification(error.message || "Error deleting record", "error");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      const deletePromises = selectedRecords.map((id) =>
        Wrapper.axios.delete(`${BASE_URL}/milk-production/${id}`)
      );
      const responses = await Promise.all(deletePromises);
      if (responses.every((res) => res.data.success)) {
        showNotification(
          `${selectedRecords.length} records deleted successfully`,
          "success"
        );
        setSelectedRecords([]);
        fetchData();
      } else {
        throw new Error("Some records failed to delete");
      }
    } catch (error) {
      console.error("Error deleting milk production records:", error);
      showNotification("Failed to delete selected records", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      breed: "",
      cattleId: "",
      date: new Date().toISOString().split("T")[0],
      shift: "Morning",
      volume: "",
      employee: "",
      notes: "",
    });
    setSelectionState({
      type: "",
      breed: "",
    });
    setSelectedRecord(null);
  };

  const handleSort = (key) => {
    setSortOrder((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectRecord = (id) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((recId) => recId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRecords(records.map((rec) => rec._id));
    } else {
      setSelectedRecords([]);
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    setSelectedRecords([]);
  }, [filters]);

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
            Milk Production Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage and track milk production records
          </Wrapper.Typography>
        </Wrapper.Box>
        {selectedTab === 0 && (
          <Wrapper.Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: { xs: "flex-start", sm: "flex-end" },
              width: { xs: "100%", md: "auto" },
            }}
          >
            <Wrapper.Button
              variant="contained"
              color="primary"
              startIcon={<Wrapper.AddIcon />}
              onClick={() => {
                resetForm();
                setAddModalOpen(true);
              }}
              sx={{
                borderRadius: 2,
                px: 2,
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              Add Milk Production
            </Wrapper.Button>
            <Wrapper.Button
              variant="outlined"
              color="primary"
              startIcon={<Wrapper.RefreshIcon />}
              onClick={refreshRecords}
              sx={{
                borderRadius: 2,
                px: 2,
                borderColor: "primary.main",
                "&:hover": {
                  bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.1),
                  borderColor: "primary.dark",
                },
              }}
            >
              Refresh
            </Wrapper.Button>
            <Wrapper.Button
              variant="outlined"
              color="error"
              startIcon={<Wrapper.DeleteIcon />}
              onClick={() =>
                selectedRecords.length > 0
                  ? setMultipleDeleteConfirmation({ isOpen: true })
                  : showNotification("No records selected", "warning")
              }
              disabled={selectedRecords.length === 0}
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
        )}
      </Wrapper.Box>

      {/* Summary Card */}
      {selectedTab === 0 && (
        <Wrapper.Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            }, // 4 cards
            gap: 3,
            mb: 4,
          }}
        >
          {["Buffalo", "Cow", "Goat", "Sheep"].map((type) => (
            <Wrapper.Card
              key={type}
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
                  {type} Milk Inventory
                </Wrapper.Typography>
                <Wrapper.Typography variant="h3" fontWeight="bold">
                  {inventoryData[type].toFixed(2)} L
                </Wrapper.Typography>
              </Wrapper.CardContent>
            </Wrapper.Card>
          ))}
        </Wrapper.Box>
      )}

      {/* Filters Section */}
      {selectedTab === 0 && (
        <Wrapper.Box sx={{ mb: 3 }}>
          <Wrapper.Grid container spacing={2}>
            <Wrapper.Grid item xs={12} md={3}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Animal Type</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.animalType}
                  onChange={(e) =>
                    setFilters({ ...filters, animalType: e.target.value })
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="buffalo">Buffalo</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="cow">Cow</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="goat">Goat</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="sheep">Sheep</Wrapper.MenuItem>
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
                  setFilters({ ...filters, fromDate: e.target.value })
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
                  setFilters({ ...filters, toDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={2}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Shift</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.shift}
                  onChange={(e) =>
                    setFilters({ ...filters, shift: e.target.value })
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Morning">Morning</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Afternoon">
                    Afternoon
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Evening">Evening</Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.Box>
      )}

      {/* Tabs Section */}
      <Wrapper.Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Wrapper.Tabs
          value={selectedTab}
          onChange={(e, newValue) => {
            setSelectedTab(newValue);
            setCurrentPage(1);
            setSelectedRecords([]);
          }}
          aria-label="milk production tabs"
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            "& .MuiTab-root": { fontWeight: "bold" },
          }}
        >
          <Wrapper.Tab label="Milk Production" />
          <Wrapper.Tab label="Milk Trend" />
        </Wrapper.Tabs>
      </Wrapper.Box>

      {/* Content Section */}
      {selectedTab === 0 ? (
        // Milk Production Tab
        <>
          {loading ? (
            <Wrapper.Box sx={{ width: "100%" }}>
              <Wrapper.Skeleton variant="rectangular" height={50} />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
            </Wrapper.Box>
          ) : records.length === 0 ? (
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
              <Wrapper.InventoryIcon
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Wrapper.Typography variant="h5" gutterBottom>
                No Milk Production Records Found
              </Wrapper.Typography>
              <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
                Add new records to track milk production
              </Wrapper.Typography>
              <Wrapper.Button
                variant="contained"
                color="primary"
                startIcon={<Wrapper.RefreshIcon />}
                onClick={refreshRecords}
              >
                Refresh Records
              </Wrapper.Button>
            </Wrapper.Card>
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
                  {totalRecords} {totalRecords === 1 ? "Record" : "Records"}
                </Wrapper.Typography>
                <Wrapper.Tooltip title="Refresh records">
                  <Wrapper.IconButton size="small" onClick={refreshRecords}>
                    <Wrapper.RefreshIcon fontSize="small" />
                  </Wrapper.IconButton>
                </Wrapper.Tooltip>
              </Wrapper.Box>
              <Wrapper.TableContainer
                sx={{
                  maxHeight: "calc(100vh - 350px)",
                  minHeight: "300px",
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
                      <Wrapper.TableCell padding="checkbox">
                        <Wrapper.Checkbox
                          indeterminate={
                            selectedRecords.length > 0 &&
                            selectedRecords.length < records.length
                          }
                          checked={
                            records.length > 0 &&
                            selectedRecords.length === records.length
                          }
                          onChange={handleSelectAll}
                          sx={{ "&.Mui-checked": { color: "primary.main" } }}
                        />
                      </Wrapper.TableCell>
                      {columns.map((column) => (
                        <Wrapper.TableCell
                          key={column.key}
                          onClick={
                            column.sortable
                              ? () => handleSort(column.key)
                              : null
                          }
                          sx={{
                            cursor: column.sortable ? "pointer" : "default",
                            fontWeight: "bold",
                            "&:hover": column.sortable
                              ? {
                                  bgcolor: Wrapper.alpha(
                                    theme.palette.primary.main,
                                    0.05
                                  ),
                                }
                              : {},
                          }}
                        >
                          <Wrapper.Box
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            {column.label}
                            {sortOrder.key === column.key &&
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
                      ))}
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Actions
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {records.map((record) => (
                      <Wrapper.TableRow
                        key={record._id}
                        hover
                        sx={{
                          "&:hover": {
                            bgcolor: Wrapper.alpha(
                              theme.palette.primary.main,
                              0.04
                            ),
                          },
                          ...(selectedRecords.includes(record._id) && {
                            bgcolor: Wrapper.alpha(
                              theme.palette.primary.main,
                              0.08
                            ),
                          }),
                        }}
                      >
                        <Wrapper.TableCell padding="checkbox">
                          <Wrapper.Checkbox
                            checked={selectedRecords.includes(record._id)}
                            onChange={() => handleSelectRecord(record._id)}
                            sx={{ "&.Mui-checked": { color: "primary.main" } }}
                          />
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {formatDate(record.date)}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {record.cattleId?.cattleId || "N/A"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{record.shift}</Wrapper.TableCell>
                        <Wrapper.TableCell>{record.volume}</Wrapper.TableCell>
                        <Wrapper.TableCell>{record.employee}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                            <Wrapper.Tooltip title="Edit">
                              <Wrapper.IconButton
                                size="small"
                                sx={{ color: "#FBC02D" }}
                                onClick={async () => {
                                  try {
                                    const response = await Wrapper.axios.get(
                                      `${BASE_URL}/milk-production/${record._id}`
                                    );
                                    if (response.data.success) {
                                      const data = response.data.data;
                                      setSelectedRecord(data);
                                      setFormData({
                                        type: data.cattleId?.type || "",
                                        breed: data.cattleId?.breed || "",
                                        cattleId: data.cattleId?._id || "",
                                        date: new Date(data.date)
                                          .toISOString()
                                          .split("T")[0],
                                        shift: data.shift,
                                        volume: data.volume,
                                        employee: data.employee,
                                        notes: data.notes || "",
                                      });
                                      setSelectionState({
                                        type: data.cattleId?.type || "",
                                        breed: data.cattleId?.breed || "",
                                      });
                                      setEditModalOpen(true);
                                    }
                                  } catch (error) {
                                    showNotification(
                                      error.response?.data?.message ||
                                        "Failed to fetch record",
                                      "error"
                                    );
                                  }
                                }}
                              >
                                <Wrapper.EditIcon fontSize="small" />
                              </Wrapper.IconButton>
                            </Wrapper.Tooltip>
                            <Wrapper.Tooltip title="Delete">
                              <Wrapper.IconButton
                                size="small"
                                onClick={() => {
                                  setDeleteId(record._id);
                                  setDeleteDialogOpen(true);
                                }}
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
              <Wrapper.Box
                sx={{
                  py: 2,
                  px: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Wrapper.Typography variant="body2" color="text.secondary">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * recordsPerPage + 1,
                    totalRecords
                  )}{" "}
                  - {Math.min(currentPage * recordsPerPage, totalRecords)} of{" "}
                  {totalRecords} records
                </Wrapper.Typography>
                <Wrapper.Pagination
                  count={Math.ceil(totalRecords / recordsPerPage)}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  shape="rounded"
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
            </Wrapper.Card>
          )}
        </>
      ) : (
        // Milk Trend Tab
        <Wrapper.Card
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            transition: "box-shadow 0.3s",
            "&:hover": { boxShadow: 6 },
          }}
        >
          <Wrapper.Typography variant="h6" fontWeight="bold" gutterBottom>
            Milk Production Trend
          </Wrapper.Typography>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Daily Milk Production" },
              },
            }}
          />
        </Wrapper.Card>
      )}

      {/* Modals for Add, Edit, Delete */}
      <ReusableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleSubmit}
        title="Add Milk Production"
        fields={milkProductionFields}
        values={formData}
        onFieldChange={handleFieldChange}
        submitButtonText="Add Milk Production"
        loading={loading}
      />

      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleSubmit}
        title="Edit Milk Production"
        fields={milkProductionFields}
        values={formData}
        onFieldChange={handleFieldChange}
        submitButtonText="Update Milk Production"
        loading={loading}
      />

      <Wrapper.Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>Confirm Delete</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography>
            Are you sure you want to delete this milk production record? This
            action cannot be undone.
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button
            onClick={() => setDeleteDialogOpen(false)}
            color="primary"
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      <Wrapper.Dialog
        open={multipleDeleteConfirmation.isOpen}
        onClose={() => setMultipleDeleteConfirmation({ isOpen: false })}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>Confirm Multiple Delete</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography>
            Are you sure you want to delete {selectedRecords.length}{" "}
            {selectedRecords.length === 1 ? "record" : "records"}? This action
            cannot be undone.
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button
            onClick={() => setMultipleDeleteConfirmation({ isOpen: false })}
            color="primary"
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handleConfirmMultipleDelete}
            color="error"
            variant="contained"
          >
            Delete
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
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </Wrapper.Box>
  );
};

export default MilkProduction;

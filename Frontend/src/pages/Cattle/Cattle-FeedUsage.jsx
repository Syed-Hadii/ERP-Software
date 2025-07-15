import { useState, useEffect, useCallback } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";

const CattleFeedUsage = () => {
  const theme = Wrapper.useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const [feedUsageRecords, setFeedUsageRecords] = useState([]);
  const [cattleOptions, setCattleOptions] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState({
    key: "date",
    order: "desc",
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10; // Matches backend default limit

  const feedUsageFields = [
    {
      name: "cattleId",
      label: "Cattle",
      type: "select",
      options: cattleOptions.map((c) => ({
        value: c._id,
        label: c.cattleId,
      })),
      validation: { required: true },
    },
    {
      name: "productId",
      label: "Feed Item",
      type: "select",
      options: feedItems?.map((i) => ({
        value: i?.item?._id,
        label: `${i?.item?.name} (${i?.quantity} ${i?.item?.unit} available)`,
      })),
      validation: { required: true },
    },
    {
      name: "quantityUsed",
      label: "Quantity Used",
      placeholder: "Enter quantity used",
      type: "number",
      validation: { required: true, min: 0 },
    },
    {
      name: "operator",
      label: "Operator",
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
      placeholder: "Enter notes (optional)",
      type: "text",
      multiline: true,
      rows: 3,
      validation: { required: false },
    },
  ];

  const feedUsageColumns = [
    { key: "cattleId.cattleId", label: "Cattle ID", sortable: true },
    { key: "productId.name", label: "Feed Item", sortable: true },
    { key: "quantityUsed", label: "Quantity Used", sortable: true },
    { key: "productId.unit", label: "Unit", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "operator", label: "Operator", sortable: true },
    { key: "notes", label: "Notes", sortable: true },
  ];

  const showNotification = useCallback((message, severity = "success") => {
    setNotification({ open: true, message, severity });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, cattleRes, inventoryRes, employeeRes] =
        await Promise.all([
          Wrapper.axios.get(`${BASE_URL}/feed-usage/list`, {
            params: {
              page: currentPage,
              limit: recordsPerPage,
              sortBy: sortOrder.key,
              order: sortOrder.order,
              ...(searchQuery && { cattleId: searchQuery }),
            },
          }),
          Wrapper.axios.get(`${BASE_URL}/cattle/active`),

          Wrapper.axios.get(`${BASE_URL}/inventory/cattle?all=true`),
          Wrapper.axios.get(`${BASE_URL}/employees/`),
        ]);
      console.log("record", cattleRes);
      setFeedUsageRecords(
        Array.isArray(recordsRes.data.data) ? recordsRes.data.data : []
      );
      setTotalRecords(recordsRes.data.pagination?.total || 0);
      setCattleOptions(
        Array.isArray(cattleRes.data.cattle) ? cattleRes.data.cattle : []
      );
      setFeedItems(
        Array.isArray(inventoryRes.data.inventoryList)
          ? inventoryRes.data.inventoryList
          : []
      );
      setEmployees(
        Array.isArray(employeeRes.data.data)
          ? employeeRes.data.data.filter((emp) => emp.department === "Cattle")
          : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Failed to fetch feed usage data", "error");
      setFeedUsageRecords([]);
      setTotalRecords(0);
      setCattleOptions([]);
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    showNotification("Refreshing feed usage data...", "info");
  };

  const handleLogFeedUsage = async (form) => {
    try {
      setLoading(true);
      const payload = {
        cattleId: form.cattleId,
        productId: form.productId,
        quantityUsed: parseFloat(form.quantityUsed),
        operator: form.operator,
        notes: form.notes,
      };
      const response = await Wrapper.axios.post(
        `${BASE_URL}/feed-usage/log`,
        payload
      );
      if (response.data.success) {
        showNotification("Feed usage logged successfully", "success");
        setAddOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error logging feed usage:", error);
      showNotification(
        error.response?.data?.message || "Failed to log feed usage",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/feed-usage/${deleteId}`
      );
      if (response.data.success) {
        showNotification("Record deleted successfully", "success");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      showNotification("Failed to delete record", "error");
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      const deletePromises = selectedRecords.map((id) =>
        Wrapper.axios.delete(`${BASE_URL}/feed-usage/${id}`)
      );
      await Promise.all(deletePromises);
      setSelectedRecords([]);
      fetchData();
      showNotification(
        `${selectedRecords.length} records deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting records:", error);
      showNotification("Failed to delete selected records", "error");
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
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
      setSelectedRecords(feedUsageRecords.map((record) => record._id));
    } else {
      setSelectedRecords([]);
    }
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const searchedRecords = feedUsageRecords.filter(
    (record) =>
      record.cattleId?.cattleId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.productId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRecords = [...searchedRecords].sort((a, b) => {
    const getNestedValue = (obj, key) => {
      const keys = key.split(".");
      let value = obj;
      for (const k of keys) {
        if (value && typeof value === "object") value = value[k];
        else return undefined;
      }
      return value;
    };
    const aValue = getNestedValue(a, sortOrder.key);
    const bValue = getNestedValue(b, sortOrder.key);
    if (sortOrder.order === "asc") return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const currentRecords = sortedRecords;

  useEffect(() => {
    fetchData();
  }, [refreshTrigger, currentPage, sortOrder, searchQuery]);

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
            Feed Usage Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Track and manage feed usage for cattle
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
            placeholder="Search by cattle ID or feed item..."
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
            variant="outlined"
            color="primary"
            startIcon={<Wrapper.RefreshIcon />}
            onClick={refreshData}
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
          <Wrapper.Button
            variant="contained"
            color="primary"
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
            Log Feed Usage
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : currentRecords.length === 0 ? (
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
            No Feed Usage Records Found
          </Wrapper.Typography>
          <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
            Log feed usage to add records
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            color="primary"
            startIcon={<Wrapper.RefreshIcon />}
            onClick={refreshData}
          >
            Refresh
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
              {totalRecords} {totalRecords === 1 ? "Record" : "Records"}{" "}
              {searchQuery && `matching "${searchQuery}"`}
            </Wrapper.Typography>
            <Wrapper.Tooltip title="Refresh">
              <Wrapper.IconButton size="small" onClick={refreshData}>
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
                        selectedRecords.length > 0 &&
                        selectedRecords.length < currentRecords.length
                      }
                      checked={
                        currentRecords.length > 0 &&
                        selectedRecords.length === currentRecords.length
                      }
                      onChange={handleSelectAll}
                      sx={{ "&.Mui-checked": { color: "primary.main" } }}
                    />
                  </Wrapper.TableCell>
                  {feedUsageColumns.map((column) => (
                    <Wrapper.TableCell
                      key={column.key}
                      onClick={
                        column.sortable ? () => handleSort(column.key) : null
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
                {currentRecords.map((record) => (
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
                      {record.cattleId?.cattleId || "Unknown"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {record.productId?.name || "Unknown"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{record.quantityUsed}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {record.productId?.unit || "N/A"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {formatDate(record.date)}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>{record.operator}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {record.notes || "N/A"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Tooltip title="Delete Event">
                        <Wrapper.IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteId(record._id);
                            setOpenDelete(true);
                          }}
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
                      </Wrapper.Tooltip>
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
              {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)} -{" "}
              {Math.min(currentPage * recordsPerPage, totalRecords)} of{" "}
              {totalRecords} records
            </Wrapper.Typography>
            <Wrapper.Pagination
              count={totalPages}
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

      <ReusableModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Log Feed Usage"
        fields={feedUsageFields}
        values={{
          cattleId: "",
          productId: "",
          quantityUsed: "",
          operator: "",
          notes: "",
        }}
        onSubmit={handleLogFeedUsage}
        loading={loading}
      />

      <Wrapper.Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>Confirm Delete</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography>
            Are you sure you want to delete this feed usage record? This action
            cannot be undone.
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button onClick={() => setOpenDelete(false)} color="primary">
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

export default CattleFeedUsage;

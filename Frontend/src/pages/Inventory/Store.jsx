import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";

const Store = () => {
  const theme = Wrapper.useTheme();
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState({
    key: "item.name",
    order: "asc",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedInventories, setSelectedInventories] = useState([]);
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
  const recordsPerPage = 7;

  const inventoryFields = [
    {
      name: "item",
      label: "Item",
      type: "select",
      options: items.map((item) => ({ value: item._id, label: item.name })),
      validation: { required: true },
    },
    {
      name: "quantity",
      label: "Quantity",
      placeholder: "Enter quantity",
      type: "number",
      validation: { required: true },
    },
  ];

  const inventoryColumns = [
    { key: "item.name", label: "Item Name", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "avgCost", label: "Avg Cost", sortable: true },
    { key: "totalCost", label: "Total Cost", sortable: true },
    { key: "item.unit", label: "Unit", sortable: true },
    { key: "updatedAt", label: "Last Updated", sortable: true },
  ];

  // Fetch all available items
  const fetchItems = async () => {
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/items/view?all=true`
      );
      if (response.data && response.data.items) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      showNotification("Failed to fetch items", "error");
    }
  };

  // Fetch inventory for manager
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/inventory/manager?page=${currentPage}`
      );
      console.log("Inventory response:", response);
      if (response.data) {
        setInventory(response.data.inventoryList);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      } else {
        setInventory([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      showNotification("Failed to fetch inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const refreshInventory = () => {
    setRefreshTrigger((prev) => prev + 1);
    showNotification("Refreshing inventory data...", "info");
  };

  const handleEditOpen = (inventory) => {
    setSelectedInventory(inventory);
    setEditOpen(true);
  };

  const handleEdit = async (form) => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.put(`${BASE_URL}/inventory/update`, {
        id: selectedInventory._id,
        quantity: form.quantity,
        totalCost: form.totalCost || 0,
        averageCost: form.averageCost || 0,
        owner: "manager",
      });
      if (response.data.success) {
        showNotification("Inventory updated successfully", "success");
        setEditOpen(false);
        fetchInventory();
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      showNotification("Failed to update inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/inventory/delete/${deleteId}`
      );
      if (response.data.success) {
        showNotification("Inventory deleted successfully", "success");
        fetchInventory();
      } else {
        showNotification("Error deleting inventory", "error");
      }
    } catch (error) {
      console.error("Error deleting inventory:", error);
      showNotification("Error deleting inventory", "error");
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      const deletePromises = selectedInventories.map((id) =>
        Wrapper.axios.delete(`${BASE_URL}/inventory/delete/${id}`)
      );

      await Promise.all(deletePromises);
      setSelectedInventories([]);
      fetchInventory();
      showNotification(
        `${selectedInventories.length} items deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting inventory items:", error);
      showNotification("Failed to delete selected items", "error");
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

  const handleSelectInventory = (id) => {
    setSelectedInventories((prev) =>
      prev.includes(id) ? prev.filter((invId) => invId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedInventories(filteredInventory.map((inv) => inv._id));
    else setSelectedInventories([]);
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Format date for display
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

  // Filter and sort inventory items
  const filteredInventory = inventory
    .filter((inv) => {
      // If item is populated, search in item name
      if (inv.item && typeof inv.item === "object") {
        return inv.item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true; // If item is not populated, include in results
    })
    .sort((a, b) => {
      // Handle nested object properties like item.name
      const getNestedValue = (obj, key) => {
        const keys = key.split(".");
        let value = obj;
        for (const k of keys) {
          if (value && typeof value === "object") {
            value = value[k];
          } else {
            return undefined;
          }
        }
        return value;
      };

      const aValue = getNestedValue(a, sortOrder.key);
      const bValue = getNestedValue(b, sortOrder.key);

      if (sortOrder.order === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  useEffect(() => {
    fetchItems();
    fetchInventory();
  }, [currentPage, searchQuery, refreshTrigger]);

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
            Inventory Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your organization&apos;s inventory
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
            placeholder="Search inventory..."
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
            color="success"
            startIcon={<Wrapper.RefreshIcon />}
            onClick={refreshInventory}
            
          >
            Refresh
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() =>
              selectedInventories.length > 0
                ? setMultipleDeleteConfirmation({ isOpen: true })
                : showNotification("No items selected", "warning")
            }
            disabled={selectedInventories.length === 0}
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
      </Wrapper.Box>

      {/* Table or No Inventory Message */}
      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : filteredInventory.length === 0 ? (
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
            No inventory items found
          </Wrapper.Typography>
          <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
            Items received from vendors will automatically appear here
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            color="success"
            startIcon={<Wrapper.RefreshIcon />}
            onClick={refreshInventory}
          >
            Refresh Inventory
          </Wrapper.Button>
        </Wrapper.Card>
      ) : (
        <>
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
                {filteredInventory.length}{" "}
                {filteredInventory.length === 1 ? "Item" : "Items"}{" "}
                {searchQuery && `matching "${searchQuery}"`}
              </Wrapper.Typography>
              <Wrapper.Tooltip title="Refresh inventory">
                <Wrapper.IconButton size="small" onClick={refreshInventory}>
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
                          selectedInventories.length > 0 &&
                          selectedInventories.length < filteredInventory.length
                        }
                        checked={
                          filteredInventory.length > 0 &&
                          selectedInventories.length ===
                            filteredInventory.length
                        }
                        onChange={handleSelectAll}
                        sx={{ "&.Mui-checked": { color: "primary.main" } }}
                      />
                    </Wrapper.TableCell>
                    {inventoryColumns.map((column) => (
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
                              <Wrapper.ArrowDownowwardIcon
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
                  {filteredInventory.map((inv) => (
                    <Wrapper.TableRow
                      key={inv._id}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: Wrapper.alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                        },
                        ...(selectedInventories.includes(inv._id) && {
                          bgcolor: Wrapper.alpha(
                            theme.palette.primary.main,
                            0.08
                          ),
                        }),
                      }}
                    >
                      <Wrapper.TableCell padding="checkbox">
                        <Wrapper.Checkbox
                          checked={selectedInventories.includes(inv._id)}
                          onChange={() => handleSelectInventory(inv._id)}
                          sx={{ "&.Mui-checked": { color: "primary.main" } }}
                        />
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {inv.item && typeof inv.item === "object"
                          ? inv.item.name
                          : "Unknown Item"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>{inv.quantity}</Wrapper.TableCell>
                      <Wrapper.TableCell>PKR {inv.totalCost/inv.quantity}</Wrapper.TableCell>
                      <Wrapper.TableCell>PKR {inv.totalCost}</Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {inv.item && typeof inv.item === "object"
                          ? inv.item.unit || "N/A"
                          : "N/A"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {formatDate(inv.updatedAt)}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                          <Wrapper.Tooltip title="Edit">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => handleEditOpen(inv)}
                              sx={{ color: "#FBC02D" }}
                            >
                              <Wrapper.EditIcon fontSize="small" />
                            </Wrapper.IconButton>
                          </Wrapper.Tooltip>
                          <Wrapper.Tooltip title="Delete">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => {
                                setDeleteId(inv._id);
                                setOpenDelete(true);
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
                  filteredInventory.length
                )}{" "}
                -{" "}
                {Math.min(
                  currentPage * recordsPerPage,
                  filteredInventory.length
                )}{" "}
                of {filteredInventory.length} items
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
        </>
      )}

      {/* Modals for Edit, Delete */}
      <ReusableModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Inventory Item"
        fields={inventoryFields}
        values={{
          ...selectedInventory,
          // Handle the case where item is an object with _id
          item: selectedInventory?.item?._id || selectedInventory?.item,
        }}
        onSubmit={handleEdit}
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
            Are you sure you want to delete this inventory item? This action
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
            Are you sure you want to delete {selectedInventories.length}{" "}
            {selectedInventories.length === 1
              ? "inventory item"
              : "inventory items"}
            ? This action cannot be undone.
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
        Thread 1:{" "}
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

export default Store;

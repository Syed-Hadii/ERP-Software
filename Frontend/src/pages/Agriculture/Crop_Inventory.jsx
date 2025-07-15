import { useState, useEffect, useMemo } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";

const CropInventory = () => {
  const theme = Wrapper.useTheme();
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [crops, setCrops] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [allVarieties, setAllVarieties] = useState([]);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const recordsPerPage = 7;

  // Fetch crops and varieties
  const fetchCropsAndVarieties = async () => {
    try {
      const [cropsRes, varietiesRes] = await Promise.all([
        Wrapper.axios.get(`${BASE_URL}/crop/getcrop`),
        Wrapper.axios.get(`${BASE_URL}/crop/getVariety`),
      ]);
      setCrops(cropsRes?.data?.crop || []);
      setAllVarieties(varietiesRes?.data?.crop || []);
    } catch (error) {
      console.error("Error fetching crops and varieties:", error);
      showNotification("Failed to load crops and varieties", "error");
      setCrops([]);
      setAllVarieties([]);
    }
  };

  // Filter varieties when crop is selected
  const filterVarieties = (cropId) => {
    if (!cropId || !Array.isArray(allVarieties)) {
      setVarieties([]);
      return;
    }
    const filteredVarieties = allVarieties.filter(
      (variety) => variety.crop === cropId || variety.cropId === cropId
    );
    setVarieties(filteredVarieties);
  };

  // Handle field change for crop selection
  const handleFieldChange = (name, value, setForm) => {
    if (name === "crop") {
      filterVarieties(value);
    }
  };

  // Handle add stock
  const handleAddStock = async (form) => {
    try {
      setLoading(true);
      console.log("form", form);
      const response = await Wrapper.axios.post(
        `${BASE_URL}/agro-inventory/add`,
        {
          crop: form.crop,
          variety: form.variety,
          quantity: Number(form.quantity),
          fairValuePerUnit: Number(form.fairValuePerUnit),
          unit: form.unit,
        }
      );
      if (response.data.success) {
        showNotification("Stock added successfully", "success");
        setAddStockOpen(false);
        fetchInventory();
      } else {
        showNotification(
          response.data.message || "Failed to add stock",
          "error"
        );
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      showNotification("Failed to add stock", "error");
    } finally {
      setLoading(false);
    }
  };

  const inventoryFields = [
    {
      name: "item",
      label: "Item",
      type: "select",
      options: items
        .filter((item) =>
          ["seed", "fertilizer", "pesticide"].includes(
            item.category?.toLowerCase()
          )
        )
        .map((item) => ({ value: item._id, label: item.name })),
      validation: { required: true },
    },
    {
      name: "quantity",
      label: "Quantity",
      placeholder: "Enter quantity",
      type: "number",
      validation: { required: true },
    },
    {
      name: "unit",
      label: "Unit",
      placeholder: "e.g., kg, pcs",
      type: "text",
      validation: { required: true },
    },
  ];

  const agroStockFields = [
    {
      name: "crop",
      label: "Crop",
      type: "select",
      options: crops.map((crop) => ({ value: crop._id, label: crop.name })),
      validation: { required: true },
    },
    {
      name: "variety",
      label: "Variety",
      type: "select",
      options: varieties.map((variety) => ({
        value: variety._id,
        label: variety.variety || variety.name || "Unknown Variety",
      })),
      validation: { required: true },
    },
    {
      name: "quantity",
      label: "Quantity",
      placeholder: "Enter quantity",
      type: "number",
      validation: { required: true, min: 0.01 },
    },
    {
      name: "fairValuePerUnit",
      label: "Fair Value Per Unit",
      placeholder: "Enter fair value per unit",
      type: "number",
      validation: { required: true, min: 0 },
    },
    {
      name: "unit",
      label: "Unit",
      placeholder: "e.g., kg, pcs",
      type: "text",
      validation: { required: true },
    },
  ];

  const inventoryColumns = [
    { key: "item.name", label: "Item Name", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "avgCost", label: "Avg Cost", sortable: true },
    { key: "totalCost", label: "Total Cost", sortable: true },
    { key: "unit", label: "Unit", sortable: true },
    { key: "updatedAt", label: "Last Updated", sortable: true },
  ];

  const cropStockColumns = [
    { key: "crop.name", label: "Crop Name", sortable: true },
    { key: "variety.variety", label: "Variety", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "averageCost", label: "Avg Cost", sortable: true },
    { key: "totalCost", label: "Total Cost", sortable: true },
    { key: "unit", label: "Unit", sortable: true },
    { key: "lastUpdated", label: "Last Updated", sortable: true },
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

  // Fetch all inventory items
  // Fetch all inventory items
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [inventoryResponse, agroInventoryResponse] = await Promise.all([
        Wrapper.axios.get(`${BASE_URL}/inventory/agriculture?all=true`),
        Wrapper.axios.get(`${BASE_URL}/agro-inventory?all=true`),
      ]);

      console.log("Inventory response:", inventoryResponse.data);
      console.log("Agro Inventory response:", agroInventoryResponse.data);

      let combinedInventory = [];

      if (inventoryResponse.data) {
        combinedInventory = [...inventoryResponse.data.inventoryList];
      }

      if (agroInventoryResponse.data && agroInventoryResponse.data.data) {
        // Map agro-inventory items to include crop and variety objects
        const mappedAgroInventory = agroInventoryResponse.data.data.map(
          (item) => {
            const crop = crops.find(
              (c) => c._id === item.crop || c._id === item.cropId
            ) || { name: "Unknown Crop" };
            const variety = allVarieties.find(
              (v) => v._id === item.variety || v._id === item.varietyId
            ) || { variety: "Unknown Variety" };
            return {
              ...item,
              crop: { _id: crop._id, name: crop.name || "Unknown Crop" },
              variety: {
                _id: variety._id,
                variety: variety.variety || variety.name || "Unknown Variety",
              },
              averageCost: item.fairValuePerUnit || 0,
              totalCost: item.quantity * (item.fairValuePerUnit || 0) || 0,
              lastUpdated: item.updatedAt || new Date().toISOString(),
            };
          }
        );
        combinedInventory = [...combinedInventory, ...mappedAgroInventory];
      }

      console.log("Combined Inventory:", combinedInventory); // Debug log
      setInventory(combinedInventory);
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

    // If editing a crop stock item, filter varieties based on crop
    if (selectedTab === 2 && inventory.crop) {
      filterVarieties(inventory.crop._id);
    }

    setEditOpen(true);
  };

  const handleEdit = async (form) => {
    try {
      setLoading(true);

      // Different API endpoint based on the tab
      if (selectedTab === 2) {
        // For Crop Stock tab
        const response = await Wrapper.axios.put(
          `${BASE_URL}/agro-inventory/${selectedInventory._id}`,
          {
            quantity: Number(form.quantity),
            fairValuePerUnit: Number(form.fairValuePerUnit),
            unit: form.unit,
          }
        );

        if (response.data.success) {
          showNotification("Crop stock updated successfully", "success");
          setEditOpen(false);
          fetchInventory();
        }
      } else {
        // For other inventory tabs
        const response = await Wrapper.axios.put(
          `${BASE_URL}/inventory/update`,
          {
            id: selectedInventory._id,
            ...form,
            owner: "manager",
          }
        );

        if (response.data.success) {
          showNotification("Inventory updated successfully", "success");
          setEditOpen(false);
          fetchInventory();
        }
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
      let response;

      if (selectedTab === 2) {
        // For Crop Stock tab
        response = await Wrapper.axios.delete(
          `${BASE_URL}/agro-inventory/${deleteId}`
        );
      } else {
        // For other inventory tabs
        response = await Wrapper.axios.delete(
          `${BASE_URL}/inventory/delete/${deleteId}`
        );
      }

      if (response.data.success) {
        showNotification("Item deleted successfully", "success");
        fetchInventory();
      } else {
        showNotification("Error deleting item", "error");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      showNotification("Error deleting item", "error");
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      const deletePromises = selectedInventories.map((id) => {
        if (selectedTab === 2) {
          // For Crop Stock tab
          return Wrapper.axios.delete(`${BASE_URL}/agroInventory/${id}`);
        } else {
          // For other inventory tabs
          return Wrapper.axios.delete(`${BASE_URL}/inventory/delete/${id}`);
        }
      });

      await Promise.all(deletePromises);
      setSelectedInventories([]);
      fetchInventory();
      showNotification(
        `${selectedInventories.length} items deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting items:", error);
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
    if (e.target.checked) {
      setSelectedInventories(currentItems.map((inv) => inv._id));
    } else {
      setSelectedInventories([]);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter inventory based on selected tab
  const tabInventory = inventory.filter((inv) => {
    if (selectedTab === 2) {
      // For Crop Stock tab, show items with crop and variety fields
      return inv.crop !== undefined;
    }
    const category = inv.item?.category;
    return selectedTab === 0
      ? category !== "equipment"
      : category === "equipment";
  });

  // Apply search query filter
  const searchedInventory = tabInventory.filter((inv) => {
    if (selectedTab === 2) {
      // For Crop Stock tab
      const cropName = typeof inv.crop === "object" ? inv.crop.name : inv.crop;
      const varietyName =
        typeof inv.variety === "object"
          ? inv.variety.variety || inv.variety.name
          : inv.variety;

      return (
        cropName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        varietyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // For other tabs
    return inv.item?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort the searched inventory
  const filteredAndSortedInventory = [...searchedInventory]
    .filter((inv) =>
      ["seed", "pesticide", "fertilizer", "equipment"].includes(
        inv.item?.category?.toLowerCase()
      )
    )
    .sort((a, b) => {
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

  const sortedInventory = filteredAndSortedInventory;

  // Calculate total pages and current items
  const totalPages = Math.ceil(searchedInventory.length / recordsPerPage);
  const currentItems = sortedInventory.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  useEffect(() => {
    fetchItems();
    fetchInventory();
    fetchCropsAndVarieties();
  }, [refreshTrigger]);

  useEffect(() => {
    setSelectedInventories([]);
  }, [searchQuery]);

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

      {/* Tabs Section */}
      <Wrapper.Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Wrapper.Tabs
          value={selectedTab}
          onChange={(e, newValue) => {
            setSelectedTab(newValue);
            setCurrentPage(1);
            setSelectedInventories([]);
          }}
          aria-label="inventory tabs"
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            "& .MuiTab-root": { fontWeight: "bold" },
          }}
        >
          <Wrapper.Tab label="Agro Inventory" />
          <Wrapper.Tab label="Machinery and Equipment" />
          <Wrapper.Tab label="Crop Stock" />
        </Wrapper.Tabs>
      </Wrapper.Box>

      {/* Add Stock Button for Crop Stock Tab */}
      {selectedTab === 2 && (
        <Wrapper.Box
          sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}
        >
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddStockOpen(true)}
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
            Add Stock
          </Wrapper.Button>
        </Wrapper.Box>
      )}

      {/* Table or No Inventory Message */}
      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : searchedInventory.length === 0 ? (
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
            No{" "}
            {selectedTab === 0
              ? "Agro Inventory"
              : selectedTab === 1
              ? "Machinery and Equipment"
              : "Crop Stock"}{" "}
            items found
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
                {searchedInventory.length}{" "}
                {searchedInventory.length === 1 ? "Item" : "Items"}{" "}
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
                          selectedInventories.length < currentItems.length
                        }
                        checked={
                          currentItems.length > 0 &&
                          selectedInventories.length === currentItems.length
                        }
                        onChange={handleSelectAll}
                        sx={{ "&.Mui-checked": { color: "primary.main" } }}
                      />
                    </Wrapper.TableCell>
                    {(selectedTab === 2
                      ? cropStockColumns
                      : inventoryColumns
                    ).map((column) => (
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
                  {currentItems.map((inv) => (
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
                      {selectedTab === 2 ? (
                        // Crop Stock columns
                        <Wrapper.TableBody>
                          {currentItems.map((inv) => {
                            console.log("Rendering item:", inv); // Debug log
                            return (
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
                                    checked={selectedInventories.includes(
                                      inv._id
                                    )}
                                    onChange={() =>
                                      handleSelectInventory(inv._id)
                                    }
                                    sx={{
                                      "&.Mui-checked": {
                                        color: "primary.main",
                                      },
                                    }}
                                  />
                                </Wrapper.TableCell>
                                {selectedTab === 2 ? (
                                  // Crop Stock columns
                                  <>
                                    <Wrapper.TableCell>
                                      {inv.crop && typeof inv.crop === "object"
                                        ? inv.crop.name || "Unknown Crop"
                                        : typeof inv.crop === "string"
                                        ? inv.crop
                                        : "Unknown Crop"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.variety &&
                                      typeof inv.variety === "object"
                                        ? inv.variety.variety ||
                                          inv.variety.name ||
                                          "Unknown Variety"
                                        : typeof inv.variety === "string"
                                        ? inv.variety
                                        : "Unknown Variety"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.quantity || "N/A"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.averageCost || "N/A"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.totalCost || "N/A"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.unit || "N/A"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {formatDate(
                                        inv.lastUpdated ||
                                          inv.updatedAt ||
                                          new Date()
                                      )}
                                    </Wrapper.TableCell>
                                  </>
                                ) : (
                                  // Regular inventory columns
                                  <>
                                    <Wrapper.TableCell>
                                      {inv.item && typeof inv.item === "object"
                                        ? inv.item.name
                                        : "Unknown Item"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.quantity}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.totalCost / inv.quantity}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.totalCost}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {inv.item && typeof inv.item === "object"
                                        ? inv.item.unit
                                        : "N/A"}
                                    </Wrapper.TableCell>
                                    <Wrapper.TableCell>
                                      {formatDate(inv.updatedAt)}
                                    </Wrapper.TableCell>
                                  </>
                                )}
                                <Wrapper.TableCell>
                                  <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                                    <Wrapper.IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleEditOpen(inv)}
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
                                      onClick={() => {
                                        setDeleteId(inv._id);
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
                                  </Wrapper.Box>
                                </Wrapper.TableCell>
                              </Wrapper.TableRow>
                            );
                          })}
                        </Wrapper.TableBody>
                      ) : (
                        // Regular inventory columns
                        <>
                          <Wrapper.TableCell>
                            {inv.item && typeof inv.item === "object"
                              ? inv.item.name
                              : "Unknown Item"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>{inv.quantity}</Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {inv.totalCost / inv.quantity}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>{inv.totalCost}</Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {" "}
                            {inv.item && typeof inv.item === "object"
                              ? inv.item.unit
                              : "N/A"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {formatDate(inv.updatedAt)}
                          </Wrapper.TableCell>
                        </>
                      )}
                      <Wrapper.TableCell>
                        <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                          <Wrapper.IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditOpen(inv)}
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
                            onClick={() => {
                              setDeleteId(inv._id);
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
                  searchedInventory.length
                )}{" "}
                -{" "}
                {Math.min(
                  currentPage * recordsPerPage,
                  searchedInventory.length
                )}{" "}
                of {searchedInventory.length} items
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

      {/* Modals for Edit, Delete, Add Stock */}
      <ReusableModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={selectedTab === 2 ? "Edit Crop Stock" : "Edit Inventory Item"}
        fields={
          selectedTab === 2
            ? [
                {
                  name: "quantity",
                  label: "Quantity",
                  placeholder: "Enter quantity",
                  type: "number",
                  validation: { required: true, min: 0.01 },
                },
                {
                  name: "fairValuePerUnit",
                  label: "Fair Value Per Unit",
                  placeholder: "Enter fair value per unit",
                  type: "number",
                  validation: { required: true, min: 0 },
                },
                {
                  name: "unit",
                  label: "Unit",
                  placeholder: "e.g., kg, pcs",
                  type: "text",
                  validation: { required: true },
                },
              ]
            : inventoryFields
        }
        values={{
          ...selectedInventory,
          item: selectedInventory?.item?._id || selectedInventory?.item,
          fairValuePerUnit: selectedInventory?.averageCost,
        }}
        onSubmit={handleEdit}
        onFieldChange={handleFieldChange}
        loading={loading}
      />

      <ReusableModal
        open={addStockOpen}
        onClose={() => setAddStockOpen(false)}
        title="Add Crop Stock"
        fields={agroStockFields}
        onSubmit={handleAddStock}
        onFieldChange={handleFieldChange}
        loading={loading}
        submitButtonText="Add Stock"
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

export default CropInventory;

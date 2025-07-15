import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";

const Item = () => {
  const theme = Wrapper.useTheme();
  const [itemList, setItemList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
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
  const [addCategory, setAddCategory] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const recordsPerPage = 10;

  // Base fields for all item types
  const baseFields = [
    {
      name: "name",
      label: "Item Name",
      placeholder: "Enter item name",
      type: "text",
      validation: { required: true },
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Enter description",
      type: "text",
      validation: { required: false },
    },
    {
      name: "unit",
      label: "Unit",
      placeholder: "Enter unit",
      type: "text",
      validation: { required: true },
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "fertilizer", label: "Fertilizer" },
        { value: "pesticide", label: "Pesticide" },
        { value: "seed", label: "Seed" },
        { value: "equipment", label: "Equipment" },
        { value: "medicine", label: "Medicine" },
        { value: "cattle_feed", label: "Cattle Feed" },
        { value: "tools", label: "Tools" },
        { value: "packaging", label: "Packaging" },
        { value: "fuel_lubricants", label: "Fuel & Lubricants" },
        { value: "irrigation_supplies", label: "Irrigation Supplies" },
      ],
      validation: { required: true },
    },
    {
      name: "lowStockThreshold",
      label: "Low Stock Threshold",
      placeholder: "Enter low stock threshold",
      type: "number",
      validation: { required: false, min: 0 },
    },
  ];

  // Category-specific fields
  const categoryFields = {
    fertilizer: [
      {
        name: "companyName",
        label: "Company Name",
        placeholder: "Enter company name",
        type: "text",
        validation: { required: true },
      },
      {
        name: "nutrientComposition",
        label: "Nutrient Composition",
        placeholder: "e.g., N-P-K ratio",
        type: "text",
        validation: { required: true },
      },
      {
        name: "form",
        label: "Form",
        type: "select",
        options: [
          { value: "granular", label: "Granular" },
          { value: "liquid", label: "Liquid" },
          { value: "powder", label: "Powder" },
        ],
        validation: { required: true },
      },
      {
        name: "applicationRate",
        label: "Application Rate",
        placeholder: "e.g., 50kg/acre",
        type: "text",
        validation: { required: false },
      },
    ],
    pesticide: [
      {
        name: "companyName",
        label: "Company Name",
        placeholder: "Enter company name",
        type: "text",
        validation: { required: true },
      },
      {
        name: "activeIngredient",
        label: "Active Ingredient",
        placeholder: "e.g., Glyphosate",
        type: "text",
        validation: { required: true },
      },
      {
        name: "formulation",
        label: "Formulation",
        type: "select",
        options: [
          { value: "EC", label: "EC (Emulsifiable Concentrate)" },
          { value: "WP", label: "WP (Wettable Powder)" },
          { value: "SL", label: "SL (Soluble Liquid)" },
          { value: "SC", label: "SC (Suspension Concentrate)" },
        ],
        validation: { required: true },
      },
      {
        name: "safetyInterval",
        label: "Safety Interval",
        placeholder: "e.g., 7 days",
        type: "text",
        validation: { required: false },
      },
    ],
    seed: [
      {
        name: "companyName",
        label: "Company Name",
        placeholder: "Enter company name",
        type: "text",
        validation: { required: true },
      },
      {
        name: "variety",
        label: "Variety",
        placeholder: "e.g., 1509",
        type: "text",
        validation: { required: true },
      },
      {
        name: "productionYear",
        label: "Production Year",
        placeholder: "e.g., 2024",
        type: "number",
        validation: { required: false },
      },
      {
        name: "batchNumber",
        label: "Batch Number",
        placeholder: "Enter batch number",
        type: "text",
        validation: { required: false },
      },
      {
        name: "germinationRate",
        label: "Germination Rate (%)",
        placeholder: "e.g., 95",
        type: "number",
        validation: { required: false },
      },
      {
        name: "lotNumber",
        label: "Lot Number",
        placeholder: "Enter lot number",
        type: "text",
        validation: { required: false },
      },
      {
        name: "seedTreatment",
        label: "Seed Treatment",
        placeholder: "e.g., Fungicide-coated",
        type: "text",
        validation: { required: false },
      },
    ],
    equipment: [
      {
        name: "manufacturer",
        label: "Manufacturer",
        placeholder: "e.g., John Deere",
        type: "text",
        validation: { required: true },
      },
      {
        name: "model",
        label: "Model",
        placeholder: "e.g., X300",
        type: "text",
        validation: { required: true },
      },
      {
        name: "variant",
        label: "Variant",
        placeholder: "e.g., Sport Edition",
        type: "text",
        validation: { required: false },
      },
      {
        name: "serialNumber",
        label: "Serial Number",
        placeholder: "Enter unique serial number",
        type: "text",
        validation: { required: false },
      },
      {
        name: "purchaseDate",
        label: "Purchase Date",
        placeholder: "Select date",
        type: "date",
        validation: { required: false },
      },
      {
        name: "warrantyPeriod",
        label: "Warranty Period",
        placeholder: "e.g., 2 years",
        type: "text",
        validation: { required: false },
      },
      {
        name: "maintenanceSchedule",
        label: "Maintenance Schedule",
        placeholder: "e.g., Every 6 months",
        type: "text",
        validation: { required: false },
      },
    ],
    medicine: [
      {
        name: "companyName",
        label: "Company Name",
        placeholder: "e.g., VetHealth Labs",
        type: "text",
        validation: { required: true },
      },
      {
        name: "batchNumber",
        label: "Batch Number",
        placeholder: "Enter batch number",
        type: "text",
        validation: { required: false },
      },
      {
        name: "expiryDate",
        label: "Expiry Date",
        placeholder: "Select date",
        type: "date",
        validation: { required: false },
      },
      {
        name: "dosageForm",
        label: "Dosage Form",
        type: "select",
        options: [
          { value: "tablet", label: "Tablet" },
          { value: "syrup", label: "Syrup" },
          { value: "injectable", label: "Injectable" },
        ],
        validation: { required: true },
      },
      {
        name: "activeCompound",
        label: "Active Compound",
        placeholder: "e.g., Ivermectin",
        type: "text",
        validation: { required: true },
      },
      {
        name: "withdrawalPeriod",
        label: "Withdrawal Period",
        placeholder: "e.g., 14 days",
        type: "text",
        validation: { required: false },
      },
    ],
    cattle_feed: [
      {
        name: "type",
        label: "Feed Type",
        placeholder: "e.g., Makka, Chokar, Khal",
        type: "text",
        validation: { required: true },
      },
      {
        name: "origin",
        label: "Origin",
        placeholder: "Local or Imported",
        type: "text",
        validation: { required: false },
      },
    ],
    tools: [
      {
        name: "manufacturer",
        label: "Manufacturer",
        placeholder: "e.g., Bosch",
        type: "text",
        validation: { required: true },
      },
      {
        name: "type",
        label: "Tool Type",
        type: "select",
        options: [
          { value: "hand_tool", label: "Hand Tool" },
          { value: "power_tool", label: "Power Tool" },
          { value: "farm_implement", label: "Farm Implement" },
        ],
        validation: { required: true },
      },
      {
        name: "condition",
        label: "Condition",
        type: "select",
        options: [
          { value: "new", label: "New" },
          { value: "used", label: "Used" },
          { value: "refurbished", label: "Refurbished" },
        ],
        validation: { required: false },
      },
      {
        name: "purchaseDate",
        label: "Purchase Date",
        placeholder: "Select date",
        type: "date",
        validation: { required: false },
      },
    ],
    packaging: [
      {
        name: "material",
        label: "Material",
        type: "select",
        options: [
          { value: "plastic", label: "Plastic" },
          { value: "paper", label: "Paper" },
          { value: "cardboard", label: "Cardboard" },
          { value: "biodegradable", label: "Biodegradable" },
        ],
        validation: { required: true },
      },
      {
        name: "capacity",
        label: "Capacity",
        placeholder: "e.g., 5L, 1kg",
        type: "text",
        validation: { required: true },
      },
      {
        name: "supplier",
        label: "Supplier",
        placeholder: "Enter supplier name",
        type: "text",
        validation: { required: false },
      },
    ],
    fuel_lubricants: [
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "diesel", label: "Diesel" },
          { value: "petrol", label: "Petrol" },
          { value: "lubricant", label: "Lubricant" },
          { value: "hydraulic_fluid", label: "Hydraulic Fluid" },
        ],
        validation: { required: true },
      },
      {
        name: "grade",
        label: "Grade",
        placeholder: "e.g., SAE 10W-30",
        type: "text",
        validation: { required: false },
      },
      {
        name: "volume",
        label: "Volume",
        placeholder: "e.g., 20L",
        type: "text",
        validation: { required: false },
      },
    ],
    irrigation_supplies: [
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { value: "pipe", label: "Pipe" },
          { value: "valve", label: "Valve" },
          { value: "sprinkler", label: "Sprinkler" },
          { value: "drip_emitter", label: "Drip Emitter" },
        ],
        validation: { required: true },
      },
      {
        name: "material",
        label: "Material",
        type: "select",
        options: [
          { value: "PVC", label: "PVC" },
          { value: "metal", label: "Metal" },
          { value: "plastic", label: "Plastic" },
        ],
        validation: { required: true },
      },
      {
        name: "size",
        label: "Size",
        placeholder: "e.g., 2 inch",
        type: "text",
        validation: { required: false },
      },
    ],
  };

  // Get fields based on category for add/edit modal
  const getItemFields = (category, isEdit = false) => {
    if (!category && !isEdit) {
      return [baseFields.find((field) => field.name === "category")];
    }
    const selectedCategory =
      category || (isEdit && selectedItem?.category) || "fertilizer";
    return [...baseFields, ...(categoryFields[selectedCategory] || [])];
  };

  const itemColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "unit", label: "Unit", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "description", label: "Description", sortable: false },
  ];

  // Handle category change for add modal
  const handleAddCategoryChange = (category) => {
    setAddCategory(category);
  };

  // Handle category change for edit modal
  const handleEditCategoryChange = (category) => {
    setEditCategory(category);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/items/view?page=${currentPage}&limit=${recordsPerPage}&search=${searchQuery}`
      );
      if (response.data.success) {
        setItemList(response.data.items);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      } else {
        setItemList([]);
        showNotification(
          response.data.message || "Failed to fetch items",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      showNotification(
        error.response?.data?.message || "Failed to fetch items",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (form) => {
    try {
      setLoading(true);
      const payload = form; // Exclude account fields
      const response = await Wrapper.axios.post(
        `${BASE_URL}/items/save`,
        payload
      );
      if (response.data.success) {
        setAddOpen(false);
        setAddCategory("");
        fetchItems();
        showNotification(response.data.message, "success");
      } else {
        showNotification(response.data.message, "error");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      showNotification(
        error.response?.data?.message || "Failed to add item",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = (item) => {
    setSelectedItem({
      ...item,
    });
    setEditCategory(item.category);
    setEditOpen(true);
  };

  const handleEdit = async (form) => {
    try {
      setLoading(true);
      const payload = form; // Exclude account fields
      const response = await Wrapper.axios.put(`${BASE_URL}/items/update`, {
        id: selectedItem._id,
        ...payload,
      });
      if (response.data.success) {
        setEditOpen(false);
        setEditCategory("");
        fetchItems();
        showNotification(response.data.message, "success");
      } else {
        showNotification(response.data.message, "error");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      showNotification(
        error.response?.data?.message || "Failed to update item",
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
        `${BASE_URL}/items/delete/${deleteId}`
      );
      if (response.data.success) {
        showNotification(response.data.message, "success");
        fetchItems();
      } else {
        showNotification(response.data.message, "error");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      showNotification(
        error.response?.data?.message || "Error deleting item",
        "error"
      );
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      for (const itemId of selectedItems) {
        await Wrapper.axios.delete(`${BASE_URL}/items/delete/${itemId}`);
      }
      setSelectedItems([]);
      fetchItems();
      showNotification(
        `${selectedItems.length} items deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting items:", error);
      showNotification(
        error.response?.data?.message || "Failed to delete selected items",
        "error"
      );
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedItems(filteredItems.map((item) => item._id));
    else setSelectedItems([]);
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const filteredItems = itemList.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchItems();
  }, [currentPage, searchQuery]);

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
            Item Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your inventory items
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
            placeholder="Search items..."
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
            Add Item
          </Wrapper.Button>
          <Wrapper.Button
            variant="outlined"
            color="error"
            startIcon={<Wrapper.DeleteIcon />}
            onClick={() =>
              selectedItems.length > 0
                ? setMultipleDeleteConfirmation({ isOpen: true })
                : showNotification("No items selected", "warning")
            }
            disabled={selectedItems.length === 0}
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
            "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
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
              Total Items
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {itemList.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
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
              {selectedItems.length}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {/* Table or No Items Message */}
      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : filteredItems.length === 0 ? (
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
            No items found
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Add your first item to get started
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Item
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
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "Item" : "Items"}{" "}
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
                          selectedItems.length > 0 &&
                          selectedItems.length < filteredItems.length
                        }
                        checked={
                          filteredItems.length > 0 &&
                          selectedItems.length === filteredItems.length
                        }
                        onChange={handleSelectAll}
                        sx={{ "&.Mui-checked": { color: "primary.main" } }}
                      />
                    </Wrapper.TableCell>
                    {itemColumns.map((column) => (
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
                          {sortConfig.key === column.key &&
                            (sortConfig.direction === "asc" ? (
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
                  {filteredItems.map((item) => (
                    <Wrapper.TableRow
                      key={item._id}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: Wrapper.alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                        },
                        ...(selectedItems.includes(item._id) && {
                          bgcolor: Wrapper.alpha(
                            theme.palette.primary.main,
                            0.08
                          ),
                        }),
                      }}
                    >
                      <Wrapper.TableCell padding="checkbox">
                        <Wrapper.Checkbox
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleSelectItem(item._id)}
                          sx={{ "&.Mui-checked": { color: "primary.main" } }}
                        />
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>{item.name}</Wrapper.TableCell>
                      <Wrapper.TableCell>{item.unit}</Wrapper.TableCell>
                      <Wrapper.TableCell>{item.category}</Wrapper.TableCell>
                      <Wrapper.TableCell>{item.description}</Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                          <Wrapper.Tooltip title="Edit item">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => handleEditOpen(item)}
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
                          <Wrapper.Tooltip title="Delete item">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => {
                                setOpenDelete(true);
                                setDeleteId(item._id);
                              }}
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
            {filteredItems.length === 0 && (
              <Wrapper.Box sx={{ p: 4, textAlign: "center" }}>
                <Wrapper.Typography variant="body1" color="text.secondary">
                  No items match your search criteria
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
                {selectedItems.length > 0 ? (
                  <span>
                    <b>{selectedItems.length}</b> items selected
                  </span>
                ) : (
                  <span>Select items to perform actions</span>
                )}
              </Wrapper.Typography>
              {selectedItems.length > 0 && (
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
          </Wrapper.Card>
          <Wrapper.Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
          >
            <Wrapper.Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Wrapper.Box>
        </>
      )}

      {/* Add Item Modal */}
      <ReusableModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddCategory("");
        }}
        title="Add New Item"
        fields={getItemFields(addCategory)}
        onSubmit={handleAdd}
        loading={loading}
        customFunctions={{ onCategoryChange: handleAddCategoryChange }}
      />

      {/* Edit Item Modal */}
      <ReusableModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditCategory("");
        }}
        title="Edit Item"
        fields={getItemFields(editCategory, true)}
        values={selectedItem}
        onSubmit={handleEdit}
        loading={loading}
        customFunctions={{ onCategoryChange: handleEditCategoryChange }}
      />

      {/* Single Delete Confirmation */}
      <Wrapper.Dialog
        open={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setDeleteId(null);
        }}
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
            Are you sure you want to delete this item?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() => {
              setOpenDelete(false);
              setDeleteId(null);
            }}
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

      {/* Multiple Delete Confirmation */}
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
            Are you sure you want to delete {selectedItems.length} selected
            items?
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

export default Item;

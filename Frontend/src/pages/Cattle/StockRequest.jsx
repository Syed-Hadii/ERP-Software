import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import ReusableModal from "../../components/Modals/ReusableModal";

const StockRequests = () => {
  // State Declarations
  const [items, setItems] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [addCategory, setAddCategory] = useState("");
  const [cattleInventory, setcattleInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [userId] = useState(localStorage.getItem("id") || null);
  const [appendedItems, setAppendedItems] = useState([]);
  const [currentTab, setCurrentTab] = useState("createRequest");
  const [requestFilter, setRequestFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  // Fetch Items (master item list)
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
      ],
      validation: { required: true },
    },
    {
      name: "lowStockThreshold",
      label: "Low Stock Threshold",
      placeholder: "Enter low stock threshold",
      type: "number",
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
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await Wrapper.axios.get(
        `${BASE_URL}/items/view?all=true`
      );
      setItems(data.items);
    } catch (error) {
      console.error(error);
      showNotification("Failed to fetch items", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Manager Inventory (owner = 'cattle')
  const fetchcattleInventory = async () => {
    try {
      setLoading(true);
      const { data } = await Wrapper.axios.get(
        `${BASE_URL}/inventory/manager?all=true`
      );
      setcattleInventory(data.inventoryList);
    } catch (error) {
      console.error(error);
      Wrapper.toast.error("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inventory Requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      let url = `${BASE_URL}/inventoryRequest/inventory-requests?type=cattle`;
      if (requestFilter !== "all") {
        url += `?status=${requestFilter}`;
      }
      const { data } = await Wrapper.axios.get(url);
      console.log(data);
      let list = data.requests;

      setRequests(list);
    } catch (error) {
      console.error(error);
      Wrapper.toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  // Add / Remove Rows
  const handleAddItem = () =>
    setAppendedItems((items) => [
      ...items,
      { item: "", quantityRequested: "", details: "", availableQuantity: 0 },
    ]);
  const handleRemoveItem = (idx) =>
    setAppendedItems((items) => items.filter((_, i) => i !== idx));

  // Handle field changes
  const handleRowChange = (idx, field, value) => {
    const copy = [...appendedItems];
    copy[idx][field] = value;
    if (field === "item") {
      const inv = cattleInventory.find((inv) => inv.item._id === value);
      copy[idx].availableQuantity = inv ? inv.quantity : 0;
    }
    setAppendedItems(copy);
  };

  // Submit Requests
  const handleSubmitRequest = async () => {
    if (!appendedItems.length) {
      return Wrapper.toast.error("Add at least one item.");
    }
    for (const row of appendedItems) {
      if (!row.item || !row.quantityRequested) {
        return Wrapper.toast.error("Fill all required fields.");
      }
    }
    try {
      setLoading(true);
      await Promise.all(
        appendedItems.map((row) =>
          Wrapper.axios.post(
            `${BASE_URL}/inventoryRequest/inventory-requests`,
            {
              item: row.item,
              requestedBy: userId,
              quantityRequested: row.quantityRequested,
              details: row.details,
              requestorType: "Dairy Manager",
            }
          )
        )
      );
      Wrapper.toast.success("Requests submitted!");
      setAppendedItems([]);
      fetchRequests();
    } catch (error) {
      console.error(error);
      Wrapper.toast.error("Submission failed.");
    } finally {
      setLoading(false);
    }
  };
  const handleAdd = async (form) => {
    try {
      setLoading(true);
      await Wrapper.axios.post(`${BASE_URL}/items/save`, form);
      setAddOpen(false);
      setAddCategory(""); // Reset category
      fetchItems();
      showNotification("Item added successfully", "success");
    } catch (error) {
      console.error("Error adding item:", error);
      showNotification("Failed to add item", "error");
    } finally {
      setLoading(false);
    }
  };
  // Handle category change for add modal
  const handleAddCategoryChange = (category) => {
    setAddCategory(category);
  };
  const getItemFields = (category, isEdit = false) => {
    // For add modal, show only category field if no category is selected
    if (!category && !isEdit) {
      return [baseFields.find((field) => field.name === "category")];
    }
    // For edit modal or when category is selected, show all relevant fields
    const selectedCategory =
      category || (isEdit && selectedItem?.category) || "fertilizer";
    return [...baseFields, ...(categoryFields[selectedCategory] || [])];
  };
  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  useEffect(() => {
    fetchItems();
    fetchcattleInventory();
  }, []);

  useEffect(() => {
    if (currentTab === "viewRequests") fetchRequests();
  }, [currentTab, requestFilter]);

  return (
    <Wrapper.Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Wrapper.Typography variant="h4" gutterBottom>
        Cattle Inventory Requests
      </Wrapper.Typography>
      <Wrapper.Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Tabs */}
        <Wrapper.Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Wrapper.Tab
            label="Create Requests"
            value="createRequest"
            icon={<Wrapper.AddIcon />}
            iconPosition="start"
          />
          <Wrapper.Tab
            label="View Requests"
            value="viewRequests"
            icon={<Wrapper.ViewListIcon />}
            iconPosition="start"
          />
        </Wrapper.Tabs>
        <Wrapper.Box>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddOpen(true)}
            color="primary"
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
        </Wrapper.Box>
      </Wrapper.Box>

      {/* Create */}
      {currentTab === "createRequest" && (
        <Wrapper.Paper sx={{ p: 4, mt: 2 }}>
          <Wrapper.TableContainer component={Wrapper.Paper} sx={{ mb: 2 }}>
            <Wrapper.Table>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  {["Item", "Available", "Qty", "Details", "Action"].map(
                    (h) => (
                      <Wrapper.TableCell key={h}>{h}</Wrapper.TableCell>
                    )
                  )}
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {appendedItems.map((row, i) => (
                  <Wrapper.TableRow key={i}>
                    <Wrapper.TableCell>
                      <Wrapper.Select
                        fullWidth
                        value={row.item}
                        onChange={(e) =>
                          handleRowChange(i, "item", e.target.value)
                        }
                      >
                        <Wrapper.MenuItem value="">
                          Select Item
                        </Wrapper.MenuItem>
                        {items.map((it) => (
                          <Wrapper.MenuItem key={it._id} value={it._id}>
                            {it.name}
                          </Wrapper.MenuItem>
                        ))}
                      </Wrapper.Select>
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="center">
                      <Wrapper.Chip
                        label={row.availableQuantity}
                        size="small"
                        color={row.availableQuantity > 0 ? "success" : "error"}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="center">
                      <Wrapper.TextField
                        type="number"
                        value={row.quantityRequested}
                        onChange={(e) =>
                          handleRowChange(
                            i,
                            "quantityRequested",
                            e.target.value
                          )
                        }
                        inputProps={{ min: 1 }}
                        error={row.quantityRequested > row.availableQuantity}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.TextField
                        fullWidth
                        value={row.details}
                        onChange={(e) =>
                          handleRowChange(i, "details", e.target.value)
                        }
                        placeholder="Optional"
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="center">
                      <Wrapper.Tooltip title="Remove">

                      <Wrapper.IconButton 
                        onClick={() => handleRemoveItem(i)}
                        sx={{ color: "error.main" }}
                      >
                        <Wrapper.DeleteIcon />
                      </Wrapper.IconButton>
                      </Wrapper.Tooltip>
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                ))}
                {appendedItems.length === 0 && (
                  <Wrapper.TableRow>
                    <Wrapper.TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 3 }}
                    >
                      No items. Click “Add Item”.
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                )}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>

          <Wrapper.Box
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Wrapper.Button
              variant="outlined"
              onClick={handleAddItem}
              startIcon={<Wrapper.AddIcon />}
              color="success"
            >
              Add Item
            </Wrapper.Button>
            <Wrapper.Button
              variant="contained"
              onClick={handleSubmitRequest}
              disabled={loading || appendedItems.length === 0}
              startIcon={
                loading ? (
                  <Wrapper.CircularProgress size={20} />
                ) : (
                  <Wrapper.SendIcon />
                )
              }
              color="primary"
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
              Submit
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.Paper>
      )}

      {/* View */}
      {currentTab === "viewRequests" && (
        <Wrapper.Box sx={{ mt: 2 }}>
          {/* Filters */}
          <Wrapper.Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Wrapper.Select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
            >
              {["all", "pending", "approved", "rejected"].map((st) => (
                <Wrapper.MenuItem key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </Wrapper.MenuItem>
              ))}
            </Wrapper.Select>
            <Wrapper.Button
              onClick={fetchRequests}
              startIcon={<Wrapper.RefreshIcon />}
            >
              Refresh
            </Wrapper.Button>
          </Wrapper.Box>

          {loading ? (
            <Wrapper.CircularProgress />
          ) : !requests.length ? (
            <Wrapper.Typography>No requests found.</Wrapper.Typography>
          ) : (
            <Wrapper.TableContainer component={Wrapper.Paper}>
              <Wrapper.Table>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    {["Item", "By", "Qty", "Details", "Status", "Date"].map(
                      (h) => (
                        <Wrapper.TableCell key={h}>{h}</Wrapper.TableCell>
                      )
                    )}
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {requests.map((r) => (
                    <Wrapper.TableRow key={r._id}>
                      <Wrapper.TableCell>{r.item.name}</Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {r.requestedBy.name}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="center">
                        {r.quantityRequested}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>{r.details || "-"}</Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Chip
                          label={
                            r.status.charAt(0).toUpperCase() + r.status.slice(1)
                          }
                          size="small"
                          color={
                            r.status === "approved"
                              ? "success"
                              : r.status === "rejected"
                              ? "error"
                              : "warning"
                          }
                        />
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {new Date(r.requestDate).toLocaleDateString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
          )}
        </Wrapper.Box>
      )}
      <ReusableModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddCategory(""); // Reset category on close
        }}
        title="Add New Item"
        fields={getItemFields(addCategory)}
        onSubmit={handleAdd}
        loading={loading}
        customFunctions={{ onCategoryChange: handleAddCategoryChange }}
      />
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

export default StockRequests;

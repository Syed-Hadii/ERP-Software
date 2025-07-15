import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import ReusableModal from "../../components/Modals/ReusableModal";

// Utility function to safely access item properties
const safeGetItem = (item, property) => {
  return item && item[property] ? item[property] : "N/A";
};

// Utility function to safely format dates
const safeFormatDate = (date) => {
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return "N/A";
    }
    return parsedDate.toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const CropRequests = () => {
  const theme = Wrapper.useTheme();
  const [items, setItems] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [addCategory, setAddCategory] = useState("");
  const [managerInventory, setManagerInventory] = useState([]);
  const [requests, setRequests] = useState([]); 
  const [appendedItems, setAppendedItems] = useState([]);
  const [currentTab, setCurrentTab] = useState("createRequest");
  const [requestFilter, setRequestFilter] = useState("all");
  const [loading, setLoading] = useState(false);

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
      placeholder: "e.g., kg, pcs",
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
      validation: { required: false },
    },
  ];

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

  const fetchManagerInventory = async () => {
    try {
      setLoading(true);
      const { data } = await Wrapper.axios.get(
        `${BASE_URL}/inventory/manager?all=true`
      );
      setManagerInventory(data.inventoryList);
    } catch (error) {
      console.error(error);
      Wrapper.toast.error("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let url = `${BASE_URL}/inventoryRequest/inventory-requests?type=agriculture`;
      if (requestFilter !== "all") {
        url += `&status=${requestFilter}`;
      }
      const { data } = await Wrapper.axios.get(url);
      setRequests(data.requests || []);
    } catch (error) {
      console.error(error);
      Wrapper.toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () =>
    setAppendedItems((items) => [
      ...items,
      { item: "", quantityRequested: "", details: "", availableQuantity: 0 },
    ]);

  const handleRemoveItem = (idx) =>
    setAppendedItems((items) => items.filter((_, i) => i !== idx));

  const handleRowChange = (idx, field, value) => {
    const copy = [...appendedItems];
    copy[idx][field] = value;
    if (field === "item") {
      const inv = managerInventory.find((inv) => inv.item._id === value);
      copy[idx].availableQuantity = inv ? inv.quantity : 0;
    }
    setAppendedItems(copy);
  };

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
              quantityRequested: row.quantityRequested,
              details: row.details,
              requestorType: "Crop Manager",
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
      setAddCategory("");
      fetchItems();
      showNotification("Item added successfully", "success");
    } catch (error) {
      console.error("Error adding item:", error);
      showNotification("Failed to add item", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategoryChange = (category) => {
    setAddCategory(category);
  };

  const getItemFields = (category, isEdit = false) => {
    if (!category && !isEdit) {
      return [baseFields.find((field) => field.name === "category")];
    }
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
    fetchManagerInventory();
  }, []);

  useEffect(() => {
    if (currentTab === "viewRequests") fetchRequests();
  }, [currentTab, requestFilter]);

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1200px", mx: "auto" }}>
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
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: "-8px",
                left: 0,
                width: "40px",
                height: "4px",
                bgcolor: "#348d39",
                borderRadius: "2px",
              },
            }}
          >
            Crop Inventory Requests
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage and create inventory requests for crop management
          </Wrapper.Typography>
        </Wrapper.Box>
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
      </Wrapper.Box>

      <Wrapper.Box sx={{ mb: 3 }}>
        <Wrapper.Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "medium",
            },
          }}
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
      </Wrapper.Box>

      {currentTab === "createRequest" && (
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: 3,
            "&:hover": { boxShadow: 6 },
          }}
        >
          <Wrapper.Box
            sx={{
              p: 2,
              bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.05),
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              Create Inventory Requests
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.TableContainer
            sx={{ maxHeight: "calc(100vh - 350px)", minHeight: "300px" }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  {[
                    "Item",
                    "Unit",
                    "Available",
                    "Qty",
                    "Details",
                    "Action",
                  ].map((h) => (
                    <Wrapper.TableCell
                      key={h}
                      sx={{ fontWeight: "bold" }}
                      align={
                        ["Available", "Qty", "Action"].includes(h)
                          ? "center"
                          : "left"
                      }
                    >
                      {h}
                    </Wrapper.TableCell>
                  ))}
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {appendedItems.map((row, i) => {
                  const selectedItem = items.find((it) => it._id === row.item);
                  return (
                    <Wrapper.TableRow key={i} hover>
                      <Wrapper.TableCell>
                        <Wrapper.Select
                          fullWidth
                          value={row.item}
                          onChange={(e) =>
                            handleRowChange(i, "item", e.target.value)
                          }
                          size="small"
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
                      <Wrapper.TableCell>
                        {selectedItem ? selectedItem.unit || "N/A" : "-"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="center">
                        <Wrapper.Chip
                          label={row.availableQuantity}
                          size="small"
                          color={
                            row.availableQuantity > 0 ? "success" : "error"
                          }
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
                          size="small"
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
                          size="small"
                        />
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="center">
                        <Wrapper.IconButton
                          color="error"
                          onClick={() => handleRemoveItem(i)}
                          title="Remove Item"
                        >
                          <Wrapper.DeleteIcon />
                        </Wrapper.IconButton>
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  );
                })}
                {appendedItems.length === 0 && (
                  <Wrapper.TableRow>
                    <Wrapper.TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <Wrapper.Typography color="text.secondary">
                        No items added. Click &quot;Add Item&quot; to start.
                      </Wrapper.Typography>
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                )}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
          <Wrapper.Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Wrapper.Button
              variant="outlined"
              onClick={handleAddItem}
              startIcon={<Wrapper.AddIcon />}
              sx={{ borderRadius: 1 }}
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
              sx={{
                borderRadius: 1,
                bgcolor: "#348d39",
                "&:hover": { bgcolor: "#2e7d32" },
              }}
            >
              Submit Request
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.Card>
      )}

      {currentTab === "viewRequests" && (
        <Wrapper.Box sx={{ mt: 3 }}>
          <Wrapper.Box
            sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}
          >
            <Wrapper.FormControl
              size="small"
              sx={{ width: { xs: "100%", sm: 150 } }}
            >
              <Wrapper.InputLabel>Status</Wrapper.InputLabel>
              <Wrapper.Select
                value={requestFilter}
                label="Status"
                onChange={(e) => setRequestFilter(e.target.value)}
                size="small"
              >
                <Wrapper.MenuItem value="all">All Statuses</Wrapper.MenuItem>
                <Wrapper.MenuItem value="pending">Pending</Wrapper.MenuItem>
                <Wrapper.MenuItem value="approved">Approved</Wrapper.MenuItem>
                <Wrapper.MenuItem value="rejected">Rejected</Wrapper.MenuItem>
              </Wrapper.Select>
            </Wrapper.FormControl>
            <Wrapper.Button
              variant="outlined"
              onClick={fetchRequests}
              startIcon={<Wrapper.RefreshIcon />}
              sx={{ borderRadius: 1 }}
            >
              Refresh
            </Wrapper.Button>
          </Wrapper.Box>

          {loading ? (
            <Wrapper.Box sx={{ width: "100%", textAlign: "center" }}>
              <Wrapper.Skeleton variant="rectangular" height={50} />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
              <Wrapper.Skeleton variant="text" />
            </Wrapper.Box>
          ) : requests.length === 0 ? (
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
                No requests found
              </Wrapper.Typography>
              <Wrapper.Typography color="text.secondary" sx={{ mb: 3 }}>
                Try changing the filter or create a new request.
              </Wrapper.Typography>
            </Wrapper.Card>
          ) : (
            <Wrapper.Card
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3,
                "&:hover": { boxShadow: 6 },
              }}
            >
              <Wrapper.Box
                sx={{
                  p: 2,
                  bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.05),
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Inventory Requests
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.TableContainer
                sx={{ maxHeight: "calc(100vh - 350px)", minHeight: "300px" }}
              >
                <Wrapper.Table stickyHeader>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      {["Item", "Unit", "Qty", "Details", "Status", "Date"].map(
                        (h) => (
                          <Wrapper.TableCell
                            key={h}
                            sx={{ fontWeight: "bold" }}
                            align={
                              ["Qty", "Status"].includes(h) ? "center" : "left"
                            }
                          >
                            {h}
                          </Wrapper.TableCell>
                        )
                      )}
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {requests.map((r) => (
                      <Wrapper.TableRow key={r._id} hover>
                        <Wrapper.TableCell>
                          {safeGetItem(r.item, "name")}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {safeGetItem(r.item, "unit")}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="center">
                          {r.quantityRequested}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {r.details || "-"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="center">
                          <Wrapper.Chip
                            label={
                              r.status.charAt(0).toUpperCase() +
                              r.status.slice(1)
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
                          {safeFormatDate(r.requestDate)}
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    ))}
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.TableContainer>
            </Wrapper.Card>
          )}
        </Wrapper.Box>
      )}

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
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
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
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </Wrapper.Box>
  );
};

export default CropRequests;

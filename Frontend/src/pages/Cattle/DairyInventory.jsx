import { useState, useEffect, useCallback } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";

const CattleInventory = () => {
  const theme = Wrapper.useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const [dairyInventory, setDairyInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [cattleInventory, setCattleInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rawMilkOptions, setRawMilkOptions] = useState([]);
  const [outputProductOptions, setOutputProductOptions] = useState([]);
  const [processingRecords, setProcessingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState({
    key: "productId.name",
    order: "asc",
  });
  const [processOpen, setProcessOpen] = useState(false);
  const [feedProcessOpen, setFeedProcessOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editOpenDairy, setEditOpenDairy] = useState(false);
  const [editOpenCattle, setEditOpenCattle] = useState(false);
  const [selectedDairyItem, setSelectedDairyItem] = useState(null);
  const [selectedCattleItem, setSelectedCattleItem] = useState(null);
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
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 7;

  const dairyFields = [
    {
      name: "productId",
      label: "Product",
      type: "select",
      options: products.map((p) => ({ value: p._id, label: p.name })),
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
      type: "text",
      disabled: true, // Make unit read-only since it comes from product
    },
  ];

  const dairyColumns = [
    { key: "productId.name", label: "Product Name", sortable: true },
    { key: "productId.category", label: "Category", sortable: true },
    { key: "productId.unit", label: "Unit", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "averageCost", label: "Avg Cost", sortable: true },
    { key: "totalCost", label: "Total Cost", sortable: true },
    { key: "lastUpdated", label: "Last Updated", sortable: true },
  ];

  const cattleFields = [
    {
      name: "item",
      label: "Item",
      type: "select",
      options: items.map((i) => ({ value: i._id, label: i.name })),
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

  const cattleColumns = [
    { key: "item.name", label: "Item Name", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "avgCost", label: "Avg Cost", sortable: true },
    { key: "totalCost", label: "Total Cost", sortable: true },
    { key: "item.unit", label: "Unit", sortable: true },
    { key: "updatedAt", label: "Last Updated", sortable: true },
  ];

  const productFields = [
    {
      name: "name",
      label: "Product Name",
      placeholder: "Enter Product name",
      type: "text",
      validation: { required: true },
    },
    {
      name: "unit",
      label: "Unit",
      placeholder: "Enter unit",
      type: "text",
      validation: { required: true },
    },
    {
      name: "standardCost",
      label: "Standard Cost",
      placeholder: "Enter Standard Cost",
      type: "Number",
      validation: { required: false },
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Enter description",
      type: "text",
      validation: { required: false },
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        { value: "Raw Milk", label: "Raw Milk" },
        { value: "Processed Milk", label: "Processed Milk" },
        { value: "Dairy Product", label: "Dairy Product" },
        { value: "Feed", label: "Cattle Feed" },
      ],
      validation: { required: true },
    },
  ];

  const processMilkFields = [
    {
      name: "rawMilkProductId",
      label: "Raw Milk",
      type: "select",
      options: Array.isArray(rawMilkOptions)
        ? rawMilkOptions.map((o) => ({
            value: o.productId._id,
            label: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{`${o.productId.name}`}</span>
                <span
                  style={{
                    backgroundColor: "#e0e0e0",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  {`${o.quantity} L available`}
                </span>
              </div>
            ),
          }))
        : [],
      validation: { required: true },
    },

    {
      name: "inputMilkQuantity",
      label: "Raw Milk Quantity (L)",
      type: "number",
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
      name: "outputProducts",
      label: "Output Products",
      type: "custom",
      icon: <Wrapper.InventoryIcon />,
      render: (form, setForm) => {
        if (!form) {
          const initialForm = {
            outputProducts: [{ productId: "", quantity: "" }],
          };
          setForm(initialForm);
          return null;
        }

        const outputProducts = Array.isArray(form?.outputProducts)
          ? form.outputProducts
          : [{ productId: "", quantity: "" }];

        const safeOutputProductOptions = Array.isArray(outputProductOptions)
          ? outputProductOptions
          : [];

        if (outputProducts.length === 0) {
          setForm({
            ...form,
            outputProducts: [{ productId: "", quantity: "" }],
          });
          return null;
        }

        return (
          <Wrapper.Box>
            {outputProducts.map((product, index) => (
              <Wrapper.Box
                key={index}
                sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}
              >
                <Wrapper.FormControl fullWidth>
                  <Wrapper.InputLabel>Product</Wrapper.InputLabel>
                  <Wrapper.Select
                    value={product.productId || ""}
                    onChange={(e) => {
                      const updatedProducts = [...outputProducts];
                      updatedProducts[index] = {
                        ...updatedProducts[index],
                        productId: e.target.value,
                      };
                      setForm({ ...form, outputProducts: updatedProducts });
                    }}
                    required
                  >
                    {safeOutputProductOptions.map((option) => (
                      <Wrapper.MenuItem key={option._id} value={option._id}>
                        {option.name}
                      </Wrapper.MenuItem>
                    ))}
                    {safeOutputProductOptions.length === 0 && (
                      <Wrapper.MenuItem disabled value="">
                        No products available
                      </Wrapper.MenuItem>
                    )}
                  </Wrapper.Select>
                </Wrapper.FormControl>
                <Wrapper.TextField
                  label="Quantity"
                  type="number"
                  value={product.quantity || ""}
                  onChange={(e) => {
                    const updatedProducts = [...outputProducts];
                    updatedProducts[index] = {
                      ...updatedProducts[index],
                      quantity: e.target.value,
                    };
                    setForm({ ...form, outputProducts: updatedProducts });
                  }}
                  required
                  fullWidth
                  inputProps={{ min: 0 }}
                />
                <Wrapper.IconButton
                  onClick={() => {
                    const updatedProducts = outputProducts.filter(
                      (_, i) => i !== index
                    );
                    setForm({
                      ...form,
                      outputProducts:
                        updatedProducts.length > 0
                          ? updatedProducts
                          : [{ productId: "", quantity: "" }],
                    });
                  }}
                  color="error"
                  disabled={outputProducts.length === 1}
                >
                  <Wrapper.DeleteIcon />
                </Wrapper.IconButton>
              </Wrapper.Box>
            ))}
            <Wrapper.Button
              variant="outlined"
              onClick={() =>
                setForm({
                  ...form,
                  outputProducts: [
                    ...outputProducts,
                    { productId: "", quantity: "" },
                  ],
                })
              }
              sx={{ mt: 1 }}
              disabled={safeOutputProductOptions.length === 0}
            >
              Add Product
            </Wrapper.Button>
          </Wrapper.Box>
        );
      },
      validation: {
        required: true,
        minLength: 1,
        validate: (value) =>
          (Array.isArray(value) &&
            value.every((p) => p.productId && p.quantity > 0)) ||
          "Each output product must have a valid product and quantity",
      },
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "in-progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
      validation: { required: true },
    },
    { name: "notes", label: "Notes", type: "text", multiline: true, rows: 2 },
  ];

  const processFeedFields = [
    {
      name: "inputProducts",
      label: "Input Products",
      type: "custom",
      icon: <Wrapper.InventoryIcon />,
      render: (form, setForm) => {
        if (!form) {
          setForm({
            inputProducts: [{ item: "", quantity: "" }],
            outputProduct: { item: "", quantity: "" },
          });
          return null;
        }
        const inputProducts = Array.isArray(form.inputProducts)
          ? form.inputProducts
          : [{ item: "", quantity: "" }];

        return (
          <Wrapper.Box>
            {inputProducts.map((product, idx) => (
              <Wrapper.Box
                key={idx}
                sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}
              >
                <Wrapper.FormControl fullWidth>
                  <Wrapper.InputLabel>Product</Wrapper.InputLabel>
                  <Wrapper.Select
                    value={product.item || ""}
                    onChange={(e) => {
                      const next = [...inputProducts];
                      next[idx] = { ...next[idx], item: e.target.value };
                      setForm({ ...form, inputProducts: next });
                    }}
                    required
                  >
                    {cattleInventory
                      .filter((opt) => opt.item?.category === "cattle_feed")
                      .map((opt) => (
                        <Wrapper.MenuItem key={opt._id} value={opt._id}>
                          {opt.item?.name}
                        </Wrapper.MenuItem>
                      ))}
                    {!cattleInventory.some(
                      (opt) => opt.item?.category === "cattle_feed"
                    ) && (
                      <Wrapper.MenuItem disabled value="">
                        No feed products available
                      </Wrapper.MenuItem>
                    )}
                  </Wrapper.Select>
                </Wrapper.FormControl>

                <Wrapper.TextField
                  label="Quantity"
                  type="number"
                  value={product.quantity || ""}
                  onChange={(e) => {
                    const next = [...inputProducts];
                    next[idx] = { ...next[idx], quantity: e.target.value };
                    setForm({ ...form, inputProducts: next });
                  }}
                  required
                  fullWidth
                  inputProps={{ min: 0 }}
                />

                <Wrapper.IconButton
                  onClick={() => {
                    const next = inputProducts.filter((_, i) => i !== idx);
                    setForm({
                      ...form,
                      inputProducts: next.length
                        ? next
                        : [{ item: "", quantity: "" }],
                    });
                  }}
                  color="error"
                  disabled={inputProducts.length === 1}
                >
                  <Wrapper.DeleteIcon />
                </Wrapper.IconButton>
              </Wrapper.Box>
            ))}

            <Wrapper.Button
              variant="outlined"
              onClick={() =>
                setForm({
                  ...form,
                  inputProducts: [...inputProducts, { item: "", quantity: "" }],
                })
              }
              sx={{ mt: 1 }}
              disabled={cattleInventory.length === 0}
            >
              Add Product
            </Wrapper.Button>
          </Wrapper.Box>
        );
      },
      validation: {
        required: true,
        minLength: 1,
        validate: (arr) =>
          (Array.isArray(arr) && arr.every((p) => p.item && p.quantity > 0)) ||
          "Each input must have a product and positive quantity",
      },
    },
    {
      name: "outputProduct",
      label: "Output Product",
      type: "custom",
      icon: <Wrapper.InventoryIcon />,
      render: (form, setForm) => {
        if (!form) {
          setForm({
            inputProducts: [{ item: "", quantity: "" }],
            outputProduct: { item: "", quantity: "" },
          });
          return null;
        }
        const output = form.outputProduct || { item: "", quantity: "" };

        return (
          <Wrapper.Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Wrapper.FormControl fullWidth>
              <Wrapper.InputLabel>Product</Wrapper.InputLabel>
              <Wrapper.Select
                value={output.item || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    outputProduct: { ...output, item: e.target.value },
                  })
                }
                required
              >
                {items
                  .filter((item) => item.category === "cattle_feed")
                  .map((opt) => (
                    <Wrapper.MenuItem key={opt._id} value={opt._id}>
                      {opt.name}
                    </Wrapper.MenuItem>
                  ))}
                {!items.some((item) => item.category === "cattle_feed") && (
                  <Wrapper.MenuItem disabled value="">
                    No feed products available
                  </Wrapper.MenuItem>
                )}
              </Wrapper.Select>
            </Wrapper.FormControl>

            <Wrapper.TextField
              label="Quantity"
              type="number"
              value={output.quantity || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  outputProduct: { ...output, quantity: e.target.value },
                })
              }
              required
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Wrapper.Box>
        );
      },
      validation: {
        required: true,
        validate: (v) =>
          (v.item && v.quantity > 0) ||
          "Output product and positive quantity are required",
      },
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
  ];

  const processingColumns = [
    { key: "batchNumber", label: "Batch Number", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "rawMilkProductId.name", label: "Raw Milk", sortable: true },
    { key: "inputMilkQuantity", label: "Quantity (L)", sortable: true },
    { key: "employee", label: "employee", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const showNotification = useCallback((message, severity = "success") => {
    setNotification({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (selectedTab === 0) {
        const [
          inventoryRes,
          productsRes,
          rawMilkRes,
          outputProductsRes,
          employeeRes,
        ] = await Promise.all([
          Wrapper.axios.get(`${BASE_URL}/dairy-inventory/`),
          Wrapper.axios.get(`${BASE_URL}/dairy-product/`),
          Wrapper.axios.get(`${BASE_URL}/dairy-process/raw-milk`),
          Wrapper.axios.get(`${BASE_URL}/dairy-process/products`),
          Wrapper.axios.get(`${BASE_URL}/employees/`),
        ]);
        setDairyInventory(
          Array.isArray(inventoryRes.data.data) ? inventoryRes.data.data : []
        );
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setRawMilkOptions(
          Array.isArray(rawMilkRes.data.data) ? rawMilkRes.data.data : []
        );
        setEmployees(
          Array.isArray(employeeRes.data.data)
            ? employeeRes.data.data.filter((emp) => emp.department === "Cattle")
            : []
        );

        setOutputProductOptions(
          Array.isArray(outputProductsRes.data.data)
            ? outputProductsRes.data.data
            : []
        );
      } else if (selectedTab === 1) {
        const [itemsRes, inventoryRes] = await Promise.all([
          Wrapper.axios.get(`${BASE_URL}/items/view?all=true`),
          Wrapper.axios.get(`${BASE_URL}/inventory/cattle?all=true`),
        ]);
        console.log(inventoryRes);
        setItems(Array.isArray(itemsRes.data.items) ? itemsRes.data.items : []);
        setCattleInventory(
          Array.isArray(inventoryRes.data.inventoryList)
            ? inventoryRes.data.inventoryList
            : []
        );
      } else if (selectedTab === 2) {
        const response = await Wrapper.axios.get(`${BASE_URL}/dairy-process/`, {
          params: {
            page: currentPage,
            limit: recordsPerPage,
            sortBy: sortOrder.key,
          },
        });
        if (response.data.success) {
          setProcessingRecords(
            Array.isArray(response.data.data) ? response.data.data : []
          );
          setTotalRecords(response.data.pagination?.total || 0);
        } else {
          setProcessingRecords([]);
          setTotalRecords(0);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification(
        `Failed to fetch ${
          selectedTab === 0
            ? "dairy inventory"
            : selectedTab === 1
            ? "cattle inventory"
            : "processing records"
        }`,
        "error"
      );
      if (selectedTab === 0) {
        setDairyInventory([]);
        setProducts([]);
        setRawMilkOptions([]);
        setOutputProductOptions([]);
      } else if (selectedTab === 1) {
        setItems([]);
        setCattleInventory([]);
        setEmployees([]);
      } else if (selectedTab === 2) {
        setProcessingRecords([]);
        setTotalRecords(0);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTab, currentPage, sortOrder, showNotification]); // ✅ Actual dependencies

  const refreshInventory = () => {
    setRefreshTrigger((prev) => prev + 1);
    showNotification("Refreshing inventory data...", "info");
  };
  const handleProcessMilk = async (form) => {
    try {
      setLoading(true);
      const payload = {
        rawMilkProductId: form.rawMilkProductId,
        inputMilkQuantity: parseFloat(form.inputMilkQuantity),
        employee: form.employee,
        outputProducts: form.outputProducts.map((p) => ({
          productId: p.productId,
          quantity: parseFloat(p.quantity),
        })),
        notes: form.notes,
        status: form.status,
      };
      const response = await Wrapper.axios.post(
        `${BASE_URL}/dairy-process/`,
        payload
      );
      if (response.data.success) {
        showNotification("Milk processed successfully", "success");
        setProcessOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error processing milk:", error);
      showNotification(
        error.response?.data?.message || "Failed to process milk",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProcessFeed = async (form) => {
    try {
      setLoading(true);
      const payload = {
        inputProducts: form.inputProducts.map((p) => ({
          item: p.item,
          quantity: parseFloat(p.quantity),
        })),
        outputProduct: {
          item: form.outputProduct.item,
          quantity: parseFloat(form.outputProduct.quantity),
        },
      };
      const response = await Wrapper.axios.post(
        `${BASE_URL}/feed-process/`,
        payload
      );
      if (response) {
        showNotification("Feed processed successfully", "success");
        setFeedProcessOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error processing feed:", error);
      showNotification(
        error.response?.data?.message || "Failed to process feed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (form) => {
    try {
      setLoading(true);
      await Wrapper.axios.post(`${BASE_URL}/dairy-product/`, form);
      setAddOpen(false);
      showNotification("Product added successfully", "success");
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      showNotification("Failed to add product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCattle = async (form) => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.put(`${BASE_URL}/inventory/update`, {
        id: selectedInventory?._id,
        ...form,
        owner: "manager",
      });
      if (response.data.success) {
        showNotification("Inventory updated successfully", "success");
        setEditOpenCattle(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      showNotification("Failed to update inventory", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleEditDairy = async (form) => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.put(
        `${BASE_URL}/dairy-inventory/${selectedDairyItem._id}`,
        {
          productId: form.productId,
          quantity: form.quantity,
          standardCost: form.standardCost,
          // Don't include unit here as it comes from product
        }
      );
      if (response.data.success) {
        showNotification("Dairy inventory updated successfully", "success");
        setEditOpenDairy(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating dairy inventory:", error);
      showNotification(
        error.response?.data?.message || "Failed to update dairy inventory",
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
        selectedTab === 2
          ? `${BASE_URL}/dairy-process/${deleteId}`
          : `${BASE_URL}/inventory/delete/${deleteId}`
      );
      if (response.data.success) {
        showNotification("Item deleted successfully", "success");
        fetchData();
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
      const deletePromises = selectedInventories.map((id) =>
        Wrapper.axios.delete(
          selectedTab === 2
            ? `${BASE_URL}/dairy-process/${id}`
            : `${BASE_URL}/inventory/delete/${id}`
        )
      );
      await Promise.all(deletePromises);
      setSelectedInventories([]);
      fetchData();
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

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.patch(
        `${BASE_URL}/dairy-process/${id}/status`,
        { status: newStatus }
      );
      if (response.data.success) {
        showNotification("Status updated successfully", "success");
        fetchData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Failed to update status", "error");
    } finally {
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
      const items = selectedTab === 2 ? processingRecords : currentItems;
      setSelectedInventories(items.map((item) => item._id));
    } else {
      setSelectedInventories([]);
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

  const currentInventory = selectedTab === 0 ? dairyInventory : cattleInventory;
  const searchedInventory = currentInventory.filter((inv) =>
    selectedTab === 0
      ? inv.productId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : inv.item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedInventory = [...searchedInventory].sort((a, b) => {
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

  const sortedProcessingRecords = [...processingRecords].sort((a, b) => {
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

  const totalPages = Math.ceil(
    selectedTab === 2 ? totalRecords : searchedInventory.length / recordsPerPage
  );
  const currentItems =
    selectedTab === 2
      ? sortedProcessingRecords
      : sortedInventory.slice(
          (currentPage - 1) * recordsPerPage,
          currentPage * recordsPerPage
        );

  const handleEditDairyOpen = (item) => {
    setSelectedDairyItem(item);
    setEditOpenDairy(true);
  };

  const handleEditCattleOpen = (item) => {
    setSelectedCattleItem(item);
    setEditOpenCattle(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger, selectedTab, currentPage, sortOrder]);

  useEffect(() => {
    setSelectedInventories([]);
  }, [searchQuery]);

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
            Cattle Inventory Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your cattle-related inventory and processing
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
          {selectedTab === 0 && (
            <Wrapper.Box
              sx={{
                display: "flex",
                gap: 2,
                textWrap: "nowrap",
                flexWrap: "wrap",
              }}
            >
              <Wrapper.Button
                variant="contained"
                startIcon={<Wrapper.AddIcon />}
                onClick={() => setProcessOpen(true)}
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
                Process Milk
              </Wrapper.Button>
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
                Add New Product
              </Wrapper.Button>
            </Wrapper.Box>
          )}
          {selectedTab === 1 && (
            <Wrapper.Button
              variant="contained"
              color="primary"
              startIcon={<Wrapper.AddIcon />}
              onClick={() => setFeedProcessOpen(true)}
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
              Process Feed
            </Wrapper.Button>
          )}
        </Wrapper.Box>
      </Wrapper.Box>

      <Wrapper.Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Wrapper.Tabs
          value={selectedTab}
          onChange={(e, newValue) => {
            setSelectedTab(newValue);
            setCurrentPage(1);
            setSelectedInventories([]);
            setSearchQuery("");
          }}
          aria-label="cattle inventory tabs"
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ "& .MuiTab-root": { fontWeight: "bold" } }}
        >
          <Wrapper.Tab label="Dairy Inventory" />
          <Wrapper.Tab label="Cattle Inventory" />
          <Wrapper.Tab label="Processed Items" />
        </Wrapper.Tabs>
      </Wrapper.Box>

      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : (selectedTab !== 2 && searchedInventory.length === 0) ||
        (selectedTab === 2 && processingRecords.length === 0) ? (
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
              ? "Dairy Inventory"
              : selectedTab === 1
              ? "Cattle Inventory"
              : "Processed Items"}{" "}
            found
          </Wrapper.Typography>
          <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
            {selectedTab === 2
              ? "Process milk to add records"
              : "Items received will automatically appear here"}
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            color="success"
            startIcon={<Wrapper.RefreshIcon />}
            onClick={refreshInventory}
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
              {selectedTab === 2 ? totalRecords : searchedInventory.length}{" "}
              {selectedTab === 2
                ? totalRecords === 1
                  ? "Record"
                  : "Records"
                : searchedInventory.length === 1
                ? "Item"
                : "Items"}{" "}
              {searchQuery && `matching "${searchQuery}"`}
            </Wrapper.Typography>
            <Wrapper.Tooltip title="Refresh">
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
                    ? processingColumns
                    : selectedTab === 0
                    ? dairyColumns
                    : cattleColumns
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
                {currentItems.map((item) => (
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
                      ...(selectedInventories.includes(item._id) && {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.08
                        ),
                      }),
                      ...(selectedTab === 0 &&
                        item.quantity <= item.standardCost && {
                          bgcolor: "#fff3e0",
                        }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedInventories.includes(item._id)}
                        onChange={() => handleSelectInventory(item._id)}
                        sx={{ "&.Mui-checked": { color: "primary.main" } }}
                      />
                    </Wrapper.TableCell>
                    {selectedTab === 0 ? (
                      <>
                        <Wrapper.TableCell>
                          {item.productId?.name || "Unknown Product"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item.productId?.category || "N/A"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item.productId?.unit || "N/A"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{item.quantity}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item.averageCost.toLocaleString("en-US")}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item.totalCost.toLocaleString("en-US")}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {formatDate(item.lastUpdated)}
                        </Wrapper.TableCell>
                      </>
                    ) : selectedTab === 1 ? (
                      <>
                        <Wrapper.TableCell>
                          {item.item?.name || "Unknown Item"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{item.quantity}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item?.averageCost || "N/A"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item?.totalCost || "N/A"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{item.item?.unit}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {formatDate(item.updatedAt)}
                        </Wrapper.TableCell>
                      </>
                    ) : (
                      <>
                        <Wrapper.TableCell>
                          {item.batchNumber}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {formatDate(item.date)}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item.rawMilkProductId?.name || "N/A"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {item.inputMilkQuantity}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{item.employee}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          <Wrapper.FormControl size="small">
                            <Wrapper.Select
                              value={item.status}
                              onChange={(e) =>
                                handleUpdateStatus(item._id, e.target.value)
                              }
                              sx={{ minWidth: 120 }}
                            >
                              <Wrapper.MenuItem value="pending">
                                Pending
                              </Wrapper.MenuItem>
                              <Wrapper.MenuItem value="in-progress">
                                In Progress
                              </Wrapper.MenuItem>
                              <Wrapper.MenuItem value="completed">
                                Completed
                              </Wrapper.MenuItem>
                              <Wrapper.MenuItem value="cancelled">
                                Cancelled
                              </Wrapper.MenuItem>
                            </Wrapper.Select>
                          </Wrapper.FormControl>
                        </Wrapper.TableCell>
                      </>
                    )}
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        {selectedTab !== 2 && (
                          <>
                            <Wrapper.Tooltip title="Edit">
                              <Wrapper.IconButton
                                size="small"
                                onClick={() =>
                                  selectedTab === 0
                                    ? handleEditDairyOpen(item)
                                    : handleEditCattleOpen(item)
                                }
                                sx={{ color: "#FBC02D" }}
                              >
                                <Wrapper.EditIcon fontSize="small" />
                              </Wrapper.IconButton>
                            </Wrapper.Tooltip>
                          </>
                        )}
                        <Wrapper.Tooltip title="Delete">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => {
                              setDeleteId(item._id);
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
                selectedTab === 2 ? totalRecords : searchedInventory.length
              )}{" "}
              -{" "}
              {Math.min(
                currentPage * recordsPerPage,
                selectedTab === 2 ? totalRecords : searchedInventory.length
              )}{" "}
              of {selectedTab === 2 ? totalRecords : searchedInventory.length}{" "}
              {selectedTab === 2 ? "records" : "items"}
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
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        title="Process Raw Milk"
        fields={processMilkFields}
        values={{
          rawMilkProductId: "",
          inputMilkQuantity: "",
          employee: "",
          outputProducts: [{ productId: "", quantity: "" }],
          status: "pending",
          notes: "",
        }}
        onSubmit={handleProcessMilk}
        loading={loading}
      />
      <ReusableModal
        open={feedProcessOpen}
        onClose={() => setFeedProcessOpen(false)}
        title="Process Cattle Feed"
        fields={processFeedFields}
        values={{
          inputProducts: [{ item: "", quantity: "" }],
          outputProduct: { item: "", quantity: "" },
        }}
        onSubmit={handleProcessFeed}
        loading={loading}
      />
      <ReusableModal
        open={editOpenCattle}
        onClose={() => setEditOpenCattle(false)}
        title="Edit Inventory Item"
        fields={selectedTab === 0 ? dairyFields : cattleFields}
        values={{
          productId: selectedInventory?.productId?._id || "",
          item: selectedInventory?.item?._id || "",
          quantity: selectedInventory?.quantity || "",
          unit: selectedInventory?.unit || "",
        }}
        onSubmit={handleEditCattle}
        loading={loading}
      />
      <ReusableModal
        open={editOpenDairy}
        onClose={() => setEditOpenDairy(false)}
        title="Edit Dairy Inventory Item"
        fields={dairyFields}
        values={{
          productId: selectedDairyItem?.productId?._id || "",
          quantity: selectedDairyItem?.quantity || "",
          unit: selectedDairyItem?.productId?.unit || "", // Get unit from product
          standardCost: selectedDairyItem?.standardCost || 0, // Add reorderLevel
        }}
        onSubmit={handleEditDairy}
        loading={loading}
      />
      <ReusableModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Product"
        fields={productFields}
        values={{
          name: "",
          unit: "",
          standardCost: "",
          description: "",
          category: "",
        }}
        onSubmit={handleAddProduct}
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
            Are you sure you want to delete this{" "}
            {selectedTab === 2 ? "processing record" : "inventory item"}? This
            action cannot be undone.
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
              ? selectedTab === 2
                ? "processing record"
                : "inventory item"
              : selectedTab === 2
              ? "processing records"
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

export default CattleInventory;

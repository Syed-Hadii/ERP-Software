import { useState, useEffect, useCallback } from "react";
import Wrapper from "../../utils/wrapper";
import InvoiceForm from "../../components/InvoiceForm"; // Import new modal
import { BASE_URL } from "../../config/config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DairySales = () => {
  const theme = Wrapper.useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    productId: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState({
    key: "date",
    order: "desc",
  });
  const [selectedSales, setSelectedSales] = useState([]);
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
  const [activeTab, setActiveTab] = useState("table");
  const recordsPerPage = 10;

  // Form state for InvoiceForm
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    invoiceNumber: "",
    customer: "",
    reference: "",
    description: "",
    items: [{ item: "", quantity: "", unitPrice: "" }],
    totalPrice: 0,
    status: "pending",
  });
  const [formErrors, setFormErrors] = useState({});

  const saleFields = [
    {
      name: "date",
      label: "Sale Date",
      type: "date",
      validation: { required: true },
      xs: 6,
    },
    {
      name: "invoiceNumber",
      label: "Invoice Number",
      type: "text",
      disabled: true,
      validation: { required: false },
      xs: 6,
    },
    {
      name: "customer",
      label: "Customer",
      type: "select",
      options: customerList.map((c) => ({
        value: c._id,
        label: c.name,
      })),
      validation: { required: true },
      xs: 6,
    },
    {
      name: "reference",
      label: "Reference",
      type: "text",
      validation: { required: false },
      xs: 6,
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      multiline: true,
      rows: 3,
      validation: { required: false },
      xs: 12,
    },
    {
      name: "totalPrice",
      label: "Total Price",
      type: "number",
      disabled: true,
      validation: { required: true, min: 0 },
      xs: 6,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
      validation: { required: true },
      xs: 6,
    },
  ];

  const itemFields = [
    {
      name: "item",
      label: "Product",
      type: "select",
      options: products.map((p) => {
        const invItem = inventory.find(
          (i) => i.productId?._id?.toString() === p._id?.toString()
        );
        return {
          value: p._id,
          label: `${p.name} (${invItem?.quantity || 0} ${p.unit} available)`,
          disabled: !invItem || invItem.quantity <= 0,
        };
      }),
      validation: { required: true },
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      validation: { required: true, min: 1 },
    },
    {
      name: "unitPrice",
      label: "Unit Price",
      type: "number",
      validation: { required: true, min: 0 },
    },
  ];

  const saleColumns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      format: (value) => formatDate(value),
    },
    {
      key: "invoiceNumber",
      label: "Invoice #",
      sortable: true,
    },
    {
      key: "customer.name",
      label: "Customer",
      sortable: true,
    },
    {
      key: "items",
      label: "Products",
      sortable: false,
      format: (items) => items.map((i) => i.item?.name || "Unknown").join(", "),
    },
    {
      key: "totalPrice",
      label: "Total Price",
      sortable: true,
      format: (value) => `PKR ${value.toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      format: (value) => (
        <Wrapper.Chip
          label={value}
          color={
            value === "approved"
              ? "success"
              : value === "rejected"
              ? "error"
              : "warning"
          }
          size="small"
        />
      ),
    },
  ];

  const validateForm = () => {
    const errors = {};
    const itemsRows = [];

    // Validate top-level fields
    saleFields.forEach((field) => {
      if (field.validation.required && !formData[field.name]) {
        errors[field.name] = `${field.label} is required`;
      }
      if (
        field.validation.min !== undefined &&
        parseFloat(formData[field.name]) < field.validation.min
      ) {
        errors[
          field.name
        ] = `${field.label} cannot be less than ${field.validation.min}`;
      }
    });

    // Validate items
    if (formData.items.length === 0) {
      errors.items = "At least one item is required";
    } else {
      formData.items.forEach((row, index) => {
        const rowErrors = {};
        itemFields.forEach((field) => {
          if (field.validation.required && !row[field.name]) {
            rowErrors[field.name] = `${field.label} is required`;
          }
          if (
            field.validation.min !== undefined &&
            parseFloat(row[field.name]) < field.validation.min
          ) {
            rowErrors[
              field.name
            ] = `${field.label} must be at least ${field.validation.min}`;
          }
        });
        itemsRows[index] = rowErrors;
      });
    }

    if (itemsRows.some((row) => Object.keys(row).length > 0)) {
      errors.itemsRows = itemsRows;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showNotification = useCallback((message, severity = "success") => {
    setNotification({ open: true, message, severity });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, productsRes, inventoryRes, customerRes] =
        await Promise.all([
          Wrapper.axios.get(`${BASE_URL}/dairy-sale`, {
            params: {
              page: currentPage,
              limit: recordsPerPage,
              search: searchQuery,
              status: filters.status,
              sortBy: sortOrder.key,
              sortOrder: sortOrder.order,
              fromDate: filters.fromDate,
              toDate: filters.toDate,
            },
          }),
          Wrapper.axios.get(`${BASE_URL}/dairy-product`),
          Wrapper.axios.get(`${BASE_URL}/dairy-inventory`),
          Wrapper.axios.get(`${BASE_URL}/customer/get?all=true`),
        ]);
      setSales(Array.isArray(salesRes.data.data) ? salesRes.data.data : []);
      setTotalRecords(salesRes.data.totalInvoices || 0);
      setProducts(
        Array.isArray(productsRes.data.data) ? productsRes.data.data : []
      );
      setInventory(
        Array.isArray(inventoryRes.data.data) ? inventoryRes.data.data : []
      );
      setCustomerList(
        Array.isArray(customerRes.data.data) ? customerRes.data.data : []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Failed to fetch sales data", "error");
      setSales([]);
      setTotalRecords(0);
      setProducts([]);
      setInventory([]);
      setCustomerList([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    showNotification("Refreshing sales data...", "info");
  };

  const handleCreateSale = async () => {
    if (!validateForm()) {
      showNotification("Please fix form errors", "error");
      return;
    }

    try {
      setLoading(true);
      // Validate inventory
      for (const row of formData.items) {
        const invItem = inventory.find(
          (i) => i.productId?._id?.toString() === row.item?.toString()
        );
        if (!invItem || invItem.quantity < parseFloat(row.quantity)) {
          showNotification(
            `Insufficient inventory for ${
              products.find((p) => p._id === row.item)?.name
            }: ${invItem?.quantity || 0} available`,
            "error"
          );
          return;
        }
      }

      const calculatedTotal = formData.items.reduce(
        (sum, row) =>
          sum + parseFloat(row.quantity || 0) * parseFloat(row.unitPrice || 0),
        0
      );
      if (Math.abs(calculatedTotal - parseFloat(formData.totalPrice)) > 0.01) {
        showNotification("Total price does not match item totals", "error");
        return;
      }

      const payload = {
        date: formData.date,
        reference: formData.reference?.trim(),
        customer: formData.customer,
        description: formData.description?.trim(),
        items: formData.items.map((row) => ({
          item: row.item,
          quantity: parseFloat(row.quantity),
          unitPrice: parseFloat(row.unitPrice),
        })),
        totalPrice: parseFloat(formData.totalPrice),
        status: formData.status,
      };

      const response = await Wrapper.axios.post(
        `${BASE_URL}/dairy-sale`,
        payload
      );
      if (response.data.success) {
        showNotification("Sale created successfully", "success");
        setAddOpen(false);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          invoiceNumber: "",
          customer: "",
          reference: "",
          description: "",
          items: [{ item: "", quantity: "", unitPrice: "" }],
          totalPrice: 0,
          status: "pending",
        });
        setFormErrors({});
        fetchData();
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to create sale",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = async () => {
    if (!validateForm()) {
      showNotification("Please fix form errors", "error");
      return;
    }

    try {
      setLoading(true);
      // Validate inventory (adjust for old quantities)
      const oldItems = selectedSale?.items || [];
      const inventoryAdjustments = {};
      oldItems.forEach((item) => {
        inventoryAdjustments[item.item._id] =
          (inventoryAdjustments[item.item._id] || 0) + item.quantity;
      });
      formData.items.forEach((row) => {
        inventoryAdjustments[row.item] =
          (inventoryAdjustments[row.item] || 0) - parseFloat(row.quantity);
      });
      for (const [itemId, netChange] of Object.entries(inventoryAdjustments)) {
        const inv = inventory.find(
          (i) => i.productId?._id?.toString() === itemId.toString()
        );
        if (!inv || inv.quantity + netChange < 0) {
          showNotification(
            `Insufficient inventory for ${
              products.find((p) => p._id === itemId)?.name
            }`,
            "error"
          );
          return;
        }
      }

      const calculatedTotal = formData.items.reduce(
        (sum, row) =>
          sum + parseFloat(row.quantity || 0) * parseFloat(row.unitPrice || 0),
        0
      );
      if (Math.abs(calculatedTotal - parseFloat(formData.totalPrice)) > 0.01) {
        showNotification("Total price does not match item totals", "error");
        return;
      }

      const payload = {
        date: formData.date,
        reference: formData.reference?.trim(),
        customer: formData.customer,
        description: formData.description?.trim(),
        items: formData.items.map((row) => ({
          item: row.item,
          quantity: parseFloat(row.quantity),
          unitPrice: parseFloat(row.unitPrice),
        })),
        totalPrice: parseFloat(formData.totalPrice),
        status: formData.status,
      };

      const response = await Wrapper.axios.put(
        `${BASE_URL}/dairy-sale/${selectedSale._id}`,
        payload
      );
      if (response.data.success) {
        showNotification("Sale updated successfully", "success");
        setEditOpen(false);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          invoiceNumber: "",
          customer: "",
          reference: "",
          description: "",
          items: [{ item: "", quantity: "", unitPrice: "" }],
          totalPrice: 0,
          status: "pending",
        });
        setFormErrors({});
        fetchData();
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Failed to update sale",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/dairy-sale/${deleteId}`
      );
      if (response.data.success) {
        showNotification("Sale deleted successfully", "success");
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      showNotification("Failed to delete sale", "error");
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleConfirmMultipleDelete = async () => {
    try {
      setLoading(true);
      const deletePromises = selectedSales.map((id) =>
        Wrapper.axios.delete(`${BASE_URL}/dairy-sale/${id}`)
      );
      await Promise.all(deletePromises);
      setSelectedSales([]);
      fetchData();
      showNotification(
        `${selectedSales.length} sales deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting sales:", error);
      showNotification("Failed to delete selected sales", "error");
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

  const handleSelectSale = (id) => {
    setSelectedSales((prev) =>
      prev.includes(id) ? prev.filter((saleId) => saleId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSales(sales.map((sale) => sale._id));
    } else {
      setSelectedSales([]);
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

  const handleItemChange = (index, name, value) => {
    const newItems = [...formData.items];
    newItems[index][name] = value;
    if (name === "item") {
      const product = products.find((p) => p._id === value);
      const invItem = inventory.find(
        (i) => i.productId?._id?.toString() === value?.toString()
      );
      newItems[index].unitPrice =
        invItem?.averageCost || product?.averageCost || 0;
    }
    setFormData({
      ...formData,
      items: newItems,
      totalPrice: newItems
        .reduce(
          (sum, row) =>
            sum +
            parseFloat(row.quantity || 0) * parseFloat(row.unitPrice || 0),
          0
        )
        .toFixed(2),
    });
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item: "", quantity: "", unitPrice: "" }],
    });
  };

  const handleRemoveItemRow = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        items: newItems,
        totalPrice: newItems
          .reduce(
            (sum, row) =>
              sum +
              parseFloat(row.quantity || 0) * parseFloat(row.unitPrice || 0),
            0
          )
          .toFixed(2),
      });
    }
  };

  const handleEditOpen = (sale) => {
    setSelectedSale(sale);
    setFormData({
      date: sale.date
        ? new Date(sale.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      invoiceNumber: sale.invoiceNumber || "",
      customer: sale.customer?._id || "",
      reference: sale.reference || "",
      description: sale.description || "",
      items: sale.items.map((i) => ({
        item: i.item?._id || "",
        quantity: i.quantity || "",
        unitPrice: i.unitPrice || "",
      })),
      totalPrice: sale.totalPrice || 0,
      status: sale.status || "pending",
    });
    setFormErrors({});
    setEditOpen(true);
  };

  const getSalesOverTimeData = () => {
    const salesByDate = {};
    sales.forEach((sale) => {
      const date = new Date(sale.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      salesByDate[date] = (salesByDate[date] || 0) + sale.totalPrice;
    });

    const labels = Object.keys(salesByDate);
    const data = Object.values(salesByDate);

    return {
      labels,
      datasets: [
        {
          label: "Sales Amount (PKR)",
          data,
          borderColor: "#2e7d32",
          backgroundColor: Wrapper.alpha("#2e7d32", 0.2),
          fill: true,
          tension: 0.3,
        },
      ],
    };
  };

  const getProductWiseSalesData = () => {
    const salesByProduct = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productName = item.item?.name || "Unknown";
        salesByProduct[productName] =
          (salesByProduct[productName] || 0) + item.quantity;
      });
    });

    const labels = Object.keys(salesByProduct);
    const data = Object.values(salesByProduct);

    return {
      labels,
      datasets: [
        {
          label: "Quantity Sold",
          data,
          backgroundColor: [
            "#2e7d32",
            "#388e3c",
            "#43a047",
            "#4caf50",
            "#66bb6a",
          ],
          borderColor: "#ffffff",
          borderWidth: 1,
        },
      ],
    };
  };

  const getStatusData = () => {
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    sales.forEach((sale) => {
      statusCounts[sale.status] = (statusCounts[sale.status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ["#ffb300", "#2e7d32", "#d32f2f"],
          borderColor: "#ffffff",
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        backgroundColor: Wrapper.alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
      },
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.secondary },
        grid: { display: false },
      },
      y: {
        ticks: { color: theme.palette.text.secondary },
        grid: { color: Wrapper.alpha(theme.palette.divider, 0.2) },
      },
    },
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger, currentPage, sortOrder, filters, searchQuery]);

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
            Dairy Sales Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Track and manage dairy product sales
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
            placeholder="Search by customer, product, or invoice..."
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
              selectedSales.length > 0
                ? setMultipleDeleteConfirmation({ isOpen: true })
                : showNotification("No sales selected", "warning")
            }
            disabled={selectedSales.length === 0}
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
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split("T")[0],
                invoiceNumber: "",
                customer: "",
                reference: "",
                description: "",
                items: [{ item: "", quantity: "", unitPrice: "" }],
                totalPrice: 0,
                status: "pending",
              });
              setFormErrors({});
              setAddOpen(true);
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
            New Sale
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      <Wrapper.Box sx={{ mb: 3 }}>
        <Wrapper.Paper sx={{ p: 2 }}>
          <Wrapper.Grid container spacing={2}>
            <Wrapper.Grid item xs={12} md={3}>
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
            <Wrapper.Grid item xs={12} md={3}>
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
            <Wrapper.Grid item xs={12} md={3}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Status</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="pending">Pending</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="approved">Approved</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="rejected">Rejected</Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={3}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Product</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filters.productId}
                  onChange={(e) =>
                    setFilters({ ...filters, productId: e.target.value })
                  }
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  {products.map((product) => (
                    <Wrapper.MenuItem key={product._id} value={product._id}>
                      {product.name}
                    </Wrapper.MenuItem>
                  ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.Paper>
      </Wrapper.Box>

      <Wrapper.Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Wrapper.Tab label="Sales Table" value="table" />
        <Wrapper.Tab label="Sales Analytics" value="charts" />
      </Wrapper.Tabs>

      {activeTab === "table" ? (
        loading ? (
          <Wrapper.Box sx={{ width: "100%" }}>
            <Wrapper.Skeleton variant="rectangular" height={50} />
            <Wrapper.Skeleton variant="text" />
            <Wrapper.Skeleton variant="text" />
            <Wrapper.Skeleton variant="text" />
          </Wrapper.Box>
        ) : sales.length === 0 ? (
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
              No Sales Records Found
            </Wrapper.Typography>
            <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
              Add a new sale to get started
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
                {totalRecords} {totalRecords === 1 ? "Sale" : "Sales"}{" "}
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
                          selectedSales.length > 0 &&
                          selectedSales.length < sales.length
                        }
                        checked={
                          sales.length > 0 &&
                          selectedSales.length === sales.length
                        }
                        onChange={handleSelectAll}
                        sx={{ "&.Mui-checked": { color: "primary.main" } }}
                      />
                    </Wrapper.TableCell>
                    {saleColumns.map((column) => (
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
                  {sales.map((sale) => (
                    <Wrapper.TableRow
                      key={sale._id}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: Wrapper.alpha(
                            theme.palette.primary.main,
                            0.04
                          ),
                        },
                        ...(selectedSales.includes(sale._id) && {
                          bgcolor: Wrapper.alpha(
                            theme.palette.primary.main,
                            0.08
                          ),
                        }),
                      }}
                    >
                      <Wrapper.TableCell padding="checkbox">
                        <Wrapper.Checkbox
                          checked={selectedSales.includes(sale._id)}
                          onChange={() => handleSelectSale(sale._id)}
                          sx={{ "&.Mui-checked": { color: "primary.main" } }}
                        />
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {formatDate(sale.date)}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {sale.invoiceNumber}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {sale.customer?.name || "Unknown"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {sale.items
                          .map((i) => i.item?.name || "Unknown")
                          .join(", ")}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        PKR {sale.totalPrice.toFixed(2)}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Chip
                          label={sale.status}
                          color={
                            sale.status === "approved"
                              ? "success"
                              : sale.status === "rejected"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                          <Wrapper.Tooltip title="Edit">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => handleEditOpen(sale)}
                              sx={{ color: "#FBC02D" }}
                            >
                              <Wrapper.EditIcon fontSize="small" />
                            </Wrapper.IconButton>
                          </Wrapper.Tooltip>
                          <Wrapper.Tooltip title="Delete">
                            <Wrapper.IconButton
                              size="small"
                              onClick={() => {
                                setDeleteId(sale._id);
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
                {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)}{" "}
                - {Math.min(currentPage * recordsPerPage, totalRecords)} of{" "}
                {totalRecords} sales
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
        )
      ) : (
        <Wrapper.Box>
          {loading ? (
            <Wrapper.Box sx={{ width: "100%" }}>
              <Wrapper.Skeleton variant="rectangular" height={300} />
              <Wrapper.Skeleton
                variant="rectangular"
                height={300}
                sx={{ mt: 3 }}
              />
              <Wrapper.Skeleton
                variant="rectangular"
                height={300}
                sx={{ mt: 3 }}
              />
            </Wrapper.Box>
          ) : sales.length === 0 ? (
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
              <Wrapper.BarChartIcon
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Wrapper.Typography variant="h5" gutterBottom>
                No Sales Data for Charts
              </Wrapper.Typography>
              <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
                Add sales or adjust filters to view analytics
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
            <Wrapper.Grid container spacing={3}>
              <Wrapper.Grid item xs={12} md={6}>
                <Wrapper.Card sx={{ p: 2, height: 400 }}>
                  <Wrapper.Typography variant="h6" gutterBottom>
                    Sales Over Time
                  </Wrapper.Typography>
                  <Wrapper.Box sx={{ height: 320 }}>
                    <Line
                      data={getSalesOverTimeData()}
                      options={chartOptions}
                    />
                  </Wrapper.Box>
                </Wrapper.Card>
              </Wrapper.Grid>
              <Wrapper.Grid item xs={12} md={6}>
                <Wrapper.Card sx={{ p: 2, height: 400 }}>
                  <Wrapper.Typography variant="h6" gutterBottom>
                    Product-Wise Sales
                  </Wrapper.Typography>
                  <Wrapper.Box sx={{ height: 320 }}>
                    <Bar
                      data={getProductWiseSalesData()}
                      options={chartOptions}
                    />
                  </Wrapper.Box>
                </Wrapper.Card>
              </Wrapper.Grid>
              <Wrapper.Grid item xs={12} md={6}>
                <Wrapper.Card sx={{ p: 2, height: 400 }}>
                  <Wrapper.Typography variant="h6" gutterBottom>
                    Status Distribution
                  </Wrapper.Typography>
                  <Wrapper.Box sx={{ height: 320, maxWidth: 300, mx: "auto" }}>
                    <Pie data={getStatusData()} options={chartOptions} />
                  </Wrapper.Box>
                </Wrapper.Card>
              </Wrapper.Grid>
            </Wrapper.Grid>
          )}
        </Wrapper.Box>
      )}

      <InvoiceForm
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setFormData({
            date: new Date().toISOString().split("T")[0],
            invoiceNumber: "",
            customer: "",
            reference: "",
            description: "",
            items: [{ item: "", quantity: "", unitPrice: "" }],
            totalPrice: 0,
            status: "pending",
          });
          setFormErrors({});
        }}
        title="New Sale"
        fields={saleFields}
        itemFields={itemFields}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        handleAdd={handleCreateSale}
        handleItemChange={handleItemChange}
        handleAddItemRow={handleAddItemRow}
        handleRemoveItemRow={handleRemoveItemRow}
        loading={loading}
        itemsLoading={loading}
        optionsLoading={loading}
      />

      <InvoiceForm
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setFormData({
            date: new Date().toISOString().split("T")[0],
            invoiceNumber: "",
            customer: "",
            reference: "",
            description: "",
            items: [{ item: "", quantity: "", unitPrice: "" }],
            totalPrice: 0,
            status: "pending",
          });
          setFormErrors({});
        }}
        title="Edit Sale"
        fields={saleFields}
        itemFields={itemFields}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        handleAdd={handleEditSale}
        handleItemChange={handleItemChange}
        handleAddItemRow={handleAddItemRow}
        handleRemoveItemRow={handleRemoveItemRow}
        loading={loading}
        itemsLoading={loading}
        optionsLoading={loading}
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
            Are you sure you want to delete this sale record? This action cannot
            be undone.
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
            Are you sure you want to delete {selectedSales.length}{" "}
            {selectedSales.length === 1 ? "sale" : "sales"}? This action cannot
            be undone.
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

export default DairySales;

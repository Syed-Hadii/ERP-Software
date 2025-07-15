import { useState, useEffect, useCallback } from "react";
import Wrapper from "../../../utils/wrapper";
import { BASE_URL } from "../../../config/config";
import InventoryHeader from "./InventoryHeader";
import InventoryTabs from "./InventoryTabs";
import InventoryTable from "./InventoryTable";
import InventoryModals from "./InventoryModals";

const CattleInventory = () => {
  const theme = Wrapper.useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const [dairyInventory, setDairyInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [agroInventory, setAgroInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [rawMilkOptions, setRawMilkOptions] = useState([]);
  const [outputProductOptions, setOutputProductOptions] = useState([]);
  const [inputProductOptions, setInputProductOptions] = useState([]);
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
  const [editOpen, setEditOpen] = useState(false);
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 7;
  const [searchedInventory, setSearchedInventory] = useState([]);

  const showNotification = useCallback((message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

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
      placeholder: "e.g., L, kg",
      type: "text",
      validation: { required: true },
    },
  ];

  const dairyColumns = [
    { key: "productId.name", label: "Product Name", sortable: true },
    { key: "productId.category", label: "Category", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "productId.unit", label: "Unit", sortable: true },
    { key: "reorderLevel", label: "Reorder Level", sortable: true },
    { key: "lastUpdated", label: "Last Updated", sortable: true },
  ];

  const agroFields = [
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

  const agroColumns = [
    { key: "item.name", label: "Item Name", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "unit", label: "Unit", sortable: true },
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
            label: `${o.productId.name} (${o.quantity} L available)`,
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
      name: "operator",
      label: "Operator",
      type: "text",
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
              outputProduct: form?.outputProduct,
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
                      value={product.item}
                      onChange={(e) => {
                        const next = [...inputProducts];
                        next[idx] = { ...next[idx], item: e.target.value };
                        setForm({ ...form, inputProducts: next });
                      }}
                      required
                    >
                      {items.map((opt) => (
                        <Wrapper.MenuItem key={opt._id} value={opt._id}>
                          {opt.name}
                        </Wrapper.MenuItem>
                      ))}
                      {items.length === 0 && (
                        <Wrapper.MenuItem disabled value="">
                          No products available
                        </Wrapper.MenuItem>
                      )}
                    </Wrapper.Select>
                  </Wrapper.FormControl>

                  <Wrapper.TextField
                    label="Quantity"
                    type="number"
                    value={product.quantity}
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
                disabled={items.length === 0}
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
            setForm({ ...form, outputProduct: { item: "", quantity: "" } });
            return null;
          }
          const output = form.outputProduct || { item: "", quantity: "" };

          return (
            <Wrapper.Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Product</Wrapper.InputLabel>
                <Wrapper.Select
                  value={output.item}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      outputProduct: { ...output, item: e.target.value },
                    })
                  }
                  required
                >
                  {items.map((opt) => (
                    <Wrapper.MenuItem key={opt._id} value={opt._id}>
                      {opt.name}
                    </Wrapper.MenuItem>
                  ))}
                  {items.length === 0 && (
                    <Wrapper.MenuItem disabled value="">
                      No products available
                    </Wrapper.MenuItem>
                  )}
                </Wrapper.Select>
              </Wrapper.FormControl>

              <Wrapper.TextField
                label="Quantity"
                type="number"
                value={output.quantity}
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
    ];

    const processingColumns = [
      { key: "batchNumber", label: "Batch Number", sortable: true },
      { key: "date", label: "Date", sortable: true },
      { key: "rawMilkProductId.name", label: "Raw Milk", sortable: true },
      { key: "inputMilkQuantity", label: "Quantity (L)", sortable: true },
      { key: "operator", label: "Operator", sortable: true },
      { key: "status", label: "Status", sortable: true },
    ];

    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        if (selectedTab === 0) {
          const [inventoryRes, productsRes, rawMilkRes, outputProductsRes] =
            await Promise.all([
              Wrapper.axios.get(`${BASE_URL}/dairy-inventory/`),
              Wrapper.axios.get(`${BASE_URL}/dairy-product/`),
              Wrapper.axios.get(`${BASE_URL}/dairy-process/raw-milk`),
              Wrapper.axios.get(`${BASE_URL}/dairy-process/products`),
            ]);
          setDairyInventory(inventoryRes.data.data || []);
          setProducts(productsRes.data.data || []);
          setRawMilkOptions(rawMilkRes.data || []);
          setOutputProductOptions(
            Array.isArray(outputProductsRes.data) ? outputProductsRes.data : []
          );
          setSearchedInventory(inventoryRes.data.data || []);
          setTotalRecords(inventoryRes.data.data?.length || 0);
        } else if (selectedTab === 1) {
          const [itemsRes, inventoryRes] = await Promise.all([
            Wrapper.axios.get(`${BASE_URL}/items/view?all=true`),
            Wrapper.axios.get(`${BASE_URL}/inventory/cattle?all=true`),
          ]);
          setItems(itemsRes.data.items || []);
          setAgroInventory(inventoryRes.data.inventoryList || []);
          setSearchedInventory(inventoryRes.data.inventoryList || []);
          setTotalRecords(inventoryRes.data.inventoryList?.length || 0);
        } else if (selectedTab === 2) {
          const response = await Wrapper.axios.get(`${BASE_URL}/dairy-process/`, {
            params: {
              page: currentPage,
              limit: recordsPerPage,
              sortBy: sortOrder.key,
            },
          });
          if (response.data.success) {
            setProcessingRecords(response.data.data || []);
            setTotalRecords(response.data.pagination.total || 0);
            setSearchedInventory(response.data.data || []);
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
        if (selectedTab === 0) setOutputProductOptions([]);
        if (selectedTab === 0) setDairyInventory([]);
        if (selectedTab === 0) setProducts([]);
        if (selectedTab === 0) setRawMilkOptions([]);
        if (selectedTab === 1) setItems([]);
        if (selectedTab === 1) setAgroInventory([]);
        if (selectedTab === 2) setProcessingRecords([]);
        setSearchedInventory([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    }, [
      selectedTab,
      currentPage,
      sortOrder.key,
      recordsPerPage,
      showNotification,
    ]);

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
          operator: form.operator,
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
        if (response.data.success) {
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
        console.error("Error adding Product:", error);
        showNotification("Failed to add Product", "error");
      } finally {
        setLoading(false);
      }
    };

    const handleEditOpen = (inventory) => {
      setSelectedInventory(inventory);
      setEditDialogOpen(true);
    };

    const handleEdit = async (form) => {
      try {
        setLoading(true);
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
          setEditDialogOpen(false);
          fetchData();
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
      setSortOrder((prevSortOrder) => ({
        key,
        order:
          prevSortOrder.key === key && prevSortOrder.order === "asc"
            ? "desc"
            : "asc",
      }));
    };

    const handleSelectInventory = (id) => {
      setSelectedInventories((prevSelected) => {
        if (prevSelected.includes(id)) {
          return prevSelected.filter((invId) => invId !== id);
        } else {
          return [...prevSelected, id];
        }
      });
    };

    const handleSelectAll = (event) => {
      const items =
        selectedTab === 0
          ? dairyInventory
          : selectedTab === 1
          ? agroInventory
          : processingRecords;

      if (event.target.checked) {
        setSelectedInventories(items.map((item) => item._id));
      } else {
        setSelectedInventories([]);
      }
    };

    const currentInventory = selectedTab === 0 ? dairyInventory : agroInventory;
    const searchedInventoryFiltered = currentInventory.filter((inv) =>
      selectedTab === 0
        ? inv.productId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        : inv.item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedInventory = [...searchedInventoryFiltered].sort((a, b) => {
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
      selectedTab === 2 ? totalRecords : searchedInventoryFiltered.length / recordsPerPage
    );

    const currentItems =
      selectedTab === 2
        ? sortedProcessingRecords
        : sortedInventory.slice(
            (currentPage - 1) * recordsPerPage,
            currentPage * recordsPerPage
          );

    useEffect(() => {
      fetchData();
    }, [fetchData, refreshTrigger, selectedTab, currentPage, sortOrder]);

    useEffect(() => {
      setSelectedInventories([]);
    }, [searchQuery]);

    return (
      <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
        <InventoryHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          refreshInventory={refreshInventory}
          selectedInventories={selectedInventories}
          setMultipleDeleteConfirmation={setMultipleDeleteConfirmation}
          showNotification={showNotification}
          selectedTab={selectedTab}
          setProcessOpen={setProcessOpen}
          setAddOpen={setAddOpen}
          setFeedProcessOpen={setFeedProcessOpen}
        />
        <InventoryTabs
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          setCurrentPage={setCurrentPage}
          setSelectedInventories={setSelectedInventories}
          setSearchQuery={setSearchQuery}
        />
        <InventoryTable
          loading={loading}
          selectedTab={selectedTab}
          searchedInventory={searchedInventoryFiltered}
          processingRecords={processingRecords}
          refreshInventory={refreshInventory}
          totalRecords={totalRecords}
          currentItems={currentItems}
          selectedInventories={selectedInventories}
          handleSelectAll={handleSelectAll}
          handleSort={handleSort}
          sortOrder={sortOrder}
          handleSelectInventory={handleSelectInventory}
          handleEditOpen={handleEditOpen}
          setDeleteId={setDeleteId}
          setOpenDelete={setOpenDelete}
          dairyColumns={dairyColumns}
          agroColumns={agroColumns}
          processingColumns={processingColumns}
          formatDate={formatDate}
          handleUpdateStatus={handleUpdateStatus}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          recordsPerPage={recordsPerPage}
          theme={theme}
        />
        <InventoryModals
          processOpen={processOpen}
          setProcessOpen={setProcessOpen}
          feedProcessOpen={feedProcessOpen}
          setFeedProcessOpen={setFeedProcessOpen}
          editOpen={editDialogOpen}
          setEditOpen={setEditDialogOpen}
          addOpen={addOpen}
          setAddOpen={setAddOpen}
          openDelete={openDelete}
          setOpenDelete={setOpenDelete}
          multipleDeleteConfirmation={multipleDeleteConfirmation}
          setMultipleDeleteConfirmation={setMultipleDeleteConfirmation}
          notification={notification}
          handleCloseNotification={handleCloseNotification}
          processMilkFields={processMilkFields}
          processFeedFields={processFeedFields}
          dairyFields={dairyFields}
          agroFields={agroFields}
          productFields={productFields}
          handleProcessMilk={handleProcessMilk}
          handleProcessFeed={handleProcessFeed}
          handleEdit={handleEdit}
          handleAddProduct={handleAddProduct}
          handleDelete={handleDelete}
          handleConfirmMultipleDelete={handleConfirmMultipleDelete}
          loading={loading}
          selectedInventory={selectedInventory}
          selectedTab={selectedTab}
          selectedInventories={selectedInventories}
        />
      </Wrapper.Box>
    );
  };

  export default CattleInventory;
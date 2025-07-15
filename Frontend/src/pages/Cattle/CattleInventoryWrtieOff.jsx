import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";

const CattleWriteOff = () => {
  const theme = Wrapper.useTheme();
  const [items, setItems] = useState([]);
  const [dairyProducts, setDairyProducts] = useState([]);
  const [formData, setFormData] = useState({
    itemId: "",
    dairyProductId: "",
    quantity: "",
    reason: "",
    owner: "cattle",
    date: new Date().toISOString().split("T")[0],
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [fetchingDairy, setFetchingDairy] = useState(true);

  const fetchData = async () => {
    try {
      setFetchingItems(true);
      setFetchingDairy(true);
      const [itemsResponse, dairyResponse] = await Promise.all([
        Wrapper.axios.get(`${BASE_URL}/inventory/cattle?all=true`),
        Wrapper.axios.get(`${BASE_URL}/dairy-inventory/`),
      ]);
      console.log("Items:", itemsResponse.data.inventoryList);
      console.log("Dairy Products:", dairyResponse.data.data);
      if (itemsResponse.data) {
        setItems(itemsResponse.data.inventoryList || []);
      }
      if (dairyResponse.data) {
        setDairyProducts(dairyResponse.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching items/products:", error);
      showNotification("Failed to fetch items/products", "error");
    } finally {
      setFetchingItems(false);
      setFetchingDairy(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Selected:", name, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // itemId: name === "dairyProductId" ? "" : prev.itemId,
      // dairyProductId: name === "itemId" ? "" : prev.dairyProductId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ open: false, message: "", severity: "success" });

    try {
      const payload = { ...formData };
      if (!payload.itemId && !payload.dairyProductId) {
        throw new Error("Please select an item or dairy product");
      }
      const response = await Wrapper.axios.post(
        `${BASE_URL}/inventory-write-off/`,
        payload
      );
      if (response.data.success) {
        showNotification("Inventory written off successfully", "success");
        setFormData({
          itemId: "",
          dairyProductId: "",
          quantity: "",
          reason: "",
          owner: "cattle",
          date: new Date().toISOString().split("T")[0],
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error writing off inventory:", error);
      showNotification(
        error.response?.data?.message || error.message || "Write-off failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "600px", mx: "auto" }}>
      <Wrapper.Card
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          "&:hover": { boxShadow: 6 },
        }}
      >
        <Wrapper.Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          sx={{
            position: "relative",
            mb: 4,
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
          Cattle Inventory Write-off
        </Wrapper.Typography>
        <Wrapper.Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Wrapper.FormControl fullWidth>
            <Wrapper.InputLabel id="item-select-label">Item</Wrapper.InputLabel>
            <Wrapper.Select
              labelId="item-select-label"
              name="itemId"
              label="Item"
              value={formData.itemId}
              onChange={handleChange}
              color="success"
            >
              {fetchingItems ? (
                <Wrapper.MenuItem disabled>
                  <Wrapper.Typography
                    variant="body2"
                    className="italic text-gray-500"
                  >
                    Fetching items...
                  </Wrapper.Typography>
                </Wrapper.MenuItem>
              ) : items.length === 0 ? (
                <Wrapper.MenuItem disabled>
                  <Wrapper.Typography
                    variant="body2"
                    className="italic text-gray-500"
                  >
                    No items found
                  </Wrapper.Typography>
                </Wrapper.MenuItem>
              ) : (
                items.map((invitem) => (
                  <Wrapper.MenuItem
                    key={invitem._id}
                    value={invitem?.item?._id || ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <Wrapper.Typography
                          variant="body1"
                          className="font-medium"
                        >
                          {invitem?.item?.name || "Unnamed Item"}
                        </Wrapper.Typography>
                      </div>
                      <Wrapper.Chip
                        label={`${invitem?.quantity || 0} ${
                          invitem?.item?.unit || ""
                        }`}
                        color="success"
                        size="small"
                        className="ml-2"
                      />
                    </div>
                  </Wrapper.MenuItem>
                ))
              )}
            </Wrapper.Select>
          </Wrapper.FormControl>

          <Wrapper.FormControl fullWidth>
            <Wrapper.InputLabel id="dairy-product-select-label">
              Dairy Product
            </Wrapper.InputLabel>
            <Wrapper.Select
              labelId="dairy-product-select-label"
              name="dairyProductId"
              label="Dairy Product"
              value={formData.dairyProductId}
              onChange={handleChange}
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "& fieldset": { borderColor: "#2e7d32" },
                  "&:hover fieldset": { borderColor: "#2e7d32" },
                  "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
                },
              }}
            >
              {fetchingDairy ? (
                <Wrapper.MenuItem disabled>
                  <Wrapper.Typography
                    variant="body2"
                    className="italic text-gray-500"
                  >
                    Fetching Products...
                  </Wrapper.Typography>
                </Wrapper.MenuItem>
              ) : dairyProducts.length === 0 ? (
                <Wrapper.MenuItem disabled>
                  <Wrapper.Typography
                    variant="body2"
                    className="italic text-gray-500"
                  >
                    No Products found
                  </Wrapper.Typography>
                </Wrapper.MenuItem>
              ) : (
                dairyProducts.map((product) => (
                  <Wrapper.MenuItem
                    key={product._id}
                    value={product?.productId?._id || ""}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <Wrapper.Typography
                          variant="body1"
                          className="font-medium"
                        >
                          {product?.productId?.name || "Unnamed Item"}
                        </Wrapper.Typography>
                      </div>
                      <Wrapper.Chip
                        label={`${product?.quantity || 0} ${
                          product?.productId?.unit || ""
                        }`}
                        color="success"
                        size="small"
                        className="ml-2"
                      />
                    </div>
                  </Wrapper.MenuItem>
                ))
              )}
            </Wrapper.Select>
          </Wrapper.FormControl>

          <Wrapper.TextField
            type="number"
            name="quantity"
            label="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": { borderColor: "#2e7d32" },
                "&:hover fieldset": { borderColor: "#2e7d32" },
                "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
              },
            }}
          />

          <Wrapper.TextField
            name="reason"
            label="Reason"
            value={formData.reason}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": { borderColor: "#2e7d32" },
                "&:hover fieldset": { borderColor: "#2e7d32" },
                "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
              },
            }}
          />

          <Wrapper.TextField
            type="date"
            name="date"
            label="Date"
            value={formData.date}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": { borderColor: "#2e7d32" },
                "&:hover fieldset": { borderColor: "#2e7d32" },
                "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
              },
            }}
          />

          <Wrapper.Button
            type="submit"
            variant="contained"
            color="success"
            disabled={loading || (!formData.itemId && !formData.dairyProductId)}
          >
            {loading ? "Processing..." : "Write Off Inventory"}
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Card>
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

export default CattleWriteOff;

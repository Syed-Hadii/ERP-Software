import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";

const CropWriteOff = () => {
  const theme = Wrapper.useTheme();
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    itemId: "",
    quantity: "",
    reason: "",
    owner: "agriculture",
    date: new Date().toISOString().split("T")[0],
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);

  // Fetch inventory items
  const fetchItems = async () => {
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/inventory/agriculture?all=true`
      );
      if (response.data) {
        setItems(response.data.inventoryList);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      showNotification("Failed to fetch items", "error");
    }
  };
  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ open: false, message: "", severity: "success" });

    try {
      const response = await Wrapper.axios.post(
        `${BASE_URL}/inventory-write-off/`,
        formData
      );
      if (response.data.success) {
        showNotification("Inventory written off successfully", "success");
        setFormData({
          itemId: "",
          quantity: "",
          reason: "",
          owner: "agriculture",
          date: new Date().toISOString().split("T")[0],
        });
        fetchItems();
      }
    } catch (error) {
      console.error("Error writing off inventory:", error);
      showNotification(
        error.response?.data?.message || "Write-off failed",
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
          Crop Inventory Write-off
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
              {items.map((invRecord) => (
                <Wrapper.MenuItem
                  key={invRecord?._id}
                  value={invRecord?.item?._id}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <Wrapper.Typography
                        variant="body1"
                        className="font-medium"
                      >
                        {invRecord?.item?.name}
                      </Wrapper.Typography>
                    </div>
                    <Wrapper.Chip
                      label={`${invRecord?.quantity} ${invRecord?.item?.unit}`}
                      color="success"
                      size="small"
                      className="ml-2"
                    />
                  </div>
                </Wrapper.MenuItem>
              ))}
            </Wrapper.Select>
          </Wrapper.FormControl>

          <Wrapper.TextField
            type="number"
            name="quantity"
            label="Quantity"
            color="success"
            value={formData.quantity}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
          />
          <Wrapper.TextField
            name="reason"
            label="Reason"
            color="success"
            value={formData.reason}
            onChange={handleChange}
          />
          <Wrapper.TextField
            type="date"
            name="date"
            label="Date"
            color="success"
            value={formData.date}
            onChange={handleChange}
            required
          />
          <Wrapper.Button
            type="submit"
            variant="contained"
            color="success"
            disabled={loading}
            sx={{
              borderRadius: 2,
              py: 1.5,
              "&.Mui-disabled": { opacity: 0.6 },
            }}
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

export default CropWriteOff;

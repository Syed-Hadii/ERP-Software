"use client";

import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import PropTypes from "prop-types";

// Utility function to safely access nested properties
const safeGet = (obj, path, defaultValue = "N/A") => {
  if (!obj || !path) return defaultValue;
  try {
    const value = path.split(".").reduce((o, k) => o?.[k], obj);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

const ScheduleModal = ({ open, onClose, onSubmit, scheduleType, cropId }) => {
  const [form, setForm] = useState({
    crop: cropId || "",
    date: "",
    method: "Drip", // Default for irrigation
    quantity: "",
    fertilizer: "",
    pesticide: "",
    employee: "", // Added employee field
    status: "pending",
    notes: "",
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [fertilizerItems, setFertilizerItems] = useState([]);
  const [pesticideItems, setPesticideItems] = useState([]);
  const [crops, setCrops] = useState([]);
  const [employees, setEmployees] = useState([]); // Added employees state
  const [loading, setLoading] = useState(false);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false); // Added loading state

  // Fetch crops if no cropId is provided
  useEffect(() => {
    if (open && !cropId) {
      fetchCrops();
    }
  }, [open, cropId]);

  // Fetch inventory and employees when modal opens
  useEffect(() => {
    if (open) {
      fetchInventory();
      fetchEmployees();
    }
  }, [open]);

  // Fetch available crops
  const fetchCrops = async () => {
    setLoadingCrops(true);
    try {
      const res = await Wrapper.axios.get(`${BASE_URL}/cropSow/?all=true`);
      setCrops(res?.data?.cropList || []);
    } catch (error) {
      console.error("Error fetching crops:", error);
      Wrapper.toast.error("Failed to load crops");
      setCrops([]);
    } finally {
      setLoadingCrops(false);
    }
  };

  // Fetch inventory data
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/inventory/agriculture?all=true`
      );
      const inventoryList = response?.data?.inventoryList || [];
      setInventoryItems(inventoryList);

      // Filter inventory items by category
      const fertilizers = inventoryList.filter(
        (item) => safeGet(item, "item.category", "") === "fertilizer"
      );
      const pesticides = inventoryList.filter(
        (item) => safeGet(item, "item.category", "") === "pesticide"
      );

      setFertilizerItems(fertilizers);
      setPesticideItems(pesticides);

      console.log("Fertilizer items:", fertilizers);
      console.log("Pesticide items:", pesticides);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      Wrapper.toast.error("Failed to load inventory data");
      setInventoryItems([]);
      setFertilizerItems([]);
      setPesticideItems([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/employees/`);
      console.log(response);
      setEmployees(
        Array.isArray(response?.data?.data)
          ? response?.data?.data?.filter((emp) => emp?.department === "Cattle")
          : []
      );
    } catch (error) {
      console.error("Error fetching employees:", error);
      Wrapper.toast.error("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting schedule form with data:", form);
    console.log("Using cropId:", cropId || form.crop);

    try {
      let endpoint = "";
      let payload = { ...form };

      // Validate required fields
      if (!payload.crop) {
        Wrapper.toast.error("Please select a crop assignment");
        setLoading(false);
        return;
      }
      if (!payload.employee) {
        Wrapper.toast.error("Please select an employee");
        setLoading(false);
        return;
      }

      // Prepare endpoint and payload based on schedule type
      switch (scheduleType) {
        case "Irrigation":
          endpoint = `${BASE_URL}/schedule/irrigation`;
          payload = {
            crop: cropId || form.crop,
            date: form.date,
            method: form.method,
            quantity: form.quantity,
            employee: form.employee,
            status: form.status,
            notes: form.notes,
          };
          break;

        case "Fertilization":
          endpoint = `${BASE_URL}/schedule/fertilization`;
          payload = {
            crop: cropId || form.crop,
            date: form.date,
            fertilizer: form.fertilizer,
            quantity: form.quantity,
            employee: form.employee,
            status: form.status,
            notes: form.notes,
          };
          break;

        case "Pesticide":
          endpoint = `${BASE_URL}/schedule/pesticide`;
          payload = {
            crop: cropId || form.crop,
            date: form.date,
            pesticide: form.pesticide,
            quantity: form.quantity,
            employee: form.employee,
            status: form.status,
            notes: form.notes,
          };
          break;

        default:
          throw new Error("Invalid schedule type");
      }

      console.log(
        `Sending ${scheduleType} schedule request with payload:`,
        payload
      );

      // Make API call
      const response = await Wrapper.axios.post(endpoint, payload);

      console.log(
        `${scheduleType} schedule created successfully, server response:`,
        response.data
      );

      // Handle success
      Wrapper.toast.success(`${scheduleType} schedule added successfully!`);

      // Reset form
      setForm({
        crop: cropId || "",
        date: "",
        method: "Drip",
        quantity: "",
        fertilizer: "",
        pesticide: "",
        employee: "",
        status: "pending",
        notes: "",
      });

      onClose();

      // If parent component needs the response
      if (onSubmit) {
        onSubmit(response.data);
      }
    } catch (error) {
      console.error(
        `Error adding ${scheduleType.toLowerCase()} schedule:`,
        error
      );
      const errorMsg = safeGet(
        error,
        "response.data.error",
        `Failed to add ${scheduleType.toLowerCase()} schedule`
      );
      Wrapper.toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get schedule-specific fields
  const getTypeSpecificFields = () => {
    switch (scheduleType) {
      case "Irrigation":
        return (
          <>
            <Wrapper.Grid item xs={12}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="method"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Irrigation Method
                </Wrapper.InputLabel>
                <Wrapper.Select
                  id="method"
                  name="method"
                  value={form.method}
                  onChange={handleChange}
                  label="Irrigation Method"
                  required
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      },
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.OpacityIcon color="primary" />
                    </Wrapper.InputAdornment>
                  }
                >
                  <Wrapper.MenuItem value="Drip">
                    Drip Irrigation
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Sprinkler">
                    Sprinkler
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Flood">
                    Flood Irrigation
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Manual">
                    Manual Watering
                  </Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>

            <Wrapper.Grid item xs={12} sx={{ mt: 2 }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="quantity"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Water Amount (liters)
                </Wrapper.InputLabel>
                <Wrapper.OutlinedInput
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  label="Water Amount (liters)"
                  placeholder="Enter amount in liters"
                  required
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.LocalDrinkIcon color="primary" />
                    </Wrapper.InputAdornment>
                  }
                  endAdornment={
                    <Wrapper.InputAdornment position="end">
                      L
                    </Wrapper.InputAdornment>
                  }
                />
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </>
        );

      case "Fertilization":
        return (
          <>
            <Wrapper.Grid item xs={12}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="fertilizer"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Fertilizer
                </Wrapper.InputLabel>
                <Wrapper.Select
                  id="fertilizer"
                  name="fertilizer"
                  value={form.fertilizer}
                  onChange={handleChange}
                  label="Fertilizer"
                  required
                  disabled={loadingInventory}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      },
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.EcoIcon color="success" />
                    </Wrapper.InputAdornment>
                  }
                >
                  {loadingInventory ? (
                    <Wrapper.MenuItem disabled>
                      Loading fertilizers...
                    </Wrapper.MenuItem>
                  ) : fertilizerItems.length === 0 ? (
                    <Wrapper.MenuItem disabled>
                      No fertilizers available
                    </Wrapper.MenuItem>
                  ) : (
                    fertilizerItems.map((item) => (
                      <Wrapper.MenuItem
                        key={safeGet(item, "_id", "unknown")}
                        value={safeGet(item, "item._id", "")}
                      >
                        {safeGet(item, "item.name", "Unknown Fertilizer")} (
                        {safeGet(item, "quantity", 0)} available) -{" "}
                        {safeGet(item, "item.description", "No description")}
                      </Wrapper.MenuItem>
                    ))
                  )}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>

            <Wrapper.Grid item xs={12} sx={{ mt: 2 }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="quantity"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Fertilizer Amount (kg)
                </Wrapper.InputLabel>
                <Wrapper.OutlinedInput
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  label="Fertilizer Amount (kg)"
                  placeholder="Enter amount in kg"
                  required
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.ScaleIcon color="success" />
                    </Wrapper.InputAdornment>
                  }
                  endAdornment={
                    <Wrapper.InputAdornment position="end">
                      kg
                    </Wrapper.InputAdornment>
                  }
                />
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </>
        );

      case "Pesticide":
        return (
          <>
            <Wrapper.Grid item xs={12}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="pesticide"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Pesticide
                </Wrapper.InputLabel>
                <Wrapper.Select
                  id="pesticide"
                  name="pesticide"
                  value={form.pesticide}
                  onChange={handleChange}
                  label="Pesticide"
                  required
                  disabled={loadingInventory}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      },
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.BugReportIcon color="error" />
                    </Wrapper.InputAdornment>
                  }
                >
                  {loadingInventory ? (
                    <Wrapper.MenuItem disabled>
                      Loading pesticides...
                    </Wrapper.MenuItem>
                  ) : pesticideItems.length === 0 ? (
                    <Wrapper.MenuItem disabled>
                      No pesticides available
                    </Wrapper.MenuItem>
                  ) : (
                    pesticideItems.map((item) => (
                      <Wrapper.MenuItem
                        key={safeGet(item, "_id", "unknown")}
                        value={safeGet(item, "item._id", "")}
                      >
                        {safeGet(item, "item.name", "Unknown Pesticide")} (
                        {safeGet(item, "quantity", 0)} available) -{" "}
                        {safeGet(item, "item.description", "No description")}
                      </Wrapper.MenuItem>
                    ))
                  )}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>

            <Wrapper.Grid item xs={12} sx={{ mt: 2 }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="quantity"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Pesticide Amount (ml)
                </Wrapper.InputLabel>
                <Wrapper.OutlinedInput
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  label="Pesticide Amount (ml)"
                  placeholder="Enter amount in ml"
                  required
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.ScienceIcon color="error" />
                    </Wrapper.InputAdornment>
                  }
                  endAdornment={
                    <Wrapper.InputAdornment position="end">
                      ml
                    </Wrapper.InputAdornment>
                  }
                />
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </>
        );

      default:
        return null;
    }
  };

  // Get schedule icon and color
  const getScheduleIconAndColor = () => {
    switch (scheduleType) {
      case "Irrigation":
        return {
          icon: <Wrapper.OpacityIcon sx={{ fontSize: 28 }} />,
          color: "#1976d2",
          bgColor: "rgba(25, 118, 210, 0.1)",
        };
      case "Fertilization":
        return {
          icon: <Wrapper.EcoIcon sx={{ fontSize: 28 }} />,
          color: "#2e7d32",
          bgColor: "rgba(46, 125, 50, 0.1)",
        };
      case "Pesticide":
        return {
          icon: <Wrapper.BugReportIcon sx={{ fontSize: 28 }} />,
          color: "#d32f2f",
          bgColor: "rgba(211, 47, 47, 0.1)",
        };
      default:
        return {
          icon: <Wrapper.EventNoteIcon sx={{ fontSize: 28 }} />,
          color: "#757575",
          bgColor: "rgba(117, 117, 117, 0.1)",
        };
    }
  };

  const { icon, color } = getScheduleIconAndColor();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setForm({
        crop: cropId || "",
        date: "",
        method: "Drip",
        quantity: "",
        fertilizer: "",
        pesticide: "",
        employee: "",
        status: "pending",
        notes: "",
      });
    } else {
      console.log("ScheduleModal opened with cropId:", cropId);
      setForm((prev) => ({ ...prev, crop: cropId || "" }));
    }
  }, [open, cropId]);

  return (
    <Wrapper.Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <Wrapper.Box
        sx={{
          p: 3,
          background: `linear-gradient(45deg, ${color}DD, ${color})`,
          color: "white",
        }}
      >
        <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
          <Wrapper.Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255, 255, 255, 0.2)",
              mr: 2,
            }}
          >
            {icon}
          </Wrapper.Box>
          <Wrapper.Box>
            <Wrapper.Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 600 }}
            >
              Add {scheduleType} Schedule
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              Fill in the details below to create a new{" "}
              {scheduleType ? scheduleType.toLowerCase() : ""} schedule
            </Wrapper.Typography>
          </Wrapper.Box>
        </Wrapper.Box>
      </Wrapper.Box>

      <form
        onSubmit={handleSubmit}
        style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Wrapper.DialogContent sx={{ p: 3 }}>
          <Wrapper.Grid container spacing={3}>
            {/* Crop Selection */}
            {!cropId && (
              <Wrapper.Grid item xs={12}>
                <Wrapper.FormControl fullWidth>
                  <Wrapper.InputLabel
                    htmlFor="crop"
                    sx={{ bgcolor: "white", px: 0.5 }}
                  >
                    Crop Assignment
                  </Wrapper.InputLabel>
                  <Wrapper.Select
                    id="crop"
                    name="crop"
                    value={form.crop}
                    onChange={handleChange}
                    label="Crop Assignment"
                    required
                    disabled={loadingCrops}
                    sx={{
                      borderRadius: 2,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(0, 0, 0, 0.12)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2e7d32",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#2e7d32",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          borderRadius: 2,
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        },
                      },
                    }}
                    startAdornment={
                      <Wrapper.InputAdornment position="start">
                        <Wrapper.AgricultureIcon sx={{ color: "#2e7d32" }} />
                      </Wrapper.InputAdornment>
                    }
                  >
                    {loadingCrops ? (
                      <Wrapper.MenuItem disabled>
                        <Wrapper.Box
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <Wrapper.CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading crops...
                        </Wrapper.Box>
                      </Wrapper.MenuItem>
                    ) : crops.length === 0 ? (
                      <Wrapper.MenuItem disabled>
                        No crops available
                      </Wrapper.MenuItem>
                    ) : (
                      crops.map((crop) => (
                        <Wrapper.MenuItem
                          key={safeGet(crop, "_id", "unknown")}
                          value={safeGet(crop, "_id", "")}
                        >
                          {safeGet(crop, "crop.name", "Unknown Crop")} (
                          {safeGet(crop, "land.name", "Unknown Land")})
                        </Wrapper.MenuItem>
                      ))
                    )}
                  </Wrapper.Select>
                </Wrapper.FormControl>
              </Wrapper.Grid>
            )}

            {/* Employee Selection */}
            <Wrapper.Grid item xs={12}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="employee"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Employee
                </Wrapper.InputLabel>
                <Wrapper.Select
                  id="employee"
                  name="employee"
                  value={form.employee}
                  onChange={handleChange}
                  label="Employee"
                  required
                  disabled={loadingEmployees}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      },
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.PersonIcon sx={{ color: "#2e7d32" }} />
                    </Wrapper.InputAdornment>
                  }
                >
                  {loadingEmployees ? (
                    <Wrapper.MenuItem disabled>
                      <Wrapper.Box
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <Wrapper.CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading employees...
                      </Wrapper.Box>
                    </Wrapper.MenuItem>
                  ) : employees.length === 0 ? (
                    <Wrapper.MenuItem disabled>
                      No employees available
                    </Wrapper.MenuItem>
                  ) : (
                    employees.map((employee) => {
                      const name = `${safeGet(
                        employee,
                        "firstName",
                        ""
                      )} ${safeGet(employee, "lastName", "")}`.trim();
                      return (
                        <Wrapper.MenuItem
                          key={safeGet(employee, "_id", "unknown")}
                          value={safeGet(employee, "_id", "")}
                        >
                          {name || "Unknown Employee"}
                          <span
                            style={{
                              backgroundColor: "#e0e0e0",
                              borderRadius: "12px",
                              padding: "2px 8px",
                              fontSize: "12px",
                              marginLeft: "8px",
                            }}
                          >
                            {employee.designation}
                          </span>
                        </Wrapper.MenuItem>
                      );
                    })
                  )}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>

            {/* Date Selection */}
            <Wrapper.Grid item xs={12}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="date"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Schedule Date
                </Wrapper.InputLabel>
                <Wrapper.OutlinedInput
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  label="Schedule Date"
                  required
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.CalendarMonthIcon sx={{ color: "#2e7d32" }} />
                    </Wrapper.InputAdornment>
                  }
                />
              </Wrapper.FormControl>
            </Wrapper.Grid>

            {/* Type-specific fields */}
            {getTypeSpecificFields()}

            {/* Status Selection */}
            <Wrapper.Grid item xs={12} sx={{ mt: 2 }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="status"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Status
                </Wrapper.InputLabel>
                <Wrapper.Select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  label="Status"
                  required
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                      },
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.AssignmentTurnedInIcon
                        sx={{ color: "#2e7d32" }}
                      />
                    </Wrapper.InputAdornment>
                  }
                >
                  <Wrapper.MenuItem value="pending">
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      <Wrapper.Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#ffc107",
                          mr: 1,
                        }}
                      />
                      Pending
                    </Wrapper.Box>
                  </Wrapper.MenuItem>
                  <Wrapper.MenuItem value="completed">
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      <Wrapper.Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#2e7d32",
                          mr: 1,
                        }}
                      />
                      Completed
                    </Wrapper.Box>
                  </Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>

            {/* Notes */}
            <Wrapper.Grid item xs={12} sx={{ mt: 2 }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel
                  htmlFor="notes"
                  sx={{ bgcolor: "white", px: 0.5 }}
                >
                  Notes
                </Wrapper.InputLabel>
                <Wrapper.OutlinedInput
                  id="notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={form.notes || ""}
                  onChange={handleChange}
                  label="Notes"
                  placeholder="Enter additional details"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.12)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e7d32",
                    },
                  }}
                  startAdornment={
                    <Wrapper.InputAdornment
                      position="start"
                      sx={{ alignSelf: "flex-start", mt: 1.5 }}
                    >
                      <Wrapper.StickyNote2Icon sx={{ color: "#2e7d32" }} />
                    </Wrapper.InputAdornment>
                  }
                />
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.DialogContent>

        <Wrapper.DialogActions
          sx={{ p: 3, pt: 0, justifyContent: "space-between" }}
        >
          <Wrapper.Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              borderColor: "rgba(0, 0, 0, 0.12)",
              color: "text.primary",
              "&:hover": {
                borderColor: "rgba(0, 0, 0, 0.24)",
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
            startIcon={<Wrapper.CloseIcon />}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: "#2e7d32",
              "&:hover": {
                bgcolor: "#1b5e20",
              },
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.2)",
            }}
            startIcon={
              loading ? (
                <Wrapper.CircularProgress size={20} />
              ) : (
                <Wrapper.AddIcon />
              )
            }
          >
            Add Schedule
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </form>
    </Wrapper.Dialog>
  );
};

export default ScheduleModal;

// PropTypes validation
ScheduleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  scheduleType: PropTypes.oneOf(["Irrigation", "Fertilization", "Pesticide"]),
  cropId: PropTypes.string,
};

"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isValid } from "date-fns";
import Wrapper from "../utils/wrapper";
import { BASE_URL } from "../config/config";

const PurchaseInvoiceForm = ({
  open,
  onClose,
  fetchInvoices,
  suppliers,
  items,
  suppliersLoading,
  itemsLoading,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(Date.now() + 7 * 24 * 3600 * 1000), "yyyy-MM-dd"),
    reference: "",
    supplier: "",
    description: "",
    items: [{ item: "", quantity: "", unitPrice: "", discountPercent: 0 }],
    subtotal: 0,
    discountAmount: 0,
    totalAmount: 0,
  });
  const [formErrors, setFormErrors] = useState({});

  const formatNumber = (value) => {
    if (!value && value !== 0) return "";
    const plainNumber = String(value).replace(/,/g, "");
    return isNaN(plainNumber)
      ? ""
      : Number.parseFloat(plainNumber).toLocaleString("en-US");
  };

  const parseNumber = (value) => {
    if (!value) return "";
    const plainNumber = String(value).replace(/,/g, "");
    return isNaN(plainNumber) ? "" : Number.parseFloat(plainNumber);
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number.parseFloat(item.quantity) || 0;
      const unitPrice = Number.parseFloat(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const discountAmount = items?.reduce((sum, item) => {
      const itemSubtotal =
        (Number.parseFloat(item.quantity) || 0) *
        (Number.parseFloat(item.unitPrice) || 0);
      return (
        sum +
        (itemSubtotal * (Number.parseFloat(item.discountPercent) || 0)) / 100
      );
    }, 0);

    const totalAmount = subtotal - discountAmount;
    return { subtotal, discountAmount, totalAmount };
  };

  const validateForm = () => {
    const errors = {};
    const parsedDate = new Date(formData.date);
    if (!formData.date || !isValid(parsedDate)) {
      errors.date = "Valid issue date is required";
    }

    const parsedDueDate = new Date(formData.dueDate);
    if (!formData.dueDate || !isValid(parsedDueDate)) {
      errors.dueDate = "Valid due date is required";
    } else if (parsedDueDate < parsedDate) {
      errors.dueDate = "Due date must be after issue date";
    }

    if (!formData.supplier) {
      errors.supplier = "Supplier is required";
    }

    if (!formData.items?.length) {
      errors.items = "At least one item is required";
    }

    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const itemError = {};
      if (!item.item) itemError.item = "Item is required";
      if (!item.quantity || Number.parseFloat(item.quantity) <= 0) {
        itemError.quantity = "Valid quantity is required";
      }
      if (!item.unitPrice || Number.parseFloat(item.unitPrice) < 0) {
        itemError.unitPrice = "Valid unit price is required";
      }
      if (
        Number.parseFloat(item.discountPercent) < 0 ||
        Number.parseFloat(item.discountPercent) > 100
      ) {
        itemError.discountPercent = "Discount must be between 0 and 100";
      }
      if (Object.keys(itemError).length) itemErrors[index] = itemError;
    });

    if (itemErrors.length) errors.itemsRows = itemErrors;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    const { subtotal, discountAmount, totalAmount } =
      calculateTotals(updatedItems);

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  };

  const handleAmountBlur = (index) => {
    const updatedItems = [...formData.items];
    const rawValue = updatedItems[index].unitPrice;
    const parsedValue = parseNumber(rawValue);
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      updatedItems[index].unitPrice = parsedValue;
    } else {
      updatedItems[index].unitPrice = "";
    }

    const { subtotal, discountAmount, totalAmount } =
      calculateTotals(updatedItems);

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { item: "", quantity: "", unitPrice: "", discountPercent: 0 },
      ],
    });
  };

  const removeItemRow = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const { subtotal, discountAmount, totalAmount } =
      calculateTotals(updatedItems);

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Wrapper.toast.error("Please correct the form errors.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date: new Date(formData.date).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        reference: formData.reference,
        supplier: formData.supplier,
        description: formData.description,
        items: formData.items.map((i) => ({
          item: i.item,
          quantity: Number.parseFloat(i.quantity) || 0,
          unitPrice: Number.parseFloat(i.unitPrice) || 0,
          discountPercent: Number.parseFloat(i.discountPercent) || 0,
        })),
      };

      const response = await Wrapper.axios.post(
        `${BASE_URL}/purchase/`,
        payload
      );

      if (response.data?.success) {
        Wrapper.toast.success("Purchase invoice created successfully!");
        setInvoiceDetails(response.data.data);
        setIsPreviewOpen(true);
        setFormData({
          date: format(new Date(), "yyyy-MM-dd"),
          dueDate: format(
            new Date(Date.now() + 7 * 24 * 3600 * 1000),
            "yyyy-MM-dd"
          ),
          reference: "",
          supplier: "",
          description: "",
          items: [
            { item: "", quantity: "", unitPrice: "", discountPercent: 0 },
          ],
          subtotal: 0,
          discountAmount: 0,
          totalAmount: 0,
        });
        setFormErrors({});
        fetchInvoices();
      } else {
        Wrapper.toast.error(
          response.data?.message || "Failed to create invoice"
        );
      }
    } catch (error) {
      Wrapper.toast.error(
        error.response?.data?.message || "Failed to create invoice"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printArea").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Invoice</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e0e0e0; padding: 8px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <>
      <Wrapper.Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
            maxHeight: "90vh",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ p: 0 }}>
          <Wrapper.Box
            sx={{
              background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
              color: "white",
              p: 3,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: "100px",
                height: "100px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "50%",
                transform: "translate(30px, -30px)",
              },
            }}
          >
            <Wrapper.Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                position: "relative",
                zIndex: 1,
              }}
            >
              <Wrapper.Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Wrapper.ShoppingCartIcon
                  sx={{ fontSize: 24, color: "white" }}
                />
              </Wrapper.Box>
              <Wrapper.Box>
                <Wrapper.Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Create Purchase Invoice
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Add new stock purchase to your inventory
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.DialogTitle>

        <Wrapper.DialogContent sx={{ p: 0, bgcolor: "#f8fffe" }}>
          <form onSubmit={handleSubmit}>
            <Wrapper.Box sx={{ p: 4 }}>
              {/* Document Information Section */}
              <Wrapper.Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: "16px",
                  border: "1px solid #e8f5e8",
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box
                  sx={{
                    background:
                      "linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)",
                    color: "white",
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Wrapper.Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wrapper.ReceiptIcon fontSize="small" />
                  </Wrapper.Box>
                  <Wrapper.Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Document Information
                  </Wrapper.Typography>
                </Wrapper.Box>

                <Wrapper.CardContent sx={{ p: 3 }}>
                  <Wrapper.Grid container spacing={3}>
                    <Wrapper.Grid item xs={12} sm={6}>
                      <Wrapper.TextField
                        label="Issue Date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        error={!!formErrors.date}
                        helperText={formErrors.date}
                        inputProps={{
                          max: new Date().toISOString().split("T")[0],
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#2E7D32",
                          },
                        }}
                      />
                    </Wrapper.Grid>
                    <Wrapper.Grid item xs={12} sm={6}>
                      <Wrapper.TextField
                        label="Due Date"
                        name="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        error={!!formErrors.dueDate}
                        helperText={formErrors.dueDate}
                        inputProps={{ min: formData.date }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#2E7D32",
                          },
                        }}
                      />
                    </Wrapper.Grid>
                    <Wrapper.Grid item xs={12} sm={6}>
                      <Wrapper.TextField
                        label="Reference Number"
                        name="reference"
                        value={formData.reference}
                        onChange={handleInputChange}
                        fullWidth
                        error={!!formErrors.reference}
                        helperText={formErrors.reference}
                        placeholder="Enter reference number"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#2E7D32",
                          },
                        }}
                      />
                    </Wrapper.Grid>
                    <Wrapper.Grid item xs={12} sm={6}>
                      <Wrapper.FormControl
                        fullWidth
                        error={!!formErrors.supplier}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#2E7D32",
                          },
                        }}
                      >
                        <Wrapper.InputLabel>Supplier *</Wrapper.InputLabel>
                        <Wrapper.Select
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleInputChange}
                          label="Supplier *"
                          disabled={suppliersLoading}
                        >
                          {suppliers?.map((sup) => (
                            <Wrapper.MenuItem key={sup._id} value={sup._id}>
                              {sup.name}
                            </Wrapper.MenuItem>
                          ))}
                        </Wrapper.Select>
                        {formErrors.supplier && (
                          <Wrapper.FormHelperText>
                            {formErrors.supplier}
                          </Wrapper.FormHelperText>
                        )}
                      </Wrapper.FormControl>
                    </Wrapper.Grid>
                    <Wrapper.Grid item xs={12}>
                      <Wrapper.TextField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        fullWidth
                        error={!!formErrors.description}
                        helperText={formErrors.description}
                        placeholder="Enter purchase description or notes"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#2E7D32",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#2E7D32",
                          },
                        }}
                      />
                    </Wrapper.Grid>
                  </Wrapper.Grid>
                </Wrapper.CardContent>
              </Wrapper.Card>

              {/* Items Section */}
              <Wrapper.Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: "16px",
                  border: "1px solid #e8f5e8",
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box
                  sx={{
                    background:
                      "linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)",
                    color: "white",
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Wrapper.Box
                    sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                  >
                    <Wrapper.Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Wrapper.InventoryIcon fontSize="small" />
                    </Wrapper.Box>
                    <Wrapper.Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Purchase Items
                    </Wrapper.Typography>
                  </Wrapper.Box>
                  <Wrapper.Chip
                    label={`${formData.items.length} item${
                      formData.items.length !== 1 ? "s" : ""
                    }`}
                    sx={{
                      background: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: 600,
                    }}
                  />
                </Wrapper.Box>

                <Wrapper.CardContent sx={{ p: 3 }}>
                  {formData.items.map((item, index) => (
                    <Wrapper.Card
                      key={index}
                      elevation={0}
                      sx={{
                        mb: 2,
                        borderRadius: "12px",
                        border: "2px solid #f1f8e9",
                        background:
                          "linear-gradient(145deg, #ffffff 0%, #f9fff9 100%)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: "#c8e6c9",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 24px rgba(46, 125, 50, 0.1)",
                        },
                      }}
                    >
                      <Wrapper.CardContent sx={{ p: 2.5 }}>
                        <Wrapper.Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2,
                          }}
                        >
                          <Wrapper.Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: "#2E7D32" }}
                          >
                            Item #{index + 1}
                          </Wrapper.Typography>
                          {formData.items.length > 1 && (
                            <Wrapper.IconButton
                              onClick={() => removeItemRow(index)}
                              size="small"
                              sx={{
                                color: "#f44336",
                                "&:hover": {
                                  backgroundColor: "#ffebee",
                                },
                              }}
                            >
                              <Wrapper.DeleteIcon fontSize="small" />
                            </Wrapper.IconButton>
                          )}
                        </Wrapper.Box>

                        <Wrapper.Grid container spacing={2}>
                          <Wrapper.Grid item xs={12} md={4}>
                            <Wrapper.FormControl
                              fullWidth
                              error={!!formErrors.itemsRows?.[index]?.item}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#2E7D32",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#2E7D32",
                                    },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#2E7D32",
                                },
                              }}
                            >
                              <Wrapper.InputLabel>
                                Select Item *
                              </Wrapper.InputLabel>
                              <Wrapper.Select
                                value={item.item}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "item",
                                    e.target.value
                                  )
                                }
                                label="Select Item *"
                                disabled={itemsLoading}
                              >
                                {items?.map((it) => (
                                  <Wrapper.MenuItem key={it._id} value={it._id}>
                                    <Wrapper.Box>
                                      <Wrapper.Typography
                                        variant="body2"
                                        sx={{ fontWeight: 500 }}
                                      >
                                        {it.name}
                                      </Wrapper.Typography>
                                      <Wrapper.Typography
                                        variant="caption"
                                        color="textSecondary"
                                      >
                                        Unit: {it.unit || "N/A"}
                                      </Wrapper.Typography>
                                    </Wrapper.Box>
                                  </Wrapper.MenuItem>
                                ))}
                              </Wrapper.Select>
                              {formErrors.itemsRows?.[index]?.item && (
                                <Wrapper.FormHelperText>
                                  {formErrors.itemsRows[index].item}
                                </Wrapper.FormHelperText>
                              )}
                            </Wrapper.FormControl>
                          </Wrapper.Grid>

                          <Wrapper.Grid item xs={12} md={2}>
                            <Wrapper.TextField
                              label="Quantity *"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              type="number"
                              fullWidth
                              error={!!formErrors.itemsRows?.[index]?.quantity}
                              helperText={
                                formErrors.itemsRows?.[index]?.quantity
                              }
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#2E7D32",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#2E7D32",
                                    },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#2E7D32",
                                },
                              }}
                            />
                          </Wrapper.Grid>

                          <Wrapper.Grid item xs={12} md={3}>
                            <Wrapper.TextField
                              label="Unit Price (PKR) *"
                              value={formatNumber(item.unitPrice)}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              onBlur={() => handleAmountBlur(index)}
                              type="text"
                              fullWidth
                              error={!!formErrors.itemsRows?.[index]?.unitPrice}
                              helperText={
                                formErrors.itemsRows?.[index]?.unitPrice
                              }
                              InputProps={{
                                startAdornment: (
                                  <Wrapper.InputAdornment position="start">
                                    <Wrapper.Typography
                                      sx={{ color: "#2E7D32", fontWeight: 600 }}
                                    >
                                      PKR
                                    </Wrapper.Typography>
                                  </Wrapper.InputAdornment>
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#2E7D32",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#2E7D32",
                                    },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#2E7D32",
                                },
                              }}
                            />
                          </Wrapper.Grid>

                          <Wrapper.Grid item xs={12} md={3}>
                            <Wrapper.TextField
                              label="Discount (%)"
                              value={item.discountPercent}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "discountPercent",
                                  e.target.value
                                )
                              }
                              type="number"
                              fullWidth
                              error={
                                !!formErrors.itemsRows?.[index]?.discountPercent
                              }
                              helperText={
                                formErrors.itemsRows?.[index]?.discountPercent
                              }
                              InputProps={{
                                endAdornment: (
                                  <Wrapper.InputAdornment position="end">
                                    <Wrapper.Typography
                                      sx={{ color: "#2E7D32", fontWeight: 600 }}
                                    >
                                      %
                                    </Wrapper.Typography>
                                  </Wrapper.InputAdornment>
                                ),
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#2E7D32",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#2E7D32",
                                    },
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "#2E7D32",
                                },
                              }}
                            />
                          </Wrapper.Grid>
                        </Wrapper.Grid>
                      </Wrapper.CardContent>
                    </Wrapper.Card>
                  ))}

                  <Wrapper.Button
                    variant="outlined"
                    startIcon={<Wrapper.AddIcon />}
                    onClick={addItemRow}
                    sx={{
                      mt: 2,
                      borderRadius: "12px",
                      borderColor: "#2E7D32",
                      color: "#2E7D32",
                      textTransform: "none",
                      fontWeight: 600,
                      py: 1.5,
                      px: 3,
                      "&:hover": {
                        borderColor: "#1B5E20",
                        backgroundColor: "#f1f8e9",
                      },
                    }}
                  >
                    Add Another Item
                  </Wrapper.Button>
                </Wrapper.CardContent>
              </Wrapper.Card>

              {/* Summary Section */}
              <Wrapper.Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: "16px",
                  border: "2px solid #e8f5e8",
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f8fffe 100%)",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box
                  sx={{
                    background:
                      "linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)",
                    color: "white",
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Wrapper.Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wrapper.CalculateIcon fontSize="small" />
                  </Wrapper.Box>
                  <Wrapper.Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Purchase Summary
                  </Wrapper.Typography>
                </Wrapper.Box>

                <Wrapper.CardContent sx={{ p: 3 }}>
                  <Wrapper.Grid container spacing={3}>
                    <Wrapper.Grid item xs={12} sm={4}>
                      <Wrapper.Box
                        sx={{
                          p: 2.5,
                          borderRadius: "12px",
                          background:
                            "linear-gradient(145deg, #f1f8e9 0%, #e8f5e8 100%)",
                          border: "1px solid #c8e6c9",
                        }}
                      >
                        <Wrapper.Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 1 }}
                        >
                          Subtotal
                        </Wrapper.Typography>
                        <Wrapper.Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#2E7D32" }}
                        >
                          PKR {formatNumber(formData.subtotal)}
                        </Wrapper.Typography>
                      </Wrapper.Box>
                    </Wrapper.Grid>

                    <Wrapper.Grid item xs={12} sm={4}>
                      <Wrapper.Box
                        sx={{
                          p: 2.5,
                          borderRadius: "12px",
                          background:
                            "linear-gradient(145deg, #fff3e0 0%, #ffe0b2 100%)",
                          border: "1px solid #ffcc02",
                        }}
                      >
                        <Wrapper.Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 1 }}
                        >
                          Total Discount
                        </Wrapper.Typography>
                        <Wrapper.Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#f57c00" }}
                        >
                          PKR {formatNumber(formData.discountAmount)}
                        </Wrapper.Typography>
                      </Wrapper.Box>
                    </Wrapper.Grid>

                    <Wrapper.Grid item xs={12} sm={4}>
                      <Wrapper.Box
                        sx={{
                          p: 2.5,
                          borderRadius: "12px",
                          background:
                            "linear-gradient(145deg, #2E7D32 0%, #1B5E20 100%)",
                          color: "white",
                          boxShadow: "0 8px 24px rgba(46, 125, 50, 0.3)",
                        }}
                      >
                        <Wrapper.Typography
                          variant="body2"
                          sx={{ mb: 1, opacity: 0.9 }}
                        >
                          Total Amount
                        </Wrapper.Typography>
                        <Wrapper.Typography
                          variant="h5"
                          sx={{ fontWeight: 700 }}
                        >
                          PKR {formatNumber(formData.totalAmount)}
                        </Wrapper.Typography>
                      </Wrapper.Box>
                    </Wrapper.Grid>
                  </Wrapper.Grid>
                </Wrapper.CardContent>
              </Wrapper.Card>

              {/* Action Buttons */}
              <Wrapper.Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 4,
                }}
              >
                <Wrapper.Button
                  variant="outlined"
                  onClick={onClose}
                  sx={{
                    borderRadius: "12px",
                    px: 4,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#bdbdbd",
                    color: "#757575",
                    "&:hover": {
                      borderColor: "#9e9e9e",
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  Cancel
                </Wrapper.Button>

                <Wrapper.Button
                  type="submit"
                  variant="contained"
                  disabled={loading || itemsLoading || suppliersLoading}
                  startIcon={
                    loading ? (
                      <Wrapper.CircularProgress size={20} color="inherit" />
                    ) : (
                      <Wrapper.SaveIcon />
                    )
                  }
                  sx={{
                    borderRadius: "12px",
                    px: 4,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    background:
                      "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
                    boxShadow: "0 8px 24px rgba(46, 125, 50, 0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #1B5E20 0%, #0d4e12 100%)",
                      boxShadow: "0 12px 32px rgba(46, 125, 50, 0.4)",
                    },
                    "&:disabled": {
                      background: "#e0e0e0",
                    },
                  }}
                >
                  {loading ? "Creating Invoice..." : "Create Purchase Invoice"}
                </Wrapper.Button>
              </Wrapper.Box>
            </Wrapper.Box>
          </form>
        </Wrapper.DialogContent>
      </Wrapper.Dialog>

      {/* Preview Dialog */}
      <Wrapper.Dialog
        open={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          onClose();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ p: 0 }}>
          <Wrapper.Box
            sx={{
              background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
              color: "white",
              p: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Wrapper.Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrapper.ReceiptIcon />
            </Wrapper.Box>
            <Wrapper.Box>
              <Wrapper.Typography variant="h6" sx={{ fontWeight: 700 }}>
                Purchase Invoice Created
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2" sx={{ opacity: 0.9 }}>
                Review and print your invoice
              </Wrapper.Typography>
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.DialogTitle>

        <Wrapper.DialogContent sx={{ p: 0, bgcolor: "#f8fffe" }}>
          {invoiceDetails && (
            <Wrapper.Box id="printArea" sx={{ p: 3 }}>
              <Wrapper.Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 3,
                  pb: 2,
                  borderBottom: "2px dashed #e0e0e0",
                }}
              >
                <Wrapper.Box>
                  <Wrapper.Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "#2E7D32", mb: 1 }}
                  >
                    Purchase Invoice
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="textSecondary">
                    Invoice Record
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Box sx={{ textAlign: "right" }}>
                  <Wrapper.Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Invoice Number:</strong>{" "}
                    {invoiceDetails.invoiceNumber || "--"}
                  </Wrapper.Typography>
                  <Wrapper.Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Date:</strong>{" "}
                    {new Date(invoiceDetails.date).toLocaleDateString("en-GB")}
                  </Wrapper.Typography>
                  <Wrapper.Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 0.5 }}
                  >
                    <strong>Due Date:</strong>{" "}
                    {invoiceDetails.dueDate
                      ? new Date(invoiceDetails.dueDate).toLocaleDateString(
                          "en-GB"
                        )
                      : "--"}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="textSecondary">
                    <strong>Reference:</strong>{" "}
                    {invoiceDetails.reference || "--"}
                  </Wrapper.Typography>
                </Wrapper.Box>
              </Wrapper.Box>

              <Wrapper.Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: "1px solid #e8f5e8",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box sx={{ bgcolor: "#f1f8e9", p: 2 }}>
                  <Wrapper.Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#2E7D32" }}
                  >
                    Invoice Details
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Table>
                  <Wrapper.TableBody>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ width: "40%", fontWeight: 600 }}>
                        Supplier
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {suppliers?.find(
                          (s) => s._id === invoiceDetails.supplier
                        )?.name || "--"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                        Description
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {invoiceDetails.description || "--"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.Card>

              <Wrapper.Card
                elevation={0}
                sx={{
                  border: "1px solid #e8f5e8",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box
                  sx={{
                    bgcolor: "#f1f8e9",
                    p: 2,
                    borderBottom: "1px solid #e8f5e8",
                  }}
                >
                  <Wrapper.Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#2E7D32",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Wrapper.InventoryIcon fontSize="small" /> Items
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Table>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                        Item
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                        Quantity
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                        Unit Price (PKR)
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                        Discount (%)
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right" sx={{ fontWeight: 600 }}>
                        Amount (PKR)
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {invoiceDetails.items?.map((item, index) => {
                      const itemSubtotal = item.quantity * item.unitPrice;
                      const itemDiscount =
                        (itemSubtotal * (item.discountPercent || 0)) / 100;
                      const itemTotal = itemSubtotal - itemDiscount;
                      return (
                        <Wrapper.TableRow key={index}>
                          <Wrapper.TableCell>
                            {items?.find((i) => i._id === item.item)?.name ||
                              "--"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {item.quantity || "--"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {formatNumber(item.unitPrice)}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell>
                            {item.discountPercent || 0}%
                          </Wrapper.TableCell>
                          <Wrapper.TableCell align="right">
                            {formatNumber(itemTotal)}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                      );
                    })}
                    <Wrapper.TableRow sx={{ bgcolor: "#f9fff9" }}>
                      <Wrapper.TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                        Subtotal
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right" sx={{ fontWeight: 700 }}>
                        PKR {formatNumber(invoiceDetails.subtotal)}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow sx={{ bgcolor: "#fff3e0" }}>
                      <Wrapper.TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                        Discount Amount
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        align="right"
                        sx={{ fontWeight: 700, color: "#f57c00" }}
                      >
                        PKR {formatNumber(invoiceDetails.discountAmount)}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow sx={{ bgcolor: "#e8f5e8" }}>
                      <Wrapper.TableCell
                        colSpan={4}
                        sx={{ fontWeight: 700, fontSize: "1.1rem" }}
                      >
                        Total Amount
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          fontSize: "1.1rem",
                          color: "#2E7D32",
                        }}
                      >
                        PKR {formatNumber(invoiceDetails.totalAmount)}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.Card>

              <Wrapper.Box
                sx={{
                  mt: 4,
                  pt: 2,
                  borderTop: "2px dashed #e0e0e0",
                  textAlign: "center",
                }}
              >
                <Wrapper.Typography variant="body2" color="textSecondary">
                  This is a computer-generated document. No signature is
                  required.
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Box>
          )}
        </Wrapper.DialogContent>

        <Wrapper.DialogActions sx={{ p: 3, bgcolor: "#f8fffe", gap: 2 }}>
          <Wrapper.Button
            onClick={() => {
              setIsPreviewOpen(false);
              onClose();
            }}
            variant="outlined"
            startIcon={<Wrapper.CloseIcon />}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#bdbdbd",
              color: "#757575",
              "&:hover": {
                borderColor: "#9e9e9e",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Close
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handlePrint}
            variant="contained"
            startIcon={<Wrapper.PrintIcon />}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
              boxShadow: "0 8px 24px rgba(46, 125, 50, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #1B5E20 0%, #0d4e12 100%)",
                boxShadow: "0 12px 32px rgba(46, 125, 50, 0.4)",
              },
            }}
          >
            Print Invoice
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
    </>
  );
};

export default PurchaseInvoiceForm;

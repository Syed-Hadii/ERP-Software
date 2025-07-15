import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  Box,
  Button,
  IconButton,
  FormHelperText,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import Wrapper from "../utils/wrapper";

const InvoiceForm = ({
  open,
  onClose,
  title,
  fields,
  itemFields,
  formData,
  setFormData,
  formErrors,
  handleAdd,
  handleItemChange,
  handleAddItemRow,
  handleRemoveItemRow,
  loading,
  itemsLoading,
  optionsLoading, // Renamed to be generic (suppliersLoading or customersLoading)
}) => {
  return (
    <Wrapper.Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          bgcolor: "#fafafa",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          bgcolor: "#2e7d32",
          color: "white",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {title}
      </DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Grid container spacing={3}>
            {fields.map((field) => (
              <Grid item xs={12} sm={field.xs || 6} key={field.name}>
                {field.type === "select" ? (
                  <Wrapper.Select
                    fullWidth
                    size="medium"
                    label={field.label}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.name]: e.target.value,
                      })
                    }
                    required={field.validation.required}
                    disabled={optionsLoading}
                    error={!!formErrors[field.name]}
                    helperText={formErrors[field.name]}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "& fieldset": { borderColor: "#e0e0e0" },
                        "&:hover fieldset": { borderColor: "#2e7d32" },
                        "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#616161",
                        "&.Mui-focused": { color: "#2e7d32" },
                      },
                    }}
                  >
                    <Wrapper.MenuItem value="">
                      <em>
                        {optionsLoading
                          ? "Loading..."
                          : `Select ${field.label}`}
                      </em>
                    </Wrapper.MenuItem>
                    {field.options.map((option) => (
                      <Wrapper.MenuItem key={option.value} value={option.value}>
                        {option.label || "Unnamed Option"}
                      </Wrapper.MenuItem>
                    ))}
                  </Wrapper.Select>
                ) : (
                  <Wrapper.TextField
                    fullWidth
                    size="medium"
                    label={field.label}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.name]: e.target.value,
                      })
                    }
                    required={field.validation.required}
                    multiline={field.multiline}
                    rows={field.rows}
                    error={!!formErrors[field.name]}
                    helperText={formErrors[field.name]}
                    InputProps={
                      field.name === "totalPrice"
                        ? {
                            startAdornment: (
                              <Wrapper.InputAdornment position="start">
                                PKR
                              </Wrapper.InputAdornment>
                            ),
                          }
                        : {}
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "& fieldset": { borderColor: "#e0e0e0" },
                        "&:hover fieldset": { borderColor: "#2e7d32" },
                        "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#616161",
                        "&.Mui-focused": { color: "#2e7d32" },
                      },
                    }}
                  />
                )}
              </Grid>
            ))}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: "bold",
                  color: "#2e7d32",
                  borderBottom: "2px solid #e0e0e0",
                  pb: 1,
                }}
              >
                Invoice Items
              </Typography>
              {formData.items.map((rowItem, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: 2,
                    alignItems: "center",
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    bgcolor: "#ffffff",
                    p: 2,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    transition: "all 0.2s ease",
                    "&:hover": { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
                  }}
                >
                  {itemFields.map((field) => (
                    <Box
                      key={field.name}
                      sx={{ flex: 1, minWidth: { xs: "100%", sm: 200 } }}
                    >
                      {field.type === "select" ? (
                        <Wrapper.Select
                          fullWidth
                          size="medium"
                          label={field.label}
                          value={rowItem[field.name] || ""}
                          onChange={(e) =>
                            handleItemChange(index, field.name, e.target.value)
                          }
                          required={field.validation.required}
                          disabled={itemsLoading}
                          error={!!formErrors.itemsRows?.[index]?.[field.name]}
                          helperText={
                            formErrors.itemsRows?.[index]?.[field.name]
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              transition: "all 0.3s ease",
                              "& fieldset": { borderColor: "#e0e0e0" },
                              "&:hover fieldset": { borderColor: "#2e7d32" },
                              "&.Mui-focused fieldset": {
                                borderColor: "#2e7d32",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#616161",
                              "&.Mui-focused": { color: "#2e7d32" },
                            },
                          }}
                        >
                          <Wrapper.MenuItem value="">
                            <em>
                              {itemsLoading
                                ? "Loading..."
                                : `Select ${field.label}`}
                            </em>
                          </Wrapper.MenuItem>
                          {field.options.map((option) => (
                            <Wrapper.MenuItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label || "Unnamed Item"}
                            </Wrapper.MenuItem>
                          ))}
                        </Wrapper.Select>
                      ) : (
                        <Wrapper.TextField
                          fullWidth
                          size="medium"
                          label={field.label}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={rowItem[field.name] || ""}
                          onChange={(e) =>
                            handleItemChange(index, field.name, e.target.value)
                          }
                          required={field?.validation?.required}
                          error={!!formErrors.itemsRows?.[index]?.[field.name]}
                          helperText={
                            formErrors.itemsRows?.[index]?.[field.name]
                          }
                          InputProps={
                            field.name === "unitPrice"
                              ? {
                                  startAdornment: (
                                    <Wrapper.InputAdornment position="start">
                                      PKR
                                    </Wrapper.InputAdornment>
                                  ),
                                }
                              : {}
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                              transition: "all 0.3s ease",
                              "& fieldset": { borderColor: "#e0e0e0" },
                              "&:hover fieldset": { borderColor: "#2e7d32" },
                              "&.Mui-focused fieldset": {
                                borderColor: "#2e7d32",
                              },
                            },
                            "& .MuiInputLabel-root": {
                              color: "#616161",
                              "&.Mui-focused": { color: "#2e7d32" },
                            },
                          }}
                        />
                      )}
                    </Box>
                  ))}
                  <IconButton
                    onClick={() => handleRemoveItemRow(index)}
                    sx={{
                      color: "#d32f2f",
                      bgcolor: "#ffebee",
                      "&:hover": { bgcolor: "#ffcdd2" },
                      borderRadius: 2,
                    }}
                    disabled={formData.items.length === 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddItemRow}
                sx={{
                  mt: 2,
                  color: "#2e7d32",
                  borderColor: "#2e7d32",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#1b5e20",
                    bgcolor: "#e8f5e9",
                  },
                }}
                disabled={itemsLoading}
              >
                Add Item
              </Button>
              {formErrors.items && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {formErrors.items}
                </FormHelperText>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 0,
            bgcolor: "#f5f5f5",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              color: "#616161",
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || itemsLoading || optionsLoading}
            sx={{
              bgcolor: "#2e7d32",
              color: "white",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "#1b5e20" },
              px: 4,
            }}
          >
            {loading ? "Saving..." : "Save Invoice"}
          </Button>
        </DialogActions>
      </form>
    </Wrapper.Dialog>
  );
};

export default InvoiceForm;

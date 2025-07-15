import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";

const ReusableModal = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  submitButtonText = "Submit",
  onFieldChange,
  values,
  loading: externalLoading,
  customFunctions,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize form when the modal opens or when initialData/values change
  useEffect(() => {
    if (!open) return;

    // Preserve existing form values when updating fields
    setForm((prevForm) => {
      const defaultForm = fields.reduce((acc, field) => {
        // Use existing form value if available, otherwise fallback to values, initialData, or default
        acc[field.name] =
          prevForm[field.name] !== undefined
            ? prevForm[field.name]
            : values?.[field.name] !== undefined
            ? values[field.name]
            : initialData?.[field.name] || (field.type === "custom" ? [] : "");
        return acc;
      }, {});
      return defaultForm;
    });
    setErrors({});
  }, [initialData, values, open, fields]);

  const validateForm = () => {
    const newErrors = {};
    fields.forEach((field) => {
      // Check if field should be shown
      if (field.show && !field.show(form)) {
        return;
      }

      // Required field validation
      if (
        field.validation?.required &&
        (!form[field.name]?.toString().trim() ||
          (typeof field.validation.required === "function" &&
            field.validation.required(form) &&
            !form[field.name]?.toString().trim()))
      ) {
        newErrors[field.name] = `${field.label} is required`;
      }

      // Pattern validation
      if (
        field.validation?.pattern &&
        form[field.name] &&
        !field.validation.pattern.test(form[field.name])
      ) {
        newErrors[field.name] = field.validation.patternMessage;
      }

      // Minimum length validation
      if (
        field.validation?.minLength &&
        form[field.name]?.length < field.validation.minLength
      ) {
        newErrors[
          field.name
        ] = `${field.label} must have at least ${field.validation.minLength} entries`;
      }

      // Minimum value validation for number fields
      if (
        field.type === "number" &&
        field.validation?.min !== undefined &&
        form[field.name] &&
        Number(form[field.name]) < field.validation.min
      ) {
        newErrors[
          field.name
        ] = `${field.label} must be at least ${field.validation.min}`;
      }

      // Custom validation
      if (field.validation?.validate) {
        const validationResult = field.validation.validate(form[field.name]);
        if (validationResult !== true) {
          newErrors[field.name] = validationResult;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      ["employee", "month", "year", "absenceDeduction", "bonuses"].includes(
        name
      )
    ) {
      onFieldChange?.(name, value);
    }

    // Only update form state for editable fields
    const field = fields.find((f) => f.name === name);
    if (!field?.readOnly) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Special case: eventType
    if (name === "eventType") {
      onFieldChange?.("eventType", value);
      setForm((prev) => ({
        ...prev,
        eventType: value,
        vaccineMedicineName: "",
        dosage: "",
        nextDueDate: "",
      }));
      return;
    }

    // Special case: exitType
    if (name === "exitType") {
      onFieldChange?.("exitType", value);
      setForm((prev) => ({
        ...prev,
        exitType: value,
        salePrice: "",
        newOwnerDestination: "",
      }));
      return;
    }

    // Special case: cattle type
    if (name === "type") {
      onFieldChange?.("type", value);
      setForm((prev) => ({
        ...prev,
        type: value,
        breed: "",
        cattleId: "",
      }));
      return;
    }

    // Special case: breed
    if (name === "breed") {
      onFieldChange?.("breed", value);
      setForm((prev) => ({
        ...prev,
        breed: value,
        cattleId: "",
      }));
      return;
    }

    // Special case: source
    if (name === "source" && onFieldChange) {
      onFieldChange("source", value);
      setForm((prev) => ({ ...prev, source: value }));
      return;
    }

    // Special case: crop
    if (name === "crop") {
      setForm((prev) => ({
        ...prev,
        crop: value,
        variety: "",
      }));
      if (onFieldChange) {
        onFieldChange("crop", value, setForm);
      }
      if (errors.variety) {
        setErrors((prev) => ({ ...prev, variety: undefined }));
      }
      return;
    } else if (name === "category" && customFunctions?.onCategoryChange) {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      customFunctions.onCategoryChange(value);
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    } else {
      // Standard field update
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(form);
      setForm(
        fields.reduce(
          (acc, field) => ({
            ...acc,
            [field.name]: field.type === "custom" ? [] : "",
          }),
          {}
        )
      );
      setErrors({});
      onClose();
    } catch (error) {
      console.error(`Error submitting ${title.toLowerCase()}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(
      fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.type === "custom" ? [] : "",
        }),
        {}
      )
    );
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  // Filter fields based on show property
  const visibleFields = fields.filter(
    (field) => !field.show || field.show(form)
  );

  // Determine if this is a complex form (more than 6 fields or has custom fields)
  const isComplexForm =
    visibleFields.length > 6 ||
    visibleFields.some((field) => field.type === "custom");

  // Group fields for better organization in complex forms
  const groupedFields = isComplexForm
    ? visibleFields.reduce((groups, field, index) => {
        const groupIndex = Math.floor(index / 4);
        if (!groups[groupIndex]) groups[groupIndex] = [];
        groups[groupIndex].push(field);
        return groups;
      }, [])
    : [visibleFields];

  const renderField = (field) => {
    const fieldComponent = (() => {
      if (field.type === "custom" && field.render) {
        return (
          <Wrapper.Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Wrapper.Typography
              variant="body2"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                fontSize: "0.875rem",
                letterSpacing: "0.01em",
              }}
            >
              {field.label}
              {field.validation?.required && (
                <Wrapper.Typography
                  component="span"
                  color="error"
                  sx={{ ml: 0.5, fontSize: "1rem" }}
                >
                  *
                </Wrapper.Typography>
              )}
            </Wrapper.Typography>
            <Wrapper.Box
              sx={{
                width: "100%",
                "& > *": {
                  borderRadius: "8px !important",
                },
              }}
            >
              {field.render(form, setForm)}
            </Wrapper.Box>
            {errors[field.name] && (
              <Wrapper.Typography
                color="error"
                variant="caption"
                sx={{
                  mt: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Wrapper.Box
                  component="span"
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: "error.main",
                    display: "inline-block",
                  }}
                />
                {errors[field.name]}
              </Wrapper.Typography>
            )}
          </Wrapper.Box>
        );
      }

      const commonTextFieldProps = {
        label: field.label,
        name: field.name,
        value: form[field.name] || "",
        onChange: handleChange,
        fullWidth: true,
        required:
          typeof field.validation?.required === "function"
            ? field.validation.required(form)
            : field.validation?.required,
        error: !!errors[field.name],
        helperText: errors[field.name],
        placeholder: field.placeholder,
        InputProps: {
          startAdornment: field.icon ? (
            <Wrapper.InputAdornment position="start">
              <Wrapper.Box sx={{ color: "#2E7D32", display: "flex" }}>
                {field.icon}
              </Wrapper.Box>
            </Wrapper.InputAdornment>
          ) : null,
          endAdornment:
            field.type === "password" ? (
              <Wrapper.InputAdornment position="end">
                <Wrapper.IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{
                    color: "#2E7D32",
                    "&:hover": {
                      backgroundColor: "rgba(46, 125, 50, 0.08)",
                    },
                  }}
                >
                  {showPassword ? (
                    <Wrapper.VisibilityOffIcon />
                  ) : (
                    <Wrapper.VisibilityIcon />
                  )}
                </Wrapper.IconButton>
              </Wrapper.InputAdornment>
            ) : null,
        },
        sx: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            backgroundColor: "rgba(0, 0, 0, 0.02)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(46, 125, 50, 0.5)",
              },
            },
            "&.Mui-focused": {
              backgroundColor: "rgba(46, 125, 50, 0.02)",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2E7D32",
                borderWidth: 2,
              },
            },
            "&.Mui-error": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#d32f2f",
              },
            },
          },
          "& .MuiInputLabel-root": {
            fontWeight: 500,
            "&.Mui-focused": {
              color: "#2E7D32",
              fontWeight: 600,
            },
          },
          "& .MuiFormHelperText-root": {
            fontSize: "0.75rem",
            fontWeight: 500,
            marginLeft: 0,
            marginTop: "6px",
          },
        },
      };

      if (field.type === "select") {
        return (
          <Wrapper.TextField {...commonTextFieldProps} select>
            {field.options?.map((option) => (
              <Wrapper.MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(46, 125, 50, 0.08)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(46, 125, 50, 0.12)",
                    "&:hover": {
                      backgroundColor: "rgba(46, 125, 50, 0.16)",
                    },
                  },
                }}
              >
                {option.label}
              </Wrapper.MenuItem>
            ))}
          </Wrapper.TextField>
        );
      }

      if (field.type === "date" || field.type === "datetime-local") {
        return (
          <Wrapper.TextField
            {...commonTextFieldProps}
            type={field.type}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
      }

      return (
        <Wrapper.TextField
          {...commonTextFieldProps}
          type={
            field.type === "password" && showPassword
              ? "text"
              : field.type || "text"
          }
          multiline={field.multiline}
          rows={field.rows}
          minRows={field.multiline ? 3 : undefined}
          maxRows={field.multiline ? 8 : undefined}
        />
      );
    })();

    return (
      <Wrapper.Box
        key={field.name}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          transition: "all 0.2s ease-in-out",
        }}
      >
        {fieldComponent}
      </Wrapper.Box>
    );
  };

  return (
    <Wrapper.Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={isComplexForm ? "md" : "sm"}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          maxHeight: "90vh",
          background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
        },
      }}
    >
      {/* Enhanced Header */}
      <Wrapper.Box
        sx={{
          background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
          color: "white",
          py: 3,
          px: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
          },
        }}
      >
        <Wrapper.Box>
          <Wrapper.Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.02em",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            {title}
          </Wrapper.Typography>
          
        </Wrapper.Box>
        <Wrapper.IconButton
          size="small"
          onClick={handleClose}
          sx={{
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          <Wrapper.CloseIcon />
        </Wrapper.IconButton>
      </Wrapper.Box>

      {/* Enhanced Content Area */}
      <Wrapper.DialogContent
        sx={{
          p: 0,
          backgroundColor: "transparent",
          maxHeight: isComplexForm ? "60vh" : "70vh",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0,0,0,0.05)",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(46, 125, 50, 0.3)",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "rgba(46, 125, 50, 0.5)",
            },
          },
        }}
      >
        <Wrapper.Box sx={{ p: 4 }}>
          {isComplexForm ? (
            // Complex form layout with sections
            <Wrapper.Box
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {groupedFields.map((group, groupIndex) => (
                <Wrapper.Box key={groupIndex}>
                  {/* {groupedFields.length > 1 && (
                    <Wrapper.Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <Wrapper.Typography
                        variant="h6"
                        sx={{
                          color: "#2E7D32",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        Section {groupIndex + 1}
                      </Wrapper.Typography>
                      <Wrapper.Box
                        sx={{
                          flex: 1,
                          height: "1px",
                          background:
                            "linear-gradient(90deg, #2E7D32, transparent)",
                        }}
                      />
                    </Wrapper.Box>
                  )} */}
                  <Wrapper.Grid container spacing={3}>
                    {group.map((field) => (
                      <Wrapper.Grid
                        item
                        xs={12}
                        sm={field.fullWidth || field.type === "custom" ? 12 : 6}
                        md={
                          field.fullWidth || field.type === "custom"
                            ? 12
                            : field.multiline
                            ? 12
                            : 6
                        }
                        key={field.name}
                      >
                        {renderField(field)}
                      </Wrapper.Grid>
                    ))}
                  </Wrapper.Grid>
                </Wrapper.Box>
              ))}
            </Wrapper.Box>
          ) : (
            // Simple form layout
            <Wrapper.Grid container spacing={3}>
              {visibleFields.map((field) => (
                <Wrapper.Grid
                  item
                  xs={12}
                  sm={field.fullWidth || field.multiline ? 12 : 6}
                  key={field.name}
                >
                  {renderField(field)}
                </Wrapper.Grid>
              ))}
            </Wrapper.Grid>
          )}
        </Wrapper.Box>
      </Wrapper.DialogContent>

      {/* Enhanced Divider */}
      <Wrapper.Box
        sx={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
        }}
      />

      {/* Enhanced Actions */}
      <Wrapper.DialogActions
        sx={{
          p: 4,
          justifyContent: "space-between",
          backgroundColor: "rgba(250, 250, 250, 0.8)",
          backdropFilter: "blur(10px)",
          gap: 2,
        }}
      >
        <Wrapper.Button
          onClick={handleClose}
          variant="outlined"
          size="large"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            borderWidth: "2px",
            borderColor: "#d32f2f",
            color: "#d32f2f",
            textTransform: "none",
            fontSize: "0.95rem",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderWidth: "2px",
              backgroundColor: "rgba(211, 47, 47, 0.08)",
              borderColor: "#b71c1c",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(211, 47, 47, 0.2)",
            },
          }}
        >
          Cancel
        </Wrapper.Button>

        <Wrapper.Button
          variant="contained"
          onClick={handleSubmit}
          disabled={externalLoading || loading}
          size="large"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            position: "relative",
            background: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
            boxShadow: "0 4px 16px rgba(46, 125, 50, 0.3)",
            textTransform: "none",
            fontSize: "0.95rem",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              background: "linear-gradient(135deg, #1B5E20 0%, #0D4E12 100%)",
              boxShadow: "0 6px 20px rgba(46, 125, 50, 0.4)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "rgba(46, 125, 50, 0.3)",
              boxShadow: "none",
              transform: "none",
            },
          }}
        >
          {externalLoading || loading ? (
            <Wrapper.Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Wrapper.CircularProgress size={20} sx={{ color: "white" }} />
              <span>Processing...</span>
            </Wrapper.Box>
          ) : (
            <Wrapper.Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {submitButtonText}
              <Wrapper.Box
                component="span"
                sx={{
                  fontSize: "1.1rem",
                  transition: "transform 0.2s ease-in-out",
                  ".MuiButton-root:hover &": {
                    transform: "translateX(2px)",
                  },
                }}
              >
                →
              </Wrapper.Box>
            </Wrapper.Box>
          )}
        </Wrapper.Button>
      </Wrapper.DialogActions>
    </Wrapper.Dialog>
  );
};

export default ReusableModal;

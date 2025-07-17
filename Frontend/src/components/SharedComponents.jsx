import { useEffect, useState } from "react";
import Wrapper from "../utils/wrapper";
import { BASE_URL } from "../config/config";

// FormField: Reusable input/select field for forms
export const FormField = ({
  label,
  name,
  type = "text",
  value = "",
  onChange = () => {},
  required = false,
  disabled = false,
  select = false,
  options = [],
  size = "small",
  startAdornment,
  inputProps = {},
  error = false,
  helperText = "",
  multiline = false,
  rows = 5,
  voucherType = "Payment",
}) => {
  const isJournalAmount =
    voucherType === "Journal" && ["debitAmount", "creditAmount"].includes(name);
  const adjustedType = isJournalAmount ? "text" : type;

  return (
    <Wrapper.Grid item xs={12} md={6}>
      <Wrapper.FormControl
        fullWidth
        variant="outlined"
        size={size}
        error={error}
      >
        <Wrapper.InputLabel>{label}</Wrapper.InputLabel>
        {select ? (
          <Wrapper.Select
            name={name}
            value={value || ""}
            onChange={onChange}
            label={label}
            required={required}
            disabled={disabled}
          >
            <Wrapper.MenuItem value="">Select {label}</Wrapper.MenuItem>
            {options.map((opt) => (
              <Wrapper.MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </Wrapper.MenuItem>
            ))}
          </Wrapper.Select>
        ) : (
          <Wrapper.OutlinedInput
            type={adjustedType}
            name={name}
            value={value || ""}
            onChange={onChange}
            label={label}
            required={required}
            disabled={disabled}
            multiline={multiline}
            rows={rows}
            startAdornment={
              startAdornment && (
                <Wrapper.InputAdornment position="start">
                  {startAdornment}
                </Wrapper.InputAdornment>
              )
            }
            inputProps={inputProps}
          />
        )}
        {helperText && (
          <Wrapper.FormHelperText>{helperText}</Wrapper.FormHelperText>
        )}
      </Wrapper.FormControl>
    </Wrapper.Grid>
  );
};

// AccountEntry: Reusable component for account entry rows in Payment/Receipt forms
export const AccountEntry = ({
  index,
  entry,
  accountList,
  voucherType,
  onChange,
  onBlur,
  onRemove,
  formatNumber,
  inputValues,
}) => {
  if (voucherType === "Journal") {
    return null; // Journal uses JournalAccountEntry
  }

  return (
    <Wrapper.Grid container spacing={2} sx={{ mb: 2 }}>
      <Wrapper.Grid item xs={12} md={4}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Chart of Account</Wrapper.InputLabel>
          <Wrapper.Select
            name="chartAccount"
            value={entry.chartAccount || ""}
            onChange={(e) => onChange(index, e)}
            label="Chart of Account"
            required
          >
            <Wrapper.MenuItem value="">Select Account</Wrapper.MenuItem>
            {accountList
              .filter((account) =>
                voucherType === "Payment"
                  ? ["Expense", "Liabilities"].includes(account.group)
                  : ["Income", "Assets"].includes(account.group)
              )
              .map((acc) => (
                <Wrapper.MenuItem key={acc._id} value={acc._id}>
                  <Wrapper.Box
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    {acc.name}
                    <Wrapper.Chip
                      label={acc.group}
                      size="small"
                      color={
                        ["Expense", "Income"].includes(acc.group)
                          ? "primary"
                          : "default"
                      }
                      sx={{
                        height: "20px",
                        "& .MuiChip-label": { fontSize: "0.7rem", px: 1 },
                      }}
                    />
                  </Wrapper.Box>
                </Wrapper.MenuItem>
              ))}
          </Wrapper.Select>
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={3}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Amount</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="text"
            name="amount"
            value={formatNumber(inputValues[index])}
            onChange={(e) => onChange(index, e)}
            onBlur={() => onBlur(index)}
            label="Amount"
            required
            startAdornment={
              <Wrapper.InputAdornment position="start">
                <Wrapper.Typography sx={{ color: "#7f8c8d", fontWeight: 500 }}>
                  PKR
                </Wrapper.Typography>
              </Wrapper.InputAdornment>
            }
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={3}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Narration</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="text"
            name="narration"
            value={entry.narration || ""}
            onChange={(e) => onChange(index, e)}
            label="Narration"
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        {index > 0 && (
          <Wrapper.Button
            variant="outlined"
            color="error"
            onClick={() => onRemove(index)}
            sx={{ textTransform: "none" }}
          >
            Remove
          </Wrapper.Button>
        )}
      </Wrapper.Grid>
    </Wrapper.Grid>
  );
};

// JournalAccountEntry: Reusable component for account entry rows in Journal forms
export const JournalAccountEntry = ({
  index,
  entry,
  accountList,
  onChange,
  onRemove,
  formatNumber,
  inputValues,
}) => (
  <Wrapper.Grid container spacing={2} sx={{ mb: 2 }}>
    <Wrapper.Grid item xs={12} md={4}>
      <Wrapper.FormControl fullWidth variant="outlined" size="small">
        <Wrapper.InputLabel>Chart of Account</Wrapper.InputLabel>
        <Wrapper.Select
          name="accountId"
          value={entry.accountId || ""}
          onChange={(e) => onChange(index, e)}
          label="Chart of Account"
          required
        >
          <Wrapper.MenuItem value="">Select Account</Wrapper.MenuItem>
          {accountList.map((acc) => (
            <Wrapper.MenuItem key={acc._id} value={acc._id}>
              <Wrapper.Box
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                {acc.name}
                <Wrapper.Chip
                  label={acc.group}
                  size="small"
                  color={
                    ["Expense", "Income"].includes(acc.group)
                      ? "primary"
                      : "default"
                  }
                  sx={{
                    height: "20px",
                    "& .MuiChip-label": { fontSize: "0.7rem", px: 1 },
                  }}
                />
              </Wrapper.Box>
            </Wrapper.MenuItem>
          ))}
        </Wrapper.Select>
      </Wrapper.FormControl>
    </Wrapper.Grid>
    <Wrapper.Grid item xs={12} md={3}>
      <Wrapper.FormControl fullWidth variant="outlined" size="small">
        <Wrapper.InputLabel>Debit Amount</Wrapper.InputLabel>
        <Wrapper.OutlinedInput
          type="text"
          name="debitAmount"
          value={formatNumber(inputValues.debitAmounts[index])}
          onChange={(e) => onChange(index, e)}
          label="Debit Amount"
          startAdornment={
            <Wrapper.InputAdornment position="start">
              <Wrapper.Typography sx={{ color: "#7f8c8d", fontWeight: 500 }}>
                PKR
              </Wrapper.Typography>
            </Wrapper.InputAdornment>
          }
        />
      </Wrapper.FormControl>
    </Wrapper.Grid>
    <Wrapper.Grid item xs={12} md={3}>
      <Wrapper.FormControl fullWidth variant="outlined" size="small">
        <Wrapper.InputLabel>Credit Amount</Wrapper.InputLabel>
        <Wrapper.OutlinedInput
          type="text"
          name="creditAmount"
          value={formatNumber(inputValues.creditAmounts[index])}
          onChange={(e) => onChange(index, e)}
          label="Credit Amount"
          startAdornment={
            <Wrapper.InputAdornment position="start">
              <Wrapper.Typography sx={{ color: "#7f8c8d", fontWeight: 500 }}>
                PKR
              </Wrapper.Typography>
            </Wrapper.InputAdornment>
          }
        />
      </Wrapper.FormControl>
    </Wrapper.Grid>
    <Wrapper.Grid item xs={12} md={2}>
      {index >= 2 && (
        <Wrapper.Button
          variant="outlined"
          color="error"
          onClick={() => onRemove(index)}
          sx={{ textTransform: "none" }}
        >
          Remove
        </Wrapper.Button>
      )}
    </Wrapper.Grid>
  </Wrapper.Grid>
);

// ItemEntry: Reusable component for item entry rows in Sales/Purchase Invoice forms

export const ItemEntry = ({
  index,
  item,
  itemsList,
  taxes,
  setTaxes,
  onChange,
  onBlur,
  onRemove,
  formatNumber,
  voucherType = "taxable",
}) => {
  const [openTaxModal, setOpenTaxModal] = useState(false);
  const [taxFormData, setTaxFormData] = useState({
    name: "",
    rate: "",
    coa: "",
  });
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [coaLoading, setCoaLoading] = useState(false);
  const [taxErrors, setTaxErrors] = useState({});
  const isTaxable = voucherType === "taxable";

  useEffect(() => {
    if (openTaxModal) {
      const fetchCoaAccounts = async () => {
        setCoaLoading(true);
        try {
          const token = localStorage.getItem("token");
          const response = await Wrapper.axios.get(
            `${BASE_URL}/chartaccount/get`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            setCoaAccounts(response.data.data || []);
          } else {
            Wrapper.toast.error("Failed to fetch chart of accounts");
          }
        } catch (error) {
          console.error(error);
          Wrapper.toast.error(
            error.response.data.message || "Failed to fetch chart of accounts"
          );
        } finally {
          setCoaLoading(false);
        }
      };
      fetchCoaAccounts();
    }
  }, [openTaxModal]);

  const validateTaxForm = () => {
    const errors = {};
    if (!taxFormData.name) errors.name = "Name is required";
    if (!taxFormData.rate || parseFloat(taxFormData.rate) <= 0) {
      errors.rate = "Valid positive rate is required";
    }
    setTaxErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTaxSubmit = async () => {
    if (!validateTaxForm()) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: taxFormData.name,
        rate: parseFloat(taxFormData.rate),
        coa: taxFormData.coa || undefined,
      };
      const response = await Wrapper.axios.post(
        `${BASE_URL}/tax/add`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        Wrapper.toast.success("Tax added successfully!");
        const newTax = response.data.data.data;
        setTaxes((prevTaxes) => [...prevTaxes, newTax]);
        onChange(index, "taxes", [...(item.taxes || []), newTax._id]);
        setTaxFormData({ name: "", rate: "", coa: "" });
        setTaxErrors({});
        setOpenTaxModal(false);
      } else {
        Wrapper.toast.error("Failed to add tax");
      }
    } catch (error) {
      Wrapper.toast.error(error.response?.data?.message || "Failed to add tax");
    }
  };

  const handleTaxInputChange = (e) => {
    const { name, value } = e.target;
    setTaxFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Wrapper.Grid container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
      <Wrapper.Grid item xs={12} md={3}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Item</Wrapper.InputLabel>
          <Wrapper.Select
            name="item"
            value={item.item || ""}
            onChange={(e) => onChange(index, "item", e.target.value)}
            label="Item"
            required
          >
            <Wrapper.MenuItem value="">Select Item</Wrapper.MenuItem>
            {itemsList.map((it) => (
              <Wrapper.MenuItem key={it._id} value={it._id}>
                {`${it.name || "-"} (${it.code || "-"}) [Stock: ${
                  it.qtyOwned || 0
                }]`}
              </Wrapper.MenuItem>
            ))}
          </Wrapper.Select>
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Quantity</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="number"
            name="quantity"
            value={item.quantity || ""}
            onChange={(e) => onChange(index, "quantity", e.target.value)}
            label="Quantity"
            required
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Unit Price (PKR)</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="text"
            name="unitPrice"
            value={formatNumber(item.unitPrice)}
            onChange={(e) => onChange(index, "unitPrice", e.target.value)}
            onBlur={() => onBlur(index)}
            label="Unit Price (PKR)"
            required
            startAdornment={
              <Wrapper.InputAdornment position="start">
                <Wrapper.Typography sx={{ color: "#7f8c8d", fontWeight: 500 }}>
                  PKR
                </Wrapper.Typography>
              </Wrapper.InputAdornment>
            }
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Discount (%)</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="number"
            name="discountPercent"
            value={item.discountPercent || ""}
            onChange={(e) => onChange(index, "discountPercent", e.target.value)}
            label="Discount (%)"
            endAdornment={
              <Wrapper.InputAdornment position="end">%</Wrapper.InputAdornment>
            }
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      {isTaxable && (
        <Wrapper.Grid item xs={12} md={2}>
          <Wrapper.FormControl fullWidth variant="outlined" size="small">
            <Wrapper.InputLabel>Taxes</Wrapper.InputLabel>
            <Wrapper.Select
              multiple
              name="taxes"
              value={item.taxes || []}
              onChange={(e) => {
                if (e.target.value.includes("add_new")) {
                  setOpenTaxModal(true);
                } else {
                  onChange(index, "taxes", e.target.value);
                }
              }}
              label="Taxes"
              renderValue={(selected) =>
                selected
                  .map((id) => {
                    const tax = taxes.find((t) => t._id === id);
                    return tax ? `${tax.name} (${tax.rate}%)` : "Unknown Tax";
                  })
                  .join(", ")
              }
            >
              {taxes.map((tax) => (
                <Wrapper.MenuItem key={tax._id} value={tax._id}>
                  <Wrapper.Box
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    {tax.name}
                    <Wrapper.Chip
                      label={`${tax.rate}%`}
                      size="small"
                      color="primary"
                      sx={{
                        height: "20px",
                        "& .MuiChip-label": { fontSize: "0.7rem", px: 1 },
                      }}
                    />
                  </Wrapper.Box>
                </Wrapper.MenuItem>
              ))}
              <Wrapper.MenuItem value="add_new">
                <Wrapper.Box
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  Add New Tax
                  <Wrapper.AddIcon fontSize="small" />
                </Wrapper.Box>
              </Wrapper.MenuItem>
            </Wrapper.Select>
          </Wrapper.FormControl>
        </Wrapper.Grid>
      )}
      <Wrapper.Grid item xs={12} md={isTaxable ? 1 : 2}>
        {index > 0 && (
          <Wrapper.Button
            variant="outlined"
            color="error"
            onClick={() => onRemove(index)}
            sx={{ textTransform: "none" }}
          >
            Remove
          </Wrapper.Button>
        )}
      </Wrapper.Grid>
      <Wrapper.Dialog
        open={openTaxModal}
        onClose={() => setOpenTaxModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>Add New Tax</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Grid container spacing={2}>
            <Wrapper.Grid item xs={12}>
              <Wrapper.TextField
                fullWidth
                label="Tax Name"
                name="name"
                value={taxFormData.name}
                onChange={handleTaxInputChange}
                required
                error={!!taxErrors.name}
                helperText={taxErrors.name}
              />
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12}>
              <Wrapper.TextField
                fullWidth
                label="Tax Rate (%)"
                name="rate"
                type="number"
                value={taxFormData.rate}
                onChange={handleTaxInputChange}
                required
                InputProps={{
                  endAdornment: (
                    <Wrapper.InputAdornment position="end">
                      %
                    </Wrapper.InputAdornment>
                  ),
                }}
                error={!!taxErrors.rate}
                helperText={taxErrors.rate}
              />
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12}>
              <Wrapper.FormControl fullWidth variant="outlined" size="small">
                <Wrapper.InputLabel>Chart of Account</Wrapper.InputLabel>
                <Wrapper.Select
                  name="coa"
                  value={taxFormData.coa}
                  onChange={handleTaxInputChange}
                  label="Chart of Account"
                  disabled={coaLoading}
                >
                  <Wrapper.MenuItem value="">
                    Select COA (Optional)
                  </Wrapper.MenuItem>
                  {coaAccounts.map((acc) => (
                    <Wrapper.MenuItem key={acc._id} value={acc._id}>
                      {acc.name}
                    </Wrapper.MenuItem>
                  ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button
            onClick={() => setOpenTaxModal(false)}
            color="inherit"
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handleTaxSubmit}
            variant="contained"
            color="primary"
          >
            Add Tax
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
    </Wrapper.Grid>
  );
};

// BatchAccountEntry: Reusable component for batch entry rows
export const BatchAccountEntry = ({
  index,
  entry,
  accountList,
  customers,
  suppliers,
  voucherType,
  onEntryChange,
  onAmountChange,
  onAmountBlur,
  onRemove,
  formatNumber,
  inputValues,
  customersLoading,
  suppliersLoading,
  canRemove,
}) => {
  return (
    <Wrapper.Grid container spacing={2} sx={{ mb: 2 }}>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Date</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="date"
            name="date"
            value={entry.date || ""}
            onChange={(e) => onEntryChange(index, "date", e.target.value)}
            label="Date"
            required
            inputProps={{ max: new Date().toISOString().split("T")[0] }}
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Party</Wrapper.InputLabel>
          <Wrapper.Select
            name="party"
            value={entry.party || ""}
            onChange={(e) => onEntryChange(index, "party", e.target.value)}
            label="Party"
            required
          >
            <Wrapper.MenuItem value="">Select Party</Wrapper.MenuItem>
            <Wrapper.MenuItem value="Customer">Customer</Wrapper.MenuItem>
            <Wrapper.MenuItem value="Supplier">Supplier</Wrapper.MenuItem>
            <Wrapper.MenuItem value="Other">Other</Wrapper.MenuItem>
          </Wrapper.Select>
        </Wrapper.FormControl>
      </Wrapper.Grid>
      {entry.party === "Customer" && (
        <Wrapper.Grid item xs={12} md={2}>
          <Wrapper.FormControl fullWidth variant="outlined" size="small">
            <Wrapper.InputLabel>Customer</Wrapper.InputLabel>
            <Wrapper.Select
              name="customer"
              value={entry.customer || ""}
              onChange={(e) => onEntryChange(index, "customer", e.target.value)}
              label="Customer"
              required
            >
              <Wrapper.MenuItem value="">Select Customer</Wrapper.MenuItem>
              {customersLoading ? (
                <Wrapper.MenuItem value="">Loading...</Wrapper.MenuItem>
              ) : (
                customers.map((cust) => (
                  <Wrapper.MenuItem key={cust._id} value={cust._id}>
                    {cust.name}
                  </Wrapper.MenuItem>
                ))
              )}
            </Wrapper.Select>
          </Wrapper.FormControl>
        </Wrapper.Grid>
      )}
      {entry.party === "Supplier" && (
        <Wrapper.Grid item xs={12} md={2}>
          <Wrapper.FormControl fullWidth variant="outlined" size="small">
            <Wrapper.InputLabel>Supplier</Wrapper.InputLabel>
            <Wrapper.Select
              name="supplier"
              value={entry.supplier || ""}
              onChange={(e) => onEntryChange(index, "supplier", e.target.value)}
              label="Supplier"
              required
            >
              <Wrapper.MenuItem value="">Select Supplier</Wrapper.MenuItem>
              {suppliersLoading ? (
                <Wrapper.MenuItem value="">Loading...</Wrapper.MenuItem>
              ) : (
                suppliers.map((supp) => (
                  <Wrapper.MenuItem key={supp._id} value={supp._id}>
                    {supp.name}
                  </Wrapper.MenuItem>
                ))
              )}
            </Wrapper.Select>
          </Wrapper.FormControl>
        </Wrapper.Grid>
      )}
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Chart of Account</Wrapper.InputLabel>
          <Wrapper.Select
            name="chartAccount"
            value={entry.chartAccount || ""}
            onChange={(e) =>
              onEntryChange(index, "chartAccount", e.target.value)
            }
            label="Chart of Account"
            required
          >
            <Wrapper.MenuItem value="">Select Account</Wrapper.MenuItem>
            {accountList
              .filter((account) =>
                voucherType === "Payment"
                  ? ["Expense", "Liabilities"].includes(account.group)
                  : ["Income", "Assets"].includes(account.group)
              )
              .map((acc) => (
                <Wrapper.MenuItem key={acc._id} value={acc._id}>
                  <Wrapper.Box
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    {acc.name}
                    <Wrapper.Chip
                      label={acc.group}
                      size="small"
                      color={
                        ["Expense", "Income"].includes(acc.group)
                          ? "primary"
                          : "default"
                      }
                      sx={{
                        height: "20px",
                        "& .MuiChip-label": { fontSize: "0.7rem", px: 1 },
                      }}
                    />
                  </Wrapper.Box>
                </Wrapper.MenuItem>
              ))}
          </Wrapper.Select>
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Amount</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="text"
            name="amount"
            value={formatNumber(inputValues[index])}
            onChange={(e) => onAmountChange(index, e.target.value)}
            onBlur={() => onAmountBlur(index)}
            label="Amount"
            required
            startAdornment={
              <Wrapper.InputAdornment position="start">
                <Wrapper.Typography sx={{ color: "#7f8c8d", fontWeight: 500 }}>
                  PKR
                </Wrapper.Typography>
              </Wrapper.InputAdornment>
            }
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      <Wrapper.Grid item xs={12} md={2}>
        <Wrapper.FormControl fullWidth variant="outlined" size="small">
          <Wrapper.InputLabel>Narration</Wrapper.InputLabel>
          <Wrapper.OutlinedInput
            type="text"
            name="narration"
            value={entry.narration || ""}
            onChange={(e) => onEntryChange(index, "narration", e.target.value)}
            label="Narration"
          />
        </Wrapper.FormControl>
      </Wrapper.Grid>
      {canRemove && (
        <Wrapper.Grid item xs={12} md={1}>
          <Wrapper.Button
            variant="outlined"
            color="error"
            onClick={() => onRemove(index)}
            sx={{ textTransform: "none" }}
          >
            Remove
          </Wrapper.Button>
        </Wrapper.Grid>
      )}
    </Wrapper.Grid>
  );
};

// VoucherTableRow: Reusable table row for voucher lists with inline editing
export const VoucherTableRow = ({
  voucher,
  onStatusUpdate,
  onDelete,
  onView,
  onPrint,
  expandedId,
  formatNumber,
  voucherType,
  isBatch = false,
}) => {
  const statusColor = {
    Draft: "default",
    Posted: "success",
    Void: "error",
  };

  const totalDebit = voucher.accounts
    ? voucher.accounts.reduce((sum, acc) => sum + (acc.debitAmount || 0), 0)
    : 0;

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    await onStatusUpdate(voucher._id, newStatus);
  };

  return (
    <>
      <Wrapper.TableRow
        sx={{
          "&:hover": { backgroundColor: "#f1f1f1" },
        }}
      >
        <Wrapper.TableCell align="center">
          {voucher.voucherNumber || voucher._id.slice(-6)}
        </Wrapper.TableCell>
        {isBatch ? (
          <Wrapper.TableCell align="center">
            {voucher.voucherType || "--"}
          </Wrapper.TableCell>
        ) : (
          <Wrapper.TableCell align="center">
            {new Date(voucher.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </Wrapper.TableCell>
        )}
        {voucherType !== "Journal" && !isBatch && (
          <Wrapper.TableCell align="center">
            {voucher.party || "--"}
          </Wrapper.TableCell>
        )}
        {voucherType === "Journal" ? (
          <Wrapper.TableCell align="center">
            PKR {formatNumber(totalDebit)}
          </Wrapper.TableCell>
        ) : (
          <Wrapper.TableCell align="center">
            PKR {formatNumber(voucher.totalAmount)}
          </Wrapper.TableCell>
        )}
        {voucherType !== "Journal" && (
          <Wrapper.TableCell align="center">
            {voucher.paymentMethod || "--"}
          </Wrapper.TableCell>
        )}
        <Wrapper.TableCell align="center">
          {voucher.reference || "--"}
        </Wrapper.TableCell>
        {voucherType === "Journal" && (
          <Wrapper.TableCell align="center">
            {voucher.description || "--"}
          </Wrapper.TableCell>
        )}
        {voucherType !== "Journal" && (
          <Wrapper.TableCell align="center">
            {voucher.status === "Posted" ? (
              <Wrapper.Typography>{voucher.status}</Wrapper.Typography>
            ) : (
              <Wrapper.Select
                value={voucher.status || "Draft"}
                onChange={handleStatusChange}
                size="small"
                sx={{ minWidth: 100 }}
              >
                <Wrapper.MenuItem value="Draft">Draft</Wrapper.MenuItem>
                <Wrapper.MenuItem value="Posted">Posted</Wrapper.MenuItem>
              </Wrapper.Select>
            )}
          </Wrapper.TableCell>
        )}
        <Wrapper.TableCell align="center">
          <>
            <Wrapper.Tooltip title="Print">
              <Wrapper.IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint(voucher);
                }}
                color="success"
                size="small"
              >
                <Wrapper.PrintIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
            <Wrapper.Tooltip title="View Details">
              <Wrapper.IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onView(voucher);
                }}
                color="info"
                size="small"
              >
                <Wrapper.VisibilityIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
            <Wrapper.Tooltip title="Delete">
              <Wrapper.IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(voucher._id);
                }}
                color="error"
                size="small"
              >
                <Wrapper.DeleteIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
          </>
        </Wrapper.TableCell>
      </Wrapper.TableRow>
    </>
  );
};

// VoucherDetails: Reusable component for voucher details in expandable rows
export const VoucherDetails = ({ voucher, formatNumber, voucherType }) => (
  <Wrapper.Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: "4px" }}>
    <Wrapper.Typography variant="subtitle1" fontWeight="bold">
      Voucher Details
    </Wrapper.Typography>
    <Wrapper.Box sx={{ ml: 2, mb: 2 }}>
      <Wrapper.Typography variant="body2">
        <strong>Voucher Number:</strong>{" "}
        {voucher.voucherNumber || voucher._id.slice(-6)}
      </Wrapper.Typography>
      <Wrapper.Typography variant="body2">
        <strong>Date:</strong>{" "}
        {new Date(voucher.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </Wrapper.Typography>
      <Wrapper.Typography variant="body2">
        <strong>Reference:</strong> {voucher.reference || "--"}
      </Wrapper.Typography>
      {voucherType === "Journal" ? (
        <>
          <Wrapper.Typography variant="body2">
            <strong>Description:</strong> {voucher.description || "--"}
          </Wrapper.Typography>
          <Wrapper.Typography variant="body2">
            <strong>Total Debit:</strong> PKR{" "}
            {formatNumber(
              voucher.accounts
                ? voucher.accounts.reduce(
                    (sum, acc) => sum + (acc.debitAmount || 0),
                    0
                  )
                : 0
            )}
          </Wrapper.Typography>
          <Wrapper.Typography variant="body2">
            <strong>Total Credit:</strong> PKR{" "}
            {formatNumber(
              voucher.accounts
                ? voucher.accounts.reduce(
                    (sum, acc) => sum + (acc.creditAmount || 0),
                    0
                  )
                : 0
            )}
          </Wrapper.Typography>
        </>
      ) : (
        <>
          <Wrapper.Typography variant="body2">
            <strong>Party:</strong> {voucher.party || "--"}
          </Wrapper.Typography>
          <Wrapper.Typography variant="body2">
            <strong>Payment Method:</strong> {voucher.paymentMethod || "--"}
          </Wrapper.Typography>
          {voucher.paymentMethod === "Bank" && (
            <>
              <Wrapper.Typography variant="body2">
                <strong>Bank Account:</strong>{" "}
                {voucher.bankAccountDetail
                  ? voucher.bankAccountDetail.accountTitle || "--"
                  : "--"}
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                <strong>Bank Name:</strong>{" "}
                {voucher.bankAccountDetail
                  ? voucher.bankAccountDetail.bankName || "--"
                  : "--"}
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                <strong>Account Number:</strong>{" "}
                {voucher.bankAccountDetail
                  ? voucher.bankAccountDetail.accountNumber || "--"
                  : "--"}
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                <strong>Transaction Number:</strong>{" "}
                {voucher.transactionNumber || "--"}
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                <strong>Clearance Date:</strong>{" "}
                {voucher.clearanceDate
                  ? new Date(voucher.clearanceDate).toLocaleDateString("en-US")
                  : "--"}
              </Wrapper.Typography>
            </>
          )}
          {voucher.paymentMethod === "Cash" && (
            <Wrapper.Typography variant="body2">
              <strong>Cash Account:</strong>{" "}
              {voucher.cashAccountDetail
                ? voucher.cashAccountDetail.name || "--"
                : "--"}
            </Wrapper.Typography>
          )}
          <Wrapper.Typography variant="body2">
            <strong>Total Amount:</strong> PKR{" "}
            {formatNumber(voucher.totalAmount)}
          </Wrapper.Typography>
          <Wrapper.Typography variant="body2">
            <strong>Status:</strong> {voucher.status || "--"}
          </Wrapper.Typography>
        </>
      )}
      {voucher.accounts && voucher.accounts.length > 0 && (
        <>
          <Wrapper.Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ mt: 2 }}
          >
            Account Entries
          </Wrapper.Typography>
          {voucherType === "Journal"
            ? voucher.accounts.map((acc, index) => (
                <Wrapper.Box key={index} sx={{ ml: 2 }}>
                  <Wrapper.Typography variant="body2">
                    <strong>Account {index + 1}:</strong>{" "}
                    {acc.accountDetail ? acc.accountDetail.name || "--" : "--"}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2">
                    <strong>Debit:</strong> PKR{" "}
                    {formatNumber(acc.debitAmount) || "--"}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2">
                    <strong>Credit:</strong> PKR{" "}
                    {formatNumber(acc.creditAmount) || "--"}
                  </Wrapper.Typography>
                </Wrapper.Box>
              ))
            : voucher.accounts.map((acc, index) => (
                <Wrapper.Box key={index} sx={{ ml: 2 }}>
                  <Wrapper.Typography variant="body2">
                    <strong>Account {index + 1}:</strong>{" "}
                    {acc.accountDetail ? acc.accountDetail.name || "--" : "--"}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2">
                    <strong>Amount:</strong> PKR {formatNumber(acc.amount)}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2">
                    <strong>Narration:</strong> {acc.narration || "--"}
                  </Wrapper.Typography>
                </Wrapper.Box>
              ))}
        </>
      )}
    </Wrapper.Box>
  </Wrapper.Box>
);

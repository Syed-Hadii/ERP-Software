import Wrapper from "../utils/wrapper";

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
  // Adjust field props based on JournalType
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

{
  /* // JournalAccountEntry: Reusable component for account entry rows in Journal forms */
}
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

{
  /* // VoucherTableRow: Reusable table row for voucher lists with inline editing */
}
export const VoucherTableRow = ({
  voucher,
  editingId,
  editableVoucher,
  onEditClick,
  onEditChange,
  onSave,
  onCancel,
  onDelete,
  onExpand,
  expandedId,
  formatNumber,
  voucherType,
}) => {
  const isEditing = editingId === voucher._id;
  const statusColor = {
    Draft: "default",
    Posted: "success",
    Void: "error",
  };

  const totalDebit = voucher.accounts?.reduce(
    (sum, acc) => sum + (acc.debitAmount || 0),
    0
  );

  return (
    <>
      <Wrapper.TableRow
        sx={{
          backgroundColor: isEditing ? "rgba(0, 0, 0, 0.04)" : null,
          "&:hover": { backgroundColor: "#f1f1f1" },
        }}
        onClick={() => onExpand(voucher._id)}
      >
        <Wrapper.TableCell align="center">
          {voucher.voucherNumber || voucher._id.slice(-6)}
        </Wrapper.TableCell>
        <Wrapper.TableCell align="center">
          {isEditing ? (
            <Wrapper.TextField
              type="date"
              name="date"
              value={
                editableVoucher.date
                  ? new Date(editableVoucher.date).toISOString().split("T")[0]
                  : ""
              }
              onChange={onEditChange}
              size="small"
            />
          ) : (
            new Date(voucher.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          )}
        </Wrapper.TableCell>
        <Wrapper.TableCell align="center">
          {isEditing ? (
            <Wrapper.TextField
              name="reference"
              value={editableVoucher.reference || ""}
              onChange={onEditChange}
              size="small"
            />
          ) : (
            voucher.reference || "--"
          )}
        </Wrapper.TableCell>
        {voucherType === "Journal" ? (
          <Wrapper.TableCell align="center">
            PKR {formatNumber(totalDebit)}
          </Wrapper.TableCell>
        ) : (
          <Wrapper.TableCell align="center">
            PKR {formatNumber(voucher.totalAmount)}
          </Wrapper.TableCell>
        )}
        {voucherType === "Journal" ? (
          <Wrapper.TableCell align="center">
            {isEditing ? (
              <Wrapper.TextField
                name="description"
                value={editableVoucher.description || ""}
                onChange={onEditChange}
                size="small"
                multiline
              />
            ) : (
              voucher.description || "--"
            )}
          </Wrapper.TableCell>
        ) : (
          <>
            <Wrapper.TableCell align="center">
              {voucher.paymentMethod || "--"}
            </Wrapper.TableCell>
            <Wrapper.TableCell align="center">
              {voucher.party || "--"}
            </Wrapper.TableCell>
          </>
        )}
        {voucherType !== "Journal" && (
          <Wrapper.TableCell align="center">
            {isEditing ? (
              <Wrapper.Select
                name="status"
                value={editableVoucher.status || ""}
                onChange={onEditChange}
                size="small"
                fullWidth
              >
                <Wrapper.MenuItem value="Draft">Draft</Wrapper.MenuItem>
                <Wrapper.MenuItem value="Posted">Posted</Wrapper.MenuItem>
                <Wrapper.MenuItem value="Void">Void</Wrapper.MenuItem>
              </Wrapper.Select>
            ) : (
              <Wrapper.Chip
                label={voucher.status || "--"}
                color={statusColor[voucher.status] || "default"}
                size="small"
              />
            )}
          </Wrapper.TableCell>
        )}
        <Wrapper.TableCell align="center">
          {isEditing ? (
            <>
              <Wrapper.Tooltip title="Save">
                <Wrapper.IconButton
                  onClick={onSave}
                  color="primary"
                  size="small"
                >
                  <Wrapper.SaveIcon fontSize="small" />
                </Wrapper.IconButton>
              </Wrapper.Tooltip>
              <Wrapper.Tooltip title="Cancel">
                <Wrapper.IconButton
                  onClick={onCancel}
                  color="default"
                  size="small"
                >
                  <Wrapper.CloseIcon fontSize="small" />
                </Wrapper.IconButton>
              </Wrapper.Tooltip>
            </>
          ) : (
            <>
              <Wrapper.Tooltip title="Edit">
                <Wrapper.IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(voucher);
                  }}
                  color="primary"
                  size="small"
                >
                  <Wrapper.EditIcon fontSize="small" />
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
              <Wrapper.Tooltip
                title={expandedId === voucher._id ? "Collapse" : "Expand"}
              >
                <Wrapper.IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(voucher._id);
                  }}
                  size="small"
                >
                  {expandedId === voucher._id ? (
                    <Wrapper.ExpandLessIcon fontSize="small" />
                  ) : (
                    <Wrapper.ExpandMoreIcon fontSize="small" />
                  )}
                </Wrapper.IconButton>
              </Wrapper.Tooltip>
            </>
          )}
        </Wrapper.TableCell>
      </Wrapper.TableRow>
      <Wrapper.TableRow>
        <Wrapper.TableCell
          colSpan={voucherType === "Journal" ? 6 : 8}
          sx={{ paddingBottom: 0, paddingTop: 0 }}
        >
          <Wrapper.Collapse
            in={expandedId === voucher._id}
            timeout="auto"
            unmountOnExit
          >
            <VoucherDetails
              voucher={voucher}
              formatNumber={formatNumber}
              voucherType={voucherType}
            />
          </Wrapper.Collapse>
        </Wrapper.TableCell>
      </Wrapper.TableRow>
    </>
  );
};

{
  /* // VoucherDetails: Reusable component for voucher details in expandable rows */
}
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
              voucher.accounts?.reduce(
                (sum, acc) => sum + (acc.debitAmount || 0),
                0
              )
            )}
          </Wrapper.Typography>
          <Wrapper.Typography variant="body2">
            <strong>Total Credit:</strong> PKR{" "}
            {formatNumber(
              voucher.accounts?.reduce(
                (sum, acc) => sum + (acc.creditAmount || 0),
                0
              )
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
                {voucher.bankAccountDetail?.accountTitle || "--"}
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                <strong>Bank Name:</strong>{" "}
                {voucher.bankAccountDetail?.bankName || "--"}
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                <strong>Account Number:</strong>{" "}
                {voucher.bankAccountDetail?.accountNumber || "--"}
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
              {voucher.cashAccountDetail?.name || "--"}
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
      {voucher.accounts?.length > 0 && (
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
                    {acc.accountDetail?.name || "--"}
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
                    {acc.accountDetail?.name || "--"}
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

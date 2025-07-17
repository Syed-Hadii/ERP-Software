import Wrapper from "../../utils/wrapper";
import { format } from "date-fns";

const VoucherDetailsModal = ({ open, onClose, voucher, voucherType }) => {
  if (!voucher) return null;

  const isBatch = Array.isArray(voucher.entries);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd MMM yyyy");
  };

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    return parseFloat(value).toLocaleString("en-US");
  };

  return (
    <Wrapper.Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)" },
      }}
    >
      <Wrapper.Box sx={{ p: 4 }}>
        {/* Header */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            borderBottom: "2px solid #2E7D32",
            pb: 2,
          }}
        >
          <Wrapper.Typography variant="h5" fontWeight="bold">
            {isBatch
              ? `Batch ${voucher.voucherType} Voucher Details`
              : `${voucherType} Voucher Details`}
          </Wrapper.Typography>
          <Wrapper.Typography variant="h6" color="text.secondary">
            #{voucher.voucherNumber || voucher._id.slice(-6)}
          </Wrapper.Typography>
        </Wrapper.Box>

        {/* Main Details */}
        <Wrapper.Grid container spacing={3} sx={{ mb: 4 }}>
          <Wrapper.Grid item xs={6}>
            <Wrapper.Typography
              variant="subtitle1"
              fontWeight="medium"
              gutterBottom
            >
              Basic Information
            </Wrapper.Typography>
            <Wrapper.Box sx={{ pl: 2 }}>
              {isBatch ? (
                <>
                  <Wrapper.Typography>
                    <strong>Voucher Type:</strong>{" "}
                    {voucher.voucherType ?? "N/A"}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Payment Method:</strong>{" "}
                    {voucher.paymentMethod ?? "N/A"}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Total Amount:</strong> PKR{" "}
                    {formatNumber(voucher.totalAmount || 0)}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Status:</strong>{" "}
                    <Wrapper.Chip
                      label={voucher.status || "N/A"}
                      size="small"
                      color={
                        voucher.status === "Posted"
                          ? "success"
                          : voucher.status === "Draft"
                          ? "default"
                          : "error"
                      }
                      sx={{ ml: 1 }}
                    />
                  </Wrapper.Typography>
                </>
              ) : (
                <>
                  <Wrapper.Typography>
                    <strong>Date:</strong> {formatDate(voucher.date)}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Status:</strong>{" "}
                    <Wrapper.Chip
                      label={voucher.status || "N/A"}
                      size="small"
                      color={
                        voucher.status === "Posted"
                          ? "success"
                          : voucher.status === "Draft"
                          ? "default"
                          : "error"
                      }
                      sx={{ ml: 1 }}
                    />
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Reference:</strong> {voucher.reference || "N/A"}
                  </Wrapper.Typography>
                  {voucherType !== "Journal" && (
                    <>
                      <Wrapper.Typography>
                        <strong>Party:</strong> {voucher.party || "N/A"}
                      </Wrapper.Typography>
                      <Wrapper.Typography>
                        <strong>Payment Method:</strong>{" "}
                        {voucher.paymentMethod || "N/A"}
                      </Wrapper.Typography>
                    </>
                  )}
                </>
              )}
            </Wrapper.Box>
          </Wrapper.Grid>
          <Wrapper.Grid item xs={6}>
            <Wrapper.Typography
              variant="subtitle1"
              fontWeight="medium"
              gutterBottom
            >
              {isBatch
                ? "Batch Details"
                : voucherType === "Journal"
                ? "Journal Details"
                : "Transaction Details"}
            </Wrapper.Typography>
            <Wrapper.Box sx={{ pl: 2 }}>
              {isBatch ? (
                <>
                  <Wrapper.Typography>
                    <strong>Reference:</strong> {voucher.reference || "N/A"}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Description:</strong> {voucher.description || "N/A"}
                  </Wrapper.Typography>
                </>
              ) : (
                <>
                  {voucherType !== "Journal" && (
                    <>
                      <Wrapper.Typography>
                        <strong>Total Amount:</strong> PKR{" "}
                        {formatNumber(voucher.totalAmount || 0)}
                      </Wrapper.Typography>
                      {voucher.party === "Supplier" &&
                        voucher.supplier?.name && (
                          <Wrapper.Typography>
                            <strong>Supplier:</strong> {voucher.supplier.name}
                          </Wrapper.Typography>
                        )}
                      {voucher.party === "Customer" &&
                        voucher.customer?.name && (
                          <Wrapper.Typography>
                            <strong>Customer:</strong> {voucher.customer.name}
                          </Wrapper.Typography>
                        )}
                    </>
                  )}
                  <Wrapper.Typography>
                    <strong>Description:</strong> {voucher.description || "N/A"}
                  </Wrapper.Typography>
                </>
              )}
            </Wrapper.Box>
          </Wrapper.Grid>
        </Wrapper.Grid>

        {/* Table */}
        <Wrapper.Typography
          variant="subtitle1"
          fontWeight="medium"
          gutterBottom
        >
          Account Entries
        </Wrapper.Typography>
        <Wrapper.TableContainer component={Wrapper.Paper} sx={{ mb: 4 }}>
          <Wrapper.Table>
            <Wrapper.TableHead>
              <Wrapper.TableRow>
                {isBatch ? (
                  <>
                    <Wrapper.TableCell>Date</Wrapper.TableCell>
                    <Wrapper.TableCell>Party</Wrapper.TableCell>
                    <Wrapper.TableCell>Name</Wrapper.TableCell>
                    <Wrapper.TableCell>Account</Wrapper.TableCell>
                    <Wrapper.TableCell align="right">Amount</Wrapper.TableCell>
                    <Wrapper.TableCell>Narration</Wrapper.TableCell>
                  </>
                ) : (
                  <>
                    <Wrapper.TableCell>Account</Wrapper.TableCell>
                    {voucherType === "Journal" && (
                      <>
                        <Wrapper.TableCell align="right">
                          Debit
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="right">
                          Credit
                        </Wrapper.TableCell>
                      </>
                    )}
                    {voucherType !== "Journal" && (
                      <Wrapper.TableCell align="right">
                        Amount
                      </Wrapper.TableCell>
                    )}
                    <Wrapper.TableCell>Narration</Wrapper.TableCell>
                  </>
                )}
              </Wrapper.TableRow>
            </Wrapper.TableHead>
            <Wrapper.TableBody>
              {isBatch
                ? (voucher.entries ?? []).map((entry, index) => {
                    const name =
                      entry.party === "Customer"
                        ? entry.customer?.name
                        : entry.party === "Supplier"
                        ? entry.supplier?.name
                        : "Other";
                    return (
                      <Wrapper.TableRow key={index}>
                        <Wrapper.TableCell>
                          {formatDate(entry.date)}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{entry.party}</Wrapper.TableCell>
                        <Wrapper.TableCell>{name ?? "N/A"}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {entry.chartAccount?.name ?? "Unknown"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="right">
                          {formatNumber(entry.amount || 0)}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {entry.narration || "N/A"}
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    );
                  })
                : (voucher.accounts ?? []).map((account, index) => (
                    <Wrapper.TableRow key={index}>
                      <Wrapper.TableCell>
                        {account.chartAccount?.name ||
                          account.chartAccount ||
                          "N/A"}
                      </Wrapper.TableCell>
                      {voucherType === "Journal" && (
                        <>
                          <Wrapper.TableCell align="right">
                            {account.debitAmount
                              ? formatNumber(account.debitAmount)
                              : "-"}
                          </Wrapper.TableCell>
                          <Wrapper.TableCell align="right">
                            {account.creditAmount
                              ? formatNumber(account.creditAmount)
                              : "-"}
                          </Wrapper.TableCell>
                        </>
                      )}
                      {voucherType !== "Journal" && (
                        <Wrapper.TableCell align="right">
                          {formatNumber(account.amount || 0)}
                        </Wrapper.TableCell>
                      )}
                      <Wrapper.TableCell>
                        {account.narration || "N/A"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
            </Wrapper.TableBody>
          </Wrapper.Table>
        </Wrapper.TableContainer>

        {/* Footer */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            borderTop: "1px solid #e0e0e0",
            pt: 3,
          }}
        >
          <Wrapper.Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderRadius: 1 }}
          >
            Close
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>
    </Wrapper.Dialog>
  );
};

export default VoucherDetailsModal;

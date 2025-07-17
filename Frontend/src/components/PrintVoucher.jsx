import Wrapper from "../utils/wrapper";
import { format } from "date-fns";
import logo from "../assets/erp.png"
// Helper function to format dates safely
const formatDate = (date, fallback = "N/A") => {
  try {
    if (!date || isNaN(new Date(date).getTime())) return fallback;
    return format(new Date(date), "dd MMM yyyy");
  } catch (error) {
    return fallback;
  }
};

// Helper function to format currency
const formatCurrency = (value, currency = "PKR") => {
  if (!value && value !== 0) return `${currency} 0`;
  return `${currency} ${parseFloat(value).toLocaleString("en-US")}`;
};

const PrintVoucher = ({
  open,
  onClose,
  transaction,
  transactionType = "Journal",
}) => {
  if (!transaction) return null;

  const isBatch = Array.isArray(transaction.entries);

  const getTitle = () => {
    if (isBatch) {
      return `Batch ${transaction.voucherType} Voucher`;
    }
    switch (transactionType) {
      case "Journal":
        return "Journal Voucher";
      case "Payment":
        return "Payment Voucher";
      case "Receipt":
        return "Receipt Voucher";
      default:
        return "Voucher";
    }
  };

  const calculateTotals = () => {
    if (transactionType === "Journal" && !isBatch) {
      const totalDebit = (transaction.accounts ?? []).reduce(
        (sum, acc) => sum + (acc.debitAmount ?? 0),
        0
      );
      const totalCredit = (transaction.accounts ?? []).reduce(
        (sum, acc) => sum + (acc.creditAmount ?? 0),
        0
      );
      return { totalDebit, totalCredit };
    }
    return {
      totalDebit: transaction.totalAmount ?? 0,
      totalCredit: transaction.totalAmount ?? 0,
    };
  };

  const { totalDebit, totalCredit } = calculateTotals();

  const renderTable = () => {
    if (isBatch) {
      return (
        <Wrapper.TableContainer
          component={Wrapper.Paper}
          sx={{ mb: 4, borderRadius: 1, boxShadow: 1 }}
        >
          <Wrapper.Table>
            <Wrapper.TableHead>
              <Wrapper.TableRow>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                  Date
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                  Payee
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                  Name
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                  Account
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="right">
                  Amount (PKR)
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                  Narration
                </Wrapper.TableCell>
              </Wrapper.TableRow>
            </Wrapper.TableHead>
            <Wrapper.TableBody>
              {(transaction.entries ?? []).map((entry, index) => {
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
                      {formatCurrency(entry.amount)}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {entry.narration ?? "N/A"}
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                );
              })}
            </Wrapper.TableBody>
          </Wrapper.Table>
        </Wrapper.TableContainer>
      );
    }
    return (
      <Wrapper.TableContainer
        component={Wrapper.Paper}
        sx={{ mb: 4, borderRadius: 1, boxShadow: 1 }}
      >
        <Wrapper.Table>
          <Wrapper.TableHead>
            <Wrapper.TableRow>
              <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                Account
              </Wrapper.TableCell>
              <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="center">
                {transactionType === "Journal" ? "Debit (PKR)" : "Amount (PKR)"}
              </Wrapper.TableCell>
              {transactionType === "Journal" && (
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="center">
                  Credit (PKR)
                </Wrapper.TableCell>
              )}
              <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="center">
                Narration
              </Wrapper.TableCell>
            </Wrapper.TableRow>
          </Wrapper.TableHead>
          <Wrapper.TableBody>
            {(transaction.accounts ?? []).map((account, index) => (
              <Wrapper.TableRow key={index}>
                <Wrapper.TableCell>
                  {account.chartAccount?.name ?? "Unknown"}
                </Wrapper.TableCell>
                <Wrapper.TableCell align="center">
                  {formatCurrency(
                    transactionType === "Journal"
                      ? account.debitAmount ?? 0
                      : account.amount ?? 0
                  )}
                </Wrapper.TableCell>
                {transactionType === "Journal" && (
                  <Wrapper.TableCell align="center">
                    {formatCurrency(account.creditAmount ?? 0)}
                  </Wrapper.TableCell>
                )}
                <Wrapper.TableCell align="center">
                  {account.narration ?? "N/A"}
                </Wrapper.TableCell>
              </Wrapper.TableRow>
            ))}
          </Wrapper.TableBody>
        </Wrapper.Table>
      </Wrapper.TableContainer>
    );
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
      <Wrapper.Box
        sx={{ p: 4, backgroundColor: "white", "@media print": { p: 2 } }}
        className="printable-content"
      >
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
          <Wrapper.Typography variant="h4" fontWeight="bold">
            <img src={logo} alt="" />
            {getTitle()}
          </Wrapper.Typography>
          <Wrapper.Typography variant="h6" color="text.secondary">
            #{transaction.voucherNumber ?? transaction._id?.slice(-6) ?? "N/A"}
          </Wrapper.Typography>
        </Wrapper.Box>

        {/* Transaction Details */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {isBatch ? (
            <>
              <Wrapper.Box>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Voucher Type
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  {transaction.voucherType ?? "N/A"}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" color="text.secondary">
                  Payment Method: {transaction.paymentMethod ?? "N/A"}
                </Wrapper.Typography>
              </Wrapper.Box>
              <Wrapper.Box sx={{ textAlign: "right" }}>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Total Amount
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  {formatCurrency(transaction.totalAmount ?? 0)}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body2" color="text.secondary">
                  Status: {transaction.status ?? "N/A"}
                </Wrapper.Typography>
              </Wrapper.Box>
            </>
          ) : (
            <>
              <Wrapper.Box>
                {["Payment", "Receipt"].includes(transactionType) && (
                  <>
                    <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                      Party
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {(transaction.party === "Customer"
                        ? transaction.customer?.name
                        : transaction.party === "Supplier"
                        ? transaction.supplier?.name
                        : transaction.party) ?? "N/A"}
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body2" color="text.secondary">
                      Payment Method: {transaction.paymentMethod ?? "N/A"}
                    </Wrapper.Typography>
                  </>
                )}
                {transactionType === "Journal" && (
                  <>
                    <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                      Description
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {transaction.description ?? "N/A"}
                    </Wrapper.Typography>
                  </>
                )}
              </Wrapper.Box>
              <Wrapper.Box sx={{ textAlign: "right" }}>
                <Wrapper.Typography variant="subtitle1" fontWeight="medium">
                  Details
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Date: {formatDate(transaction.date)}
                </Wrapper.Typography>
                {["Payment", "Receipt"].includes(transactionType) && (
                  <>
                    <Wrapper.Typography variant="body1">
                      Transaction Number:{" "}
                      {transaction.transactionNumber ?? "N/A"}
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      Clearance Date: {formatDate(transaction.clearanceDate)}
                    </Wrapper.Typography>
                  </>
                )}
                <Wrapper.Typography variant="body1">
                  Reference: {transaction.reference ?? "N/A"}
                </Wrapper.Typography>
              </Wrapper.Box>
            </>
          )}
        </Wrapper.Box>

        {/* Table */}
        {renderTable()}

        {/* Summary */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Wrapper.Box>
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              Notes
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              {transaction.description ?? "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box sx={{ textAlign: "right" }}>
            {isBatch || ["Payment", "Receipt"].includes(transactionType) ? (
              <Wrapper.Typography variant="h6" fontWeight="bold">
                Total Amount: {formatCurrency(transaction.totalAmount ?? 0)}
              </Wrapper.Typography>
            ) : (
              <>
                <Wrapper.Typography variant="h6" fontWeight="bold">
                  Total Debit: {formatCurrency(totalDebit)}
                </Wrapper.Typography>
                <Wrapper.Typography variant="body1">
                  Total Credit: {formatCurrency(totalCredit)}
                </Wrapper.Typography>
              </>
            )}
            <Wrapper.Typography variant="body2" color="text.secondary">
              Status:{" "}
              {transaction.status
                ? transaction.status.charAt(0).toUpperCase() +
                  transaction.status.slice(1)
                : "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
        </Wrapper.Box>

        {/* Footer */}
        <Wrapper.Box
          sx={{
            borderTop: "1px solid #2E7D32",
            pt: 2,
            textAlign: "center",
            color: "text.secondary",
            "@media print": { display: "none" },
          }}
        >
          <Wrapper.Typography variant="body2">
            Generated by Your Company Name
          </Wrapper.Typography>
        </Wrapper.Box>

        {/* Print Button */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            "@media print": { display: "none" },
          }}
        >
          <Wrapper.Button
            variant="outlined"
            color="error"
            onClick={onClose}
            sx={{ borderRadius: 1 }}
          >
            Close
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="primary"
            onClick={() => window.print()}
            startIcon={<Wrapper.PrintIcon />}
            sx={{
              borderRadius: 1,
              bgcolor: "#2E7D32",
              "&:hover": { bgcolor: "#1B5E20" },
            }}
          >
            Print
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>
    </Wrapper.Dialog>
  );
};

export default PrintVoucher;

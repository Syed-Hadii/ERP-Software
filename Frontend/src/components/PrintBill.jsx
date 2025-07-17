import Wrapper from "../utils/wrapper";
import { format } from "date-fns";

// Helper function for structured debugging logs
const logDebug = (context, message, data = {}) => {
  console.log(`[${new Date().toISOString()}] ${context}: ${message}`, data);
};

// Helper function to format dates safely
const formatDate = (date, fallback = "N/A") => {
  try {
    if (!date || isNaN(new Date(date).getTime())) {
      logDebug("formatDate", "Invalid date, using fallback", { date });
      return fallback;
    }
    return format(new Date(date), "dd MMM yyyy");
  } catch (error) {
    logDebug("formatDate", "Error formatting date", {
      date,
      error: error.message,
    });
    return fallback;
  }
};

const PrintBill = ({
  open,
  onClose,
  invoice,
  invoiceType = "PurchaseInvoice",
}) => {
  logDebug("PrintBill", "Rendering component", {
    open,
    invoiceType,
    invoiceId: invoice?._id,
  });

  // Fallback if invoice is not provided
  if (!invoice) {
    logDebug("PrintBill", "No invoice provided, returning null");
    return null;
  }

  const handlePrint = () => {
    logDebug("PrintBill", "Print button clicked");
    window.print();
  };

  // Use schema-provided totals with fallbacks
  const subtotal = invoice.subtotal ?? 0;
  const totalDiscount = invoice.discountAmount ?? 0;
  const totalAmount = invoice.totalAmount ?? 0;

  logDebug("PrintBill", "Using invoice totals", {
    subtotal,
    totalDiscount,
    totalAmount,
  });

  return (
    <Wrapper.Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          overflowY: "auto",
        },
      }}
    >
      <Wrapper.Box
        sx={{
          p: 4,
          backgroundColor: "white",
          "@media print": {
            p: 2,
          },
        }}
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
            {invoiceType === "SalesInvoice"
              ? "Sales Invoice"
              : "Purchase Invoice"}
          </Wrapper.Typography>
          <Wrapper.Typography variant="h6" color="text.secondary">
            #{invoice.invoiceNumber ?? "N/A"}
          </Wrapper.Typography>
        </Wrapper.Box>

        {/* Invoice Details */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Wrapper.Box>
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              Supplier:
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              {invoice.supplier?.name ?? "N/A"}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" color="text.secondary">
              {invoice.supplierAddress ?? "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box sx={{ textAlign: "right" }}>
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              Invoice Details:
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              Issue Date: {formatDate(invoice.date)}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              Due Date: {formatDate(invoice.dueDate)}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              Reference: {invoice.reference ?? "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
        </Wrapper.Box>

        {/* Items Table */}
        <Wrapper.TableContainer
          component={Wrapper.Paper}
          sx={{ mb: 4, borderRadius: 1, boxShadow: 1 }}
        >
          <Wrapper.Table>
            <Wrapper.TableHead>
              <Wrapper.TableRow>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                  Item
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="center">
                  Quantity
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="center">
                  Unit Price (PKR)
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="center">
                  Discount (%)
                </Wrapper.TableCell>
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="right">
                  Total (PKR)
                </Wrapper.TableCell>
              </Wrapper.TableRow>
            </Wrapper.TableHead>
            <Wrapper.TableBody>
              {(invoice.items ?? []).map((item, index) => {
                const itemSubtotal =
                  (item.quantity ?? 0) * (item.unitPrice ?? 0);
                const itemDiscount =
                  (itemSubtotal * (item.discountPercent ?? 0)) / 100;
                const itemTotal = itemSubtotal - itemDiscount;

                logDebug("PrintBill", "Rendering item", {
                  index,
                  itemId: item.item?._id,
                  itemName: item.item?.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discountPercent: item.discountPercent,
                  itemTotal,
                });

                return (
                  <Wrapper.TableRow key={index}>
                    <Wrapper.TableCell>
                      {item.item?.name ?? "Unknown"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="center">
                      {item.quantity ?? 0} {item.item?.unitName ?? "units"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="center">
                      {(item.unitPrice ?? 0).toLocaleString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="center">
                      {item.discountPercent ?? 0}%
                    </Wrapper.TableCell>
                    <Wrapper.TableCell align="right">
                      {itemTotal.toLocaleString()}
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                );
              })}
            </Wrapper.TableBody>
          </Wrapper.Table>
        </Wrapper.TableContainer>

        {/* Summary and Notes */}
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
              Notes:
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              {invoice.notes ?? "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box sx={{ textAlign: "right" }}>
            <Wrapper.Typography variant="body1">
              Subtotal: PKR {subtotal.toLocaleString()}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              Total Discount: PKR {totalDiscount.toLocaleString()}
            </Wrapper.Typography>
            <Wrapper.Typography variant="h6" fontWeight="bold">
              Total Amount: PKR {totalAmount.toLocaleString()}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" color="text.secondary">
              Status:{" "}
              {invoice.paymentStatus
                ? invoice.paymentStatus.charAt(0).toUpperCase() +
                  invoice.paymentStatus.slice(1)
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
            "@media print": {
              display: "none",
            },
          }}
        >
          <Wrapper.Typography variant="body2">
            Generated by Gexton
          </Wrapper.Typography>
        </Wrapper.Box>

        {/* Print Button */}
        <Wrapper.Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            "@media print": {
              display: "none",
            },
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
            onClick={handlePrint}
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

export default PrintBill;

import Wrapper from "../../utils/wrapper";
import { format } from "date-fns";

const PrintBill = ({ open, onClose, invoice }) => {
  if (!invoice) return null;
console.log(invoice)
  const handlePrint = () => {
    window.print();
  };

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
          overflow: "hidden",
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
            Purchase Invoice
          </Wrapper.Typography>
          <Wrapper.Typography variant="h6" color="text.secondary">
            #{invoice.invoiceNumber}
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
              {invoice.supplier?.name || "N/A"}
            </Wrapper.Typography>
            <Wrapper.Typography variant="body2" color="text.secondary">
              {invoice.supplier?.address || "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box sx={{ textAlign: "right" }}>
            <Wrapper.Typography variant="subtitle1" fontWeight="medium">
              Invoice Details:
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              Issue Date:{" "}
              {invoice?.issueDate
                ? format(new Date(invoice.issueDate), "dd MMM yyyy")
                : "N/A"}
            </Wrapper.Typography>

            <Wrapper.Typography variant="body1">
              Due Date:{" "}
              {invoice?.dueDate
                ? format(new Date(invoice.dueDate), "dd MMM yyyy")
                : "N/A"}
            </Wrapper.Typography>

            <Wrapper.Typography variant="body1">
              Reference: {invoice.reference || "N/A"}
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
                <Wrapper.TableCell sx={{ fontWeight: "bold" }} align="right">
                  Total (PKR)
                </Wrapper.TableCell>
              </Wrapper.TableRow>
            </Wrapper.TableHead>
            <Wrapper.TableBody>
              {invoice.items.map((item, index) => (
                <Wrapper.TableRow key={index}>
                  <Wrapper.TableCell>
                    {item.item?.name || "Unknown"}
                  </Wrapper.TableCell>
                  <Wrapper.TableCell align="center">
                    {item.quantity} {item.item?.unit || "units"}
                  </Wrapper.TableCell>
                  <Wrapper.TableCell align="center">
                    {item.unitPrice.toLocaleString()}
                  </Wrapper.TableCell>
                  <Wrapper.TableCell align="right">
                    {(item.quantity * item.unitPrice).toLocaleString()}
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              ))}
            </Wrapper.TableBody>
          </Wrapper.Table>
        </Wrapper.TableContainer>

        {/* Total and Description */}
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
              Description:
            </Wrapper.Typography>
            <Wrapper.Typography variant="body1">
              {invoice.description || "N/A"}
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box sx={{ textAlign: "right" }}>
            <Wrapper.Typography variant="h6" fontWeight="bold">
              Total: PKR{" "}
              {invoice?.subtotal ? invoice.subtotal.toLocaleString() : "0"}
            </Wrapper.Typography>

            <Wrapper.Typography variant="body2" color="text.secondary">
              Status:{" "}
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
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
            Generated by Your Company Name
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

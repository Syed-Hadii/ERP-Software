import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import PrintBill from "../../components/Modals/PrintBill";
import PurchaseInvoiceForm from "../../components/PurchaseInvoiceForm";

const PurchaseInvoice = () => {
  const theme = Wrapper.useTheme();
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "asc",
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const recordsPerPage = 7;

  const formatDate = (date, defaultValue = "-") => {
    if (!date) return defaultValue;
    try {
      const parsedDate = new Date(date);
      if (!isValid(parsedDate)) return defaultValue;
      return format(parsedDate, "dd MMM yyyy");
    } catch (error) {
      return defaultValue;
    }
  };

  const invoiceColumns = [
    {
      key: "invoiceNumber",
      label: "Invoice Number",
      sortable: true,
      render: (row) => row.invoiceNumber ?? "-",
    },
    {
      key: "date",
      label: "Issue Date",
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: "reference",
      label: "Reference",
      sortable: true,
      render: (row) => row.reference ?? "-",
    },
    {
      key: "supplier",
      label: "Supplier",
      sortable: false,
      render: (row) => row.supplier?.name ?? "-",
    },
    {
      key: "items",
      label: "Items",
      sortable: false,
      render: (row) =>
        row.items?.length
          ? row.items
              .map((i) => `${i.item?.name ?? "-"} (${i.quantity ?? 0})`)
              .join(", ")
          : "-",
    },
    {
      key: "totalAmount",
      label: "Total (PKR)",
      sortable: true,
      render: (row) => (row.totalAmount ?? 0).toLocaleString(),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Wrapper.Chip
          label={
            row.status
              ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
              : "-"
          }
          color={
            row.status === "approved"
              ? "success"
              : row.status === "rejected"
              ? "error"
              : "warning"
          }
          size="small"
          sx={{ fontWeight: "medium" }}
        />
      ),
    },
    {
      key: "print",
      label: "Print Bill",
      render: (row) => (
        <Wrapper.IconButton
          onClick={() => {
            setSelectedInvoice(row);
            setIsPrintModalOpen(true);
          }}
          title="Print Bill"
        >
          <Wrapper.PrintIcon color="primary" />
        </Wrapper.IconButton>
      ),
    },
  ];

  const fetchSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/supplier/get?all=true`
      );
      if (response.data?.success) {
        setSuppliers(response.data.data);
      } else {
        showNotification("Failed to fetch suppliers", "error");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to fetch suppliers",
        "error"
      );
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/items/view?all=true`
      );
      if (response.data?.items) {
        setItems(response.data.items);
      } else {
        showNotification("Failed to fetch items", "error");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to fetch items",
        "error"
      );
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const statusQuery = statusFilter === "all" ? "" : statusFilter;
      const response = await Wrapper.axios.get(
        `${BASE_URL}/purchase?page=${currentPage}&limit=${recordsPerPage}&search=${encodeURIComponent(
          search
        )}&status=${statusQuery}`
      );
      if (response.data?.success) {
        setInvoices(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setTotalInvoices(response.data.totalInvoices || 0);
      } else {
        showNotification("Failed to fetch invoices", "error");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to fetch invoices",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, search, statusFilter]);

  return (
    <Wrapper.Box sx={{ p: 4, maxWidth: "1600px", mx: "auto" }}>
      <Wrapper.Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 4,
          gap: 2,
        }}
      >
        <Wrapper.Box>
          <Wrapper.Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{
              position: "relative",
              "&:after": {
                content: '""',
                position: "absolute",
                bottom: "-8px",
                left: 0,
                width: "40px",
                height: "4px",
                bgcolor: "#10b981",
                borderRadius: "2px",
              },
            }}
          >
            Purchase Invoices
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage purchase invoices and record new stock
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Wrapper.TextField
            placeholder="Search invoices..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 220 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": { borderColor: "#2e7d32" },
                "&:hover fieldset": { borderColor: "#2e7d32" },
                "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
              },
            }}
            InputProps={{
              startAdornment: (
                <Wrapper.InputAdornment position="start">
                  <Wrapper.SearchIcon fontSize="small" />
                </Wrapper.InputAdornment>
              ),
            }}
          />
          <Wrapper.FormControl
            size="small"
            sx={{ width: { xs: "100%", sm: 150 } }}
          >
            <Wrapper.InputLabel>Status</Wrapper.InputLabel>
            <Wrapper.Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <Wrapper.MenuItem value="all">All</Wrapper.MenuItem>
              <Wrapper.MenuItem value="pending">Pending</Wrapper.MenuItem>
              <Wrapper.MenuItem value="approved">Approved</Wrapper.MenuItem>
              <Wrapper.MenuItem value="rejected">Rejected</Wrapper.MenuItem>
            </Wrapper.Select>
          </Wrapper.FormControl>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setIsModalOpen(true)}
            disabled={itemsLoading || suppliersLoading}
            sx={{
              borderRadius: 2,
              px: 2,
              bgcolor: "#348d39",
              "&:hover": {
                bgcolor: "#2e7d32",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              },
              boxShadow: 2,
            }}
          >
            Add Invoice
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      <Wrapper.Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        <Wrapper.Card
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
            borderLeft: "4px solid",
            borderColor: "#10b981",
          }}
        >
          <Wrapper.CardContent sx={{ p: 3 }}>
            <Wrapper.Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
            >
              Total Invoices
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {totalInvoices}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={400} />
        </Wrapper.Box>
      ) : invoices.length === 0 ? (
        <Wrapper.Card
          sx={{
            p: 6,
            borderRadius: 2,
            textAlign: "center",
            bgcolor: Wrapper.alpha(theme.palette.background.paper, 0.7),
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Wrapper.InventoryIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Wrapper.Typography variant="h5" gutterBottom>
            No invoices found
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Create a new purchase invoice to get started
          </Wrapper.Typography>
          <Wrapper.Button
              variant="contained"
              color="success"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setIsModalOpen(true)}
            disabled={itemsLoading || suppliersLoading}
            sx={{ borderRadius: 2 }}
          >
            Create Invoice
          </Wrapper.Button>
        </Wrapper.Card>
      ) : (
        <>
          <Wrapper.TableContainer
            component={Wrapper.Paper}
            sx={{
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow
                  sx={{
                    backgroundColor: "#f8f9fa",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  {invoiceColumns.map((column) => (
                    <Wrapper.TableCell
                      key={column.key}
                      onClick={() => column.sortable && handleSort(column.key)}
                      sx={{
                        cursor: column.sortable ? "pointer" : "default",
                        fontWeight: "bold",
                        "&:hover": column.sortable
                          ? {
                              bgcolor: Wrapper.alpha(
                                theme.palette.primary.main,
                                0.05
                              ),
                            }
                          : {},
                      }}
                    >
                      <Wrapper.Box
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        {column.label}
                        {sortConfig.key === column.key &&
                          (sortConfig.direction === "asc" ? (
                            <Wrapper.ArrowUpwardIcon
                              fontSize="small"
                              sx={{ ml: 0.5, fontSize: 16 }}
                            />
                          ) : (
                            <Wrapper.ArrowDownwardIcon
                              fontSize="small"
                              sx={{ ml: 0.5, fontSize: 16 }}
                            />
                          ))}
                      </Wrapper.Box>
                    </Wrapper.TableCell>
                  ))}
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {invoices.map((row) => (
                  <Wrapper.TableRow
                    key={row._id}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.04
                        ),
                      },
                    }}
                  >
                    {invoiceColumns.map((column) => (
                      <Wrapper.TableCell key={column.key}>
                        {column.render
                          ? column.render(row)
                          : row[column.key] ?? "-"}
                      </Wrapper.TableCell>
                    ))}
                  </Wrapper.TableRow>
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
          <Wrapper.Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
          >
            <Wrapper.Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, value) => setCurrentPage(value)}
              color="primary"
            />
          </Wrapper.Box>
        </>
      )}

      <PurchaseInvoiceForm
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchInvoices={fetchInvoices}
        suppliers={suppliers}
        items={items}
        suppliersLoading={suppliersLoading}
        itemsLoading={itemsLoading}
      />

      <PrintBill
        open={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={selectedInvoice}
      />

      <Wrapper.Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Wrapper.Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </Wrapper.Box>
  );
};

export default PurchaseInvoice;

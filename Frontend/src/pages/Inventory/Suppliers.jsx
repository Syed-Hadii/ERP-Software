import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import "react-toastify/dist/ReactToastify.css";
import { BASE_URL } from "../../config/config";

const Suppliers = () => {
  const theme = Wrapper.useTheme();
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    openingBalance: "",
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const recordsPerPage = 7;

  const supplierFields = [
    {
      name: "name",
      label: "Name",
      placeholder: "Enter name",
      type: "text",
      validation: { required: true },
    },
    {
      name: "contact",
      label: "Contact",
      placeholder: "Enter contact number",
      type: "text",
      validation: { required: false },
    },
    {
      name: "email",
      label: "Email",
      placeholder: "Enter email",
      type: "email",
      validation: { required: false },
    },
    {
      name: "address",
      label: "Address",
      placeholder: "Enter address",
      type: "text",
      validation: { required: false },
      multiline: true,
      rows: 2,
    },
    {
      name: "openingBalance",
      label: "Opening Balance (PKR)",
      placeholder: "Enter opening balance",
      type: "number",
      validation: { required: true },
    },
  ];

  const supplierColumns = [
    { key: "name", label: "Name", sortable: true },
    { key: "contact", label: "Contact", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "address", label: "Address", sortable: true },
    { key: "openingBalance", label: "Opening Balance (PKR)", sortable: true },
    { key: "currentBalance", label: "Current Balance (PKR)", sortable: true },
  ];

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await Wrapper.axios.get(
        `${BASE_URL}/supplier/get?page=${currentPage}&limit=${recordsPerPage}&search=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSupplierList(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalSuppliers(response.data.totalSuppliers);
        setCurrentPage(response.data.currentPage);
      } else {
        setNotification({
          open: true,
          message: "Failed to fetch suppliers",
          severity: "error",
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || "Failed to fetch suppliers",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        openingBalance: parseFloat(formData.openingBalance) || 0,
      };
      const response = await Wrapper.axios[selectedSupplier ? "put" : "post"](
        `${BASE_URL}/supplier/${
          selectedSupplier ? `update?id=${selectedSupplier._id}` : "add"
        }`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        await fetchSupplier();
        setNotification({
          open: true,
          message:
            response.data.message ||
            (selectedSupplier ? "Supplier updated" : "Supplier added"),
          severity: "success",
        });
        setIsModalOpen(false);
        setSelectedSupplier(null);
        setFormData({
          name: "",
          contact: "",
          email: "",
          address: "",
          openingBalance: "",
        });
      } else {
        setNotification({
          open: true,
          message: response.data.message || "Operation failed",
          severity: "error",
        });
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || "Operation failed",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.delete(
        `${BASE_URL}/supplier/delete?id=${deleteId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setNotification({
          open: true,
          message: "Supplier deleted successfully",
          severity: "success",
        });
        await fetchSupplier();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || "Failed to delete supplier",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setFormData(
      supplier
        ? {
            name: supplier.name,
            contact: supplier.contact || "",
            email: supplier.email || "",
            address: supplier.address || "",
            openingBalance: supplier.openingBalance || 0,
          }
        : { name: "", contact: "", email: "", address: "", openingBalance: "" }
    );
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
    setFormData({
      name: "",
      contact: "",
      email: "",
      address: "",
      openingBalance: "",
    });
  };

  const filteredSupplier = supplierList
    .filter((supplier) =>
      supplier.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const valueA = a[sortConfig.key] || "";
      const valueB = b[sortConfig.key] || "";
      if (
        sortConfig.key === "openingBalance" ||
        sortConfig.key === "currentBalance"
      ) {
        return sortConfig.direction === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }
      return sortConfig.direction === "asc"
        ? valueA.toString().localeCompare(valueB.toString())
        : valueB.toString().localeCompare(valueA.toString());
    });

  useEffect(() => {
    fetchSupplier();
  }, [currentPage, searchQuery]);

  return (
    <Wrapper.Box sx={{ p: 4 }}>
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
            Supplier Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Manage your organization&apos;s suppliers and their details
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
            placeholder="Search suppliers..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => handleOpenModal()}
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
            Add Supplier
          </Wrapper.Button>
        </Wrapper.Box>
      </Wrapper.Box>

      <Wrapper.Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
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
              Total Suppliers
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              {totalSuppliers}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
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
              Total Opening Balance
            </Wrapper.Typography>
            <Wrapper.Typography variant="h3" fontWeight="bold">
              PKR{" "}
              {supplierList
                .reduce((sum, s) => sum + (s.openingBalance || 0), 0)
                .toLocaleString()}
            </Wrapper.Typography>
          </Wrapper.CardContent>
        </Wrapper.Card>
      </Wrapper.Box>

      {loading ? (
        <Wrapper.Box sx={{ width: "100%" }}>
          <Wrapper.Skeleton variant="rectangular" height={50} />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="text" />
        </Wrapper.Box>
      ) : filteredSupplier.length === 0 ? (
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
          <Wrapper.PersonOutlineIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Wrapper.Typography variant="h5" gutterBottom>
            No suppliers found
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Add your first supplier to get started
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{ borderRadius: 2 }}
          >
            Add Supplier
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
                  {supplierColumns.map((column) => (
                    <Wrapper.TableCell
                      key={column.key}
                      onClick={
                        column.sortable ? () => handleSort(column.key) : null
                      }
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
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredSupplier.map((supplier) => (
                  <Wrapper.TableRow
                    key={supplier._id}
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
                    <Wrapper.TableCell>{supplier.name}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {supplier.contact || "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {supplier.email || "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {supplier.address || "-"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      PKR {(supplier.openingBalance || 0).toLocaleString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      PKR {(supplier.currentBalance || 0).toLocaleString()}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit supplier">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => handleOpenModal(supplier)}
                            sx={{
                              color: "#FBC02D",
                              "&:hover": {
                                bgcolor: Wrapper.alpha(
                                  theme.palette.info.main,
                                  0.1
                                ),
                              },
                            }}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete supplier">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => {
                              setOpenDelete(true);
                              setDeleteId(supplier._id);
                            }}
                            sx={{
                              color: "error.main",
                              "&:hover": {
                                bgcolor: Wrapper.alpha(
                                  theme.palette.error.main,
                                  0.1
                                ),
                              },
                            }}
                          >
                            <Wrapper.DeleteIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                      </Wrapper.Box>
                    </Wrapper.TableCell>
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
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
            />
          </Wrapper.Box>
        </>
      )}

      <ReusableModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSave}
        title={selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
        fields={supplierFields}
        initialData={formData}
        values={formData}
        onFieldChange={(name, value) =>
          setFormData((prev) => ({ ...prev, [name]: value }))
        }
        submitButtonText={selectedSupplier ? "Update" : "Add"}
        loading={loading}
      />

      <Wrapper.Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24,
            maxWidth: "400px",
            width: "100%",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ pb: 1 }}>
          Confirm Deletion
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Wrapper.Alert>
          <Wrapper.Typography variant="body1">
            Are you sure you want to delete this supplier?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() => setOpenDelete(false)}
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={deleteSupplier}
            sx={{ borderRadius: 1 }}
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      <Wrapper.Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Wrapper.Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </Wrapper.Box>
  );
};

export default Suppliers;

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../utils/wrapper";
import DeleteModal from "./DeleteModal";
import { BASE_URL } from "../config/config";
import { VoucherTableRow } from "./SharedComponents";

const VoucherList = ({ title, voucherType, createLink }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editableVoucher, setEditableVoucher] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [vouchers, setVouchers] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    return parseFloat(value).toLocaleString("en-US");
  };

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const isJournal = voucherType === "Journal";
      const endpoint = isJournal
        ? "/journalvoucher/get"
        : "/transactionEntry/get";
      const queryParams = isJournal
        ? `page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(
            debouncedSearchTerm
          )}`
        : `page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(
            debouncedSearchTerm
          )}&voucherType=${voucherType}${
            statusFilter ? `&status=${statusFilter}` : ""
          }`;

      const response = await Wrapper.axios.get(
        `${BASE_URL}${endpoint}?${queryParams}`
      );
      if (response.data.success) {
        setVouchers(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || 1);
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to fetch vouchers."
        );
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      Wrapper.toast.error(
        error.response?.data?.message || "Failed to fetch vouchers."
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchTerm, voucherType, statusFilter]);

  // Filter vouchers locally for instant UI updates
  useEffect(() => {
    const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
    const filtered = vouchers.filter((voucher) =>
      voucherType === "Journal"
        ? [voucher.reference, voucher.description].some((field) =>
            String(field || "")
              .toLowerCase()
              .includes(lowerCaseSearch)
          )
        : [voucher.voucherNumber, voucher.party, voucher.reference].some(
            (field) =>
              String(field || "")
                .toLowerCase()
                .includes(lowerCaseSearch)
          )
    );
    setFilteredVouchers(filtered);
  }, [vouchers, debouncedSearchTerm, voucherType]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleEditClick = (voucher) => {
    setEditingId(voucher._id);
    setEditableVoucher({
      date: voucher.date,
      reference: voucher.reference || "",
      description: voucher.description || "",
      ...(voucherType !== "Journal" && { status: voucher.status }),
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditableVoucher((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (
      voucherType !== "Journal" &&
      editableVoucher.status === "Draft" &&
      vouchers.find((v) => v._id === editingId)?.status === "Posted"
    ) {
      Wrapper.toast.error(
        "Cannot change Posted voucher to Draft. Please reverse journal entries."
      );
      return;
    }
    if (
      voucherType !== "Journal" &&
      editableVoucher.status !== "Void" &&
      vouchers.find((v) => v._id === editingId)?.status === "Void"
    ) {
      Wrapper.toast.error("Cannot change Void voucher to another status.");
      return;
    }

    setLoading(true);
    try {
      const isJournal = voucherType === "Journal";
      const endpoint = isJournal
        ? "/journalvoucher/update"
        : "/transactionEntry/update";
      const payload = isJournal
        ? {
            voucherId: editingId,
            date: editableVoucher.date,
            reference: editableVoucher.reference,
            description: editableVoucher.description,
          }
        : {
            voucherId: editingId,
            reference: editableVoucher.reference,
            status: editableVoucher.status,
          };

      const response = await Wrapper.axios.put(
        `${BASE_URL}${endpoint}`,
        payload
      );
      if (response.data.success) {
        Wrapper.toast.success("Voucher updated successfully!");
        fetchVouchers();
        setEditingId(null);
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to update voucher."
        );
      }
    } catch (error) {
      console.error("Error updating voucher:", error);
      Wrapper.toast.error(
        error.response?.data?.message?.includes("Insufficient")
          ? error.response?.data?.message
          : error.response?.data?.message || "Failed to update voucher."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditableVoucher({});
  };

  const handleDeleteClick = (id) => {
    setOpenDelete(true);
    setDeleteId(id);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const isJournal = voucherType === "Journal";
      const endpoint = isJournal
        ? "/journalvoucher/delete"
        : "/transactionEntry/delete";
      const response = await Wrapper.axios.delete(`${BASE_URL}${endpoint}`, {
        data: { voucherId: deleteId },
      });
      if (response.data.success) {
        Wrapper.toast.success("Voucher deleted successfully!");
        fetchVouchers();
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to delete voucher."
        );
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      Wrapper.toast.error(
        error.response?.data?.message || "Failed to delete voucher."
      );
    } finally {
      setLoading(false);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  const handlePageChange = (event, value) => {
    if (value > 0 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Wrapper.Box sx={{ p: 4, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Wrapper.Box>
          <Wrapper.Typography
            variant="h4"
            sx={{ fontWeight: 600, color: "#2c3e50" }}
          >
            {title}
          </Wrapper.Typography>
          <Wrapper.Breadcrumbs sx={{ mt: 1 }}>
            <Wrapper.Link
              component={Wrapper.NavLink}
              to="/finance-dashboard"
              color="inherit"
            >
              Dashboard
            </Wrapper.Link>
            <Wrapper.Typography color="text.primary">
              {title}
            </Wrapper.Typography>
          </Wrapper.Breadcrumbs>
        </Wrapper.Box>
        <Wrapper.NavLink to={createLink}>
          <Wrapper.Button
            variant="contained"
            color="primary"
            startIcon={<Wrapper.AddIcon />}
            sx={{
              bgcolor: "#2c3e50",
              "&:hover": { bgcolor: "#1a252f" },
              textTransform: "none",
            }}
          >
            Create Voucher
          </Wrapper.Button>
        </Wrapper.NavLink>
      </Wrapper.Box>

      {/* Search and Filters */}
      <Wrapper.Paper
        sx={{ p: 3, mb: 4, borderRadius: "8px", border: "1px solid #e0e0e0" }}
      >
        <Wrapper.Grid container spacing={2}>
          <Wrapper.Grid item xs={12} md={voucherType === "Journal" ? 9 : 6}>
            <Wrapper.TextField
              fullWidth
              label="Search Vouchers"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                voucherType === "Journal"
                  ? "Search by reference or description..."
                  : "Search by voucher number, party, or reference..."
              }
              InputProps={{
                endAdornment: <Wrapper.SearchIcon />,
              }}
            />
          </Wrapper.Grid>
          {voucherType !== "Journal" && (
            <Wrapper.Grid item xs={12} md={3}>
              <Wrapper.FormControl fullWidth variant="outlined" size="small">
                <Wrapper.InputLabel>Status</Wrapper.InputLabel>
                <Wrapper.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Draft">Draft</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Posted">Posted</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Void">Void</Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
          )}
          <Wrapper.Grid item xs={12} md={3}>
            <Wrapper.FormControl fullWidth variant="outlined" size="small">
              <Wrapper.InputLabel>Rows per page</Wrapper.InputLabel>
              <Wrapper.Select
                value={pageSize}
                onChange={handlePageSizeChange}
                label="Rows per page"
              >
                <Wrapper.MenuItem value={5}>5</Wrapper.MenuItem>
                <Wrapper.MenuItem value={10}>10</Wrapper.MenuItem>
                <Wrapper.MenuItem value={20}>20</Wrapper.MenuItem>
              </Wrapper.Select>
            </Wrapper.FormControl>
          </Wrapper.Grid>
        </Wrapper.Grid>
      </Wrapper.Paper>

      {/* Table */}
      {loading ? (
        <Wrapper.Box sx={{ spaceY: 2 }}>
          {[...Array(pageSize)].map((_, i) => (
            <Wrapper.Skeleton
              key={i}
              variant="rectangular"
              height={50}
              sx={{ mb: 1 }}
            />
          ))}
        </Wrapper.Box>
      ) : filteredVouchers.length === 0 ? (
        <Wrapper.Box sx={{ textAlign: "center", py: 4 }}>
          <Wrapper.Typography color="textSecondary">
            No vouchers found.
          </Wrapper.Typography>
        </Wrapper.Box>
      ) : (
        <>
          <Wrapper.TableContainer
            component={Wrapper.Paper}
            sx={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
          >
            <Wrapper.Table sx={{ minWidth: 650 }}>
              <Wrapper.TableHead>
                <Wrapper.TableRow sx={{ bgcolor: "#f8f9fa" }}>
                  <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                    {voucherType === "Journal" ? "ID" : "Voucher Number"}
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                    Date
                  </Wrapper.TableCell>
                  {voucherType !== "Journal" && (
                    <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                      Party
                    </Wrapper.TableCell>
                  )}
                  <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                    {voucherType === "Journal" ? "Total Debit" : "Total Amount"}
                  </Wrapper.TableCell>
                  {voucherType !== "Journal" && (
                    <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                      Payment Method
                    </Wrapper.TableCell>
                  )}
                  <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                    Reference
                  </Wrapper.TableCell>
                  {voucherType === "Journal" && (
                    <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                      Description
                    </Wrapper.TableCell>
                  )}
                  {voucherType !== "Journal" && (
                    <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                      Status
                    </Wrapper.TableCell>
                  )}
                  <Wrapper.TableCell sx={{ fontWeight: 600 }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredVouchers.map((voucher) => (
                  <VoucherTableRow
                    key={voucher._id}
                    voucher={voucher}
                    editingId={editingId}
                    editableVoucher={editableVoucher}
                    onEditClick={handleEditClick}
                    onEditChange={handleEditChange}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    onDelete={handleDeleteClick}
                    onExpand={handleExpand}
                    expandedId={expandedId}
                    formatNumber={formatNumber}
                    voucherType={voucherType}
                  />
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
          <Wrapper.Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 3,
            }}
          >
            <Wrapper.Typography variant="body2" color="textSecondary">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredVouchers.length)} of{" "}
              {filteredVouchers.length} vouchers
            </Wrapper.Typography>
            <Wrapper.Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Wrapper.Box>
        </>
      )}

      {/* Delete Modal */}
      <DeleteModal
        open={openDelete}
        handleClose={() => setOpenDelete(false)}
        handleDelete={handleDelete}
        message="Are you sure you want to delete this voucher? This action cannot be undone."
      />
    </Wrapper.Box>
  );
};

export default VoucherList;

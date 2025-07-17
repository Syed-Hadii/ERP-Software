import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../utils/wrapper";
import DeleteModal from "./DeleteModal";
import { BASE_URL } from "../config/config";
import { VoucherTableRow } from "./SharedComponents";
import PrintVoucher from "./PrintVoucher";
import VoucherDetailsModal from "./Modals/VoucherDetailsModal";

const VoucherList = ({ title, voucherType, createLink, isBatch = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVoucherDetails, setSelectedVoucherDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("");
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [vouchers, setVouchers] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [id, setId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const formatNumber = (value) => {
    if (!value && value !== 0) return "0";
    return parseFloat(value).toLocaleString("en-US");
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isBatch ? "/batch-entry" : "/transaction-entry/get";
      const queryParams = `page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(
        debouncedSearchTerm
      )}${voucherTypeFilter ? `&voucherType=${voucherTypeFilter}` : ""}${
        statusFilter ? `&status=${statusFilter}` : ""
      }${isBatch ? "" : "&isBatch=false"}`;

      console.log("Fetching vouchers with query:", queryParams); // Debug query

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
  }, [
    currentPage,
    pageSize,
    debouncedSearchTerm,
    voucherTypeFilter,
    statusFilter,
    isBatch,
  ]);

  useEffect(() => {
    const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
    const filtered = vouchers.filter((voucher) =>
      isBatch
        ? [voucher.voucherNumber, voucher.reference, voucher.description].some(
            (field) =>
              String(field || "")
                .toLowerCase()
                .includes(lowerCaseSearch)
          )
        : [
            voucher.voucherNumber,
            voucher.party,
            voucher.reference,
            voucher.description,
          ].some((field) =>
            String(field || "")
              .toLowerCase()
              .includes(lowerCaseSearch)
          )
    );
    setFilteredVouchers(filtered);
  }, [vouchers, debouncedSearchTerm, isBatch]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleStatusUpdate = async (voucherId, newStatus) => {
    setLoading(true);
    try {
      const endpoint = isBatch ? "/batch-entry" : "/transaction-entry/update";

      const response = await Wrapper.axios.put(
        `${BASE_URL}${endpoint}/${voucherId}`,
        {
          voucherId,
          status: newStatus,
        }
      );

      if (response.data.success) {
        Wrapper.toast.success("Status updated successfully!");
        setVouchers((prev) =>
          prev.map((v) =>
            v._id === voucherId ? { ...v, status: newStatus } : v
          )
        );
      } else {
        Wrapper.toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Wrapper.toast.error(
        error.response?.data?.message || "Failed to update status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const endpoint = isBatch ? `/batch-entry` : `/transaction-entry/delete`;
      const response = await Wrapper.axios.delete(
        `${BASE_URL}${endpoint}/${id}`
      );
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
      setId(null);
    }
  };

  const handlePrintClick = (voucher) => {
    setSelectedVoucher(voucher);
    setPrintOpen(true);
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

  const handleViewClick = (voucher) => {
    setSelectedVoucherDetails(voucher);
    setViewModalOpen(true);
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
            color="success"
            startIcon={<Wrapper.AddIcon />}
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
          <Wrapper.Grid item xs={12} md={isBatch ? 6 : 6}>
            <Wrapper.TextField
              fullWidth
              label="Search Vouchers"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isBatch
                  ? "Search by voucher number, reference, or description..."
                  : "Search by voucher number, party, reference, or description..."
              }
              InputProps={{
                endAdornment: <Wrapper.SearchIcon />,
              }}
            />
          </Wrapper.Grid>
          <Wrapper.Grid item xs={12} md={3}>
            <Wrapper.FormControl fullWidth variant="outlined" size="small">
              <Wrapper.InputLabel>Voucher Type</Wrapper.InputLabel>
              <Wrapper.Select
                value={voucherTypeFilter}
                onChange={(e) => setVoucherTypeFilter(e.target.value)}
                label="Voucher Type"
              >
                <Wrapper.MenuItem value="">All</Wrapper.MenuItem>
                <Wrapper.MenuItem value="Payment">Payment</Wrapper.MenuItem>
                <Wrapper.MenuItem value="Receipt">Receipt</Wrapper.MenuItem>
              </Wrapper.Select>
            </Wrapper.FormControl>
          </Wrapper.Grid>
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
              </Wrapper.Select>
            </Wrapper.FormControl>
          </Wrapper.Grid>
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
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Voucher Number
                  </Wrapper.TableCell>
                  {!isBatch && (
                    <Wrapper.TableCell
                      sx={{ fontWeight: 600, textAlign: "center" }}
                    >
                      Date
                    </Wrapper.TableCell>
                  )}
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Voucher Type
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Total Amount
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Payment Method
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Reference
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Status
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    sx={{ fontWeight: 600, textAlign: "center" }}
                  >
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredVouchers.map((voucher) => (
                  <VoucherTableRow
                    key={voucher._id}
                    voucher={voucher}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={setId}
                    onView={handleViewClick}
                    onPrint={handlePrintClick}
                    expandedId={expandedId}
                    formatNumber={formatNumber}
                    voucherType={voucherType}
                    isBatch={isBatch}
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

      {/* PrintVoucher Component */}
      {selectedVoucher && (
        <PrintVoucher
          open={printOpen}
          onClose={() => {
            setPrintOpen(false);
            setSelectedVoucher(null);
          }}
          transaction={selectedVoucher}
          transactionType={isBatch ? selectedVoucher?.voucherType : voucherType}
        />
      )}
      {selectedVoucherDetails && (
        <VoucherDetailsModal
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          voucher={selectedVoucherDetails}
          voucherType={voucherType}
          isBatch={isBatch}
        />
      )}
    </Wrapper.Box>
  );
};

export default VoucherList;

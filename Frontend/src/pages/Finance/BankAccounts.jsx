import { useState, useEffect } from "react";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import "../../components/styles/productManage.css";
import Wrapper from "../../utils/wrapper";
import {
  AccountBalance,
  AccountBalanceWallet,
  Business,
  AttachMoney,
  Category,
} from "@mui/icons-material";
import Loading from "../../components/Loading";

const bankFields = [
  {
    name: "accountTitle",
    label: "Account Title",
    placeholder: "Enter account title",
    type: "text",
    icon: <AccountBalance fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "accountNumber",
    label: "Account Number",
    placeholder: "Enter account number",
    type: "text",
    icon: <AccountBalanceWallet fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "bankName",
    label: "Bank Name",
    placeholder: "Enter bank name (e.g., Alfalah Bank)",
    type: "text",
    icon: <Business fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "openingBalance",
    label: "Opening Balance",
    placeholder: "Enter opening balance",
    type: "number",
    icon: <AttachMoney fontSize="small" color="action" />,
    validation: { required: true },
  },
  {
    name: "chartAccountId",
    label: "Chart of Account",
    placeholder: "Select chart of account (optional)",
    type: "select",
    icon: <Category fontSize="small" color="action" />,
    validation: { required: false }, // Made optional
    options: [],
  },
];

const BankAccount = () => {
  const theme = Wrapper.useTheme();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [chartAccounts, setChartAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState({
    key: "accountTitle",
    order: "asc",
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    accountId: null,
  });
  const [multipleDeleteConfirmation, setMultipleDeleteConfirmation] = useState({
    isOpen: false,
  });
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const recordsPerPage = 7;

  const showNotification = (message, severity = "success") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  // Fetch chart accounts
  const fetchChartAccounts = async () => {
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/chartaccount/get`);
      if (response.data?.data) {
        setChartAccounts(response.data.data);
        const chartField = bankFields.find(
          (field) => field.name === "chartAccountId"
        );
        if (chartField) {
          chartField.options = [
            { value: "", label: "None (auto-create)" },
            ...response.data.data.map((account) => ({
              value: account._id,
              label: account.name,
            })),
          ];
        }
      }
    } catch (error) {
      console.error("Error fetching chart accounts:", error);
      showNotification("Failed to fetch chart accounts", "error");
    }
  };

  // Fetch bank account records
  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/bank/get?page=${currentPage}&limit=${recordsPerPage}&search=${searchQuery}`
      );
      if (response.data?.bankList) {
        setBankAccounts(response.data.bankList);
        setTotalPages(response.data.totalPages);
      } else {
        showNotification("Failed to fetch data", "error");
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      showNotification("Failed to fetch bank accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add new bank account
  const handleAddAccount = async (form) => {
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/bank/add`, {
        ...form,
        chartAccountId: form.chartAccountId || undefined, // Send undefined if empty
      });
      if (response.data.success) {
        fetchBankAccounts();
        setAddModalOpen(false);
        showNotification("Bank account added successfully!", "success");
      }
    } catch (error) {
      console.error("Error adding bank account:", error);
      showNotification(
        error.response?.data?.message || "Failed to add bank account",
        "error"
      );
    }
  };

  // Delete single bank account
  const handleDeleteAccount = async () => {
    const { accountId } = deleteConfirmation;
    if (!accountId) return;
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/bank/${accountId}`);
      showNotification("Bank account deleted successfully!", "success");
      setDeleteConfirmation({ isOpen: false, accountId: null });
      fetchBankAccounts();
    } catch (error) {
      console.error("Error deleting bank account:", error);
      showNotification(
        error.response?.data?.message || "Error deleting bank account",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete multiple bank accounts
  const handleConfirmMultipleDelete = async () => {
    setLoading(true);
    try {
      await Wrapper.axios.delete(`${BASE_URL}/bank/delete`, {
        data: { ids: selectedAccounts },
      });
      setSelectedAccounts([]);
      fetchBankAccounts();
      showNotification(
        `${selectedAccounts.length} bank accounts deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting bank accounts:", error);
      showNotification(
        error.response?.data?.message ||
          "Failed to delete selected bank accounts",
        "error"
      );
    } finally {
      setMultipleDeleteConfirmation({ isOpen: false });
      setLoading(false);
    }
  };

  // Update bank account
  const handleUpdateAccount = async (form) => {
    try {
      const response = await Wrapper.axios.put(`${BASE_URL}/bank/update`, {
        id: selectedAccount._id,
        ...form,
        chartAccountId: form.chartAccountId || undefined,
      });
      if (response.data.success) {
        setEditModalOpen(false);
        fetchBankAccounts();
        showNotification("Bank account updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating bank account:", error);
      showNotification(
        error.response?.data?.message || "Failed to update bank account",
        "error"
      );
    }
  };

  // Handle edit button click
  const handleEditClick = (account) => {
    setSelectedAccount({
      ...account,
      chartAccountId:
        account.chartAccountId?._id || account.chartAccountId || "",
    });
    setEditModalOpen(true);
  };

  // Handle sorting
  const handleSort = (key) => {
    setSortOrder((prevSortOrder) => ({
      key,
      order:
        prevSortOrder.key === key && prevSortOrder.order === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Handle account selection
  const handleSelectAccount = (id) => {
    setSelectedAccounts((prev) =>
      prev.includes(id)
        ? prev.filter((accountId) => accountId !== id)
        : [...prev, id]
    );
  };

  // Handle select all accounts
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAccounts(filteredAccounts.map((account) => account._id));
    } else {
      setSelectedAccounts([]);
    }
  };

  // Filter and sort bank accounts
  const filteredAccounts = bankAccounts
    .filter((account) =>
      account.accountTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder.key) {
        if (sortOrder.key === "chartAccountId") {
          const aName = a.chartAccountId?.name || "";
          const bName = b.chartAccountId?.name || "";
          return sortOrder.order === "asc"
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        }
        return sortOrder.order === "asc"
          ? a[sortOrder.key] > b[sortOrder.key]
            ? 1
            : -1
          : a[sortOrder.key] < b[sortOrder.key]
          ? 1
          : -1;
      }
      return 0;
    });

  // Fetch records on page or search change
  useEffect(() => {
    fetchChartAccounts();
    fetchBankAccounts();
  }, [currentPage, searchQuery]);

  if (loading && bankAccounts.length === 0) {
    return (
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Loading />
      </Wrapper.Box>
    );
  }

  return (
    <Wrapper.Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "1600px",
        mx: "auto",
        bgcolor: "#f3f4f6",
      }}
    >
      {/* Header Section */}
      <Wrapper.Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
        }}
      >
        <Wrapper.Grid container spacing={2} alignItems="center">
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#111827",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Wrapper.AccountBalanceIcon
                sx={{ mr: 1, color: "#4b5563", fontSize: "1.75rem" }}
              />
              Bank Account Management
            </Wrapper.Typography>
            <Wrapper.Typography
              variant="body2"
              sx={{ mt: 0.5, color: "#6b7280" }}
            >
              Manage your bank accounts and link them to the chart of accounts
            </Wrapper.Typography>
          </Wrapper.Grid>
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Wrapper.TextField
                placeholder="Search accounts..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  minWidth: { xs: "100%", sm: 220 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                    backgroundColor: "#f9fafb",
                    "& fieldset": { borderColor: "#d1d5db" },
                    "&:hover fieldset": { borderColor: "#9ca3af" },
                    "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Wrapper.InputAdornment position="start">
                      <Wrapper.SearchIcon sx={{ color: "#9ca3af" }} />
                    </Wrapper.InputAdornment>
                  ),
                }}
              />
              <Wrapper.Button
                variant="contained"
                startIcon={<Wrapper.AddIcon />}
                onClick={() => setAddModalOpen(true)}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 500,
                  backgroundColor: "#16a34a",
                  "&:hover": { backgroundColor: "#15803d" },
                  px: 2.5,
                  py: 1,
                }}
              >
                Add Account
              </Wrapper.Button>
              <Wrapper.Button
                variant="outlined"
                color="error"
                startIcon={<Wrapper.DeleteIcon />}
                onClick={() => {
                  if (selectedAccounts.length > 0) {
                    setMultipleDeleteConfirmation({ isOpen: true });
                  } else {
                    showNotification("No accounts selected", "warning");
                  }
                }}
                disabled={selectedAccounts.length === 0}
                sx={{
                  borderRadius: "6px",
                  px: 2.5,
                  py: 1,
                  borderColor: "#dc2626",
                  color: "#dc2626",
                  "&:hover": {
                    backgroundColor: Wrapper.alpha("#dc2626", 0.1),
                    borderColor: "#b91c1c",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.6,
                    borderColor: "#d1d5db",
                    color: "#6b7280",
                  },
                }}
              >
                Delete Selected
              </Wrapper.Button>
            </Wrapper.Box>
          </Wrapper.Grid>
        </Wrapper.Grid>
      </Wrapper.Paper>

      {/* Stats Cards */}
      <Wrapper.Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Wrapper.Paper
          elevation={0}
          sx={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            },
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          <Wrapper.Box sx={{ p: 3 }}>
            <Wrapper.Typography
              variant="body2"
              sx={{ color: "#6b7280", mb: 1 }}
            >
              Total Accounts
            </Wrapper.Typography>
            <Wrapper.Typography
              variant="h5"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              {bankAccounts?.length || 0}
            </Wrapper.Typography>
          </Wrapper.Box>
        </Wrapper.Paper>
        <Wrapper.Paper
          elevation={0}
          sx={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            },
            transition: "transform 0.2s, Juno 2025 box-shadow 0.2s",
          }}
        >
          <Wrapper.Box sx={{ p: 3 }}>
            <Wrapper.Typography
              variant="body2"
              sx={{ color: "#6b7280", mb: 1 }}
            >
              Selected
            </Wrapper.Typography>
            <Wrapper.Typography
              variant="h5"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              {selectedAccounts.length}
            </Wrapper.Typography>
          </Wrapper.Box>
        </Wrapper.Paper>
      </Wrapper.Box>

      {/* Accounts Table */}
      {filteredAccounts.length === 0 ? (
        <Wrapper.Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <Wrapper.AccountBalanceIcon
            sx={{ fontSize: 60, color: "#6b7280", mb: 2 }}
          />
          <Wrapper.Typography variant="h6" sx={{ color: "#111827", mb: 2 }}>
            No bank accounts found
          </Wrapper.Typography>
          <Wrapper.Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
            Add your first bank account to get started
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{
              borderRadius: "6px",
              backgroundColor: "#16a34a",
              "&:hover": { backgroundColor: "#15803d" },
            }}
          >
            Add Account
          </Wrapper.Button>
        </Wrapper.Paper>
      ) : (
        <Wrapper.Paper
          elevation={0}
          sx={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            },
            transition: "box-shadow 0.3s",
          }}
        >
          <Wrapper.Box
            sx={{
              p: 2,
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Wrapper.Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              {filteredAccounts.length}{" "}
              {filteredAccounts.length === 1 ? "Account" : "Accounts"}{" "}
              {searchQuery && `matching "${searchQuery}"`}
            </Wrapper.Typography>
            <Wrapper.Tooltip title="Filter list">
              <Wrapper.IconButton size="small">
                <Wrapper.FilterListIcon
                  fontSize="small"
                  sx={{ color: "#6b7280" }}
                />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
          </Wrapper.Box>
          <Wrapper.TableContainer
            sx={{
              maxHeight: "calc(100vh - 350px)",
              minHeight: "300px",
              "&::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#d1d5db",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f3f4f6",
              },
            }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell padding="checkbox">
                    <Wrapper.Checkbox
                      indeterminate={
                        selectedAccounts.length > 0 &&
                        selectedAccounts.length < filteredAccounts.length
                      }
                      checked={
                        filteredAccounts.length > 0 &&
                        selectedAccounts.length === filteredAccounts.length
                      }
                      onChange={handleSelectAll}
                      sx={{
                        "&.Mui-checked": {
                          color: "#16a34a",
                        },
                      }}
                    />
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("accountTitle")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "#111827",
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Account Title
                      {sortOrder.key === "accountTitle" &&
                        (sortOrder.order === "asc" ? (
                          <Wrapper.ArrowUpwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, color: "#6b7280" }}
                          />
                        ) : (
                          <Wrapper.ArrowDownwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, color: "#6b7280" }}
                          />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("accountNumber")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "#111827",
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Account Number
                      {sortOrder.key === "accountNumber" &&
                        (sortOrder.order === "asc" ? (
                          <Wrapper.ArrowUpwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, color: "#6b7280" }}
                          />
                        ) : (
                          <Wrapper.ArrowDownwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, color: "#6b7280" }}
                          />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: 600, color: "#111827" }}>
                    Bank Name
                  </Wrapper.TableCell>
                  <Wrapper.TableCell
                    onClick={() => handleSort("chartAccountId")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "#111827",
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
                      Chart of Account
                      {sortOrder.key === "chartAccountId" &&
                        (sortOrder.order === "asc" ? (
                          <Wrapper.ArrowUpwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, color: "#6b7280" }}
                          />
                        ) : (
                          <Wrapper.ArrowDownwardIcon
                            fontSize="small"
                            sx={{ ml: 0.5, color: "#6b7280" }}
                          />
                        ))}
                    </Wrapper.Box>
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: 600, color: "#111827" }}>
                    Balance
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: 600, color: "#111827" }}>
                    Actions
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {filteredAccounts.map((account) => (
                  <Wrapper.TableRow
                    key={account._id}
                    hover
                    sx={{
                      "&:hover": { backgroundColor: "#f3f4f6" },
                      ...(selectedAccounts.includes(account._id) && {
                        backgroundColor: Wrapper.alpha("#16a34a", 0.08),
                      }),
                    }}
                  >
                    <Wrapper.TableCell padding="checkbox">
                      <Wrapper.Checkbox
                        checked={selectedAccounts.includes(account._id)}
                        onChange={() => handleSelectAccount(account._id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "#16a34a",
                          },
                        }}
                      />
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {account.accountTitle}
                      </Wrapper.Typography>
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ color: "#6b7280" }}>
                      {account.accountNumber}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ color: "#6b7280" }}>
                      {account.bankName}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ color: "#6b7280" }}>
                      {account.chartAccountId?.name || "N/A"}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell
                      sx={{
                        color:
                          account.currentBalance >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      PKR {account.currentBalance?.toLocaleString() || 0}
                    </Wrapper.TableCell>
                    <Wrapper.TableCell>
                      <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                        <Wrapper.Tooltip title="Edit account">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() => handleEditClick(account)}
                            sx={{
                              color: "#3b82f6",
                              "&:hover": {
                                backgroundColor: Wrapper.alpha("#3b82f6", 0.1),
                              },
                            }}
                          >
                            <Wrapper.EditIcon fontSize="small" />
                          </Wrapper.IconButton>
                        </Wrapper.Tooltip>
                        <Wrapper.Tooltip title="Delete account">
                          <Wrapper.IconButton
                            size="small"
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                accountId: account._id,
                              })
                            }
                            sx={{
                              color: "#dc2626",
                              "&:hover": {
                                backgroundColor: Wrapper.alpha("#dc2626", 0.1),
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

          {filteredAccounts.length === 0 && (
            <Wrapper.Box sx={{ p: 4, textAlign: "center" }}>
              <Wrapper.Typography variant="body2" sx={{ color: "#6b7280" }}>
                No accounts match your search criteria
              </Wrapper.Typography>
            </Wrapper.Box>
          )}

          <Wrapper.Box
            sx={{
              p: 2,
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#f9fafb",
            }}
          >
            <Wrapper.Typography variant="body2" sx={{ color: "#6b7280" }}>
              {selectedAccounts.length > 0 ? (
                <span>
                  <b>{selectedAccounts.length}</b> accounts selected
                </span>
              ) : (
                <span>Select accounts to perform actions</span>
              )}
            </Wrapper.Typography>

            <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
              {totalPages > 1 && (
                <>
                  <Wrapper.Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    sx={{
                      borderRadius: "6px",
                      borderColor: "#d1d5db",
                      color: "#111827",
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    Previous
                  </Wrapper.Button>
                  <Wrapper.Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    sx={{
                      borderRadius: "6px",
                      borderColor: "#d1d5db",
                      color: "#111827",
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    Next
                  </Wrapper.Button>
                </>
              )}
              {selectedAccounts.length > 0 && (
                <Wrapper.Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Wrapper.DeleteIcon />}
                  onClick={() =>
                    setMultipleDeleteConfirmation({ isOpen: true })
                  }
                  sx={{
                    borderRadius: "6px",
                    borderColor: "#dc2626",
                    color: "#dc2626",
                    "&:hover": {
                      backgroundColor: Wrapper.alpha("#dc2626", 0.1),
                      borderColor: "#b91c1c",
                    },
                  }}
                >
                  Delete Selected
                </Wrapper.Button>
              )}
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.Paper>
      )}

      {/* Modals */}
      <ReusableModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddAccount}
        title="Add New Bank Account"
        fields={bankFields}
        submitButtonText="Add Account"
        submitButtonProps={{
          sx: {
            borderRadius: "6px",
            backgroundColor: "#16a34a",
            "&:hover": { backgroundColor: "#15803d" },
            "&.Mui-disabled": {
              backgroundColor: "#d1d5db",
              color: "#6b7280",
            },
          },
        }}
        cancelButtonProps={{
          sx: {
            borderRadius: "6px",
            color: "#6b7280",
            "&:hover": { backgroundColor: "#f3f4f6" },
          },
        }}
      />

      <ReusableModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateAccount}
        title="Edit Bank Account"
        fields={bankFields}
        initialData={selectedAccount}
        submitButtonText="Save Changes"
        submitButtonProps={{
          sx: {
            borderRadius: "6px",
            backgroundColor: "#16a34a",
            "&:hover": { backgroundColor: "#15803d" },
            "&.Mui-disabled": {
              backgroundColor: "#d1d5db",
              color: "#6b7280",
            },
          },
        }}
        cancelButtonProps={{
          sx: {
            borderRadius: "6px",
            color: "#6b7280",
            "&:hover": { backgroundColor: "#f3f4f6" },
          },
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, accountId: null })
        }
        PaperProps={{
          sx: {
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            maxWidth: "400px",
            width: "100%",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ pb: 1, color: "#111827" }}>
          Confirm Deletion
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Wrapper.Alert>
          <Wrapper.Typography variant="body2" sx={{ color: "#6b7280" }}>
            Are you sure you want to delete this bank account?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() =>
              setDeleteConfirmation({ isOpen: false, accountId: null })
            }
            sx={{
              borderRadius: "6px",
              color: "#6b7280",
              "&:hover": { backgroundColor: "#f3f4f6" },
            }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            sx={{
              borderRadius: "6px",
              backgroundColor: "#dc2626",
              "&:hover": { backgroundColor: "#b91c1c" },
            }}
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Multiple Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={multipleDeleteConfirmation.isOpen}
        onClose={() => setMultipleDeleteConfirmation({ isOpen: false })}
        PaperProps={{
          sx: {
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            maxWidth: "400px",
            width: "100%",
          },
        }}
      >
        <Wrapper.DialogTitle sx={{ pb: 1, color: "#111827" }}>
          Confirm Multiple Deletion
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Wrapper.Alert>
          <Wrapper.Typography variant="body2" sx={{ color: "#6b7280" }}>
            Are you sure you want to delete {selectedAccounts.length} selected
            accounts?
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
          <Wrapper.Button
            onClick={() => setMultipleDeleteConfirmation({ isOpen: false })}
            sx={{
              borderRadius: "6px",
              color: "#6b7280",
              "&:hover": { backgroundColor: "#f3f4f6" },
            }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleConfirmMultipleDelete}
            sx={{
              borderRadius: "6px",
              backgroundColor: "#dc2626",
              "&:hover": { backgroundColor: "#b91c1c" },
            }}
          >
            Delete Selected
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Notification Snackbar */}
      <Wrapper.Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Wrapper.Alert
          onClose={handleCloseNotification}
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

export default BankAccount;

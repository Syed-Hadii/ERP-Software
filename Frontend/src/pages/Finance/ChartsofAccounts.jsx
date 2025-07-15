import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import DeleteModal from "../../components/DeleteModal";
import { BASE_URL } from "../../config/config";
import { useNavigate } from "react-router-dom";

const ChartsofAccounts = () => {
  const navigate = useNavigate();
  // State Declarations
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState({});
  const [editAccountId, setEditAccountId] = useState(null);
  const [newAccount, setNewAccount] = useState({
    parentAccount: null,
    name: "",
    category: "",
    group: "",
    openingBalance: 0,
    openingDate: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [allAccounts, setAllAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteParams, setDeleteParams] = useState({ accountId: null });
  const [activeTab, setActiveTab] = useState("all");

  const groups = ["Assets", "Liabilities", "Equity", "Expense", "Income"];
  const categories = [
    "Current Asset",
    "Fixed Asset",
    "Other Asset",
    "Current Liability",
    "Long Term Liability",
    "Owner's Equity",
    "Owner's Capital",
    "Retained Earnings",
    "Owner's Drawings",
    "Sales Revenue",
    "Interest Income",
    "Other Income",
    "Operating Revenue",
    "Non-Operating Revenue",
    "Direct Expense",
    "Operating Expense",
    "Other Expense",
  ];

  // Fetch All Accounts
  const fetchAllAccount = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/chartaccount/get`);
      console.log(response);
      if (response.data.success) {
        setAllAccounts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Wrapper.toast.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Account
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        parentAccount,
        name,
        category,
        group,
        openingBalance,
        openingDate,
      } = newAccount;
      const accountData = {
        name,
        category: parentAccount
          ? allAccounts.find((acc) => acc._id === parentAccount)?.category
          : category,
        group: parentAccount
          ? allAccounts.find((acc) => acc._id === parentAccount)?.group
          : group,
        parentAccount: parentAccount || null,
        openingBalance: Number(openingBalance) || 0,
        openingDate: openingDate || null,
      };
      await Wrapper.axios.post(`${BASE_URL}/chartaccount/add`, accountData);
      Wrapper.toast.success("Account created successfully!");
      handleCloseForm();
      fetchAllAccount();
    } catch (error) {
      console.error("Error adding account:", error);
      Wrapper.toast.error("Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Account
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const { name, openingBalance, openingDate } = newAccount;
      const updateData = {
        name,
        openingBalance: Number(openingBalance),
        openingDate,
      };
      await Wrapper.axios.put(
        `${BASE_URL}/chartaccount/update/${editAccountId}`,
        updateData
      );
      Wrapper.toast.success("Account updated successfully!");
      handleCloseForm();
      fetchAllAccount();
    } catch (error) {
      console.error("Error updating account:", error);
      Wrapper.toast.error("Failed to update account");
    }
  };

  // Handle Close Form
  const handleCloseForm = () => {
    setShowAddForm(false);
    setNewAccount({
      parentAccount: null,
      name: "",
      category: "",
      group: "",
      openingBalance: 0,
      openingDate: null,
    });
    setEditAccountId(null);
  };

  // Handle Delete
  const handleDelete = (accountId) => {
    setDeleteParams({ accountId });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setDeleteParams({ accountId: null });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await Wrapper.axios.delete(
        `${BASE_URL}/chartaccount/delete/${deleteParams.accountId}`
      );
      Wrapper.toast.success("Account deleted successfully!");
      fetchAllAccount();
    } catch (error) {
      console.error("Error deleting account:", error);
      Wrapper.toast.error(
        error.response?.data?.message || "Failed to delete account"
      );
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  // Toggle Expand/Collapse
  const toggleExpand = (id) => {
    setExpandedAccounts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAccount({ ...newAccount, [name]: value });
  };

  // Filter and Group Accounts
  const getFilteredAccounts = (group) => {
    return allAccounts
      .filter((account) => account.group === group)
      .filter((account) => {
        if (activeTab === "all") return true;
        if (activeTab === "debit") return account.nature === "Debit";
        if (activeTab === "credit") return account.nature === "Credit";
        return true;
      })
      .filter((account) =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  // Build Account Tree for a Group
  const buildAccountTree = (accounts) => {
    const accountMap = {};
    accounts.forEach((account) => {
      account.subAccounts = [];
      accountMap[account._id] = account;
    });

    const tree = [];
    accounts.forEach((account) => {
      if (account.parentAccount) {
        const parentId = account.parentAccount._id;
        if (accountMap[parentId]) {
          accountMap[parentId].subAccounts.push(account);
        }
      } else {
        tree.push(account);
      }
    });

    return tree;
  };

  // Render Account Tree Item
  const renderAccountTreeItem = (account, level = 0) => {
    const hasSubAccounts =
      account.subAccounts && account.subAccounts.length > 0;
    const isExpanded = expandedAccounts[account._id];

    return (
      <React.Fragment key={account._id}>
        <Wrapper.Box
          sx={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            alignItems: "center",
            pl: level * 2 + 2,
            py: 1.5,
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: level === 0 ? "#ffffff" : "#f9fafb",
            "&:hover": { backgroundColor: "#f1f5f9" },
            transition: "background-color 0.2s ease",
          }}
        >
          <Wrapper.Box sx={{ display: "flex", alignItems: "center" }}>
            {hasSubAccounts ? (
              <Wrapper.IconButton
                size="small"
                onClick={() => toggleExpand(account._id)}
                sx={{ mr: 1, color: "#6b7280" }}
              >
                {isExpanded ? (
                  <Wrapper.KeyboardArrowDownIcon fontSize="small" />
                ) : (
                  <Wrapper.KeyboardArrowRightIcon fontSize="small" />
                )}
              </Wrapper.IconButton>
            ) : (
              <Wrapper.Box sx={{ width: 28, mr: 1 }} />
            )}
            <Wrapper.Typography
              sx={{
                fontWeight: level === 0 ? 600 : 400,
                color: level === 0 ? "#111827" : "#4b5563",
                fontSize: "0.875rem",
              }}
            >
              {account.name}
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {account.category}
          </Wrapper.Typography>
          <Wrapper.Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {account.nature}
          </Wrapper.Typography>
          <Wrapper.Typography
            sx={{
              fontSize: "0.875rem",
              color: account.currentBalance >= 0 ? "#15803d" : "#dc2626",
            }}
          >
            PKR {account.currentBalance?.toLocaleString() || 0}
          </Wrapper.Typography>
          <Wrapper.Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Wrapper.Tooltip title="View Ledger">
              <Wrapper.IconButton
                size="small"
                sx={{ color: "#3b82f6" }}
                onClick={() => navigate(`/coa-ledger/${account._id}`)}
              >
                <Wrapper.VisibilityIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
            <Wrapper.Tooltip title="Edit Account">
              <Wrapper.IconButton
                size="small"
                sx={{ color: "#3b82f6" }}
                onClick={() => {
                  setEditAccountId(account._id);
                  setNewAccount({
                    name: account.name,
                    category: account.category,
                    group: account.group,
                    parentAccount: account.parentAccount
                      ? account.parentAccount._id
                      : null,
                    openingBalance: account.openingBalance,
                    openingDate: account.openingDate
                      ? account.openingDate.split("T")[0]
                      : null,
                  });
                  setShowAddForm(true);
                }}
              >
                <Wrapper.EditIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
            <Wrapper.Tooltip title="Delete Account">
              <Wrapper.IconButton
                size="small"
                sx={{ color: "#ef4444" }}
                onClick={() => handleDelete(account._id)}
              >
                <Wrapper.DeleteIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
            <Wrapper.Tooltip title="Add Sub-Account">
              <Wrapper.IconButton
                size="small"
                sx={{ color: "#16a34a" }}
                onClick={() => {
                  setNewAccount({
                    parentAccount: account._id,
                    group: account.group,
                    category: account.category,
                  });
                  setShowAddForm(true);
                }}
              >
                <Wrapper.AddCircleOutlineIcon fontSize="small" />
              </Wrapper.IconButton>
            </Wrapper.Tooltip>
          </Wrapper.Box>
        </Wrapper.Box>

        {hasSubAccounts && isExpanded && (
          <Wrapper.Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Wrapper.Box>
              {account.subAccounts.map((subAccount) =>
                renderAccountTreeItem(subAccount, level + 1)
              )}
            </Wrapper.Box>
          </Wrapper.Collapse>
        )}
      </React.Fragment>
    );
  };

  // Fetch Data on Mount
  useEffect(() => {
    fetchAllAccount();
  }, []);

  return (
    <Wrapper.Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
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
              Chart of Accounts
            </Wrapper.Typography>
            <Wrapper.Typography
              variant="body2"
              sx={{ mt: 0.5, color: "#6b7280" }}
            >
              Manage your financial accounts efficiently
            </Wrapper.Typography>
          </Wrapper.Grid>
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                gap: 2,
              }}
            >
              <Wrapper.Button
                variant="contained"
                startIcon={<Wrapper.AddIcon />}
                onClick={() => setShowAddForm(true)}
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
            </Wrapper.Box>
          </Wrapper.Grid>
        </Wrapper.Grid>
      </Wrapper.Paper>

      {/* Filters */}
      <Wrapper.Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
        }}
      >
        <Wrapper.Grid container spacing={2} alignItems="center">
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.TextField
              fullWidth
              placeholder="Search accounts..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Wrapper.InputAdornment position="start">
                    <Wrapper.SearchIcon sx={{ color: "#9ca3af" }} />
                  </Wrapper.InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                  backgroundColor: "#f9fafb",
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                },
              }}
            />
          </Wrapper.Grid>
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Wrapper.Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 500,
                    color: "#6b7280",
                    "&.Mui-selected": { color: "#16a34a" },
                  },
                  "& .MuiTabs-indicator": { backgroundColor: "#16a34a" },
                }}
              >
                <Wrapper.Tab label="All Accounts" value="all" />
                <Wrapper.Tab label="Debit" value="debit" />
                <Wrapper.Tab label="Credit" value="credit" />
              </Wrapper.Tabs>
            </Wrapper.Box>
          </Wrapper.Grid>
        </Wrapper.Grid>
      </Wrapper.Paper>

      {/* Grouped Account Sections */}
      {loading ? (
        <Wrapper.Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <Wrapper.Skeleton
              key={i}
              variant="rectangular"
              height={40}
              sx={{ mb: 1, borderRadius: "6px" }}
            />
          ))}
        </Wrapper.Paper>
      ) : (
        <Wrapper.Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {groups.map((group) => {
            const groupAccounts = getFilteredAccounts(group);
            const groupTree = buildAccountTree(groupAccounts);
            if (groupAccounts.length === 0) return null;

            return (
              <Wrapper.Paper
                key={group}
                elevation={0}
                sx={{
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
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
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Wrapper.CategoryIcon
                      sx={{ mr: 1, color: "#16a34a", fontSize: "1.25rem" }}
                    />
                    {group}
                  </Wrapper.Typography>
                  <Wrapper.Chip
                    label={
                      group === "Assets" || group === "Expense"
                        ? "Debit"
                        : "Credit"
                    }
                    size="small"
                    sx={{
                      backgroundColor:
                        group === "Assets" || group === "Expense"
                          ? "#ecfdf5"
                          : "#fef2f2",
                      color:
                        group === "Assets" || group === "Expense"
                          ? "#16a34a"
                          : "#dc2626",
                      fontWeight: 500,
                    }}
                  />
                </Wrapper.Box>
                <Wrapper.Box sx={{ p: 1 }}>
                  <Wrapper.Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                      p: 1,
                      backgroundColor: "#f3f4f6",
                      fontWeight: 600,
                      color: "#4b5563",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <Wrapper.Typography>Account Name</Wrapper.Typography>
                    <Wrapper.Typography>Category</Wrapper.Typography>
                    <Wrapper.Typography>Nature</Wrapper.Typography>
                    <Wrapper.Typography>Balance</Wrapper.Typography>
                    <Wrapper.Typography sx={{ textAlign: "right" }}>
                      Actions
                    </Wrapper.Typography>
                  </Wrapper.Box>
                  {groupTree.length > 0 ? (
                    groupTree.map((account) => renderAccountTreeItem(account))
                  ) : (
                    <Wrapper.Typography
                      sx={{ color: "#6b7280", textAlign: "center", py: 2 }}
                    >
                      No accounts found
                    </Wrapper.Typography>
                  )}
                </Wrapper.Box>
              </Wrapper.Paper>
            );
          })}
        </Wrapper.Box>
      )}

      {/* Add/Edit Account Dialog */}
      <Wrapper.Dialog
        open={showAddForm}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "8px", border: "1px solid #e5e7eb" },
        }}
      >
        <Wrapper.DialogTitle
          sx={{
            borderBottom: "1px solid #e5e7eb",
            px: 3,
            py: 2,
            backgroundColor: "#f9fafb",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {editAccountId
            ? "Edit Account"
            : newAccount.parentAccount
            ? "Add Sub-Account"
            : "Add New Account"}
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent sx={{ p: 3 }}>
          <Wrapper.Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            {!editAccountId && (
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel id="parent-account-label">
                  Parent Account
                </Wrapper.InputLabel>
                <Wrapper.Select
                  labelId="parent-account-label"
                  name="parentAccount"
                  value={newAccount.parentAccount || ""}
                  onChange={(e) => {
                    const parentId = e.target.value || null;
                    const parent = allAccounts.find(
                      (acc) => acc._id === parentId
                    );
                    setNewAccount({
                      ...newAccount,
                      parentAccount: parentId,
                      group: parent ? parent.group : "",
                      category: parent ? parent.category : "",
                    });
                  }}
                  label="Parent Account"
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#9ca3af",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#16a34a",
                    },
                  }}
                >
                  <Wrapper.MenuItem value="">
                    <em>Create as Main Account</em>
                  </Wrapper.MenuItem>
                  {allAccounts.map((account) => (
                    <Wrapper.MenuItem key={account._id} value={account._id}>
                      {account.name}
                    </Wrapper.MenuItem>
                  ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            )}

            {!newAccount.parentAccount && (
              <>
                <Wrapper.FormControl fullWidth>
                  <Wrapper.InputLabel id="group-label">
                    Group
                  </Wrapper.InputLabel>
                  <Wrapper.Select
                    labelId="group-label"
                    name="group"
                    value={newAccount.group}
                    onChange={handleChange}
                    label="Group"
                    disabled={
                      newAccount.parentAccount ||
                      (editAccountId &&
                        allAccounts.find((acc) => acc._id === editAccountId)
                          ?.parentAccount)
                    }
                    required={!newAccount.parentAccount}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#9ca3af",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#16a34a",
                      },
                    }}
                  >
                    {groups.map((group) => (
                      <Wrapper.MenuItem key={group} value={group}>
                        {group}
                      </Wrapper.MenuItem>
                    ))}
                  </Wrapper.Select>
                </Wrapper.FormControl>
                <Wrapper.FormControl fullWidth>
                  <Wrapper.InputLabel id="category-label">
                    Category
                  </Wrapper.InputLabel>
                  <Wrapper.Select
                    labelId="category-label"
                    name="category"
                    value={newAccount.category}
                    onChange={handleChange}
                    label="Category"
                    disabled={
                      newAccount.parentAccount ||
                      (editAccountId &&
                        allAccounts.find((acc) => acc._id === editAccountId)
                          ?.parentAccount)
                    }
                    required={!newAccount.parentAccount}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#9ca3af",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#16a34a",
                      },
                    }}
                  >
                    {categories
                      .filter((category) => {
                        if (!newAccount.group) return true;
                        const groupCategories = {
                          Assets: [
                            "Current Asset",
                            "Fixed Asset",
                            "Other Asset",
                          ],
                          Liabilities: [
                            "Current Liability",
                            "Long Term Liability",
                          ],
                          Equity: [
                            "Owner's Equity",
                            "Owner's Capital",
                            "Retained Earnings",
                            "Owner's Drawings",
                          ],
                          Income: [
                            "Sales Revenue",
                            "Interest Income",
                            "Other Income",
                            "Operating Revenue",
                            "Non-Operating Revenue",
                          ],
                          Expense: [
                            "Direct Expense",
                            "Operating Expense",
                            "Other Expense",
                          ],
                        };
                        return groupCategories[newAccount.group]?.includes(
                          category
                        );
                      })
                      .map((category) => (
                        <Wrapper.MenuItem key={category} value={category}>
                          {category}
                        </Wrapper.MenuItem>
                      ))}
                  </Wrapper.Select>
                </Wrapper.FormControl>
              </>
            )}

            <Wrapper.TextField
              label="Account Name"
              name="name"
              value={newAccount.name}
              onChange={handleChange}
              fullWidth
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                },
              }}
            />

            <Wrapper.TextField
              label="Opening Balance"
              name="openingBalance"
              type="number"
              value={newAccount.openingBalance}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <Wrapper.InputAdornment position="start">
                    PKR
                  </Wrapper.InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                },
              }}
            />
            <Wrapper.TextField
              label="Opening Date"
              name="openingDate"
              type="date"
              value={newAccount.openingDate || ""}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "#9ca3af" },
                  "&.Mui-focused fieldset": { borderColor: "#16a34a" },
                },
              }}
            />
          </Wrapper.Box>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid #e5e7eb" }}
        >
          <Wrapper.Button
            onClick={handleCloseForm}
            sx={{
              color: "#6b7280",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#f3f4f6" },
            }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            onClick={editAccountId ? handleEdit : handleAdd}
            variant="contained"
            disabled={
              !newAccount.name ||
              (!newAccount.parentAccount &&
                !editAccountId &&
                (!newAccount.group || !newAccount.category)) ||
              loading
            }
            sx={{
              backgroundColor: "#16a34a",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#15803d" },
              "&.Mui-disabled": {
                backgroundColor: loading ? "#16a34a" : "#d1d5db", // Keep green background when loading
                color: "#6b7280",
              },
            }}
          >
            {loading ? (
              <Wrapper.Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "white",
                }}
              >
                <Wrapper.CircularProgress size={20} color="white" />
                Submitting...
              </Wrapper.Box>
            ) : editAccountId ? (
              "Save Changes"
            ) : (
              "Save Account"
            )}
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Delete Modal */}
      <DeleteModal
        open={open}
        handleClose={handleClose}
        loading={loading}
        handleDelete={confirmDelete}
        message="Are you sure you want to delete this account? This action cannot be undone."
      />
    </Wrapper.Box>
  );
};

export default ChartsofAccounts;

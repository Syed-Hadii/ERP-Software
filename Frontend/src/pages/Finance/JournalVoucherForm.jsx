import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import logo from "../../assets/logo-light.png";
import {
  FormField,
  JournalAccountEntry,
} from "../../components/SharedComponents";

const JournalEntryForm = () => {
  const navigate = useNavigate();
  const printRef = useRef();
  const [accountList, setAccountList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [voucherDetails, setDetails] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    accounts: [
      { accountId: "", debitAmount: "", creditAmount: "" }, // Changed to accountId
      { accountId: "", debitAmount: "", creditAmount: "" },
    ],
  });
  const [inputValues, setInputValues] = useState({
    debitAmounts: ["", ""],
    creditAmounts: ["", ""],
  });
  const [errors, setErrors] = useState({});

  const formatNumber = (value) => {
    const numeric = String(value).replace(/[^0-9]/g, "");
    if (!numeric) return "";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      parseInt(numeric, 10)
    );
  };

  const parseNumber = (value) => {
    const numeric = value.replace(/,/g, "");
    return parseFloat(numeric) || 0;
  };

  const fetchAccounts = async () => {
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/chartaccount/get`);
      if (response.data.success) {
        setAccountList(response.data.data || []);
      } else {
        Wrapper.toast.error("Failed to fetch chart accounts.");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Wrapper.toast.error("Failed to fetch chart accounts.");
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Transaction date is required.";
    const accounts = formData.accounts;
    const usedAccounts = new Set();
    let totalDebit = 0;
    let totalCredit = 0;

    accounts.forEach((acc, index) => {
      if (!acc.accountId) {
        newErrors[`account.${index}`] = "Account is required.";
      } else if (usedAccounts.has(acc.accountId)) {
        newErrors[`account.${index}`] = "Duplicate account selected.";
      } else {
        usedAccounts.add(acc.accountId);
      }
      const debit = parseNumber(acc.debitAmount);
      const credit = parseNumber(acc.creditAmount);
      if (debit && credit) {
        newErrors[`amount.${index}`] =
          "Select either debit or credit, not both.";
      } else if (!debit && !credit) {
        newErrors[`amount.${index}`] = "Debit or credit amount is required.";
      }
      totalDebit += debit;
      totalCredit += credit;
    });

    if (totalDebit !== totalCredit) {
      newErrors.balance = "Total debit and credit amounts must be equal.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (indexOrEvent, event) => {
    if (indexOrEvent.target) {
      const { name, value } = indexOrEvent.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
      return;
    }

    const index = indexOrEvent;
    const { name, value } = event.target;

    if (
      name.startsWith("accountId") ||
      name.startsWith("debitAmount") ||
      name.startsWith("creditAmount")
    ) {
      const updatedAccounts = [...formData.accounts];
      const field = name === "accountId" ? "accountId" : name;
      updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };

      const updatedInputValues = { ...inputValues };
      if (field === "debitAmount") {
        updatedInputValues.debitAmounts[index] = value;
      } else if (field === "creditAmount") {
        updatedInputValues.creditAmounts[index] = value;
      }

      setFormData({ ...formData, accounts: updatedAccounts });
      setInputValues(updatedInputValues);
    }

    setErrors({
      ...errors,
      [name]: "",
      [`account.${index}`]: "",
      [`amount.${index}`]: "",
    });
  };

  const addAccountRow = () => {
    setFormData({
      ...formData,
      accounts: [
        ...formData.accounts,
        { accountId: "", debitAmount: "", creditAmount: "" },
      ],
    });
    setInputValues({
      debitAmounts: [...inputValues.debitAmounts, ""],
      creditAmounts: [...inputValues.creditAmounts, ""],
    });
  };

  const removeAccountRow = (index) => {
    if (formData.accounts.length <= 2) {
      Wrapper.toast.error("At least two accounts are required.");
      return;
    }
    const updatedAccounts = formData.accounts.filter((_, i) => i !== index);
    const updatedInputValues = {
      debitAmounts: inputValues.debitAmounts.filter((_, i) => i !== index),
      creditAmounts: inputValues.creditAmounts.filter((_, i) => i !== index),
    };
    setFormData({ ...formData, accounts: updatedAccounts });
    setInputValues(updatedInputValues);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started");

    if (!validateForm()) {
      console.log("Form validation failed", errors);
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        voucherType: "Journal",
        date: formData.date,
        reference: formData.reference,
        description: formData.description,
        accounts: formData.accounts.map((acc) => ({
          account: acc.accountId, // Changed to accountId
          debitAmount: parseNumber(acc.debitAmount),
          creditAmount: parseNumber(acc.creditAmount),
        })),
      };
      console.log("Submission data:", submissionData);

      const response = await Wrapper.axios.post(
        `${BASE_URL}/journalvoucher/add`,
        submissionData
      );

      console.log("API Response:", response);

      if (response.data.success) {
        console.log("Voucher created successfully");
        Wrapper.toast.success("Journal Voucher created successfully!");
        setDetails(response.data.data);
        setModalOpen(true);

        setFormData({
          date: new Date().toISOString().split("T")[0],
          reference: "",
          description: "",
          accounts: [
            { accountId: "", debitAmount: "", creditAmount: "" },
            { accountId: "", debitAmount: "", creditAmount: "" },
          ],
        });
        setInputValues({
          debitAmounts: ["", ""],
          creditAmounts: ["", ""],
        });
      } else {
        console.warn("API returned success:false", response.data);
        Wrapper.toast.error(
          response.data.message || "Failed to create voucher."
        );
      }
    } catch (error) {
      console.error("Error in handleSubmit:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Wrapper.toast.error(
        error.response?.data?.message || "Failed to create voucher."
      );
    } finally {
      setLoading(false);
      console.log("Form submission completed");
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setModalOpen(false),
  });

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
            Create Journal Voucher
          </Wrapper.Typography>
          <Wrapper.Breadcrumbs sx={{ mt: 1 }}>
            <Wrapper.NavLink to="/" color="inherit">
              Dashboard
            </Wrapper.NavLink>
            <Wrapper.NavLink to="/journalvoucher" color="inherit">
              Journal Vouchers
            </Wrapper.NavLink>
            <Wrapper.Typography color="text.primary">Create</Wrapper.Typography>
          </Wrapper.Breadcrumbs>
        </Wrapper.Box>
        <Wrapper.NavLink to="/journalvoucher">
          <Wrapper.Button
            variant="outlined"
            color="primary"
            startIcon={<Wrapper.ArrowBackIcon />}
            sx={{ textTransform: "none" }}
          >
            Back to List
          </Wrapper.Button>
        </Wrapper.NavLink>
      </Wrapper.Box>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Wrapper.Paper
          sx={{ p: 3, mb: 4, borderRadius: "8px", border: "1px solid #e0e0e0" }}
        >
          <Wrapper.Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 2, color: "#2c3e50" }}
          >
            Document Information
          </Wrapper.Typography>
          <Wrapper.Grid container spacing={2}>
            <FormField
              label="Transaction Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              error={!!errors.date}
              helperText={errors.date}
              voucherType="Journal"
            />
            <FormField
              label="Reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Enter reference (optional)"
              voucherType="Journal"
            />
            <FormField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Enter transaction details..."
              voucherType="Journal"
            />
          </Wrapper.Grid>
        </Wrapper.Paper>

        <Wrapper.Paper
          sx={{ p: 3, mb: 4, borderRadius: "8px", border: "1px solid #e0e0e0" }}
        >
          <Wrapper.Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 2, color: "#2c3e50" }}
          >
            Account Entries
          </Wrapper.Typography>
          {formData.accounts.map((entry, index) => (
            <JournalAccountEntry
              key={index}
              index={index}
              entry={entry}
              accountList={accountList}
              onChange={handleChange}
              onRemove={removeAccountRow}
              formatNumber={formatNumber}
              inputValues={inputValues}
            />
          ))}
          <Wrapper.Button
            type="button"
            variant="outlined"
            color="primary"
            startIcon={<Wrapper.AddIcon />}
            onClick={addAccountRow}
            sx={{ mt: 2, textTransform: "none" }}
          >
            Add Account
          </Wrapper.Button>
          {errors.balance && (
            <Wrapper.Typography color="error" sx={{ mt: 2 }}>
              {errors.balance}
            </Wrapper.Typography>
          )}
        </Wrapper.Paper>

        <Wrapper.Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Wrapper.Button
            type="button"
            variant="outlined"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={
              loading ? (
                <Wrapper.CircularProgress size={20} />
              ) : (
                <Wrapper.SaveIcon />
              )
            }
            sx={{
              textTransform: "none",
              bgcolor: "#2c3e50",
              "&:hover": { bgcolor: "#1a252f" },
            }}
          >
            {loading ? "Processing..." : "Create Voucher"}
          </Wrapper.Button>
        </Wrapper.Box>
      </form>

      {/* Print Modal */}
      <Wrapper.Dialog
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Wrapper.DialogTitle
          sx={{
            bgcolor: "#2c3e50",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Wrapper.Typography variant="h6">
            Journal Voucher Receipt
          </Wrapper.Typography>
          <img src={logo} alt="Logo" style={{ height: "30px" }} />
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent dividers>
          {voucherDetails && (
            <Wrapper.Box ref={printRef} sx={{ p: 2 }}>
              <Wrapper.Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
              >
                <Wrapper.Box>
                  <Wrapper.Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#2c3e50" }}
                  >
                    Journal Voucher
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="textSecondary">
                    Transaction Record
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Box sx={{ textAlign: "right" }}>
                  <Wrapper.Typography variant="body2" color="textSecondary">
                    <strong>Date:</strong>{" "}
                    {new Date(voucherDetails.date).toLocaleDateString("en-GB")}
                  </Wrapper.Typography>
                </Wrapper.Box>
              </Wrapper.Box>

              <Wrapper.Paper
                sx={{ mb: 3, border: "1px solid #e0e0e0", borderRadius: "6px" }}
              >
                <Wrapper.Box sx={{ bgcolor: "#f8f9fa", p: 2 }}>
                  <Wrapper.Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#2c3e50" }}
                  >
                    Transaction Details
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Table>
                  <Wrapper.TableBody>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ width: "40%" }}>
                        <strong>Reference</strong>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {voucherDetails.reference || "--"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>
                        <strong>Description</strong>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {voucherDetails.description || "--"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.Paper>

              <Wrapper.Paper
                sx={{ mb: 3, border: "1px solid #e0e0e0", borderRadius: "6px" }}
              >
                <Wrapper.Box sx={{ bgcolor: "#f8f9fa", p: 2 }}>
                  <Wrapper.Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#2c3e50" }}
                  >
                    Account Entries
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Table>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>Account</Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        Debit (PKR)
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        Credit (PKR)
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {voucherDetails.accounts.map((acc, index) => (
                      <Wrapper.TableRow key={index}>
                        <Wrapper.TableCell>
                          {accountList.find((a) => a._id === acc.accountId)
                            ?.name || "--"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="right">
                          {acc.debitAmount
                            ? formatNumber(acc.debitAmount)
                            : "--"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="right">
                          {acc.creditAmount
                            ? formatNumber(acc.creditAmount)
                            : "--"}
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    ))}
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.Paper>

              <Wrapper.Box sx={{ mt: 4, textAlign: "center" }}>
                <Wrapper.Typography variant="body2" color="textSecondary">
                  This is a computer-generated document. No signature is
                  required.
                </Wrapper.Typography>
              </Wrapper.Box>
            </Wrapper.Box>
          )}
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
          <Wrapper.Button
            type="button"
            onClick={() => setModalOpen(false)}
            color="inherit"
            startIcon={<Wrapper.CloseIcon />}
            sx={{ textTransform: "none" }}
          >
            Close
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handlePrint}
            variant="contained"
            color="primary"
            startIcon={<Wrapper.PrintIcon />}
            sx={{
              textTransform: "none",
              bgcolor: "#2c3e50",
              "&:hover": { bgcolor: "#1a252f" },
            }}
          >
            Print Receipt
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
    </Wrapper.Box>
  );
};

export default JournalEntryForm;

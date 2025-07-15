import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../utils/wrapper";
import logo_light from "../assets/logo-light.png";
import { BASE_URL } from "../config/config";
import { FormField, AccountEntry } from "../components/SharedComponents";

const TransactionEntryForm = ({ voucherType = "Payment" }) => {
  const navigate = useNavigate();
  const [accountList, setAccountList] = useState([]);
  const [bankList, setBankList] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    paymentMethod: "Cash",
    voucherType,
    bankAccount: "",
    cashAccount: "",
    transactionNumber: "",
    clearanceDate: "",
    party: "",
    customer: "",
    supplier: "",
    description: "",
    totalAmount: 0,
    status: "Posted",
    accounts: [{ chartAccount: "", amount: "", narration: "" }],
    inputValues: [""],
  });

  const formatNumber = (value) => {
    if (!value && value !== 0) return "";
    const plainNumber = String(value).replace(/,/g, "");
    return isNaN(plainNumber)
      ? ""
      : parseFloat(plainNumber).toLocaleString("en-US");
  };

  const parseNumber = (value) => {
    if (!value) return "";
    const plainNumber = String(value).replace(/,/g, "");
    return isNaN(plainNumber) ? "" : parseFloat(plainNumber);
  };

  const fetchData = async (url, setter, errorMessage, loadingSetter) => {
    try {
      const token = localStorage.getItem("token");
      const response = await Wrapper.axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setter(response.data.data || response.data.bankList || []);
    } catch (error) {
      console.error(error);
      Wrapper.toast.error(errorMessage);
    } finally {
      loadingSetter && loadingSetter(false);
    }
  };

  const fetchCashAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const cashParentResponse = await Wrapper.axios.get(
        `${BASE_URL}/chartaccount/get-cash?name=Cash&group=Assets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const cashParent = cashParentResponse.data.data[0];
      if (!cashParent) {
        Wrapper.toast.warn("Cash parent account not found. Please create one.");
        setCashAccounts([]);
        return;
      }
      const childrenResponse = await Wrapper.axios.get(
        `${BASE_URL}/chartaccount/get?parentAccount=${cashParent._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const cashAccountsList =
        childrenResponse.data.data.length > 0
          ? childrenResponse.data.data
          : [cashParent];
      setCashAccounts(cashAccountsList);
      setFormData((prev) => ({
        ...prev,
        cashAccount: cashAccountsList[0]?._id || "",
      }));
    } catch (error) {
      console.error("Error fetching cash accounts:", error);
      Wrapper.toast.error("Failed to fetch cash accounts.");
    }
  };

  useEffect(() => {
    fetchData(
      `${BASE_URL}/chartaccount/get`,
      setAccountList,
      "Failed to fetch chart accounts."
    );
    fetchData(
      `${BASE_URL}/bank/get?all=true`,
      setBankList,
      "Failed to fetch bank accounts."
    );
    fetchData(
      `${BASE_URL}/customer/get`,
      setCustomers,
      "Failed to fetch customers.",
      setCustomersLoading
    );
    fetchData(
      `${BASE_URL}/supplier/get`,
      setSuppliers,
      "Failed to fetch suppliers.",
      setSuppliersLoading
    );
    fetchCashAccounts();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      bankAccount: prev.paymentMethod === "Bank" ? bankList[0]?._id || "" : "",
      cashAccount:
        prev.paymentMethod === "Cash" ? cashAccounts[0]?._id || "" : "",
      transactionNumber:
        prev.paymentMethod === "Bank" ? prev.transactionNumber : "",
      clearanceDate: prev.paymentMethod === "Bank" ? prev.clearanceDate : "",
      customer: prev.party === "Customer" ? prev.customer : "",
      supplier: prev.party === "Supplier" ? prev.supplier : "",
    }));
  }, [formData.paymentMethod, formData.party, bankList, cashAccounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "party" && value !== "Customer" ? { customer: "" } : {}),
      ...(name === "party" && value !== "Supplier" ? { supplier: "" } : {}),
    }));
  };

  const handleAccountChange = (index, e) => {
    const { name, value } = e.target;
    const updatedAccounts = [...formData.accounts];
    const updatedInputValues = [...formData.inputValues];
    if (name === "amount") {
      updatedInputValues[index] = value.replace(/,/g, "");
    } else {
      updatedAccounts[index][name] = value;
    }
    setFormData((prev) => ({
      ...prev,
      accounts: updatedAccounts,
      inputValues: updatedInputValues,
    }));
  };

  const handleAmountBlur = (index) => {
    const rawValue = formData.inputValues[index];
    const parsedValue = parseFloat(rawValue.replace(/,/g, ""));
    const updatedAccounts = [...formData.accounts];
    const updatedInputValues = [...formData.inputValues];
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      updatedAccounts[index].amount = parsedValue;
      setFormData((prev) => ({
        ...prev,
        accounts: updatedAccounts,
        totalAmount: updatedAccounts.reduce(
          (sum, acc) => sum + (parseFloat(acc.amount) || 0),
          0
        ),
      }));
    } else {
      updatedInputValues[index] = "";
      updatedAccounts[index].amount = "";
      setFormData((prev) => ({
        ...prev,
        accounts: updatedAccounts,
        inputValues: updatedInputValues,
        totalAmount: updatedAccounts.reduce(
          (sum, acc) => sum + (parseFloat(acc.amount) || 0),
          0
        ),
      }));
    }
  };

  const addAccountRow = () => {
    setFormData((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        { chartAccount: "", amount: "", narration: "" },
      ],
      inputValues: [...prev.inputValues, ""],
    }));
  };

  const removeAccountRow = (index) => {
    const updatedAccounts = formData.accounts.filter((_, i) => i !== index);
    const updatedInputValues = formData.inputValues.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      accounts: updatedAccounts,
      inputValues: updatedInputValues,
      totalAmount: updatedAccounts.reduce(
        (sum, acc) => sum + (parseFloat(acc.amount) || 0),
        0
      ),
    }));
  };

  const validateForm = () => {
    const {
      date,
      party,
      customer,
      supplier,
      totalAmount,
      paymentMethod,
      cashAccount,
      bankAccount,
      transactionNumber,
      clearanceDate,
      accounts,
    } = formData;

    if (!date || !party || !totalAmount) {
      Wrapper.toast.error(
        "Please fill all required fields (Date, Party, Total Amount)."
      );
      return false;
    }

    if (party === "Customer" && !customer) {
      Wrapper.toast.error("Please select a customer.");
      return false;
    }

    if (party === "Supplier" && !supplier) {
      Wrapper.toast.error("Please select a supplier.");
      return false;
    }

    if (paymentMethod === "Cash" && !cashAccount) {
      Wrapper.toast.error("Please select a cash account.");
      return false;
    }

    if (
      paymentMethod === "Bank" &&
      (!bankAccount || !transactionNumber || !clearanceDate)
    ) {
      Wrapper.toast.error(
        "Please select a bank account, transaction number, and clearance date."
      );
      return false;
    }

    if (clearanceDate && new Date(clearanceDate) < new Date(date)) {
      Wrapper.toast.error("Clearance date cannot be before transaction date.");
      return false;
    }

    if (
      clearanceDate &&
      new Date(clearanceDate) < new Date().setHours(0, 0, 0, 0)
    ) {
      Wrapper.toast.error("Clearance date cannot be in the past.");
      return false;
    }

    const accountIds = accounts.map((acc) => acc.chartAccount);
    if (new Set(accountIds).size !== accountIds.length) {
      Wrapper.toast.error("Duplicate accounts are not allowed.");
      return false;
    }

    for (const entry of accounts) {
      if (!entry.chartAccount || !entry.amount || entry.amount <= 0) {
        Wrapper.toast.error(
          "Please complete all account entries with valid accounts and amounts."
        );
        return false;
      }
    }

    const accountsTotal = accounts.reduce(
      (sum, acc) => sum + parseFloat(acc.amount || 0),
      0
    );
    if (accountsTotal !== parseFloat(totalAmount)) {
      Wrapper.toast.error(
        "Total amount must equal the sum of account amounts."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const submissionData = {
      date: formData.date,
      reference: formData.reference || undefined,
      voucherType: formData.voucherType,
      paymentMethod: formData.paymentMethod,
      party: formData.party,
      customer: formData.party === "Customer" ? formData.customer : undefined,
      supplier: formData.party === "Supplier" ? formData.supplier : undefined,
      description: formData.description || undefined,
      accounts: formData.accounts.map((entry) => ({
        chartAccount: entry.chartAccount,
        amount: parseFloat(entry.amount),
        narration: entry.narration || undefined,
      })),
      totalAmount: parseFloat(formData.totalAmount),
      status: formData.status,
    };

    if (formData.paymentMethod === "Cash") {
      submissionData.cashAccount = formData.cashAccount;
    } else if (formData.paymentMethod === "Bank") {
      submissionData.bankAccount = formData.bankAccount;
      submissionData.transactionNumber =
        formData.transactionNumber || undefined;
      submissionData.clearanceDate = formData.clearanceDate || undefined;
    }

    try {
      const response = await Wrapper.axios.post(
        `${BASE_URL}/transaction-entry/add`,
        submissionData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        Wrapper.toast.success(`${voucherType} Entry Created Successfully!`);
        setVoucherDetails(response.data.data);
        setIsModalOpen(true);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          reference: "",
          paymentMethod: "Cash",
          voucherType,
          bankAccount: "",
          cashAccount: cashAccounts[0]?._id || "",
          transactionNumber: "",
          clearanceDate: "",
          party: "",
          customer: "",
          supplier: "",
          description: "",
          totalAmount: 0,
          status: "Posted",
          accounts: [{ chartAccount: "", amount: "", narration: "" }],
          inputValues: [""],
        });
      } else {
        Wrapper.toast.error(
          response.data.message ||
            `Error creating ${voucherType.toLowerCase()} entry.`
        );
      }
    } catch (error) {
      Wrapper.toast.error(
        error.response?.data?.message?.includes("Duplicate accounts")
          ? "Duplicate accounts are not allowed."
          : error.response?.data?.message?.includes("Customer ID is required")
          ? "Customer ID is required for Customer party."
          : error.response?.data?.message?.includes("Supplier ID is required")
          ? "Supplier ID is required for Supplier party."
          : error.response?.data?.message?.includes("Invalid cash account")
          ? "Selected cash account is invalid."
          : error.response?.data?.message?.includes("Insufficient")
          ? error.response?.data?.message
          : error.response?.data?.message ||
            `Failed to create ${voucherType.toLowerCase()} entry.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printArea").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${voucherType} Entry</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e0e0e0; padding: 8px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Wrapper.Box
      sx={{
        p: 0,
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#fff",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
        }}
      >
        <Wrapper.Box>
          <Wrapper.Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "#2c3e50" }}
          >
            Create {voucherType} Entry
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body2"
            sx={{ color: "#7f8c8d", mt: 0.5 }}
          >
            Create a new {voucherType.toLowerCase()} transaction
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.NavLink
          to={voucherType === "Payment" ? "/payment-entry" : "/receipt-entry"}
        >
          <Wrapper.Button
            startIcon={<Wrapper.ArrowBackIcon />}
            variant="outlined"
            sx={{ borderRadius: "4px", textTransform: "none", fontWeight: 500 }}
          >
            Back to {voucherType}s
          </Wrapper.Button>
        </Wrapper.NavLink>
      </Wrapper.Box>

      <form onSubmit={handleSubmit}>
        <Wrapper.Box sx={{ p: 3 }}>
          <Wrapper.Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
            }}
          >
            <Wrapper.Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Wrapper.ReceiptIcon fontSize="small" /> Document Information
            </Wrapper.Typography>
            <Wrapper.Grid container spacing={3}>
              <FormField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                inputProps={{ max: new Date().toISOString().split("T")[0] }}
              />
              <FormField
                label="Reference"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
              />
              <FormField
                label="Party"
                name="party"
                value={formData.party}
                onChange={handleInputChange}
                select
                required
                options={[
                  { value: "Customer", label: "Customer" },
                  { value: "Supplier", label: "Supplier" },
                  { value: "Other", label: "Other" },
                ]}
              />
              {formData.party === "Customer" && (
                <FormField
                  label="Customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  select
                  required
                  options={
                    customersLoading
                      ? [{ value: "", label: "Loading..." }]
                      : customers.map((cust) => ({
                          value: cust._id,
                          label: cust.name,
                        }))
                  }
                />
              )}
              {formData.party === "Supplier" && (
                <FormField
                  label="Supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  select
                  required
                  options={
                    suppliersLoading
                      ? [{ value: "", label: "Loading..." }]
                      : suppliers.map((supp) => ({
                          value: supp._id,
                          label: supp.name,
                        }))
                  }
                />
              )}
              <FormField
                label="Entry Type"
                name="voucherType"
                value={formData.voucherType}
                onChange={handleInputChange}
                select
                options={[
                  { value: "Payment", label: "Payment" },
                  { value: "Receipt", label: "Receipt" },
                ]}
                required
                disabled
              />
              <FormField
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                select
                options={[
                  { value: "Draft", label: "Draft" },
                  { value: "Posted", label: "Posted" },
                ]}
                required
              />
            </Wrapper.Grid>
          </Wrapper.Paper>

          <Wrapper.Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: `4px solid ${
                voucherType === "Payment" ? "#e74c3c" : "#2ecc71"
              }`,
            }}
          >
            <Wrapper.Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {voucherType === "Payment" ? (
                <Wrapper.CallReceivedIcon
                  fontSize="small"
                  sx={{ color: "#e74c3c" }}
                />
              ) : (
                <Wrapper.CallMadeIcon
                  fontSize="small"
                  sx={{ color: "#2ecc71" }}
                />
              )}
              {voucherType} Details
            </Wrapper.Typography>
            <Wrapper.Grid container spacing={3}>
              <FormField
                label={`${voucherType} Method`}
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                select
                required
                options={[
                  { value: "Cash", label: "Cash" },
                  { value: "Bank", label: "Bank" },
                ]}
              />
              {formData.paymentMethod === "Cash" && (
                <FormField
                  label="Cash Account"
                  name="cashAccount"
                  value={formData.cashAccount}
                  onChange={handleInputChange}
                  select
                  required
                  options={cashAccounts.map((acc) => ({
                    value: acc._id,
                    label: acc.name,
                  }))}
                />
              )}
              {formData.paymentMethod === "Bank" && (
                <>
                  <FormField
                    label="Bank Account"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    select
                    required
                    options={bankList.map((acc) => ({
                      value: acc._id,
                      label: `${acc.accountTitle} - ${acc.bankName} (${acc.accountNumber})`,
                    }))}
                  />
                  <FormField
                    label="Transaction Number"
                    name="transactionNumber"
                    value={formData.transactionNumber}
                    onChange={handleInputChange}
                    required
                  />
                  <FormField
                    label="Clearance Date"
                    name="clearanceDate"
                    type="date"
                    value={formData.clearanceDate}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: formData.date }}
                  />
                </>
              )}
              <Wrapper.Grid item xs={12}>
                <Wrapper.Typography
                  variant="subtitle2"
                  sx={{ mb: 2, fontWeight: 600 }}
                >
                  Account Entries
                </Wrapper.Typography>
                {formData.accounts.map((entry, index) => (
                  <AccountEntry
                    key={index}
                    index={index}
                    entry={entry}
                    accountList={accountList}
                    voucherType={formData.voucherType}
                    onChange={handleAccountChange}
                    onBlur={handleAmountBlur}
                    onRemove={removeAccountRow}
                    formatNumber={formatNumber}
                    inputValues={formData.inputValues}
                  />
                ))}
                <Wrapper.Button
                  variant="outlined"
                  startIcon={<Wrapper.AddIcon />}
                  onClick={addAccountRow}
                  sx={{ mt: 2, textTransform: "none" }}
                >
                  Add Account
                </Wrapper.Button>
              </Wrapper.Grid>
              <FormField
                label="Total Amount"
                name="totalAmount"
                value={formatNumber(formData.totalAmount)}
                disabled
                startAdornment={
                  <Wrapper.InputAdornment position="start">
                    <Wrapper.Typography
                      sx={{ color: "#7f8c8d", fontWeight: 500 }}
                    >
                      PKR
                    </Wrapper.Typography>
                  </Wrapper.InputAdornment>
                }
              />
            </Wrapper.Grid>
          </Wrapper.Paper>

          <Wrapper.Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
            }}
          >
            <Wrapper.Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Wrapper.DescriptionIcon fontSize="small" /> Additional
              Information
            </Wrapper.Typography>
            <Wrapper.FormControl fullWidth variant="outlined" size="small">
              <Wrapper.InputLabel>Description</Wrapper.InputLabel>
              <Wrapper.OutlinedInput
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                label="Description"
                placeholder={`Enter ${voucherType.toLowerCase()} details or notes...`}
              />
            </Wrapper.FormControl>
          </Wrapper.Paper>

          <Wrapper.Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 4,
              gap: 2,
            }}
          >
            <Wrapper.Button
              variant="outlined"
              color="inherit"
              sx={{ flex: 1, py: 1.2, textTransform: "none", fontWeight: 500 }}
              onClick={() =>
                navigate(
                  voucherType === "Payment"
                    ? "/paymentvoucher"
                    : "/receivevoucher"
                )
              }
            >
              Cancel
            </Wrapper.Button>
            <Wrapper.Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                flex: 2,
                py: 1.2,
                textTransform: "none",
                fontWeight: 500,
                bgcolor: "#2c3e50",
                "&:hover": { bgcolor: "#1a252f" },
              }}
              startIcon={
                loading ? (
                  <Wrapper.CircularProgress size={20} color="inherit" />
                ) : (
                  <Wrapper.SaveIcon />
                )
              }
            >
              {loading ? "Processing..." : "Create Entry"}
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.Box>
      </form>

      <Wrapper.Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "8px", overflow: "hidden" } }}
      >
        <Wrapper.DialogTitle sx={{ p: 0 }}>
          <Wrapper.Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              bgcolor: "#2c3e50",
              color: "white",
            }}
          >
            <Wrapper.Typography variant="h6" sx={{ fontWeight: 500 }}>
              {voucherType} Entry
            </Wrapper.Typography>
            <img
              src={logo_light || "/placeholder.svg"}
              alt="Software Logo"
              style={{ height: "36px" }}
            />
          </Wrapper.Box>
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent dividers>
          {voucherDetails && (
            <Wrapper.Box id="printArea" sx={{ p: 2 }}>
              <Wrapper.Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 3,
                  pb: 2,
                  borderBottom: "1px dashed #e0e0e0",
                }}
              >
                <Wrapper.Box>
                  <Wrapper.Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#2c3e50" }}
                  >
                    {voucherDetails.voucherType} Entry
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="textSecondary">
                    Transaction Entry
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Box sx={{ textAlign: "right" }}>
                  <Wrapper.Typography variant="body2" color="default">
                    <strong>Entry Number:</strong>{" "}
                    {voucherDetails.voucherNumber || "—"}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="default">
                    <strong>Date:</strong>{" "}
                    {new Date(voucherDetails.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="default">
                    <strong>Ref:</strong> {voucherDetails.reference || ""}
                  </Wrapper.Typography>
                  <Wrapper.Typography variant="body2" color="default">
                    <strong>Status:</strong> {voucherDetails.status}
                  </Wrapper.Typography>
                </Wrapper.Box>
              </Wrapper.Box>
              <Wrapper.Paper
                elevation={0}
                sx={{
                  mb: 3,
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box sx={{ bgcolor: "#f8f9fa", p: 2 }}>
                  <Wrapper.Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "600", color: "#2c3e50" }}
                  >
                    Transaction Details
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Table>
                  <Wrapper.TableBody>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ width: "40%" }}>
                        <strong>Party</strong>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {voucherDetails.party === "Customer"
                          ? customers.find(
                              (c) => c._id === voucherDetails.customer
                            )?.name || "—"
                          : voucherDetails.party === "Supplier"
                          ? suppliers.find(
                              (s) => s._id === voucherDetails.supplier
                            )?.name || "—"
                          : voucherDetails.party || "—"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>
                        <strong>{voucherType} Method</strong>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {voucherDetails.paymentMethod}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    {voucherDetails.paymentMethod === "Cash" && (
                      <Wrapper.TableRow>
                        <Wrapper.TableCell>
                          <strong>Cash Account</strong>
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="right">
                          {cashAccounts.find(
                            (acc) => acc._id === voucherDetails.cashAccount
                          )?.name || "—"}
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    )}
                    {voucherDetails.paymentMethod === "Bank" && (
                      <>
                        <Wrapper.TableRow>
                          <Wrapper.TableCell>
                            <strong>Bank Account</strong>
                          </Wrapper.TableCell>
                          <Wrapper.TableCell align="right">
                            {bankList.find(
                              (acc) => acc._id === voucherDetails.bankAccount
                            )?.accountTitle || "—"}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                        <Wrapper.TableRow>
                          <Wrapper.TableCell>
                            <strong>Transaction Number</strong>
                          </Wrapper.TableCell>
                          <Wrapper.TableCell align="right">
                            {voucherDetails.transactionNumber || ""}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                        <Wrapper.TableRow>
                          <Wrapper.TableCell>
                            <strong>Clearance Date</strong>
                          </Wrapper.TableCell>
                          <Wrapper.TableCell align="right">
                            {voucherDetails.clearanceDate
                              ? new Date(
                                  voucherDetails.clearanceDate
                                ).toLocaleDateString("en-GB")
                              : ""}
                          </Wrapper.TableCell>
                        </Wrapper.TableRow>
                      </>
                    )}
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>
                        <strong>Description</strong>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        {voucherDetails.description || ""}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.Paper>
              <Wrapper.Paper
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <Wrapper.Box
                  sx={{
                    bgcolor: "#eafaf1",
                    p: 2,
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <Wrapper.Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: voucherType === "Payment" ? "#e74c3c" : "#2ecc71",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {voucherType === "Payment" ? (
                      <Wrapper.CallReceivedIcon fontSize="small" />
                    ) : (
                      <Wrapper.CallMadeIcon fontSize="small" />
                    )}
                    Account Entries
                  </Wrapper.Typography>
                </Wrapper.Box>
                <Wrapper.Table>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>Chart of Account</Wrapper.TableCell>
                      <Wrapper.TableCell>Narration</Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        Amount (PKR)
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {voucherDetails.accounts?.map((entry, index) => (
                      <Wrapper.TableRow key={index}>
                        <Wrapper.TableCell>
                          {accountList.find(
                            (acc) => acc._id === entry.chartAccount
                          )?.name || "—"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {entry.narration || ""}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell align="right">
                          {formatNumber(entry.amount)}
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    ))}
                    <Wrapper.TableRow>
                      <Wrapper.TableCell colSpan={2}>
                        <strong>Total Amount</strong>
                      </Wrapper.TableCell>
                      <Wrapper.TableCell align="right">
                        <strong>
                          PKR {formatNumber(voucherDetails.totalAmount)}
                        </strong>
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.Paper>
              <Wrapper.Box
                sx={{
                  mt: 4,
                  pt: 2,
                  borderTop: "1px dashed #e0e0e0",
                  textAlign: "center",
                }}
              >
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
            onClick={() => setIsModalOpen(false)}
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
            Print {voucherType}
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
    </Wrapper.Box>
  );
};

export default TransactionEntryForm;

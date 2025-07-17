import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../utils/wrapper";
import { BASE_URL } from "../config/config";
import { FormField, AccountEntry } from "../components/SharedComponents";
import PrintVoucher from "./PrintVoucher";
import { format, parse } from "date-fns";

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
    entries: [{ chartAccount: "", amount: "", narration: "" }],
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
      const response = await Wrapper.axios.get(url);
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
      const res = await Wrapper.axios.get(`${BASE_URL}/chartaccount/get-cash`);
      console.log("Cash Accounts Response:", res);
      const cashAccountsList = res.data.data || [];

      if (cashAccountsList.length === 0) {
        Wrapper.toast.warn("No cash accounts found.");
        setCashAccounts([]);
        return;
      }

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
    const updatedAccounts = [...formData.entries];
    const updatedInputValues = [...formData.inputValues];
    if (name === "amount") {
      updatedInputValues[index] = value.replace(/,/g, "");
    } else {
      updatedAccounts[index][name] = value;
    }
    setFormData((prev) => ({
      ...prev,
      entries: updatedAccounts,
      inputValues: updatedInputValues,
    }));
  };

  const handleAmountBlur = (index) => {
    const rawValue = formData.inputValues[index];
    const parsedValue = parseFloat(rawValue.replace(/,/g, ""));
    const updatedAccounts = [...formData.entries];
    const updatedInputValues = [...formData.inputValues];
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      updatedAccounts[index].amount = parsedValue;
      setFormData((prev) => ({
        ...prev,
        entries: updatedAccounts,
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
        entries: updatedAccounts,
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
      entries: [
        ...prev.entries,
        { chartAccount: "", amount: "", narration: "" },
      ],
      inputValues: [...prev.inputValues, ""],
    }));
  };

  const removeAccountRow = (index) => {
    const updatedAccounts = formData.entries.filter((_, i) => i !== index);
    const updatedInputValues = formData.inputValues.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      entries: updatedAccounts,
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
      entries,
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

    const accountIds = entries.map((acc) => acc.chartAccount);
    if (new Set(accountIds).size !== accountIds.length) {
      Wrapper.toast.error("Duplicate accounts are not allowed.");
      return false;
    }

    for (const entry of entries) {
      if (!entry.chartAccount || !entry.amount || entry.amount <= 0) {
        Wrapper.toast.error(
          "Please complete all account entries with valid accounts and amounts."
        );
        return false;
      }
    }

    const accountsTotal = entries.reduce(
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
      entries: formData.entries.map((entry) => ({
        chartAccount: entry.chartAccount,
        amount: parseFloat(entry.amount),
        narration: entry.narration || undefined,
      })),
      totalAmount: parseFloat(formData.totalAmount),
      status: formData.status,
      isBatch: true,
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
        submissionData
      );
      if (response.data.success) {
        Wrapper.toast.success(`${voucherType} Entry Created Successfully!`);
        setVoucherDetails({
          ...response.data.data,
          customer:
            formData.party === "Customer"
              ? customers.find((c) => c._id === formData.customer)
              : undefined,
          supplier:
            formData.party === "Supplier"
              ? suppliers.find((s) => s._id === formData.supplier)
              : undefined,
        });
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
          entries: [{ chartAccount: "", amount: "", narration: "" }],
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
            color="inherit"
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
              borderLeft: `4px solid ${
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
                  <Wrapper.Grid item xs={12} sm={6} md={6}>
                    <Wrapper.LocalizationProvider
                      dateAdapter={Wrapper.AdapterDateFns}
                    >
                      <Wrapper.DatePicker
                        label="Clearance Date"
                        format="dd/MM/yyyy"
                        value={
                          formData.clearanceDate
                            ? parse(
                                formData.clearanceDate,
                                "dd/MM/yyyy",
                                new Date()
                              )
                            : null
                        }
                        onChange={(date) => {
                          if (date && !isNaN(date)) {
                            const formatted = format(date, "dd/MM/yyyy");
                            setFormData((prev) => ({
                              ...prev,
                              clearanceDate: formatted,
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              clearanceDate: "",
                            }));
                          }
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            size: "small",
                            InputLabelProps: { shrink: true },
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "#d1d5db" },
                                "&:hover fieldset": { borderColor: "#9ca3af" },
                                "&.Mui-focused fieldset": {
                                  borderColor: "#16a34a",
                                },
                                fontSize: "0.875rem",
                              },
                              "& .MuiInputLabel-root": {
                                color: "#6b7280",
                                fontSize: "0.875rem",
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: "#16a34a",
                              },
                            },
                          },
                        }}
                        minDate={parse(formData.date, "yyyy-MM-dd", new Date())}
                      />
                    </Wrapper.LocalizationProvider>
                  </Wrapper.Grid>
                </>
              )}
              <Wrapper.Grid item xs={12}>
                <Wrapper.Typography
                  variant="subtitle2"
                  sx={{ mb: 2, fontWeight: 600 }}
                >
                  Account Entries
                </Wrapper.Typography>
                {formData.entries.map((entry, index) => (
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
            sx={{ display: "flex", justifyContent: "flex-start", gap: 2 }}
          >
            <Wrapper.Button
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "none" }}
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
              color="success"
              disabled={loading}
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
      {voucherDetails && (
        <PrintVoucher
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transaction={voucherDetails}
          transactionType={voucherType}
        />
      )}
    </Wrapper.Box>
  );
};

export default TransactionEntryForm;

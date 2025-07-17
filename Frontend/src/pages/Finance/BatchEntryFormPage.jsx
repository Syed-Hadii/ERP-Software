import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import { FormField, BatchAccountEntry } from "../../components/SharedComponents";
import PrintVoucher from "../../components/PrintVoucher";
import { format, parse } from "date-fns";

const BatchEntryForm = () => {
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
    voucherType: "Payment",
    reference: "",
    paymentMethod: "Cash",
    bankAccount: "",
    cashAccount: "",
    transactionNumber: "",
    clearanceDate: "",
    description: "",
    status: "Posted",
    entries: [
      {
        date: new Date().toISOString().split("T")[0],
        party: "",
        customer: "",
        supplier: "",
        chartAccount: "",
        amount: "",
        narration: "",
      },
    ],
    inputValues: [""],
  });

  const formatNumber = (value) => {
    if (!value && value !== 0) return "";
    const plainNumber = String(value).replace(/,/g, "");
    return isNaN(plainNumber)
      ? ""
      : parseFloat(plainNumber).toLocaleString("en-US");
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
    }));
  }, [formData.paymentMethod, bankList, cashAccounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEntryChange = (index, name, value) => {
    const updatedEntries = [...formData.entries];
    updatedEntries[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      entries: updatedEntries,
    }));
  };

  const handleAmountChange = (index, value) => {
    const updatedInputValues = [...formData.inputValues];
    updatedInputValues[index] = value;
    setFormData((prev) => ({
      ...prev,
      inputValues: updatedInputValues,
    }));
  };

  const handleAmountBlur = (index) => {
    const rawValue = formData.inputValues[index];
    const parsedValue = parseFloat(rawValue.replace(/,/g, ""));
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      const updatedEntries = [...formData.entries];
      updatedEntries[index].amount = parsedValue;
      setFormData((prev) => ({
        ...prev,
        entries: updatedEntries,
      }));
    } else {
      const updatedInputValues = [...formData.inputValues];
      updatedInputValues[index] = "";
      const updatedEntries = [...formData.entries];
      updatedEntries[index].amount = "";
      setFormData((prev) => ({
        ...prev,
        entries: updatedEntries,
        inputValues: updatedInputValues,
      }));
    }
  };

  const addEntryRow = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          date: new Date().toISOString().split("T")[0],
          party: "",
          customer: "",
          supplier: "",
          chartAccount: "",
          amount: "",
          narration: "",
        },
      ],
      inputValues: [...prev.inputValues, ""],
    }));
  };

  const removeEntryRow = (index) => {
    const updatedEntries = formData.entries.filter((_, i) => i !== index);
    const updatedInputValues = formData.inputValues.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      entries: updatedEntries,
      inputValues: updatedInputValues,
    }));
  };

  const validateForm = () => {
    const {
      voucherType,
      paymentMethod,
      bankAccount,
      cashAccount,
      transactionNumber,
      clearanceDate,
      status,
      entries,
    } = formData;

    if (!voucherType || !paymentMethod || !status) {
      Wrapper.toast.error("Please fill all required fields.");
      return false;
    }

    if (paymentMethod === "Cash" && !cashAccount) {
      Wrapper.toast.error("Please select a cash account.");
      return false;
    }

    if (paymentMethod === "Bank") {
      if (!bankAccount || !transactionNumber || !clearanceDate) {
        Wrapper.toast.error("Please fill all bank details.");
        return false;
      }
      const clearanceDateObj = new Date(clearanceDate);
      if (clearanceDateObj < new Date().setHours(0, 0, 0, 0)) {
        Wrapper.toast.error("Clearance date cannot be in the past.");
        return false;
      }
      const maxEntryDate = Math.max(
        ...entries.map((e) => new Date(e.date).getTime())
      );
      if (clearanceDateObj < new Date(maxEntryDate)) {
        Wrapper.toast.error("Clearance date must be after all entry dates.");
        return false;
      }
    }

    if (entries.length === 0) {
      Wrapper.toast.error("Please add at least one entry.");
      return false;
    }

    const accountIds = entries.map((entry) => entry.chartAccount);
    if (new Set(accountIds).size !== accountIds.length) {
      Wrapper.toast.error("Duplicate chart accounts are not allowed.");
      return false;
    }

    for (const entry of entries) {
      if (
        !entry.date ||
        !entry.party ||
        !entry.chartAccount ||
        !entry.amount ||
        entry.amount <= 0
      ) {
        Wrapper.toast.error("Please complete all fields in each entry.");
        return false;
      }
      if (entry.party === "Customer" && !entry.customer) {
        Wrapper.toast.error("Please select a customer for customer entries.");
        return false;
      }
      if (entry.party === "Supplier" && !entry.supplier) {
        Wrapper.toast.error("Please select a supplier for supplier entries.");
        return false;
      }
      const entryDate = new Date(entry.date);
      if (entryDate > new Date()) {
        Wrapper.toast.error("Entry date cannot be in the future.");
        return false;
      }
    }

    return true;
  };

 const handleSubmit = async (e) => {
   e.preventDefault();
   if (!validateForm()) return;

   setLoading(true);
   const totalAmount = formData.entries.reduce(
     (sum, entry) => sum + parseFloat(entry.amount || 0),
     0
   );
   const submissionData = {
     voucherType: formData.voucherType,
     reference: formData.reference || undefined,
     paymentMethod: formData.paymentMethod,
     bankAccount:
       formData.paymentMethod === "Bank" ? formData.bankAccount : undefined,
     transactionNumber:
       formData.paymentMethod === "Bank"
         ? formData.transactionNumber
         : undefined,
     clearanceDate:
       formData.paymentMethod === "Bank" ? formData.clearanceDate : undefined,
     cashAccount:
       formData.paymentMethod === "Cash" ? formData.cashAccount : undefined,
     description: formData.description || undefined,
     status: formData.status,
     totalAmount, 
     entries: formData.entries.map((entry) => ({
       date: entry.date,
       party: entry.party,
       customer: entry.party === "Customer" ? entry.customer : undefined,
       supplier: entry.party === "Supplier" ? entry.supplier : undefined,
       chartAccount: entry.chartAccount,
       amount: parseFloat(entry.amount),
       narration: entry.narration || undefined,
     })), 
   };

   console.log("submissionData:", JSON.stringify(submissionData, null, 2)); // Debug payload

   try {
     const response = await Wrapper.axios.post(
       `${BASE_URL}/batch-entry/`,
       submissionData
     );
     if (response.data.success) {
       Wrapper.toast.success("Batch Entry Created Successfully!");
       setVoucherDetails(response.data.data);
       setIsModalOpen(true);
       setFormData({
         voucherType: "Payment",
         reference: "",
         paymentMethod: "Cash",
         bankAccount: "",
         cashAccount: cashAccounts[0]?._id || "",
         transactionNumber: "",
         clearanceDate: "",
         description: "",
         status: "Posted",
         entries: [
           {
             date: new Date().toISOString().split("T")[0],
             party: "",
             customer: "",
             supplier: "",
             chartAccount: "",
             amount: "",
             narration: "",
           },
         ],
         inputValues: [""],
       });
     } else {
       Wrapper.toast.error(
         response.data.message || "Error creating batch entry."
       );
     }
   } catch (error) {
     console.error("Submission error:", error.response?.data);
     Wrapper.toast.error(
       error.response?.data?.message || "Failed to create batch entry."
     );
   } finally {
     setLoading(false);
   }
 };

  const totalAmount = formData.entries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount || 0),
    0
  );

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
            Create Batch Entry
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body2"
            sx={{ color: "#7f8c8d", mt: 0.5 }}
          >
            Create a new batch transaction entry
          </Wrapper.Typography>
        </Wrapper.Box>
        <Wrapper.NavLink to="/batch-entry">
          <Wrapper.Button
            startIcon={<Wrapper.ArrowBackIcon />}
            variant="outlined"
            color="inherit"
          >
            Back to Batch Entries
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
                label="Voucher Type"
                name="voucherType"
                value={formData.voucherType}
                onChange={handleInputChange}
                select
                options={[
                  { value: "Payment", label: "Payment" },
                  { value: "Receipt", label: "Receipt" },
                ]}
                required
              />
              <FormField
                label="Reference"
                name="reference"
                value={formData.reference}
                onChange={handleInputChange}
              />
              <FormField
                label="Payment Method"
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
                        minDate={new Date()}
                      />
                    </Wrapper.LocalizationProvider>
                  </Wrapper.Grid>
                </>
              )}
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
                formData.voucherType === "Payment" ? "#e74c3c" : "#2ecc71"
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
              {formData.voucherType === "Payment" ? (
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
              Batch Entries
            </Wrapper.Typography>
            {formData.entries.map((entry, index) => (
              <BatchAccountEntry
                key={index}
                index={index}
                entry={entry}
                accountList={accountList}
                customers={customers}
                suppliers={suppliers}
                voucherType={formData.voucherType}
                onEntryChange={handleEntryChange}
                onAmountChange={handleAmountChange}
                onAmountBlur={handleAmountBlur}
                onRemove={removeEntryRow}
                formatNumber={formatNumber}
                inputValues={formData.inputValues}
                customersLoading={customersLoading}
                suppliersLoading={suppliersLoading}
                canRemove={formData.entries.length > 1}
              />
            ))}
            <Wrapper.Button
              variant="outlined"
              startIcon={<Wrapper.AddIcon />}
              onClick={addEntryRow}
              sx={{ mt: 2, textTransform: "none" }}
            >
              Add Entry
            </Wrapper.Button>
            <Wrapper.Box sx={{ mt: 3 }}>
              <Wrapper.Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total Amount: {formatNumber(totalAmount)} PKR
              </Wrapper.Typography>
            </Wrapper.Box>
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
                placeholder="Enter batch entry details or notes..."
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
              onClick={() => navigate("/batch-entry")}
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
              {loading ? "Processing..." : "Create Batch Entry"}
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.Box>
      </form>
      {voucherDetails && (
        <PrintVoucher
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transaction={voucherDetails}
          transactionType={formData.voucherType}
        />
      )}
    </Wrapper.Box>
  );
};

export default BatchEntryForm;

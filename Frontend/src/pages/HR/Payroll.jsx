import React, { useState, useEffect, useRef } from "react";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import moment from "moment";
import erp from "../../assets/erp.png";

const payrollFields = [
  {
    name: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "Employee", label: "Employee" },
      { value: "User", label: "User" },
    ],
    validation: { required: true },
    icon: <Wrapper.CategoryIcon fontSize="small" color="action" />,
  },
  {
    name: "entity",
    label: "Entity",
    type: "select",
    options: [], // Populated dynamically
    validation: { required: true },
    icon: <Wrapper.PersonIcon fontSize="small" color="action" />,
  },
  {
    name: "month",
    label: "Month",
    type: "select",
    options: Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: moment().month(i).format("MMMM"),
    })),
    validation: { required: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "year",
    label: "Year",
    type: "select",
    options: Array.from({ length: 10 }, (_, i) => ({
      value: new Date().getFullYear() - i,
      label: `${new Date().getFullYear() - i}`,
    })),
    validation: { required: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "daysInMonth",
    label: "Days in Month",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    show: (formData) => formData.type === "Employee",
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "totalWorkingDays",
    label: "Total Working Days",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    show: (formData) => formData.type === "Employee",
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "presentDays",
    label: "Present Days",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    show: (formData) => formData.type === "Employee",
    icon: <Wrapper.CheckCircleIcon fontSize="small" color="action" />,
  },
  {
    name: "leaveDays",
    label: "Leave Days",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    show: (formData) => formData.type === "Employee",
    icon: <Wrapper.LeaveIcon fontSize="small" color="action" />,
  },
  {
    name: "absentDays",
    label: "Absent Days",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    show: (formData) => formData.type === "Employee",
    icon: <Wrapper.CancelIcon fontSize="small" color="action" />,
  },
  {
    name: "basicSalary",
    label: "Basic Salary",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    icon: <Wrapper.AttachMoneyIcon fontSize="small" color="action" />,
  },
  {
    name: "absenceDeduction",
    label: "Absence Deduction",
    type: "number",
    validation: { min: 0 },
    icon: <Wrapper.MoneyOffIcon fontSize="small" color="action" />,
  },
  {
    name: "loanDeduction",
    label: "Loan Deduction",
    type: "number",
    InputProps: { readOnly: true },
    disabled: (formData) => formData.type === "User" || true,
    icon: <Wrapper.AccountBalanceIcon fontSize="small" color="action" />,
  },
  {
    name: "bonuses",
    label: "Bonuses",
    type: "number",
    validation: { min: 0 },
    icon: <Wrapper.StarIcon fontSize="small" color="action" />,
  },
  {
    name: "netPay",
    label: "Net Pay",
    type: "number",
    InputProps: { readOnly: true },
    disabled: true,
    icon: <Wrapper.PaymentsIcon fontSize="small" color="action" />,
  },
];

const payrollRequestFields = [
  {
    name: "month",
    label: "Month",
    type: "select",
    options: Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: moment().month(i).format("MMMM"),
    })),
    validation: { required: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
  {
    name: "year",
    label: "Year",
    type: "select",
    options: Array.from({ length: 10 }, (_, i) => ({
      value: new Date().getFullYear() - i,
      label: `${new Date().getFullYear() - i}`,
    })),
    validation: { required: true },
    icon: <Wrapper.CalendarMonthIcon fontSize="small" color="action" />,
  },
];

const Payroll = () => {
  const theme = Wrapper.useTheme();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [payrollRequests, setPayrollRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    type: "Employee",
    entity: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    daysInMonth: 0,
    totalWorkingDays: 0,
    presentDays: 0,
    leaveDays: 0,
    absentDays: 0,
    basicSalary: 0,
    absenceDeduction: 0,
    loanDeduction: 0,
    bonuses: 0,
    netPay: 0,
  });
  const [requestFormData, setRequestFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const slipRef = useRef(null);

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const fetchEmployees = async () => {
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/employees`, {
        params: { status: "active" },
      });
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await Wrapper.axios.get(`${BASE_URL}/user/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      const response = await Wrapper.axios.get(`${BASE_URL}/payroll`, {
        params,
      });
      if (response.data.success) {
        setPayrolls(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load payrolls",
          "error"
        );
      }
    } catch (err) {
      console.error("Fetch payrolls error:", err);
      showNotification(
        err.response?.data?.message || "Failed to load payrolls",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      const response = await Wrapper.axios.get(
        `${BASE_URL}/payroll/request`,
        { params }
      );
      if (response.data.success) {
        setPayrollRequests(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load payroll requests",
          "error"
        );
      }
    } catch (err) {
      console.error("Fetch payroll requests error:", err);
      showNotification(
        err.response?.data?.message || "Failed to load payroll requests",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollPreview = async (type, entity, month, year) => {
    if (!type || !entity || !month || !year) return;
    setPreviewLoading(true);
    try {
      const params = { type, month, year };
      if (type === "Employee") params.employee = entity;
      else params.user = entity;
      const response = await Wrapper.axios.get(`${BASE_URL}/payroll/preview`, {
        params,
      });
      if (response.data.success) {
        const previewData = response.data.data;
        setFormData((prev) => ({
          ...prev,
          daysInMonth: previewData.daysInMonth || 0,
          totalWorkingDays: previewData.totalWorkingDays || 0,
          presentDays: previewData.presentDays || 0,
          leaveDays: previewData.leaveDays || 0,
          absentDays: previewData.absentDays || 0,
          basicSalary: previewData.basicSalary,
          absenceDeduction: previewData.absenceDeduction,
          loanDeduction: previewData.loanDeduction,
          bonuses: prev.bonuses || 0,
          netPay:
            previewData.basicSalary -
            previewData.absenceDeduction -
            previewData.loanDeduction +
            Number(prev.bonuses || 0),
        }));
      } else {
        showNotification(
          response.data.message || "Failed to fetch preview",
          "error"
        );
      }
    } catch (err) {
      console.error("Fetch preview error:", err);
      showNotification(
        err.response?.data?.message || "Failed to fetch preview",
        "error"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmitPayroll = async (payload) => {
    try {
      const submitPayload = {
        type: payload.type,
        month: payload.month,
        year: payload.year,
        absenceDeduction: Number(payload.absenceDeduction) || 0,
        bonuses: Number(payload.bonuses) || 0,
        loanDeduction: Number(payload.loanDeduction) || 0,
        basicSalary: Number(payload.basicSalary),
      };
      if (payload.type === "Employee") {
        submitPayload.employee = payload.entity;
        submitPayload.daysInMonth = payload.daysInMonth;
        submitPayload.totalWorkingDays = payload.totalWorkingDays;
        submitPayload.presentDays = payload.presentDays;
        submitPayload.leaveDays = payload.leaveDays;
        submitPayload.absentDays = payload.absentDays;
      } else {
        submitPayload.user = payload.entity;
      }
      const response = await Wrapper.axios.post(
        `${BASE_URL}/payroll`,
        submitPayload,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.success) {
        showNotification("Payroll generated", "success");
        setModalOpen(false);
        setFormData({
          type: "Employee",
          entity: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          daysInMonth: 0,
          totalWorkingDays: 0,
          presentDays: 0,
          leaveDays: 0,
          absentDays: 0,
          basicSalary: 0,
          absenceDeduction: 0,
          loanDeduction: 0,
          bonuses: 0,
          netPay: 0,
        });
        fetchPayrolls();
      } else {
        showNotification(
          response.data.message || "Failed to generate payroll",
          "error"
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      showNotification(
        err.response?.data?.message || "Failed to generate payroll",
        "error"
      );
    }
  };

  const handleSubmitPayrollRequest = async (payload) => {
    try {
      const response = await Wrapper.axios.post(
        `${BASE_URL}/payroll/request/create`,
        { month: payload.month, year: payload.year },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.data.success) {
        showNotification("Payroll request generated", "success");
        setRequestModalOpen(false);
        setRequestFormData({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
        fetchPayrollRequests();
      } else {
        showNotification(
          response.data.message || "Failed to generate payroll request",
          "error"
        );
      }
    } catch (err) {
      console.error("Submit payroll request error:", err);
      showNotification(
        err.response?.data?.message || "Failed to generate payroll request",
        "error"
      );
    }
  };

  const handlePrint = () => {
    const printContents = slipRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  useEffect(() => {
    fetchEmployees();
    fetchUsers();
    fetchPayrolls();
    fetchPayrollRequests();
  }, [filterMonth, filterYear]);

  useEffect(() => {
    if (formData.type && formData.entity && formData.month && formData.year) {
      fetchPayrollPreview(
        formData.type,
        formData.entity,
        formData.month,
        formData.year
      );
    }
  }, [formData.type, formData.entity, formData.month, formData.year]);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      if (
        [
          "type",
          "entity",
          "month",
          "year",
          "absenceDeduction",
          "bonuses",
        ].includes(name)
      ) {
        newData[name] = value;
        if (name === "type") {
          newData.entity = "";
          newData.daysInMonth = 0;
          newData.totalWorkingDays = 0;
          newData.presentDays = 0;
          newData.leaveDays = 0;
          newData.absentDays = 0;
          newData.basicSalary = 0;
          newData.absenceDeduction = 0;
          newData.loanDeduction = 0;
          newData.bonuses = 0;
          newData.netPay = 0;
        }
        if (["absenceDeduction", "bonuses"].includes(name)) {
          newData.netPay =
            Number(newData.basicSalary) -
            Number(
              name === "absenceDeduction" ? value : newData.absenceDeduction
            ) -
            Number(newData.loanDeduction) +
            Number(name === "bonuses" ? value : newData.bonuses);
        }
      }
      return newData;
    });
  };

  const handleRequestFieldChange = (name, value) => {
    setRequestFormData((prev) => ({ ...prev, [name]: value }));
  };

  const LoadingOverlay = ({ size = 20 }) => (
    <Wrapper.Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      }}
    >
      <Wrapper.CircularProgress
        size={size}
        sx={{ color: (theme) => theme.palette.primary.main }}
      />
    </Wrapper.Box>
  );

  const getFieldWithLoading = (field) => ({
    ...field,
    render: (props) => (
      <Wrapper.Box sx={{ position: "relative" }}>
        {field.type === "select" ? (
          <Wrapper.Select {...props} />
        ) : (
          <Wrapper.TextField {...props} />
        )}
        {previewLoading &&
          !["type", "entity", "month", "year"].includes(field.name) && (
            <LoadingOverlay />
          )}
      </Wrapper.Box>
    ),
  });

  const dynamicFields = payrollFields
    .map((field) => {
      if (field.name === "entity") {
        return {
          ...field,
          options:
            formData.type === "Employee"
              ? employees.map((emp) => ({
                  value: emp._id,
                  label: `${emp.firstName} ${emp.lastName}`,
                }))
              : users.map((user) => ({
                  value: user._id,
                  label: user.name,
                })),
        };
      }
      return getFieldWithLoading(field);
    })
    .filter((field) => !field.show || field.show(formData));

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
      {/* Header */}
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
          <Wrapper.Typography variant="h4" fontWeight="bold">
            Payroll Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Generate and manage payrolls and payroll requests
          </Wrapper.Typography>
        </Wrapper.Box>
        {tabValue === 0 && (
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => {
              setFormData({
                type: "Employee",
                entity: "",
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                daysInMonth: 0,
                totalWorkingDays: 0,
                presentDays: 0,
                leaveDays: 0,
                absentDays: 0,
                basicSalary: 0,
                absenceDeduction: 0,
                loanDeduction: 0,
                bonuses: 0,
                netPay: 0,
              });
              setModalOpen(true);
            }}
            sx={{
              borderRadius: 2,
              bgcolor: "#348d39",
              "&:hover": { bgcolor: "#2e7d32", transform: "translateY(-2px)" },
            }}
          >
            Generate Payroll
          </Wrapper.Button>
        )}
        {tabValue === 1 && (
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setRequestModalOpen(true)}
            sx={{
              borderRadius: 2,
              bgcolor: "#348d39",
              "&:hover": { bgcolor: "#2e7d32", transform: "translateY(-2px)" },
            }}
          >
            Generate Payroll Request
          </Wrapper.Button>
        )}
      </Wrapper.Box>

      {/* Tabs */}
      <Wrapper.Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 3 }}
      >
        <Wrapper.Tab label="Payrolls" />
        <Wrapper.Tab label="Payroll Requests" />
      </Wrapper.Tabs>

      {/* Filters */}
      <Wrapper.Box sx={{ mb: 3 }}>
        <Wrapper.Paper sx={{ p: 2 }}>
          <Wrapper.Typography variant="body1" sx={{ mb: 2 }}>
            Verify your identity by entering the email address associated with your account.
          </Wrapper.Typography>
          <Wrapper.Grid container spacing={2}>
            <Wrapper.Grid item xs={12} md={4}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Filter by Month</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <Wrapper.MenuItem value="">All Months</Wrapper.MenuItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Wrapper.MenuItem key={i + 1} value={i + 1}>
                      {moment().month(i).format("MMMM")}
                    </Wrapper.MenuItem>
                  ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} md={4}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel>Filter by Year</Wrapper.InputLabel>
                <Wrapper.Select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <Wrapper.MenuItem value="">All Years</Wrapper.MenuItem>
                  {Array.from({ length: 10 }, (_, i) => (
                    <Wrapper.MenuItem
                      key={i}
                      value={new Date().getFullYear() - i}
                    >
                      {new Date().getFullYear() - i}
                    </Wrapper.MenuItem>
                  ))}
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.Paper>
      </Wrapper.Box>

      {/* Payrolls Tab */}
      {tabValue === 0 && (
        <>
          {loading ? (
            <Wrapper.Skeleton variant="rectangular" height={300} />
          ) : payrolls.length === 0 ? (
            <Wrapper.Card sx={{ p: 4, textAlign: "center" }}>
              <Wrapper.Typography variant="h5">
                No Payrolls Found
              </Wrapper.Typography>
            </Wrapper.Card>
          ) : (
            <Wrapper.Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
              <Wrapper.TableContainer>
                <Wrapper.Table stickyHeader>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Name
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Type
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Month
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Year
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Basic Salary
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Absence Deduction
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Loan Deduction
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Bonuses
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Net Pay
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Finance Status
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Actions
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {payrolls.map((payroll) => (
                      <Wrapper.TableRow key={payroll._id}>
                        <Wrapper.TableCell>
                          {payroll.employee
                            ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
                            : payroll.user?.name || "-"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{payroll.type}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {moment()
                            .month(payroll.month - 1)
                            .format("MMMM")}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{payroll.year}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          PKR {(payroll.basicSalary || 0).toLocaleString()}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          PKR {(payroll.absenceDeduction || 0).toLocaleString()}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          PKR {(payroll.loanDeduction || 0).toLocaleString()}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          PKR {(payroll.bonuses || 0).toLocaleString()}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          PKR {payroll.netPay.toLocaleString()}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          <Wrapper.Chip
                            label={payroll.financeStatus}
                            color={
                              payroll.financeStatus === "Approved"
                                ? "success"
                                : payroll.financeStatus === "Rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                          />
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          <Wrapper.Button
                            variant="outlined"
                            size="small"
                            startIcon={<Wrapper.VisibilityIcon />}
                            onClick={() => {
                              setSelectedPayroll(payroll);
                              setSlipOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            View Slip
                          </Wrapper.Button>
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    ))}
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.TableContainer>
            </Wrapper.Paper>
          )}
        </>
      )}

      {/* Payroll Requests Tab */}
      {tabValue === 1 && (
        <>
          {loading ? (
            <Wrapper.Skeleton variant="rectangular" height={300} />
          ) : payrollRequests.length === 0 ? (
            <Wrapper.Card sx={{ p: 4, textAlign: "center" }}>
              <Wrapper.Typography variant="h5">
                No Payroll Requests Found
              </Wrapper.Typography>
            </Wrapper.Card>
          ) : (
            <Wrapper.Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
              <Wrapper.TableContainer>
                <Wrapper.Table stickyHeader>
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Month
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Year
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Total Amount (PKR)
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Status
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Created By
                      </Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Created At
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    {payrollRequests.map((request) => (
                      <Wrapper.TableRow key={request._id}>
                        <Wrapper.TableCell>
                          {moment()
                            .month(request.month - 1)
                            .format("MMMM")}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>{request.year}</Wrapper.TableCell>
                        <Wrapper.TableCell>
                          PKR {request.totalAmount.toLocaleString()}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          <Wrapper.Chip
                            label={request.status}
                            color={
                              request.status === "Approved"
                                ? "success"
                                : request.status === "Rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                          />
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {request.createdBy?.name || "-"}
                        </Wrapper.TableCell>
                        <Wrapper.TableCell>
                          {moment(request.createdAt).format("DD/MM/YYYY")}
                        </Wrapper.TableCell>
                      </Wrapper.TableRow>
                    ))}
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.TableContainer>
            </Wrapper.Paper>
          )}
        </>
      )}

      {/* Payroll Modal */}
      <ReusableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitPayroll}
        title="Generate Payroll"
        fields={dynamicFields}
        initialData={formData}
        values={formData}
        submitButtonText="Generate"
        onFieldChange={handleFieldChange}
        loading={loading || previewLoading}
      />

      {/* Payroll Request Modal */}
      <ReusableModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleSubmitPayrollRequest}
        title="Generate Payroll Request"
        fields={payrollRequestFields}
        initialData={requestFormData}
        values={requestFormData}
        submitButtonText="Generate Request"
        onFieldChange={handleRequestFieldChange}
        loading={loading}
      />

      {/* Payroll Slip Modal */}
      <Wrapper.Dialog
        open={slipOpen}
        onClose={() => setSlipOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>
          <Wrapper.Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Wrapper.Typography variant="h6">Payroll Slip</Wrapper.Typography>
            <Wrapper.Button
              variant="contained"
              startIcon={<Wrapper.PrintIcon />}
              onClick={handlePrint}
              sx={{ bgcolor: "#348d39", "&:hover": { bgcolor: "#2e7d32" } }}
            >
              Print
            </Wrapper.Button>
          </Wrapper.Box>
        </Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Box
            ref={slipRef}
            sx={{
              p: 3,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              bgcolor: "#fff",
              fontFamily: "Arial, sans-serif",
              "@media print": {
                p: 0,
                border: "none",
                boxShadow: "none",
              },
            }}
          >
            {/* Header */}
            <Wrapper.Box sx={{ textAlign: "center", mb: 3 }}>
              <Wrapper.Box sx={{ alignContent: "center" }}>
                <img src={erp} width={200} alt="" />
              </Wrapper.Box>
              <Wrapper.Typography variant="h6">Payroll Slip</Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                {selectedPayroll
                  ? `${moment()
                      .month(selectedPayroll.month - 1)
                      .format("MMMM")} ${selectedPayroll.year}`
                  : ""}
              </Wrapper.Typography>
            </Wrapper.Box>

            {/* Entity Details */}
            <Wrapper.Box sx={{ mb: 3 }}>
              <Wrapper.Typography variant="subtitle1" fontWeight="bold">
                {selectedPayroll?.type} Details
              </Wrapper.Typography>
              <Wrapper.Box sx={{ mt: 1 }}>
                <Wrapper.Typography>
                  <strong>Name:</strong>{" "}
                  {selectedPayroll?.employee
                    ? `${selectedPayroll.employee.firstName} ${selectedPayroll.employee.lastName}`
                    : selectedPayroll?.user?.name || "-"}
                </Wrapper.Typography>
                <Wrapper.Typography>
                  <strong>
                    {selectedPayroll?.type === "Employee"
                      ? "Department"
                      : "Role"}
                    :
                  </strong>{" "}
                  {selectedPayroll?.employee?.department ||
                    selectedPayroll?.user?.role ||
                    "-"}
                </Wrapper.Typography>
                {selectedPayroll?.type === "Employee" && (
                  <Wrapper.Typography>
                    <strong>Designation:</strong>{" "}
                    {selectedPayroll?.employee?.designation || "-"}
                  </Wrapper.Typography>
                )}
              </Wrapper.Box>
            </Wrapper.Box>

            {/* Payroll Details */}
            <Wrapper.Box sx={{ mb: 3 }}>
              <Wrapper.Typography variant="subtitle1" fontWeight="bold">
                Payroll Details
              </Wrapper.Typography>
              <Wrapper.TableContainer sx={{ mt: 1 }}>
                <Wrapper.Table size="small">
                  <Wrapper.TableHead>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Description
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{ fontWeight: "bold", textAlign: "right" }}
                      >
                        Amount (PKR)
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableHead>
                  <Wrapper.TableBody>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>Basic Salary</Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ textAlign: "right" }}>
                        {(selectedPayroll?.basicSalary || 0).toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>Bonuses</Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ textAlign: "right" }}>
                        {(selectedPayroll?.bonuses || 0).toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>Absence Deduction</Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ textAlign: "right" }}>
                        -{" "}
                        {(
                          selectedPayroll?.absenceDeduction || 0
                        ).toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell>Loan Deduction</Wrapper.TableCell>
                      <Wrapper.TableCell sx={{ textAlign: "right" }}>
                        -{" "}
                        {(selectedPayroll?.loanDeduction || 0).toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                    <Wrapper.TableRow>
                      <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                        Net Pay
                      </Wrapper.TableCell>
                      <Wrapper.TableCell
                        sx={{ fontWeight: "bold", textAlign: "right" }}
                      >
                        {(selectedPayroll?.netPay || 0).toLocaleString()}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  </Wrapper.TableBody>
                </Wrapper.Table>
              </Wrapper.TableContainer>
            </Wrapper.Box>

            {/* Attendance Details (Employee only) */}
            {selectedPayroll?.type === "Employee" && (
              <Wrapper.Box sx={{ mb: 3 }}>
                <Wrapper.Typography variant="subtitle1" fontWeight="bold">
                  Attendance Details
                </Wrapper.Typography>
                <Wrapper.Box sx={{ mt: 1 }}>
                  <Wrapper.Typography>
                    <strong>Days in Month:</strong>{" "}
                    {selectedPayroll?.daysInMonth || 0}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Total Working Days:</strong>{" "}
                    {selectedPayroll?.totalWorkingDays || 0}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Present Days:</strong>{" "}
                    {selectedPayroll?.presentDays || 0}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Leave Days:</strong>{" "}
                    {selectedPayroll?.leaveDays || 0}
                  </Wrapper.Typography>
                  <Wrapper.Typography>
                    <strong>Absent Days:</strong>{" "}
                    {selectedPayroll?.absentDays || 0}
                  </Wrapper.Typography>
                </Wrapper.Box>
              </Wrapper.Box>
            )}

            {/* Footer */}
            <Wrapper.Box
              sx={{
                textAlign: "center",
                borderTop: "1px solid #e0e0e0",
                pt: 2,
              }}
            >
              <Wrapper.Typography variant="body2">
                Your Company Name
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                Your Company Address
              </Wrapper.Typography>
              <Wrapper.Typography variant="body2">
                Generated on {moment().format("DD/MM/YYYY")}
              </Wrapper.Typography>
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button onClick={() => setSlipOpen(false)}>
            Close
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>

      {/* Notification */}
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

export default Payroll;
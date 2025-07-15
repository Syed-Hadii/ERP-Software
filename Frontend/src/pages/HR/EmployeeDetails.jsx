import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import moment from "moment";

const EmployeeDetails = () => {
  const theme = Wrapper.useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/employees/${id}`);
      if (response.data.success) {
        console.log(response.data);
        setEmployeeData(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load employee details",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to load employee details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Wrapper.Typography variant="h4" fontWeight="bold">
          Employee Details
        </Wrapper.Typography>
        <Wrapper.Button
          variant="outlined"
          color="primary"
          startIcon={<Wrapper.ArrowBackIcon />}
          onClick={() => navigate("/employee")}
          sx={{
            borderRadius: 2,
            borderColor: "primary.main",
            "&:hover": {
              bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          Back to Employees
        </Wrapper.Button>
      </Wrapper.Box>

      {loading ? (
        <>
          <Wrapper.Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
          <Wrapper.Skeleton variant="rectangular" height={300} />
        </>
      ) : !employeeData ? (
        <Wrapper.Card sx={{ p: 4, textAlign: "center" }}>
          <Wrapper.Typography variant="h5">No Data Found</Wrapper.Typography>
        </Wrapper.Card>
      ) : (
        <>
          {/* Employee Info Card */}
          <Wrapper.Card
            sx={{
              borderRadius: 2,
              boxShadow: 2,
              borderLeft: "4px solid",
              borderColor: "#10b981",
              mb: 4,
            }}
          >
            <Wrapper.CardContent sx={{ p: 3 }}>
              <Wrapper.Typography variant="h5" fontWeight="bold" gutterBottom>
                {employeeData.employee.firstName}{" "}
                {employeeData.employee.lastName}
              </Wrapper.Typography>
              <Wrapper.Grid container spacing={2}>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Email:</strong> {employeeData.employee.email}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Phone:</strong> {employeeData.employee.phone || "-"}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Department:</strong>{" "}
                    {employeeData.employee.department}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Designation:</strong>{" "}
                    {employeeData.employee.designation}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Initial Salary:</strong> PKR
                    {employeeData.employee.initialSalary}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Basic Salary:</strong> PKR
                    {employeeData.employee.basicSalary}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Join Date:</strong>{" "}
                    {moment(employeeData.employee.joinDate).format(
                      "DD/MM/YYYY"
                    )}
                  </Wrapper.Typography>
                </Wrapper.Grid>
                <Wrapper.Grid item xs={12} sm={6}>
                  <Wrapper.Typography variant="body1">
                    <strong>Status:</strong>{" "}
                    <Wrapper.Chip
                      label={employeeData.employee.status}
                      color={
                        employeeData.employee.status === "active"
                          ? "success"
                          : "warning"
                      }
                      size="small"
                    />
                  </Wrapper.Typography>
                </Wrapper.Grid>
              </Wrapper.Grid>
            </Wrapper.CardContent>
          </Wrapper.Card>

          {/* Attendance Table */}
          <Wrapper.Card sx={{ mb: 4 }}>
            <Wrapper.CardHeader title="Attendance Records" />
            <Wrapper.TableContainer>
              <Wrapper.Table stickyHeader>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Date
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Status
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {employeeData.attendance.map((record) => (
                    <Wrapper.TableRow key={record._id}>
                      <Wrapper.TableCell>
                        {moment(record.date).format("DD/MM/YYYY")}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {record.status || "-"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
          </Wrapper.Card>

          {/* Loans Table */}
          <Wrapper.Card sx={{ mb: 4 }}>
            <Wrapper.CardHeader title="Loans" />
            <Wrapper.TableContainer>
              <Wrapper.Table stickyHeader>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Date
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Loan Amount
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Installments Paid
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Status
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {employeeData.loans.map((loan) => (
                    <Wrapper.TableRow key={loan._id}>
                      <Wrapper.TableCell>
                        {moment(loan.date).format("DD/MM/YYYY")}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        PKR {loan.totalAmount || "-"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {loan.installmentsPaid || "-"}/
                        {loan.totalInstallments || "-"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {loan.isPaid || "-"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
          </Wrapper.Card>

          {/* Payrolls Table */}
          <Wrapper.Card sx={{ mb: 4 }}>
            <Wrapper.CardHeader title="Payroll Records" />
            <Wrapper.TableContainer>
              <Wrapper.Table stickyHeader>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Date
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Amount
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Type
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {employeeData.payrolls.map((payroll) => (
                    <Wrapper.TableRow key={payroll._id}>
                      <Wrapper.TableCell>
                        {moment(payroll.date).format("DD/MM/YYYY")}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        PKR {payroll.amount || "-"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {payroll.type || "-"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
          </Wrapper.Card>

          {/* Increments Table */}
          <Wrapper.Card sx={{ mb: 4 }}>
            <Wrapper.CardHeader title="Salary Increments" />
            <Wrapper.TableContainer>
              <Wrapper.Table stickyHeader>
                <Wrapper.TableHead>
                  <Wrapper.TableRow>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Date
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Amount
                    </Wrapper.TableCell>
                    <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                      Remarks
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                </Wrapper.TableHead>
                <Wrapper.TableBody>
                  {employeeData.increments.map((increment) => (
                    <Wrapper.TableRow key={increment._id}>
                      <Wrapper.TableCell>
                        {moment(increment.date).format("DD/MM/YYYY")}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        PKR {increment.amount || "-"}
                      </Wrapper.TableCell>
                      <Wrapper.TableCell>
                        {increment.remarks || "-"}
                      </Wrapper.TableCell>
                    </Wrapper.TableRow>
                  ))}
                </Wrapper.TableBody>
              </Wrapper.Table>
            </Wrapper.TableContainer>
          </Wrapper.Card>
        </>
      )}

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

export default EmployeeDetails;

import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import moment from "moment";

const Attendance = () => {
  const theme = Wrapper.useTheme();
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [filterDate, setFilterDate] = useState(moment().format("YYYY-MM-DD"));
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

  const fetchAttendance = async (date) => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/attendance`, {
        params: { date },
      });
      if (response.data.success) {
        setAttendanceData(response.data.data);
      } else {
        showNotification(
          response.data.message || "Failed to load attendance",
          "error"
        );
      }
    } catch (err) {
      console.error("Fetch attendance error:", err);
      showNotification("Failed to load attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(filterDate);
  }, [filterDate]);

  const handleMarkAttendance = async (employeeId, status) => {
    try {
      const payload = {
        employeeId,
        date: filterDate,
        status,
      };
      const response = await Wrapper.axios.post(
        `${BASE_URL}/attendance`,
        payload
      );
      if (response.data.success) {
        showNotification(
          response.data.message || "Attendance marked",
          "success"
        );
        fetchAttendance(filterDate); // Refresh table
      } else {
        showNotification(
          response.data.message || "Failed to mark attendance",
          "error"
        );
      }
    } catch (err) {
      console.error("Mark attendance error:", err);
      showNotification(
        err.response?.data?.message || "Failed to mark attendance",
        "error"
      );
    }
  };

  const handleDateFilterSubmit = () => {
    setFilterDate(selectedDate);
  };

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
          <Wrapper.Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              position: "relative",
              "&:after": {
                content: '""',
                position: "absolute",
                bottom: "-8px",
                left: 0,
                width: "40px",
                height: "4px",
                bgcolor: "#10b981",
                borderRadius: "2px",
              },
            }}
          >
            Attendance Management
          </Wrapper.Typography>
          <Wrapper.Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Mark and view employee attendance
          </Wrapper.Typography>
        </Wrapper.Box>
      </Wrapper.Box>

      {/* Date Filter */}
      <Wrapper.Box sx={{ mb: 3 }}>
        <Wrapper.Paper sx={{ p: 2 }}>
          <Wrapper.Grid container spacing={2} alignItems="center">
            <Wrapper.Grid item xs={12} sm={4} md={3}>
              <Wrapper.TextField
                fullWidth
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": { borderColor: "#2e7d32" },
                    "&:hover fieldset": { borderColor: "#2e7d32" },
                    "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
                  },
                }}
              />
            </Wrapper.Grid>
            <Wrapper.Grid item xs={12} sm={4} md={2}>
              <Wrapper.Button
                variant="contained"
                onClick={handleDateFilterSubmit}
                fullWidth
                sx={{
                  borderRadius: 2,
                  bgcolor: "#348d39",
                  "&:hover": {
                    bgcolor: "#2e7d32",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s",
                  },
                  boxShadow: 2,
                }}
              >
                Filter
              </Wrapper.Button>
            </Wrapper.Grid>
          </Wrapper.Grid>
        </Wrapper.Paper>
      </Wrapper.Box>

      {/* Table or Loading */}
      {loading ? (
        <>
          <Wrapper.Skeleton variant="text" />
          <Wrapper.Skeleton variant="rectangular" height={300} />
        </>
      ) : attendanceData.length === 0 ? (
        <Wrapper.Card
          sx={{
            p: 6,
            borderRadius: 2,
            textAlign: "center",
            bgcolor: Wrapper.alpha(theme.palette.background.paper, 0.7),
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Wrapper.EventIcon
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Wrapper.Typography variant="h5" gutterBottom>
            No Employees Found
          </Wrapper.Typography>
          <Wrapper.Typography color="text.secondary" sx={{ mb: 2 }}>
            No active employees available for the selected date
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            startIcon={<Wrapper.RefreshIcon />}
            onClick={() => fetchAttendance(filterDate)}
            sx={{
              borderRadius: 2,
              bgcolor: "#348d39",
              "&:hover": { bgcolor: "#2e7d32" },
            }}
          >
            Refresh
          </Wrapper.Button>
        </Wrapper.Card>
      ) : (
        <Wrapper.Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
          <Wrapper.TableContainer
            sx={{
              maxHeight: "calc(100vh - 350px)",
              "&::-webkit-scrollbar": { width: "8px", height: "8px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: Wrapper.alpha(theme.palette.primary.main, 0.2),
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: Wrapper.alpha(
                  theme.palette.primary.main,
                  0.05
                ),
              },
            }}
          >
            <Wrapper.Table stickyHeader>
              <Wrapper.TableHead>
                <Wrapper.TableRow>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Name
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Department
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Designation
                  </Wrapper.TableCell>
                  <Wrapper.TableCell sx={{ fontWeight: "bold" }}>
                    Mark Attendance/Status
                  </Wrapper.TableCell>
                </Wrapper.TableRow>
              </Wrapper.TableHead>
              <Wrapper.TableBody>
                {attendanceData.map((record) => (
                  <Wrapper.TableRow
                    key={record.employeeId}
                    hover
                    sx={{
                      "&:hover": {
                        bgcolor: Wrapper.alpha(
                          theme.palette.primary.main,
                          0.04
                        ),
                      },
                    }}
                  >
                    <Wrapper.TableCell>{record.name}</Wrapper.TableCell>
                    <Wrapper.TableCell>{record.department}</Wrapper.TableCell>
                    <Wrapper.TableCell>{record.designation}</Wrapper.TableCell>
                    <Wrapper.TableCell>
                      {record.status ? (
                        <Wrapper.Chip
                          label={record.status}
                          color={
                            record.status === "Present"
                              ? "success"
                              : record.status === "Absent"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      ) : (
                        <Wrapper.Box sx={{ display: "flex", gap: 1 }}>
                          <Wrapper.Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              handleMarkAttendance(record.employeeId, "Present")
                            }
                            sx={{
                              bgcolor: "#4caf50",
                              "&:hover": { bgcolor: "#388e3c" },
                              borderRadius: 1,
                            }}
                          >
                            Present
                          </Wrapper.Button>
                          <Wrapper.Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              handleMarkAttendance(record.employeeId, "Absent")
                            }
                            sx={{
                              bgcolor: "#f44336",
                              "&:hover": { bgcolor: "#d32f2f" },
                              borderRadius: 1,
                            }}
                          >
                            Absent
                          </Wrapper.Button>
                          <Wrapper.Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              handleMarkAttendance(record.employeeId, "Leave")
                            }
                            sx={{
                              bgcolor: "#ff9800",
                              "&:hover": { bgcolor: "#f57c00" },
                              borderRadius: 1,
                            }}
                          >
                            Leave
                          </Wrapper.Button>
                        </Wrapper.Box>
                      )}
                    </Wrapper.TableCell>
                  </Wrapper.TableRow>
                ))}
              </Wrapper.TableBody>
            </Wrapper.Table>
          </Wrapper.TableContainer>
        </Wrapper.Paper>
      )}

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

export default Attendance;

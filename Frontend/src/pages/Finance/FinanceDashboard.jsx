import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [closingInProgress, setClosingInProgress] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/finance-dashboard/dashboard`
      );
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to fetch dashboard data"
        );
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      Wrapper.toast.error("Failed to fetch dashboard data");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction details
  const fetchTransactionDetails = async (id) => {
    try {
      const response = await Wrapper.axios.get(
        `${BASE_URL}/finance-dashboard/transaction/${id}`
      );
      if (response.data.success) {
        setTransactionDetails(response.data.data);
        setModalOpen(true);
      } else {
        Wrapper.toast.error(
          response.data.message || "Failed to fetch transaction details"
        );
      }
    } catch (err) {
      console.error("Error fetching transaction details:", err);
      Wrapper.toast.error("Failed to fetch transaction details");
    }
  };

  const handleClosePeriod = async (e) => {
    e.preventDefault();
    setClosingInProgress(true);
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/closePeriod`, {
        periodEndDate,
      });
      if (response.data.success) {
        Wrapper.toast.success("Period closed successfully");
        setClosingModalOpen(false);
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        Wrapper.toast.error(response.data.message || "Failed to close period");
      }
    } catch (err) {
      console.error("Error closing period:", err);
      Wrapper.toast.error(
        err.response?.data?.message || "Failed to close period"
      );
    } finally {
      setClosingInProgress(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Chart data for category breakdown
  const chartData = {
    labels: dashboardData?.categoryBreakdown?.map((cat) => cat.category) || [],
    datasets: [
      {
        label: "Balance (PKR)",
        data: dashboardData?.categoryBreakdown?.map((cat) => cat.total) || [],
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Account Category Breakdown" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `PKR ${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <Wrapper.Box className="bg-gray-50 min-h-screen p-4 md:p-6 transition-all duration-300">
      {/* Dashboard Header */}
      <Wrapper.Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Wrapper.Typography variant="h4" component="h1" fontWeight="bold">
          Financial Dashboard
        </Wrapper.Typography>
        <Wrapper.Button
          variant="contained"
          onClick={() => setClosingModalOpen(true)}
          sx={{
            bgcolor: "#348d39",
            "&:hover": { bgcolor: "#2e7d32" },
          }}
        >
          Close Period
        </Wrapper.Button>
      </Wrapper.Box>

      <Wrapper.Paper className="p-6 mb-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <Wrapper.Typography
          variant="h4"
          className="font-semibold text-gray-900 mb-4"
        >
          Finance Dashboard
        </Wrapper.Typography>

        {/* Summary Cards */}
        {loading ? (
          <Wrapper.Grid container spacing={3}>
            {[...Array(5)].map((_, i) => (
              <Wrapper.Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                <Wrapper.Skeleton
                  variant="rectangular"
                  height={120}
                  className="rounded-lg"
                />
              </Wrapper.Grid>
            ))}
          </Wrapper.Grid>
        ) : (
          <Wrapper.Grid container spacing={3}>
            {[
              {
                label: "Total Assets",
                value: dashboardData?.summary.totalAssets || 0,
              },
              {
                label: "Total Liabilities",
                value: dashboardData?.summary.totalLiabilities || 0,
              },
              {
                label: "Total Equity",
                value: dashboardData?.summary.totalEquity || 0,
              },
              {
                label: "Net Income",
                value: dashboardData?.summary.netIncome || 0,
              },
              {
                label: "Total Bank Balance",
                value: dashboardData?.summary.totalBankBalance || 0,
              },
            ].map((item, index) => (
              <Wrapper.Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                <Wrapper.Paper className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <Wrapper.Typography className="text-gray-600 text-sm font-medium">
                    {item.label}
                  </Wrapper.Typography>
                  <Wrapper.Typography className="text-2xl font-semibold text-emerald-600 mt-2">
                    PKR {item.value.toLocaleString()}
                  </Wrapper.Typography>
                </Wrapper.Paper>
              </Wrapper.Grid>
            ))}
          </Wrapper.Grid>
        )}
      </Wrapper.Paper>

      {/* Bank Accounts and Category Breakdown */}
      <Wrapper.Grid container spacing={3}>
        {/* Bank Accounts Table */}
        <Wrapper.Grid item xs={12} lg={6}>
          <Wrapper.Paper className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <Wrapper.Typography
              variant="h6"
              className="font-semibold text-gray-900 mb-4"
            >
              Bank Accounts
            </Wrapper.Typography>
            {loading ? (
              <Wrapper.Skeleton
                variant="rectangular"
                height={200}
                className="rounded-lg"
              />
            ) : (
              <Wrapper.Box className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600">
                  <thead>
                    <tr className="bg-gray-100 text-xs font-semibold uppercase">
                      <th className="p-3 text-left">Bank Name</th>
                      <th className="p-3 text-left">Account Title</th>
                      <th className="p-3 text-left">Account Number</th>
                      <th className="p-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.bankAccounts?.length > 0 ? (
                      dashboardData.bankAccounts.map((bank, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="p-3">{bank.bankName}</td>
                          <td className="p-3">{bank.accountTitle}</td>
                          <td className="p-3">{bank.accountNumber}</td>
                          <td className="p-3 text-right text-emerald-600">
                            PKR {bank.currentBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-3 text-center text-gray-600"
                        >
                          No bank accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Wrapper.Box>
            )}
          </Wrapper.Paper>
        </Wrapper.Grid>

        {/* Category Breakdown Chart */}
        <Wrapper.Grid item xs={12} lg={6}>
          <Wrapper.Paper className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <Wrapper.Typography
              variant="h6"
              className="font-semibold text-gray-900 mb-4"
            >
              Category Breakdown
            </Wrapper.Typography>
            {loading ? (
              <Wrapper.Skeleton
                variant="rectangular"
                height={300}
                className="rounded-lg"
              />
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </Wrapper.Paper>
        </Wrapper.Grid>
      </Wrapper.Grid>

      {/* Recent Transactions */}
      <Wrapper.Paper className="p-6 mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <Wrapper.Typography
          variant="h6"
          className="font-semibold text-gray-900 mb-4"
        >
          Recent Transactions
        </Wrapper.Typography>
        {loading ? (
          <Wrapper.Skeleton
            variant="rectangular"
            height={200}
            className="rounded-lg"
          />
        ) : (
          <Wrapper.Box className="overflow-x-auto">
            <table className="w-full text-sm text-gray-600">
              <thead>
                <tr className="bg-gray-100 text-xs font-semibold uppercase">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Reference</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.recentTransactions?.length > 0 ? (
                  dashboardData.recentTransactions.map((tx, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => fetchTransactionDetails(tx.id)}
                    >
                      <td className="p-3">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">{tx.type}</td>
                      <td className="p-3">{tx.reference}</td>
                      <td className="p-3">{tx.description}</td>
                      <td className="p-3 text-right text-emerald-600">
                        PKR {tx.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">{tx.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-gray-600">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Wrapper.Box>
        )}
      </Wrapper.Paper>

      {/* Transaction Details Modal */}
      {modalOpen && transactionDetails && (
        <Wrapper.Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
          <Wrapper.DialogTitle className="font-semibold text-gray-900">
            Transaction Details
          </Wrapper.DialogTitle>
          <Wrapper.DialogContent>
            <Wrapper.Box className="space-y-4">
              <Wrapper.Typography className="text-gray-600">
                <strong>Date:</strong>{" "}
                {new Date(transactionDetails.date).toLocaleDateString()}
              </Wrapper.Typography>
              <Wrapper.Typography className="text-gray-600">
                <strong>Type:</strong> {transactionDetails.type}
              </Wrapper.Typography>
              <Wrapper.Typography className="text-gray-600">
                <strong>Reference:</strong> {transactionDetails.reference}
              </Wrapper.Typography>
              <Wrapper.Typography className="text-gray-600">
                <strong>Description:</strong> {transactionDetails.description}
              </Wrapper.Typography>
              <Wrapper.Typography className="text-gray-600">
                <strong>Payment Method:</strong>{" "}
                {transactionDetails.paymentMethod}
              </Wrapper.Typography>
              {transactionDetails.bankAccount && (
                <Wrapper.Typography className="text-gray-600">
                  <strong>Bank Account:</strong>{" "}
                  {transactionDetails.bankAccount.bankName} (
                  {transactionDetails.bankAccount.accountNumber})
                </Wrapper.Typography>
              )}
              {transactionDetails.cashAccount && (
                <Wrapper.Typography className="text-gray-600">
                  <strong>Cash Account:</strong>{" "}
                  {transactionDetails.cashAccount}
                </Wrapper.Typography>
              )}
              <Wrapper.Typography className="text-gray-600">
                <strong>Party:</strong> {transactionDetails.party}
              </Wrapper.Typography>
              <Wrapper.Typography className="text-gray-600">
                <strong>Total Amount:</strong> PKR{" "}
                {transactionDetails.totalAmount.toLocaleString()}
              </Wrapper.Typography>
              <Wrapper.Typography className="text-gray-600">
                <strong>Status:</strong> {transactionDetails.status}
              </Wrapper.Typography>
              <Wrapper.Typography className="font-semibold text-gray-900 mt-4">
                Accounts Involved
              </Wrapper.Typography>
              <table className="w-full text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-100 text-xs font-semibold uppercase">
                    <th className="p-2 text-left">Account</th>
                    <th className="p-2 text-right">Debit</th>
                    <th className="p-2 text-right">Credit</th>
                    <th className="p-2 text-left">Narration</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionDetails.accounts.map((acc, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="p-2">{acc.accountName}</td>
                      <td className="p-2 text-right text-emerald-600">
                        {acc.debit ? `PKR ${acc.debit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {acc.credit
                          ? `PKR ${acc.credit.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="p-2">{acc.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Wrapper.Box>
          </Wrapper.DialogContent>
          <Wrapper.DialogActions>
            <Wrapper.Button
              onClick={() => setModalOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2 px-4"
            >
              Close
            </Wrapper.Button>
          </Wrapper.DialogActions>
        </Wrapper.Dialog>
      )}

      {/* Period Closing Modal */}
      <Wrapper.Dialog
        open={closingModalOpen}
        onClose={() => !closingInProgress && setClosingModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleClosePeriod}>
          <Wrapper.DialogTitle>Close Accounting Period</Wrapper.DialogTitle>
          <Wrapper.DialogContent>
            <Wrapper.Alert severity="warning" sx={{ mb: 2 }}>
              This action will close the accounting period and cannot be undone.
              Make sure all transactions for the period have been recorded.
            </Wrapper.Alert>
            <Wrapper.TextField
              fullWidth
              label="Period End Date"
              type="date"
              value={periodEndDate}
              onChange={(e) => setPeriodEndDate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
              inputProps={{
                max: new Date().toISOString().split("T")[0], // Prevent future dates
              }}
            />
          </Wrapper.DialogContent>
          <Wrapper.DialogActions>
            <Wrapper.Button
              onClick={() => setClosingModalOpen(false)}
              disabled={closingInProgress}
            >
              Cancel
            </Wrapper.Button>
            <Wrapper.Button
              type="submit"
              variant="contained"
              disabled={closingInProgress || !periodEndDate}
              sx={{
                bgcolor: "#348d39",
                "&:hover": { bgcolor: "#2e7d32" },
              }}
            >
              {closingInProgress ? "Closing..." : "Close Period"}
            </Wrapper.Button>
          </Wrapper.DialogActions>
        </form>
      </Wrapper.Dialog>
    </Wrapper.Box>
  );
};

export default FinanceDashboard;

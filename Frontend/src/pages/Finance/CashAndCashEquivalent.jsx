import React, { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import { useNavigate } from "react-router-dom";

const CashBankSummary = () => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await Wrapper.axios.get(`${BASE_URL}/bank/summary`);
      console.log("Summary response:", response.data);
      if (response.data.success) {
        setSummaryData(response.data);
      } else {
        Wrapper.toast.error(response.data.message || "Failed to fetch summary");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      Wrapper.toast.error("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <Wrapper.Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
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
        <Wrapper.Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: "#111827",
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Wrapper.AccountBalanceIcon
            sx={{ mr: 1, color: "#4b5563", fontSize: "1.75rem" }}
          />
          Cash and Bank Summary
        </Wrapper.Typography>
      </Wrapper.Paper>

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
        <>
          {/* Cash Accounts */}
          <Wrapper.Paper
            elevation={0}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              mb: 3,
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
                sx={{ fontWeight: 600, color: "#111827" }}
              >
                Cash Accounts
              </Wrapper.Typography>
              <Wrapper.Typography sx={{ color: "#6b7280" }}>
                Total: PKR {summaryData?.totalCash?.toLocaleString() || 0}
              </Wrapper.Typography>
            </Wrapper.Box>
            <Wrapper.Box sx={{ p: 1 }}>
              <Wrapper.Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
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
                <Wrapper.Typography>Balance</Wrapper.Typography>
                <Wrapper.Typography sx={{ textAlign: "right" }}>
                  Actions
                </Wrapper.Typography>
              </Wrapper.Box>
              {summaryData?.cashAccounts?.length > 0 ? (
                summaryData.cashAccounts.map((account) => (
                  <Wrapper.Box
                    key={account._id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr",
                      p: 1.5,
                      borderBottom: "1px solid #e5e7eb",
                      "&:hover": { backgroundColor: "#f1f5f9" },
                    }}
                  >
                    <Wrapper.Typography sx={{ fontSize: "0.875rem" }}>
                      {account.name}
                    </Wrapper.Typography>
                    <Wrapper.Typography
                      sx={{
                        fontSize: "0.875rem",
                        color:
                          account.currentBalance >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      PKR {account.currentBalance?.toLocaleString() || 0}
                    </Wrapper.Typography>
                    <Wrapper.Box
                      sx={{ display: "flex", justifyContent: "flex-end" }}
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
                    </Wrapper.Box>
                  </Wrapper.Box>
                ))
              ) : (
                <Wrapper.Typography
                  sx={{ color: "#6b7280", textAlign: "center", py: 2 }}
                >
                  No cash accounts found
                </Wrapper.Typography>
              )}
            </Wrapper.Box>
          </Wrapper.Paper>

          {/* Bank Accounts */}
          <Wrapper.Paper
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
                sx={{ fontWeight: 600, color: "#111827" }}
              >
                Bank Accounts
              </Wrapper.Typography>
              <Wrapper.Typography sx={{ color: "#6b7280" }}>
                Total: PKR {summaryData?.totalBank?.toLocaleString() || 0}
              </Wrapper.Typography>
            </Wrapper.Box>
            <Wrapper.Box sx={{ p: 1 }}>
              <Wrapper.Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  p: 1,
                  backgroundColor: "#f3f4f6",
                  fontWeight: 600,
                  color: "#4b5563",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Wrapper.Typography>Account Title</Wrapper.Typography>
                <Wrapper.Typography>Bank Name</Wrapper.Typography>
                <Wrapper.Typography>Balance</Wrapper.Typography>
                <Wrapper.Typography sx={{ textAlign: "right" }}>
                  Actions
                </Wrapper.Typography>
              </Wrapper.Box>
              {summaryData?.bankAccounts?.length > 0 ? (
                summaryData.bankAccounts.map((account) => (
                  <Wrapper.Box
                    key={account._id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      p: 1.5,
                      borderBottom: "1px solid #e5e7eb",
                      "&:hover": { backgroundColor: "#f1f5f9" },
                    }}
                  >
                    <Wrapper.Typography sx={{ fontSize: "0.875rem" }}>
                      {account.accountTitle} ({account.accountNumber})
                    </Wrapper.Typography>
                    <Wrapper.Typography sx={{ fontSize: "0.875rem" }}>
                      {account.bankName}
                    </Wrapper.Typography>
                    <Wrapper.Typography
                      sx={{
                        fontSize: "0.875rem",
                        color:
                          account.currentBalance >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      PKR {account.currentBalance?.toLocaleString() || 0}
                    </Wrapper.Typography>
                    <Wrapper.Box
                      sx={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <Wrapper.Tooltip title="View Ledger">
                        <Wrapper.IconButton
                          size="small"
                          sx={{ color: "#3b82f6" }}
                          onClick={() =>
                            navigate(`/bank-ledger/${account._id}`)
                          }
                        >
                          <Wrapper.VisibilityIcon fontSize="small" />
                        </Wrapper.IconButton>
                      </Wrapper.Tooltip>
                    </Wrapper.Box>
                  </Wrapper.Box>
                ))
              ) : (
                <Wrapper.Typography
                  sx={{ color: "#6b7280", textAlign: "center", py: 2 }}
                >
                  No bank accounts found
                </Wrapper.Typography>
              )}
            </Wrapper.Box>
          </Wrapper.Paper>
        </>
      )}
    </Wrapper.Box>
  );
};

export default CashBankSummary;

"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Skeleton,
} from "@mui/material";
import {
  AccountTree,
  CalendarToday,
  TrendingUp,
  TrendingDown,
  ArrowBack,
  Receipt,
  AccountBalance,
  FilterList,
  Assessment,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";

const CoaLedger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...(dateFilter.startDate && { startDate: dateFilter.startDate }),
        ...(dateFilter.endDate && { endDate: dateFilter.endDate }),
      }).toString();
      const response = await Wrapper.axios.get(
        `${BASE_URL}/chartaccount/ledger/${id}?${query}`
      );
      if (response.data.success) {
        setLedgerData(response.data);
      } else {
        Wrapper.toast.error(response.data.message || "Failed to fetch ledger");
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      Wrapper.toast.error("Failed to fetch ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id, dateFilter.startDate, dateFilter.endDate]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      Sale: "success",
      Purchase: "warning",
      Payment: "error",
      Receipt: "info",
      Journal: "default",
    };
    return colors[type] || "default";
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };
  console.log(ledgerData);
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-[#2E7D32] to-[#388E3C] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AccountTree className="text-3xl" />
                  <div>
                    <Typography variant="h4" className="font-bold">
                      Chart of Accounts Ledger
                    </Typography>
                    <Typography variant="subtitle1" className="opacity-90">
                      {ledgerData?.account || "Loading account details..."}
                    </Typography>
                  </div>
                </div>
                <Button
                  // variant="contained"
                  color="inherit"
                  onClick={() => navigate("/chart-of-accounts")}
                  startIcon={<ArrowBack />}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Back to COA
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Account Summary */}
        {ledgerData && (
          <motion.div variants={itemVariants}>
            <Card className="bg-white shadow-lg border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Typography
                    variant="h6"
                    className="text-gray-800 font-semibold flex items-center"
                  >
                    <Assessment className="mr-2 text-[#2E7D32]" />
                    Account Summary
                  </Typography>
                  <Chip
                    label="Active Account"
                    className="bg-green-100 text-[#2E7D32] font-medium"
                    size="small"
                  />
                </div>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <Typography
                          variant="body2"
                          className="text-blue-700 font-medium"
                        >
                          Opening Balance
                        </Typography>
                        <AccountBalance className="text-blue-600" />
                      </div>
                      <Typography
                        variant="h4"
                        className="font-bold text-blue-800"
                      >
                        {formatCurrency(ledgerData?.openingBalance || 0)}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <div className="bg-gradient-to-br from-[#2E7D32] to-[#388E3C] p-6 rounded-xl text-white">
                      <div className="flex items-center justify-between mb-2">
                        <Typography
                          variant="body2"
                          className="opacity-90 font-medium"
                        >
                          Current Balance
                        </Typography>
                        <TrendingUp className="opacity-90" />
                      </div>
                      <Typography variant="h4" className="font-bold">
                        {formatCurrency(ledgerData?.currentBalance || 0)}
                      </Typography>
                    </div>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Date Filter */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Typography
                  variant="h6"
                  className="text-gray-800 font-semibold flex items-center"
                >
                  <FilterList className="mr-2 text-[#2E7D32]" />
                  Filter Transactions
                </Typography>
              </div>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={dateFilter.startDate}
                    onChange={handleDateChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <CalendarToday className="text-gray-400 mr-2" />
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        "& fieldset": { borderColor: "#e5e7eb" },
                        "&:hover fieldset": { borderColor: "#2E7D32" },
                        "&.Mui-focused fieldset": { borderColor: "#2E7D32" },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={dateFilter.endDate}
                    onChange={handleDateChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <CalendarToday className="text-gray-400 mr-2" />
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        "& fieldset": { borderColor: "#e5e7eb" },
                        "&:hover fieldset": { borderColor: "#2E7D32" },
                        "&.Mui-focused fieldset": { borderColor: "#2E7D32" },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setDateFilter({ startDate: "", endDate: "" });
                    }}
                    fullWidth
                    className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white py-3"
                  >
                    Clear Filter
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white shadow-lg border-0 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Transaction History
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                {ledgerData?.ledger?.length || 0} transactions found
              </Typography>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={60}
                    className="rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="grid grid-cols-7 gap-4 p-4 bg-gray-100 text-sm font-semibold text-gray-700 border-b">
                  <div className="flex items-center">
                    <CalendarToday className="mr-2 text-gray-500 text-sm" />
                    Date
                  </div>
                  <div>Type</div>
                  <div>Reference</div>
                  <div>Description</div>
                  <div className="text-right">Debit</div>
                  <div className="text-right">Credit</div>
                  <div className="text-right">Balance</div>
                </div>

                {/* Table Body */}
                <AnimatePresence>
                  {ledgerData?.ledger?.length > 0 ? (
                    ledgerData.ledger.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="grid grid-cols-7 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center text-sm font-medium text-gray-800">
                          {new Date(entry.date).toLocaleDateString("en-PK")}
                        </div>

                        <div>
                          {entry.ledger && entry.ledger.length > 0 ? (
                            <Chip
                              label={entry.ledger.at(-1).type}
                              size="small"
                              color={getTransactionTypeColor(
                                entry.ledger.at(-1).type
                              )}
                              className="font-medium"
                            />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600">
                          {entry.reference ? (
                            <div className="flex items-center">
                              <Receipt className="mr-1 text-gray-400 text-sm" />
                              {entry.reference}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>

                        <div className="text-sm text-gray-800">
                          <div className="max-w-xs">
                            <div className="font-medium">
                              {entry.description}
                            </div>
                            {entry.narration?.text && (
                              <div className="text-xs text-gray-500 mt-1">
                                {entry.narration.text}
                              </div>
                            )}
                            {entry.party?.name && (
                              <div className="text-xs text-blue-600 mt-1">
                                Party: {entry.party.name}
                              </div>
                            )}
                            {entry.via?.method && (
                              <div className="text-xs text-purple-600 mt-1">
                                via {entry.via.method}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          {entry.debit ? (
                            <div className="flex items-center justify-end space-x-1">
                              <TrendingUp className="text-green-500 text-sm" />
                              <span className="font-semibold text-green-600">
                                {formatCurrency(entry.debit)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>

                        <div className="text-right">
                          {entry.credit ? (
                            <div className="flex items-center justify-end space-x-1">
                              <TrendingDown className="text-red-500 text-sm" />
                              <span className="font-semibold text-red-600">
                                {formatCurrency(entry.credit)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>

                        <div className="text-right">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              entry.balance >= 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {formatCurrency(entry.balance)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <AccountTree className="text-6xl text-gray-300 mb-4" />
                      <Typography variant="h6" className="text-gray-500 mb-2">
                        No transactions found
                      </Typography>
                      <Typography variant="body2" className="text-gray-400">
                        Try adjusting your date filters or check back later
                      </Typography>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CoaLedger;

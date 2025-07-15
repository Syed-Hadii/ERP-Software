"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  TableContainer,
} from "@mui/material";
import {
  FilterList,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  Refresh,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL } from "../../config/config";

const BankLedger = () => {
  const { id } = useParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    accountInfo: null,
    entries: [],
  });

  const fetchLedger = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/bank/ledger/${id}`;
      if (startDate || endDate) {
        url += "?";
        if (startDate) url += `startDate=${startDate}`;
        if (endDate) url += `${startDate ? "&" : ""}endDate=${endDate}`;
      }

      const { data } = await axios.get(url);
      console.log("Ledger Data:", data);
      if (data.success) {
        setLedgerData(data.data);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id]);

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
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
              <div className="flex items-center space-x-3">
                <AccountBalance className="text-3xl" />
                <div>
                  <Typography variant="h4" className="font-bold">
                    Bank Ledger
                  </Typography>
                  <Typography variant="subtitle1" className="opacity-90">
                    Financial Transaction History
                  </Typography>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Account Information */}
        {ledgerData.accountInfo && (
          <motion.div variants={itemVariants}>
            <Card className="bg-white shadow-lg border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Typography
                    variant="h6"
                    className="text-gray-800 font-semibold flex items-center"
                  >
                    <AccountBalance className="mr-2 text-[#2E7D32]" />
                    Account Overview
                  </Typography>
                  <Chip
                    label="Active"
                    className="bg-green-100 text-[#2E7D32] font-medium"
                    size="small"
                  />
                </div>

                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Typography
                          variant="h5"
                          className="font-bold text-gray-800"
                        >
                          {ledgerData.accountInfo.bankName}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography
                            variant="body2"
                            className="text-gray-600 mb-1"
                          >
                            Account Title
                          </Typography>
                          <Typography
                            variant="body1"
                            className="font-semibold text-gray-800"
                          >
                            {ledgerData.accountInfo.accountTitle}
                          </Typography>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Typography
                            variant="body2"
                            className="text-gray-600 mb-1"
                          >
                            Account Number
                          </Typography>
                          <Typography
                            variant="body1"
                            className="font-semibold text-gray-800 font-mono"
                          >
                            {ledgerData.accountInfo.accountNumber}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <div className="bg-gradient-to-br from-[#2E7D32] to-[#388E3C] p-6 rounded-xl text-white">
                      <div className="space-y-4">
                        <div>
                          <Typography
                            variant="body2"
                            className="opacity-90 mb-1"
                          >
                            Opening Balance
                          </Typography>
                          <Typography variant="h6" className="font-bold">
                            {formatCurrency(
                              ledgerData.accountInfo.openingBalance
                            )}
                          </Typography>
                        </div>
                        <Divider className="bg-white/20" />
                        <div>
                          <Typography
                            variant="body2"
                            className="opacity-90 mb-1"
                          >
                            Current Balance
                          </Typography>
                          <Typography variant="h4" className="font-bold">
                            {formatCurrency(
                              ledgerData.accountInfo.currentBalance
                            )}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter Section */}
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

              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <TextField
                  type="date"
                  label="From Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  className="flex-1"
                  InputProps={{
                    startAdornment: (
                      <CalendarToday className="text-gray-400 mr-2" />
                    ),
                  }}
                />
                <TextField
                  type="date"
                  label="To Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  className="flex-1"
                  InputProps={{
                    startAdornment: (
                      <CalendarToday className="text-gray-400 mr-2" />
                    ),
                  }}
                />
                <div className="flex space-x-2">
                  <Button
                    variant="contained"
                    onClick={fetchLedger}
                    disabled={loading}
                    className="bg-[#2E7D32] hover:bg-[#1B5E20] px-8 py-3 font-semibold"
                    startIcon={
                      loading ? (
                        <Refresh className="animate-spin" />
                      ) : (
                        <FilterList />
                      )
                    }
                  >
                    {loading ? "Loading..." : "Apply Filter"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      fetchLedger();
                    }}
                    className="border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white px-6"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Table */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white shadow-lg border-0 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <Typography variant="h6" className="text-gray-800 font-semibold">
                Transaction History
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                {ledgerData.entries.length} transactions found
              </Typography>
            </div>

            <TableContainer className="max-h-[600px]">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="bg-gray-100 font-semibold text-gray-700">
                      Date
                    </TableCell>
                    <TableCell className="bg-gray-100 font-semibold text-gray-700">
                      Description
                    </TableCell>
                    <TableCell
                      align="right"
                      className="bg-gray-100 font-semibold text-gray-700"
                    >
                      In
                    </TableCell>
                    <TableCell
                      align="right"
                      className="bg-gray-100 font-semibold text-gray-700"
                    >
                      Out
                    </TableCell>
                    <TableCell
                      align="right"
                      className="bg-gray-100 font-semibold text-gray-700"
                    >
                      Balance
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {ledgerData.entries.map((entry, index) => (
                      <motion.tr
                        key={index}
                        component={TableRow}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <CalendarToday className="text-gray-400 text-sm" />
                            <span>
                              {new Date(entry.date).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <Typography
                              variant="body2"
                              className="font-medium text-gray-800"
                            >
                              {entry.narration ||
                                entry.reference ||
                                "No description"}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell align="right">
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
                        </TableCell>
                        <TableCell align="right">
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
                        </TableCell>
                        <TableCell align="right">
                          <div className="bg-gray-100 px-3 py-1 rounded-full">
                            <span className="font-bold text-gray-800">
                              {formatCurrency(entry.balance)}
                            </span>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>

            {ledgerData.entries.length === 0 && !loading && (
              <div className="p-12 text-center">
                <AccountBalance className="text-6xl text-gray-300 mb-4" />
                <Typography variant="h6" className="text-gray-500 mb-2">
                  No transactions found
                </Typography>
                <Typography variant="body2" className="text-gray-400">
                  Try adjusting your date filters or check back later
                </Typography>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BankLedger;

"use client";

import { useState } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import Logo from "../../assets/erp.png";
import AuthService from "../../utils/auth";
import {
  Button,
  TextField,
  CircularProgress,
  Alert,
  CssBaseline,
  Box,
  Typography,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import "tailwindcss/tailwind.css";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = Wrapper.useNavigate();
  const location = Wrapper.useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await Wrapper.axios.post(`${BASE_URL}/user/login`, {
        email,
        password,
      });
      const { accessToken, refreshToken, ...user } = response.data;
      console.log("User data on login:", user);

      AuthService.setTokens(accessToken, refreshToken);
      AuthService.setUser(user);
      console.log("Stored in localStorage:", AuthService.getUser());

      navigate(from, { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message || "An error occurred during login"
      );
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <CssBaseline />
      <Box className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Left Side - Branding */}
        <Box className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 relative overflow-hidden">
          <Box className="absolute inset-0 bg-gradient-to-br from-green-800/20 to-transparent"></Box>

          {/* Decorative Elements */}
          <Box className="absolute top-10 left-10 w-40 h-40 bg-green-400/20 rounded-full blur-3xl"></Box>
          <Box className="absolute bottom-20 right-20 w-56 h-56 bg-green-300/10 rounded-full blur-3xl"></Box>

          <Box className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center text-white">
            <Wrapper.motion.div
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              className="mb-10"
            >
              <img
                src={Logo}
                alt="ZAHIRIX"
                className="w-52 h-auto mx-auto drop-shadow-xl"
              />
            </Wrapper.motion.div>

            <Wrapper.motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <Typography
                variant="h2"
                className="font-extrabold leading-tight tracking-tight"
              >
                Sign in to ZAHIRIX
              </Typography>
              <Typography
                variant="body1"
                className="max-w-md leading-relaxed opacity-90"
              >
                Streamline your business operations with our powerful ERP
                solution.
              </Typography>
            </Wrapper.motion.div>
          </Box>
        </Box>

        {/* Right Side - Login Form */}
        <Box className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <Container maxWidth="xs">
            <Paper
              elevation={6}
              className="p-6 sm:p-8 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl"
            >
              <Wrapper.motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full"
              >
                {/* Mobile Logo */}
                <Box className="lg:hidden text-center mb-8">
                  <img
                    src={Logo}
                    alt="ZAHIRIX"
                    className="w-36 h-auto mx-auto mb-4"
                  />
                </Box>

                <Wrapper.motion.div variants={itemVariants}>
                  <Box className="text-center mb-6">
                    <Typography
                      variant="h4"
                      className="font-bold text-gray-900 mb-1"
                    >
                      Welcome Back
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                      Log in to your account
                    </Typography>
                  </Box>
                </Wrapper.motion.div>

                {error && (
                  <Wrapper.motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-6"
                  >
                    <Alert
                      severity="error"
                      className="rounded-lg bg-red-50 text-red-600 border border-red-100"
                    >
                      {error}
                    </Alert>
                  </Wrapper.motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <Wrapper.motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      variant="outlined"
                      required
                      className="rounded-lg"
                      InputProps={{
                        className:
                          "bg-white rounded-lg transition-all duration-300 shadow-sm",
                      }}
                      InputLabelProps={{
                        className: "text-gray-700 font-medium",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#d1d5db",
                            borderWidth: "1px",
                          },
                          "&:hover fieldset": {
                            borderColor: "#2E7D32",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#2E7D32",
                            borderWidth: "2px",
                          },
                        },
                      }}
                    />
                  </Wrapper.motion.div>

                  <Wrapper.motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      variant="outlined"
                      required
                      className="rounded-lg"
                      InputProps={{
                        className:
                          "bg-white rounded-lg transition-all duration-300 shadow-sm",
                      }}
                      InputLabelProps={{
                        className: "text-gray-700 font-medium",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: "#d1d5db",
                            borderWidth: "1px",
                          },
                          "&:hover fieldset": {
                            borderColor: "#2E7D32",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#2E7D32",
                            borderWidth: "2px",
                          },
                        },
                      }}
                    />
                  </Wrapper.motion.div>

                  <Wrapper.motion.div variants={itemVariants}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          sx={{
                            color: "#2E7D32",
                            "&.Mui-checked": {
                              color: "#2E7D32",
                            },
                          }}
                        />
                      }
                      label="Remember me"
                      className="text-sm text-gray-600"
                    />
                  </Wrapper.motion.div>

                  <Wrapper.motion.div variants={itemVariants}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      type="submit"
                      disabled={loading || !email || !password}
                      className="rounded-lg py-3 text-base font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Box className="flex items-center justify-center">
                          <CircularProgress
                            size={20}
                            className="text-white mr-2"
                          />
                          Signing in...
                        </Box>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </Wrapper.motion.div>
                </form>

                {/* Footer */}
                <Wrapper.motion.div variants={itemVariants}>
                  <Box className="mt-8 text-center">
                    <Typography
                      variant="caption"
                      className="text-gray-400 text-xs"
                    >
                      © 2024 ZAHIRIX PVT LIMITED. All rights reserved.
                    </Typography>
                  </Box>
                </Wrapper.motion.div>
              </Wrapper.motion.div>
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default Login;

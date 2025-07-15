import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import useNotifications from "../hooks/useNotifications";
import { motion } from "framer-motion";

const MotionPaper = motion(Paper);

const NotificationControlPanel = () => {
  const {
    isLoading,
    notificationStatus,
    userRole,
    showAgricultureControls,
    showCattleControls,
    showInventoryControls,
    showHRControls,
    showFinanceControls,
    generateNotifications,
  } = useNotifications();

  const [status, setStatus] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(0);
  const COOLDOWN = 30000; // 30 seconds

  const handleGenerate = async (type) => {
    if (Date.now() - lastGenerated < COOLDOWN) {
      setStatus({
        type: "error",
        message: "Please wait before generating again",
      });
      return;
    }
    if (
      type === "all" &&
      !window.confirm("Generate notifications for all domains?")
    ) {
      return;
    }
    const result = await generateNotifications(type);
    if (result) setLastGenerated(Date.now());
    setStatus({
      type: result ? "success" : "error",
      message: result
        ? `Successfully generated ${type} notifications`
        : `Failed to generate ${type} notifications`,
    });
  };

  const controls = [
    { type: "all", label: "All Notifications", visible: userRole === "Admin" },
    {
      type: "agriculture",
      label: "Agriculture",
      visible: showAgricultureControls || userRole === "Admin",
    },
    {
      type: "cattle",
      label: "Cattle",
      visible: showCattleControls || userRole === "Admin",
    },
    {
      type: "inventory",
      label: "Inventory",
      visible: showInventoryControls || userRole === "Admin",
    },
    {
      type: "hr",
      label: "HR",
      visible: showHRControls || userRole === "Admin",
    },
    {
      type: "finance",
      label: "Finance",
      visible: showFinanceControls || userRole === "Admin",
    },
  ];

  return (
    <MotionPaper
      elevation={3}
      sx={{ p: 3, mt: 3 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography variant="h6" gutterBottom>
        Notification Control Panel
      </Typography>
      <Grid container spacing={2}>
        {controls.map(
          ({ type, label, visible }) =>
            visible && (
              <Grid item xs={12} sm={6} md={4} key={type}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => handleGenerate(type)}
                  disabled={isLoading}
                  sx={{ textTransform: "none", fontWeight: 500 }}
                >
                  {isLoading && type === status?.type ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                  ) : null}
                  Generate {label}
                </Button>
              </Grid>
            )
        )}
      </Grid>
      {notificationStatus && (
        <Box sx={{ mt: 2 }}>
          <Typography
            color={
              notificationStatus.type === "success"
                ? "success.main"
                : "error.main"
            }
          >
            {notificationStatus.message}
          </Typography>
        </Box>
      )}
    </MotionPaper>
  );
};

export default NotificationControlPanel;

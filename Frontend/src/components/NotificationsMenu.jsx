import { useState, useEffect, useMemo, useRef } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import PetsIcon from "@mui/icons-material/Pets";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import RefreshIcon from "@mui/icons-material/Refresh";
import { motion, AnimatePresence } from "framer-motion";
import useNotifications from "../hooks/useNotifications";

const MotionMenu = motion(Menu);
const MotionMenuItem = motion(MenuItem);

const menuVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.2 },
  }),
  exit: { opacity: 0, x: 10, transition: { duration: 0.1 } },
};

const NotificationsMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);

  const {
    notifications,
    unreadCount,
    prevUnreadCount,
    isLoading,
    error,
    notificationStatus,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    generateNotifications,
    harvestAlerts,
    scheduleAlerts,
    inventoryAlerts,
    cattleAlerts,
    inventoryRequestAlerts,
    inventoryResponseAlerts,
    hrAlerts,
    financeAlerts,
    userRole,
    showAgricultureControls,
    showCattleControls,
    showInventoryControls,
    showHRControls,
    showFinanceControls,
  } = useNotifications();

  // Calculate dynamic maxHeight based on viewport height
  const maxMenuHeight = useMemo(() => {
    const viewportHeight = window.innerHeight;
    const calculatedHeight = Math.min(viewportHeight * 0.9, 600);
    console.log(
      "Viewport height:",
      window.innerHeight,
      "Max menu height:",
      calculatedHeight
    );
    return calculatedHeight;
  }, []);

  // Log notifications state for debugging
  useEffect(() => {
    console.log("Notifications state:", {
      notifications,
      unreadCount,
      activeTab,
      isLoading,
      error,
    });
  }, [notifications, unreadCount, activeTab, isLoading, error]);

  // Refresh notifications when menu opens or tab changes
  useEffect(() => {
    if (anchorEl) {
      setPage(1);
      setHasMore(true);
      refreshNotifications(1).then((response) => {
        console.log("Initial refresh response:", response);
      });
    }
  }, [anchorEl, refreshNotifications]);

  // Show snackbar when notification status changes
  useEffect(() => {
    if (notificationStatus) {
      setSnackbarOpen(true);
    }
  }, [notificationStatus]);

  // Infinite scrolling observer
  useEffect(() => {
    if (!observerRef.current || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          refreshNotifications(page + 1)
            .then((response) => {
              console.log("Infinite scroll response:", response);
              if (!response?.success || response?.data?.length < 50) {
                setHasMore(false);
              }
              setPage((prev) => prev + 1);
            })
            .catch((err) => {
              console.error("Infinite scroll error:", err);
              setHasMore(false);
            })
            .finally(() => {
              setIsLoadingMore(false);
            });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, hasMore, page, refreshNotifications]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId, event) => {
    event.stopPropagation();
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    refreshNotifications(1).then((response) => {
      console.log("Refresh response:", response);
    });
  };

  const handleGenerateNotifications = (type) => {
    generateNotifications(type);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
    setHasMore(true);
    refreshNotifications(1).then((response) => {
      console.log(`Tab ${newValue} refresh response:`, response);
    });
  };

  const open = Boolean(anchorEl);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getPriorityData = (priority) => {
    switch (priority) {
      case "high":
        return { color: "#f44336", label: "High" };
      case "medium":
        return { color: "#ff9800", label: "Medium" };
      case "low":
        return { color: "#4caf50", label: "Low" };
      default:
        return { color: "#9e9e9e", label: "Normal" };
    }
  };

  const getNotificationIcon = (type, domain) => {
    if (type.includes("harvest") || type.includes("schedule")) {
      return <AgricultureIcon sx={{ color: "#4caf50" }} />;
    } else if (type.includes("cattle") || domain === "cattle") {
      return <PetsIcon sx={{ color: "#2196f3" }} />;
    } else if (type.includes("inventory") || domain === "inventory") {
      return <InventoryIcon sx={{ color: "#ff9800" }} />;
    } else if (type.includes("payroll") || domain === "hr") {
      return <PeopleIcon sx={{ color: "#9c27b0" }} />;
    } else if (
      type.includes("invoice") ||
      type.includes("approval") ||
      domain === "finance"
    ) {
      return <AccountBalanceWalletIcon sx={{ color: "#f44336" }} />;
    } else {
      return <NotificationsIcon sx={{ color: "#9e9e9e" }} />;
    }
  };

  const filteredNotifications = useMemo(() => {
    console.log("Filtering notifications for tab:", activeTab, {
      notifications,
      harvestAlerts,
      scheduleAlerts,
    });
    if (activeTab === 0) return notifications;
    if (activeTab === 1) return [...harvestAlerts, ...scheduleAlerts];
    if (activeTab === 2) return cattleAlerts;
    if (activeTab === 3)
      return [
        ...inventoryAlerts,
        ...inventoryRequestAlerts,
        ...inventoryResponseAlerts,
      ];
    if (activeTab === 4) return hrAlerts;
    if (activeTab === 5) return financeAlerts;
    return [];
  }, [
    activeTab,
    notifications,
    harvestAlerts,
    scheduleAlerts,
    cattleAlerts,
    inventoryAlerts,
    inventoryRequestAlerts,
    inventoryResponseAlerts,
    hrAlerts,
    financeAlerts,
  ]);

  const groupedNotifications = useMemo(() => {
    const groups = filteredNotifications.reduce((acc, notification) => {
      const date = new Date(notification.dueDate);
      const today = new Date();
      let key;
      if (date.toDateString() === today.toDateString()) {
        key = "Today";
      } else if (
        date.toDateString() ===
        new Date(today.setDate(today.getDate() - 1)).toDateString()
      ) {
        key = "Yesterday";
      } else {
        key = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      acc[key] = acc[key] || [];
      acc[key].push(notification);
      return acc;
    }, {});
    console.log("Grouped notifications:", groups);
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Today") return -1;
      if (b === "Today") return 1;
      if (a === "Yesterday") return -1;
      if (b === "Yesterday") return 1;
      return new Date(b) - new Date(a);
    });
  }, [filteredNotifications]);

  const isTabVisible = (tabIndex) => {
    if (tabIndex === 0) return true;
    if (tabIndex === 1) return showAgricultureControls || userRole === "Admin";
    if (tabIndex === 2) return showCattleControls || userRole === "Admin";
    if (tabIndex === 3) return showInventoryControls || userRole === "Admin";
    if (tabIndex === 4) return showHRControls || userRole === "Admin";
    if (tabIndex === 5) return showFinanceControls || userRole === "Admin";
    return false;
  };

  const getTabUnreadCount = (tabIndex) => {
    if (tabIndex === 0) return unreadCount;
    if (tabIndex === 1)
      return [...harvestAlerts, ...scheduleAlerts].filter((n) => !n.isRead)
        .length;
    if (tabIndex === 2) return cattleAlerts.filter((n) => !n.isRead).length;
    if (tabIndex === 3)
      return [
        ...inventoryAlerts,
        ...inventoryRequestAlerts,
        ...inventoryResponseAlerts,
      ].filter((n) => !n.isRead).length;
    if (tabIndex === 4) return hrAlerts.filter((n) => !n.isRead).length;
    if (tabIndex === 5) return financeAlerts.filter((n) => !n.isRead).length;
    return 0;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-controls={open ? "notifications-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{
          position: "relative",
          transition: "transform 0.2s",
          "&:hover": { transform: "scale(1.1)" },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              animation: unreadCount > 0 ? "pulse 1.5s infinite" : "none",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.2)" },
                "100%": { transform: "scale(1)" },
              },
            },
            fontSize: "0.5rem",
          }}
        >
          <NotificationsIcon sx={{ fontSize: "1.8rem" }} />
        </Badge>
      </IconButton>

      <AnimatePresence>
        {open && (
          <MotionMenu
            id="notifications-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              elevation: 3,
              sx: {
                width: { xs: 320, sm: 400 },
                maxHeight: maxMenuHeight,
                overflow: "hidden",
                mt: 1.5,
                borderRadius: 2,
              },
            }}
            role="menu"
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <Typography variant="h6" component="div" fontWeight="500">
                Notifications
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={`${unreadCount} unread`}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 500 }}
                />
                <Tooltip title="Refresh Notifications">
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={handleRefresh}
                    disabled={isLoading || isLoadingMore}
                    aria-label="Refresh Notifications"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {(userRole === "Admin" ||
              showAgricultureControls ||
              showCattleControls ||
              showInventoryControls ||
              showHRControls ||
              showFinanceControls) && (
              <Box sx={{ p: 2, bgcolor: "grey.100" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Generate Notifications
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {userRole === "Admin" && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateNotifications("all")}
                      disabled={isLoading || isLoadingMore}
                      sx={{ textTransform: "none" }}
                      aria-label="Generate All Notifications"
                    >
                      All
                    </Button>
                  )}
                  {showAgricultureControls && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateNotifications("agriculture")}
                      disabled={isLoading || isLoadingMore}
                      sx={{ textTransform: "none" }}
                      aria-label="Generate Agriculture Notifications"
                    >
                      Agriculture
                    </Button>
                  )}
                  {showCattleControls && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateNotifications("cattle")}
                      disabled={isLoading || isLoadingMore}
                      sx={{ textTransform: "none" }}
                      aria-label="Generate Cattle Notifications"
                    >
                      Cattle
                    </Button>
                  )}
                  {showInventoryControls && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateNotifications("inventory")}
                      disabled={isLoading || isLoadingMore}
                      sx={{ textTransform: "none" }}
                      aria-label="Generate Inventory Notifications"
                    >
                      Inventory
                    </Button>
                  )}
                  {showHRControls && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateNotifications("hr")}
                      disabled={isLoading || isLoadingMore}
                      sx={{ textTransform: "none" }}
                      aria-label="Generate HR Notifications"
                    >
                      HR
                    </Button>
                  )}
                  {showFinanceControls && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleGenerateNotifications("finance")}
                      disabled={isLoading || isLoadingMore}
                      sx={{ textTransform: "none" }}
                      aria-label="Generate Finance Notifications"
                    >
                      Finance
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                minHeight: 48,
                "& .MuiTab-root": {
                  minHeight: 48,
                  textTransform: "none",
                  fontWeight: 500,
                },
              }}
              aria-label="Notification Categories"
            >
              <Tab
                label="All"
                icon={
                  getTabUnreadCount(0) > 0 ? (
                    <Badge
                      badgeContent={getTabUnreadCount(0)}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  ) : null
                }
                iconPosition="end"
                sx={{ display: isTabVisible(0) ? "flex" : "none" }}
                aria-label={`All Notifications (${getTabUnreadCount(
                  0
                )} unread)`}
              />
              <Tab
                label="Crop"
                icon={
                  getTabUnreadCount(1) > 0 ? (
                    <Badge
                      badgeContent={getTabUnreadCount(1)}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  ) : null
                }
                iconPosition="end"
                sx={{ display: isTabVisible(1) ? "flex" : "none" }}
                aria-label={`Crop Notifications (${getTabUnreadCount(
                  1
                )} unread)`}
              />
              <Tab
                label="Cattle"
                icon={
                  getTabUnreadCount(2) > 0 ? (
                    <Badge
                      badgeContent={getTabUnreadCount(2)}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  ) : null
                }
                iconPosition="end"
                sx={{ display: isTabVisible(2) ? "flex" : "none" }}
                aria-label={`Cattle Notifications (${getTabUnreadCount(
                  2
                )} unread)`}
              />
              <Tab
                label="Inventory"
                icon={
                  getTabUnreadCount(3) > 0 ? (
                    <Badge
                      badgeContent={getTabUnreadCount(3)}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  ) : null
                }
                iconPosition="end"
                sx={{ display: isTabVisible(3) ? "flex" : "none" }}
                aria-label={`Inventory Notifications (${getTabUnreadCount(
                  3
                )} unread)`}
              />
              <Tab
                label="HR"
                icon={
                  getTabUnreadCount(4) > 0 ? (
                    <Badge
                      badgeContent={getTabUnreadCount(4)}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  ) : null
                }
                iconPosition="end"
                sx={{ display: isTabVisible(4) ? "flex" : "none" }}
                aria-label={`HR Notifications (${getTabUnreadCount(4)} unread)`}
              />
              <Tab
                label="Finance"
                icon={
                  getTabUnreadCount(5) > 0 ? (
                    <Badge
                      badgeContent={getTabUnreadCount(5)}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  ) : null
                }
                iconPosition="end"
                sx={{ display: isTabVisible(5) ? "flex" : "none" }}
                aria-label={`Finance Notifications (${getTabUnreadCount(
                  5
                )} unread)`}
              />
            </Tabs>

            <Box
              sx={{
                maxHeight: maxMenuHeight - 100,
                minHeight: 150, // Ensure minimum height for visibility
                overflow: "auto",
              }}
              role="region"
              aria-label="Notification List"
            >
              {isLoading && page === 1 ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    p: 4,
                  }}
                >
                  <CircularProgress
                    size={30}
                    aria-label="Loading Notifications"
                  />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRefresh}
                    sx={{ mt: 2 }}
                    aria-label="Retry Fetching Notifications"
                  >
                    Try Again
                  </Button>
                </Box>
              ) : groupedNotifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary" variant="body2">
                    No notifications to display
                  </Typography>
                </Box>
              ) : (
                groupedNotifications.map(
                  ([date, notifications], groupIndex) => (
                    <Box key={date}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          p: 2,
                          bgcolor: "grey.100",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        {date}
                      </Typography>
                      {notifications.map((notification, index) => (
                        <MotionMenuItem
                          key={notification._id}
                          custom={groupIndex * notifications.length + index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          divider
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            p: 0,
                            backgroundColor: notification.isRead
                              ? "rgba(0, 0, 0, 0.02)"
                              : "white",
                          }}
                          role="menuitem"
                          aria-label={`${notification.title}, ${
                            notification.isRead ? "read" : "unread"
                          }`}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              p: 2,
                              display: "flex",
                              borderLeft: 3,
                              borderColor: getPriorityData(
                                notification.priority
                              ).color,
                            }}
                          >
                            <Box sx={{ mr: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: "background.paper",
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                {getNotificationIcon(
                                  notification.type,
                                  notification.domain
                                )}
                              </Avatar>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight={
                                    notification.isRead ? "normal" : "medium"
                                  }
                                  sx={{ mb: 0.5 }}
                                >
                                  {notification.title}
                                </Typography>
                                <Chip
                                  label={
                                    getPriorityData(notification.priority).label
                                  }
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.7rem",
                                    bgcolor:
                                      getPriorityData(notification.priority)
                                        .color + "20",
                                    color: getPriorityData(
                                      notification.priority
                                    ).color,
                                    fontWeight: 500,
                                    ml: 1,
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {notification.message}
                              </Typography>
                              <Box
                                sx={{
                                  width: "100%",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mt: 1,
                                }}
                              >
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <AccessTimeIcon
                                    sx={{
                                      fontSize: 14,
                                      mr: 0.5,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {formatDate(notification.dueDate)}
                                  </Typography>
                                </Box>
                                {!notification.isRead ? (
                                  <Tooltip title="Mark as read">
                                    <Button
                                      size="small"
                                      color="primary"
                                      onClick={(e) =>
                                        handleMarkAsRead(notification._id, e)
                                      }
                                      startIcon={<CheckCircleIcon />}
                                      sx={{
                                        textTransform: "none",
                                        fontWeight: 500,
                                        p: "2px 8px",
                                      }}
                                      aria-label={`Mark ${notification.title} as read`}
                                    >
                                      Read
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontStyle: "italic" }}
                                  >
                                    Read
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </MotionMenuItem>
                      ))}
                    </Box>
                  )
                )
              )}
              {hasMore && (
                <Box
                  ref={observerRef}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 2,
                  }}
                >
                  {isLoadingMore && (
                    <CircularProgress
                      size={20}
                      aria-label="Loading More Notifications"
                    />
                  )}
                </Box>
              )}
            </Box>

            {filteredNotifications.length > 0 && (
              <>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleMarkAllAsRead}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                    aria-label="Mark All Notifications as Read"
                  >
                    Mark All as Read
                  </Button>
                </Box>
              </>
            )}
          </MotionMenu>
        )}
      </AnimatePresence>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={notificationStatus?.type || "info"}
          sx={{ width: "100%" }}
        >
          {notificationStatus?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationsMenu;

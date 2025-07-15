import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import PropTypes from "prop-types";
import NotificationsMenu from "../NotificationsMenu";
import ReusableModal from "../Modals/ReusableModal";
import AuthService from "../../utils/auth";

const StyledAppBar = Wrapper.styled(Wrapper.AppBar)(({ theme, hasshadow }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  transition: theme.transitions.create(["box-shadow", "left", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  boxShadow: hasshadow === "true" ? theme.shadows[2] : "none",
  position: "fixed",
  top: 0,
  left: "var(--sidebar-width)",
  width: "calc(100% - var(--sidebar-width))",
  zIndex: theme.zIndex.drawer - 1,
  [theme.breakpoints.down("sm")]: {
    left: 0,
    width: "100%",
  },
}));

const NavbarContainer = Wrapper.styled(Wrapper.Toolbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0, 2),
  minHeight: 64,
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0, 1),
  },
}));

const NavbarLeft = Wrapper.styled(Wrapper.Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
  },
}));

const ToggleButton = Wrapper.styled(Wrapper.IconButton)(({ theme }) => ({
  color: "inherit",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1),
  },
}));

const NavItems = Wrapper.styled(Wrapper.Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(1),
  },
}));

const StyledMenu = Wrapper.styled(Wrapper.Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(1),
    boxShadow: theme.shadows[4],
    minWidth: 200,
  },
}));

const Navbar = ({ toggleSidebar }) => {
  const navigate = Wrapper.useNavigate();
  const theme = Wrapper.useTheme();
  const [hasShadow, setHasShadow] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const user = AuthService.getUser();

  const handleChangePassword = async (form) => {
    if (form.newPassword !== form.confirmNewPassword) {
      setNotification({
        open: true,
        message: "New password and confirmation do not match",
        severity: "error",
      });
      return;
    }

    try {
      await Wrapper.axios.post(
        `${BASE_URL}/user/change-password`,
        { oldPassword: form.oldPassword, newPassword: form.newPassword },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setChangePasswordOpen(false);
      setNotification({
        open: true,
        message: "Password updated successfully. Please log in again.",
        severity: "success",
      });
      setTimeout(() => {
        AuthService.logout();
      }, 2000);
    } catch (error) {
      setNotification({
        open: true,
        message: error.response?.data?.message || "Failed to update password",
        severity: "error",
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  useEffect(() => {
    const handleScroll = () => {
      setHasShadow(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
      // Only close modal after successful logout and navigation
      setLogoutModalOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      setNotification({
        open: true,
        message: "Failed to logout. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <StyledAppBar position="fixed" hasshadow={hasShadow.toString()}>
      <NavbarContainer>
        <NavbarLeft>
          <Wrapper.motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ToggleButton
              onClick={toggleSidebar}
              edge="start"
              aria-label="Toggle sidebar"
              sx={{
                padding: { xs: "8px", sm: "12px" },
                marginLeft: 0,
                zIndex: 100,
                bgcolor: { xs: "rgba(46, 125, 50, 0.08)", sm: "transparent" },
                "&:hover": { bgcolor: "rgba(46, 125, 50, 0.15)" },
              }}
            >
              <Wrapper.MenuIcon
                sx={{ color: { xs: "#2E7D32", sm: "inherit" } }}
              />
            </ToggleButton>
          </Wrapper.motion.div>
        </NavbarLeft>

        <NavItems>
          <Wrapper.Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: theme.spacing(1.5) },
            }}
          >
            <NotificationsMenu sx={{ color: "#2E7D32", fontSize: "1.2rem" }} />
            <Wrapper.Tooltip title="Account settings">
              <Wrapper.IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0.5,
                  "&:hover": { bgcolor: theme.palette.action.hover },
                }}
              >
                <Wrapper.Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.primary.main,
                    fontSize: "1rem",
                    fontWeight: "medium",
                  }}
                >
                  {user?.name ? user.name[0] : "G"}
                </Wrapper.Avatar>
              </Wrapper.IconButton>
            </Wrapper.Tooltip>

            <StyledMenu
              id="profile-menu"
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Wrapper.MenuItem onClick={handleProfileMenuClose}>
                <Wrapper.ListItemIcon>
                  <Wrapper.PersonIcon
                    fontSize="small"
                    sx={{ color: "#2E7D32" }}
                  />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText
                  primary={user?.name || "Guest"}
                  secondary={user?.role || "Role"}
                  primaryTypographyProps={{ fontWeight: 500, color: "#2E7D32" }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                    color: "text.secondary",
                  }}
                />
              </Wrapper.MenuItem>
              <Wrapper.MenuItem onClick={handleProfileMenuClose}>
                <Wrapper.ListItemIcon>
                  <Wrapper.EmailIcon
                    fontSize="small"
                    sx={{ color: "#1976D2" }}
                  />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText
                  primary={user?.email || "Guest"}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    color: "text.primary",
                  }}
                />
              </Wrapper.MenuItem>
              <Wrapper.MenuItem
                onClick={() => {
                  handleProfileMenuClose();
                  setChangePasswordOpen(true);
                }}
              >
                <Wrapper.ListItemIcon>
                  <Wrapper.LockIcon
                    fontSize="small"
                    sx={{ color: "#F57C00" }}
                  />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText primary="Change Password" />
              </Wrapper.MenuItem>
              <Wrapper.Divider sx={{ my: 0.5 }} />
              <Wrapper.MenuItem onClick={() => setLogoutModalOpen(true)}>
                <Wrapper.ListItemIcon>
                  <Wrapper.LogoutIcon fontSize="small" />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText primary="Logout" />
              </Wrapper.MenuItem>
            </StyledMenu>
          </Wrapper.Box>
        </NavItems>
        <ReusableModal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          onSubmit={handleChangePassword}
          title="Change Password"
          fields={[
            {
              name: "oldPassword",
              label: "Old Password",
              placeholder: "Enter old password",
              type: "password",
              icon: <Wrapper.LockIcon fontSize="small" color="action" />,
              validation: { required: true, minLength: 6 },
            },
            {
              name: "newPassword",
              label: "New Password",
              placeholder: "Enter new password",
              type: "password",
              icon: <Wrapper.LockIcon fontSize="small" color="action" />,
              validation: { required: true, minLength: 6 },
            },
            {
              name: "confirmNewPassword",
              label: "Confirm New Password",
              placeholder: "Confirm new password",
              type: "password",
              icon: <Wrapper.LockIcon fontSize="small" color="action" />,
              validation: { required: true, minLength: 6 },
            },
          ]}
          submitButtonText="Update Password"
        />

        {/* Logout Confirmation Modal */}
        <Wrapper.Dialog
          open={logoutModalOpen}
          onClose={isLoggingOut ? undefined : () => setLogoutModalOpen(false)}
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
          maxWidth="xs"
          fullWidth
        >
          <div className="flex flex-col items-center p-6">
            <Wrapper.Avatar sx={{ bgcolor: "#f44336", mb: 2 }}>
              <Wrapper.LogoutIcon />
            </Wrapper.Avatar>

            <Wrapper.DialogTitle
              id="logout-dialog-title"
              className="text-center text-lg font-semibold"
            >
              Are you sure you want to logout?
            </Wrapper.DialogTitle>

            <Wrapper.DialogContentText
              id="logout-dialog-description"
              className="text-center text-sm text-gray-500 mt-2 mb-4"
            >
              You will be returned to the login screen and need to
              re-authenticate.
            </Wrapper.DialogContentText>

            <div className="flex justify-center gap-3 w-full mt-4">
              <Wrapper.Button
                onClick={() => setLogoutModalOpen(false)}
                variant="outlined"
                color="primary"
                fullWidth
                disabled={isLoggingOut}
              >
                Cancel
              </Wrapper.Button>
              <Wrapper.Button
                onClick={handleLogout}
                variant="contained"
                color="error"
                fullWidth
                autoFocus
                disabled={isLoggingOut}
                startIcon={
                  isLoggingOut ? (
                    <Wrapper.CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Wrapper.Button>
            </div>
          </div>
        </Wrapper.Dialog>

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
      </NavbarContainer>
    </StyledAppBar>
  );
};

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;

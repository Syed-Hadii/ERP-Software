import { useState, useEffect } from "react";
import Wrapper from "../../utils/wrapper";
import PropTypes from "prop-types";
import logo from "../../assets/erp.png";

const sections = [
  {
    title: "Main",
    roles: ["Admin", "HR Manager"],
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: Wrapper.DashboardIcon,
        roles: ["Admin"],
      },
      {
        label: "Users",
        path: "/users",
        icon: Wrapper.PeopleIcon,
        roles: ["Admin", "HR Manager"],
      },
    ],
  },
  {
    title: "Agriculture",
    roles: ["Admin", "Crop Manager"],
    items: [
      {
        label: "Agriculture Dashboard",
        path: "/agriculture-dashboard",
        icon: Wrapper.BarChartIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Farmers",
        path: "/farmer",
        icon: Wrapper.PersonIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Lands",
        path: "/land",
        icon: Wrapper.LandscapeIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Crops",
        path: "/crop",
        icon: Wrapper.GrassIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Sowing",
        path: "/crop-sow",
        icon: Wrapper.SpaIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Calendar",
        path: "/crop-calendar",
        icon: Wrapper.EventIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Customers",
        path: "/customers",
        icon: Wrapper.GroupIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Inventory",
        path: "/crop-inventory",
        icon: Wrapper.InventoryIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Write Offs",
        path: "/crop/inventory-write-off",
        icon: Wrapper.CancelIcon,
        roles: ["Admin", "Crop Manager"],
      },
      {
        label: "Requests",
        path: "/crop-requests",
        icon: Wrapper.RequestQuoteIcon,
        roles: ["Admin", "Crop Manager"],
      },
    ],
  },
  {
    title: "Cattle & Dairy",
    roles: ["Admin", "Dairy Manager"],
    items: [
      {
        label: "Dashboard",
        path: "/cattle/dashboard",
        icon: Wrapper.BarChartIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Cattle Records",
        path: "/cattle/register",
        icon: Wrapper.BookIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Health",
        path: "/cattle/health",
        icon: Wrapper.HeartPulseIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Feed Usage",
        path: "/cattle/feed-usage",
        icon: Wrapper.FeedIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Milk Production",
        path: "/cattle/milk-production",
        icon: Wrapper.MilkIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Sales",
        path: "/cattle/sales",
        icon: Wrapper.PointOfSaleIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Customers",
        path: "/customers",
        icon: Wrapper.GroupIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Inventory",
        path: "/cattle/inventory",
        icon: Wrapper.InventoryIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Write Offs",
        path: "/cattle/inventory-write-off",
        icon: Wrapper.CancelIcon,
        roles: ["Admin", "Dairy Manager"],
      },
      {
        label: "Requests",
        path: "/cattle/cattle-requests",
        icon: Wrapper.RequestQuoteIcon,
        roles: ["Admin", "Dairy Manager"],
      },
    ],
  },
  {
    title: "Inventory Control",
    roles: ["Admin", "Inventory Manager"],
    items: [
      {
        label: "Inventory Dashboard",
        path: "/inventory-dashboard",
        icon: Wrapper.BarChartIcon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Suppliers",
        path: "/suppliers",
        icon: Wrapper.LocalShippingIcon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Customers",
        path: "/customers",
        icon: Wrapper.GroupIcon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Items",
        path: "/item",
        icon: Wrapper.Inventory2Icon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Inventory",
        path: "/store",
        icon: Wrapper.StoreIcon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Purchases",
        path: "/stock_purchase",
        icon: Wrapper.ShoppingCartIcon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Requests",
        path: "/stock_request",
        icon: Wrapper.RequestQuoteIcon,
        roles: ["Admin", "Inventory Manager"],
      },
      {
        label: "Write Offs",
        path: "/inventory/write-off",
        icon: Wrapper.CancelIcon,
        roles: ["Admin", "Inventory Manager"],
      },
    ],
  },
  {
    title: "Human Resources",
    roles: ["Admin", "HR Manager"],
    items: [
      {
        label: "Analytics",
        path: "/employee-analytics",
        icon: Wrapper.AnalyticsIcon,
        roles: ["Admin", "HR Manager"],
      },
      {
        label: "Employees",
        path: "/employee",
        icon: Wrapper.PeopleIcon,
        roles: ["Admin", "HR Manager"],
      },
      {
        label: "Attendance",
        path: "/attendance",
        icon: Wrapper.CalendarMonthIcon,
        roles: ["Admin", "HR Manager"],
      },
      {
        label: "Payroll",
        path: "/payroll",
        icon: Wrapper.PaymentsIcon,
        roles: ["Admin", "HR Manager"],
      },
      {
        label: "Loans",
        path: "/loans",
        icon: Wrapper.LoanIcon,
        roles: ["Admin", "HR Manager"],
      },
      {
        label: "Increments",
        path: "/increments",
        icon: Wrapper.TrendingUpIcon,
        roles: ["Admin", "HR Manager"],
      },
    ],
  },
  {
    title: "Finance",
    roles: ["Admin", "Finance Manager"],
    items: [
      {
        label: "Dashboard",
        path: "/finance-dashboard",
        icon: Wrapper.DashboardIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Invoices",
        path: "/invoice-approval",
        icon: Wrapper.ReceiptIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Bank Accounts",
        path: "/bankaccount",
        icon: Wrapper.AccountBalanceIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Chart of Accounts",
        path: "/chartsofaccounts",
        icon: Wrapper.PieChartIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Cash Summary",
        path: "/cash-bank-summary",
        icon: Wrapper.AttachMoneyIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Payment Entry",
        path: "/payment-entry",
        icon: Wrapper.CallMadeIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Receive Entry",
        path: "/receipt-entry",
        icon: Wrapper.CallReceivedIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Journal Entry",
        path: "/journalvoucher",
        icon: Wrapper.DescriptionIcon,
        roles: ["Admin", "Finance Manager"],
      },
      {
        label: "Batch Entry",
        path: "/batch-entry",
        icon: Wrapper.CallMadeIcon,
        roles: ["Admin", "Finance Manager"],
      },
    ],
  },
];

const SidebarContainer = Wrapper.styled(Wrapper.Box)(
  ({ theme, open, ismobile }) => ({
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: open ? 240 : ismobile ? 0 : 60,
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    transition: theme.transitions.create(["width", "transform"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    zIndex: theme.zIndex.drawer + 20,
    transform: ismobile && !open ? "translateX(-100%)" : "translateX(0)",
    boxShadow: open && ismobile ? theme.shadows[8] : "none",
    visibility: ismobile && !open ? "hidden" : "visible",
  })
);

const SidebarHeader = Wrapper.styled(Wrapper.Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LogoBox = Wrapper.styled(Wrapper.Box)(({ theme }) => ({
  // width: 40,
  // height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // borderRadius: theme.shape.borderRadius,
  // backgroundColor: "#2E7D32",
  // color: theme.palette.primary.contrastText,
}));

const SidebarContent = Wrapper.styled(Wrapper.Box)({
  flex: 1,
  overflowY: "auto",
});

const NavSectionTitle = Wrapper.styled(Wrapper.Typography)(
  ({ theme, open }) => ({
    padding: theme.spacing(1, 2),
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: theme.palette.text.secondary,
    display: open ? "block" : "none",
    backgroundColor: theme.palette.background.default,
    borderBottom: `1px solid ${theme.palette.divider}`,
  })
);

const StyledNavLink = Wrapper.styled(Wrapper.NavLink)(({ theme }) => ({
  textDecoration: "none",
  color: "inherit",
  display: "block",
  "&.active .MuiListItemButton-root": {
    backgroundColor: theme.palette.action.selected,
    color: "#2E7D32",
    borderLeft: "4px solid #2E7D32", // Added left border for active state
    paddingLeft: "12px", // Adjusted padding to account for border
    "& .MuiListItemIcon-root": { color: "#2E7D32" },
    "& .MuiListItemText-root": { color: "#2E7D32" },
  },
  "&:hover .MuiListItemButton-root": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Sidebar = ({ isOpen, userRole, isMobile }) => {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const location = Wrapper.useLocation();

  useEffect(() => {
    if (userRole !== "Admin") {
      const expanded = {};
      sections.forEach((section) => {
        if (section.roles.includes(userRole)) {
          expanded[section.title] = true;
        }
      });
      setExpandedSections(expanded);
    }
  }, [userRole]);

  const toggleSection = (title) => {
    if (userRole === "Admin") {
      setExpandedSections((prev) => ({
        ...prev,
        [title]: !prev[title],
      }));
    }
  };

  const isRouteActive = (path) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const renderSection = (section) => {
    const sectionVisible = section.roles.includes(userRole);
    if (!sectionVisible) return null;

    const filteredItems = section.items.filter((item) =>
      item.roles.includes(userRole)
    );
    if (filteredItems.length === 0) return null;

    const isExpanded = expandedSections[section.title];

    return (
      <Wrapper.Fragment key={section.title}>
        {userRole === "Admin" ? (
          <>
            <Wrapper.ListItem
              button
              onClick={() => toggleSection(section.title)}
              sx={{
                py: 0.75,
                px: 2,
                mb: 0.5,
                backgroundColor: isExpanded ? "action.hover" : "inherit",
              }}
            >
              <Wrapper.ListItemIcon sx={{ minWidth: isOpen ? 40 : 48 }}>
                <Wrapper.FolderIcon fontSize="small" />
              </Wrapper.ListItemIcon>
              {isOpen && (
                <Wrapper.ListItemText
                  primary={section.title}
                  primaryTypographyProps={{ fontSize: "0.875rem" }}
                />
              )}
              {isOpen && (
                <Wrapper.motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Wrapper.ExpandMoreIcon fontSize="small" />
                </Wrapper.motion.div>
              )}
            </Wrapper.ListItem>

            <Wrapper.Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Wrapper.List component="div" disablePadding>
                {filteredItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </Wrapper.List>
            </Wrapper.Collapse>
          </>
        ) : (
          <>
            <NavSectionTitle open={isOpen}>{section.title}</NavSectionTitle>
            {filteredItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </>
        )}
      </Wrapper.Fragment>
    );
  };

  const NavItem = ({ item }) => {
    const isActive = isRouteActive(item.path);
    return (
      <StyledNavLink to={item.path} end>
        <Wrapper.ListItem disablePadding>
          <Wrapper.Tooltip
            title={item.label}
            placement="right"
            disableHoverListener={isOpen}
          >
            <Wrapper.ListItemButton sx={{ pl: 2, pr: 1, minHeight: 48 }}>
              <Wrapper.ListItemIcon sx={{ minWidth: 40, color: "#2E7D32" }}>
                <item.icon fontSize="small" /> {/* Consistent icon size */}
              </Wrapper.ListItemIcon>
              <Wrapper.ListItemText
                primary={item.label}
                sx={{ opacity: isOpen ? 1 : 0 }}
                primaryTypographyProps={{
                  noWrap: true,
                  fontSize: "0.875rem",
                  fontWeight: isActive ? "medium" : "normal",
                }}
              />
            </Wrapper.ListItemButton>
          </Wrapper.Tooltip>
        </Wrapper.ListItem>
      </StyledNavLink>
    );
  };

  return (
    <SidebarContainer open={isOpen} ismobile={isMobile ? 1 : 0}>
      {(!isMobile || isOpen) && (
        <SidebarHeader>
          <LogoBox sx={{ display: isOpen || !isMobile ? "flex" : "none" }}>
            <img width={40} src={logo} alt="" />
          </LogoBox>
          {isOpen && (
            <Wrapper.Typography variant="subtitle1" fontWeight="bold" noWrap>
              Zahirix Pvt Limited
            </Wrapper.Typography>
          )}
        </SidebarHeader>
      )}
      <SidebarContent>
        <Wrapper.List component="nav" disablePadding>
          {sections.map(renderSection)}
        </Wrapper.List>
      </SidebarContent>
    </SidebarContainer>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  userRole: PropTypes.string,
  isMobile: PropTypes.bool,
};

export default Sidebar;

import React from "react";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  LocalHospital as HealthIcon,
  ExitToApp as ExitIcon,
  LocalDrink as MilkIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

const CattleNavigation = () => {
  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/cattle/dashboard",
      roles: ["Admin", "Dairy Manager"],
    },
    {
      text: "Cattle Register",
      icon: <PetsIcon />,
      path: "/cattle/register",
      roles: ["Admin", "Dairy Manager"],
    },
    {
      text: "Health Management",
      icon: <HealthIcon />,
      path: "/cattle/health",
      roles: ["Admin", "Dairy Manager"],
    },
    {
      text: "Outgoing Tracking",
      icon: <ExitIcon />,
      path: "/cattle/outgoing",
      roles: ["Admin", "Dairy Manager"],
    },
    {
      text: "Milk Production",
      icon: <MilkIcon />,
      path: "/cattle/milk-production",
      roles: ["Admin", "Dairy Manager"],
    },
    {
      text: "Dairy Inventory",
      icon: <InventoryIcon />,
      path: "/cattle/inventory",
      roles: ["Admin", "Dairy Manager"],
    },
    {
      text: "Dairy Sales",
      icon: <SalesIcon />,
      path: "/cattle/sales",
      roles: ["Admin", "Dairy Manager"],
    },
  ];

  return (
    <List>
      {menuItems.map((item, index) => (
        <React.Fragment key={item.text}>
          <ListItem
            button
            component={Link}
            to={item.path}
            sx={{
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
          {index < menuItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default CattleNavigation;

import { createTheme } from "@mui/material/styles"

// Create a custom theme with green as the primary color
const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
      light: "#66BB6A",
      dark: "#1B5E20",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#e0f2e9",
      light: "#ffffff",
      dark: "#aebfb7",
      contrastText: "#000000",
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontWeight: 400,
    },
    body2: {
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "2px 4px",
          "&.Mui-selected": {
            backgroundColor: "#e0f2e9",
            color: "#2E7D32",
            "&:hover": {
              backgroundColor: "#d0e8df",
            },
            "& .MuiListItemIcon-root": {
              color: "#2E7D32",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(102, 187, 106, 0.1)",
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(0, 0, 0, 0.12)",
        },
      },
    },
  },
})

export default theme


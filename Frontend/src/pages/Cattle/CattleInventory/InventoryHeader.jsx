import Wrapper from "../../../utils/wrapper";

const InventoryHeader = ({
  searchQuery,
  setSearchQuery,
  refreshInventory,
  selectedInventories,
  setMultipleDeleteConfirmation,
  showNotification,
  selectedTab,
  setProcessOpen,
  setAddOpen,
  setFeedProcessOpen,
}) => {
  const theme = Wrapper.useTheme();
  return (
    <Wrapper.Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        mb: 4,
        gap: 2,
      }}
    >
      <Wrapper.Box>
        <Wrapper.Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{
            position: "relative",
            "&:after": {
              content: '""',
              position: "absolute",
              bottom: "-8px",
              left: 0,
              width: "40px",
              height: "4px",
              bgcolor: "#10b981",
              borderRadius: "2px",
            },
          }}
        >
          Cattle Inventory Management
        </Wrapper.Typography>
        <Wrapper.Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          Manage your cattle-related inventory and processing
        </Wrapper.Typography>
      </Wrapper.Box>
      <Wrapper.Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: { xs: "flex-start", sm: "flex-end" },
          width: { xs: "100%", md: "auto" },
        }}
      >
        <Wrapper.TextField
          placeholder="Search inventory..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: { xs: "100%", sm: 220 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              "& fieldset": { borderColor: "#2e7d32" },
              "&:hover fieldset": { borderColor: "#2e7d32" },
              "&.Mui-focused fieldset": { borderColor: "#2e7d32" },
            },
          }}
          InputProps={{
            startAdornment: (
              <Wrapper.InputAdornment position="start">
                <Wrapper.SearchIcon fontSize="small" />
              </Wrapper.InputAdornment>
            ),
          }}
        />
        <Wrapper.Button
          variant="outlined"
          color="primary"
          startIcon={<Wrapper.RefreshIcon />}
          onClick={refreshInventory}
          sx={{
            borderRadius: 2,
            px: 2,
            borderColor: "primary.main",
            "&:hover": {
              bgcolor: Wrapper.alpha(theme.palette.primary.main, 0.1),
              borderColor: "primary.dark",
            },
          }}
        >
          Refresh
        </Wrapper.Button>
        <Wrapper.Button
          variant="outlined"
          color="error"
          startIcon={<Wrapper.DeleteIcon />}
          onClick={() =>
            selectedInventories.length > 0
              ? setMultipleDeleteConfirmation({ isOpen: true })
              : showNotification("No items selected", "warning")
          }
          disabled={selectedInventories.length === 0}
          sx={{
            borderRadius: 2,
            px: 2,
            borderColor: "error.main",
            color: "error.main",
            "&:hover": {
              bgcolor: Wrapper.alpha(theme.palette.error.main, 0.1),
              borderColor: "error.dark",
            },
            "&.Mui-disabled": { opacity: 0.6 },
          }}
        >
          Delete Selected
        </Wrapper.Button>
        {selectedTab === 0 && (
          <Wrapper.Box
            sx={{
              display: "flex",
              gap: 2,
              textWrap: "nowrap",
              flexWrap: "wrap",
            }}
          >
            <Wrapper.Button
              variant="contained"
              color="primary"
              startIcon={<Wrapper.AddIcon />}
              onClick={() => setProcessOpen(true)}
              sx={{
                borderRadius: 2,
                px: 2,
                bgcolor: "#348d39",
                "&:hover": {
                  bgcolor: "#2e7d32",
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                },
                boxShadow: 2,
              }}
            >
              Process Milk
            </Wrapper.Button>
            <Wrapper.Button
              variant="contained"
              startIcon={<Wrapper.AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{
                borderRadius: 2,
                px: 2,
                bgcolor: "#348d39",
                "&:hover": {
                  bgcolor: "#2e7d32",
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                },
                boxShadow: 2,
              }}
            >
              Add New Product
            </Wrapper.Button>
          </Wrapper.Box>
        )}
        {selectedTab === 1 && (
          <Wrapper.Button
            variant="contained"
            color="primary"
            startIcon={<Wrapper.AddIcon />}
            onClick={() => setFeedProcessOpen(true)}
            sx={{
              borderRadius: 2,
              px: 2,
              bgcolor: "#348d39",
              "&:hover": {
                bgcolor: "#2e7d32",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              },
              boxShadow: 2,
            }}
          >
            Process Feed
          </Wrapper.Button>
        )}
      </Wrapper.Box>
    </Wrapper.Box>
  );
};

export default InventoryHeader;

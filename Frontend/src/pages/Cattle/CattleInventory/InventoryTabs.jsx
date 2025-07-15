import Wrapper from "../../../utils/wrapper";
import PropTypes from "prop-types";

const InventoryTabs = ({
  selectedTab,
  setSelectedTab,
  setCurrentPage,
  setSelectedInventories,
  setSearchQuery,
}) => {
  return (
    <Wrapper.Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Wrapper.Tabs
        value={selectedTab}
        onChange={(e, newValue) => {
          setSelectedTab(newValue);
          setCurrentPage(1);
          setSelectedInventories([]);
          setSearchQuery("");
        }}
        aria-label="cattle inventory tabs"
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
        sx={{ "& .MuiTab-root": { fontWeight: "bold" } }}
      >
        <Wrapper.Tab label="Dairy Inventory" />
        <Wrapper.Tab label="Cattle Inventory" />
        <Wrapper.Tab label="Processed Items" />
      </Wrapper.Tabs>
    </Wrapper.Box>
  );
};

InventoryTabs.propTypes = {
  selectedTab: PropTypes.number.isRequired,
  setSelectedTab: PropTypes.func.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  setSelectedInventories: PropTypes.func.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
};

export default InventoryTabs;

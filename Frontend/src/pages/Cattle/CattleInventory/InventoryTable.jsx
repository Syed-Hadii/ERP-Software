import Wrapper from "../../../utils/wrapper";
import PropTypes from "prop-types";

const InventoryTable = ({
  loading,
  selectedTab,
  processingRecords,
  totalRecords,
  currentItems,
  selectedInventories,
  handleSelectAll,
  handleSort,
  sortOrder,
  handleSelectInventory,
  handleEditOpen,
  setDeleteId,
  setOpenDelete,
  dairyColumns,
  agroColumns,
  processingColumns,
  formatDate,
  handleUpdateStatus,
  currentPage,
  setCurrentPage,
  recordsPerPage,
}) => {
  const renderTableHeaders = (columns) => {
    return (
      <Wrapper.TableHead>
        <Wrapper.TableRow>
          <Wrapper.TableCell padding="checkbox">
            <Wrapper.Checkbox
              indeterminate={
                selectedInventories.length > 0 &&
                selectedInventories.length < currentItems.length
              }
              checked={
                currentItems.length > 0 &&
                selectedInventories.length === currentItems.length
              }
              onChange={handleSelectAll}
            />
          </Wrapper.TableCell>
          {columns.map((column) => (
            <Wrapper.TableCell
              key={column.key}
              sortDirection={
                sortOrder.key === column.key ? sortOrder.order : false
              }
            >
              {column.sortable ? (
                <Wrapper.TableSortLabel
                  active={sortOrder.key === column.key}
                  direction={
                    sortOrder.key === column.key ? sortOrder.order : "asc"
                  }
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                </Wrapper.TableSortLabel>
              ) : (
                column.label
              )}
            </Wrapper.TableCell>
          ))}
          <Wrapper.TableCell>Actions</Wrapper.TableCell>
        </Wrapper.TableRow>
      </Wrapper.TableHead>
    );
  };

  const renderTableBody = () => {
    const displayItems = selectedTab === 2 ? processingRecords : currentItems;

    if (loading) {
      return (
        <Wrapper.TableRow>
          <Wrapper.TableCell colSpan={100}>
            <Wrapper.Box
              sx={{ display: "flex", justifyContent: "center", p: 2 }}
            >
              <Wrapper.CircularProgress />
            </Wrapper.Box>
          </Wrapper.TableCell>
        </Wrapper.TableRow>
      );
    }

    if (!displayItems.length) {
      return (
        <Wrapper.TableRow>
          <Wrapper.TableCell colSpan={100}>
            <Wrapper.Typography variant="body1" align="center">
              No records found
            </Wrapper.Typography>
          </Wrapper.TableCell>
        </Wrapper.TableRow>
      );
    }

    return displayItems.map((item) => (
      <Wrapper.TableRow
        key={item._id}
        selected={selectedInventories.includes(item._id)}
      >
        <Wrapper.TableCell padding="checkbox">
          <Wrapper.Checkbox
            checked={selectedInventories.includes(item._id)}
            onChange={() => handleSelectInventory(item._id)}
          />
        </Wrapper.TableCell>
        {(selectedTab === 0
          ? dairyColumns
          : selectedTab === 1
          ? agroColumns
          : processingColumns
        ).map((column) => (
          <Wrapper.TableCell key={column.key}>
            {column.key === "lastUpdated" || column.key === "updatedAt"
              ? formatDate(item[column.key])
              : column.key.includes(".")
              ? column.key.split(".").reduce((obj, key) => obj?.[key], item)
              : item[column.key]}
          </Wrapper.TableCell>
        ))}
        <Wrapper.TableCell>
          <Wrapper.IconButton
            size="small"
            onClick={() => handleEditOpen(item)}
            color="primary"
          >
            <Wrapper.EditIcon />
          </Wrapper.IconButton>
          <Wrapper.IconButton
            size="small"
            onClick={() => {
              setDeleteId(item._id);
              setOpenDelete(true);
            }}
            color="error"
          >
            <Wrapper.DeleteIcon />
          </Wrapper.IconButton>
          {selectedTab === 2 && (
            <Wrapper.IconButton
              size="small"
              onClick={() => handleUpdateStatus(item._id)}
              color={item.status === "Completed" ? "success" : "warning"}
            >
              {item.status === "Completed" ? (
                <Wrapper.CheckCircleIcon />
              ) : (
                <Wrapper.PendingIcon />
              )}
            </Wrapper.IconButton>
          )}
        </Wrapper.TableCell>
      </Wrapper.TableRow>
    ));
  };

  return (
    <Wrapper.Box sx={{ width: "100%", mb: 4 }}>
      <Wrapper.Paper sx={{ width: "100%", mb: 2 }}>
        <Wrapper.TableContainer>
          <Wrapper.Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            {renderTableHeaders(
              selectedTab === 0
                ? dairyColumns
                : selectedTab === 1
                ? agroColumns
                : processingColumns
            )}
            <Wrapper.TableBody>{renderTableBody()}</Wrapper.TableBody>
          </Wrapper.Table>
        </Wrapper.TableContainer>
        <Wrapper.TablePagination
          component="div"
          count={totalRecords}
          page={currentPage - 1}
          onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
          rowsPerPage={recordsPerPage}
          rowsPerPageOptions={[recordsPerPage]}
        />
      </Wrapper.Paper>
    </Wrapper.Box>
  );
};

InventoryTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  selectedTab: PropTypes.number.isRequired,
  processingRecords: PropTypes.array.isRequired,
  totalRecords: PropTypes.number.isRequired,
  currentItems: PropTypes.array.isRequired,
  selectedInventories: PropTypes.array.isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleSort: PropTypes.func.isRequired,
  sortOrder: PropTypes.shape({
    key: PropTypes.string.isRequired,
    order: PropTypes.string.isRequired,
  }).isRequired,
  handleSelectInventory: PropTypes.func.isRequired,
  handleEditOpen: PropTypes.func.isRequired,
  setDeleteId: PropTypes.func.isRequired,
  setOpenDelete: PropTypes.func.isRequired,
  dairyColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
    })
  ).isRequired,
  agroColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
    })
  ).isRequired,
  processingColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
    })
  ).isRequired,
  formatDate: PropTypes.func.isRequired,
  handleUpdateStatus: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  recordsPerPage: PropTypes.number.isRequired,
};

export default InventoryTable;

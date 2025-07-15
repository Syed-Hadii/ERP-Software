import Wrapper from "../../../utils/wrapper";
import ReusableModal from "../../../components/Modals/ReusableModal";

const InventoryModals = ({
  processOpen,
  setProcessOpen,
  feedProcessOpen,
  setFeedProcessOpen,
  editOpen,
  setEditOpen,
  addOpen,
  setAddOpen,
  openDelete,
  setOpenDelete,
  multipleDeleteConfirmation,
  setMultipleDeleteConfirmation,
  notification,
  handleCloseNotification,
  processMilkFields,
  processFeedFields,
  dairyFields,
  agroFields,
  productFields,
  handleProcessMilk,
  handleProcessFeed,
  handleEdit,
  handleAddProduct,
  handleDelete,
  handleConfirmMultipleDelete,
  loading,
  selectedInventory,
  selectedTab,
  selectedInventories,
}) => {
  return (
    <>
      <ReusableModal
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        title="Process Raw Milk"
        fields={processMilkFields}
        values={{
          rawMilkProductId: "",
          inputMilkQuantity: "",
          operator: "",
          outputProducts: [{ productId: "", quantity: "" }],
          status: "pending",
          notes: "",
        }}
        onSubmit={handleProcessMilk}
        loading={loading}
      />
      <ReusableModal
        open={feedProcessOpen}
        onClose={() => setFeedProcessOpen(false)}
        title="Process Cattle Feed"
        fields={processFeedFields}
        values={{
          inputProducts: [{ item: "", quantity: "" }],
          outputProduct: { item: "", quantity: "" },
        }}
        onSubmit={handleProcessFeed}
        loading={loading}
      />
      <ReusableModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Inventory Item"
        fields={selectedTab === 0 ? dairyFields : agroFields}
        values={{
          ...selectedInventory,
          productId:
            selectedInventory?.productId?._id || selectedInventory?.productId,
          item: selectedInventory?.item?._id || selectedInventory?.item,
        }}
        onSubmit={handleEdit}
        loading={loading}
      />
      <ReusableModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Product"
        fields={productFields}
        onSubmit={handleAddProduct}
        loading={loading}
      />
      <Wrapper.Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>Confirm Delete</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography>
            Are you sure you want to delete this{" "}
            {selectedTab === 2 ? "processing record" : "inventory item"}? This
            action cannot be undone.
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button onClick={() => setOpenDelete(false)} color="primary">
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
      <Wrapper.Dialog
        open={multipleDeleteConfirmation.isOpen}
        onClose={() => setMultipleDeleteConfirmation({ isOpen: false })}
        maxWidth="sm"
        fullWidth
      >
        <Wrapper.DialogTitle>Confirm Multiple Delete</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography>
            Are you sure you want to delete {selectedInventories.length}{" "}
            {selectedInventories.length === 1
              ? selectedTab === 2
                ? "processing record"
                : "inventory item"
              : selectedTab === 2
              ? "processing records"
              : "inventory items"}
            ? This action cannot be undone.
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions>
          <Wrapper.Button
            onClick={() => setMultipleDeleteConfirmation({ isOpen: false })}
            color="primary"
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            onClick={handleConfirmMultipleDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
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
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Wrapper.Alert>
      </Wrapper.Snackbar>
    </>
  );
};

export default InventoryModals;

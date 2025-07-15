import Wrapper from "../utils/wrapper";

const DeleteModal = ({ open, handleClose, handleDelete, message }) => {
  return (
    <Wrapper.Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <Wrapper.DialogTitle
        sx={{
          borderBottom: "1px solid #e0e0e0",
          pb: 2,
        }}
      >
        <Wrapper.Box display="flex" alignItems="center">
          <Wrapper.WarningIcon sx={{ color: "error.main", mr: 1 }} />
          Confirm Deletion
        </Wrapper.Box>
      </Wrapper.DialogTitle>
      <Wrapper.DialogContent sx={{ mt: 2 }}>
        <Wrapper.Typography variant="body1">
          {message ||
            "Are you sure you want to delete this item? This action cannot be undone."}
        </Wrapper.Typography>
      </Wrapper.DialogContent>
      <Wrapper.DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Wrapper.Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          startIcon={<Wrapper.CancelIcon />}
        >
          Cancel
        </Wrapper.Button>
        <Wrapper.Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          startIcon={<Wrapper.DeleteIcon />}
          sx={{ ml: 1 }}
        >
          Confirm
        </Wrapper.Button>
      </Wrapper.DialogActions>
    </Wrapper.Dialog>
  );
};

export default DeleteModal;

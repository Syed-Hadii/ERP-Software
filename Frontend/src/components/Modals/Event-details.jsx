import PropTypes from "prop-types";
import { useState } from "react";
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";

const EventDetailsModal = ({ open, onClose, event, module, onEventUpdate }) => {
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(event.status || "Pending");
  const [updating, setUpdating] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  console.log("Event Details Modal", event);
  const getEventColor = (type) => {
    if (module === "crop") {
      switch (type) {
        case "harvest":
          return "bg-green-100 text-green-800 border-green-200";
        case "irrigation":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "fertilization":
          return "bg-amber-100 text-amber-800 border-amber-200";
        case "pesticide":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    } else {
      switch (type) {
        case "vaccination":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "treatment":
          return "bg-red-100 text-red-800 border-red-200";
        case "check-up":
          return "bg-green-100 text-green-800 border-green-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }
  };

  const getEventBackground = (type) => {
    if (module === "crop") {
      switch (type) {
        case "harvest":
          return "rgba(46, 125, 50, 0.04)";
        case "irrigation":
          return "rgba(25, 118, 210, 0.04)";
        case "fertilization":
          return "rgba(237, 108, 2, 0.04)";
        case "pesticide":
          return "rgba(211, 47, 47, 0.04)";
        default:
          return "rgba(0, 0, 0, 0.04)";
      }
    } else {
      switch (type) {
        case "vaccination":
          return "rgba(25, 118, 210, 0.04)";
        case "treatment":
          return "rgba(211, 47, 47, 0.04)";
        case "check-up":
          return "rgba(46, 125, 50, 0.04)";
        default:
          return "rgba(0, 0, 0, 0.04)";
      }
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      let endpoint =
        module === "cattle" ? `${BASE_URL}/health/${event.id}` : "";
      if (module === "crop") {
        switch (event.type) {
          case "irrigation":
            endpoint = `${BASE_URL}/schedule/irrigation/${event.id}`;
            break;
          case "fertilization":
            endpoint = `${BASE_URL}/schedule/fertilization/${event.id}`;
            break;
          case "pesticide":
            endpoint = `${BASE_URL}/schedule/pesticide/${event.id}`;
            break;
          default:
            throw new Error("Unknown event type");
        }
      }

      await Wrapper.axios.put(endpoint, { status: newStatus });
      setStatusUpdateOpen(false);
      if (onEventUpdate) {
        onEventUpdate({
          ...event,
          status: newStatus,
        });
      }
      Wrapper.toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      Wrapper.toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const missingStyle = {
    color: "#f97316",
    fontStyle: "italic",
    fontSize: "0.9rem",
  };

  return (
    <Wrapper.Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Wrapper.DialogTitle>Event Details</Wrapper.DialogTitle>
      <Wrapper.DialogContent
        sx={{ p: 3, bgcolor: getEventBackground(event.type) }}
      >
        <Wrapper.Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <Wrapper.Box className="flex items-center space-x-3">
            <Wrapper.Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0, 0, 0, 0.04)",
              }}
            >
              <Wrapper.CalendarMonthIcon sx={{ color: "#2e7d32" }} />
            </Wrapper.Box>
            <Wrapper.Box>
              <Wrapper.Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                Scheduled Date
              </Wrapper.Typography>
              <Wrapper.Typography variant="body1" sx={{ fontWeight: 500 }}>
                {event.date ? (
                  formatDate(event.date)
                ) : (
                  <span style={missingStyle}>Date not specified</span>
                )}
              </Wrapper.Typography>
            </Wrapper.Box>
          </Wrapper.Box>
        </Wrapper.Paper>

        <Wrapper.Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <Wrapper.Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Assignment Details
          </Wrapper.Typography>
          <Wrapper.Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {module === "crop" ? (
              <>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.AgricultureIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Crop
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.crop || (
                        <span style={missingStyle}>Unknown crop</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.LocationOnIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Field
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.field || (
                        <span style={missingStyle}>Unknown field</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.PersonIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Assigned To
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.assignedTo || (
                        <span style={missingStyle}>Not assigned</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.AssignmentTurnedInIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Status
                    </Wrapper.Typography>
                    <Wrapper.Chip
                      label={event.status}
                      size="small"
                      color={
                        event.status?.toLowerCase() === "completed"
                          ? "success"
                          : event.status?.toLowerCase() === "pending"
                          ? "warning"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.PersonIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Event Type
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.type || (
                        <span style={missingStyle}>Undefined</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
              </>
            ) : (
              <>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.PetsIcon sx={{ color: "#2e7d32", fontSize: 20 }} />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Cattle ID
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.cattleId || (
                        <span style={missingStyle}>Unknown cattle</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.MedicalServicesIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Event Type
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.eventType || (
                        <span style={missingStyle}>Unknown type</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.MedicationIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Vaccine/Medicine
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.medicineId || (
                        <span style={missingStyle}>Not specified</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.ScienceIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Dosage
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.dosage || (
                        <span style={missingStyle}>Not specified</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.PersonIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Vet Technician
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.vetTechnician || (
                        <span style={missingStyle}>Not specified</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.EventIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Next Due Date
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1">
                      {event.nextDueDate ? (
                        formatDate(event.nextDueDate)
                      ) : (
                        <span style={missingStyle}>Not specified</span>
                      )}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                </Wrapper.Box>
                <Wrapper.Box className="flex items-center space-x-3">
                  <Wrapper.Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(46, 125, 50, 0.1)",
                    }}
                  >
                    <Wrapper.AssignmentTurnedInIcon
                      sx={{ color: "#2e7d32", fontSize: 20 }}
                    />
                  </Wrapper.Box>
                  <Wrapper.Box>
                    <Wrapper.Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Status
                    </Wrapper.Typography>
                    <Wrapper.Chip
                      label={event.status}
                      size="small"
                      color={
                        event.status?.toLowerCase() === "completed"
                          ? "success"
                          : event.status?.toLowerCase() === "pending"
                          ? "warning"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Wrapper.Box>
                </Wrapper.Box>
              </>
            )}
          </Wrapper.Box>
        </Wrapper.Paper>

        <Wrapper.Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <Wrapper.Box className="flex items-center space-x-2 mb-2">
            <Wrapper.DescriptionIcon sx={{ color: "#2e7d32" }} />
            <Wrapper.Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Details
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Typography
            variant="body2"
            className="whitespace-pre-line"
            sx={{
              p: 2,
              bgcolor: "rgba(0, 0, 0, 0.02)",
              borderRadius: 1,
              border: "1px solid rgba(0, 0, 0, 0.04)",
            }}
          >
            {event.description || (
              <span style={missingStyle}>No details provided</span>
            )}
          </Wrapper.Typography>
        </Wrapper.Paper>

        {event.notes && (
          <Wrapper.Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: "white",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <Wrapper.Box className="flex items-center space-x-2 mb-2">
              <Wrapper.StickyNote2Icon sx={{ color: "#2e7d32" }} />
              <Wrapper.Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notes
              </Wrapper.Typography>
            </Wrapper.Box>
            <Wrapper.Typography
              variant="body2"
              sx={{
                p: 2,
                bgcolor: "rgba(46, 125, 50, 0.04)",
                borderRadius: 1,
                border: "1px solid rgba(46, 125, 50, 0.1)",
              }}
            >
              {event.notes}
            </Wrapper.Typography>
          </Wrapper.Paper>
        )}

        <Wrapper.Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          <Wrapper.Box className="flex items-center space-x-2 mb-2">
            <Wrapper.LocalOfferIcon sx={{ color: "#2e7d32" }} />
            <Wrapper.Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Tags
            </Wrapper.Typography>
          </Wrapper.Box>
          <Wrapper.Box className="flex flex-wrap gap-1 pt-1">
            {event.tags && event.tags.length > 0 ? (
              event.tags.map((tag, index) => (
                <Wrapper.Chip
                  key={index}
                  label={tag}
                  size="small"
                  className={`${getEventColor(event.type)}`}
                  sx={{
                    borderRadius: "16px",
                    fontWeight: 500,
                    px: 0.5,
                    border: "1px solid",
                  }}
                />
              ))
            ) : (
              <Wrapper.Typography variant="body2" style={missingStyle}>
                No tags
              </Wrapper.Typography>
            )}
          </Wrapper.Box>
        </Wrapper.Paper>

        <Wrapper.Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Wrapper.Button
            variant="contained"
            color="primary"
            startIcon={<Wrapper.EditIcon />}
            onClick={() => setStatusUpdateOpen(true)}
            disabled={event.status?.toLowerCase() === "completed"}
            sx={{ px: 3, py: 1, borderRadius: 2 }}
          >
            Update Status
          </Wrapper.Button>
        </Wrapper.Box>

        <Wrapper.Dialog
          open={statusUpdateOpen}
          onClose={() => setStatusUpdateOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <Wrapper.DialogTitle>Update Event Status</Wrapper.DialogTitle>
          <Wrapper.DialogContent>
            <Wrapper.Box sx={{ mt: 2 }}>
              <Wrapper.FormControl fullWidth>
                <Wrapper.InputLabel id="status-select-label">
                  Status
                </Wrapper.InputLabel>
                <Wrapper.Select
                  labelId="status-select-label"
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <Wrapper.MenuItem value="Pending">Pending</Wrapper.MenuItem>
                  <Wrapper.MenuItem value="Completed">
                    Completed
                  </Wrapper.MenuItem>
                </Wrapper.Select>
              </Wrapper.FormControl>
            </Wrapper.Box>
          </Wrapper.DialogContent>
          <Wrapper.DialogActions sx={{ p: 2, pt: 0 }}>
            <Wrapper.Button onClick={() => setStatusUpdateOpen(false)}>
              Cancel
            </Wrapper.Button>
            <Wrapper.Button
              variant="contained"
              color="primary"
              onClick={handleUpdateStatus}
              disabled={updating || event.status?.toLowerCase() === "completed"}
            >
              {updating ? "Updating..." : "Update Status"}
            </Wrapper.Button>
          </Wrapper.DialogActions>
        </Wrapper.Dialog>
      </Wrapper.DialogContent>
    </Wrapper.Dialog>
  );
};

EventDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  event: PropTypes.shape({
    id: PropTypes.string,
    date: PropTypes.string,
    crop: PropTypes.string,
    field: PropTypes.string,
    assignedTo: PropTypes.string,
    description: PropTypes.string,
    notes: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    type: PropTypes.string.isRequired,
    status: PropTypes.string,
    cattleId: PropTypes.string,
    eventType: PropTypes.string,
    medicineId: PropTypes.string,
    dosage: PropTypes.string,
    vetTechnician: PropTypes.string,
    nextDueDate: PropTypes.string,
  }).isRequired,
  module: PropTypes.oneOf(["crop", "cattle"]).isRequired,
  onEventUpdate: PropTypes.func,
};

export default EventDetailsModal;

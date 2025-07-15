"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Wrapper from "../../utils/wrapper";
import ReusableModal from "../../components/Modals/ReusableModal";
import { BASE_URL } from "../../config/config";
import ScheduleModal from "../../components/Modals/ScheduleModals";
import { motion } from "framer-motion";
import cropImg from "../../assets/crop.jpg";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedules, setSchedules] = useState({
    irrigation: [],
    fertilization: [],
    pesticide: [],
  });
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    scheduleId: null,
    scheduleType: null,
  });

  // Status field for the modal
  const statusField = {
    name: "cropStatus",
    label: "Status",
    placeholder: "Select status",
    type: "select",
    options: [
      { value: "Planned", label: "Planned" },
      { value: "Active", label: "Active" },
      { value: "Harvested", label: "Harvested" },
    ],
    icon: <Wrapper.InfoIcon fontSize="small" color="action" />,
  };

  // Fetch crop details
  const fetchCropDetails = async () => {
    setLoading(true);
    console.log("Fetching crop details for ID:", id);
    try {
      const res = await Wrapper.axios.get(`${BASE_URL}/cropSow/${id}`);
      console.log("Crop data received:", res.data);
      if (res.data) {
        setCrop(res.data);
      } else {
        console.error("No crop data in response");
        Wrapper.toast.error("Crop not found");
        navigate("/crop-sow");
      }
    } catch (error) {
      console.error("Error fetching crop details:", error);
      const errorMessage =
        error.response?.data?.message || "Error loading crop details";
      Wrapper.toast.error(errorMessage);
      navigate("/crop-sow");
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedules for this crop
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    console.log("Fetching schedules for crop ID:", id);
    try {
      // Fetch all schedule types in parallel
      const [irrigationRes, fertilizationRes, pesticideRes] = await Promise.all(
        [
          Wrapper.axios.get(`${BASE_URL}/schedule/irrigation?crop=${id}`),
          Wrapper.axios.get(`${BASE_URL}/schedule/fertilization?crop=${id}`),
          Wrapper.axios.get(`${BASE_URL}/schedule/pesticide?crop=${id}`),
        ]
      );

      console.log("Schedule data received:", {
        irrigation: irrigationRes.data,
        fertilization: fertilizationRes.data,
        pesticide: pesticideRes.data,
      });

      setSchedules({
        irrigation: irrigationRes.data || [],
        fertilization: fertilizationRes.data || [],
        pesticide: pesticideRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching schedules:", error);
      Wrapper.toast.error("Failed to load schedules");
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Update crop status
  const handleUpdateStatus = async (form) => {
    try {
      await Wrapper.axios.put(`${BASE_URL}/cropSow/${id}`, {
        cropStatus: form.cropStatus,
      });
      Wrapper.toast.success("Status updated successfully!");
      setStatusModalOpen(false);
      fetchCropDetails();
    } catch (error) {
      console.error("Error updating status:", error);
      const msg = error.response?.data?.message || "Operation failed";
      Wrapper.toast.error(msg);
    }
  };

  // Handle schedule submission
  const handleScheduleSubmit = async (newSchedule) => {
    try {
      console.log("Received schedule data:", newSchedule);

      // Since we're now getting fully populated data back from the API,
      // we directly add the response to our schedules state
      if (scheduleType === "Irrigation") {
        setSchedules((prev) => ({
          ...prev,
          irrigation: [...prev.irrigation, newSchedule],
        }));
      } else if (scheduleType === "Fertilization") {
        setSchedules((prev) => ({
          ...prev,
          fertilization: [...prev.fertilization, newSchedule],
        }));
      } else if (scheduleType === "Pesticide") {
        setSchedules((prev) => ({
          ...prev,
          pesticide: [...prev.pesticide, newSchedule],
        }));
      }

      // Refresh schedules to get the latest data
      fetchSchedules();
    } catch (error) {
      console.error("Error updating schedules:", error);
    }
  };

  // Handle schedule deletion
  const handleDeleteSchedule = async () => {
    try {
      if (!deleteConfirmation.scheduleId || !deleteConfirmation.scheduleType) {
        return;
      }

      const { scheduleId, scheduleType } = deleteConfirmation;
      const endpoint = `${BASE_URL}/schedule/${scheduleType.toLowerCase()}/${scheduleId}`;

      await Wrapper.axios.delete(endpoint);

      // Remove the schedule from local state
      setSchedules((prev) => {
        const scheduleKey = scheduleType.toLowerCase();
        return {
          ...prev,
          [scheduleKey]: prev[scheduleKey].filter(
            (item) => item._id !== scheduleId
          ),
        };
      });

      // Close the confirmation dialog and show success message
      setDeleteConfirmation({
        isOpen: false,
        scheduleId: null,
        scheduleType: null,
      });

      Wrapper.toast.success(`${scheduleType} schedule deleted successfully!`);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      Wrapper.toast.error("Failed to delete schedule");
    }
  };

  // Open delete confirmation dialog
  const openDeleteConfirmation = (scheduleId, scheduleType) => {
    setDeleteConfirmation({
      isOpen: true,
      scheduleId,
      scheduleType,
    });
  };

  // Open specific schedule modal
  const openScheduleModal = (type) => {
    setScheduleType(type);
    setScheduleModalOpen(true);
  };

  // Initial load
  useEffect(() => {
    if (id) {
      console.log("CropDetails component mounted with cropId:", id);
      fetchCropDetails();
      fetchSchedules();
    } else {
      console.error("No crop ID provided in URL");
      navigate("/crop-sow");
    }
  }, [id]);

  // Get count of schedules by type and status
  const getScheduleCount = (type, status = null) => {
    const scheduleList = schedules[type.toLowerCase()] || [];
    if (status) {
      return scheduleList.filter((s) => s.status === status).length;
    }
    return scheduleList.length;
  };

  if (loading) {
    return (
      <Wrapper.Box sx={{ p: 4, maxWidth: "1200px", mx: "auto" }}>
        <Wrapper.Skeleton
          variant="rectangular"
          height={60}
          sx={{ mb: 2, borderRadius: 1 }}
        />
        <Wrapper.Skeleton
          variant="rectangular"
          height={400}
          sx={{ mb: 3, borderRadius: 2 }}
        />
        <Wrapper.Grid container spacing={2}>
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 2 }}
            />
          </Wrapper.Grid>
          <Wrapper.Grid item xs={12} md={6}>
            <Wrapper.Skeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 2 }}
            />
          </Wrapper.Grid>
        </Wrapper.Grid>
      </Wrapper.Box>
    );
  }

  if (!crop) {
    return (
      <Wrapper.Box sx={{ p: 4, textAlign: "center" }}>
        <Wrapper.Typography variant="h5" color="error">
          Crop not found
        </Wrapper.Typography>
        <Wrapper.Button
          variant="contained"
          onClick={() => navigate("/crop-sow")}
          sx={{ mt: 2 }}
        >
          Return to Crop Sowing
        </Wrapper.Button>
      </Wrapper.Box>
    );
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "#10b981";
      case "Harvested":
        return "#f59e0b";
      case "Planned":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const cropName = crop.crop?.name || "Unknown Crop";
  const statusColor = getStatusColor(crop.cropStatus);

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1200px", mx: "auto" }}>
      {/* Header with back button */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Wrapper.Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
          <Wrapper.Button
            startIcon={<Wrapper.ArrowBackIcon />}
            onClick={() => {
              console.log("Navigating back to crop-sow page");
              navigate("/crop-sow");
            }}
            sx={{ mr: 2 }}
          >
            Back
          </Wrapper.Button>
          <Wrapper.Typography variant="h4" component="h1" fontWeight="bold">
            Crop Details
          </Wrapper.Typography>
        </Wrapper.Box>
      </motion.div>

      {/* Main content */}
      <Wrapper.Grid container spacing={4}>
        {/* Left column - Main info */}
        <Wrapper.Grid item xs={12} md={7}>
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
          >
            <Wrapper.Card
              className="mui-card mui-image-bg"
              sx={{
                height: "100%",
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${cropImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",

                color: "white",
                mb: { xs: 3, md: 0 },
              }}
            >
              <Wrapper.CardContent className="mui-content" sx={{ p: 4 }}>
                <Wrapper.Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 4,
                  }}
                >
                  <Wrapper.Typography
                    variant="h3"
                    component="h2"
                    fontWeight="bold"
                  >
                    {cropName}
                  </Wrapper.Typography>
                  <Wrapper.Chip
                    label={crop.cropStatus}
                    sx={{
                      bgcolor: statusColor,
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                      px: 2,
                      height: 32,
                    }}
                  />
                </Wrapper.Box>

                <Wrapper.Grid container spacing={3}>
                  <Wrapper.Grid item xs={12} sm={6}>
                    <Wrapper.Box sx={{ mb: 3 }}>
                      <Wrapper.Typography
                        variant="overline"
                        sx={{ opacity: 0.7 }}
                      >
                        VARIETY
                      </Wrapper.Typography>
                      <Wrapper.Typography variant="h6">
                        {crop.variety?.variety || "Standard"}
                      </Wrapper.Typography>
                    </Wrapper.Box>

                    <Wrapper.Box sx={{ mb: 3 }}>
                      <Wrapper.Typography
                        variant="overline"
                        sx={{ opacity: 0.7 }}
                      >
                        FARMER
                      </Wrapper.Typography>
                      <Wrapper.Typography variant="h6">
                        {crop.farmer?.name || "Unknown"}
                      </Wrapper.Typography>
                    </Wrapper.Box>

                    <Wrapper.Box>
                      <Wrapper.Typography
                        variant="overline"
                        sx={{ opacity: 0.7 }}
                      >
                        LAND
                      </Wrapper.Typography>
                      <Wrapper.Typography variant="h6">
                        {crop.land?.name || "Unknown"}
                      </Wrapper.Typography>
                    </Wrapper.Box>
                  </Wrapper.Grid>

                  <Wrapper.Grid item xs={12} sm={6}>
                    <Wrapper.Box sx={{ mb: 3 }}>
                      <Wrapper.Typography
                        variant="overline"
                        sx={{ opacity: 0.7 }}
                      >
                        SOWING DATE
                      </Wrapper.Typography>
                      <Wrapper.Typography variant="h6">
                        {new Date(crop.seedSowingDate).toLocaleDateString()}
                      </Wrapper.Typography>
                    </Wrapper.Box>

                    <Wrapper.Box sx={{ mb: 3 }}>
                      <Wrapper.Typography
                        variant="overline"
                        sx={{ opacity: 0.7 }}
                      >
                        EXPECTED HARVEST
                      </Wrapper.Typography>
                      <Wrapper.Typography variant="h6">
                        {new Date(
                          crop.expectedHarvestDate
                        ).toLocaleDateString()}
                      </Wrapper.Typography>
                    </Wrapper.Box>

                    <Wrapper.Box>
                      <Wrapper.Typography
                        variant="overline"
                        sx={{ opacity: 0.7 }}
                      >
                        YIELD ESTIMATE
                      </Wrapper.Typography>
                      <Wrapper.Typography variant="h6">
                        {crop.yieldEstimate || "Not specified"}
                      </Wrapper.Typography>
                    </Wrapper.Box>
                  </Wrapper.Grid>
                </Wrapper.Grid>

                {crop.notes && (
                  <Wrapper.Box sx={{ mt: 4 }}>
                    <Wrapper.Typography
                      variant="overline"
                      sx={{ opacity: 0.7 }}
                    >
                      NOTES
                    </Wrapper.Typography>
                    <Wrapper.Typography variant="body1" sx={{ mt: 1 }}>
                      {crop.notes}
                    </Wrapper.Typography>
                  </Wrapper.Box>
                )}

                <Wrapper.Button
                  variant="contained"
                  onClick={() => setStatusModalOpen(true)}
                  startIcon={<Wrapper.EditIcon />}
                  sx={{
                    mt: 4,
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                >
                  Update Status
                </Wrapper.Button>
              </Wrapper.CardContent>
            </Wrapper.Card>
          </motion.div>
        </Wrapper.Grid>

        {/* Right column - Schedules */}
        <Wrapper.Grid item xs={12} md={5}>
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Wrapper.Card className="mui-card" sx={{ mb: 3 }}>
              <Wrapper.CardHeader
                className="mui-card-header"
                title="Schedules"
                titleTypographyProps={{ variant: "h5", fontWeight: "bold" }}
              />
              <Wrapper.CardContent className="mui-content">
                {loadingSchedules ? (
                  <Wrapper.Box
                    sx={{ display: "flex", justifyContent: "center", p: 3 }}
                  >
                    <Wrapper.CircularProgress size={30} />
                  </Wrapper.Box>
                ) : (
                  <Wrapper.List disablePadding>
                    {[
                      {
                        type: "Irrigation",
                        icon: <Wrapper.OpacityIcon color="primary" />,
                        color: "primary",
                      },
                      {
                        type: "Fertilization",
                        icon: <Wrapper.EcoIcon color="success" />,
                        color: "success",
                      },
                      {
                        type: "Pesticide",
                        icon: <Wrapper.BugReportIcon color="warning" />,
                        color: "warning",
                      },
                    ].map(({ type, icon, color }) => (
                      <Wrapper.ListItem
                        key={type}
                        disablePadding
                        sx={{ mb: 2 }}
                      >
                        <Wrapper.Card
                          variant="outlined"
                          sx={{
                            width: "100%",
                            borderRadius: 2,
                            p: 0,
                            overflow: "hidden",
                            transition: "all 0.2s",
                            "&:hover": {
                              boxShadow: 3,
                            },
                          }}
                        >
                          <Wrapper.CardActionArea
                            onClick={() => openScheduleModal(type)}
                            sx={{ p: 2 }}
                          >
                            <Wrapper.Box
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              {icon}
                              <Wrapper.Box sx={{ flexGrow: 1, ml: 2 }}>
                                <Wrapper.Typography
                                  variant="h6"
                                  fontWeight="medium"
                                >
                                  {type} Schedule
                                </Wrapper.Typography>
                                <Wrapper.Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {getScheduleCount(type)} schedules (
                                  {getScheduleCount(type, "pending")} pending)
                                </Wrapper.Typography>
                              </Wrapper.Box>
                              <Wrapper.Box>
                                <Wrapper.Tooltip title={`Add ${type} Schedule`}>
                                  <Wrapper.IconButton
                                    size="small"
                                    color={color}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openScheduleModal(type);
                                    }}
                                  >
                                    <Wrapper.AddCircleOutlineIcon />
                                  </Wrapper.IconButton>
                                </Wrapper.Tooltip>
                              </Wrapper.Box>
                            </Wrapper.Box>
                          </Wrapper.CardActionArea>
                        </Wrapper.Card>
                      </Wrapper.ListItem>
                    ))}
                  </Wrapper.List>
                )}
              </Wrapper.CardContent>
            </Wrapper.Card>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <Wrapper.Card className="mui-card">
              <Wrapper.CardHeader
                className="mui-card-header"
                title="Recent Activities"
                titleTypographyProps={{ variant: "h5", fontWeight: "bold" }}
              />
              <Wrapper.CardContent className="mui-content">
                {loadingSchedules ? (
                  <Wrapper.Box
                    sx={{ display: "flex", justifyContent: "center", p: 3 }}
                  >
                    <Wrapper.CircularProgress size={30} />
                  </Wrapper.Box>
                ) : (
                  <Wrapper.Timeline className="mui-timeline" position="right">
                    {[
                      ...schedules.irrigation,
                      ...schedules.fertilization,
                      ...schedules.pesticide,
                    ]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 5)
                      .map((schedule, index) => {
                        // Determine schedule type and icon
                        let icon, color, typeLabel;
                        if ("method" in schedule) {
                          icon = <Wrapper.OpacityIcon />;
                          color = "primary";
                          typeLabel = "Irrigation";
                        } else if ("fertilizer" in schedule) {
                          icon = <Wrapper.EcoIcon />;
                          color = "success";
                          typeLabel = "Fertilization";
                        } else {
                          icon = <Wrapper.BugReportIcon />;
                          color = "warning";
                          typeLabel = "Pesticide";
                        }

                        return (
                          <Wrapper.TimelineItem
                            key={index}
                            className="mui-timeline-item"
                          >
                            <Wrapper.TimelineSeparator>
                              <Wrapper.TimelineDot color={color}>
                                {icon}
                              </Wrapper.TimelineDot>
                              {index < 4 && <Wrapper.TimelineConnector />}
                            </Wrapper.TimelineSeparator>
                            <Wrapper.TimelineContent className="mui-timeline-content">
                              <Wrapper.Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Wrapper.Box>
                                  <Wrapper.Typography
                                    variant="subtitle2"
                                    component="span"
                                  >
                                    {typeLabel}{" "}
                                    {schedule.status === "completed"
                                      ? "(Completed)"
                                      : "(Pending)"}
                                  </Wrapper.Typography>
                                  <Wrapper.Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {new Date(
                                      schedule.date
                                    ).toLocaleDateString()}
                                  </Wrapper.Typography>
                                </Wrapper.Box>
                                <Wrapper.IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    openDeleteConfirmation(
                                      schedule._id,
                                      typeLabel
                                    )
                                  }
                                >
                                  <Wrapper.DeleteOutlineIcon fontSize="small" />
                                </Wrapper.IconButton>
                              </Wrapper.Box>
                            </Wrapper.TimelineContent>
                          </Wrapper.TimelineItem>
                        );
                      })}

                    {[
                      ...schedules.irrigation,
                      ...schedules.fertilization,
                      ...schedules.pesticide,
                    ].length === 0 && (
                      <Wrapper.Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{ py: 4 }}
                      >
                        No activities recorded yet
                      </Wrapper.Typography>
                    )}
                  </Wrapper.Timeline>
                )}
              </Wrapper.CardContent>
            </Wrapper.Card>
          </motion.div>
        </Wrapper.Grid>
      </Wrapper.Grid>

      {/* Status update modal */}
      <ReusableModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={handleUpdateStatus}
        title="Update Crop Status"
        fields={[statusField]}
        initialData={{ cropStatus: crop.cropStatus }}
        submitButtonText="Update Status"
      />

      {/* Schedule modal */}
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSubmit={handleScheduleSubmit}
        scheduleType={scheduleType}
        cropId={id}
      />

      {/* Delete Confirmation Dialog */}
      <Wrapper.Dialog
        open={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({
            isOpen: false,
            scheduleId: null,
            scheduleType: null,
          })
        }
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Wrapper.DialogTitle>Delete Schedule</Wrapper.DialogTitle>
        <Wrapper.DialogContent>
          <Wrapper.Typography variant="body1">
            Are you sure you want to delete this{" "}
            {deleteConfirmation.scheduleType} schedule? This action cannot be
            undone.
          </Wrapper.Typography>
        </Wrapper.DialogContent>
        <Wrapper.DialogActions sx={{ p: 2 }}>
          <Wrapper.Button
            variant="outlined"
            onClick={() =>
              setDeleteConfirmation({
                isOpen: false,
                scheduleId: null,
                scheduleType: null,
              })
            }
          >
            Cancel
          </Wrapper.Button>
          <Wrapper.Button
            variant="contained"
            color="error"
            onClick={handleDeleteSchedule}
          >
            Delete
          </Wrapper.Button>
        </Wrapper.DialogActions>
      </Wrapper.Dialog>
    </Wrapper.Box>
  );
};

export default CropDetails;

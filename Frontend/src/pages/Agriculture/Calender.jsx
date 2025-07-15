"use client";

import { useState, useEffect } from "react";
import EventDetailsModal from "../../components/Modals/Event-details"; // Import EventDetailsModal
import Wrapper from "../../utils/wrapper";
import { BASE_URL } from "../../config/config";
import ScheduleModal from "../../components/Modals/ScheduleModals";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);  
  const [loading, setLoading] = useState(true);
  const [cropEvents, setCropEvents] = useState([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState(null);
  const [viewMode, setViewMode] = useState("month");  

  // Fetch crop events (schedules) from the backend
  const fetchCropEvents = async () => {
    setLoading(true);
    try {
      const [irrigationRes, fertilizationRes, pesticideRes] = await Promise.all(
        [
          Wrapper.axios.get(`${BASE_URL}/schedule/irrigation`),
          Wrapper.axios.get(`${BASE_URL}/schedule/fertilization`),
          Wrapper.axios.get(`${BASE_URL}/schedule/pesticide`),
        ]
      );
      console.log("Irrigation Schedules:", irrigationRes.data);
      console.log("Fertilization Schedules:", fertilizationRes.data);
      console.log("Pesticide Schedules:", pesticideRes.data);
      // Process irrigation schedules
      const irrigationEvents = (irrigationRes.data || []).map((schedule) => ({
        id: schedule._id,
        title: `Irrigation: ${schedule.crop?.crop?.name || "Unknown Crop"}`,
        date: new Date(schedule.date).toISOString().split("T")[0],
        type: "irrigation",
        crop: schedule.crop?.crop?.name || "Unknown Crop",
        field: schedule.crop?.land?.name || "Unknown Field",
        assignedTo: schedule.crop?.farmer?.name || "Unassigned",
        description: `Method: ${schedule.method}, Quantity: ${schedule.quantity} liters`,
        notes: schedule.notes || "",
        status: schedule.status,
        tags: ["irrigation", schedule.method.toLowerCase(), schedule.status],
      }));

      // Process fertilization schedules
      const fertilizerEvents = (fertilizationRes.data || []).map(
        (schedule) => ({
          id: schedule._id,
          title: `Fertilization: ${
            schedule.crop?.crop?.name || "Unknown Crop"
          }`,
          date: new Date(schedule.date).toISOString().split("T")[0],
          type: "fertilization",
          crop: schedule.crop?.crop?.name || "Unknown Crop",
          field: schedule.crop?.land?.name || "Unknown Field",
          assignedTo: schedule.crop?.farmer?.name || "Unassigned",
          description: `Fertilizer: ${
            schedule.fertilizer?.name || "Unknown"
          }, Quantity: ${schedule.quantity} kg`,
          notes: schedule.notes || "",
          status: schedule.status,
          tags: ["fertilization", schedule.status],
        })
      );

      // Process pesticide schedules
      const pesticideEvents = (pesticideRes.data || []).map((schedule) => ({
        id: schedule._id,
        title: `Pesticide: ${schedule.crop?.crop?.name || "Unknown Crop"}`,
        date: new Date(schedule.date).toISOString().split("T")[0],
        type: "pesticide",
        crop: schedule.crop?.crop?.name || "Unknown Crop",
        field: schedule.crop?.land?.name || "Unknown Field",
        assignedTo: schedule.crop?.farmer?.name || "Unassigned",
        description: `Pesticide: ${
          schedule.pesticide?.name || "Unknown"
        }, Quantity: ${schedule.quantity} ml`,
        notes: schedule.notes || "",
        status: schedule.status,
        tags: ["pesticide", schedule.status],
      }));

      // Combine all events
      const allEvents = [
        ...irrigationEvents,
        ...fertilizerEvents,
        ...pesticideEvents,
      ];
      setCropEvents(allEvents);
    } catch (error) {
      console.error("Error fetching crop events:", error);
      Wrapper.toast.error("Failed to load crop events");
      setCropEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle event update from EventDetailsModal
  const handleEventUpdate = (updatedEvent) => {
    setCropEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )
    );
    setSelectedEvent(updatedEvent);
  };

  // Get the first day of the month
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Function to get events for a specific day
  const getEventsForDay = (day) => {
    const dateString = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return cropEvents.filter((event) => event.date === dateString);
  };

  // Function to get icon based on event type
  const getEventIcon = (type) => {
    switch (type) {
      case "harvest":
        return <Wrapper.GrassIcon className="text-green-600" />;
      case "irrigation":
        return <Wrapper.OpacityIcon className="text-blue-500" />;
      case "fertilization":
        return <Wrapper.EcoIcon className="text-amber-600" />;
      case "pesticide":
        return <Wrapper.BugReportIcon className="text-red-500" />;
      default:
        return <Wrapper.InfoIcon className="text-gray-600" />;
    }
  };

  // Function to get color based on event type
  const getEventColor = (type) => {
    switch (type) {
      case "harvest":
        return "bg-green-50 border-green-500 hover:bg-green-100";
      case "irrigation":
        return "bg-blue-50 border-blue-500 hover:bg-blue-100";
      case "fertilization":
        return "bg-amber-50 border-amber-500 hover:bg-amber-100";
      case "pesticide":
        return "bg-red-50 border-red-500 hover:bg-red-100";
      default:
        return "bg-gray-50 border-gray-500 hover:bg-gray-100";
    }
  };

  // Function to get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to handle month navigation
  const handleMonthChange = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  // Function to handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDetailsOpen(true); // Open EventDetailsModal
  };

  const openScheduleModal = (type) => {
    setScheduleType(type);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async () => {
    try {
      await fetchCropEvents();
      Wrapper.toast.success(`${scheduleType} schedule added successfully!`);
    } catch (error) {
      console.error("Error updating schedules:", error);
      Wrapper.toast.error("Failed to update schedule");
    }
  };

  // Initial load and refresh when month changes
  useEffect(() => {
    fetchCropEvents();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(
      <div
        key={`empty-${i}`}
        className="h-32 border border-gray-100 bg-gray-50/30 rounded-md"
      ></div>
    );
  }

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
    const dayEvents = getEventsForDay(day);
    calendarDays.push(
      <div
        key={day}
        className={`h-32 border border-gray-100 p-1 relative rounded-md transition-all duration-200 ${
          isToday ? "ring-2 ring-primary ring-opacity-50" : ""
        } hover:shadow-md`}
      >
        <div className="flex justify-between items-center mb-1">
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-full ${
              isToday ? "bg-primary text-white" : "text-gray-600"
            }`}
          >
            <span
              className={`text-sm font-medium ${isToday ? "text-white" : ""}`}
            >
              {day}
            </span>
          </div>
          {dayEvents.length > 0 && (
            <span className="text-xs font-medium text-gray-500">
              {dayEvents.length} events
            </span>
          )}
        </div>
        <div className="overflow-y-auto max-h-24 space-y-1 pr-1">
          {dayEvents.map((event, index) => (
            <div
              key={index}
              className={`p-1.5 border rounded-md cursor-pointer flex items-center shadow-sm transition-all ${getEventColor(
                event.type
              )}`}
              onClick={() => handleEventClick(event)}
            >
              <div className="mr-2 flex-shrink-0">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <Wrapper.Typography
                  variant="caption"
                  noWrap
                  className="font-medium"
                >
                  {event.title}
                </Wrapper.Typography>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Wrapper.Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1600px", mx: "auto" }}>
      {/* Header Section */}
      <Wrapper.Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          gap: 2,
          background: "linear-gradient(to right, #2E7D32, #388E3C)",
          color: "white",
        }}
      >
        <div className="flex items-center">
          <Wrapper.CalendarMonthIcon sx={{ fontSize: 32, mr: 2 }} />
          <Wrapper.Typography variant="h5" sx={{ fontWeight: 600 }}>
            Crop Calendar
          </Wrapper.Typography>
        </div>
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
          <div className="flex items-center bg-white/20 rounded-full px-2 py-1">
            <Wrapper.IconButton
              onClick={() => handleMonthChange(-1)}
              sx={{ color: "white" }}
            >
              <Wrapper.ChevronLeft />
            </Wrapper.IconButton>
            <Wrapper.Typography variant="h6" sx={{ mx: 2, fontWeight: 500 }}>
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </Wrapper.Typography>
            <Wrapper.IconButton
              onClick={() => handleMonthChange(1)}
              sx={{ color: "white" }}
            >
              <Wrapper.ChevronRight />
            </Wrapper.IconButton>
          </div>
        </div>
      </Wrapper.Paper>

      {/* Main Content */}
      <Wrapper.Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sidebar */}
        <Wrapper.Grid item xs={12} md={3}>
          <Wrapper.Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 2,
              height: "100%",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            <div className="bg-primary text-white p-4">
              <Wrapper.Typography variant="h6" sx={{ fontWeight: 600 }}>
                Event Types
              </Wrapper.Typography>
            </div>
            <Wrapper.List sx={{ p: 2 }}>
              <Wrapper.ListItem
                button
                onClick={() => openScheduleModal("Irrigation")}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  "&:hover": { bgcolor: "rgba(0, 0, 255, 0.05)" },
                }}
              >
                <Wrapper.ListItemIcon>
                  <Wrapper.OpacityIcon sx={{ color: "#2196F3" }} />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText
                  primary="Add Irrigation"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <Wrapper.ChevronRight fontSize="small" color="action" />
              </Wrapper.ListItem>
              <Wrapper.ListItem
                button
                onClick={() => openScheduleModal("Fertilization")}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  "&:hover": { bgcolor: "rgba(0, 128, 0, 0.05)" },
                }}
              >
                <Wrapper.ListItemIcon>
                  <Wrapper.EcoIcon sx={{ color: "#4CAF50" }} />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText
                  primary="Add Fertilization"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <Wrapper.ChevronRight fontSize="small" color="action" />
              </Wrapper.ListItem>
              <Wrapper.ListItem
                button
                onClick={() => openScheduleModal("Pesticide")}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  "&:hover": { bgcolor: "rgba(255, 193, 7, 0.05)" },
                }}
              >
                <Wrapper.ListItemIcon>
                  <Wrapper.BugReportIcon sx={{ color: "#F44336" }} />
                </Wrapper.ListItemIcon>
                <Wrapper.ListItemText
                  primary="Add Pesticide"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <Wrapper.ChevronRight fontSize="small" color="action" />
              </Wrapper.ListItem>
            </Wrapper.List>
            <div className="p-4 border-t">
              <Wrapper.Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 2 }}
              >
                Event Summary
              </Wrapper.Typography>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Irrigation</span>
                  </div>
                  <span className="text-sm font-medium">
                    {cropEvents.filter((e) => e.type === "irrigation").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm">Fertilization</span>
                  </div>
                  <span className="text-sm font-medium">
                    {
                      cropEvents.filter((e) => e.type === "fertilization")
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Pesticide</span>
                  </div>
                  <span className="text-sm font-medium">
                    {cropEvents.filter((e) => e.type === "pesticide").length}
                  </span>
                </div>
              </div>
            </div>
          </Wrapper.Paper>
        </Wrapper.Grid>

        {/* Calendar */}
        <Wrapper.Grid item xs={12} md={9}>
          <Wrapper.Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Wrapper.Button
                  variant={viewMode === "month" ? "contained" : "outlined"}
                  size="small"
                  color="primary"
                  onClick={() => setViewMode("month")}
                >
                  Month
                </Wrapper.Button>
                <Wrapper.Button
                  variant={viewMode === "week" ? "contained" : "outlined"}
                  size="small"
                  color="primary"
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Wrapper.Button>
                <Wrapper.Button
                  variant={viewMode === "day" ? "contained" : "outlined"}
                  size="small"
                  color="primary"
                  onClick={() => setViewMode("day")}
                >
                  Day
                </Wrapper.Button>
              </div>
              <Wrapper.Button
                startIcon={<Wrapper.FilterListIcon />}
                size="small"
                color="inherit"
              >
                Filter
              </Wrapper.Button>
            </div>
            <div className="p-4">
              {loading ? (
                <Wrapper.Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                  }}
                >
                  <Wrapper.CircularProgress sx={{ color: "#2E7D32", mb: 2 }} />
                  <Wrapper.Typography variant="body2" color="textSecondary">
                    Loading calendar events...
                  </Wrapper.Typography>
                </Wrapper.Box>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {[
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((day) => (
                      <div
                        key={day}
                        className="text-center p-2 bg-primary/5 font-medium rounded-md"
                      >
                        <Wrapper.Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: "#2E7D32" }}
                        >
                          {day}
                        </Wrapper.Typography>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">{calendarDays}</div>
                </>
              )}
            </div>
          </Wrapper.Paper>
        </Wrapper.Grid>
      </Wrapper.Grid>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          event={selectedEvent}
          module="crop"
          onEventUpdate={handleEventUpdate}
        />
      )}

      {/* Schedule Modal */}
      {scheduleType && (
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onSubmit={handleScheduleSubmit}
          scheduleType={scheduleType}
          cropId=""
        />
      )}
    </Wrapper.Box>
  );
};

export default Calendar;

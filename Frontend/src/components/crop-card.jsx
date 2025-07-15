import { motion } from "framer-motion";
import Wrapper from "../utils/wrapper";
import cropImg from "../assets/crop.jpg";

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    y: -10,
    boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

// Helper to get crop status color
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

const CropCard = ({ assignment, onEdit, onDelete, onClick }) => {
  const cropName = assignment.crop?.name || "Unknown Crop";
  const statusColor = getStatusColor(assignment.cropStatus);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={onClick}
    >
      <Wrapper.Card
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          boxShadow: 3,
          height: "100%",
          cursor: "pointer",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${cropImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&:hover": {
            "& .card-actions": {
              opacity: 1,
            },
          },
        }}
      >
        <Wrapper.Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            borderRadius: "50%",
            p: 0.5,
            opacity: 0.9,
            zIndex: 10,
          }}
        >
          <Wrapper.Chip
            label={assignment.cropStatus}
            sx={{
              bgcolor: statusColor,
              color: "white",
              fontWeight: "bold",
              fontSize: "0.75rem",
              height: 24,
            }}
          />
        </Wrapper.Box>

        <Wrapper.CardContent
          sx={{
            p: 3,
            color: "white",
            height: "100%",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Wrapper.Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            gutterBottom
          >
            {cropName}
          </Wrapper.Typography>

          <Wrapper.Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
            Variety: {assignment.variety?.variety || "Standard"}
          </Wrapper.Typography>

          <Wrapper.Box sx={{ mt: 2 }}>
            <Wrapper.Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <Wrapper.PersonIcon sx={{ mr: 1, fontSize: 18 }} />
              {assignment.farmer?.name || "Unknown Farmer"}
            </Wrapper.Typography>

            <Wrapper.Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <Wrapper.LandscapeIcon sx={{ mr: 1, fontSize: 18 }} />
              {assignment.land?.name || "Unknown Land"}
            </Wrapper.Typography>

            <Wrapper.Typography
              variant="body2"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <Wrapper.EventIcon sx={{ mr: 1, fontSize: 18 }} />
              Sown: {new Date(assignment.seedSowingDate).toLocaleDateString()}
            </Wrapper.Typography>
          </Wrapper.Box>

          <Wrapper.Box
            className="card-actions"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              position: "absolute",
              bottom: 12,
              right: 12,
              opacity: 0,
              transition: "opacity 0.3s ease",
            }}
          >
            <Wrapper.IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
                mr: 1,
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
              }}
            >
              <Wrapper.EditIcon fontSize="small" sx={{ color: "#FBC02D" }} />
            </Wrapper.IconButton>

            <Wrapper.IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.8)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
              }}
            >
              <Wrapper.DeleteIcon
                fontSize="small"
                sx={{ color: "error.main" }}
              />
            </Wrapper.IconButton>
          </Wrapper.Box>
        </Wrapper.CardContent>
      </Wrapper.Card>
    </motion.div>
  );
};

export default CropCard;

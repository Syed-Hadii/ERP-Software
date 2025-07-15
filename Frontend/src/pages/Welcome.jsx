import { useEffect, useState } from "react";
import Wrapper from "../utils/wrapper";

const Welcome = () => {
  const [userInfo, setUserInfo] = useState({
    name: "User",
    role: "",
  });

  // Function to decode token and get user info
  const getUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  useEffect(() => {
    const user = getUserFromToken();
    if (user) {
      setUserInfo({
        name: user.name || "User",
        role: user.role || "User",
      });
    }
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Wrapper.Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Wrapper.motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Wrapper.Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Wrapper.motion.div variants={itemVariants}>
            <Wrapper.Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: "bold", color: "#3c9a59" }}
            >
              Welcome, {userInfo.name}!
            </Wrapper.Typography>
          </Wrapper.motion.div>

          <Wrapper.motion.div variants={itemVariants}>
            <Wrapper.Typography variant="h5" color="textSecondary" gutterBottom>
              You are logged in as: {userInfo.role}
            </Wrapper.Typography>
          </Wrapper.motion.div>

          <Wrapper.motion.div variants={itemVariants}>
            <Wrapper.Box sx={{ mt: 4 }}>
              <Wrapper.Typography variant="body1" paragraph>
                Thank you for logging into the Farm Management System. This is a
                common page accessible to all users regardless of their role.
              </Wrapper.Typography>

              <Wrapper.Typography variant="body1" paragraph>
                From here, you can navigate to the specific sections that you
                have permission to access using the sidebar on the left.
              </Wrapper.Typography>
            </Wrapper.Box>
          </Wrapper.motion.div>

          <Wrapper.motion.div variants={itemVariants}>
            <Wrapper.Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 4,
              }}
            >
              <Wrapper.AgricultureIcon
                sx={{ fontSize: 80, color: "#3c9a59", mb: 2 }}
              />
              <Wrapper.Typography variant="h6" gutterBottom>
                Agriculture Management System
              </Wrapper.Typography>
            </Wrapper.Box>
          </Wrapper.motion.div>
        </Wrapper.Paper>
      </Wrapper.motion.div>
    </Wrapper.Container>
  );
};

export default Welcome;

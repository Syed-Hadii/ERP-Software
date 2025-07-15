import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get user role from token
  const getUserRole = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      // For JWT tokens, decode the payload
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload.role;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const userRole = getUserRole();

  // Use effect to handle mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Always close sidebar on mobile by default
      } else {
        setSidebarOpen(true); // Always open sidebar on desktop by default
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Create an overlay that closes the sidebar when clicked (for mobile)
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className="admin-container relative overflow-hidden bg-white text-slate-600 min-h-screen w-full flex"
      style={{
        // Set CSS variable for sidebar width that can be used by Navbar
        "--sidebar-width": isMobile
          ? sidebarOpen
            ? "240px"
            : "0px"
          : sidebarOpen
          ? "240px"
          : "60px",
      }}
    >
      {/* Sidebar with user role */}
      <Sidebar isOpen={sidebarOpen} userRole={userRole} isMobile={isMobile} />

      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div
        className="main-content transition-all duration-300 min-h-screen flex-1"
        style={{
          marginLeft: isMobile ? 0 : sidebarOpen ? "240px" : "60px",
          paddingTop: "64px", // Add padding to account for fixed navbar height
          width: "100%",
          overflow: "auto", // Enable scrolling
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        <hr className="border-gray-300" />
        <div className="routes-container p-4 overflow-auto">
          {/* Enable horizontal scrolling when needed */}
          <div className="responsive-content overflow-x-auto">
            {children || <Outlet />}
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={5}
      />
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;

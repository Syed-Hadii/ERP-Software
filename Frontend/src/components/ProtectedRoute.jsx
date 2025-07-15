import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import AuthService from "../utils/auth";
import MainLayout from "./layout/Layout";
import Wrapper from "../utils/wrapper";

const ProtectedRoute = ({ children, roles }) => {
  const location = Wrapper.useLocation();
  const navigate = Wrapper.useNavigate();
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user doesn't have the required role, show unauthorized or redirect
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Wrapper.Paper elevation={3} className="p-8">
          <Wrapper.Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Wrapper.Typography>
          <Wrapper.Typography variant="body1">
            You don&apos;t have permission to access this page.
          </Wrapper.Typography>
          <Wrapper.Button
            variant="contained"
            color="primary"
            className="mt-4"
            onClick={() => navigate("/login")}
          >
            Go Back
          </Wrapper.Button>
        </Wrapper.Paper>
      </div>
    );
  }

  // If authorized, render the children wrapped in MainLayout
  return <MainLayout>{children}</MainLayout>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  roles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;

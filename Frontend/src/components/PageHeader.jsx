import React from "react";
import Wrapper from "../utils/wrapper";

/**
 * PageHeader component for consistent page headers across the application
 * @param {Object} props - Component props
 * @param {string} props.title - The main title of the page
 * @param {Array} props.breadcrumbs - Array of breadcrumb items [{name: string, path: string}]
 * @param {React.ReactNode} props.actions - Optional actions to display on the right side
 */
const PageHeader = ({ title, breadcrumbs = [], actions }) => {
  return (
    <Wrapper.Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        mb: 3,
        pb: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Wrapper.Box>
        <Wrapper.Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            mb: 0.5,
          }}
        >
          {title}
        </Wrapper.Typography>

        {breadcrumbs.length > 0 && (
          <Wrapper.Breadcrumbs
            separator={<Wrapper.NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ color: "text.secondary", fontSize: "0.875rem" }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return isLast ? (
                <Wrapper.Typography
                  key={index}
                  color="text.primary"
                  sx={{ fontSize: "inherit", fontWeight: 500 }}
                >
                  {crumb.name}
                </Wrapper.Typography>
              ) : (
                <Wrapper.Link
                  key={index}
                  component={Wrapper.RouterLink}
                  to={crumb.path}
                  underline="hover"
                  color="inherit"
                  sx={{ fontSize: "inherit" }}
                >
                  {crumb.name}
                </Wrapper.Link>
              );
            })}
          </Wrapper.Breadcrumbs>
        )}
      </Wrapper.Box>

      {actions && (
        <Wrapper.Box sx={{ mt: { xs: 2, sm: 0 } }}>{actions}</Wrapper.Box>
      )}
    </Wrapper.Box>
  );
};

export default PageHeader;

import React from "react";
import SchoolDashboard from "./SchoolDashboard.jsx";

const DirectorDashboard = (props) => (
  <main
    className="container-fluid px-4 py-4"
    style={{
      height: "auto",
      flex: "1 1 0%",
      minHeight: 0,
      overflow: "hidden",
    }}
    role="region"
    aria-label="Panel dyrektora"
  >
    <SchoolDashboard {...props} />
  </main>
);

export default DirectorDashboard;
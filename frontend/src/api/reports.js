import api from "./index";

export const reportsAPI = {
  // Submit a report
  submit: async (reportData) => {
    const response = await api.post("/reports/submit-report.php", reportData);
    return response.data;
  },

  // Get user's reports
  getUserReports: async () => {
    const response = await api.get("/reports/get-user-reports.php");
    return response.data;
  },
};

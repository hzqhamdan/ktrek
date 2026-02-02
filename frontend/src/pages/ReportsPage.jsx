import React, { useState, useEffect } from "react";
import { Send, CheckCircle, Clock } from "lucide-react";
import { reportsAPI } from "../api/reports";
import { attractionsAPI } from "../api/attractions";
import Card from "../components/common/Card";
import { GlassButton } from "@/components/ui/glass-button";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import { formatDateTime } from "../utils/helpers";
import { useToast } from "../components/ui/toast-1";
const ReportsPage = () => {
  const { showToast } = useToast();
  const [attractions, setAttractions] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    attraction_id: "",
    message: "",
  });
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [attractionsRes, reportsRes] = await Promise.all([
        attractionsAPI.getAll(),
        reportsAPI.getUserReports(),
      ]);
      if (attractionsRes.success) {
        setAttractions(attractionsRes.data);
      }
      if (reportsRes.success) {
        setMyReports(reportsRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Failed to load data.", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      showToast("Please enter your message.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await reportsAPI.submit({
        attraction_id: formData.attraction_id || null,
        message: formData.message,
      });
      if (response.success) {
        showToast("Report submitted successfully !", "success");
        setFormData({
          attraction_id: "",
          message: "",
        });
        fetchData(); // Refresh reports list
      } else {
        showToast("Failed to submit report.", "error");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      showToast("Failed to submit report.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden">
      {" "}
      {/* Decorative blur circles */}
      <div
        className="fixed top-20 right-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float"
        style={{ backgroundColor: "rgba(241, 238, 231, 0.4)" }}
      />
      <div
        className="fixed bottom-20 left-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float-delayed"
        style={{ backgroundColor: "rgba(241, 238, 231, 0.4)" }}
      />
      <div
        className="fixed top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl -z-10 animate-pulse-slow"
        style={{ backgroundColor: "rgba(241, 238, 231, 0.3)" }}
      />

      {/* Header */}
      <div className="py-12">
        {" "}
        <div className="container-custom pt-8">
          {" "}
          <div className="mb-2">
            <h1 className="text-4xl font-bold inline-flex items-center gap-2">
              <span>Feedback & Reports</span>
              <AdminSidebarIcon name="reports" className="w-6 h-6 sm:w-10 sm:h-10 text-[#120c07]" />
            </h1>{" "}
          </div>{" "}
          <p className="text-xl text-gray-700">
            {" "}
            Help us improve your experience by reporting issues or sharing
            feedback{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="container-custom py-10 md:py-14 space-y-10">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {" "}
          {/* Submit Form */}{" "}
          <div className="lg:col-span-2">
            {" "}
            <Card>
              {" "}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Submit New Report
              </h2>{" "}
              <form onSubmit={handleSubmit} className="space-y-4">
                {" "}
                {/* Attraction Select */}{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {" "}
                    Related Attraction (Optional){" "}
                  </label>{" "}
                  <select
                    value={formData.attraction_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attraction_id: e.target.value,
                      })
                    }
                    className="input"
                  >
                    {" "}
                    <option value="">Select an attraction...</option>{" "}
                    {attractions.map((attraction) => (
                      <option key={attraction.id} value={attraction.id}>
                        {" "}
                        {attraction.name}{" "}
                      </option>
                    ))}{" "}
                  </select>{" "}
                </div>{" "}
                {/* Message */}{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {" "}
                    Your Message <span className="text-red-500">*</span>{" "}
                  </label>{" "}
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="input min-h-[150px] resize-y"
                    placeholder="Describe the issue or share your feedback..."
                    required
                  />{" "}
                  <p className="text-sm text-gray-500 mt-1">
                    {" "}
                    Be as detailed as possible to help us address your
                    concern{" "}
                  </p>{" "}
                </div>{" "}
                {/* Submit Button */}{" "}
                <GlassButton
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2"
                >
                  <span>Submit Report</span>
                </GlassButton>{" "}
              </form>{" "}
            </Card>{" "}
            {/* My Reports */}{" "}
            {myReports.length > 0 && (
              <div className="mt-8">
                {" "}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  My Reports
                </h2>{" "}
                <div className="space-y-4">
                  {" "}
                  {myReports.map((report) => (
                    <Card key={report.id}>
                      {" "}
                      <div className="flex items-start justify-between mb-3">
                        {" "}
                        <div className="flex-1">
                          {" "}
                          {report.attraction_name && (
                            <p className="text-sm text-gray-600 mb-1">
                              {" "}
                              {report.attraction_name}{" "}
                            </p>
                          )}{" "}
                          <p className="text-gray-900">{report.message}</p>{" "}
                        </div>{" "}
                        <div className="flex-shrink-0 ml-4">
                          {" "}
                          {report.status === "Replied" ? (
                            <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              {" "}
                              <CheckCircle size={14} />{" "}
                              <span>Replied</span>{" "}
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                              {" "}
                              <Clock size={14} /> <span>Pending</span>{" "}
                            </span>
                          )}{" "}
                        </div>{" "}
                      </div>{" "}
                      {report.reply && (
                        <div className="mt-3 pt-3 border-t border-gray-200 rounded-lg p-3" style={{ backgroundColor: '#F1EEE7' }}>
                          {" "}
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Admin Reply:
                          </p>{" "}
                          <p className="text-sm text-gray-700">
                            {report.reply}
                          </p>{" "}
                          {report.replied_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              {" "}
                              {formatDateTime(report.replied_at)}{" "}
                            </p>
                          )}{" "}
                        </div>
                      )}{" "}
                      <p className="text-xs text-gray-500 mt-3">
                        {" "}
                        Submitted {formatDateTime(report.created_at)}{" "}
                      </p>{" "}
                    </Card>
                  ))}{" "}
                </div>{" "}
              </div>
            )}{" "}
          </div>{" "}
          {/* Sidebar Info */}{" "}
          <div className="space-y-6">
            {" "}
            <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
              {" "}
              <h3 className="font-bold text-gray-900 mb-3">Helpful Tips</h3>{" "}
              <ul className="text-sm text-gray-700 space-y-2">
                {" "}
                <li>• Be specific about the issue</li>{" "}
                <li>• Include the attraction name if relevant</li>{" "}
                <li>• Describe what happened and what you expected</li>{" "}
                <li>• We'll respond within 24-48 hours</li>{" "}
              </ul>{" "}
            </div>{" "}
            <Card>
              {" "}
              <h3 className="font-bold text-gray-900 mb-3">
                Common Issues
              </h3>{" "}
              <ul className="text-sm text-gray-600 space-y-2">
                {" "}
                <li>• QR code not scanning</li>{" "}
                <li>• Wrong location information</li> <li>• Missing rewards</li>{" "}
                <li>• Technical problems</li>{" "}
                <li>• Content suggestions</li>{" "}
              </ul>{" "}
            </Card>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
export default ReportsPage;

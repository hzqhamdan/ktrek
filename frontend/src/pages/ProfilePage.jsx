import React, { useState } from "react";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  Edit,
  LogOut,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useProgressStore } from "../store/progressStore";
import useRewardStore from "../store/rewardStore";
import { authAPI } from "../api/auth";
import { usersAPI } from "../api/users";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/toast-1";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { formatDate, getInitials } from "../utils/helpers";
import EPDisplay from "../components/rewards/EPDisplay";
const ProfilePage = () => {
  const { showToast } = useToast();
  const { user, logout, updateUser } = useAuthStore();
  const { statistics, setStatistics } = useProgressStore();
  const { stats: rewardStats, fetchUserStats } = useRewardStore();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch user stats on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('ProfilePage: Fetching stats...');
        
        // Fetch both reward stats and progress statistics
        await fetchUserStats();
        console.log('ProfilePage: Reward stats fetched');
        
        // Fetch progress statistics
        const { progressAPI } = await import('../api/progress');
        const progressResponse = await progressAPI.getUserProgress();
        console.log('ProfilePage: Progress response:', progressResponse);
        
        if (progressResponse.success) {
          const stats = progressResponse.data.statistics || {};
          console.log('ProfilePage: Statistics received:', stats);
          console.log('ProfilePage: Statistics keys:', Object.keys(stats));
          console.log('ProfilePage: Statistics values:', Object.values(stats));
          setStatistics(stats);
        }
      } catch (error) {
        console.error('ProfilePage: Error fetching stats:', error);
      }
    };
    
    fetchData();
  }, [fetchUserStats, setStatistics]);

  // Edit profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
    date_of_birth: user?.date_of_birth || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const openEditModal = () => {
    setEditData({
      full_name: user?.full_name || "",
      phone_number: user?.phone_number || "",
      date_of_birth: user?.date_of_birth || "",
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editData.full_name?.trim()) {
      showToast("Full name is required.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await usersAPI.updateProfile({
        full_name: editData.full_name.trim(),
        phone_number: editData.phone_number,
        date_of_birth: editData.date_of_birth,
      });

      if (res?.success) {
        updateUser(res.data.user);
        showToast("Profile updated.", "success");
        setShowEditModal(false);
      } else {
        showToast(res?.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
      logout();
      showToast("Logged out successfully.", "success");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      logout(); // Force logout even if API fails
      navigate("/login");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const response = await authAPI.changePassword(
        passwordData.currentPassword, 
        passwordData.newPassword
      );
      
      if (response.success) {
        showToast("Password changed successfully !", "success");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        showToast(response.message || "Failed to change password", "error");
      }
    } catch (error) {
      console.error("Password change error:", error);
      showToast(error.response?.data?.message || "Failed to change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Merge statistics from progressStore and rewardStore
  const stats = {
    ...(statistics || {
      total_attractions_started: 0,
      attractions_completed: 0,
      total_tasks_completed: 0,
      total_rewards_unlocked: 0,
    }),
    ...(rewardStats || {}),
    total_xp: rewardStats?.total_xp || 0,
    total_ep: rewardStats?.total_ep || 0,
    current_level: rewardStats?.current_level || 1,
  };
  
  // Debug logging
  console.log('ProfilePage: Final stats object:', stats);
  console.log('ProfilePage: statistics from store:', statistics);
  console.log('ProfilePage: rewardStats from store:', rewardStats);
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden">
      {" "}
      {/* Decorative blur circles */}{" "}
      <div className="fixed top-20 right-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed bottom-20 left-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float-delayed" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ backgroundColor: 'rgba(241, 238, 231, 0.3)' }} />{" "}
      {/* Header */}{" "}
      <div className=" text-white shadow-lg">
        {" "}
        <div className="container-custom py-12">
          {" "}
          <div className="flex items-center space-x-3 mb-4">
            {" "}
{" "}
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="inline-flex items-center gap-2">
                <span>My Profile</span>
                <AdminSidebarIcon name="adminUsers" className="w-6 h-6 sm:w-9 sm:h-9 text-[#120c07]" />
              </span>
            </h1>{" "}
          </div>{" "}
          <p className="text-gray-700 text-lg">
            {" "}
            Manage your account and view your information{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="container-custom py-8">
        {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {" "}
          {/* Profile Info */}{" "}
          <div className="lg:col-span-2 space-y-6">
            {" "}
            {/* Basic Info Card */}{" "}
            <Card gradient>
              {" "}
              <div
                className="cta-stack-xl"
                style={{
                  marginTop: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                }}
              >
                <div className="flex items-start justify-between">
                {" "}
                <h2 className="text-xl font-bold bg-clip-text text-transparent">
                  Personal Information
                </h2>{" "}
                <Button variant="glass" size="sm" icon={Edit} onClick={openEditModal} className="font-medium">
                  {" "}
                  Edit{" "}
                </Button>{" "}
              </div>

                {/* Avatar */}{" "}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                {" "}
                <div className="flex-shrink-0">
                  {" "}
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className="w-20 h-20 rounded-full ring-2 "
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ring-2 ">
                      {" "}
                      {getInitials(user?.full_name || user?.username)}{" "}
                    </div>
                  )}{" "}
                </div>{" "}
                <div className="flex-1 min-w-0">
                  {" "}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {user?.full_name}
                  </h3>{" "}
                  <p className="text-gray-600 text-sm sm:text-base">@{user?.username}</p>{" "}
                </div>{" "}
                  </div>

                  <Button
                    variant="glass"
                    size="sm"
                    className="font-medium flex-shrink-0 self-start sm:self-auto"
                    onClick={() => navigate("/onboarding/avatar?redirect=/dashboard/profile")}
                  >
                    Change Avatar
                  </Button>
                </div>{" "}

                {/* Details */}{" "}
                <div className="space-y-4">
                {" "}
                <div className="flex items-start gap-5">
                  {" "}
                  <User
                    className="text-gray-400 flex-shrink-0 mt-1"
                    size={20}
                  />{" "}
                  <div className="flex-1">
                    {" "}
                    <p className="text-sm text-gray-500">Username</p>{" "}
                    <p className="font-medium text-gray-900">
                      {user?.username}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flex items-start gap-5">
                  {" "}
                  <Mail
                    className="text-gray-400 flex-shrink-0 mt-1"
                    size={20}
                  />{" "}
                  <div className="flex-1">
                    {" "}
                    <p className="text-sm text-gray-500">Email</p>{" "}
                    <p className="font-medium text-gray-900">
                      {user?.email || "Not provided"}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                {user?.phone_number && (
                  <div className="flex items-start gap-5">
                    {" "}
                    <Phone
                      className="text-gray-400 flex-shrink-0 mt-1"
                      size={20}
                    />{" "}
                    <div className="flex-1">
                      {" "}
                      <p className="text-sm text-gray-500">Phone Number</p>{" "}
                      <p className="font-medium text-gray-900">
                        {user.phone_number}
                      </p>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                {user?.date_of_birth && (
                  <div className="flex items-start gap-5">
                    {" "}
                    <Calendar
                      className="text-gray-400 flex-shrink-0 mt-1"
                      size={20}
                    />{" "}
                    <div className="flex-1">
                      {" "}
                      <p className="text-sm text-gray-500">
                        Date of Birth
                      </p>{" "}
                      <p className="font-medium text-gray-900">
                        {formatDate(user.date_of_birth)}
                      </p>{" "}
                    </div>{" "}
                  </div>
                )}{" "}
                <div className="flex items-start gap-5">
                  {" "}
                  <MapPin
                    className="text-gray-400 flex-shrink-0 mt-1"
                    size={20}
                  />{" "}
                  <div className="flex-1">
                    {" "}
                    <p className="text-sm text-gray-500">
                      Authentication Method
                    </p>{" "}
                    <p className="font-medium text-gray-900 capitalize">
                      {" "}
                      {user?.auth_provider || "Email"}{" "}
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              </div>{" "}
            </Card>{" "}
            {/* Account Actions */}{" "}
            <Card gradient>
              {" "}
              <h2 className="text-xl font-bold bg-clip-text text-transparent mb-4">
                Account Settings
              </h2>{" "}
              <div className="cta-stack-lg">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPasswordModal(true);
                  }}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      Change Password
                    </span>
                    <span className="text-gray-700">›</span>
                  </div>
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Notification preferences clicked");
                    showToast("Notification preferences coming soon !", "info");
                  }}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      Notification Preferences
                    </span>
                    <span className="text-gray-700">›</span>
                  </div>
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Privacy settings clicked");
                    showToast("Privacy settings coming soon !", "info");
                  }}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      Privacy Settings
                    </span>
                    <span className="text-gray-700">›</span>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {" "}
                  <div className="flex items-center space-x-2 text-gray-700">
                    {" "}
                    <LogOut size={20} />{" "}
                    <span className="font-medium">
                      {" "}
                      {isLoggingOut ? "Logging out..." : "Logout"}{" "}
                    </span>{" "}
                  </div>{" "}
                </button>{" "}
              </div>{" "}
            </Card>{" "}
          </div>{" "}
          {/* Sidebar Stats */}{" "}
          <div className="space-y-6">
            {" "}
            {/* Achievement Stats */}{" "}
            <Card gradient>
              {" "}
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                {" "}
                <Award size={20} className="" />{" "}
                <span>Achievement Stats</span>{" "}
              </h3>{" "}
              <div className="space-y-4">
                {" "}
                {/* XP and EP Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group relative overflow-hidden">
                  {/* Animated background shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer pointer-events-none" />
                  
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1 group-hover:text-blue-700 transition-colors">Experience</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-blue-600 group-hover:scale-110 transition-transform">{stats.total_xp || 0}</span>
                        <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">XP</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Level {stats.current_level || 1}
                      </div>
                    </div>
                    <div className="h-12 w-px bg-gray-300 self-stretch group-hover:bg-purple-300 transition-colors"></div>
                    <div className="flex-1 flex flex-col items-end">
                      <div className="text-xs text-gray-600 mb-1 group-hover:text-purple-700 transition-colors">Exploration</div>
                      <EPDisplay
                        totalEP={stats.total_ep || 0}
                        size="medium"
                        showLabel={true}
                        animate={false}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  {" "}
                  <div className="flex items-center justify-between mb-1">
                    {" "}
                    <span className="text-sm text-gray-600">
                      Attractions
                    </span>{" "}
                    <span className="font-semibold text-gray-900">
                      {" "}
                      {stats.attractions_completed} /{" "}
                      {stats.total_attractions_started}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="h-2 rounded-full overflow-hidden">
                    {" "}
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary-500 to-primary-600"
                      style={{
                        width: `${stats.total_attractions_started > 0 ? (stats.attractions_completed / stats.total_attractions_started) * 100 : 0}%`,
                      }}
                    ></div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="pt-3 border-t border-gray-200">
                  {" "}
                  <div className="flex items-center justify-between mb-2">
                    {" "}
                    <span className="text-sm text-gray-600">
                      Total Tasks
                    </span>{" "}
                    <span className="text-2xl font-semibold text-gray-800">
                      {" "}
                      {stats.total_tasks_completed}{" "}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="pt-3 border-t border-gray-200">
                  {" "}
                  <div className="flex items-center justify-between mb-2">
                    {" "}
                    <span className="text-sm text-gray-600">
                      Rewards Earned
                    </span>{" "}
                    <span className="text-2xl font-semibold text-gray-800">
                      {" "}
                      {(stats.total_badges || 0) + (stats.total_titles || 0)}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.total_badges || 0} Badges • {stats.total_titles || 0} Titles
                  </div>
                </div>{" "}
              </div>{" "}
            </Card>{" "}
            {/* Quick Links */}{" "}
            <Card gradient>
              {" "}
              <h3 className="font-bold bg-clip-text text-transparent mb-4">
                Quick Links
              </h3>{" "}
              <div className="cta-stack">
                {" "}
                <button
                  onClick={() => navigate("/dashboard/progress")}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium text-sm"
                >
                  {" "}
                  → View Progress
                </button>{" "}
                <button
                  onClick={() => navigate("/dashboard/rewards")}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium text-sm"
                >
                  {" "}
                  → View Rewards
                </button>{" "}
                <button
                  onClick={() => navigate("/dashboard/reports")}
                  className="glass-button w-full text-left px-4 py-3 rounded-xl font-medium text-sm"
                >
                  {" "}
                  → Report an Issue
                </button>{" "}
              </div>{" "}
            </Card>{" "}
            {/* Version Info */}{" "}
            <Card className=" border-2 border-gray-200">
              {" "}
              <div className="text-center">
                {" "}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ring-2 overflow-hidden bg-white/60">
                  <img src="/images/logo.png" alt="K-Trek" className="w-8 h-8 object-contain" />
                </div>{" "}
                <p className="text-sm font-medium text-gray-900">K-Trek</p>
                <p className="text-xs text-gray-600">Version 1.0.0</p>{" "}
              </div>{" "}
            </Card>{" "}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-md w-full p-6" style={{ backgroundColor: '#F1EEE7' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
                className="glass-button h-9 w-9 rounded-full inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editData.phone_number}
                  onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={editData.date_of_birth || ""}
                  onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to remove</p>
              </div>

              <div className="cta-row" style={{ paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="glass-button flex-1 px-4 py-3 rounded-xl font-medium inline-flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="glass-button flex-1 px-4 py-3 rounded-xl font-medium inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-md w-full p-6" style={{ backgroundColor: '#F1EEE7' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                }}
                aria-label="Close"
                className="glass-button h-9 w-9 rounded-full inline-flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="glass-button absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full inline-flex items-center justify-center"
                    aria-label={showPasswords.current ? "Hide password" : "Show password"}
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="glass-button absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full inline-flex items-center justify-center"
                    aria-label={showPasswords.new ? "Hide password" : "Show password"}
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="glass-button absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full inline-flex items-center justify-center"
                    aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cta-row" style={{ paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                  }}
                  className="glass-button flex-1 px-4 py-3 rounded-xl font-medium inline-flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="glass-button flex-1 px-4 py-3 rounded-xl font-medium inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;

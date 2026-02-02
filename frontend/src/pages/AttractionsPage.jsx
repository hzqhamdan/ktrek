import React, { useState, useEffect } from "react";
import { Search, Filter, MapPin, SlidersHorizontal, CheckCircle, TrendingUp, Target } from "lucide-react";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import { useAttractionStore } from "../store/attractionStore";
import { attractionsAPI } from "../api/attractions";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import AttractionGrid from "../components/attractions/AttractionGrid";
import { useToast } from "../components/ui/toast-1";
const AttractionsPage = () => {
  const { showToast } = useToast();
  const { attractions, setAttractions, isLoading, setLoading } =
    useAttractionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, completed, in-progress, not-started
  const [sortBy, setSortBy] = useState("name"); // name, progress
  useEffect(() => {
    fetchAttractions();
  }, []);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const response = await attractionsAPI.getAll();
      if (response.success) {
        // Remove duplicates based on ID (keep first occurrence)
        const uniqueAttractions = response.data.reduce((acc, current) => {
          const exists = acc.find(item => item.id === current.id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Log warning if duplicates found
        if (uniqueAttractions.length < response.data.length) {
          console.warn(`Found ${response.data.length - uniqueAttractions.length} duplicate attraction(s) in database`);
        }
        
        setAttractions(uniqueAttractions);
      } else {
        showToast("Failed to load attractions.", "error");
      }
    } catch (error) {
      console.error("Error fetching attractions:", error);
      showToast("Failed to load attractions.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort attractions
  const filteredAttractions = (attractions || [])
    .filter((attraction) => {
      // Search filter
      const matchesSearch =
        attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attraction.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      const p = Number(attraction.progress_percentage || 0);
      if (filterStatus === "completed") {
        return p === 100;
      } else if (filterStatus === "in-progress") {
        return p > 0 && p < 100;
      } else if (filterStatus === "not-started") {
        return p === 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "progress") {
        return b.progress_percentage - a.progress_percentage;
      }
      return 0;
    });

  const stats = {
    total: attractions.length,
    completed: attractions.filter((a) => Number(a.progress_percentage || 0) === 100).length,
    inProgress: attractions.filter((a) => {
      const p = Number(a.progress_percentage || 0);
      return p > 0 && p < 100;
    }).length,
    notStarted: attractions.filter((a) => Number(a.progress_percentage || 0) === 0).length,
  };
  if (isLoading) {
    return <Loading fullScreen message="Loading attractions..." />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light pt-8">
      {" "}
      {/* Header */}{" "}
      <div className="relative overflow-hidden">
        {" "}
        {/* Decorative Elements */}{" "}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: 'rgba(241, 238, 231, 0.1)' }}></div>{" "}
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: 'rgba(241, 238, 231, 0.1)' }}></div>{" "}
        <div className="container-custom py-12 relative z-10">
          {" "}
          <div className="mb-4 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 inline-flex items-center gap-2">
              <span>Attractions in Kelantan</span>
              <AdminSidebarIcon name="attractions" className="w-6 h-6 sm:w-7 sm:h-7 text-[#120c07]" />
            </h1>
          </div>{" "}
          <p className="text-gray-700 text-lg max-w-2xl">
            {" "}
            Explore {attractions.length} amazing cultural attractions and
            complete missions to unlock rewards!{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="container-custom py-10 md:py-14 space-y-10">
        {" "}
        {/* Stats Cards */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 animate-fade-in">
          {" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <MapPin className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.total}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium">Total Attractions</h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <CheckCircle className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.completed}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium">Completed</h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <TrendingUp className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.inProgress}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium">In Progress</h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <Target className="w-6 h-6 text-gray-700" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {stats.notStarted}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium">Not Started</h3>
          </div>{" "}
        </div>{" "}
        {/* Search and Filters */}{" "}
        <Card className="mb-8" padding="md" gradient>
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {" "}
            {/* Search */}{" "}
            <div className="md:col-span-2">
              {" "}
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {" "}
                Search Attractions{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
                  {" "}
                  <Search className="text-gray-700" size={20} />{" "}
                </div>{" "}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-left text-gray-700 placeholder-gray-400 focus:ring-4 focus:border-gray-200 transition-all duration-300"
                  style={{ backgroundColor: '#F1EEE7', paddingLeft: '3.25rem' }}
                  placeholder="Search by name, location, or description..."
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Filter by Status */}{" "}
            <div>
              {" "}
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {" "}
                <Filter className="inline mr-1" size={16} /> Filter by
                Status{" "}
              </label>{" "}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 focus:ring-4 focus:border-gray-200 transition-all duration-300"
                style={{ backgroundColor: '#F1EEE7' }}
              >
                {" "}
                <option value="all">All Attractions</option>{" "}
                <option value="not-started">Not Started</option>{" "}
                <option value="in-progress">In Progress</option>{" "}
                <option value="completed">Completed</option>{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
          {/* Sort */}{" "}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {" "}
            <p className="text-sm text-gray-600">
              {" "}
              Showing{" "}
              <span className="font-bold text-gray-700">
                {filteredAttractions.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-700">
                {attractions.length}
              </span>{" "}
              attractions{" "}
            </p>{" "}
            <div className="flex items-center space-x-2">
              {" "}
              <SlidersHorizontal size={16} className="text-gray-700" />{" "}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                {" "}
                <option value="name">Sort by Name</option>{" "}
                <option value="progress">Sort by Progress</option>{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
        </Card>{" "}
        {/* Attractions Grid */}{" "}
        {filteredAttractions.length > 0 ? (
          <AttractionGrid attractions={filteredAttractions} isAuthenticated={true} />
        ) : (
          <Card className="text-center py-12" padding="lg" gradient>
            {" "}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              {" "}
              <MapPin className="text-gray-700" size={40} />{" "}
            </div>{" "}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {" "}
              No attractions found{" "}
            </h3>{" "}
            <p className="text-gray-600 mb-6">
              {" "}
              Try adjusting your search or filter criteria{" "}
            </p>{" "}
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
              }}
              className="px-6 py-2.5 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-semibold"
            >
              {" "}
              Clear all filters{" "}
            </button>{" "}
          </Card>
        )}{" "}
      </div>{" "}
    </div>
  );
};
export default AttractionsPage;

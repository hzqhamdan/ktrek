import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import { Award, Sparkles, Trophy, Star, Crown } from "lucide-react";
import { rewardsAPI } from "../api/rewards";
import { attractionsAPI } from "../api/attractions";
import Loading from "../components/common/Loading";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import BadgeCollection from "../components/rewards/BadgeCollection";
import CategoryMilestone from "../components/rewards/CategoryMilestone";
import { formatDateTime } from "../utils/helpers";
import { useToast } from "../components/ui/toast-1";
import useRewardStore from "../store/rewardStore";
import { Awards } from "../components/ui/award";
const RewardsPage = () => {
  const { showToast } = useToast();
  const [unlockedRewards, setUnlockedRewards] = useState([]);
  const [allAttractions, setAllAttractions] = useState([]);
  const [categoryProgress, setCategoryProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rewardsRes, attractionsRes, statsRes] = await Promise.all([
        rewardsAPI.getUserRewards(),
        attractionsAPI.getAll(),
        rewardsAPI.getUserStats(),
      ]);
      if (rewardsRes.success) {
        setUnlockedRewards(rewardsRes.data);
      }
      if (attractionsRes.success) {
        setAllAttractions(attractionsRes.data);
      }
      if (statsRes && statsRes.data && statsRes.data.categories) {
        setCategoryProgress(statsRes.data.categories);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      showToast("Failed to load rewards.", "error");
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return <Loading fullScreen message="Loading your rewards..." />;
  }
  const completedAttractionIds = (unlockedRewards || []).map((r) => r.attraction_id);
  const lockedAttractions = (allAttractions || []).filter(
    (a) => !completedAttractionIds.includes(a.id) && a.progress_percentage < 100
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light relative overflow-hidden">
      {" "}
      {/* Decorative blur circles */}{" "}
      <div className="fixed top-20 right-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed bottom-20 left-20 w-96 h-96 rounded-full blur-3xl -z-10 animate-float-delayed" style={{ backgroundColor: 'rgba(241, 238, 231, 0.4)' }} />{" "}
      <div className="fixed top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ backgroundColor: 'rgba(241, 238, 231, 0.3)' }} />{" "}
      {/* Header */}{" "}
      <div className="shadow-lg">
        {" "}
        <div className="container-custom py-12">
          {" "}
          <div className="flex items-center space-x-3 mb-4">
            {" "}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              <span className="inline-flex items-center gap-2">
                <span>Your Rewards</span><span>        </span>
                <AdminSidebarIcon name="rewards" className="w-6 h-6 sm:w-9 sm:h-9 text-[#120c07]" />
              </span>
            </h1>
          </div>{" "}
          <p className="text-gray-700 text-lg">
            {" "}
            Celebrate your achievements and unlock new badges!{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="container-custom py-8">
        {" "}
        {/* Stats */}{" "}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <AdminSidebarIcon name="rewards" className="w-6 h-6 text-[#120c07]" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {unlockedRewards.length}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Rewards Unlocked</span>
              <AdminSidebarIcon name="rewards" className="w-4 h-4 text-[#120c07]" />
            </h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256" className="w-8 h-8 text-[#120c07]">
                  <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Zm88,136H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z"></path>
                </svg>{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {lockedAttractions.length}
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium">Still Locked</h3>
          </div>{" "}
          <div className="backdrop-blur-xl rounded-2xl shadow-lg p-6 border-l-4 border-gray-200 hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}>
            {" "}
            <div className="flex items-center justify-between mb-2">
              {" "}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#F1EEE7' }}>
                {" "}
                <AdminSidebarIcon name="userProgress" className="w-6 h-6 text-[#120c07]" />{" "}
              </div>{" "}
              <span className="text-3xl font-bold text-gray-700">
                {Math.round((unlockedRewards.length / allAttractions.length) * 100)}%
              </span>{" "}
            </div>{" "}
            <h3 className="text-gray-600 font-medium flex items-center gap-2">
              <span>Collection Progress</span>
              <AdminSidebarIcon name="userProgress" className="w-4 h-4 text-[#120c07]" />
            </h3>
          </div>{" "}
        </div>{" "}
        {/* Category Milestones */}
        <div className="mb-12">
          <CategoryMilestone categoryProgress={categoryProgress} />
        </div>
        {/* Unlocked Rewards */}
        <div className="mb-12">
          <BadgeCollection />
        </div>
        
        {/* Titles Section */}
        <div className="mb-12">
          <TitleCollection />
        </div>
        {/* Locked Rewards */}{" "}
        {lockedAttractions.length > 0 && (
          <div>
            {" "}
            <div className="flex items-center space-x-2 mb-6">
              {" "}
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256" className="w-8 h-8 text-[#120c07]">
                <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Zm88,136H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z"></path>
              </svg>{" "}
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
                Locked Badges
              </h2>
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {" "}
              {lockedAttractions.map((attraction) => (
                <Card
                  key={attraction.id}
                  className="relative overflow-hidden"
                  padding="lg"
                  gradient
                >
                  {" "}
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-10">
                    {" "}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256" className="text-white w-8 h-8">
                      <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Zm88,136H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z"></path>
                    </svg>{" "}
                  </div>{" "}
                  <div className="filter blur-sm">
                    {" "}
                    <div className="text-center">
                      {" "}
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mb-4">
                        {" "}
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256" className="w-8 h-8 text-gray-500">
                          <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Zm88,136H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-32H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z"></path>
                        </svg>{" "}
                      </div>{" "}
                      <h3 className="font-bold text-gray-900 mb-2">
                        {" "}
                        {attraction.name}{" "}
                      </h3>{" "}
                      <p className="text-sm text-gray-600">
                        {" "}
                        Complete all missions to unlock{" "}
                      </p>{" "}
                      <div className="mt-4">
                        {" "}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          {" "}
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${attraction.progress_percentage}%`,
                            }}
                          ></div>{" "}
                        </div>{" "}
                        <p className="text-xs text-gray-500 mt-1">
                          {" "}
                          {attraction.progress_percentage} % Complete{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </Card>
              ))}{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* Empty State */}{" "}
        {unlockedRewards.length === 0 && lockedAttractions.length === 0 && (
          <Card className="text-center py-12" padding="lg" gradient>
            {" "}
            <AdminSidebarIcon name="rewards" className="mx-auto mb-4 w-16 h-16 text-[#120c07]" />{" "}
            <h3 className="text-xl font-semibold bg-clip-text text-transparent mb-2">
              No Rewards Yet
            </h3>
            <p className="text-gray-600 mb-6">
              {" "}
              Complete attractions to unlock amazing badges!{" "}
            </p>{" "}
            <Link to="/dashboard/attractions">
              {" "}
              <Button variant="glass"> Start Exploring </Button>{" "}
            </Link>{" "}
          </Card>
        )}{" "}
      </div>{" "}
    </div>
  );
};

// Title Collection Component
const TitleCollection = () => {
  const { titles, fetchTitles, loading, setActiveTitle, activeTitle } = useRewardStore();
  const [activeTitleId, setActiveTitleId] = useState(null);

  console.log('TitleCollection - titles:', titles);
  console.log('TitleCollection - loading:', loading);
  console.log('TitleCollection - titles length:', titles?.length);

  useEffect(() => {
    console.log('TitleCollection - fetchTitles called');
    fetchTitles();
  }, [fetchTitles]);

  useEffect(() => {
    console.log('TitleCollection - activeTitle:', activeTitle);
    if (activeTitle) {
      setActiveTitleId(activeTitle.id);
    }
  }, [activeTitle]);

  if (loading) {
    console.log('TitleCollection - showing loading state');
    return <div className="text-center p-8">Loading titles...</div>;
  }

  console.log('TitleCollection - checking if titles array is empty');
  if (!titles || titles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
        <div className="text-gray-400 mb-2">
          <Crown className="w-16 h-16 mx-auto mb-4" />
        </div>
        <p className="text-gray-600">No titles earned yet</p>
        <p className="text-sm text-gray-500 mt-2">Complete achievements to earn titles!</p>
      </div>
    );
  }

  const handleSetActive = async (titleId) => {
    try {
      await setActiveTitle(titleId);
      setActiveTitleId(titleId);
    } catch (error) {
      console.error('Failed to set active title:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Crown className="w-6 h-6 text-yellow-600" />
        Your Titles
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {titles.map((title) => (
          <div
            key={title.id}
            className={`relative transition-all cursor-pointer ${
              activeTitleId === title.id
                ? 'ring-4 ring-yellow-500 rounded-lg'
                : 'hover:ring-2 hover:ring-yellow-300 rounded-lg'
            }`}
            onClick={() => handleSetActive(title.id)}
          >
            <Awards
              variant="badge"
              title={title.title_text || title.reward_name || "Untitled"}
              subtitle={title.reward_description}
              className="w-full"
            />
            {activeTitleId === title.id && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-semibold bg-yellow-500 text-white shadow-lg">
                  ✓
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsPage;

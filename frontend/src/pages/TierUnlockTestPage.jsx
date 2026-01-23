import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import TierUnlockModal from '../components/rewards/TierUnlockModal';
import { GlassButton } from '../components/ui/glass-button';

const TierUnlockTestPage = () => {
  const navigate = useNavigate();
  const [currentTier, setCurrentTier] = useState(null);

  const testBronze = () => {
    setCurrentTier({
      tier: 'bronze',
      category: 'beaches',
      epEarned: 50,
      completionPercentage: 33.33
    });
  };

  const testSilver = () => {
    setCurrentTier({
      tier: 'silver',
      category: 'temples',
      epEarned: 100,
      completionPercentage: 66.67
    });
  };

  const testGold = () => {
    setCurrentTier({
      tier: 'gold',
      category: 'malay_traditional',
      epEarned: 200,
      completionPercentage: 100
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="backdrop-blur-md border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm bg-white/80">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <GlassButton
            onClick={() => navigate(-1)}
            size="sm"
            className="inline-flex"
            contentClassName="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </GlassButton>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Tier Unlock Modal Test
            </h1>
            <p className="text-gray-600">
              Click any button below to preview the tier unlock celebration modal
            </p>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            {/* Bronze Test */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
              <h3 className="text-xl font-bold text-amber-800 mb-2 flex items-center gap-2">
                🥉 Bronze Tier
              </h3>
              <p className="text-amber-700 text-sm mb-4">
                Unlocks at 33% category completion
                <br />
                Awards: +50 EP
              </p>
              <GlassButton
                onClick={testBronze}
                className="w-full"
                contentClassName="flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Test Bronze Unlock</span>
              </GlassButton>
            </div>

            {/* Silver Test */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-300">
              <h3 className="text-xl font-bold text-gray-700 mb-2 flex items-center gap-2">
                🥈 Silver Tier
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Unlocks at 66% category completion
                <br />
                Awards: +100 EP
              </p>
              <GlassButton
                onClick={testSilver}
                className="w-full"
                contentClassName="flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Test Silver Unlock</span>
              </GlassButton>
            </div>

            {/* Gold Test */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-300">
              <h3 className="text-xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
                🥇 Gold Tier
              </h3>
              <p className="text-yellow-700 text-sm mb-4">
                Unlocks at 100% category completion
                <br />
                Awards: +200 EP
              </p>
              <GlassButton
                onClick={testGold}
                className="w-full"
                contentClassName="flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Test Gold Unlock</span>
              </GlassButton>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a test page for previewing the tier unlock modals.
              In the actual app, these modals appear automatically when you complete tasks
              that cross tier thresholds (33%, 66%, 100%).
            </p>
          </div>
        </div>
      </div>

      {/* Tier Unlock Modal */}
      {currentTier && (
        <TierUnlockModal
          isOpen={true}
          onClose={() => setCurrentTier(null)}
          tier={currentTier.tier}
          category={currentTier.category}
          epEarned={currentTier.epEarned}
          completionPercentage={currentTier.completionPercentage}
        />
      )}
    </div>
  );
};

export default TierUnlockTestPage;

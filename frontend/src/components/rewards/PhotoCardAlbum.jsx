/**
 * Photo Card Album Component
 * Displays user's collection of photo cards
 */

import React, { useEffect, useState } from 'react';
import useRewardStore from '../../store/rewardStore';
import { Card } from '../common/Card';
import { Modal } from '../common/Modal';

const PhotoCardAlbum = () => {
  const { photoCards, fetchPhotoCards } = useRewardStore();
  const [selectedCard, setSelectedCard] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPhotoCards();
  }, [fetchPhotoCards]);

  const filteredCards = filter === 'all' 
    ? photoCards 
    : photoCards.filter(card => card.card_type === filter);

  const cardCounts = {
    all: photoCards.length,
    gold: photoCards.filter(c => c.card_type === 'gold').length,
    silver: photoCards.filter(c => c.card_type === 'silver').length,
    bronze: photoCards.filter(c => c.card_type === 'bronze').length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Cards', color: 'bg-gray-600' },
          { value: 'gold', label: '🥇 Gold', color: 'bg-yellow-500' },
          { value: 'silver', label: '🥈 Silver', color: 'bg-gray-400' },
          { value: 'bronze', label: '🥉 Bronze', color: 'bg-amber-600' },
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter(type.value)}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              filter === type.value ? type.color : 'bg-gray-300'
            }`}
          >
            {type.label} ({cardCounts[type.value]})
          </button>
        ))}
      </div>

      {/* Photo Cards Grid */}
      {filteredCards.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">No photo cards yet</p>
          <p className="text-sm text-gray-500 mt-2">Upload photos at attractions to collect cards!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <PhotoCard
              key={card.id}
              card={card}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>
      )}

      {/* Modal for viewing full card */}
      {selectedCard && (
        <Modal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={selectedCard.attraction_name}
        >
          <PhotoCardDetail card={selectedCard} />
        </Modal>
      )}
    </div>
  );
};

const PhotoCard = ({ card, onClick }) => {
  const getCardBorder = (type) => {
    const borders = {
      gold: 'border-yellow-400 shadow-yellow-200',
      silver: 'border-gray-400 shadow-gray-200',
      bronze: 'border-amber-600 shadow-amber-200',
    };
    return borders[type] || 'border-gray-300';
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transform transition-transform hover:scale-105 border-4 ${getCardBorder(card.card_type)} rounded-lg overflow-hidden shadow-lg`}
    >
      {/* Photo */}
      <div className="aspect-video bg-gray-200 relative">
        {card.photo_url ? (
          <img
            src={card.photo_url}
            alt={card.attraction_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            📷
          </div>
        )}
        
        {/* Card Type Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-white text-xs font-bold ${
            card.card_type === 'gold' ? 'bg-yellow-500' :
            card.card_type === 'silver' ? 'bg-gray-400' : 'bg-amber-600'
          }`}>
            {card.card_type === 'gold' ? '🥇' :
             card.card_type === 'silver' ? '🥈' : '🥉'}
            {' '}{card.card_type.toUpperCase()}
          </span>
        </div>

        {/* Quality Score */}
        {card.quality_score > 0 && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            Quality: {card.quality_score}%
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3 bg-white">
        <h3 className="font-bold text-sm truncate">{card.attraction_name}</h3>
        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
          <span>{card.attraction_location}</span>
          <span>{new Date(card.visit_date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

const PhotoCardDetail = ({ card }) => {
  return (
    <div className="space-y-4">
      {/* Full Photo */}
      <div className="rounded-lg overflow-hidden">
        {card.photo_url ? (
          <img
            src={card.photo_url}
            alt={card.attraction_name}
            className="w-full"
          />
        ) : (
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">
            📷
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Card Type:</span>
          <span className={`px-3 py-1 rounded text-white font-bold ${
            card.card_type === 'gold' ? 'bg-yellow-500' :
            card.card_type === 'silver' ? 'bg-gray-400' : 'bg-amber-600'
          }`}>
            {card.card_type === 'gold' ? '🥇' :
             card.card_type === 'silver' ? '🥈' : '🥉'}
            {' '}{card.card_type.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold">Location:</span>
          <span className="text-gray-600">{card.attraction_location}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold">Category:</span>
          <span className="text-gray-600 capitalize">{card.attraction_category?.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold">Visit Date:</span>
          <span className="text-gray-600">{new Date(card.visit_date).toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold">Quality Score:</span>
          <span className="text-gray-600">{card.quality_score}%</span>
        </div>

        {card.is_featured && (
          <div className="bg-yellow-100 border border-yellow-400 rounded p-2 text-center">
            ⭐ Featured Card
          </div>
        )}
      </div>

      {/* Social Share Buttons (optional) */}
      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500 text-center">Share this memory with your friends!</p>
      </div>
    </div>
  );
};

export default PhotoCardAlbum;

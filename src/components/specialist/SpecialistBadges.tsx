'use client';

import React from 'react';

interface SpecialistBadgesProps {
  languages: string[];
  ageGroups: string[];
  className?: string;
}

export default function SpecialistBadges({ languages, ageGroups, className = '' }: SpecialistBadgesProps) {
  const getLanguageFlag = (language: string) => {
    switch (language.toLowerCase()) {
      case 'русский':
        return '🇷🇺';
      case 'английский':
        return '🇺🇸';
      case 'немецкий':
        return '🇩🇪';
      case 'французский':
        return '🇫🇷';
      case 'испанский':
        return '🇪🇸';
      case 'итальянский':
        return '🇮🇹';
      case 'китайский':
        return '🇨🇳';
      case 'японский':
        return '🇯🇵';
      default:
        return '🌐';
    }
  };

  const getAgeGroupIcon = (group: string) => {
    switch (group) {
      case 'children':
        return '👶';
      case 'teens':
        return '🧒';
      case 'adults':
        return '👨';
      case 'seniors':
        return '👴';
      default:
        return '👤';
    }
  };

  const getAgeGroupLabel = (group: string) => {
    switch (group) {
      case 'children':
        return 'Дети (до 12 лет)';
      case 'teens':
        return 'Подростки (13-17 лет)';
      case 'adults':
        return 'Взрослые (18-65 лет)';
      case 'seniors':
        return 'Пожилые (65+ лет)';
      default:
        return group;
    }
  };

  if (languages.length === 0 && ageGroups.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Languages */}
      {languages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Языки консультаций</h4>
          <div className="flex flex-wrap gap-2">
            {languages.map((language, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                <span className="mr-1">{getLanguageFlag(language)}</span>
                {language}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Age Groups */}
      {ageGroups.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Возрастные группы</h4>
          <div className="flex flex-wrap gap-2">
            {ageGroups.map((group, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                <span className="mr-1">{getAgeGroupIcon(group)}</span>
                {getAgeGroupLabel(group)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


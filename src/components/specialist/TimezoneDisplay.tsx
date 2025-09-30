'use client';

import React from 'react';

interface TimezoneDisplayProps {
  timezone: string;
  className?: string;
}

export default function TimezoneDisplay({ timezone, className = '' }: TimezoneDisplayProps) {
  const getTimezoneInfo = (tz: string) => {
    const timezoneMap: { [key: string]: { city: string; offset: string; flag: string } } = {
      'Europe/Moscow': { city: 'Москва', offset: 'UTC+3', flag: '🇷🇺' },
      'Europe/Kiev': { city: 'Киев', offset: 'UTC+2', flag: '🇺🇦' },
      'Europe/Minsk': { city: 'Минск', offset: 'UTC+3', flag: '🇧🇾' },
      'Europe/London': { city: 'Лондон', offset: 'UTC+0', flag: '🇬🇧' },
      'Europe/Berlin': { city: 'Берлин', offset: 'UTC+1', flag: '🇩🇪' },
      'Europe/Paris': { city: 'Париж', offset: 'UTC+1', flag: '🇫🇷' },
      'Europe/Rome': { city: 'Рим', offset: 'UTC+1', flag: '🇮🇹' },
      'Europe/Madrid': { city: 'Мадрид', offset: 'UTC+1', flag: '🇪🇸' },
      'America/New_York': { city: 'Нью-Йорк', offset: 'UTC-5', flag: '🇺🇸' },
      'America/Los_Angeles': { city: 'Лос-Анджелес', offset: 'UTC-8', flag: '🇺🇸' },
      'America/Chicago': { city: 'Чикаго', offset: 'UTC-6', flag: '🇺🇸' },
      'America/Toronto': { city: 'Торонто', offset: 'UTC-5', flag: '🇨🇦' },
      'Asia/Tokyo': { city: 'Токио', offset: 'UTC+9', flag: '🇯🇵' },
      'Asia/Shanghai': { city: 'Шанхай', offset: 'UTC+8', flag: '🇨🇳' },
      'Asia/Seoul': { city: 'Сеул', offset: 'UTC+9', flag: '🇰🇷' },
      'Asia/Singapore': { city: 'Сингапур', offset: 'UTC+8', flag: '🇸🇬' },
      'Australia/Sydney': { city: 'Сидней', offset: 'UTC+10', flag: '🇦🇺' },
      'Australia/Melbourne': { city: 'Мельбурн', offset: 'UTC+10', flag: '🇦🇺' },
    };

    return timezoneMap[tz] || { city: tz, offset: '', flag: '🌍' };
  };

  const getCurrentTime = (tz: string) => {
    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ru-RU', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return timeString;
    } catch (error) {
      return '--:--';
    }
  };

  if (!timezone) {
    return null;
  }

  const timezoneInfo = getTimezoneInfo(timezone);
  const currentTime = getCurrentTime(timezone);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{timezoneInfo.flag}</span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {timezoneInfo.city}
        </span>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <span>{timezoneInfo.offset}</span>
          <span>•</span>
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
}


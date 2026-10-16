import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  favoritesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount = 0,
}) => {
  const tabs: { id: TabType; label: string; icon: string; badge?: number }[] = [
    { id: 'classement', label: 'Classement', icon: 'emoji_events' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'comparer', label: 'Comparer', icon: 'balance' },
    { id: 'favoris', label: 'Favoris', icon: 'star', badge: favoritesCount },
    { id: 'synchro', label: 'Synchro', icon: 'sync' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.5)] border-t border-surface-container-high/40">
      <div className="flex justify-around items-center h-16 px-1 max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center w-16 h-12 transition-all min-w-[44px] min-h-[44px] active:scale-95 ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[22px] transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                  style={
                    isActive && tab.id === 'favoris'
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {tab.icon}
                </span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 px-1 min-w-3.5 h-3.5 rounded-full bg-secondary text-on-secondary font-label-data-sm text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="font-body-sm text-xs tracking-tight mt-0.5">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

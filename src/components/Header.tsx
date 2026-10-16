import React, { useState } from 'react';
import { Currency } from '../types';

interface HeaderProps {
  currency: Currency;
  onToggleCurrency: () => void;
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onToggleCurrency,
  onLogoClick,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-surface-container-high/40">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-5xl mx-auto">
          {/* Logo & IDB Live Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogoClick}
              className="flex items-center gap-1.5 text-left transition-transform active:scale-95"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  corporate_fare
                </span>
              </div>
              <span className="font-headline-md text-lg tracking-tight font-bold text-on-surface">
                WCR
              </span>
            </button>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-data-sm text-[11px] uppercase tracking-wider text-tertiary font-medium">
                IDB Live
              </span>
            </div>
          </div>

          {/* Right Action Hub */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCurrency}
              aria-label="Toggle currency"
              className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant transition-colors flex items-center gap-1 min-w-[44px] justify-center active:scale-95 shadow-sm"
              title="Basculer USD / EUR (Parité 0.92)"
            >
              <span
                className={`font-label-data-sm text-[11px] font-semibold transition-colors ${
                  currency === 'USD' ? 'text-primary' : 'text-outline'
                }`}
              >
                USD
              </span>
              <span className="font-label-data-sm text-[11px] text-outline">/</span>
              <span
                className={`font-label-data-sm text-[11px] font-semibold transition-colors ${
                  currency === 'EUR' ? 'text-primary' : 'text-outline'
                }`}
              >
                EUR
              </span>
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              aria-label="Profil Analyste"
              className="w-8 h-8 rounded-full bg-primary hover:bg-primary-fixed flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-sm"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Analyst Profile Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-surface-container-low border border-surface-container-high p-5 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                  SH
                </div>
                <div>
                  <h3 className="font-headline-md font-semibold text-on-surface">Analyste Institutionnel</h3>
                  <p className="font-label-data-sm text-xs text-on-surface-variant">sheriffhomard@gmail.com</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-surface-container rounded-xl p-3 flex flex-col gap-1.5 text-xs font-label-data-sm text-on-surface-variant">
              <div className="flex justify-between">
                <span>Rôle :</span>
                <span className="text-tertiary font-semibold">Auditeur Financier TTM</span>
              </div>
              <div className="flex justify-between">
                <span>Moteur :</span>
                <span className="text-primary font-semibold">IndexedDB (Dexie v0.2)</span>
              </div>
              <div className="flex justify-between">
                <span>Souveraineté :</span>
                <span className="text-tertiary font-semibold">100% Hors-ligne / Zero Cloud</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-sm font-semibold transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

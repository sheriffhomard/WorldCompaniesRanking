import React, { useState } from 'react';
import { Company, FinancialTTM, Currency } from '../../types';
import { formatCurrencyValue } from '../../utils/formatters';

interface FavorisScreenProps {
  companies: Company[];
  ttmMap: Map<number, FinancialTTM>;
  currency: Currency;
  favoriteTickers: Set<string>;
  onToggleFavorite: (ticker: string) => void;
  onSelectCompany: (company: Company) => void;
  onNavigateToDuel?: () => void;
}

export const FavorisScreen: React.FC<FavorisScreenProps> = ({
  companies,
  ttmMap,
  currency,
  favoriteTickers,
  onToggleFavorite,
  onSelectCompany,
  onNavigateToDuel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const favoritedCompanies = companies.filter((c) => favoriteTickers.has(c.ticker));
  const filtered = favoritedCompanies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCap = favoritedCompanies.reduce((acc, c) => acc + c.marketCapUsd, 0);
  const totalNet = favoritedCompanies.reduce((acc, c) => {
    const t = ttmMap.get(c.id);
    return acc + (t ? t.netIncomeTtm : 0);
  }, 0);

  return (
    <div className="flex flex-col w-full pb-28">
      <div className="px-4 pt-3 pb-4 max-w-5xl mx-auto w-full flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-label-data-sm text-xs uppercase tracking-wider text-secondary font-semibold">
              Portefeuille Souverain
            </span>
            <h1 className="font-headline-lg-mobile text-xl font-bold text-on-surface">
              Sociétés Favorites
            </h1>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-data-sm text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span>{favoritedCompanies.length} sociétés</span>
          </div>
        </div>

        {/* Aggregate Portfolio Bento */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 shadow-md grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-outline font-label-data-sm text-[11px] uppercase tracking-wider">
              Cap. Boursière Cumulée
            </span>
            <span className="text-on-surface font-label-data-lg text-lg font-bold mt-0.5">
              {formatCurrencyValue(totalCap, currency, 0)}
            </span>
            <span className="text-tertiary font-label-data-sm text-[10px]">
              Échantillon sous mandat
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-outline font-label-data-sm text-[11px] uppercase tracking-wider">
              Bénéfice TTM Cumulé
            </span>
            <span className="text-tertiary font-label-data-lg text-lg font-bold mt-0.5">
              {formatCurrencyValue(totalNet, currency, 1)}
            </span>
            <span className="text-on-surface-variant font-label-data-sm text-[10px]">
              Génération nette glissante
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer parmi vos favoris..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-md text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        {/* Empty state if no favorites */}
        {favoritedCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-xl border border-surface-container-high/30 mt-4">
            <span className="material-symbols-outlined text-outline text-[40px] mb-2">
              star_border
            </span>
            <h3 className="font-headline-md font-semibold text-on-surface">Aucun favori enregistré</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              Marquez d'une étoile les entreprises dans le classement pour suivre leurs bénéfices et marges TTM ici.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            {filtered.map((company) => {
              const ttm = ttmMap.get(company.id);

              return (
                <div
                  key={company.id}
                  onClick={() => onSelectCompany(company)}
                  className="p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all flex flex-col gap-2.5 shadow-sm border border-surface-container-high/40 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center font-label-data-sm text-xs text-primary font-bold shrink-0">
                        {company.ticker.replace('.SR', '')}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-headline-md font-semibold text-on-surface text-sm truncate">
                            {company.name}
                          </span>
                          <span className="font-label-data-sm text-[10px] text-tertiary bg-surface-container-low px-1.5 py-0.5 rounded">
                            {company.countryCode}
                          </span>
                        </div>
                        <span className="font-body-sm text-xs text-on-surface-variant truncate">
                          {company.subSector || company.sector} • Rang #{company.rank}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(company.ticker);
                        }}
                        aria-label="Retirer des favoris"
                        className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary active:scale-90"
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Fundamentals */}
                  <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest/80 p-2 rounded-lg text-xs font-label-data-sm">
                    <div>
                      <span className="text-outline text-[10px] block uppercase">Bénéfice TTM</span>
                      <span className="text-tertiary font-bold">
                        {ttm ? formatCurrencyValue(ttm.netIncomeTtm, currency, 1) : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-outline text-[10px] block uppercase">CA TTM</span>
                      <span className="text-on-surface font-semibold">
                        {ttm ? formatCurrencyValue(ttm.revenueTtm, currency, 1) : '-'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-outline text-[10px] block uppercase">Marge Nette</span>
                      <span className="text-tertiary font-semibold">
                        {ttm ? `${ttm.netMargin.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

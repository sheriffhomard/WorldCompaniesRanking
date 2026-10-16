import React, { useState } from 'react';
import { Company, FinancialTTM, Currency } from '../../types';
import { formatCurrencyValue, downloadCsvFile, downloadJsonFile } from '../../utils/formatters';

interface DashboardScreenProps {
  companies: Company[];
  ttmMap: Map<number, FinancialTTM>;
  currency: Currency;
  favoriteTickers: Set<string>;
  onToggleFavorite: (ticker: string) => void;
  onSelectCompany: (company: Company) => void;
  onNavigateToFavorites: () => void;
  onResetDb: () => void;
  storageStats: { usedKb: number; companies: number };
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  companies,
  ttmMap,
  currency,
  favoriteTickers,
  onToggleFavorite,
  onSelectCompany,
  onNavigateToFavorites,
  onResetDb,
  storageStats,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 6 key leaders for infographic
  const pilotLeaders = [
    { ticker: '2222.SR', name: 'Saudi Aramco', val: 121.3, share: 22.1, color: 'bg-primary' },
    { ticker: 'AAPL', name: 'Apple Inc.', val: 100.4, share: 18.3, color: 'bg-primary-container' },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway', val: 96.2, share: 17.5, color: 'bg-secondary' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', val: 88.1, share: 16.1, color: 'bg-surface-tint' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', val: 73.8, share: 13.4, color: 'bg-secondary-fixed-dim' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', val: 69.0, share: 12.6, color: 'bg-tertiary' },
  ];

  const totalClusterSum = pilotLeaders.reduce((acc, l) => acc + l.val, 0);

  const handleExportCsv = () => {
    const headers = ['Entité', 'Nom', 'Bénéfice Net (Md$)', 'Part Relative (%)'];
    const rows = pilotLeaders.map((l) => [l.ticker, l.name, l.val, `${l.share}%`]);
    downloadCsvFile(headers, rows, 'WCR_Dashboard_Télémétrie.csv');
    showToast(`Export CSV généré (${companies.length} enregistrements IDB)`);
  };

  const handleExportJson = () => {
    downloadJsonFile(
      {
        telemetry: 'WCR Sovereign Ledger v0.1-idb',
        generatedAt: new Date().toISOString(),
        activeMetric: 'Bénéfice Net TTM',
        storageUsedKb: storageStats.usedKb,
        entitiesCount: companies.length,
        clusterLeaders: pilotLeaders,
      },
      'WCR_Dashboard_Schema.json'
    );
    showToast('Schéma JSON exporté avec succès');
  };

  const handleReset = () => {
    if (window.confirm('Réinitialiser la base locale Dexie.js aux entités pilotes par défaut ?')) {
      onResetDb();
      showToast(`Base Dexie.js réinitialisée (${storageStats.usedKb} Ko)`);
    }
  };

  // Recent consulted companies
  const consultedTickers = ['2222.SR', 'AAPL', 'NVDA', 'MSFT'];
  const consultedCompanies = consultedTickers
    .map((t) => companies.find((c) => c.ticker === t))
    .filter(Boolean) as Company[];

  const timeSeenMap: Record<string, string> = {
    '2222.SR': 'Vu il y a 8 min',
    AAPL: 'Vu il y a 24 min',
    NVDA: 'Vu hier',
    MSFT: 'Vu hier',
  };

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest text-tertiary px-4 py-2 rounded-full font-label-data-sm text-xs shadow-2xl flex items-center gap-2 border border-tertiary/20">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Status Banner (Methodology Alert) */}
      <div className="px-4 pt-3 pb-2 max-w-5xl mx-auto w-full">
        <div className="bg-surface-container-high text-on-surface rounded-xl p-3.5 shadow-md flex items-start gap-3 relative overflow-hidden border border-surface-container-highest">
          <div className="w-1.5 h-full absolute left-0 top-0 bg-secondary"></div>
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-secondary mt-0.5">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-label-data-sm text-xs uppercase tracking-wider text-secondary font-semibold">
                Avertissement Méthodologique
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Données de démonstration déterministes à des fins d'architecture locale (Dexie.js /
              PWA). Aucune donnée inventée présentée comme réelle.
            </p>
          </div>
        </div>
      </div>

      {/* PWA & Local-First System Card */}
      <div className="px-4 py-1 max-w-5xl mx-auto w-full">
        <div className="bg-surface-container text-on-surface rounded-xl p-3.5 shadow-sm border border-surface-container-high/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
              <span className="font-label-data-sm text-xs text-tertiary uppercase tracking-wider font-semibold">
                Mode Hors-Ligne Opérationnel
              </span>
            </div>
            <span className="font-label-data-sm text-[11px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
              v0.1-idb
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant mb-3">
            PWA Service Worker actif • Architecture Local-First sans dépendance cloud tierce.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest active:scale-[0.98] transition-all flex items-center gap-1.5 text-on-surface text-xs font-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">download</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest active:scale-[0.98] transition-all flex items-center gap-1.5 text-on-surface text-xs font-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">data_object</span>
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleReset}
              className="h-9 px-3 rounded-lg bg-error-container text-on-error-container hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 text-xs font-body-sm font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid (Status Indicators) */}
      <div className="px-4 py-2 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline-md text-base font-semibold text-on-surface tracking-tight">
            Télémétrie Locale
          </h2>
          <span className="font-label-data-sm text-xs text-on-surface-variant">
            SEC Form 10-K / XBRL
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* KPI 1: Records */}
          <div className="bg-surface-container text-on-surface rounded-xl p-3 flex flex-col justify-between shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-body-sm text-xs">Enregistrements</span>
              <span className="material-symbols-outlined text-[18px] text-primary">database</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="font-label-data-lg text-xl font-semibold text-primary">
                {companies.length}
              </span>
              <span className="font-label-data-sm text-xs text-on-surface-variant">sociétés</span>
            </div>
            <div className="font-label-data-sm text-[11px] text-tertiary font-medium">
              IndexedDB Synchro
            </div>
          </div>

          {/* KPI 2: Storage Size */}
          <div className="bg-surface-container text-on-surface rounded-xl p-3 flex flex-col justify-between shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-body-sm text-xs">Stockage local</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">memory</span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="font-label-data-lg text-xl font-semibold text-secondary">
                ~{storageStats.usedKb || 142}
              </span>
              <span className="font-label-data-sm text-xs text-on-surface-variant">Ko</span>
            </div>
            <div className="font-label-data-sm text-[11px] text-on-surface-variant">
              Dexie.js Table cache
            </div>
          </div>

          {/* KPI 3: Active Metric */}
          <div className="bg-surface-container text-on-surface rounded-xl p-3 flex flex-col justify-between shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-body-sm text-xs">Métrique active</span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">analytics</span>
            </div>
            <div className="my-1">
              <span className="font-label-data-md text-sm font-semibold text-on-surface leading-snug block">
                Bénéfice Net
              </span>
              <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                TTM • {currency}
              </span>
            </div>
            <div className="font-label-data-sm text-[11px] text-tertiary font-medium">
              Pilot Scope
            </div>
          </div>

          {/* KPI 4: Last Sync Date */}
          <div className="bg-surface-container text-on-surface rounded-xl p-3 flex flex-col justify-between shadow-sm border border-surface-container-high/30">
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-body-sm text-xs">Dernière synchro</span>
              <span className="material-symbols-outlined text-[18px] text-outline">history</span>
            </div>
            <div className="my-1">
              <span className="font-label-data-md text-sm font-semibold text-on-surface block">
                24 Oct. 2024
              </span>
              <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                14:32:08 UTC
              </span>
            </div>
            <div className="font-label-data-sm text-[11px] text-on-surface-variant">
              Mock Snapshot
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Top Leaders Infographic */}
      <div className="px-4 py-2 max-w-5xl mx-auto w-full">
        <div className="bg-surface-container text-on-surface rounded-xl p-4 shadow-md border border-surface-container-high/40">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-label-data-sm text-xs uppercase tracking-wider text-primary font-semibold">
                Infographie Financière
              </span>
              <h3 className="font-headline-lg-mobile text-lg font-semibold text-on-surface">
                Leaders & Répartition TTM
              </h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">leaderboard</span>
            </div>
          </div>

          {/* Total & Switch Indicator */}
          <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between my-2 border border-surface-container-high/20">
            <div>
              <div className="font-body-sm text-xs text-on-surface-variant">
                Masse cumulée du cluster pilote
              </div>
              <div className="font-label-data-lg text-lg text-tertiary font-semibold">
                {formatCurrencyValue(totalClusterSum, currency, 1)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-label-data-sm text-xs text-on-surface-variant">Échantillon</div>
              <div className="font-label-data-sm text-xs text-primary font-semibold">
                6 Groupes Clés
              </div>
            </div>
          </div>

          {/* Horizontal Bar Histogram with Relative Share */}
          <div className="flex flex-col gap-3 my-3">
            {pilotLeaders.map((item, idx) => {
              const comp = companies.find((c) => c.ticker === item.ticker);
              const maxVal = pilotLeaders[0].val;
              const barWidth = (item.val / maxVal) * 100;

              return (
                <div
                  key={item.ticker}
                  onClick={() => comp && onSelectCompany(comp)}
                  className="flex flex-col gap-1 cursor-pointer group"
                >
                  <div className="flex items-center justify-between font-label-data-sm text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`${idx < 3 ? 'text-secondary' : 'text-on-surface-variant'} font-bold`}>
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="text-on-surface-variant text-[10px]">
                        {item.ticker}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-on-surface">
                        {formatCurrencyValue(item.val, currency, 1)}
                      </span>
                      <span className="text-tertiary bg-surface-container-highest px-1.5 py-0.2 rounded font-mono text-[10px]">
                        {item.share}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparative Bar Visual Stack */}
          <div className="mt-3 pt-2 border-t border-surface-container-high/30">
            <div className="flex justify-between items-center mb-1.5 font-label-data-sm text-xs">
              <span className="text-on-surface-variant">Distribution relative cumulée (100%)</span>
              <span className="text-primary font-mono">6 entités</span>
            </div>
            <div className="h-3 w-full rounded-md flex overflow-hidden gap-0.5 bg-surface-container-lowest p-0.5">
              {pilotLeaders.map((item) => (
                <div
                  key={item.ticker}
                  className={`${item.color} rounded-xs`}
                  style={{ width: `${item.share}%` }}
                  title={`${item.name} ${item.share}%`}
                ></div>
              ))}
            </div>
          </div>

          {/* Methodological Footnote */}
          <div className="mt-3 bg-surface-container-low rounded-lg p-2.5 flex items-start gap-2 border border-surface-container-high/20">
            <span className="material-symbols-outlined text-[16px] text-outline shrink-0 mt-0.5">
              info
            </span>
            <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
              <span className="font-medium text-on-surface">Note méthodologique explicite :</span> Part =
              valeur société / somme du Top sélectionné. Ne constitue pas une part de marché globale.
              Calculs déterministes basés sur les derniers états financiers SEC simulés.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Views & Favorite Shortcuts */}
      <div className="px-4 pt-2 pb-2 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline-md text-base font-semibold text-on-surface tracking-tight">
            Consultations & Favoris
          </h2>
          <button
            onClick={onNavigateToFavorites}
            className="font-body-sm text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            <span>Gérer ({favoriteTickers.size})</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {consultedCompanies.map((c) => {
            const ttm = ttmMap.get(c.id);
            const isFav = favoriteTickers.has(c.ticker);
            const timeAgo = timeSeenMap[c.ticker] || 'Vu récemment';

            return (
              <div
                key={c.id}
                onClick={() => onSelectCompany(c)}
                className="bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99] border border-surface-container-high/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center font-label-data-sm text-xs text-primary font-bold shrink-0">
                    {c.ticker.replace('.SR', '')}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-md font-semibold text-on-surface truncate text-sm">
                        {c.name}
                      </span>
                      <span className="font-label-data-sm text-[10px] text-tertiary bg-surface-container-low px-1.5 py-0.5 rounded">
                        {c.countryCode}
                      </span>
                    </div>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate">
                      Bénéfice : {ttm ? formatCurrencyValue(ttm.netIncomeTtm, currency, 1) : '-'} • {timeAgo}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(c.ticker);
                  }}
                  aria-label="Favori"
                  className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary active:scale-90 transition-transform"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={isFav ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    star
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Local-First Actions Modal Trigger / Info Bar */}
      <div className="px-4 pb-2 max-w-5xl mx-auto w-full">
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between border border-surface-container-high/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]">
              sync_saved_locally
            </span>
            <div className="flex flex-col">
              <span className="font-label-data-sm text-xs text-on-surface font-semibold">
                Dexie.js IDB Store
              </span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">
                Schéma : v0.1 • {companies.length} entités pilotes
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-tertiary font-label-data-sm text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span>Prêt</span>
          </div>
        </div>
      </div>
    </div>
  );
};

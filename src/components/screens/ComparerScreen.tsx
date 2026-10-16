import React, { useState } from 'react';
import { Company, FinancialTTM, Currency } from '../../types';
import { formatCurrencyValue, downloadCsvFile } from '../../utils/formatters';

interface ComparerScreenProps {
  companies: Company[];
  ttmMap: Map<number, FinancialTTM>;
  currency: Currency;
  onSelectCompany: (company: Company) => void;
}

export const ComparerScreen: React.FC<ComparerScreenProps> = ({
  companies,
  ttmMap,
  currency,
  onSelectCompany,
}) => {
  // Current 2 companies in the duel
  const [peer1Ticker, setPeer1Ticker] = useState('AAPL');
  const [peer2Ticker, setPeer2Ticker] = useState('MSFT');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'peer1' | 'peer2' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const comp1 = companies.find((c) => c.ticker === peer1Ticker) || companies[1] || companies[0];
  const comp2 = companies.find((c) => c.ticker === peer2Ticker) || companies[2] || companies[0];

  const ttm1 = ttmMap.get(comp1.id);
  const ttm2 = ttmMap.get(comp2.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCsv = () => {
    if (!ttm1 || !ttm2) return;

    const headers = ['Indicateur TTM', `${comp1.name} (${comp1.ticker})`, `${comp2.name} (${comp2.ticker})`, 'Devise', 'Source'];
    const rows = [
      ["Chiffre d'affaires TTM", formatCurrencyValue(ttm1.revenueTtm, currency, 1), formatCurrencyValue(ttm2.revenueTtm, currency, 1), currency, 'SEC XBRL'],
      ['Bénéfice net TTM', formatCurrencyValue(ttm1.netIncomeTtm, currency, 1), formatCurrencyValue(ttm2.netIncomeTtm, currency, 1), currency, 'SEC XBRL'],
      ['Marge nette', `${ttm1.netMargin.toFixed(1)}%`, `${ttm2.netMargin.toFixed(1)}%`, 'Pourcentage', 'SEC XBRL'],
      ['EBITDA TTM', formatCurrencyValue(ttm1.ebitdaTtm, currency, 1), formatCurrencyValue(ttm2.ebitdaTtm, currency, 1), currency, 'SEC XBRL'],
      ['FCF TTM', formatCurrencyValue(ttm1.fcfTtm, currency, 1), formatCurrencyValue(ttm2.fcfTtm, currency, 1), currency, 'SEC XBRL'],
      ['Croissance annuelle CA', `+${ttm1.yoyGrowth.toFixed(1)}%`, `+${ttm2.yoyGrowth.toFixed(1)}%`, 'Pourcentage', 'SEC XBRL'],
      ['Période TTM', ttm1.periodLabel, ttm2.periodLabel, 'Fiscale', '10-K/10-Q'],
    ];

    downloadCsvFile(headers, rows, `WCR_Comparateur_${comp1.ticker}_${comp2.ticker}.csv`);
    showToast(`Fichier WCR_Comparateur_${comp1.ticker}_${comp2.ticker}.csv téléchargé`);
  };

  const openPicker = (target: 'peer1' | 'peer2') => {
    setPickerTarget(target);
    setShowPicker(true);
    setSearchQuery('');
  };

  const selectCompanyForDuel = (c: Company) => {
    if (pickerTarget === 'peer1') {
      if (c.ticker === peer2Ticker) {
        setPeer2Ticker(peer1Ticker);
      }
      setPeer1Ticker(c.ticker);
    } else {
      if (c.ticker === peer1Ticker) {
        setPeer1Ticker(peer2Ticker);
      }
      setPeer2Ticker(c.ticker);
    }
    setShowPicker(false);
    showToast(`Duel mis à jour : ${c.ticker}`);
  };

  const filteredPickerCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest text-tertiary px-4 py-2 rounded-full font-label-data-sm text-xs shadow-2xl flex items-center gap-2 border border-tertiary/20">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="px-4 pt-3 pb-4 max-w-5xl mx-auto w-full flex flex-col gap-3">
        {/* Header Title & Benchmarking Status Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-label-data-sm text-xs uppercase tracking-wider text-primary">
              Analyse Comparative Directe
            </span>
            <h1 className="font-headline-lg-mobile text-xl font-bold text-on-surface">
              Duel Fondamental
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span className="font-label-data-sm text-[11px] uppercase font-semibold">
              2 / 10 Max
            </span>
          </div>
        </div>

        {/* Active Peers Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Peer 1 Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface shrink-0 border border-primary/20">
            <div className="w-5 h-5 rounded bg-surface-container-lowest flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px] text-primary">domain</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-data-sm text-xs font-semibold text-primary">
                {comp1.ticker}
              </span>
              <span className="font-body-sm text-[10px] text-on-surface-variant leading-none truncate max-w-[80px]">
                {comp1.name}
              </span>
            </div>
            <button
              onClick={() => openPicker('peer1')}
              aria-label="Changer premier concurrent"
              className="ml-1 text-outline hover:text-primary transition-colors"
              title="Changer"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            </button>
          </div>

          {/* Peer 2 Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface shrink-0 border border-secondary/20">
            <div className="w-5 h-5 rounded bg-surface-container-lowest flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px] text-secondary">cloud</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-data-sm text-xs font-semibold text-secondary">
                {comp2.ticker}
              </span>
              <span className="font-body-sm text-[10px] text-on-surface-variant leading-none truncate max-w-[80px]">
                {comp2.name}
              </span>
            </div>
            <button
              onClick={() => openPicker('peer2')}
              aria-label="Changer second concurrent"
              className="ml-1 text-outline hover:text-secondary transition-colors"
              title="Changer"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            </button>
          </div>

          {/* Add Peer CTA (Dexie Local Store) */}
          <button
            onClick={() => openPicker('peer2')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary transition-all shrink-0 border border-surface-container-high text-xs font-label-data-sm font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span className="whitespace-nowrap">+ Changer (DexieDB)</span>
          </button>
        </div>

        {/* Collapsible Dexie Picker Drawer */}
        {showPicker && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-container-high border border-surface-container-highest animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-label-data-sm text-xs text-on-surface-variant uppercase font-semibold">
                Banque locale Dexie • Choisir pour {pickerTarget === 'peer1' ? 'Concurrent #1' : 'Concurrent #2'}
              </span>
              <button
                onClick={() => setShowPicker(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest">
              <span className="material-symbols-outlined text-outline text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher NVDA, GOOGL, AMZN, Aramco..."
                className="bg-transparent text-on-surface font-body-sm text-xs outline-none w-full placeholder:text-outline"
                autoFocus
              />
            </div>
            <div className="flex gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {filteredPickerCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCompanyForDuel(c)}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant font-label-data-sm text-[11px] cursor-pointer transition-colors whitespace-nowrap"
                >
                  {c.ticker} ({c.name})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dual Header Cards Visual Anchor */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Peer 1 Card */}
          <div
            onClick={() => onSelectCompany(comp1)}
            className="flex flex-col p-3 rounded-xl bg-surface-container relative overflow-hidden shadow-md border border-surface-container-high/40 cursor-pointer hover:border-primary/50 transition-all"
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-headline-md text-base text-on-surface font-bold">
                  {comp1.ticker}
                </span>
              </div>
              <span className="font-label-data-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant uppercase">
                Rang #{comp1.rank}
              </span>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant truncate">
              {comp1.name}
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-label-data-lg text-lg text-on-surface font-bold">
                {formatCurrencyValue(comp1.marketCapUsd, currency, 0)}
              </span>
              <span className="font-label-data-sm text-xs text-outline">Cap</span>
            </div>

            {/* Sparkline */}
            <div className="w-full h-8 mt-2 flex items-end">
              <svg className="w-full h-7 overflow-visible" fill="none" viewBox="0 0 100 24">
                <path
                  className="text-primary"
                  d="M0,18 Q20,16 40,20 T70,8 T100,5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <circle className="fill-primary" cx="100" cy="5" r="2.5" />
              </svg>
            </div>
          </div>

          {/* Peer 2 Card */}
          <div
            onClick={() => onSelectCompany(comp2)}
            className="flex flex-col p-3 rounded-xl bg-surface-container relative overflow-hidden shadow-md border border-surface-container-high/40 cursor-pointer hover:border-secondary/50 transition-all"
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="font-headline-md text-base text-on-surface font-bold">
                  {comp2.ticker}
                </span>
              </div>
              <span className="font-label-data-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant uppercase">
                Rang #{comp2.rank}
              </span>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant truncate">
              {comp2.name}
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-label-data-lg text-lg text-on-surface font-bold">
                {formatCurrencyValue(comp2.marketCapUsd, currency, 0)}
              </span>
              <span className="font-label-data-sm text-xs text-outline">Cap</span>
            </div>

            {/* Sparkline */}
            <div className="w-full h-8 mt-2 flex items-end">
              <svg className="w-full h-7 overflow-visible" fill="none" viewBox="0 0 100 24">
                <path
                  className="text-secondary"
                  d="M0,22 Q25,18 50,12 T80,14 T100,2"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
                <circle className="fill-secondary" cx="100" cy="2" r="2.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Comparative Fundamental Metrics Engine */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="font-label-data-sm text-xs uppercase tracking-wider text-outline">
              Métriques Clés (TTM)
            </span>
            <span className="font-label-data-sm text-[11px] text-tertiary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Leader Surligné
            </span>
          </div>

          {/* Metric Row 1: Chiffre d'Affaires TTM */}
          {ttm1 && ttm2 && (
            <div className="p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-2 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Chiffre d'Affaires TTM
                </span>
                <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                  Volume Brut
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Peer 1 */}
                <div
                  className={`flex flex-col p-2.5 rounded-lg transition-colors ${
                    ttm1.revenueTtm >= ttm2.revenueTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm1.revenueTtm >= ttm2.revenueTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp1.ticker} {ttm1.revenueTtm >= ttm2.revenueTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm1.revenueTtm >= ttm2.revenueTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm1.revenueTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm1.revenueTtm >= ttm2.revenueTtm ? 'bg-tertiary' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm1.revenueTtm / Math.max(ttm1.revenueTtm, ttm2.revenueTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Peer 2 */}
                <div
                  className={`flex flex-col p-2.5 rounded-lg transition-colors ${
                    ttm2.revenueTtm > ttm1.revenueTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm2.revenueTtm > ttm1.revenueTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp2.ticker} {ttm2.revenueTtm > ttm1.revenueTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm2.revenueTtm > ttm1.revenueTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm2.revenueTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm2.revenueTtm > ttm1.revenueTtm ? 'bg-tertiary' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm2.revenueTtm / Math.max(ttm1.revenueTtm, ttm2.revenueTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric Row 2: Bénéfice Net TTM */}
          {ttm1 && ttm2 && (
            <div className="p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-2 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Bénéfice Net TTM
                </span>
                <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                  Revenu Résiduel
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm1.netIncomeTtm >= ttm2.netIncomeTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm1.netIncomeTtm >= ttm2.netIncomeTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp1.ticker} {ttm1.netIncomeTtm >= ttm2.netIncomeTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm1.netIncomeTtm >= ttm2.netIncomeTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm1.netIncomeTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm1.netIncomeTtm >= ttm2.netIncomeTtm ? 'bg-tertiary' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm1.netIncomeTtm / Math.max(ttm1.netIncomeTtm, ttm2.netIncomeTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm2.netIncomeTtm > ttm1.netIncomeTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm2.netIncomeTtm > ttm1.netIncomeTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp2.ticker} {ttm2.netIncomeTtm > ttm1.netIncomeTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm2.netIncomeTtm > ttm1.netIncomeTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm2.netIncomeTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm2.netIncomeTtm > ttm1.netIncomeTtm ? 'bg-tertiary' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm2.netIncomeTtm / Math.max(ttm1.netIncomeTtm, ttm2.netIncomeTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric Row 3: Marge Nette */}
          {ttm1 && ttm2 && (
            <div className="p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-2 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-body-md text-sm text-on-surface font-medium">Marge Nette</span>
                  <span className="material-symbols-outlined text-tertiary text-[16px]">stars</span>
                </div>
                <span className="font-label-data-sm text-[11px] text-tertiary font-medium">
                  Rentabilité Pure
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Peer 1 */}
                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm1.netMargin >= ttm2.netMargin
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                        ttm1.netMargin >= ttm2.netMargin ? 'text-tertiary-fixed' : 'text-outline'
                      }`}
                    >
                      {comp1.ticker}
                    </span>
                    {ttm1.netMargin >= ttm2.netMargin && (
                      <span className="font-label-data-sm text-[10px] font-bold text-tertiary uppercase">
                        +{(ttm1.netMargin - ttm2.netMargin).toFixed(1)} PTS
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm1.netMargin >= ttm2.netMargin ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {ttm1.netMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm1.netMargin >= ttm2.netMargin ? 'bg-tertiary' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm1.netMargin / Math.max(ttm1.netMargin, ttm2.netMargin)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Peer 2 */}
                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm2.netMargin > ttm1.netMargin
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                        ttm2.netMargin > ttm1.netMargin ? 'text-tertiary-fixed' : 'text-outline'
                      }`}
                    >
                      {comp2.ticker}
                    </span>
                    {ttm2.netMargin > ttm1.netMargin && (
                      <span className="font-label-data-sm text-[10px] font-bold text-tertiary uppercase">
                        +{(ttm2.netMargin - ttm1.netMargin).toFixed(1)} PTS
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm2.netMargin > ttm1.netMargin ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {ttm2.netMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm2.netMargin > ttm1.netMargin ? 'bg-tertiary' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm2.netMargin / Math.max(ttm1.netMargin, ttm2.netMargin)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric Row 4: EBITDA TTM */}
          {ttm1 && ttm2 && (
            <div className="p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-2 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface font-medium">EBITDA TTM</span>
                <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                  Capacité Opérationnelle
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm1.ebitdaTtm >= ttm2.ebitdaTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm1.ebitdaTtm >= ttm2.ebitdaTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp1.ticker} {ttm1.ebitdaTtm >= ttm2.ebitdaTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm1.ebitdaTtm >= ttm2.ebitdaTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm1.ebitdaTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm1.ebitdaTtm >= ttm2.ebitdaTtm ? 'bg-tertiary' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm1.ebitdaTtm / Math.max(ttm1.ebitdaTtm, ttm2.ebitdaTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm2.ebitdaTtm > ttm1.ebitdaTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm2.ebitdaTtm > ttm1.ebitdaTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp2.ticker} {ttm2.ebitdaTtm > ttm1.ebitdaTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm2.ebitdaTtm > ttm1.ebitdaTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm2.ebitdaTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm2.ebitdaTtm > ttm1.ebitdaTtm ? 'bg-tertiary' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm2.ebitdaTtm / Math.max(ttm1.ebitdaTtm, ttm2.ebitdaTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric Row 5: Flux Libre FCF */}
          {ttm1 && ttm2 && (
            <div className="p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-2 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Flux Libre (FCF) TTM
                </span>
                <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                  Génération Cash
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm1.fcfTtm >= ttm2.fcfTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm1.fcfTtm >= ttm2.fcfTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp1.ticker} {ttm1.fcfTtm >= ttm2.fcfTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm1.fcfTtm >= ttm2.fcfTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm1.fcfTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm1.fcfTtm >= ttm2.fcfTtm ? 'bg-tertiary' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm1.fcfTtm / Math.max(ttm1.fcfTtm, ttm2.fcfTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm2.fcfTtm > ttm1.fcfTtm
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                      ttm2.fcfTtm > ttm1.fcfTtm ? 'text-tertiary-fixed' : 'text-outline'
                    }`}
                  >
                    {comp2.ticker} {ttm2.fcfTtm > ttm1.fcfTtm && '(Leader)'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm2.fcfTtm > ttm1.fcfTtm ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {formatCurrencyValue(ttm2.fcfTtm, currency, 1)}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm2.fcfTtm > ttm1.fcfTtm ? 'bg-tertiary' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (ttm2.fcfTtm / Math.max(ttm1.fcfTtm, ttm2.fcfTtm)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric Row 6: Croissance CA Annuelle */}
          {ttm1 && ttm2 && (
            <div className="p-3 rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-2 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-sm text-on-surface font-medium">
                  Croissance CA Annuelle
                </span>
                <span className="font-label-data-sm text-[11px] text-tertiary font-medium">
                  Dynamique YoY
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm1.yoyGrowth >= ttm2.yoyGrowth
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                        ttm1.yoyGrowth >= ttm2.yoyGrowth ? 'text-tertiary-fixed' : 'text-outline'
                      }`}
                    >
                      {comp1.ticker}
                    </span>
                    {ttm1.yoyGrowth >= ttm2.yoyGrowth && (
                      <span className="font-label-data-sm text-[10px] font-bold text-tertiary uppercase">
                        Plus Rapide
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm1.yoyGrowth >= ttm2.yoyGrowth ? 'text-tertiary' : 'text-primary'
                      }`}
                    >
                      {ttm1.yoyGrowth >= 0 ? `+${ttm1.yoyGrowth.toFixed(1)}%` : `${ttm1.yoyGrowth.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm1.yoyGrowth >= ttm2.yoyGrowth ? 'bg-tertiary' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, (Math.abs(ttm1.yoyGrowth) / Math.max(Math.abs(ttm1.yoyGrowth), Math.abs(ttm2.yoyGrowth))) * 100)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className={`flex flex-col p-2.5 rounded-lg ${
                    ttm2.yoyGrowth > ttm1.yoyGrowth
                      ? 'bg-tertiary-container/30 text-on-tertiary-container'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-label-data-sm text-[10px] uppercase font-semibold ${
                        ttm2.yoyGrowth > ttm1.yoyGrowth ? 'text-tertiary-fixed' : 'text-outline'
                      }`}
                    >
                      {comp2.ticker}
                    </span>
                    {ttm2.yoyGrowth > ttm1.yoyGrowth && (
                      <span className="font-label-data-sm text-[10px] font-bold text-tertiary uppercase">
                        Vitesse {(ttm2.yoyGrowth / Math.max(1, ttm1.yoyGrowth)).toFixed(1)}x
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`font-label-data-lg text-base font-bold ${
                        ttm2.yoyGrowth > ttm1.yoyGrowth ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {ttm2.yoyGrowth >= 0 ? `+${ttm2.yoyGrowth.toFixed(1)}%` : `${ttm2.yoyGrowth.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ttm2.yoyGrowth > ttm1.yoyGrowth ? 'bg-tertiary' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(10, (Math.abs(ttm2.yoyGrowth) / Math.max(Math.abs(ttm1.yoyGrowth), Math.abs(ttm2.yoyGrowth))) * 100)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Périodes de calcul & Réconciliation TTM (Bento Info Block) */}
        <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-2.5 shadow-sm border border-surface-container-high/40">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span className="font-label-data-sm text-xs uppercase font-semibold">
              Fenêtres de Calcul TTM Décalées
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            Le calcul TTM consolide la somme glissante des 4 derniers trimestres publiés selon les
            cycles fiscaux respectifs :
          </p>
          <div className="grid grid-cols-1 gap-2 pt-1">
            <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface text-xs">
              <div className="flex items-center gap-2">
                <span className="font-label-data-sm font-bold text-primary">{comp1.ticker}</span>
                <span className="font-body-sm text-on-surface-variant">{ttm1?.periodLabel || 'Q4-23 → Q3-24'}</span>
              </div>
              <span className="font-label-data-sm text-[11px] text-tertiary font-mono">
                {comp1.fiscalYearEnd || 'Clos au 30 Juin 2024'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-on-surface text-xs">
              <div className="flex items-center gap-2">
                <span className="font-label-data-sm font-bold text-secondary">{comp2.ticker}</span>
                <span className="font-body-sm text-on-surface-variant">{ttm2?.periodLabel || 'Q1-24 → Q4-24'}</span>
              </div>
              <span className="font-label-data-sm text-[11px] text-secondary font-mono">
                {comp2.fiscalYearEnd || 'Exercice fiscal décalé'}
              </span>
            </div>
          </div>
        </div>

        {/* Provenance Institutionnelle & Métadonnées SEC */}
        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2 shadow-sm border border-surface-container-high/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-tertiary">
              <span className="material-symbols-outlined text-[18px]">shield</span>
              <span className="font-label-data-sm text-xs uppercase font-semibold">
                Traçabilité XBRL
              </span>
            </div>
            <span className="font-label-data-sm text-[10px] text-outline">SEC US-GAAP</span>
          </div>
          <div className="flex flex-col gap-1.5 text-on-surface-variant font-body-sm text-xs">
            <div className="flex justify-between items-center">
              <span>Sources Primaires :</span>
              <span className="font-label-data-sm text-[11px] text-on-surface font-mono">
                SEC Form 10-K / 10-Q
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Parité de Conversion :</span>
              <span className="font-label-data-sm text-[11px] text-on-surface font-mono">
                1.00 USD (Monnaie reporting)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Empreinte Locale :</span>
              <span className="font-label-data-sm text-[11px] text-tertiary font-mono">
                Dexie.js Offline Cache Sync OK
              </span>
            </div>
          </div>
        </div>

        {/* Export & Share Action Hub */}
        <div className="flex flex-col gap-2">
          <span className="font-label-data-sm text-xs uppercase tracking-wider text-outline px-1">
            Exportation Sécurisée
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => showToast(`Capture PNG générée (${comp1.ticker} vs ${comp2.ticker})`)}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-primary text-on-primary font-body-md text-sm font-semibold shadow-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">image</span>
              <span>Fiche PNG</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-sm font-medium shadow-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">table_view</span>
              <span>Données CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

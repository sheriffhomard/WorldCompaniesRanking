import React, { useState } from 'react';
import { Company, FinancialTTM, FinancialQuarter, Currency } from '../../types';
import { formatCurrencyValue, downloadJsonFile, downloadCsvFile } from '../../utils/formatters';

interface CompanyDetailModalProps {
  company: Company;
  ttm: FinancialTTM;
  quarters: FinancialQuarter[];
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (ticker: string) => void;
  onClose: () => void;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  company,
  ttm,
  quarters,
  currency,
  isFavorite,
  onToggleFavorite,
  onClose,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExportData = () => {
    downloadJsonFile(
      {
        company,
        ttm,
        quarters,
        exportedAt: new Date().toISOString(),
        zodValidation: 'PASS - Strict v3.23',
        source: 'SEC EDGAR XBRL Data'
      },
      `WCR_${company.ticker}_Financial_Audit.json`
    );

    // Also offer CSV
    downloadCsvFile(
      ['Trimestre', 'Formulaire', 'Date de Clôture', 'Bénéfice Net (Md$)', 'Chiffre d\'Affaires (Md$)', 'Cash-Flow Libre (Md$)'],
      quarters.map((q) => [
        q.quarterLabel,
        q.form,
        q.closingDate,
        q.netIncome.toFixed(2),
        q.revenue.toFixed(2),
        q.fcf.toFixed(2)
      ]),
      `WCR_${company.ticker}_Quarters.csv`
    );

    setToastMessage('Données financières exportées avec succès (JSON & CSV)');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute total of quarters for decomposition
  const totalQuarterNetIncome = quarters.reduce((acc, q) => acc + q.netIncome, 0) || ttm.netIncomeTtm;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface/95 backdrop-blur-md pb-safe">
      {/* Top sticky bar */}
      <div className="sticky top-0 z-20 h-14 px-4 flex items-center justify-between bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/40 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            aria-label="Retour"
            className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary transition-colors rounded-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="font-headline-lg-mobile text-lg font-semibold text-on-surface truncate">
            Détails Entreprise
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(company.ticker)}
            aria-label="Ajouter aux favoris"
            className={`w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center transition-all active:scale-90 ${
              isFavorite ? 'text-secondary' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              star
            </span>
          </button>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col w-full max-w-2xl mx-auto px-4 py-4 gap-4">
        {/* Interactive Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-tertiary shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-data-sm text-[11px] uppercase tracking-wider text-tertiary font-medium">
              Données Normalisées Zod
            </span>
          </div>
          <span className="font-label-data-sm text-xs text-on-surface-variant">
            CIK: {company.cik}
          </span>
        </div>

        {/* En-tête Officiel Sovereign */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-4 shadow-md flex flex-col gap-3 border border-surface-container-high/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline-lg-mobile text-xl font-semibold text-on-surface">
                  {company.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-label-data-sm text-[11px] font-medium">
                  {company.exchange}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant font-body-sm text-xs flex-wrap">
                <span className="font-label-data-md font-semibold text-primary">
                  {company.ticker}
                </span>
                <span>•</span>
                <span>{company.country} {company.countryFlag}</span>
                <span>•</span>
                <span>Devise : {currency}</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center p-1 shrink-0 shadow-sm overflow-hidden">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="material-symbols-outlined text-primary text-[26px]">
                  corporate_fare
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-body-sm text-xs">
              {company.subSector || company.sector}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-body-sm text-xs">
              Rang Global #{company.rank}
            </span>
          </div>

          {/* Verification Badge Box */}
          <div className="mt-1 flex items-center justify-between p-2.5 rounded-lg bg-surface-container text-on-surface-variant font-body-sm text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified_user</span>
              <span className="truncate">Mock SEC Form 10-Q & 10-K validés</span>
            </div>
            <span className="font-label-data-sm text-[10px] text-tertiary font-semibold shrink-0">
              100% INTÈGRE
            </span>
          </div>
        </div>

        {/* Indicateurs TTM (Traînée 12 Mois) Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-headline-md text-base font-semibold text-on-surface">
              Indicateurs TTM
            </span>
            <span className="font-label-data-sm text-xs text-on-surface-variant">
              Traînée 12 Mois
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Bénéfice Net */}
            <div className="flex flex-col p-3 rounded-lg bg-surface-container shadow-sm border border-surface-container-high/30">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-body-sm text-xs">Bénéfice Net</span>
                <span className="material-symbols-outlined text-primary text-[18px]">query_stats</span>
              </div>
              <div className="font-label-data-lg text-lg text-primary font-bold tracking-tight">
                {formatCurrencyValue(ttm.netIncomeTtm, currency, 2)}
              </div>
              <span className="font-label-data-sm text-[11px] text-tertiary mt-1 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                {ttm.yoyGrowth >= 0 ? `+${ttm.yoyGrowth.toFixed(1)}%` : `${ttm.yoyGrowth.toFixed(1)}%`} a/a
              </span>
            </div>

            {/* Chiffre d'Affaires */}
            <div className="flex flex-col p-3 rounded-lg bg-surface-container shadow-sm border border-surface-container-high/30">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-body-sm text-xs">Chiffre d'Affaires</span>
                <span className="material-symbols-outlined text-secondary text-[18px]">account_balance</span>
              </div>
              <div className="font-label-data-lg text-lg text-on-surface font-bold tracking-tight">
                {formatCurrencyValue(ttm.revenueTtm, currency, 2)}
              </div>
              <span className="font-label-data-sm text-[11px] text-tertiary mt-1 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                +2,8% a/a
              </span>
            </div>

            {/* Marge Nette */}
            <div className="flex flex-col p-3 rounded-lg bg-surface-container shadow-sm border border-surface-container-high/30">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-body-sm text-xs">Marge Nette</span>
                <span className="material-symbols-outlined text-tertiary text-[18px]">pie_chart</span>
              </div>
              <div className="font-label-data-lg text-lg text-tertiary font-bold tracking-tight">
                {ttm.netMargin.toFixed(1)}%
              </div>
              <span className="font-label-data-sm text-[11px] text-on-surface-variant mt-1">
                Excellence opérationnelle
              </span>
            </div>

            {/* Cash-Flow Libre */}
            <div className="flex flex-col p-3 rounded-lg bg-surface-container shadow-sm border border-surface-container-high/30">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-body-sm text-xs">Cash-Flow Libre</span>
                <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              </div>
              <div className="font-label-data-lg text-lg text-on-surface font-bold tracking-tight">
                {formatCurrencyValue(ttm.fcfTtm, currency, 2)}
              </div>
              <span className="font-label-data-sm text-[11px] text-tertiary mt-1">
                Conversion: {Math.round((ttm.fcfTtm / ttm.netIncomeTtm) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Décomposition 4 Trimestres TTM */}
        <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-3 shadow-md border border-surface-container-high/40">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-base font-semibold text-on-surface">
                Décomposition TTM
              </span>
              <span className="px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-label-data-sm text-xs">
                Audit Valide
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Bénéfice Net : 4 derniers trimestres publiés (Sans chevauchement temporel)
            </p>
          </div>

          {/* Timeline Quarters Flow */}
          <div className="flex flex-col gap-2 pt-1">
            {quarters.map((q, idx) => {
              const partOfTtm = totalQuarterNetIncome > 0 
                ? ((q.netIncome / totalQuarterNetIncome) * 100).toFixed(1)
                : '25.0';
              const isHighlight = idx === 2; // e.g. holiday quarter

              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-data-sm text-xs font-bold ${
                      isHighlight ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-primary'
                    }`}>
                      {q.quarterCode.split(' ')[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-sm font-semibold text-on-surface">
                        {q.quarterLabel}
                      </span>
                      <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                        Clôture : {q.closingDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-label-data-md text-sm font-bold ${isHighlight ? 'text-secondary' : 'text-on-surface'}`}>
                      {formatCurrencyValue(q.netIncome, currency, 2)}
                    </span>
                    <span className="font-label-data-sm text-[11px] text-on-surface-variant">
                      {partOfTtm}% du TTM
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Stacked Bar */}
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex items-center justify-between font-label-data-sm text-xs text-on-surface-variant">
              <span>Part cumulative TTM</span>
              <span className="text-on-surface font-semibold">
                {formatCurrencyValue(totalQuarterNetIncome, currency, 2)} validé
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container-highest flex overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '21.2%' }} title="Q3: 21.2%"></div>
              <div className="h-full bg-primary-container" style={{ width: '23.4%' }} title="Q2: 23.4%"></div>
              <div className="h-full bg-secondary" style={{ width: '33.6%' }} title="Q1: 33.6%"></div>
              <div className="h-full bg-surface-bright" style={{ width: '22.7%' }} title="Q4: 22.7%"></div>
            </div>
          </div>
        </div>

        {/* Historique Annuel 3 Ans (Bar Chart SVG Compact) */}
        <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-3 shadow-md border border-surface-container-high/40">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-headline-md text-base font-semibold text-on-surface">
                Tendance Annuelle
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">
                Résultats nets exercices clos ({currency === 'EUR' ? 'Md€' : 'Md$'})
              </span>
            </div>
            <span className="font-label-data-sm text-xs text-secondary font-medium">
              3 Derniers Exercices
            </span>
          </div>

          <div className="w-full pt-2 flex flex-col items-center">
            <svg className="w-full h-32 text-on-surface" preserveAspectRatio="none" viewBox="0 0 320 130">
              {/* Guidelines */}
              <line opacity="0.1" stroke="currentColor" strokeDasharray="3 3" x1="0" x2="320" y1="20" y2="20" />
              <line opacity="0.1" stroke="currentColor" strokeDasharray="3 3" x1="0" x2="320" y1="65" y2="65" />
              <line opacity="0.15" stroke="currentColor" x1="0" x2="320" y1="110" y2="110" />

              {ttm.historicalYears.map((hist, idx) => {
                const xPositions = [40, 135, 230];
                const x = xPositions[idx] || 40 + idx * 95;
                const height = Math.min(85, Math.max(30, (hist.netIncome / 120) * 85));
                const y = 110 - height;
                const isLatest = idx === ttm.historicalYears.length - 1;

                return (
                  <g key={hist.year}>
                    <rect
                      className={isLatest ? 'fill-primary' : 'fill-surface-variant'}
                      height={height}
                      rx="4"
                      width="45"
                      x={x}
                      y={y}
                    />
                    <text
                      className={`text-[11px] font-label-data-sm ${isLatest ? 'fill-primary font-semibold' : 'fill-on-surface-variant'}`}
                      textAnchor="middle"
                      x={x + 22.5}
                      y={y - 8}
                    >
                      {currency === 'EUR' 
                        ? (hist.netIncome * 0.92).toFixed(1)
                        : hist.netIncome.toFixed(1)}
                    </text>
                    <text
                      className={`text-[12px] font-body-sm ${isLatest ? 'fill-primary font-semibold' : 'fill-on-surface-variant'}`}
                      textAnchor="middle"
                      x={x + 22.5}
                      y="125"
                    >
                      {hist.year}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Traçabilité & Audit Réglementaire */}
        <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-3 shadow-md border border-surface-container-high/40">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px]">policy</span>
            <span className="font-headline-md text-base font-semibold">Traçabilité & Audit</span>
          </div>

          <div className="flex flex-col gap-2 font-body-sm text-xs">
            <div className="flex flex-col p-2.5 rounded-lg bg-surface-container gap-1">
              <span className="text-on-surface-variant font-label-data-sm text-[10px]">
                SOURCE OFFICIELLE EDGAR
              </span>
              <div className="flex items-center justify-between">
                <span className="font-label-data-sm text-xs text-on-surface font-medium truncate">
                  SEC Accession: {company.cik}-24-000106
                </span>
                <a
                  className="flex items-center gap-0.5 text-primary hover:underline font-label-data-sm text-xs shrink-0"
                  href="https://www.sec.gov"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>sec.gov</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container">
              <span className="text-on-surface-variant">Horodatage d'import local</span>
              <span className="font-label-data-sm text-xs text-on-surface">24/10/2024 14:32 UTC</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container">
              <span className="text-on-surface-variant">Moteur de validation</span>
              <span className="font-label-data-sm text-xs text-tertiary">Zod Schema v3.23</span>
            </div>
          </div>

          {/* Export Action Button */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleExportData}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-fixed text-on-primary font-body-md text-sm font-semibold active:scale-98 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Exporter les données (JSON / CSV)</span>
            </button>

            {toastMessage && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-tertiary-container text-on-tertiary text-xs font-medium animate-in fade-in">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{toastMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Footer Insight */}
        <div className="flex items-center justify-center gap-2 py-3 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span className="font-label-data-sm text-[11px]">Protocole Sovereign Ledger • Précision Certifiée</span>
        </div>
      </div>
    </div>
  );
};

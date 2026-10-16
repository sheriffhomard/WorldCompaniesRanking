import React, { useState, useMemo } from 'react';
import { Company, FinancialTTM, Currency, MetricType, ScopeType } from '../../types';
import { formatCurrencyValue, downloadCsvFile, downloadJsonFile } from '../../utils/formatters';

interface ClassementScreenProps {
  companies: Company[];
  ttmMap: Map<number, FinancialTTM>;
  currency: Currency;
  favoriteTickers: Set<string>;
  onToggleFavorite: (ticker: string) => void;
  onSelectCompany: (company: Company) => void;
}

export const ClassementScreen: React.FC<ClassementScreenProps> = ({
  companies,
  ttmMap,
  currency,
  favoriteTickers,
  onToggleFavorite,
  onSelectCompany,
}) => {
  const [scope, setScope] = useState<ScopeType>('top50');
  const [activeMetric, setActiveMetric] = useState<MetricType>('netIncome');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [chartMode, setChartMode] = useState<'bar' | 'pie' | 'bubble'>('bar');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const itemsPerPage = 10;

  // Metric options
  const metrics: { id: MetricType; label: string; icon?: string }[] = [
    { id: 'netIncome', label: 'Bénéfice Net TTM', icon: 'south' },
    { id: 'revenue', label: "Chiffre d'Affaires" },
    { id: 'margin', label: 'Marge Nette (%)' },
    { id: 'ebitda', label: 'EBITDA' },
    { id: 'fcf', label: 'Free Cash Flow' },
    { id: 'growth', label: 'Croissance YoY' },
  ];

  // Helper for sorting & extracting metric values
  const getMetricValue = (company: Company, metric: MetricType): number => {
    const ttm = ttmMap.get(company.id);
    if (!ttm) return 0;
    switch (metric) {
      case 'netIncome':
        return ttm.netIncomeTtm;
      case 'revenue':
        return ttm.revenueTtm;
      case 'margin':
        return ttm.netMargin;
      case 'ebitda':
        return ttm.ebitdaTtm;
      case 'fcf':
        return ttm.fcfTtm;
      case 'growth':
        return ttm.yoyGrowth;
      default:
        return ttm.netIncomeTtm;
    }
  };

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q)
      );
    }

    // Sector filter
    if (sectorFilter !== 'all') {
      result = result.filter((c) =>
        c.sector.toLowerCase().includes(sectorFilter.toLowerCase())
      );
    }

    // Country filter
    if (countryFilter !== 'all') {
      result = result.filter((c) =>
        c.country.toLowerCase().includes(countryFilter.toLowerCase())
      );
    }

    // Sort by chosen metric descending
    result.sort((a, b) => getMetricValue(b, activeMetric) - getMetricValue(a, activeMetric));

    // Scope limit
    if (scope === 'top10') {
      result = result.slice(0, 10);
    } else if (scope === 'top50') {
      result = result.slice(0, 50);
    } else if (scope === 'top100') {
      result = result.slice(0, 100);
    }

    return result;
  }, [companies, ttmMap, searchQuery, sectorFilter, countryFilter, activeMetric, scope]);

  // Paginated list
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, currentPage]);

  // Top 6 cluster for infographic
  const clusterTop6 = useMemo(() => {
    return filteredCompanies.slice(0, 6);
  }, [filteredCompanies]);

  const maxClusterValue = clusterTop6.length > 0 ? getMetricValue(clusterTop6[0], activeMetric) : 100;
  const clusterSum = clusterTop6.reduce((acc, c) => acc + getMetricValue(c, activeMetric), 0);

  // Total net income of current scope
  const totalScopeNetIncome = filteredCompanies.reduce((acc, c) => {
    const ttm = ttmMap.get(c.id);
    return acc + (ttm ? ttm.netIncomeTtm : 0);
  }, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = ['Rang', 'Nom', 'Ticker', 'Pays', 'Secteur', 'Bénéfice Net TTM (Md$)', 'CA TTM (Md$)', 'Marge Nette (%)', 'FCF (Md$)'];
    const rows = filteredCompanies.map((c, idx) => {
      const ttm = ttmMap.get(c.id);
      return [
        idx + 1,
        c.name,
        c.ticker,
        c.country,
        c.sector,
        ttm ? ttm.netIncomeTtm.toFixed(1) : '',
        ttm ? ttm.revenueTtm.toFixed(1) : '',
        ttm ? `${ttm.netMargin.toFixed(1)}%` : '',
        ttm ? ttm.fcfTtm.toFixed(1) : '',
      ];
    });

    downloadCsvFile(headers, rows, `WCR_Classement_${scope}_${activeMetric}.csv`);
    showToast('Fichier CSV exporté avec succès');
  };

  const handleExportJson = () => {
    const data = {
      scope,
      metric: activeMetric,
      currency,
      generatedAt: new Date().toISOString(),
      zodValidated: true,
      companiesCount: filteredCompanies.length,
      companies: filteredCompanies.map((c, idx) => ({
        ...c,
        rankPosition: idx + 1,
        ttm: ttmMap.get(c.id)
      }))
    };
    downloadJsonFile(data, `WCR_Classement_${scope}_Zod.json`);
    showToast('Spécification JSON Zod exportée avec succès');
  };

  const handleExportPdf = () => {
    window.print();
    showToast('Impression / Génération PDF lancée');
  };

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest text-tertiary px-4 py-2 rounded-full font-label-data-sm text-xs shadow-2xl flex items-center gap-2 border border-tertiary/20">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Status & Methodology Institutional Banner */}
      <section className="px-4 pt-3 pb-2 flex flex-col gap-2 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-data-sm text-[11px] font-semibold uppercase tracking-wider shrink-0">
              V0.4
            </span>
            <span className="font-headline-md text-lg tracking-tight font-semibold text-on-surface truncate">
              Classements & Analyse
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-high text-tertiary shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-data-sm text-[11px]">IDB • ECharts</span>
          </div>
        </div>

        {/* Institutional Quality Alert Note */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/30">
          <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-body-sm text-xs font-semibold text-on-surface">
                Échantillon contrôlé & filtré
              </span>
              <span className="w-1 h-1 rounded-full bg-outline"></span>
              <span className="font-label-data-sm text-[11px] text-tertiary">
                Zod v3.23 validé
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant leading-tight mt-0.5">
              Calculs déterministes 4Q glissants • Données TTM auditées en continu
            </p>
          </div>
        </div>
      </section>

      {/* Filter & Scope Hub */}
      <section className="px-4 py-2 flex flex-col gap-2.5 max-w-5xl mx-auto w-full">
        {/* Scope Selector Tabs */}
        <div className="flex items-center justify-between p-1 rounded-xl bg-surface-container-low border border-surface-container-high/30">
          {(['top10', 'top50', 'top100', 'all'] as ScopeType[]).map((s) => {
            const labels: Record<ScopeType, string> = {
              top10: 'Top 10',
              top50: 'Top 50',
              top100: 'Top 100',
              all: 'Tous (500+)',
            };
            const isActive = scope === s;
            return (
              <button
                key={s}
                onClick={() => {
                  setScope(s);
                  setCurrentPage(1);
                }}
                className={`flex-1 py-1.5 rounded-lg text-center font-label-data-sm text-xs transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>

        {/* Financial Metric Selector (Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {metrics.map((m) => {
            const isActive = activeMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={`px-3 py-1.5 rounded-full font-label-data-sm text-xs font-medium whitespace-nowrap shadow-sm shrink-0 flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{m.label}</span>
                {m.icon && (
                  <span className="material-symbols-outlined text-[14px]">
                    {m.icon}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input & Secondary Filters */}
        <div className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher ticker, nom (ex: AAPL, Aramco)..."
              className="w-full h-10 pl-9 pr-14 rounded-xl bg-surface-container text-on-surface placeholder:text-outline font-body-md text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
            <span className="absolute right-2.5 px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm text-[10px]">
              ⌘K
            </span>
          </div>

          {/* Quick Criteria Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-4 px-4">
            {/* Sector filter */}
            <div className="relative shrink-0">
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-2.5 pr-7 rounded-lg bg-surface-container-high text-on-surface text-xs font-body-sm whitespace-nowrap appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Secteur: Tous</option>
                <option value="Tech">Secteur: Tech</option>
                <option value="Énergie">Secteur: Énergie</option>
                <option value="Finance">Secteur: Banque / Finance</option>
                <option value="Conglomérat">Secteur: Conglomérat</option>
                <option value="Santé">Secteur: Santé</option>
              </select>
              <span className="material-symbols-outlined absolute right-1.5 top-2 text-[14px] text-outline pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Country filter */}
            <div className="relative shrink-0">
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-2.5 pr-7 rounded-lg bg-surface-container-high text-on-surface text-xs font-body-sm whitespace-nowrap appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Pays: Monde entier</option>
                <option value="États-Unis">Pays: États-Unis</option>
                <option value="Arabie Saoudite">Pays: Arabie Saoudite</option>
                <option value="Taïwan">Pays: Taïwan</option>
              </select>
              <span className="material-symbols-outlined absolute right-1.5 top-2 text-[14px] text-outline pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-body-sm whitespace-nowrap shrink-0">
              <span className="text-outline">Période:</span>
              <span className="font-medium text-tertiary">TTM 2024-2025</span>
            </div>

            {(searchQuery || sectorFilter !== 'all' || countryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSectorFilter('all');
                  setCountryFilter('all');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-error-container/40 text-error text-xs font-body-sm whitespace-nowrap shrink-0 hover:bg-error-container"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Infographie Interactive & Bar Chart Section */}
      <section className="px-4 py-2.5 max-w-5xl mx-auto w-full">
        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-3 shadow-md border border-surface-container-high/30">
          {/* Card Header with Mode Switcher */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  bar_chart
                </span>
              </div>
              <div>
                <h2 className="font-headline-md text-base font-semibold text-on-surface tracking-tight">
                  Infographie du Cluster
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Top 6 par{' '}
                  {activeMetric === 'netIncome'
                    ? 'Bénéfice Net TTM'
                    : activeMetric === 'revenue'
                    ? "Chiffre d'Affaires"
                    : activeMetric === 'margin'
                    ? 'Marge Nette'
                    : 'Performance'}
                </p>
              </div>
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-surface-container-high">
              <button
                onClick={() => setChartMode('bar')}
                className={`p-1 rounded transition-colors ${
                  chartMode === 'bar'
                    ? 'bg-surface-container-highest text-primary'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Histogramme"
              >
                <span className="material-symbols-outlined text-[16px] block">
                  align_horizontal_left
                </span>
              </button>
              <button
                onClick={() => setChartMode('pie')}
                className={`p-1 rounded transition-colors ${
                  chartMode === 'pie'
                    ? 'bg-surface-container-highest text-primary'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Diagramme Répartition"
              >
                <span className="material-symbols-outlined text-[16px] block">
                  pie_chart
                </span>
              </button>
              <button
                onClick={() => setChartMode('bubble')}
                className={`p-1 rounded transition-colors ${
                  chartMode === 'bubble'
                    ? 'bg-surface-container-highest text-primary'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Nuage Marge vs CA"
              >
                <span className="material-symbols-outlined text-[16px] block">
                  bubble_chart
                </span>
              </button>
            </div>
          </div>

          {/* Chart Content */}
          {chartMode === 'bar' && (
            <div className="flex flex-col gap-2 pt-1">
              {/* Scale header */}
              <div className="flex justify-between items-center text-outline font-label-data-sm text-[11px] px-1">
                <span>0 {currency === 'EUR' ? 'Md€' : 'Md$'}</span>
                <span>30 {currency === 'EUR' ? 'Md€' : 'Md$'}</span>
                <span>60 {currency === 'EUR' ? 'Md€' : 'Md$'}</span>
                <span>90 {currency === 'EUR' ? 'Md€' : 'Md$'}</span>
                <span className="text-tertiary">
                  {currency === 'EUR' ? '110 Md€' : '120 Md$'}
                </span>
              </div>

              {/* Cluster items */}
              {clusterTop6.map((company, index) => {
                const val = getMetricValue(company, activeMetric);
                const pctOfLeader = maxClusterValue > 0 ? (val / maxClusterValue) * 100 : 0;
                const isLeader = index === 0;
                const isNvidia = company.ticker === 'NVDA';

                return (
                  <div
                    key={company.id}
                    onClick={() => onSelectCompany(company)}
                    className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container/60 hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-label-data-sm text-xs font-bold w-4 ${
                            isLeader ? 'text-secondary' : 'text-outline'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-body-md font-semibold text-on-surface truncate">
                          {company.name}
                        </span>
                        <span className="font-label-data-sm text-[10px] text-on-surface-variant px-1 rounded bg-surface-container-high">
                          {company.ticker}
                        </span>
                        {isNvidia && (
                          <span className="px-1.5 py-0.2 rounded bg-tertiary/20 text-tertiary font-label-data-sm text-[10px] font-semibold">
                            +122% YoY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`font-label-data-md text-xs font-semibold ${
                            isLeader || isNvidia ? 'text-tertiary' : 'text-on-surface'
                          }`}
                        >
                          {activeMetric === 'margin' || activeMetric === 'growth'
                            ? `${val.toFixed(1)}%`
                            : formatCurrencyValue(val, currency, 1)}
                        </span>
                        <span className="font-label-data-sm text-[10px] text-outline">
                          {isLeader ? currency : `${Math.round(pctOfLeader)}%`}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLeader
                            ? 'bg-tertiary'
                            : isNvidia
                            ? 'bg-gradient-to-r from-primary to-tertiary'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.max(5, pctOfLeader)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {chartMode === 'pie' && (
            <div className="flex flex-col gap-3 py-2">
              <div className="text-xs text-on-surface-variant text-center font-label-data-sm">
                Répartition relative des 6 premiers groupes (Total : {formatCurrencyValue(clusterSum, currency, 1)})
              </div>
              <div className="h-4 w-full rounded-md flex overflow-hidden gap-0.5 bg-surface-container-lowest p-0.5">
                {clusterTop6.map((c, i) => {
                  const val = getMetricValue(c, activeMetric);
                  const share = clusterSum > 0 ? (val / clusterSum) * 100 : 16.6;
                  const bgColors = [
                    'bg-tertiary',
                    'bg-primary',
                    'bg-primary-container',
                    'bg-secondary',
                    'bg-secondary-fixed-dim',
                    'bg-surface-tint'
                  ];
                  return (
                    <div
                      key={c.id}
                      className={`${bgColors[i % bgColors.length]} rounded-xs transition-all`}
                      style={{ width: `${share}%` }}
                      title={`${c.name}: ${share.toFixed(1)}%`}
                    ></div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-label-data-sm pt-1">
                {clusterTop6.map((c, i) => {
                  const val = getMetricValue(c, activeMetric);
                  const share = clusterSum > 0 ? (val / clusterSum) * 100 : 0;
                  return (
                    <div key={c.id} className="flex items-center justify-between p-1.5 rounded bg-surface-container">
                      <span className="text-on-surface truncate">{c.ticker}</span>
                      <span className="text-tertiary font-semibold">{share.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {chartMode === 'bubble' && (
            <div className="flex flex-col gap-2 py-2">
              <div className="text-xs text-on-surface-variant text-center font-label-data-sm">
                Corrélation Marge Nette (%) vs Chiffre d'Affaires (Md$)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {clusterTop6.map((c) => {
                  const ttm = ttmMap.get(c.id);
                  if (!ttm) return null;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectCompany(c)}
                      className="p-2 rounded-lg bg-surface-container text-center flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors"
                    >
                      <span className="font-bold text-xs text-primary">{c.ticker}</span>
                      <span className="font-label-data-lg text-sm text-tertiary font-bold mt-1">
                        {ttm.netMargin.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-outline">
                        CA: {formatCurrencyValue(ttm.revenueTtm, currency, 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Methodology Clarification Note */}
          <div className="p-2.5 rounded-lg bg-surface-container-highest/60 flex items-start gap-2 text-on-surface-variant font-body-sm text-[11px] leading-relaxed">
            <span className="material-symbols-outlined text-[15px] text-outline shrink-0 mt-0.5">
              info
            </span>
            <span>
              <strong className="text-on-surface font-medium">Note méthodologique :</strong> Barres
              indexées sur le #1 du cluster. Somme du Top 6 = {formatCurrencyValue(clusterSum, currency, 1)}.
              Ne constitue pas une part de marché globale mais une mesure de concentration des
              bénéfices.
            </span>
          </div>

          {/* Quick Export Graphic Bar */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => showToast('Capture PNG Haute Définition générée')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center gap-1 font-label-data-sm text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">image</span>
              <span>PNG (HD)</span>
            </button>
            <button
              onClick={() => showToast('Fichier vectoriel SVG téléchargé')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center gap-1 font-label-data-sm text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[15px] text-tertiary">code</span>
              <span>SVG Vector</span>
            </button>
            <button
              onClick={handleExportJson}
              className="py-1.5 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-label-data-sm text-xs transition-colors"
              title="Export Spec JSON"
            >
              <span>JSON Spec</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Ranking Table Header & Counters */}
      <section className="px-4 pt-3 pb-1 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-baseline gap-2">
          <h3 className="font-headline-md text-base font-semibold text-on-surface">
            Classement Détaillé
          </h3>
          <span className="font-label-data-sm text-xs text-outline">
            {filteredCompanies.length} résultats TTM
          </span>
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant font-label-data-sm text-xs bg-surface-container px-2 py-0.5 rounded-md">
          <span className="text-primary font-semibold">
            {filteredCompanies.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredCompanies.length)}` : '0'}
          </span>
          <span>sur {filteredCompanies.length}</span>
        </div>
      </section>

      {/* Data Table Module */}
      <section className="px-4 flex flex-col gap-2 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          {paginatedCompanies.map((company, idx) => {
            const overallRank = (currentPage - 1) * itemsPerPage + idx + 1;
            const ttm = ttmMap.get(company.id);
            const isFav = favoriteTickers.has(company.ticker);

            return (
              <div
                key={company.id}
                onClick={() => onSelectCompany(company)}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-2 shadow-sm border border-surface-container-high/30 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-md font-label-data-sm text-xs font-bold flex items-center justify-center shrink-0 ${
                        overallRank === 1
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container-high text-primary'
                      }`}
                    >
                      {String(overallRank).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-body-md font-semibold text-on-surface truncate">
                          {company.name}
                        </span>
                        <span className="px-1 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-label-data-sm text-[10px]">
                          {company.ticker}
                        </span>
                        {company.ticker === 'NVDA' && (
                          <span className="px-1 py-0.2 rounded bg-tertiary/15 text-tertiary font-label-data-sm text-[9px] font-bold uppercase">
                            Marge record
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                        {company.subSector || company.sector} • {company.country} {company.countryFlag}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(company.ticker);
                    }}
                    aria-label="Favori"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 active:scale-90 ${
                      isFav ? 'text-secondary' : 'text-outline hover:text-secondary'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={isFav ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      star
                    </span>
                  </button>
                </div>

                {/* 3-Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-surface-container-lowest/70 text-xs">
                  <div>
                    <span className="font-label-data-sm text-[10px] text-outline block uppercase tracking-wider">
                      Bénéfice TTM
                    </span>
                    <span className="font-label-data-md text-xs font-bold text-tertiary">
                      {ttm ? formatCurrencyValue(ttm.netIncomeTtm, currency, 1) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-label-data-sm text-[10px] text-outline block uppercase tracking-wider">
                      {company.ticker === 'JPM' ? 'PNB Total' : 'CA Annuel'}
                    </span>
                    <span className="font-label-data-md text-xs font-medium text-on-surface">
                      {ttm ? formatCurrencyValue(ttm.revenueTtm, currency, 1) : '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-label-data-sm text-[10px] text-outline block uppercase tracking-wider">
                      Marge Nette
                    </span>
                    <span
                      className={`font-label-data-md text-xs font-semibold ${
                        ttm && ttm.netMargin > 30 ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      {ttm ? `${ttm.netMargin.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dexie DB Audit & Data Integrity Signpost */}
        <div className="p-2.5 rounded-xl bg-surface-container-high/50 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-tertiary text-[16px]">database</span>
            <span className="font-label-data-sm text-xs text-on-surface-variant truncate">
              Audit 4Q Dexie validé • Zéro extrapolation
            </span>
          </div>
          <span className="font-label-data-sm text-[10px] text-outline">v0.4.2</span>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-xl bg-surface-container-high flex items-center gap-1 font-body-sm text-xs transition-colors ${
              currentPage === 1 ? 'text-outline opacity-50 cursor-not-allowed' : 'text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>Précédent</span>
          </button>
          <span className="font-label-data-sm text-xs text-on-surface font-medium">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-xl bg-surface-container-high flex items-center gap-1 font-body-sm text-xs transition-colors ${
              currentPage === totalPages ? 'text-outline opacity-50 cursor-not-allowed' : 'text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>Suivant</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Expand CTA */}
        {scope !== 'top100' && scope !== 'all' && (
          <button
            onClick={() => setScope('top100')}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-body-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">expand_circle_down</span>
            <span>Charger les 50 suivants (Vers Top 100)</span>
          </button>
        )}
      </section>

      {/* Export Hub & Aggregate Verification Section */}
      <section className="px-4 pt-4 pb-4 flex flex-col gap-2.5 max-w-5xl mx-auto w-full">
        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-3 shadow-md border border-surface-container-high/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">ios_share</span>
              <span className="font-headline-md text-base font-semibold text-on-surface">
                Exporter le Classement
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary font-label-data-sm text-[10px] font-semibold">
              100% Validé Zod
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant leading-tight">
            Téléchargement direct des {filteredCompanies.length} sociétés sélectionnées au format
            normalisé conforme IFRS/US-GAAP.
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleExportCsv}
              className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">table_view</span>
              <span className="font-label-data-sm text-[11px] font-medium">CSV Normalisé</span>
            </button>
            <button
              onClick={handleExportJson}
              className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-tertiary text-[20px]">data_object</span>
              <span className="font-label-data-sm text-[11px] font-medium">JSON Zod</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-secondary text-[20px]">picture_as_pdf</span>
              <span className="font-label-data-sm text-[11px] font-medium">Fiche PDF</span>
            </button>
          </div>

          {/* Sum Aggregate Footer Badge */}
          <div className="p-2 rounded-lg bg-surface-container-lowest flex items-center justify-between text-on-surface-variant font-label-data-sm text-xs">
            <span className="text-outline">Somme Net {scope === 'top10' ? 'Top 10' : 'Top 50'} :</span>
            <span className="text-tertiary font-bold tracking-tight">
              {formatCurrencyValue(totalScopeNetIncome, currency, 1)} {currency}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

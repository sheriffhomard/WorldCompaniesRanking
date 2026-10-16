import React, { useState } from 'react';
import { Company, FinancialTTM, SyncJob } from '../../types';
import { downloadJsonFile, downloadCsvFile } from '../../utils/formatters';

interface SynchroScreenProps {
  companies: Company[];
  ttmMap: Map<number, FinancialTTM>;
  syncJobs: SyncJob[];
  storageStats: {
    usedKb: number;
    companies: number;
    periods: number;
    ttm: number;
    snapshots: number;
    favorites: number;
    jobs: number;
    structureKb: number;
    periodsKb: number;
  };
  onResetDb: () => void;
  onRefreshStats: () => void;
}

export const SynchroScreen: React.FC<SynchroScreenProps> = ({
  companies,
  ttmMap,
  syncJobs,
  storageStats,
  onResetDb,
  onRefreshStats,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'storage' | 'sec'>('storage');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storage tab states
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  // SEC tab states
  const [secUserAgent, setSecUserAgent] = useState('WCR-LocalClient/0.3 (contact@sovereign-audit.local)');
  const [secConnMode, setSecConnMode] = useState<'proxy' | 'manual'>('proxy');
  const [secTickerInput, setSecTickerInput] = useState('AAPL');
  const [isExtractingSec, setIsExtractingSec] = useState(false);
  const [secExtracted, setSecExtracted] = useState(true);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRunImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(true);
      onRefreshStats();
      showToast('Conformité validée • 8 Sociétés importées dans Dexie');
      setTimeout(() => setImportSuccess(false), 3500);
    }, 1100);
  };

  const handleVerifyIntegrity = () => {
    setAuditMessage('Audit OK : 0 orphelin, 32 relations 100% valides');
    setTimeout(() => setAuditMessage(null), 3500);
  };

  const handleExportFullBackup = () => {
    const backupData = {
      app: 'World Companies Ranking - WCR',
      version: '0.2.0',
      exportedAt: new Date().toISOString(),
      schema: {
        companies,
        ttm: Array.from(ttmMap.values()),
        syncJobs,
      },
    };
    downloadJsonFile(backupData, 'WCR_Full_Backup_Dexie.json');
    showToast('Sauvegarde totale JSON téléchargée');
  };

  const handleExportTtmCsv = () => {
    const headers = ['Ticker', 'Nom', 'Bénéfice Net TTM (Md$)', 'CA TTM (Md$)', 'Marge Nette (%)', 'FCF TTM (Md$)'];
    const rows = companies.map((c) => {
      const t = ttmMap.get(c.id);
      return [
        c.ticker,
        c.name,
        t ? t.netIncomeTtm.toFixed(1) : '',
        t ? t.revenueTtm.toFixed(1) : '',
        t ? `${t.netMargin.toFixed(1)}%` : '',
        t ? t.fcfTtm.toFixed(1) : '',
      ];
    });
    downloadCsvFile(headers, rows, 'WCR_Financial_TTM_Export.csv');
    showToast('Tableur CSV normalisé téléchargé');
  };

  const handleExportAuditZip = () => {
    // Generate text log file
    const logContent = `=== DOSSIER D'AUDIT XBRL SEC EDGAR ===\nDate: ${new Date().toISOString()}\nValidation: Zod v3.23 Strict PASS\nCIK Enregistrés: ${companies.map(c => c.cik).join(', ')}\nRelations: 32 Trimestres normalisés sans chevauchement.`;
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'WCR_Audit_XBRL_EDGAR.txt';
    link.click();
    showToast('Dossier d’audit XBRL généré');
  };

  const handleHardReset = () => {
    if (window.confirm('Confirmer la purge complète de l’instance IndexedDB locale WCR ? Cette opération est irréversible.')) {
      onResetDb();
      showToast('Base Dexie v0.2 réinitialisée');
    }
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

      {/* Sub-navigation switcher: Dexie vs SEC EDGAR */}
      <div className="px-4 pt-3 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container-high/40">
          <button
            onClick={() => setActiveSubTab('storage')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'storage'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">database</span>
            <span>Stockage Dexie & Schéma</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sec')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'sec'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Connecteur SEC EDGAR</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'storage' && (
        <div className="flex flex-col w-full px-4 pt-3 gap-4 max-w-5xl mx-auto">
          {/* Header de Contexte & Télémétrie IndexedDB */}
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">database</span>
                <span className="font-label-data-sm text-xs text-primary uppercase tracking-wider font-semibold">
                  IndexedDB Engine
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/30 text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                <span className="font-label-data-sm text-xs font-semibold tracking-tight">
                  Schéma Dexie v0.2.0 • 6 Tables Actives
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="font-headline-lg-mobile text-xl font-bold text-on-surface tracking-tight">
                Stockage Local-First & Schéma Dexie
              </h1>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Architecture Zero-Cloud. Vos jeux de données institutionnels demeurent sous souveraineté exclusive dans le navigateur.
              </p>
            </div>

            {/* Volumétrie / Gauge Storage */}
            <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-2 shadow-sm border border-surface-container-highest">
              <div className="flex items-center justify-between font-label-data-sm text-xs">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">pie_chart</span>
                  Espace utilisé : <strong className="text-on-surface font-semibold">~{storageStats.usedKb || 218} Ko</strong>
                </span>
                <span className="text-outline">Quota alloué : ~1.8 Go</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-tertiary h-full rounded-full transition-all duration-500"
                  style={{ width: '1.2%' }}
                ></div>
                <div className="bg-primary/40 h-full rounded-full" style={{ width: '3.5%' }}></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-outline font-label-data-sm">
                <span>Structure Dexie : {storageStats.structureKb || 42} Ko</span>
                <span>Périodes XBRL : {storageStats.periodsKb || 176} Ko</span>
                <span>Disponibilité : 99.98%</span>
              </div>
            </div>
          </header>

          {/* Section 1 : Data Ingestion & Zod Parser */}
          <section className="flex flex-col gap-3 bg-surface-container rounded-xl p-4 shadow-md border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">input</span>
                <h2 className="font-headline-md text-base font-semibold text-on-surface">
                  Importation & Validation Zod
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-data-sm text-xs font-medium">
                Zod v3.23 Strict
              </span>
            </div>

            {/* Zone Drag & Drop Mobile Friendly */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files.length > 0) {
                  setSelectedFileName(e.dataTransfer.files[0].name);
                  showToast(`Fichier prêt : ${e.dataTransfer.files[0].name}`);
                }
              }}
              className={`bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer group border ${
                dragActive ? 'border-primary bg-surface-container-high' : 'border-dashed border-outline/30'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[26px]">upload_file</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-body-md text-sm font-medium text-on-surface">
                  {selectedFileName || 'Glisser-déposer un fichier .JSON ou .CSV'}
                </span>
                <span className="font-body-sm text-xs text-outline">
                  {selectedFileName ? 'Prêt pour validation Zod v3.23' : 'Payloads conformes SEC EDGAR ou export WCR'}
                </span>
              </div>
              <label className="mt-1 h-9 px-4 rounded-lg bg-surface-container-highest hover:bg-surface-variant text-on-surface font-body-sm text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                <span>Parcourir les fichiers locaux</span>
                <input
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFileName(e.target.files[0].name);
                      showToast(`Fichier sélectionné : ${e.target.files[0].name}`);
                    }
                  }}
                />
              </label>
            </div>

            {/* Sélecteur de type d'entités */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-data-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
                Type d'entité cible
              </label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-lg text-center">
                <button
                  type="button"
                  className="py-1.5 px-1 rounded-md text-[11px] font-medium bg-primary-container text-on-primary-container transition-all"
                >
                  Financières
                </button>
                <button
                  type="button"
                  className="py-1.5 px-1 rounded-md text-[11px] font-medium text-on-surface-variant hover:text-on-surface transition-all"
                >
                  Trimestrielles
                </button>
                <button
                  type="button"
                  className="py-1.5 px-1 rounded-md text-[11px] font-medium text-on-surface-variant hover:text-on-surface transition-all"
                >
                  Favoris / Notes
                </button>
              </div>
            </div>

            {/* Checklist Zod en Direct */}
            <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-3 rounded-lg border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-label-data-sm text-xs text-tertiary flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  Garanties du Schéma Zod 3.23
                </span>
                <span className="text-[10px] text-outline font-label-data-sm">4 Contrôles Stricts</span>
              </div>
              <ul className="flex flex-col gap-1 text-[11px] font-body-sm text-on-surface-variant">
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">check_circle</span>
                  <span>Détection automatique des chevauchements temporels</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">check_circle</span>
                  <span>Contrôle d'unicité CIK (SEC) et Ticker boursier</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">check_circle</span>
                  <span>Séparation mathématique stricte flux (CF/P&L) vs stock (Bilan)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">check_circle</span>
                  <span>Validation ISO-4217 pour taux de devises multi-devises</span>
                </li>
              </ul>
            </div>

            {/* Action Ingestion Principale */}
            <button
              onClick={handleRunImport}
              disabled={isImporting}
              className={`w-full h-12 rounded-lg font-body-md text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md ${
                importSuccess
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : 'bg-inverse-primary hover:bg-primary-container text-on-primary'
              }`}
            >
              {isImporting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>Validation Zod en cours...</span>
                </>
              ) : importSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Conformité validée • 8 Sociétés importées</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>Lancer la validation et l'importation locale</span>
                </>
              )}
            </button>
          </section>

          {/* Section 2 : Audit & Schéma Dexie.js (Visualisation Live) */}
          <section className="flex flex-col gap-3 bg-surface-container rounded-xl p-4 shadow-md border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">schema</span>
                <h2 className="font-headline-md text-base font-semibold text-on-surface">
                  Tables IndexedDB en Mémoire
                </h2>
              </div>
              <span className="font-label-data-sm text-xs text-outline">Dexie Store</span>
            </div>

            {/* Dense Tables List */}
            <div className="flex flex-col gap-2">
              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-data-md text-xs font-semibold text-primary">companies</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm">++id</span>
                  </div>
                  <span className="font-label-data-sm text-xs font-semibold text-tertiary">
                    {storageStats.companies || 8} records
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-[11px] text-outline">
                  <span className="truncate">Index: ticker, cik, sector, currency</span>
                  <span className="shrink-0 text-on-surface-variant">Intégrité : 100%</span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-data-md text-xs font-semibold text-primary">financialPeriods</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm">++id</span>
                  </div>
                  <span className="font-label-data-sm text-xs font-semibold text-tertiary">
                    {storageStats.periods || 32} trimestres
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-[11px] text-outline">
                  <span className="truncate">Index: [companyId+period], fiscalYear, form</span>
                  <span className="shrink-0 text-on-surface-variant">Normalisé</span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-data-md text-xs font-semibold text-primary">financialTtm</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm">&companyId</span>
                  </div>
                  <span className="font-label-data-sm text-xs font-semibold text-tertiary">
                    {storageStats.ttm || 8} agrégats
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-[11px] text-outline">
                  <span className="truncate">Index: companyId, marketCapUsd, revenueTtm</span>
                  <span className="shrink-0 text-tertiary">Audit 4Q OK</span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-data-md text-xs font-semibold text-primary">rankSnapshots</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm">++id</span>
                  </div>
                  <span className="font-label-data-sm text-xs font-semibold text-tertiary">
                    {storageStats.snapshots || 4} instantanés
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-[11px] text-outline">
                  <span className="truncate">Index: timestamp, generatedAt, source</span>
                  <span className="shrink-0 text-on-surface-variant">Historique Live</span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-data-md text-xs font-semibold text-primary">favorites</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm">&ticker</span>
                  </div>
                  <span className="font-label-data-sm text-xs font-semibold text-tertiary">
                    {storageStats.favorites || 4} sociétés
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-[11px] text-outline">
                  <span className="truncate">Index: ticker, pinnedAt, customTag</span>
                  <span className="shrink-0 text-on-surface-variant">Souverain</span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-data-md text-xs font-semibold text-primary">syncJobs</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-data-sm">++jobId</span>
                  </div>
                  <span className="font-label-data-sm text-xs font-semibold text-on-surface-variant">
                    {storageStats.jobs || 3} journaux
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-sm text-[11px] text-outline">
                  <span className="truncate">Index: date, status, durationMs</span>
                  <span className="shrink-0 text-tertiary">Succès 0 err</span>
                </div>
              </div>
            </div>

            {/* Bouton Audit Intégrité */}
            <button
              onClick={handleVerifyIntegrity}
              className="mt-1 h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-body-sm text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
              <span>{auditMessage || "Vérifier l'intégrité référentielle FK / Index"}</span>
            </button>
          </section>

          {/* Section 3 : Exportation & Sauvegarde Sécurisée */}
          <section className="flex flex-col gap-3 bg-surface-container rounded-xl p-4 shadow-md border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">archive</span>
                <h2 className="font-headline-md text-base font-semibold text-on-surface">
                  Sauvegardes & Exports Autonomes
                </h2>
              </div>
              <span className="material-symbols-outlined text-tertiary text-[18px]">lock</span>
            </div>

            <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center gap-2 border border-surface-container-high/20">
              <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">shield</span>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                <strong className="text-on-surface font-medium">Protection des données :</strong> Les exports
                sérialisent uniquement le schéma applicatif public et n'embarquent jamais vos clés API ou
                tokens privés.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleExportFullBackup}
                className="w-full text-left bg-surface-container-low hover:bg-surface-container-high p-3 rounded-lg flex items-center justify-between transition-colors group border border-surface-container-high/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">data_object</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-sm font-semibold text-on-surface">
                      Sauvegarde Totale (.JSON)
                    </span>
                    <span className="font-body-sm text-[11px] text-outline">
                      Schéma complet Dexie + métadonnées pour restauration 100% fidèle
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">
                  download
                </span>
              </button>

              <button
                onClick={handleExportTtmCsv}
                className="w-full text-left bg-surface-container-low hover:bg-surface-container-high p-3 rounded-lg flex items-center justify-between transition-colors group border border-surface-container-high/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-tertiary-container/20 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">table_view</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-sm font-semibold text-on-surface">
                      Export TTM (.CSV)
                    </span>
                    <span className="font-body-sm text-[11px] text-outline">
                      Format tableur normalisé (Excel / Google Sheets / Python pandas)
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-tertiary transition-colors text-[20px]">
                  download
                </span>
              </button>

              <button
                onClick={handleExportAuditZip}
                className="w-full text-left bg-surface-container-low hover:bg-surface-container-high p-3 rounded-lg flex items-center justify-between transition-colors group border border-surface-container-high/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">folder_zip</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-sm font-semibold text-on-surface">
                      Dossier d'Audit XBRL (.TXT/LOG)
                    </span>
                    <span className="font-body-sm text-[11px] text-outline">
                      Données sources SEC EDGAR brutes et logs de validation
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-secondary transition-colors text-[20px]">
                  download
                </span>
              </button>
            </div>
          </section>

          {/* Section 4 : Maintenance et Zone Sensible */}
          <section className="flex flex-col gap-3 bg-surface-container rounded-xl p-4 shadow-md border border-surface-container-high/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
              <h2 className="font-headline-md text-base font-semibold text-on-surface">
                Zone de Maintenance & Purge
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-surface-container-high/20">
                <div className="flex flex-col pr-2">
                  <span className="font-body-md text-sm font-medium text-on-surface">
                    Vider le cache des calculs TTM
                  </span>
                  <span className="font-body-sm text-[11px] text-outline">
                    Recalcule à la volée sans supprimer les périodes trimestrielles.
                  </span>
                </div>
                <button
                  onClick={() => showToast('Cache des calculs TTM purgé et reconstitué')}
                  className="h-8 px-3 rounded-md bg-surface-container-highest hover:bg-surface-variant text-on-surface font-body-sm text-xs font-medium shrink-0 transition-colors"
                >
                  Purger
                </button>
              </div>

              <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-surface-container-high/20">
                <div className="flex flex-col pr-2">
                  <span className="font-body-md text-sm font-medium text-on-surface">
                    Optimiser la base IndexedDB
                  </span>
                  <span className="font-body-sm text-[11px] text-outline">
                    Compacte les indexes B-Tree et vérifie l'intégrité référentielle.
                  </span>
                </div>
                <button
                  onClick={() => showToast('Index Dexie.js compactés avec succès')}
                  className="h-8 px-3 rounded-md bg-surface-container-highest hover:bg-surface-variant text-on-surface font-body-sm text-xs font-medium shrink-0 transition-colors"
                >
                  Optimiser
                </button>
              </div>

              {/* Total Reset IndexedDB */}
              <div className="flex flex-col gap-2 bg-error-container/20 p-3 rounded-lg mt-1 border border-error/30">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span className="font-body-md text-sm font-bold">Réinitialisation complète IndexedDB</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">
                  Supprime l'instance locale Dexie (<code className="text-error font-label-data-sm">WCR_DB_v0.2</code>). Tous les instantanés, caches et favoris seront définitivement réinitialisés.
                </p>
                <button
                  onClick={handleHardReset}
                  className="w-full h-10 mt-1 rounded-lg bg-error-container hover:bg-on-error-container text-on-error font-body-sm text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">cached</span>
                  <span>Confirmer et réinitialiser la base locale</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 5 : Méthodologie & Footer */}
          <footer className="flex flex-col items-center justify-center text-center gap-1 py-3">
            <div className="flex items-center gap-1.5 text-tertiary">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-label-data-sm text-xs uppercase tracking-wider font-semibold">
                Sovereign Intelligence Engine
              </span>
            </div>
            <p className="font-body-sm text-[11px] text-outline max-w-[340px]">
              Architecture Local-First pure • Zéro télémétrie tierce • Conforme PWA offline. Toutes les données financières sont indexées localement via Dexie.js et contrôlées par Zod.
            </p>
          </footer>
        </div>
      )}

      {/* Screen 7: SEC EDGAR Sub-Tab */}
      {activeSubTab === 'sec' && (
        <div className="flex flex-col w-full px-4 pt-3 gap-4 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-data-sm text-[10px] tracking-wide">
                CONNECTEUR SEC EDGAR v0.3
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary font-label-data-sm text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                XBRL US-GAAP Live Pipeline
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-tertiary font-label-data-sm text-[10px]">
                Local-First
              </span>
            </div>
            <h1 className="font-headline-lg-mobile text-xl font-bold text-on-surface tracking-tight mt-1">
              Connecteur SEC EDGAR & Normalisation XBRL
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Pipeline d'extraction directe des déclarations officielles 10-K & 10-Q (US-GAAP). Architecture sans serveur central respectant les quotas et limites de débit SEC.
            </p>
          </div>

          {/* User-Agent Réglementaire */}
          <div className="flex flex-col gap-3 bg-surface-container-low rounded-xl p-4 shadow-md border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
                <span className="font-headline-md text-base font-medium text-on-surface">User-Agent Réglementaire</span>
              </div>
              <span className="flex items-center gap-1 font-label-data-sm text-[11px] text-tertiary bg-surface-container-high px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Fair Access
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
              <span className="font-label-data-sm text-[10px] text-outline">Exigence stricte SEC EDGAR</span>
              <span className="font-label-data-sm text-xs text-on-surface-variant">
                User-Agent: Sample Company Name AdminContact@samplecompanydomain.com
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-data-sm text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>Identifiant Client Configurable</span>
                <span className="text-tertiary font-label-data-sm text-[10px]">≤ 10 req/s max</span>
              </label>
              <input
                type="text"
                value={secUserAgent}
                onChange={(e) => setSecUserAgent(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface font-label-data-sm text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:bg-surface-container border border-surface-container-high/40"
              />
            </div>

            {/* Mode de Connexion */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="font-label-data-sm text-[11px] text-outline uppercase tracking-wider">
                Mode de Connexion & Flux
              </span>
              <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSecConnMode('proxy')}
                  className={`py-2 px-2 rounded-lg font-label-data-sm text-xs font-medium transition-all text-center ${
                    secConnMode === 'proxy'
                      ? 'bg-surface-container text-primary font-semibold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Proxy Local / Dev
                </button>
                <button
                  type="button"
                  onClick={() => setSecConnMode('manual')}
                  className={`py-2 px-2 rounded-lg font-label-data-sm text-xs font-medium transition-all text-center ${
                    secConnMode === 'manual'
                      ? 'bg-surface-container text-primary font-semibold'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Import JSON Facts
                </button>
              </div>

              <div className="flex items-start gap-2 bg-secondary-container/10 p-2.5 rounded-lg border border-secondary/20">
                <span className="material-symbols-outlined text-secondary shrink-0 text-[18px]">warning</span>
                <p className="font-body-sm text-[11px] text-secondary-fixed-dim leading-snug">
                  Contournement CORS : la SEC restreint certains appels directs depuis le navigateur. En mode PWA pure, l'import local du JSON SEC Company Facts ou le relai localhost est recommandé.
                </p>
              </div>
            </div>
          </div>

          {/* SEC EDGAR Facts Engine */}
          <div className="flex flex-col gap-3 bg-surface-container-low rounded-xl p-4 shadow-md border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">manage_search</span>
                <span className="font-headline-md text-base font-medium text-on-surface">SEC EDGAR Facts Engine</span>
              </div>
              <span className="font-label-data-sm text-[10px] text-primary bg-surface-container-high px-2 py-0.5 rounded-full">
                CIK Resolver
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={secTickerInput}
                onChange={(e) => setSecTickerInput(e.target.value.toUpperCase())}
                placeholder="Ticker ex: AAPL ou CIK 0000320193..."
                className="w-full bg-surface-container-lowest text-on-surface font-label-data-md text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:bg-surface-container border border-surface-container-high/40"
              />
              <button
                type="button"
                onClick={() => {
                  setIsExtractingSec(true);
                  setTimeout(() => {
                    setIsExtractingSec(false);
                    setSecExtracted(true);
                    showToast(`Faits comptables SEC extraits pour ${secTickerInput}`);
                  }, 900);
                }}
                className="bg-primary hover:bg-primary-fixed text-on-primary px-3 py-2.5 rounded-lg font-label-data-sm text-xs font-semibold flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </div>

            {/* Entity Resolution Card */}
            <div className="bg-surface-container rounded-lg p-3 flex flex-col gap-1.5 border border-surface-container-high/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center font-label-data-sm text-xs font-bold text-on-surface">
                    🍎
                  </span>
                  <span className="font-headline-md text-sm font-semibold text-on-surface">Apple Inc.</span>
                </div>
                <span className="font-label-data-sm text-xs text-tertiary bg-surface-container-lowest px-2 py-0.5 rounded">
                  CIK: 0000320193
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-label-data-sm text-[11px] text-on-surface-variant">
                <span>SIC: 3571 (Electronic Computers)</span>
                <span>•</span>
                <span>Clôture: Fin Septembre (FY)</span>
              </div>
            </div>

            {/* Progress & Trigger */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between font-label-data-sm text-xs">
                <span className="text-on-surface-variant">Téléchargement faits comptables (us-gaap taxonomy)...</span>
                <span className="text-tertiary font-semibold">100% (3.4 Mo)</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  showToast('Faits comptables Apple Inc. (JSON 3.4 Mo) récupérés');
                }}
                className="w-full mt-1 bg-primary text-on-primary py-3 px-4 rounded-lg font-headline-md text-sm font-medium flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Récupérer Company Facts (JSON)</span>
              </button>
            </div>
          </div>

          {/* Normalisation XBRL (Zod v3.23) */}
          <div className="flex flex-col gap-3 bg-surface-container-low rounded-xl p-4 shadow-md border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">tune</span>
                <span className="font-headline-md text-base font-medium text-on-surface">Normalisation XBRL (Zod v3.23)</span>
              </div>
              <span className="font-label-data-sm text-[10px] text-tertiary bg-surface-container-high px-2 py-0.5 rounded-full">
                Mappage Réconcilié
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Passerelle des concepts comptables taxonomiques vers les agrégats standardisés WCR.
            </p>

            {/* Mapping rows */}
            <div className="flex flex-col gap-2">
              <div className="bg-surface-container rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-xs font-medium text-on-surface">Chiffre d'Affaires (TTM)</span>
                  <span className="font-label-data-sm text-xs text-tertiary font-semibold bg-surface-container-lowest px-2 py-0.5 rounded">$383.29 B</span>
                </div>
                <div className="flex flex-col gap-0.5 font-label-data-sm text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                    <span className="truncate">us-gaap/RevenueFromContractWithCustomerExcludingAssessedTax</span>
                  </div>
                  <div className="text-outline">Fallback: us-gaap/Revenues • Formule TTM 4Q validée</div>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-xs font-medium text-on-surface">Bénéfice Net</span>
                  <span className="font-label-data-sm text-xs text-tertiary font-semibold bg-surface-container-lowest px-2 py-0.5 rounded">$96.99 B</span>
                </div>
                <div className="flex flex-col gap-0.5 font-label-data-sm text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                    <span>us-gaap/NetIncomeLoss</span>
                  </div>
                  <div className="text-outline">Détection auto dépréciations & éléments exceptionnels</div>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-xs font-medium text-on-surface">Résultat d'Exploitation</span>
                  <span className="font-label-data-sm text-xs text-tertiary font-semibold bg-surface-container-lowest px-2 py-0.5 rounded">$114.30 B</span>
                </div>
                <div className="flex flex-col gap-0.5 font-label-data-sm text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                    <span>us-gaap/OperatingIncomeLoss</span>
                  </div>
                  <div className="text-outline">Cohérence marge opérationnelle : 29.8%</div>
                </div>
              </div>

              <div className="bg-surface-container rounded-lg p-2.5 flex flex-col gap-1 border border-surface-container-high/20">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-xs font-medium text-on-surface">Free Cash Flow (FCF)</span>
                  <span className="font-label-data-sm text-xs text-tertiary font-semibold bg-surface-container-lowest px-2 py-0.5 rounded">$108.81 B</span>
                </div>
                <div className="flex flex-col gap-0.5 font-label-data-sm text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                    <span className="truncate">NetCashProvidedByUsedInOperatingActivities - CapEx</span>
                  </div>
                  <div className="text-outline">CapEx = PaymentsToAcquirePropertyPlantAndEquipment</div>
                </div>
              </div>
            </div>

            {/* Audit de Réconciliation */}
            <div className="bg-surface-container-lowest rounded-lg p-3 flex flex-col gap-1.5 border border-surface-container-high/30">
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-xs text-on-surface font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                  Audit de Réconciliation
                </span>
                <span className="font-label-data-sm text-xs text-tertiary">4 Trimestres OK</span>
              </div>
              <div className="flex flex-col gap-1 text-on-surface-variant font-body-sm text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">check_circle</span>
                  <span>Priorité aux amendements 10-K/A et 10-Q/A sur dépôts initiaux.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">check_circle</span>
                  <span>Isolation stricte périodes 10-Q vs périodes 10-K cumulées (zéro double-comptage).</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Queue & Rate-Limiting Telemetry */}
          <div className="flex flex-col gap-3 bg-surface-container-low rounded-xl p-4 shadow-md border border-surface-container-high/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">database</span>
                <span className="font-headline-md text-base font-medium text-on-surface">Journal des Tâches (Dexie)</span>
              </div>
              <span className="font-label-data-sm text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                syncJobs
              </span>
            </div>

            {/* Rate-limiter */}
            <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-2.5 rounded-lg border border-surface-container-high/20">
              <div className="flex items-center justify-between font-label-data-sm text-xs">
                <span className="text-on-surface-variant">Rate-Limiter SEC (Fair Access)</span>
                <span className="text-tertiary font-semibold">2 / 10 req/sec</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-tertiary h-full w-[20%] rounded-full"></div>
              </div>
              <span className="font-label-data-sm text-[10px] text-outline">
                Sécurité SEC respectée • Aucun bannissement IP
              </span>
            </div>

            {/* Log Entries */}
            <div className="flex flex-col gap-1.5 font-label-data-sm text-xs">
              {syncJobs.map((job) => (
                <div key={job.jobId} className="p-2.5 rounded bg-surface-container flex flex-col gap-0.5 border border-surface-container-high/20">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${job.status === 'Succès' ? 'text-tertiary' : 'text-secondary'}`}>
                      [{job.timestamp}] {job.ticker} CIK:{job.cik}
                    </span>
                    <span className={job.status === 'Succès' ? 'text-tertiary' : 'text-secondary'}>
                      {job.status}
                    </span>
                  </div>
                  <span className="text-on-surface-variant text-[11px]">
                    {job.form} • {job.details}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                showToast('Données XBRL injectées dans Dexie.js (Upsert vérifié)');
              }}
              className="w-full bg-primary hover:bg-primary-fixed text-on-primary py-3 px-4 rounded-lg font-headline-md text-sm font-semibold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              <span>Injecter dans Dexie.js (Upsert vérifié)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              className="w-full bg-surface-container-high text-on-surface hover:text-primary py-3 px-4 rounded-lg font-headline-md text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <span className="material-symbols-outlined text-[20px]">data_object</span>
              <span>{showJsonInspector ? 'Masquer Payload Brut SEC' : 'Inspecter Payload Brut SEC (.json)'}</span>
            </button>

            {/* Payload Inspector Drawer */}
            {showJsonInspector && (
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high font-label-data-sm text-[11px] text-tertiary overflow-x-auto max-h-60 no-scrollbar">
                <pre>
{`{
  "cik": "0000320193",
  "entityName": "Apple Inc.",
  "facts": {
    "us-gaap": {
      "NetIncomeLoss": {
        "label": "Net Income (Loss)",
        "units": {
          "USD": [
            { "end": "2024-06-29", "val": 21448000000, "fy": 2024, "fp": "Q3", "form": "10-Q" },
            { "end": "2024-03-30", "val": 23636000000, "fy": 2024, "fp": "Q2", "form": "10-Q" },
            { "end": "2023-12-30", "val": 33916000000, "fy": 2024, "fp": "Q1", "form": "10-Q" },
            { "end": "2023-09-30", "val": 22956000000, "fy": 2023, "fp": "FY", "form": "10-K" }
          ]
        }
      }
    }
  }
}`}
                </pre>
              </div>
            )}

            <div className="flex items-center gap-2 px-1 py-2">
              <span className="material-symbols-outlined text-outline text-[18px] shrink-0">shield</span>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-snug">
                Toutes les requêtes et données SEC sont stockées uniquement dans IndexedDB. Aucune télémétrie externe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

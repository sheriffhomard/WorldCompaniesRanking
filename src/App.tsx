/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from './db/dexieDb';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ClassementScreen } from './components/screens/ClassementScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ComparerScreen } from './components/screens/ComparerScreen';
import { FavorisScreen } from './components/screens/FavorisScreen';
import { SynchroScreen } from './components/screens/SynchroScreen';
import { CompanyDetailModal } from './components/screens/CompanyDetailModal';
import { Company, FinancialTTM, FinancialQuarter, SyncJob, Currency, TabType } from './types';
import { INITIAL_COMPANIES, INITIAL_TTM, INITIAL_QUARTERS, INITIAL_SYNC_JOBS } from './db/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('classement');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [ttmMap, setTtmMap] = useState<Map<number, FinancialTTM>>(new Map());
  const [quarters, setQuarters] = useState<FinancialQuarter[]>(INITIAL_QUARTERS);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(INITIAL_SYNC_JOBS);
  const [favoriteTickers, setFavoriteTickers] = useState<Set<string>>(
    new Set(['2222.SR', 'AAPL', 'NVDA', 'MSFT'])
  );
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [storageStats, setStorageStats] = useState({
    usedKb: 218,
    companies: 12,
    periods: 32,
    ttm: 12,
    snapshots: 4,
    favorites: 4,
    jobs: 3,
    structureKb: 42,
    periodsKb: 176,
  });

  // Load from Dexie on mount
  const refreshData = useCallback(async () => {
    try {
      await db.seedInitialData();

      const [dbCompanies, dbTtm, dbQuarters, dbFavorites, dbJobs, stats] = await Promise.all([
        db.companies.toArray(),
        db.financialTtm.toArray(),
        db.financialPeriods.toArray(),
        db.favorites.toArray(),
        db.syncJobs.toArray(),
        db.getStorageStats(),
      ]);

      if (dbCompanies.length > 0) {
        setCompanies(dbCompanies);
      }
      if (dbQuarters.length > 0) {
        setQuarters(dbQuarters);
      }
      if (dbJobs.length > 0) {
        setSyncJobs(dbJobs);
      }

      // Map TTM by companyId
      const map = new Map<number, FinancialTTM>();
      const ttmSource = dbTtm.length > 0 ? dbTtm : INITIAL_TTM;
      ttmSource.forEach((t) => map.set(t.companyId, t));
      setTtmMap(map);

      // Favorites
      if (dbFavorites.length > 0) {
        setFavoriteTickers(new Set(dbFavorites.map((f) => f.ticker)));
      }

      setStorageStats(stats);
    } catch (err) {
      console.warn('Dexie DB fallback to in-memory initial data', err);
      const map = new Map<number, FinancialTTM>();
      INITIAL_TTM.forEach((t) => map.set(t.companyId, t));
      setTtmMap(map);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Toggle favorite in state & Dexie
  const handleToggleFavorite = async (ticker: string) => {
    const nextFavorites = new Set(favoriteTickers);
    const isFav = nextFavorites.has(ticker);

    if (isFav) {
      nextFavorites.delete(ticker);
      try {
        await db.favorites.delete(ticker);
      } catch (e) {
        console.error(e);
      }
    } else {
      nextFavorites.add(ticker);
      try {
        await db.favorites.put({
          ticker,
          pinnedAt: 'À l’instant',
          customTag: 'Portefeuille',
        });
      } catch (e) {
        console.error(e);
      }
    }

    setFavoriteTickers(nextFavorites);
    const stats = await db.getStorageStats();
    setStorageStats(stats);
  };

  // Reset Dexie DB
  const handleResetDb = async () => {
    try {
      await db.resetDatabase();
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCurrency = () => {
    setCurrency((prev) => (prev === 'USD' ? 'EUR' : 'USD'));
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Fixed Institutional Top Header */}
      <Header
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        onLogoClick={() => setActiveTab('classement')}
      />

      {/* Main Content View with top offset for fixed header */}
      <main className="flex-1 w-full pt-16">
        {activeTab === 'classement' && (
          <ClassementScreen
            companies={companies}
            ttmMap={ttmMap}
            currency={currency}
            favoriteTickers={favoriteTickers}
            onToggleFavorite={handleToggleFavorite}
            onSelectCompany={(c) => setSelectedCompany(c)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardScreen
            companies={companies}
            ttmMap={ttmMap}
            currency={currency}
            favoriteTickers={favoriteTickers}
            onToggleFavorite={handleToggleFavorite}
            onSelectCompany={(c) => setSelectedCompany(c)}
            onNavigateToFavorites={() => setActiveTab('favoris')}
            onResetDb={handleResetDb}
            storageStats={storageStats}
          />
        )}

        {activeTab === 'comparer' && (
          <ComparerScreen
            companies={companies}
            ttmMap={ttmMap}
            currency={currency}
            onSelectCompany={(c) => setSelectedCompany(c)}
          />
        )}

        {activeTab === 'favoris' && (
          <FavorisScreen
            companies={companies}
            ttmMap={ttmMap}
            currency={currency}
            favoriteTickers={favoriteTickers}
            onToggleFavorite={handleToggleFavorite}
            onSelectCompany={(c) => setSelectedCompany(c)}
            onNavigateToDuel={() => setActiveTab('comparer')}
          />
        )}

        {activeTab === 'synchro' && (
          <SynchroScreen
            companies={companies}
            ttmMap={ttmMap}
            syncJobs={syncJobs}
            storageStats={storageStats}
            onResetDb={handleResetDb}
            onRefreshStats={refreshData}
          />
        )}
      </main>

      {/* Company Detail Modal (Screen 6) */}
      {selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          ttm={
            ttmMap.get(selectedCompany.id) || {
              companyId: selectedCompany.id,
              ticker: selectedCompany.ticker,
              revenueTtm: 100,
              netIncomeTtm: 25,
              operatingIncomeTtm: 30,
              ebitdaTtm: 35,
              fcfTtm: 20,
              netMargin: 25,
              yoyGrowth: 5,
              sparkline: [10, 15, 20],
              periodLabel: 'Q3 2024 - Q2 2025',
              auditStatus: 'Vérifié Dexie',
              historicalYears: [
                { year: 'FY 2021', netIncome: 20, revenue: 80 },
                { year: 'FY 2022', netIncome: 22, revenue: 90 },
                { year: 'FY 2023', netIncome: 25, revenue: 100 },
              ],
            }
          }
          quarters={quarters.filter((q) => q.companyId === selectedCompany.id)}
          currency={currency}
          isFavorite={favoriteTickers.has(selectedCompany.ticker)}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelectedCompany(null)}
        />
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favoriteTickers.size}
      />
    </div>
  );
}

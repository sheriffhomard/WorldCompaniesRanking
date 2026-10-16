import Dexie, { Table } from 'dexie';
import { Company, FinancialQuarter, FinancialTTM, SyncJob, FavoriteItem } from '../types';
import { INITIAL_COMPANIES, INITIAL_TTM, INITIAL_QUARTERS, INITIAL_SYNC_JOBS } from './initialData';

export interface RankSnapshot {
  id?: number;
  timestamp: string;
  generatedAt: string;
  source: string;
  topLeaderTicker: string;
  sampleSize: number;
}

export class WCRDatabase extends Dexie {
  companies!: Table<Company, number>;
  financialPeriods!: Table<FinancialQuarter, number>;
  financialTtm!: Table<FinancialTTM, number>;
  rankSnapshots!: Table<RankSnapshot, number>;
  favorites!: Table<FavoriteItem, string>;
  syncJobs!: Table<SyncJob, number>;

  constructor() {
    super('WCR_DB_v0.2');
    this.version(1).stores({
      companies: '++id, ticker, cik, sector, currency, name',
      financialPeriods: '++id, [companyId+quarterCode], companyId, fiscalYear, form',
      financialTtm: '&companyId, ticker, revenueTtm, netIncomeTtm, netMargin',
      rankSnapshots: '++id, timestamp, generatedAt, source',
      favorites: '&ticker, pinnedAt, customTag',
      syncJobs: '++jobId, timestamp, ticker, cik, status'
    });
  }

  async seedInitialData(): Promise<void> {
    const companiesCount = await this.companies.count();
    if (companiesCount === 0) {
      await this.companies.bulkAdd(INITIAL_COMPANIES);
      await this.financialTtm.bulkAdd(INITIAL_TTM);
      await this.financialPeriods.bulkAdd(INITIAL_QUARTERS);
      await this.syncJobs.bulkAdd(INITIAL_SYNC_JOBS);
      
      // Default initial favorites as seen in the screenshots (Saudi Aramco, Apple, NVIDIA, Microsoft)
      await this.favorites.bulkAdd([
        { ticker: '2222.SR', pinnedAt: 'Vu il y a 8 min', customTag: 'Énergie Sovereign' },
        { ticker: 'AAPL', pinnedAt: 'Vu il y a 24 min', customTag: 'Tech Alpha' },
        { ticker: 'NVDA', pinnedAt: 'Vu hier', customTag: 'IA Momentum' },
        { ticker: 'MSFT', pinnedAt: 'Vu hier', customTag: 'Cloud Core' }
      ]);

      await this.rankSnapshots.bulkAdd([
        { id: 1, timestamp: '2024-10-24 14:32:00', generatedAt: '24 Oct. 2024', source: 'SEC Form 10-K / XBRL', topLeaderTicker: '2222.SR', sampleSize: 12 },
        { id: 2, timestamp: '2024-10-23 09:00:00', generatedAt: '23 Oct. 2024', source: 'SEC Form 10-Q / XBRL', topLeaderTicker: '2222.SR', sampleSize: 12 },
        { id: 3, timestamp: '2024-10-22 18:45:00', generatedAt: '22 Oct. 2024', source: 'SEC Form 10-K Live', topLeaderTicker: 'AAPL', sampleSize: 10 },
        { id: 4, timestamp: '2024-10-21 11:20:00', generatedAt: '21 Oct. 2024', source: 'WCR Historical Engine', topLeaderTicker: 'AAPL', sampleSize: 10 }
      ]);
    }
  }

  async getStorageStats() {
    const companies = await this.companies.count();
    const periods = await this.financialPeriods.count();
    const ttm = await this.financialTtm.count();
    const snapshots = await this.rankSnapshots.count();
    const favorites = await this.favorites.count();
    const jobs = await this.syncJobs.count();

    // Estimate storage in KB based on approximate row sizes
    const approxBytes = 
      companies * 550 + 
      periods * 450 + 
      ttm * 700 + 
      snapshots * 200 + 
      favorites * 100 + 
      jobs * 350 + 
      42000; // base structure
    
    return {
      companies,
      periods,
      ttm,
      snapshots,
      favorites,
      jobs,
      usedKb: Math.round(approxBytes / 1024),
      structureKb: 42,
      periodsKb: Math.round((periods * 450 + ttm * 700) / 1024) || 176
    };
  }

  async resetDatabase(): Promise<void> {
    await this.transaction('rw', [this.companies, this.financialPeriods, this.financialTtm, this.rankSnapshots, this.favorites, this.syncJobs], async () => {
      await this.companies.clear();
      await this.financialPeriods.clear();
      await this.financialTtm.clear();
      await this.rankSnapshots.clear();
      await this.favorites.clear();
      await this.syncJobs.clear();
      
      await this.companies.bulkAdd(INITIAL_COMPANIES);
      await this.financialTtm.bulkAdd(INITIAL_TTM);
      await this.financialPeriods.bulkAdd(INITIAL_QUARTERS);
      await this.syncJobs.bulkAdd(INITIAL_SYNC_JOBS);
      await this.favorites.bulkAdd([
        { ticker: '2222.SR', pinnedAt: 'Vu il y a 8 min', customTag: 'Énergie Sovereign' },
        { ticker: 'AAPL', pinnedAt: 'Vu il y a 24 min', customTag: 'Tech Alpha' },
        { ticker: 'NVDA', pinnedAt: 'Vu hier', customTag: 'IA Momentum' },
        { ticker: 'MSFT', pinnedAt: 'Vu hier', customTag: 'Cloud Core' }
      ]);
      await this.rankSnapshots.bulkAdd([
        { id: 1, timestamp: '2024-10-24 14:32:00', generatedAt: '24 Oct. 2024', source: 'SEC Form 10-K / XBRL', topLeaderTicker: '2222.SR', sampleSize: 12 },
        { id: 2, timestamp: '2024-10-23 09:00:00', generatedAt: '23 Oct. 2024', source: 'SEC Form 10-Q / XBRL', topLeaderTicker: '2222.SR', sampleSize: 12 },
        { id: 3, timestamp: '2024-10-22 18:45:00', generatedAt: '22 Oct. 2024', source: 'SEC Form 10-K Live', topLeaderTicker: 'AAPL', sampleSize: 10 },
        { id: 4, timestamp: '2024-10-21 11:20:00', generatedAt: '21 Oct. 2024', source: 'WCR Historical Engine', topLeaderTicker: 'AAPL', sampleSize: 10 }
      ]);
    });
  }
}

export const db = new WCRDatabase();

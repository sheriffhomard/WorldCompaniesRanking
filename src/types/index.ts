export type Currency = 'USD' | 'EUR';

export type MetricType = 
  | 'netIncome' 
  | 'revenue' 
  | 'margin' 
  | 'ebitda' 
  | 'fcf' 
  | 'growth';

export type ScopeType = 'top10' | 'top50' | 'top100' | 'all';

export type TabType = 'classement' | 'dashboard' | 'comparer' | 'favoris' | 'synchro';

export interface Company {
  id: number;
  ticker: string;
  name: string;
  exchange: string;
  country: string;
  countryFlag: string;
  countryCode: string;
  sector: string;
  subSector: string;
  currency: string;
  cik: string;
  rank: number;
  marketCapUsd: number; // in Billions USD
  logoUrl?: string;
  sic?: string;
  fiscalYearEnd?: string;
}

export interface FinancialQuarter {
  id?: number;
  companyId: number;
  quarterCode: string; // e.g. "Q3 2024"
  quarterLabel: string; // e.g. "T3 2024"
  closingDate: string; // e.g. "29/06/2024"
  form: '10-Q' | '10-K' | 'Annual' | 'Quarterly';
  fiscalYear: number;
  revenue: number; // in Billions USD
  netIncome: number; // in Billions USD
  operatingIncome: number; // in Billions USD
  fcf: number; // in Billions USD
  ebitda: number; // in Billions USD
}

export interface FinancialTTM {
  companyId: number;
  ticker: string;
  revenueTtm: number;
  netIncomeTtm: number;
  operatingIncomeTtm: number;
  ebitdaTtm: number;
  fcfTtm: number;
  netMargin: number; // percentage, e.g. 25.8
  yoyGrowth: number; // percentage, e.g. +2.8
  sparkline: number[];
  periodLabel: string;
  auditStatus: string;
  historicalYears: {
    year: string;
    netIncome: number;
    revenue: number;
  }[];
}

export interface FavoriteItem {
  ticker: string;
  pinnedAt: string;
  customTag?: string;
}

export interface SyncJob {
  jobId: number;
  timestamp: string;
  ticker: string;
  cik: string;
  form: string;
  status: 'Succès' | 'En attente' | 'Erreur';
  factsCount: number;
  durationMs: number;
  details: string;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Campus {
  MAIN = "FIQH Academy – Main Campus",
  JOHAR = "FIQH Academy – Johar Campus",
  MASJID = "FIQH Academy – Masjid Campus",
  MAKTAB = "FIQH Academy – Maktab Campus",
  UNALLOCATED = "Unallocated"
}

export type CampusId = 1 | 2 | 3 | 4;

export const CAMPUS_MAP: Record<CampusId, Campus> = {
  1: Campus.MAIN,
  2: Campus.JOHAR,
  3: Campus.MASJID,
  4: Campus.MAKTAB,
};

export enum TransactionType {
  INCOME = "Income",
  EXPENSE = "Expense"
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  account?: string;
  bankCashAccount?: string;
  debit: number;
  credit: number;
  amount: number;
  type: TransactionType;
  campus: Campus;
  category?: string;
  subCategory?: string;
  reference?: string;
  donorName?: string;
}

export interface PLSection {
  title: string;
  subtotal: number;
  items: {
    name: string;
    amount: number;
  }[];
}

export interface PLReport {
  campus: Campus | "Consolidated";
  startDate: string;
  endDate: string;
  reportDate: string;
  income: {
    donations: PLSection;
    unrestricted: PLSection;
    restricted: PLSection;
    maktaba: PLSection;
    fixedAssetsGain: PLSection;
    total: number;
  };
  expenses: {
    salaries: PLSection;
    rent: PLSection;
    utilities: PLSection;
    admin: PLSection;
    repairMaintenance: PLSection;
    travel: PLSection;
    welfareEducation: PLSection;
    booksPublications: PLSection;
    legalFinancial: PLSection;
    depreciation: PLSection;
    restrictedExpense: PLSection;
    total: number;
  };
  netProfitLoss: number;
}

export interface ColumnMapping {
  date: string;
  description: string;
  account: string;
  bankCashAccount: string;
  debit: string;
  credit: string;
  amount: string;
  reference: string;
  campus: string;
}

export interface ChartOfAccountsEntry {
  keyword: string;
  category: string;
  subCategory: string;
}

export interface AppState {
  transactions: Transaction[];
  mappings: ChartOfAccountsEntry[];
  columnMapping: ColumnMapping;
  lastUpdate: string;
}

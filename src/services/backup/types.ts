/**
 * BACKUP & DATA PORTABILITY TYPES
 * Cryptographically verified offline backup schemas and CSV data models.
 */

export interface BackupTableCounts {
  business_profiles: number;
  customers: number;
  jobs: number;
  catalog_items: number;
  number_sequences: number;
  documents: number;
  document_items: number;
  document_snapshots: number;
  payments: number;
  receipts: number;
  expenses: number;
  time_entries: number;
  estimate_revisions: number;
}

export interface BackupManifest {
  app: 'Billframe';
  version: number;
  exportedAt: number;
  checksumSha256: string;
  counts: BackupTableCounts;
}

export interface BackupPayload {
  manifest: BackupManifest;
  data: {
    business_profiles: any[];
    customers: any[];
    jobs: any[];
    catalog_items: any[];
    number_sequences: any[];
    documents: any[];
    document_items: any[];
    document_snapshots: any[];
    payments: any[];
    receipts: any[];
    expenses: any[];
    time_entries: any[];
    estimate_revisions: any[];
  };
}

export interface RestoreResult {
  success: boolean;
  restoredCounts?: BackupTableCounts;
  error?: string;
}

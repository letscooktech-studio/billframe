import { BackupManager } from '../../src/services/backup/BackupManager';
import { CsvExporter, parseCsvRows, escapeCsvField } from '../../src/services/backup/CsvExporter';
import { CustomerRepository } from '../../src/data/repositories/CustomerRepository';
import { CatalogRepository } from '../../src/data/repositories/CatalogRepository';
import { DocumentRepository } from '../../src/data/repositories/DocumentRepository';
import { getMockDb } from '../mocks/expo-sqlite';

describe('Offline Backup & Restore Integrity Engine', () => {
  beforeEach(() => {
    getMockDb().reset();
  });

  it('generates a full backup with valid SHA-256 checksum manifest and table counts', async () => {
    // Seed test customer
    await CustomerRepository.createCustomer({
      name: 'Alpha Construction Co',
      businessName: 'Alpha Corp',
      email: 'admin@alphacorp.com',
    });

    const { jsonString, manifest } = await BackupManager.createFullBackupAsync();
    expect(manifest.app).toBe('Billframe');
    expect(manifest.version).toBe(2);
    expect(manifest.counts.customers).toBe(1);
    expect(manifest.checksumSha256).toBeDefined();
    expect(manifest.checksumSha256.length).toBe(64); // Valid sha256 hex string

    // Validate intact backup
    const validation = await BackupManager.validateBackupJson(jsonString);
    expect(validation.valid).toBe(true);
    expect(validation.payload?.manifest.counts.customers).toBe(1);
  });

  it('CRITICAL INTEGRITY: detects corrupted or tampered data via SHA-256 mismatch', async () => {
    await CustomerRepository.createCustomer({
      name: 'Valid Customer',
      email: 'valid@example.com',
    });

    const { jsonString } = await BackupManager.createFullBackupAsync();
    const parsed = JSON.parse(jsonString);

    // Maliciously tamper with customer email in payload
    parsed.data.customers[0].email = 'hacked@fraud.com';
    const tamperedJson = JSON.stringify(parsed);

    const validation = await BackupManager.validateBackupJson(tamperedJson);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Checksum mismatch');
  });

  it('atomically restores database tables and counts from verified payload', async () => {
    const mockPayload: any = {
      manifest: {
        app: 'Billframe',
        version: 2,
        exportedAt: Date.now(),
        checksumSha256: 'mock_checksum',
        counts: {
          business_profiles: 1,
          customers: 2,
          jobs: 0,
          catalog_items: 0,
          number_sequences: 1,
          documents: 0,
          document_items: 0,
          document_snapshots: 0,
          payments: 0,
          receipts: 0,
          expenses: 0,
          time_entries: 0,
          estimate_revisions: 0,
        },
      },
      data: {
        business_profiles: [
          {
            id: 'biz_restored',
            name: 'Restored Timber Co',
            country: 'US',
            default_currency: 'USD',
            default_document_locale: 'en-US',
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
        customers: [
          {
            id: 'cust_restored_1',
            name: 'Client One',
            email: 'one@client.com',
            created_at: Date.now(),
            updated_at: Date.now(),
          },
          {
            id: 'cust_restored_2',
            name: 'Client Two',
            email: 'two@client.com',
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
        jobs: [],
        catalog_items: [],
        number_sequences: [],
        documents: [],
        document_items: [],
        document_snapshots: [],
        payments: [],
        receipts: [],
        expenses: [],
        time_entries: [],
        estimate_revisions: [],
      },
    };

    const result = await BackupManager.restoreFromPayloadAsync(mockPayload);
    expect(result.success).toBe(true);

    const customersAfter = await CustomerRepository.listAllCustomers();
    expect(customersAfter.length).toBe(2);
    expect(customersAfter[0].name).toBe('Client One');
  });
});

describe('RFC 4180 CSV Export & Ingestion Engine', () => {
  it('correctly escapes CSV fields containing commas and quotes', () => {
    expect(escapeCsvField('Simple text')).toBe('Simple text');
    expect(escapeCsvField('Smith, John')).toBe('"Smith, John"');
    expect(escapeCsvField('Quotes "Inside"')).toBe('"Quotes ""Inside"""');
  });

  it('accurately parses multiline and quoted CSV content', () => {
    const csv = `Name,Business Name,Email\n"John, Jr.","Acme, Inc.",john@acme.com\nBob,"Smith & Co",bob@smith.com`;
    const rows = parseCsvRows(csv);

    expect(rows.length).toBe(3);
    expect(rows[0]).toEqual(['Name', 'Business Name', 'Email']);
    expect(rows[1]).toEqual(['John, Jr.', 'Acme, Inc.', 'john@acme.com']);
    expect(rows[2]).toEqual(['Bob', 'Smith & Co', 'bob@smith.com']);
  });

  it('imports customers from CSV into database', async () => {
    getMockDb().reset();
    const csv = `Name,Business Name,Email,Phone\nAlice Adams,Wonderland LLC,alice@wonderland.com,555-1234\nBob Builder,Bob Builds,bob@builder.com,555-5678`;
    const result = await CsvExporter.importCustomersFromCsvAsync(csv);

    expect(result.importedCount).toBe(2);
    expect(result.errors.length).toBe(0);

    const all = await CustomerRepository.listAllCustomers();
    expect(all.length).toBe(2);
    expect(all[0].name).toBe('Alice Adams');
    expect(all[1].name).toBe('Bob Builder');
  });

  it('imports catalog items from CSV with correct minor unit conversion', async () => {
    getMockDb().reset();
    const csv = `Item Name,Description,Price,Unit\nConsulting,Hourly advisory,150.00,hr\nHardware Widget,Physical bolt,2.75,piece\nZero Cost,Free trial,0,item`;
    const result = await CsvExporter.importCatalogFromCsvAsync(csv);

    expect(result.importedCount).toBe(3);
    expect(result.errors.length).toBe(0);

    const items = await CatalogRepository.listAllItems();
    expect(items.length).toBe(3);
    expect(items[0].name).toBe('Consulting');
    expect(items[0].unit_price_minor).toBe(15000);
    expect(items[1].name).toBe('Hardware Widget');
    expect(items[1].unit_price_minor).toBe(275);
    expect(items[2].name).toBe('Zero Cost');
    expect(items[2].unit_price_minor).toBe(0);
  });

  it('exports invoices to CSV with currency-aware decimal precision', async () => {
    getMockDb().reset();
    const cust = await CustomerRepository.createCustomer({ name: 'Acme Global' });

    // Seed USD document
    await DocumentRepository.saveDraft({
      businessProfileId: 'default_business_profile',
      customerId: cust.id,
      docType: 'invoice',
      currency: 'USD',
      issueDate: Date.now(),
      items: [
        {
          description: 'Web Development',
          quantityScaled: 10000n,
          unitPriceMinor: 25000n,
          unitName: 'item',
        },
      ],
      discountType: 'none',
      discountValue: 0n,
      taxType: 'none',
      taxRateBp: 0n,
      taxLabel: 'Tax',
    });

    const csvOutput = await CsvExporter.exportInvoicesToCsvAsync();
    expect(csvOutput).toContain('Document Type,Document Number,Customer');
    expect(csvOutput).toContain('250.00'); // USD 25000 minor units -> 250.00
    expect(csvOutput).toContain('Acme Global');
  });
});


/**
 * UNIVERSAL BUSINESS DOCUMENT ENGINE — DOMAIN CONTRACTS
 * Supports 3 strict document classes:
 * - Class A (Financial/Transactional): Invoices, Bills of Supply, Credit Notes, Receipts (Ledger integrated)
 * - Class B (Organizational/Administrative): HR & Employment, Corporate Letters, Operational Work Orders (Non-ledger)
 * - Class C (User-Defined Custom): Dynamic user-created schemas with typed fields and custom sections
 */

export type DocumentClass =
  | 'class_a_financial'
  | 'class_b_administrative'
  | 'class_c_custom';

export type UniversalCategory =
  | 'sales_billing'
  | 'hr_employment'
  | 'business_letters'
  | 'operations'
  | 'procurement'
  | 'finance_accounting'
  | 'corporate_admin'
  | 'property_management'
  | 'education'
  | 'nonprofit'
  | 'custom';

export type UniversalFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'currency'
  | 'select'
  | 'signature'
  | 'table'
  | 'checkbox';

export interface TableColumnDefinition {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'number' | 'currency' | 'date';
  readonly widthPercentage?: number;
  readonly align?: 'left' | 'center' | 'right';
}

export interface UniversalFieldDefinition {
  readonly id: string;
  readonly label: string;
  readonly type: UniversalFieldType;
  readonly placeholder?: string;
  readonly defaultValue?: any;
  readonly options?: readonly { label: string; value: string }[];
  readonly required?: boolean;
  readonly helpText?: string;
  readonly columns?: readonly TableColumnDefinition[];
}

export interface UniversalSectionDefinition {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly fields: readonly UniversalFieldDefinition[];
}

export interface UniversalDocumentSchema {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly docClass: DocumentClass;
  readonly category: UniversalCategory;
  readonly description: string;
  readonly icon: string;
  readonly defaultTemplate: string;
  readonly isSystem: boolean;
  readonly sections: readonly UniversalSectionDefinition[];
  readonly headerConfig?: {
    readonly showLogo: boolean;
    readonly showOrgDetails: boolean;
    readonly showDocNumber: boolean;
    readonly showDate: boolean;
  };
  readonly footerConfig?: {
    readonly showSignatures: boolean;
    readonly showTerms: boolean;
    readonly showNotes: boolean;
    readonly authorizedSignatoryLabel?: string;
    readonly recipientAcceptanceLabel?: string;
  };
}

export interface UniversalDocumentInstance {
  readonly id: string;
  readonly businessProfileId: string;
  readonly typeId: string;
  readonly docClass: DocumentClass;
  readonly documentNumber: string;
  readonly title: string;
  readonly status: 'draft' | 'issued' | 'archived';
  readonly issueDate: number;
  readonly partyName: string;
  readonly partyDetails: Record<string, any>;
  readonly content: Record<string, any>;
  readonly templateCode: string;
  readonly branding?: {
    readonly brandColor?: string;
    readonly secondaryColor?: string;
    readonly logoUri?: string;
    readonly fontFamily?: string;
  };
  readonly createdAt: number;
  readonly updatedAt: number;
}

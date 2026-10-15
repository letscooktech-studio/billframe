/**
 * TOOL REGISTRY
 * Authoritative registry of typed, deterministic tools available for
 * on-device agent workflows. Zero external dependencies.
 */

import { ToolDefinition, ToolCategory } from './types';
import { CustomerRepository } from '../../data/repositories/CustomerRepository';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { PaymentRepository } from '../../data/repositories/PaymentRepository';
import { calculateDocument } from '../../domain/documents/DocumentCalculator';
import { DocumentCalculationInput, LineItemInput } from '../../domain/documents/types';

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  /**
   * Registers a tool in the catalog.
   */
  public static registerTool<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves a tool by name.
   */
  public static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Lists all registered tools.
   */
  public static listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Lists tools filtered by category.
   */
  public static listToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return this.listTools().filter((t) => t.category === category);
  }

  /**
   * Resets registry to empty (primarily for isolated test fixtures).
   */
  public static reset(): void {
    this.tools.clear();
  }

  /**
   * Initializes default core tools.
   */
  public static initDefaultTools(): void {
    this.tools.clear();

    // 1. Find Customers (Read)
    this.registerTool({
      name: 'find_customers',
      description: 'Searches active customers by name, business name, or email.',
      category: 'read',
      requiresUserApproval: false,
      execute: async (input: { query?: string }) => {
        return await CustomerRepository.search(input?.query || '', false);
      },
    });

    // 2. Create Customer (Write)
    this.registerTool({
      name: 'create_customer',
      description: 'Creates a new customer profile.',
      category: 'write',
      requiresUserApproval: false,
      execute: async (input: { name: string; businessName?: string; email?: string; phone?: string }) => {
        return await CustomerRepository.create({
          name: input.name,
          businessName: input.businessName,
          email: input.email,
          phone: input.phone,
        });
      },
    });

    // 3. Calculate Document (Read / Pure Domain Math)
    this.registerTool({
      name: 'calculate_document',
      description: 'Calculates subtotal, discounts, tax, and totals without modifying database.',
      category: 'read',
      requiresUserApproval: false,
      execute: async (input: DocumentCalculationInput) => {
        return calculateDocument(input);
      },
    });

    // 4. Save Document Draft (Write)
    this.registerTool({
      name: 'save_document_draft',
      description: 'Creates or updates a draft document in SQLite.',
      category: 'write',
      requiresUserApproval: false,
      execute: async (input: {
        docType: string;
        customerId?: string | null;
        issueDate?: number;
        currency: string;
        items: LineItemInput[];
        notes?: string;
      }) => {
        return await DocumentRepository.saveDraft(input as any);
      },
    });

    // 5. Issue Document (Financial / Modifies Sovereign Ledger)
    this.registerTool({
      name: 'issue_document',
      description: 'Finalizes and issues a draft document, allocating a sequential document number.',
      category: 'financial',
      requiresUserApproval: true,
      execute: async (input: { documentId: string }) => {
        return await DocumentRepository.issueDocument(input.documentId);
      },
    });

    // 6. Record Payment (Financial / Modifies Ledger)
    this.registerTool({
      name: 'record_payment',
      description: 'Records a customer payment against an issued invoice and generates a receipt.',
      category: 'financial',
      requiresUserApproval: true,
      execute: async (input: {
        invoiceId: string;
        amountMinor: bigint | number;
        paymentMethod?: any;
        reference?: string;
      }) => {
        return await PaymentRepository.recordPayment({
          invoiceId: input.invoiceId,
          amountMinor: BigInt(input.amountMinor),
          paymentMethod: input.paymentMethod || 'cash',
          reference: input.reference,
        });
      },
    });

    // 7. Get Active Profile (Read)
    this.registerTool({
      name: 'get_active_profile',
      description: 'Retrieves current active business profile and branding configuration.',
      category: 'read',
      requiresUserApproval: false,
      execute: async () => {
        return await BusinessProfileRepository.getActiveProfile();
      },
    });
  }
}

// Auto-seed default tools on load
ToolRegistry.initDefaultTools();

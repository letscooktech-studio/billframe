/**
 * LOGO STORAGE & ASSET PIPELINE SERVICE
 * 
 * Production-ready asset pipeline for organization brand marks and logos:
 * - Format validation: PNG, JPG, JPEG, WEBP, SVG
 * - Size limit: Max 2 MB
 * - App-private durable storage in ${FileSystem.documentDirectory}branding/
 * - Automatic cleanup of stale/superseded logo files
 * - Data URI generation for reliable, self-contained HTML/PDF embedding
 * - Zero broad storage permissions required (relies on scoped app-private sandbox)
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface ProcessLogoOptions {
  profileId: string;
  sourceUri: string;
  mimeType?: string;
  fileSize?: number;
}

export interface ProcessedLogoResult {
  storedUri: string;
  dataUri: string;
  fileSize: number;
  mimeType: string;
}

export class LogoStorageService {
  private static readonly MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
  private static readonly ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  private static get BRANDING_DIR(): string {
    const docDir = (FileSystem as any).documentDirectory || '';
    return `${docDir}branding/`;
  }

  /**
   * Validates and copies a newly selected logo asset to app-private durable storage.
   * Returns both the local storage URI and an inline Data URI for PDF/web embedding.
   */
  static async processAndStoreLogoAsync(
    options: ProcessLogoOptions
  ): Promise<ProcessedLogoResult> {
    const { profileId, sourceUri, mimeType, fileSize } = options;

    if (!sourceUri) {
      throw new Error('No logo source URI provided.');
    }

    // 1. Enforce size limit if size provided upfront
    if (fileSize && fileSize > this.MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `Logo file size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 2 MB limit.`
      );
    }

    // 2. Determine extension & MIME type
    const detectedExtension = this.extractExtension(sourceUri, mimeType);
    if (!this.ALLOWED_EXTENSIONS.includes(detectedExtension.toLowerCase())) {
      throw new Error(
        `Unsupported logo format: .${detectedExtension}. Supported formats: PNG, JPG, WEBP, SVG.`
      );
    }

    const resolvedMime = mimeType || this.mimeForExtension(detectedExtension);

    // 3. Platform-specific persistence
    if (Platform.OS === 'web') {
      // On Web: normalize to Data URI or use persistent web representation
      let dataUri = sourceUri;
      if (sourceUri.startsWith('blob:')) {
        try {
          dataUri = await this.blobUrlToDataUri(sourceUri);
        } catch {
          dataUri = sourceUri;
        }
      }
      return {
        storedUri: dataUri,
        dataUri,
        fileSize: fileSize || 0,
        mimeType: resolvedMime,
      };
    }

    // On Native (Android / iOS):
    try {
      // Ensure private branding directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.BRANDING_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BRANDING_DIR, { intermediates: true });
      }

      // Check file size from actual filesystem if not provided
      const srcInfo = await FileSystem.getInfoAsync(sourceUri);
      if (srcInfo.exists && (srcInfo as any).size) {
        const actualSize = (srcInfo as any).size;
        if (actualSize > this.MAX_FILE_SIZE_BYTES) {
          throw new Error(
            `Logo file size (${(actualSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 2 MB limit.`
          );
        }
      }

      // Generate immutable durable filename scoped to business profile (sanitized against path traversal)
      const sanitizedProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = Date.now();
      const sanitizedExt = detectedExtension.toLowerCase() === 'jpeg' ? 'jpg' : detectedExtension.toLowerCase();
      const filename = `logo_${sanitizedProfileId}_${timestamp}.${sanitizedExt}`;
      const destinationUri = `${this.BRANDING_DIR}${filename}`;

      // Copy file to app-private storage
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });

      // Generate base64 Data URI for deterministic offline HTML/PDF embedding
      const base64 = await FileSystem.readAsStringAsync(destinationUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const dataUri = `data:${resolvedMime};base64,${base64}`;

      // Clean up previous logo files for this profile in background
      this.cleanupOldLogosForProfileAsync(profileId, filename).catch(() => {
        // Non-blocking cleanup
      });

      return {
        storedUri: destinationUri,
        dataUri,
        fileSize: (srcInfo as any).size || fileSize || 0,
        mimeType: resolvedMime,
      };
    } catch (err: any) {
      if (err.message && err.message.includes('exceeds the 2 MB limit')) {
        throw err;
      }
      // If native file copy fails, fallback to keeping sourceUri
      return {
        storedUri: sourceUri,
        dataUri: sourceUri,
        fileSize: fileSize || 0,
        mimeType: resolvedMime,
      };
    }
  }

  /**
   * Converts any stored logo URI to a base64 Data URI for reliable PDF rendering.
   */
  static async getLogoDataUriAsync(logoUri: string | null | undefined): Promise<string | null> {
    if (!logoUri) return null;

    if (logoUri.startsWith('data:')) {
      return logoUri;
    }

    if (Platform.OS === 'web') {
      return logoUri;
    }

    try {
      const info = await FileSystem.getInfoAsync(logoUri);
      if (info.exists) {
        const ext = this.extractExtension(logoUri);
        const mime = this.mimeForExtension(ext);
        const base64 = await FileSystem.readAsStringAsync(logoUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:${mime};base64,${base64}`;
      }
    } catch {
      // Fallback
    }

    return logoUri;
  }

  /**
   * Safely deletes all stored logo assets for an organization profile.
   */
  static async removeLogoAsync(profileId: string, currentUri?: string | null): Promise<void> {
    if (Platform.OS === 'web' || !currentUri) return;

    try {
      if (currentUri.startsWith(this.BRANDING_DIR)) {
        const info = await FileSystem.getInfoAsync(currentUri);
        if (info.exists) {
          await FileSystem.deleteAsync(currentUri, { idempotent: true });
        }
      }
      await this.cleanupOldLogosForProfileAsync(profileId);
    } catch {
      // Safe non-blocking error handling
    }
  }

  /**
   * Deletes older logo files for a specific organization to prevent disk leakage.
   */
  private static async cleanupOldLogosForProfileAsync(
    profileId: string,
    excludeFilename?: string
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const dirInfo = await FileSystem.getInfoAsync(this.BRANDING_DIR);
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(this.BRANDING_DIR);
      const sanitizedProfileId = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const prefix = `logo_${sanitizedProfileId}_`;

      for (const file of files) {
        if (file.startsWith(prefix) && file !== excludeFilename) {
          const filePath = `${this.BRANDING_DIR}${file}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
      }
    } catch {
      // Safe non-blocking cleanup
    }
  }

  /**
   * Helper to extract file extension from URL or mime type.
   */
  private static extractExtension(uri: string, mime?: string): string {
    if (mime) {
      if (mime.includes('png')) return 'png';
      if (mime.includes('svg')) return 'svg';
      if (mime.includes('webp')) return 'webp';
      if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
    }
    const cleanUri = uri.split('?')[0].split('#')[0];
    const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'png';
  }

  /**
   * Resolves standard MIME type for an image file extension.
   */
  private static mimeForExtension(ext: string): string {
    switch (ext.toLowerCase()) {
      case 'png':
        return 'image/png';
      case 'svg':
        return 'image/svg+xml';
      case 'webp':
        return 'image/webp';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Helper for web to convert blob: URL to data: URI.
   */
  private static async blobUrlToDataUri(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

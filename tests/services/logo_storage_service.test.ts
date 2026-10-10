import { LogoStorageService } from '../../src/services/image/LogoStorageService';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

describe('LogoStorageService — Asset Pipeline & Durable Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation & Format Guardrails', () => {
    it('throws error when no sourceUri is provided', async () => {
      await expect(
        LogoStorageService.processAndStoreLogoAsync({
          profileId: 'prof_test_1',
          sourceUri: '',
        })
      ).rejects.toThrow('No logo source URI provided.');
    });

    it('rejects files exceeding the 2 MB limit upfront', async () => {
      const overLimitBytes = 2.5 * 1024 * 1024; // 2.5 MB
      await expect(
        LogoStorageService.processAndStoreLogoAsync({
          profileId: 'prof_test_1',
          sourceUri: 'file:///path/to/large_logo.png',
          fileSize: overLimitBytes,
        })
      ).rejects.toThrow(/exceeds the 2 MB limit/);
    });

    it('rejects unsupported image extensions (e.g. gif, bmp, exe)', async () => {
      await expect(
        LogoStorageService.processAndStoreLogoAsync({
          profileId: 'prof_test_1',
          sourceUri: 'file:///path/to/animation.gif',
        })
      ).rejects.toThrow(/Unsupported logo format: .gif/);

      await expect(
        LogoStorageService.processAndStoreLogoAsync({
          profileId: 'prof_test_1',
          sourceUri: 'file:///path/to/malicious.exe',
        })
      ).rejects.toThrow(/Unsupported logo format: .exe/);
    });

    it('accepts supported extensions (PNG, JPG, JPEG, WEBP, SVG)', async () => {
      const supported = ['logo.png', 'photo.jpg', 'header.jpeg', 'brand.webp', 'vector.svg'];
      for (const filename of supported) {
        const result = await LogoStorageService.processAndStoreLogoAsync({
          profileId: 'prof_test_1',
          sourceUri: `file:///path/to/${filename}`,
          fileSize: 50 * 1024, // 50 KB
        });
        expect(result).toBeDefined();
        expect(result.dataUri).toBeDefined();
      }
    });
  });

  describe('Storage & Data URI Generation', () => {
    it('generates base64 data URI for offline PDF rendering', async () => {
      const result = await LogoStorageService.processAndStoreLogoAsync({
        profileId: 'prof_test_1',
        sourceUri: 'file:///path/to/valid_logo.png',
        fileSize: 120 * 1024,
      });

      expect(result.mimeType).toBe('image/png');
      expect(result.dataUri).toMatch(/^data:image\/png/);
      expect(result.storedUri).toBeDefined();
    });

    it('getLogoDataUriAsync returns data URI as-is if already base64', async () => {
      const existingDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
      const result = await LogoStorageService.getLogoDataUriAsync(existingDataUri);
      expect(result).toBe(existingDataUri);
    });

    it('getLogoDataUriAsync returns null for empty or undefined input', async () => {
      expect(await LogoStorageService.getLogoDataUriAsync(null)).toBeNull();
      expect(await LogoStorageService.getLogoDataUriAsync(undefined)).toBeNull();
    });

    it('removeLogoAsync executes safely without throwing', async () => {
      await expect(
        LogoStorageService.removeLogoAsync('prof_test_1', '/mock/documents/branding/logo_prof_test_1_123.png')
      ).resolves.not.toThrow();

      await expect(
        LogoStorageService.removeLogoAsync('prof_test_1', null)
      ).resolves.not.toThrow();
    });
  });
});

import * as fs from 'fs';
import * as path from 'path';

/**
 * Automated Secret Scanner Regression Suite
 * Ensures that no private API keys, cloud provider tokens, or hardcoded secrets
 * are committed to client source code or cloud functions.
 */

describe('Security: Credential Exposure & Secret Scanning Regression Guard', () => {
  const SECRET_PATTERNS = [
    { name: 'Groq API Key', regex: /gsk_[a-zA-Z0-9]{20,}/g },
    { name: 'OpenAI Secret Key', regex: /sk-[a-zA-Z0-9]{32,}/g },
    { name: 'Google API Key', regex: /AIzaSy[a-zA-Z0-9_-]{33}/g },
    { name: 'Razorpay Secret / Key ID', regex: /rzp_(?:test|live)_[a-zA-Z0-9]{14,}/g },
  ];

  function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dirPath)) return fileList;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === '.expo' ||
          entry.name === 'dist' ||
          entry.name === 'test-artifacts' ||
          entry.name === 'fixtures'
        ) {
          continue;
        }
        getAllFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.sql'].includes(ext)) {
          fileList.push(fullPath);
        }
      }
    }
    return fileList;
  }

  it('verifies src/ contains zero hardcoded API keys or provider secrets', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    const files = getAllFiles(srcDir);
    const violations: Array<{ file: string; pattern: string; matched: string }> = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const { name, regex } of SECRET_PATTERNS) {
        const matches = content.match(regex);
        if (matches) {
          for (const m of matches) {
            // Mask the found secret in test assertion output
            const masked = m.slice(0, 6) + '...' + m.slice(-4);
            violations.push({ file: path.relative(srcDir, file), pattern: name, matched: masked });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies cloud/ contains zero hardcoded API keys or live credentials', () => {
    const cloudDir = path.resolve(__dirname, '../../cloud');
    const files = getAllFiles(cloudDir);
    const violations: Array<{ file: string; pattern: string; matched: string }> = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const { name, regex } of SECRET_PATTERNS) {
        const matches = content.match(regex);
        if (matches) {
          for (const m of matches) {
            const masked = m.slice(0, 6) + '...' + m.slice(-4);
            violations.push({ file: path.relative(cloudDir, file), pattern: name, matched: masked });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies DEFAULT_GROQ_KEY in AiConfigService is strictly empty string', async () => {
    const { DEFAULT_GROQ_KEY } = await import('../../src/services/ai/AiConfigService');
    expect(DEFAULT_GROQ_KEY).toBe('');
  });
});

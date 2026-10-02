export const documentDirectory = '/mock/documents/';
export const cacheDirectory = '/mock/cache/';

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export async function writeAsStringAsync(uri: string, contents: string, options?: any): Promise<void> {
  return;
}

export async function readAsStringAsync(uri: string, options?: any): Promise<string> {
  return '';
}

export async function deleteAsync(uri: string, options?: any): Promise<void> {
  return;
}

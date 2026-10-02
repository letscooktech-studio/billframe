export async function printToFileAsync(options: { html: string }): Promise<{ uri: string; numberOfPages: number }> {
  return { uri: 'file:///mock/invoice.pdf', numberOfPages: 1 };
}

export async function printAsync(options: { html: string }): Promise<void> {
  return;
}

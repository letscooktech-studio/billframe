/**
 * QR CODE MATRIX & SVG GENERATOR
 * Generates ISO/IEC 18004 compliant QR codes using the industry-standard qrcode engine.
 * Fully offline, deterministic, and scannable by all UPI apps (GPay, PhonePe, Paytm, BHIM)
 * and native smartphone camera scanners (Google Lens, iOS Camera).
 */

import QRCode from 'qrcode';

export class QrCodeGenerator {
  /**
   * Generates a 2D boolean matrix representing the QR Code.
   * `true` = dark module, `false` = light module.
   */
  static generateMatrix(text: string): boolean[][] {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const matrix: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        row.push(qr.modules.get(r, c) === 1);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Generates an SVG path data string (`d="..."`) for all dark modules in the QR matrix.
   */
  static generateSvgPath(matrix: boolean[][]): string {
    const size = matrix.length;
    let path = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          path += `M${c},${r}h1v1h-1z `;
        }
      }
    }
    return path.trim();
  }

  /**
   * Generates a complete inline SVG string ready for HTML/PDF rendering.
   * Includes standard 4-module quiet zone per ISO/IEC 18004.
   */
  static generateSvg(
    data: string,
    pixelSize: number = 120,
    options?: { color?: string; backgroundColor?: string; margin?: number }
  ): string {
    const matrix = this.generateMatrix(data);
    const matrixSize = matrix.length;
    const margin = options?.margin ?? 4;
    const totalSize = matrixSize + margin * 2;
    const path = this.generateSvgPath(matrix);
    const color = options?.color || '#000000';
    const bg = options?.backgroundColor || '#ffffff';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${totalSize} ${totalSize}" width="${pixelSize}" height="${pixelSize}" style="background-color: ${bg}; display: block;">
      <rect x="${-margin}" y="${-margin}" width="${totalSize}" height="${totalSize}" fill="${bg}" />
      <path d="${path}" fill="${color}" />
    </svg>`;
  }
}

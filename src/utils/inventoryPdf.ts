/**
 * Build HTML for selected inventory items and export to PDF via expo-print + share.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Share from 'expo-sharing';
import { InventoryItem } from '../services/inventory';

const deptLabel = (d: string) => (d ?? '').charAt(0) + (d ?? '').slice(1).toLowerCase();

/** Sanitize string for use in a filename (alphanumeric, spaces → underscores). */
function sanitizeFilename(s: string): string {
  return s.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').trim() || 'Inventory';
}

/** Build PDF filename: Department_YYYY-MM-DD_Inventory List.pdf */
function getInventoryPdfFilename(items: InventoryItem[]): string {
  const departments = [...new Set(items.map((i) => i.department ?? 'INTERIOR'))];
  const departmentName =
    departments.length === 1 ? deptLabel(departments[0]) : 'Mixed';
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safeDept = sanitizeFilename(departmentName);
  return `${safeDept}_${dateStr}_Inventory List.pdf`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildInventoryHtml(items: InventoryItem[], title: string = 'Inventory Export'): string {
  const rows = items.map((item) => {
    const dept = deptLabel(item.department ?? 'INTERIOR');
    const tableRows =
      (item.items?.length
        ? item.items
            .filter((r) => r.amount?.trim() || r.item?.trim())
            .map(
              (r) =>
                `<tr><td>${escapeHtml(r.amount)}</td><td>${escapeHtml(r.item)}</td></tr>`
            )
            .join('')
        : '') || '<tr><td colspan="2">—</td></tr>';
    return `
      <div class="item">
        <h3>${escapeHtml(item.title)}</h3>
        <p class="meta"><strong>Department:</strong> ${escapeHtml(dept)}${item.location ? ` &nbsp;|&nbsp; <strong>Location:</strong> ${escapeHtml(item.location)}` : ''}</p>
        ${item.description ? `<p class="desc">${escapeHtml(item.description)}</p>` : ''}
        <table>
          <thead><tr><th>Amount</th><th>Item</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin-top: 22mm;
      margin-bottom: 22mm;
      margin-left: 16mm;
      margin-right: 16mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      font-size: 12px;
      color: #111;
      padding: 0;
      margin: 0;
    }
    h1 { font-size: 18px; margin: 0 0 16px 0; }
    .item {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
      page-break-inside: avoid;
    }
    .item h3 { font-size: 14px; margin: 0 0 6px 0; }
    .meta { color: #555; margin: 4px 0; font-size: 11px; }
    .desc { margin: 6px 0; color: #333; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <div class="content">
    <h1>${escapeHtml(title)}</h1>
    ${rows.join('')}
  </div>
</body>
</html>
  `.trim();
}

export async function exportInventoryToPdf(items: InventoryItem[]): Promise<void> {
  if (items.length === 0) throw new Error('Select at least one item to export.');
  const html = buildInventoryHtml(items, 'Inventory');
  const { uri } = await Print.printToFileAsync({ html });
  const filename = getInventoryPdfFilename(items);
  const newUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.moveAsync({ from: uri, to: newUri });
  const canShare = await Share.isAvailableAsync();
  if (canShare) await Share.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: 'Save Inventory PDF' });
}

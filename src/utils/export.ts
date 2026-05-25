import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Specialty } from '../data/specialties';

const levelLabel: Record<string, string> = {
  bakalavr: 'Bakalavr', magistr: 'Magistr', rezidentura: 'Rezidentura',
  kollec_9: 'Kollec (9-illik)', kollec_11: 'Kollec (11-illik)', subbakalavr: 'Subbakalavr',
};

// ── Excel Export ──────────────────────────────────────────────
export function exportToExcel(specialties: Specialty[], filename = 'DIM_Ixtisaslar') {
  const data = specialties.map(s => ({
    'İxtisas': s.name,
    'Universitet': s.universityName,
    'Şəhər': s.city,
    'Qrup': s.group,
    'Səviyyə': levelLabel[s.level] || s.level,
    'Ödənişli Keçid Balı': s.bal_odenis ?? '—',
    'Dövlət Yeri Balı': s.bal_dovlet ?? '—',
    'Plan Yeri': s.plan,
    'Müraciətçi': s.applicants ?? '—',
    'Xüsusi': s.isSpecial ? 'Bəli' : 'Xeyr',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws['!cols'] = [
    { wch: 45 }, { wch: 50 }, { wch: 14 }, { wch: 8 },
    { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'İxtisaslar');
  XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString('az-AZ').replace(/\./g, '-')}.xlsx`);
}

// ── PDF Export ────────────────────────────────────────────────
export function exportToPDF(specialties: Specialty[], title = 'DİM İxtisas Siyahısı') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 95);
  doc.text(title, 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Tarix: ${new Date().toLocaleDateString('az-AZ')} | ${specialties.length} ixtisas`, 14, 21);

  // Table header
  const headers = ['#', 'İxtisas', 'Universitet', 'Qrup', 'Ödənişli Bal', 'Dövlət Balı', 'Plan'];
  const colWidths = [8, 75, 75, 12, 22, 22, 14];
  const startX = 14;
  let y = 30;

  doc.setFillColor(30, 58, 95);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);

  let x = startX;
  headers.forEach((h, i) => {
    doc.rect(x, y - 5, colWidths[i], 7, 'F');
    doc.text(h, x + 1, y);
    x += colWidths[i];
  });

  // Rows
  doc.setTextColor(30, 30, 50);
  y += 5;

  specialties.forEach((s, idx) => {
    if (y > 190) {
      doc.addPage();
      y = 20;
    }

    const rowColor = idx % 2 === 0 ? [245, 247, 250] : [255, 255, 255];
    doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);

    x = startX;
    const cells = [
      String(idx + 1),
      s.name.length > 45 ? s.name.slice(0, 43) + '…' : s.name,
      (s.universityShort || s.universityName).length > 45 ? (s.universityShort || s.universityName).slice(0, 43) + '…' : (s.universityShort || s.universityName),
      s.group,
      s.bal_odenis ? String(s.bal_odenis) : '—',
      s.bal_dovlet ? String(s.bal_dovlet) : '—',
      String(s.plan),
    ];

    cells.forEach((cell, i) => {
      doc.rect(x, y - 4, colWidths[i], 6, 'F');
      doc.text(cell, x + 1, y);
      x += colWidths[i];
    });

    y += 6;
  });

  doc.save(`DIM_Ixtisaslar_${new Date().toLocaleDateString('az-AZ').replace(/\./g, '-')}.pdf`);
}

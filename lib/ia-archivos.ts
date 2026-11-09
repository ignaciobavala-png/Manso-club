import type { ArchivoIA } from '@/lib/ia-herramientas';

/** Lo que se le manda al asistente de una planilla: texto con las filas, con tope para no gastar de más. */
const MAX_CARACTERES = 12000;

export interface Planilla { nombre: string; texto: string; recortado: boolean }

export const esPlanilla = (f: File) => /\.(xlsx|csv)$/i.test(f.name);

function celda(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[]; hyperlink?: string };
    if (o.richText) return o.richText.map(r => r.text).join('');
    if (o.result !== undefined) return celda(o.result);
    return o.text ?? o.hyperlink ?? '';
  }
  return String(v).replace(/\s+/g, ' ').trim();
}

/** Lee un .xlsx o .csv en el navegador y lo deja como texto "col | col | col", una fila por renglón. */
export async function leerPlanilla(file: File): Promise<Planilla> {
  const bloques: string[] = [];
  if (/\.csv$/i.test(file.name)) {
    bloques.push((await file.text()).replace(/\r/g, ''));
  } else {
    const ExcelJS = (await import('exceljs')).default;
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(await file.arrayBuffer());
    libro.eachSheet(hoja => {
      const filas: string[] = [];
      hoja.eachRow({ includeEmpty: false }, fila => {
        const valores = (fila.values as unknown[]).slice(1).map(celda);
        if (valores.some(Boolean)) filas.push(valores.join(' | '));
      });
      if (filas.length) bloques.push(`## Hoja: ${hoja.name}\n${filas.join('\n')}`);
    });
  }
  const completo = bloques.join('\n\n').trim();
  if (!completo) throw new Error('El archivo está vacío.');
  const recortado = completo.length > MAX_CARACTERES;
  return {
    nombre: file.name,
    texto: recortado ? `${completo.slice(0, MAX_CARACTERES)}\n[…recortado: el archivo tiene más filas]` : completo,
    recortado,
  };
}

const descargar = (blob: Blob, nombre: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Arma el Excel o el PDF en el navegador y lo baja. */
export async function descargarArchivo(a: ArchivoIA): Promise<void> {
  if (a.formato === 'excel') {
    const ExcelJS = (await import('exceljs')).default;
    const libro = new ExcelJS.Workbook();
    for (const h of a.hojas) {
      const hoja = libro.addWorksheet(h.nombre.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Hoja');
      hoja.addRow(h.columnas).font = { bold: true };
      h.filas.forEach(f => hoja.addRow(f));
      hoja.columns.forEach((c, i) => {
        const ancho = Math.max(h.columnas[i]?.length ?? 8, ...h.filas.map(f => String(f[i] ?? '').length));
        c.width = Math.min(Math.max(ancho + 2, 10), 50);
      });
      hoja.views = [{ state: 'frozen', ySplit: 1 }];
    }
    const buf = await libro.xlsx.writeBuffer();
    descargar(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${a.nombre}.xlsx`);
    return;
  }
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const horizontal = a.hojas.some(h => h.columnas.length > 5);
  const doc = new jsPDF({ orientation: horizontal ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  let y = 48;
  if (a.titulo) {
    doc.setFont('helvetica', 'bold').setFontSize(16).text(a.titulo, 40, y);
    y += 24;
  }
  for (const h of a.hojas) {
    if (a.hojas.length > 1) {
      doc.setFont('helvetica', 'bold').setFontSize(12).text(h.nombre, 40, y);
      y += 10;
    }
    autoTable(doc, {
      startY: y,
      head: [h.columnas],
      body: h.filas.map(f => f.map(c => (c === null ? '' : String(c)))),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [0, 0, 0] },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  }
  doc.save(`${a.nombre}.pdf`);
}

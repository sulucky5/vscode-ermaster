import { ERDiagram } from '../types/erm.types.js';

function esc(s: string = ''): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderDiagramToSvg(diagram: ERDiagram): { svg: string; width: number; height: number } {
  const tables = diagram.tables || [];
  const views = diagram.views || [];
  const notes = diagram.notes || [];
  const categories = diagram.categories || [];
  const relations = diagram.relations || [];

  const getTableSize = (t: (typeof tables)[number]) => {
    const w = Math.max(t.width || 240, diagram.viewMode === 'both' ? 280 : 240);
    const headerH = diagram.viewMode === 'both' && t.logicalName ? 44 : 32;
    const cols = t.columns || [];
    const bodyH = diagram.notationLevel === 'title' ? 0 : Math.max(1, cols.length) * 22 + 10;
    const h = Math.max(t.height || 0, headerH + bodyH);
    return { w, h, headerH };
  };

  const getNoteSize = (n: (typeof notes)[number]) => {
    const lines = (n.text || '').split(/\r?\n/);
    const maxLineLen = Math.max(10, ...lines.map((l) => l.length));
    const w = Math.max(n.width || 180, Math.min(480, maxLineLen * 7 + 24));
    const h = Math.max(n.height || 80, lines.length * 16 + 20);
    return { w, h, lines };
  };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const track = (x: number, y: number, w: number, h: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  };

  for (const c of categories) track(c.x, c.y, c.width || 400, c.height || 300);
  for (const t of tables) {
    const { w, h } = getTableSize(t);
    track(t.x, t.y, w, h);
  }
  for (const v of views) track(v.x, v.y, v.width || 220, v.height || 100);
  for (const n of notes) {
    const { w, h } = getNoteSize(n);
    track(n.x, n.y, w, h);
  }

  if (!isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  const pad = 48;
  const vx = Math.floor(minX - pad);
  const vy = Math.floor(minY - pad);
  const vw = Math.max(800, Math.ceil(maxX - minX + pad * 2));
  const vh = Math.max(600, Math.ceil(maxY - minY + pad * 2));

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${vx} ${vy} ${vw} ${vh}">`
  );
  parts.push(`<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#ffffff"/>`);

  // 1. Categories
  for (const cat of categories) {
    const c = cat.color || { r: 137, g: 180, b: 250 };
    const cw = cat.width || 400;
    const ch = cat.height || 300;
    const catName = cat.name || '';
    parts.push(
      `<rect x="${cat.x}" y="${cat.y}" width="${cw}" height="${ch}" rx="10" fill="rgba(${c.r},${c.g},${c.b},0.08)" stroke="rgb(${c.r},${c.g},${c.b})" stroke-width="1.5" stroke-dasharray="6,4"/>`
    );
    parts.push(
      `<rect x="${cat.x}" y="${cat.y}" width="${Math.min(cw, Math.max(90, catName.length * 10 + 24))}" height="24" rx="6" fill="rgba(${c.r},${c.g},${c.b},0.22)"/>`
    );
    parts.push(
      `<text x="${cat.x + 10}" y="${cat.y + 16}" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="700" fill="rgb(${Math.max(0, c.r - 40)},${Math.max(0, c.g - 40)},${Math.max(0, c.b - 40)})">${esc(catName)}</text>`
    );
  }

  // 2. Relations
  const tableMap = new Map(tables.map((t) => [t.id, t]));
  for (const rel of relations) {
    const src = tableMap.get(rel.sourceTableId);
    const tgt = tableMap.get(rel.targetTableId);
    if (!src || !tgt) continue;
    const ss = getTableSize(src);
    const ts = getTableSize(tgt);
    const stroke = rel.referenceForPK ? '#d6336c' : '#3b82f6';
    const dash = rel.referenceForPK ? '' : 'stroke-dasharray="5,4"';

    if (src.id === tgt.id) {
      const sx = src.x + ss.w;
      const sy = src.y + 32;
      const tx = src.x + ss.w - 44;
      const ty = src.y;
      const ox = sx + 36;
      const oy = ty - 36;
      parts.push(
        `<path d="M ${sx} ${sy} L ${ox} ${sy} L ${ox} ${oy} L ${tx} ${oy} L ${tx} ${ty}" fill="none" stroke="${stroke}" stroke-width="1.8" ${dash}/>`
      );
    } else {
      const sCx = src.x + ss.w / 2;
      const sCy = src.y + ss.h / 2;
      const tCx = tgt.x + ts.w / 2;
      const tCy = tgt.y + ts.h / 2;
      const midX = (sCx + tCx) / 2;
      parts.push(
        `<path d="M ${sCx} ${sCy} L ${midX} ${sCy} L ${midX} ${tCy} L ${tCx} ${tCy}" fill="none" stroke="${stroke}" stroke-width="1.8" ${dash}/>`
      );
      if (rel.name) {
        parts.push(
          `<text x="${midX}" y="${(sCy + tCy) / 2 - 4}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="#334155">${esc(rel.name)}</text>`
        );
      }
    }
  }

  // 3. Tables
  for (const t of tables) {
    const { w, h, headerH } = getTableSize(t);
    const c = t.color || { r: 79, g: 129, b: 189 };
    const borderCol = `rgb(${c.r},${c.g},${c.b})`;
    const headerBg = `rgba(${c.r},${c.g},${c.b},0.18)`;

    parts.push(
      `<rect x="${t.x}" y="${t.y}" width="${w}" height="${h}" rx="6" fill="#ffffff" stroke="${borderCol}" stroke-width="1.6"/>`
    );
    parts.push(
      `<rect x="${t.x}" y="${t.y}" width="${w}" height="${headerH}" rx="6" fill="${headerBg}"/>`
    );
    parts.push(
      `<line x1="${t.x}" y1="${t.y + headerH}" x2="${t.x + w}" y2="${t.y + headerH}" stroke="${borderCol}" stroke-width="1"/>`
    );

    const physName = t.physicalName || '';
    const title =
      diagram.viewMode === 'logical'
        ? t.logicalName || physName
        : diagram.capital
        ? physName.toUpperCase()
        : physName;
    parts.push(
      `<text x="${t.x + 10}" y="${t.y + 20}" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="700" fill="#1e293b">${esc(title)}</text>`
    );
    if (diagram.viewMode === 'both' && t.logicalName && t.logicalName !== physName) {
      parts.push(
        `<text x="${t.x + 10}" y="${t.y + 36}" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="#64748b">${esc(t.logicalName)}</text>`
      );
    }

    if (diagram.notationLevel !== 'title') {
      (t.columns || []).forEach((col, idx) => {
        const cy = t.y + headerH + 17 + idx * 22;
        const badge = col.primaryKey ? '[PK] ' : col.foreignKey ? '[FK] ' : '';
        const colPhys = col.physicalName || '';
        const colBaseName =
          diagram.viewMode === 'logical'
            ? col.logicalName || colPhys
            : diagram.capital
            ? colPhys.toUpperCase()
            : colPhys;
        const colSubName =
          diagram.viewMode === 'both' && col.logicalName && col.logicalName !== colPhys
            ? ` (${col.logicalName})`
            : '';
        const colName = `${colBaseName}${colSubName}`;
        const colType = col.type || '';
        const typeStr = col.length
          ? `${colType}(${col.length}${col.decimal ? `,${col.decimal}` : ''})`
          : colType;
        parts.push(
          `<text x="${t.x + 10}" y="${cy}" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="${col.primaryKey ? '700' : '400'}" fill="${col.primaryKey ? '#be123c' : '#334155'}">${esc(badge + colName)}</text>`
        );
        parts.push(
          `<text x="${t.x + w - 10}" y="${cy}" text-anchor="end" font-family="Consolas, monospace" font-size="10" fill="#64748b">${esc(typeStr)}</text>`
        );
      });
    }
  }

  // 4. Views
  for (const v of views) {
    const vwBox = v.width || 220;
    const vhBox = v.height || 100;
    parts.push(
      `<rect x="${v.x}" y="${v.y}" width="${vwBox}" height="${vhBox}" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>`
    );
    parts.push(
      `<text x="${v.x + 10}" y="${v.y + 20}" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="700" fill="#166534">[View] ${esc(v.physicalName)}</text>`
    );
  }

  // 5. Notes
  for (const n of notes) {
    const { w: nw, h: nh, lines } = getNoteSize(n);
    parts.push(
      `<rect x="${n.x}" y="${n.y}" width="${nw}" height="${nh}" rx="6" fill="#fef9c3" stroke="#eab308" stroke-width="1.2"/>`
    );
    lines.forEach((line, idx) => {
      parts.push(
        `<text x="${n.x + 10}" y="${n.y + 20 + idx * 16}" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="#713f12">${esc(line)}</text>`
      );
    });
  }

  parts.push('</svg>');
  return { svg: parts.join('\n'), width: vw, height: vh };
}

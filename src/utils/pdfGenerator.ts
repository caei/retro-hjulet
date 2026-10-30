import jsPDF from 'jspdf';
import { RetroBoard, SpiderCategory, Claim, Category } from '../types/retro';
import { Language, translations } from '../i18n/translations';

/**
 * Render high-resolution visual Spider / Radar Chart to an offscreen Canvas
 * and return PNG data URL for crisp embedding into jsPDF.
 */
function renderSpiderChartCanvas(categories: SpiderCategory[], size = 800): string {
  if (typeof document === 'undefined' || !categories || categories.length < 3) {
    return '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const center = size / 2;
  const radius = size * 0.35; // Maximum radius for score 10
  const numAxes = categories.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Background smooth circular fill
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(center, center, radius + 2, 0, 2 * Math.PI);
  ctx.fill();

  // Draw concentric polygon web rings (levels 2, 4, 6, 8, 10)
  const levels = [2, 4, 6, 8, 10];
  levels.forEach(lvl => {
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = (lvl / 10) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = lvl === 10 ? '#64748b' : '#cbd5e1';
    ctx.lineWidth = lvl === 10 ? 2 : 1;
    if (lvl !== 10) ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);
    ctx.stroke();

    // Level number label along the vertical top axis
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(lvl.toString(), center + 6, center - (lvl / 10) * radius);
  });
  ctx.setLineDash([]);

  // Axis lines from center to outer ring
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const cat = categories[i];
    const isHigh = cat.isHighFocus || cat.averageScore >= 6.5;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + radius * Math.cos(angle), center + radius * Math.sin(angle));
    ctx.strokeStyle = isHigh ? '#ef4444' : '#94a3b8';
    ctx.lineWidth = isHigh ? 2.5 : 1.5;
    ctx.stroke();
  }

  // Radar Polygon fill
  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const score = Math.max(0.5, Math.min(10, categories[i].averageScore));
    const r = (score / 10) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = 'rgba(99, 102, 241, 0.35)'; // Semi-transparent indigo
  ctx.fill();
  ctx.strokeStyle = '#4f46e5'; // Indigo border
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Vertices points
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const score = Math.max(0.5, Math.min(10, categories[i].averageScore));
    const r = (score / 10) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = categories[i].color || '#4f46e5';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Center Hub
  ctx.beginPath();
  ctx.arc(center, center, 22, 0, 2 * Math.PI);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();

  const totalAvg = (categories.reduce((acc, c) => acc + c.averageScore, 0) / categories.length).toFixed(1);
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(totalAvg, center, center);

  // Outer Category Labels & Score Tags
  for (let i = 0; i < numAxes; i++) {
    const cat = categories[i];
    const isHigh = cat.isHighFocus || cat.averageScore >= 6.5;
    const angle = i * angleStep - Math.PI / 2;
    const labelDist = radius + 32;
    const lx = center + labelDist * Math.cos(angle);
    const ly = center + labelDist * Math.sin(angle);

    // Text align
    if (Math.abs(Math.cos(angle)) < 0.28) {
      ctx.textAlign = 'center';
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = 'left';
    } else {
      ctx.textAlign = 'right';
    }

    // Category name
    ctx.font = isHigh ? 'bold 18px sans-serif' : '600 17px sans-serif';
    ctx.fillStyle = isHigh ? '#dc2626' : '#0f172a';
    ctx.fillText((isHigh ? '🚨 ' : '') + cat.name, lx, ly - 5);

    // Score badge
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = cat.color || '#4f46e5';
    ctx.fillText(`${cat.averageScore.toFixed(1)} / 10`, lx, ly + 16);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Render mini Stress Wheel for a participant to an offscreen Canvas
 */
function renderMiniStressWheelCanvas(claims: Claim[], categories: Category[], size = 300): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const center = size / 2;
  const innerRadius = size * 0.18;
  const maxOuterRadius = size * 0.44;
  const radiusRange = maxOuterRadius - innerRadius;

  const categoryMap = new Map<string, Category>();
  categories.forEach(c => categoryMap.set(c.id, c));

  const total = claims.length;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(center, center, maxOuterRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (total > 0) {
    const sliceAngle = (2 * Math.PI) / total;
    claims.forEach((claim, idx) => {
      const startAngle = idx * sliceAngle - Math.PI / 2;
      const endAngle = (idx + 1) * sliceAngle - Math.PI / 2;
      const scoreRatio = Math.max(0.15, Math.min(1, claim.score / 10));
      const sliceR = innerRadius + scoreRatio * radiusRange;

      const cat = categoryMap.get(claim.categoryId);
      ctx.fillStyle = cat ? cat.color : '#6366f1';

      ctx.beginPath();
      ctx.arc(center, center, sliceR, startAngle, endAngle);
      ctx.arc(center, center, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // Center donut
  ctx.beginPath();
  ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#0b0f19';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const avg = total > 0 ? (claims.reduce((s, c) => s + c.score, 0) / total).toFixed(1) : '0';
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(avg, center, center);

  return canvas.toDataURL('image/png');
}

export function exportBoardToPdf(board: RetroBoard, language: Language = 'nb') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const tPdf = translations[language]?.pdf || translations.nb.pdf;
  const appName = translations[language]?.appTitle || 'RetroHjulet';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174 mm
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text(`${appName} • ${board.title} • ID: ${board.id}`, margin, y - 5);
    doc.setDrawColor(220, 225, 235);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  };

  // --- Document Header ---
  // Brand Pill
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.roundedRect(margin, y, 32, 6, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(tPdf.retroReport, margin + 2.5, y + 4.2);

  // Board ID Tag
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - margin - 35, y, 35, 6, 1.5, 1.5, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(`ID: ${board.id}`, pageWidth - margin - 32, y + 4.2);

  y += 12;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(board.title, margin, y);

  y += 7;

  // Date and Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  const dateLocale = language === 'en' ? 'en-US' : (language === 'nn' ? 'nn-NO' : 'nb-NO');
  const formattedDate = new Date(board.createdAt).toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const conductedLabel = language === 'en' ? 'Conducted' : (language === 'nn' ? 'Fullført' : 'Gjennomført');
  const participantsLabel = language === 'en' ? 'Participants' : (language === 'nn' ? 'Deltakarar' : 'Deltakere');
  const claimsLabel = language === 'en' ? 'Statements' : (language === 'nn' ? 'Påstandar' : 'Påstander');
  doc.text(`${conductedLabel}: ${formattedDate}  |  ${participantsLabel}: ${board.participants.length}  |  ${claimsLabel}: ${board.claims.length}`, margin, y);

  if (board.description) {
    y += 5;
    const descLines = doc.splitTextToSize(board.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4;
  }

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Key Summary Stats ---
  const totalClaims = board.claims.length;
  const overallAvg = totalClaims > 0
    ? (board.claims.reduce((acc, c) => acc + c.score, 0) / totalClaims).toFixed(1)
    : '0';

  const highFocusCats = board.spiderCategories.filter(c => c.isHighFocus || c.averageScore >= 6.5);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  const statColWidth = contentWidth / 3;

  // Stat 1: Snitt stress
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(tPdf.overallStressIndex, margin + 8, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(Number(overallAvg) >= 7 ? 225 : 15, Number(overallAvg) >= 7 ? 29 : 23, Number(overallAvg) >= 7 ? 72 : 42);
  doc.text(`${overallAvg} / 10`, margin + 8, y + 15);

  // Stat 2: Fokusområder
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const focusTitle = language === 'en' ? 'IDENTIFIED FOCUS AREAS' : (language === 'nn' ? 'IDENTIFISERTE FOKUSOMRÅDE' : 'IDENTIFISERTE FOKUSOMRÅDER');
  doc.text(focusTitle, margin + statColWidth + 8, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(highFocusCats.length > 0 ? 225 : 16, highFocusCats.length > 0 ? 29 : 185, highFocusCats.length > 0 ? 72 : 129);
  const areasSuffix = language === 'en' ? 'areas' : (language === 'nn' ? 'område' : 'områder');
  doc.text(`${highFocusCats.length} ${areasSuffix}`, margin + statColWidth + 8, y + 15);

  // Stat 3: Deltakelse
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const partTitle = language === 'en' ? 'TEAM PARTICIPATION' : (language === 'nn' ? 'TEAMDELTAKING' : 'TEAMDELTAKELSE');
  doc.text(partTitle, margin + statColWidth * 2 + 8, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${board.participants.length} ${participantsLabel.toLowerCase()}`, margin + statColWidth * 2 + 8, y + 15);

  y += 28;

  // --- AI Synthesis Section ---
  if (board.aiSynthesis) {
    checkPageBreak(50);
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(49, 46, 129); // Indigo 900
    doc.text('KI-oppsummering & Innsikt (Gemini AI)', margin + 4, y + 5.5);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(board.aiSynthesis.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 4;

    // Prioriterte fokusområder (clean bullet, no broken utf-8 glyphs)
    if (board.aiSynthesis.focusAreas?.length > 0) {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28);
      doc.text('Prioriterte fokusområder:', margin, y);
      y += 5;

      board.aiSynthesis.focusAreas.forEach(area => {
        checkPageBreak(12);
        // Draw red bullet circle
        doc.setFillColor(220, 38, 38);
        doc.circle(margin + 2.5, y + 1.5, 1.2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(area, contentWidth - 8);
        doc.text(lines, margin + 6, y + 2.5);
        y += lines.length * 4.2 + 2;
      });
      y += 2;
    }

    // Anbefalte tiltak (clean bullet, crisp Helvetica font, NO corrupted arrows!)
    if (board.aiSynthesis.recommendations?.length > 0) {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(4, 120, 87);
      doc.text('Anbefalte tiltak for neste sprint/periode:', margin, y);
      y += 5;

      board.aiSynthesis.recommendations.forEach(rec => {
        checkPageBreak(12);
        // Draw emerald green bullet circle
        doc.setFillColor(16, 185, 129);
        doc.circle(margin + 2.5, y + 1.5, 1.2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(rec, contentWidth - 8);
        doc.text(lines, margin + 6, y + 2.5);
        y += lines.length * 4.2 + 2;
      });
      y += 4;
    }
  }

  // --- VISUELT EDDERKOPPDIAGRAM (Spider Chart Image) ---
  if (board.spiderCategories.length >= 3) {
    checkPageBreak(90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    const radarTitle = language === 'en' ? 'Team Spider Chart (Radar Chart)' : 'Edderkoppdiagram (Radar Chart)';
    doc.text(radarTitle, margin, y);
    y += 5;

    const chartImg = renderSpiderChartCanvas(board.spiderCategories, 750);
    if (chartImg) {
      const chartWidthMm = 90;
      const chartHeightMm = 90;
      const chartX = margin + (contentWidth - chartWidthMm) / 2;
      doc.addImage(chartImg, 'PNG', chartX, y, chartWidthMm, chartHeightMm);
      y += chartHeightMm + 8;
    }
  }

  // --- Spider Categories Table with FULL UNTRUNCATED Hovedinnsikt ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const catResultTitle = language === 'en' ? 'Category Results & Key Insights' : (language === 'nn' ? 'Kategoriresultat og Hovudinnsikt' : 'Kategoriresultat og Hovedinnsikt');
  doc.text(catResultTitle, margin, y);
  y += 6;

  // Table columns: Kategori (40mm), Snitt Stress (24mm), Status (26mm), Hovedinnsikt (84mm)
  const colCat = margin;
  const colScore = margin + 42;
  const colStatus = margin + 68;
  const colTakeaway = margin + 96;
  const colTakeawayWidth = contentWidth - 96; // 78 mm

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(tPdf.colCategory, colCat + 3, y + 4.8);
  doc.text(tPdf.colAvgStress, colScore, y + 4.8);
  doc.text(tPdf.colStatus, colStatus, y + 4.8);
  doc.text(tPdf.colTakeaway, colTakeaway, y + 4.8);
  y += 7;

  board.spiderCategories.forEach(cat => {
    const isHigh = cat.isHighFocus || cat.averageScore >= 6.5;
    const takeaway = cat.keyTakeaway || cat.description || '-';

    // Word wrap the takeaway lines so it NEVER truncates!
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const takeawayLines = doc.splitTextToSize(takeaway, colTakeawayWidth);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const catNameLines = doc.splitTextToSize(cat.name, 38);

    const rowHeight = Math.max(9, Math.max(takeawayLines.length, catNameLines.length) * 4.2 + 3);
    checkPageBreak(rowHeight);

    // Subtle background for high focus rows
    if (isHigh) {
      doc.setFillColor(254, 242, 242);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    // Category name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(catNameLines, colCat + 3, y + 4.5);

    // Snitt Stress
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${cat.averageScore.toFixed(1)} / 10`, colScore, y + 4.5);

    // Status pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (isHigh) {
      doc.setTextColor(220, 38, 38);
      doc.text(tPdf.statusCritical, colStatus, y + 4.5);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text(tPdf.statusNormal, colStatus, y + 4.5);
    }

    // FULL Hovedinnsikt text (no .substring(0, 32)!)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(takeawayLines, colTakeaway, y + 4.5);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    y += rowHeight;
  });

  y += 10;

  // --- Individual Participant Stress Wheels & Claims ---
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(tPdf.individualSectionTitle, margin, y);
  y += 6;

  const categoryMap = new Map(board.categories.map(c => [c.id, c.name]));

  board.participants.forEach(p => {
    const pClaims = board.claims.filter(c => c.participantId === p.id);
    const pAvg = pClaims.length > 0
      ? (pClaims.reduce((acc, c) => acc + c.score, 0) / pClaims.length).toFixed(1)
      : '0';

    checkPageBreak(25 + Math.min(pClaims.length, 3) * 8);

    // Participant Header Box with avatar color
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${p.name} ${tPdf.userWheelOf}`, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${tPdf.avg}: ${pAvg}/10  •  ${pClaims.length} ${tPdf.claims}`, pageWidth - margin - 50, y + 5.5);

    y += 11;

    // Render mini stress wheel for participant
    const miniWheelImg = renderMiniStressWheelCanvas(pClaims, board.categories, 240);
    const hasMiniWheel = !!miniWheelImg && pClaims.length > 0;
    const wheelSize = 28;

    if (hasMiniWheel) {
      checkPageBreak(wheelSize + 6);
      doc.addImage(miniWheelImg, 'PNG', margin + 2, y, wheelSize, wheelSize);
    }

    const claimsLeftMargin = hasMiniWheel ? margin + wheelSize + 6 : margin;
    const claimsWidth = hasMiniWheel ? contentWidth - wheelSize - 6 : contentWidth;

    if (pClaims.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(tPdf.noClaims, margin + 4, y + 4);
      y += 8;
    } else {
      let claimY = y;
      pClaims.forEach((claim) => {
        const cat = board.categories.find(c => c.id === claim.categoryId);
        const catName = cat?.name || (language === 'en' ? 'General' : 'Generelt');
        const catColorHex = cat?.color || '#4f46e5';

        // Parse hex color for category indicator
        const hex = catColorHex.replace('#', '');
        const cr = parseInt(hex.substring(0, 2), 16) || 79;
        const cg = parseInt(hex.substring(2, 4), 16) || 70;
        const cb = parseInt(hex.substring(4, 6), 16) || 229;

        // Split claim text to ensure it never overflows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const textLines = doc.splitTextToSize(`"${claim.text}"`, claimsWidth - 2);

        let noteLines: string[] = [];
        if (claim.notes) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          noteLines = doc.splitTextToSize(`${tPdf.note}: ${claim.notes}`, claimsWidth - 4);
        }

        const claimBlockHeight = 9 + textLines.length * 4.5 + (noteLines.length > 0 ? noteLines.length * 3.8 + 2 : 0) + 7;
        checkPageBreak(claimBlockHeight);

        // --- LINE 1: Score Badge + Category Pill ---
        // Score badge background with border
        doc.setFillColor(claim.score >= 7 ? 254 : 241, claim.score >= 7 ? 242 : 245, claim.score >= 7 ? 242 : 249);
        doc.setDrawColor(claim.score >= 7 ? 252 : 226, claim.score >= 7 ? 165 : 232, claim.score >= 7 ? 165 : 240);
        doc.roundedRect(claimsLeftMargin, claimY, 16, 5.2, 1, 1, 'FD');
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(claim.score >= 7 ? 220 : 71, claim.score >= 7 ? 38 : 85, claim.score >= 7 ? 38 : 105);
        doc.text(`${claim.score}/10`, claimsLeftMargin + 2.2, claimY + 3.7);

        // Category dot and name
        doc.setFillColor(cr, cg, cb);
        doc.circle(claimsLeftMargin + 21, claimY + 2.6, 1.3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(cr, cg, cb);
        doc.text(`[${catName}]`, claimsLeftMargin + 24.5, claimY + 3.7);

        // Generous vertical breathing room between badge line and statement text
        claimY += 8.5;

        // --- LINE 2: Claim Statement Text ---
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(textLines, claimsLeftMargin, claimY);
        claimY += textLines.length * 4.5;

        // --- LINE 3: Notes (if any) ---
        if (noteLines.length > 0) {
          claimY += 2;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.text(noteLines, claimsLeftMargin, claimY);
          claimY += noteLines.length * 3.8;
        }

        // Generous divider spacing between claims
        claimY += 3.5;
        doc.setDrawColor(241, 245, 249);
        doc.line(claimsLeftMargin, claimY, claimsLeftMargin + claimsWidth, claimY);
        claimY += 4.5;
      });

      y = Math.max(y + (hasMiniWheel ? wheelSize + 6 : 0), claimY + 2);
    }
    y += 6;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${tPdf.page} ${i} ${tPdf.of} ${totalPages} • ${tPdf.generatedWith}`,
      margin,
      pageHeight - 8
    );
  }

  // Save the PDF file
  const safeTitle = board.title.replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
  doc.save(`${safeTitle}_retrospektiv.pdf`);
}

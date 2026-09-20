import * as THREE from 'three';
import { SpatialNodeData } from '../types';

/**
 * Creates a high-fidelity crisp canvas texture for 3D floating spatial UI nodes
 */
export function createNodeTexture(
  node: SpatialNodeData,
  isHovered: boolean = false,
  isSelected: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  // High-DPI canvas resolution for ultra-sharp text in 3D
  const width = 1024;
  const height = 560;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Card Background with rounded corners
  const radius = 28;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // Background Fill
  if (isSelected) {
    ctx.fillStyle = '#FFFFFF';
  } else if (isHovered) {
    ctx.fillStyle = '#FFFFFF';
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  }
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid dots on card
  ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
  const dotSpacing = 32;
  for (let x = 20; x < width; x += dotSpacing) {
    for (let y = 20; y < height; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Header band
  if (isSelected) {
    ctx.fillStyle = '#1A1A19';
    ctx.fillRect(0, 0, width, 88);
  } else if (isHovered) {
    ctx.fillStyle = '#F4F4F0';
    ctx.fillRect(0, 0, width, 88);
  } else {
    ctx.fillStyle = '#FAFAF8';
    ctx.fillRect(0, 0, width, 88);
  }

  // Header Divider
  ctx.strokeStyle = isSelected ? '#000000' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 88);
  ctx.lineTo(width, 88);
  ctx.stroke();

  // --- HEADER CONTENT ---
  // Status indicator dot
  const dotColor = node.status === 'ACTIVE' ? '#16A34A' : '#2563EB';
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(48, 44, 7, 0, Math.PI * 2);
  ctx.fill();

  // Node Code, Sector & Topology Label
  ctx.font = '700 24px "Rajdhani", sans-serif';
  ctx.fillStyle = isSelected ? '#FFFFFF' : '#1A1A19';
  const labelTag = node.topologyLabel ? ` [${node.topologyLabel}]` : '';
  const mediaTag = (node.imageUrl || node.mediaAttachment) ? ' 📷' : '';
  ctx.fillText(`${node.code} // 【${node.sector || node.category}】${labelTag}${mediaTag}`, 70, 52);

  // Status Badge Pill on Right
  const badgeText = `${node.status} // r=${(node.radius_r ?? 0.1).toFixed(2)}`;
  ctx.font = '600 20px "Rajdhani", sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 28;
  const badgeX = width - 40 - badgeWidth;
  const badgeY = 24;

  ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.05)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, 38, 19);
  ctx.fill();

  ctx.fillStyle = isSelected ? '#FFFFFF' : '#3A3A38';
  ctx.fillText(badgeText, badgeX + 14, badgeY + 26);

  // --- MAIN TITLE ---
  ctx.font = '700 40px "Rajdhani", sans-serif';
  ctx.fillStyle = '#1A1A19';
  ctx.fillText(node.title, 44, 150);

  // Summary Text (2 lines wrap)
  ctx.font = '400 24px "Rajdhani", sans-serif';
  ctx.fillStyle = '#4A4A48';
  
  // Wrap summary
  const words = node.summary.split(' ');
  let line = '';
  let lineY = 196;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > width - 100 && n > 0) {
      ctx.fillText(line, 44, lineY);
      line = words[n] + ' ';
      lineY += 32;
      if (lineY > 240) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 44, lineY);

  // --- SPARKLINE & METRICS AREA ---
  const sparkY = 280;
  const sparkHeight = 110;
  const sparkWidth = 440;
  const sparkX = width - sparkWidth - 44;

  // Background box for sparkline
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
  ctx.beginPath();
  ctx.roundRect(sparkX, sparkY, sparkWidth, sparkHeight, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.stroke();

  // Draw sparkline curve
  const data = node.metrics[0]?.sparkline || [20, 30, 25, 45, 60, 55, 75];
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const px = sparkX + 24 + (i / (data.length - 1)) * (sparkWidth - 48);
    const py = sparkY + sparkHeight - 20 - ((data[i] - minVal) / range) * (sparkHeight - 40);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = isSelected ? '#1A1A19' : isHovered ? '#3A3A38' : '#71717A';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Metric 1 (Left of sparkline)
  const metric1 = node.metrics[0];
  if (metric1) {
    ctx.font = '600 18px "Rajdhani", sans-serif';
    ctx.fillStyle = '#8C8C88';
    ctx.fillText(metric1.label, 44, 305);

    ctx.font = '700 38px "Rajdhani", sans-serif';
    ctx.fillStyle = '#1A1A19';
    ctx.fillText(metric1.value, 44, 350);

    ctx.font = '600 20px "Rajdhani", sans-serif';
    ctx.fillStyle = metric1.trend.startsWith('+') ? '#16A34A' : '#4B5563';
    ctx.fillText(`▲ ${metric1.trend}`, 44, 385);
  }

  // Metric 2
  const metric2 = node.metrics[1];
  if (metric2) {
    const m2X = 240;
    ctx.font = '600 18px "Rajdhani", sans-serif';
    ctx.fillStyle = '#8C8C88';
    ctx.fillText(metric2.label, m2X, 305);

    ctx.font = '700 38px "Rajdhani", sans-serif';
    ctx.fillStyle = '#1A1A19';
    ctx.fillText(metric2.value, m2X, 350);

    ctx.font = '600 20px "Rajdhani", sans-serif';
    ctx.fillStyle = '#2563EB';
    ctx.fillText(`● ${metric2.trend}`, m2X, 385);
  }

  // Divider before footer
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(44, 430);
  ctx.lineTo(width - 44, 430);
  ctx.stroke();

  // --- FOOTER BAR ---
  // Coordinates & Latency
  ctx.font = '500 22px "Rajdhani", monospace';
  ctx.fillStyle = '#787874';
  const posText = `XYZ: [${node.position[0].toFixed(1)}, ${node.position[1].toFixed(1)}, ${node.position[2].toFixed(1)}] // LAT: ${node.telemetry.latency}`;
  ctx.fillText(posText, 44, 480);

  // Interaction call to action
  const actionLabel = isSelected ? '● CURRENTLY FOCUSED' : isHovered ? 'CLICK TO ENTER INSPECT MODE →' : 'GESTURE HOVER TO EXPAND';
  ctx.font = '700 22px "Rajdhani", sans-serif';
  ctx.fillStyle = isSelected ? '#1A1A19' : isHovered ? '#1A1A19' : '#A1A19E';
  const actionWidth = ctx.measureText(actionLabel).width;
  ctx.fillText(actionLabel, width - 44 - actionWidth, 480);

  // Restore clip
  ctx.restore();

  // Outer Border Stroke
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  if (isSelected) {
    ctx.strokeStyle = '#1A1A19';
    ctx.lineWidth = 8;
  } else if (isHovered) {
    ctx.strokeStyle = '#3A3A38';
    ctx.lineWidth = 6;
  } else {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 3;
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

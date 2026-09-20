import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Camera, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileCode, 
  Database,
  ArrowRight
} from 'lucide-react';
import { DiscoverySector, NodeMediaAttachment } from '../types';
import { DISCOVERY_SECTORS } from '../data/spatialNodes';
import { CameraCaptureWidget } from './CameraCaptureWidget';

interface QuickDataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNodeWithMedia: (data: {
    title: string;
    sector: DiscoverySector;
    summary: string;
    details: string;
    media: NodeMediaAttachment | null;
  }) => void;
}

export const QuickDataUploadModal: React.FC<QuickDataUploadModalProps> = ({
  isOpen,
  onClose,
  onAddNodeWithMedia,
}) => {
  const [media, setMedia] = useState<NodeMediaAttachment | null>(null);
  const [title, setTitle] = useState('');
  const [sector, setSector] = useState<DiscoverySector>('記録');
  const [note, setNote] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleMediaCaptured = (captured: NodeMediaAttachment | null) => {
    setMedia(captured);
    if (captured && !title) {
      if (captured.type === 'snapshot') {
        const now = new Date();
        setTitle(`写メ記録_${now.getHours()}時${now.getMinutes()}分`);
        setSector('記録');
      } else if (captured.filename) {
        const nameWithoutExt = captured.filename.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
        if (captured.filename.endsWith('.json') || captured.filename.endsWith('.csv')) {
          setSector('経済');
        } else if (captured.type === 'photo') {
          setSector('スケッチ');
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const sizeKb = (file.size / 1024).toFixed(1);
        const now = new Date();
        const timeFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (isImage) {
          const img = new Image();
          img.onload = () => {
            const attachment: NodeMediaAttachment = {
              type: 'photo',
              dataUrl,
              filename: file.name,
              capturedAt: timeFormatted,
              resolution: `${img.naturalWidth}×${img.naturalHeight}`,
              fileSize: `${sizeKb} KB`,
              mimeType: file.type || 'image/jpeg',
              sourceDevice: 'ドラッグ＆ドロップ'
            };
            handleMediaCaptured(attachment);
          };
          img.src = dataUrl;
        } else {
          const textPreview = typeof dataUrl === 'string' && dataUrl.startsWith('data:') 
            ? '(バイナリ/構造化データ)' 
            : String(dataUrl).slice(0, 300);

          const attachment: NodeMediaAttachment = {
            type: 'data',
            dataUrl,
            filename: file.name,
            capturedAt: timeFormatted,
            fileSize: `${sizeKb} KB`,
            mimeType: file.type || 'application/octet-stream',
            sourceDevice: 'ドラッグ＆ドロップ',
            textDataPreview: textPreview
          };
          handleMediaCaptured(attachment);
        }
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        if (file.type.includes('json') || file.type.includes('csv') || file.type.includes('text')) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || (media ? media.filename || '写真データノード' : '新規空間ノード');
    const finalSummary = note.trim() 
      ? (note.length > 80 ? note.slice(0, 77) + '...' : note)
      : (media ? `${media.sourceDevice || 'データ'}経由で登録された${media.type === 'snapshot' ? '写メ写真' : 'データ'}。` : 'ユーザー登録ノード');
    const finalDetails = note.trim() || `ファイル: ${media?.filename || '写メ写真'}, 解像度/サイズ: ${media?.resolution || media?.fileSize || 'N/A'}, 登録日時: ${media?.capturedAt || new Date().toLocaleString()}`;

    onAddNodeWithMedia({
      title: finalTitle,
      sector,
      summary: finalSummary,
      details: finalDetails,
      media
    });

    // Reset and close
    setTitle('');
    setNote('');
    setMedia(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-black/15 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] tracking-[0.3em] font-bold text-black/40 uppercase">
                SPATIAL DATA & PHOTO INTAKE
              </span>
            </div>
            <h3 className="text-lg font-bold text-black flex items-center gap-2 mt-0.5">
              <span>写真・写メ・データアップロード</span>
            </h3>
            <p className="text-xs text-black/60 mt-0.5">
              Top画面からカメラ写メや写真、ファイルデータをシンプルな操作で3D空間に配置します
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-black/40 hover:text-black p-1.5 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Visual Indicator if dragging */}
        {isDragOver && (
          <div className="p-8 border-2 border-dashed border-emerald-500 bg-emerald-50/70 rounded-2xl flex flex-col items-center justify-center gap-2 text-center text-emerald-800 animate-pulse">
            <UploadCloud className="w-10 h-10 text-emerald-600 animate-bounce" />
            <span className="text-sm font-bold">ここにファイルをドロップして登録</span>
            <span className="text-xs text-emerald-700">画像・JSON・CSV・テキストファイルを自動認識します</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Camera / Photo / File Intake Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-black/60 uppercase">
              1. 写真・写メ・ファイルの取得 (Browser Camera & Upload)
            </label>
            <CameraCaptureWidget
              onMediaCaptured={handleMediaCaptured}
              currentMedia={media}
            />
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-black/60 uppercase mb-1">
              2. ノード名称 (Title)
            </label>
            <input
              type="text"
              required
              placeholder="例: 現地観測写真 / 財務データ2026 / デザイン写メ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-bold text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Sector Selection */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-black/60 uppercase mb-1">
              3. 所属セクター (12領域)
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as DiscoverySector)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-bold text-black focus:outline-none focus:border-black bg-white"
            >
              {DISCOVERY_SECTORS.map(s => (
                <option key={s.sector} value={s.sector}>
                  【{s.sector}】 {s.labelEn} - {s.description.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Note / Summary input */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-black/60 uppercase mb-1">
              4. 要約・メモ (80文字以内)
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder="空間ノードに付与するメモや要約を入力"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-black/15 text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex justify-end items-center gap-3 border-t border-black/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-black/60 hover:text-black transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold tracking-wider hover:bg-black/90 shadow-md active:scale-98 transition-all"
            >
              <span>3D空間に配置する</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

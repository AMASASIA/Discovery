import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  Upload, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { NodeMediaAttachment } from '../types';

interface CameraCaptureWidgetProps {
  onMediaCaptured: (media: NodeMediaAttachment | null) => void;
  currentMedia: NodeMediaAttachment | null;
  compact?: boolean;
}

export const CameraCaptureWidget: React.FC<CameraCaptureWidgetProps> = ({
  onMediaCaptured,
  currentMedia,
  compact = false
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check available video devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoDevices.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Stop camera stream cleanly
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsLoadingCamera(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start Camera Stream
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsLoadingCamera(true);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('お使いのブラウザはカメラAPIに対応していません。写真ファイル選択をご利用ください。');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        // Fallback without strict facingMode
        console.warn('Fallback to default camera constraints', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setFacingMode(facing);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'カメラの起動に失敗しました。';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'カメラの使用が許可されていません。ブラウザ設定を確認するか、写真選択をご利用ください。';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'カメラデバイスが見つかりません。写真選択をご利用ください。';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      stopCameraStream();
    } finally {
      setIsLoadingCamera(false);
    }
  };

  // Switch between front / back camera
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  // Capture snapshot from video
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the current video frame onto canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Get high-quality JPEG data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const approxBytes = Math.round((dataUrl.length * 3) / 4);
    const sizeKb = (approxBytes / 1024).toFixed(1);

    const now = new Date();
    const timeFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const attachment: NodeMediaAttachment = {
      type: 'snapshot',
      dataUrl,
      filename: `snapshot_${now.getTime()}.jpg`,
      capturedAt: timeFormatted,
      resolution: `${width}×${height}`,
      fileSize: `${sizeKb} KB`,
      mimeType: 'image/jpeg',
      sourceDevice: `Camera API (${facingMode === 'environment' ? '背面レンズ' : '前面レンズ'})`
    };

    onMediaCaptured(attachment);
    stopCameraStream();
  };

  // Handle manual file selection (photo / data)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
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
            sourceDevice: 'デバイス写真ライブラリ'
          };
          onMediaCaptured(attachment);
        };
        img.src = dataUrl;
      } else {
        // Text / data file
        const textPreview = typeof dataUrl === 'string' && dataUrl.startsWith('data:') 
          ? '(バイナリ/データファイル)' 
          : String(dataUrl).slice(0, 300);

        const attachment: NodeMediaAttachment = {
          type: 'data',
          dataUrl,
          filename: file.name,
          capturedAt: timeFormatted,
          fileSize: `${sizeKb} KB`,
          mimeType: file.type || 'application/octet-stream',
          sourceDevice: 'データファイルアップロード',
          textDataPreview: textPreview
        };
        onMediaCaptured(attachment);
      }
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      // For text-based data
      if (file.type.includes('json') || file.type.includes('csv') || file.type.includes('text')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = () => {
    onMediaCaptured(null);
    stopCameraStream();
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Hidden file input for gallery/photo selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.json,.csv,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Captured Image / Attachment Preview State */}
      {currentMedia ? (
        <div className="p-3 bg-black/[0.03] border border-black/10 rounded-2xl flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-black/60 uppercase">
                {currentMedia.type === 'snapshot' ? '📷 写メ (CAMERA SNAPSHOT)' : '🖼️ 写真添付 (ATTACHED PHOTO)'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="text-[10px] font-bold text-red-600 hover:text-red-800 px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
            >
              削除
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentMedia.dataUrl && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-black/15 bg-black/5 shrink-0 shadow-inner">
                <img
                  src={currentMedia.dataUrl}
                  alt="Captured snapshot"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 flex flex-col gap-1 text-[11px] font-mono">
              <div className="font-bold text-black truncate max-w-[220px]">
                {currentMedia.filename || 'snapshot.jpg'}
              </div>
              <div className="text-[10px] text-black/60 flex flex-wrap gap-x-2">
                {currentMedia.resolution && <span>📐 {currentMedia.resolution}</span>}
                {currentMedia.fileSize && <span>💾 {currentMedia.fileSize}</span>}
              </div>
              <div className="text-[9px] text-black/40">
                🕒 {currentMedia.capturedAt} // {currentMedia.sourceDevice}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-black/5">
            <button
              type="button"
              onClick={() => startCamera()}
              className="flex-1 py-1.5 px-2.5 rounded-xl border border-black/15 hover:bg-black/5 text-[11px] font-bold text-black/70 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>撮り直す</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 px-2.5 rounded-xl border border-black/15 hover:bg-black/5 text-[11px] font-bold text-black/70 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>写真変更</span>
            </button>
          </div>
        </div>
      ) : isCameraActive ? (
        /* Live Camera Viewfinder */
        <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-black flex flex-col shadow-xl animate-in zoom-in-95 duration-150">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-32 border border-white/40 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400 absolute top-2 left-2"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400 absolute top-2 right-2"></div>
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400 absolute bottom-2 left-2"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400 absolute bottom-2 right-2"></div>
                <span className="text-[9px] font-mono tracking-widest text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                  FOCUS TARGET
                </span>
              </div>
            </div>

            {/* Camera Controls Bar on Video */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="カメラを切り替え"
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={stopCameraStream}
                title="カメラを閉じる"
                className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Shutter Capture Button */}
          <div className="p-3 bg-zinc-900 flex items-center justify-between">
            <button
              type="button"
              onClick={stopCameraStream}
              className="text-xs text-white/60 hover:text-white px-3 py-1 font-medium"
            >
              キャンセル
            </button>

            <button
              type="button"
              onClick={captureSnapshot}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wider shadow-lg active:scale-95 transition-all"
            >
              <div className="w-3 h-3 rounded-full bg-white border-2 border-emerald-700"></div>
              <span>撮影してノードに埋め込む</span>
            </button>

            <div className="w-12"></div>
          </div>
        </div>
      ) : (
        /* Action Buttons: Camera Button & Upload Button */
        <div className="flex flex-col gap-2">
          {cameraError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold block">カメラ案内:</span>
                {cameraError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Live Camera Button */}
            <button
              type="button"
              onClick={() => startCamera()}
              disabled={isLoadingCamera}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black text-white hover:bg-black/85 transition-all text-xs font-bold shadow-sm active:scale-98"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>{isLoadingCamera ? '起動中...' : 'カメラで撮影 (写メ)'}</span>
            </button>

            {/* Photo / Data File Select Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-black/15 hover:bg-black/[0.03] text-black transition-all text-xs font-bold shadow-sm"
            >
              <Upload className="w-4 h-4 text-black/70" />
              <span>写真・データ選択</span>
            </button>
          </div>

          <div className="text-[10px] text-black/50 text-center font-medium">
            ブラウザカメラで写メを撮影、または写真・データを選択してメタデータに埋め込みます
          </div>
        </div>
      )}
    </div>
  );
};

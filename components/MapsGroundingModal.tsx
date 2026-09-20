import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink, Search, X, Loader2, Sparkles, Compass, Plus } from 'lucide-react';
import { SpatialNodeData } from '../types';

interface MapsGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSpatialNode?: (node: Partial<SpatialNodeData>) => void;
}

interface MapPlace {
  title: string;
  uri: string;
  snippets: string[];
}

export const MapsGroundingModal: React.FC<MapsGroundingModalProps> = ({ isOpen, onClose, onAddSpatialNode }) => {
  const [prompt, setPrompt] = useState('東京近郊の先端メディアアート展示施設と建築スポット');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Fetch user location
  useEffect(() => {
    if (isOpen && !userLocation && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setLocating(false);
        },
        (err) => {
          console.warn('Geolocation declined or unavailable:', err.message);
          setLocating(false);
        },
        { timeout: 5000 }
      );
    }
  }, [isOpen, userLocation]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResultText(null);
    setPlaces([]);

    try {
      const res = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Maps Grounding request failed.');
      }

      setResultText(data.text);
      setPlaces(data.places || []);
    } catch (err: any) {
      console.error('Maps Grounding Error:', err);
      setError(err?.message || 'Failed to retrieve grounded location data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsNode = (place: MapPlace) => {
    if (onAddSpatialNode) {
      onAddSpatialNode({
        title: place.title,
        sector: '建築',
        summary: place.snippets.length > 0 ? place.snippets[0] : `${place.title} - Google Mapsグラウンディング地点`,
        details: [
          `Google Maps: ${place.uri}`,
          ...place.snippets
        ]
      });
      alert(`「${place.title}」を3D空間ノード（建築セクター）に追加しました。`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-black/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-black/10 flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-black text-amber-400 flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-black tracking-wide">MAPS GROUNDING // 地理空間検索</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  gemini-3.5-flash + Google Maps
                </span>
              </div>
              <p className="text-xs text-black/50">Googleマップの最新リアルタイム位置情報とレビュー知見をグラウンディング</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Location Badge */}
        <div className="p-5 border-b border-black/5 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="場所やスポットの検索（例：京都のモダニズム建築巡り、渋谷近辺のオープンイノベーション拠点）"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/15 text-xs text-black focus:outline-none focus:border-black transition-all bg-[#FAF9F6]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-bold hover:bg-black/85 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0 shadow-sm"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>検索実行</span>
            </button>
          </form>

          {/* Quick presets & location info */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-black/50">
              <Navigation className="w-3 h-3 text-amber-600" />
              {locating ? (
                <span>現在位置を取得中...</span>
              ) : userLocation ? (
                <span className="font-mono text-[10px]">緯度: {userLocation.lat.toFixed(3)}, 経度: {userLocation.lng.toFixed(3)} (現在地連携有効)</span>
              ) : (
                <span>現在地未連携 (全国検索)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-black/40">プリセット:</span>
              <button
                type="button"
                onClick={() => setPrompt('東京の最先端デジタルアート・テクノロジー展示館')}
                className="px-2 py-0.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 text-[10px]"
              >
                アート展示
              </button>
              <button
                type="button"
                onClick={() => setPrompt('世界的に評価される日本の現代建築スポット')}
                className="px-2 py-0.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 text-[10px]"
              >
                名作建築
              </button>
              <button
                type="button"
                onClick={() => setPrompt('近隣のスタートアップ拠点とコワーキング施設')}
                className="px-2 py-0.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 text-[10px]"
              >
                イノベーション
              </button>
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FCFCF9]">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
              <strong>検索エラー:</strong> {error}
            </div>
          )}

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-black/50">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <div className="text-xs font-mono tracking-wider">RETRIEVING GOOGLE MAPS GROUNDING...</div>
              <p className="text-[11px] text-black/40">地理空間データベースおよびGoogle Mapsの最新情報を照会中</p>
            </div>
          )}

          {!loading && !resultText && !error && (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-center text-black/40">
              <Compass className="w-10 h-10 opacity-30" />
              <div className="text-xs font-medium">調べたい地域や施設についてのキーワードを入力して検索してください</div>
              <p className="text-[11px] max-w-sm">Google Maps Groundingにより、最新の所在地や店舗・施設リンク、レビュー抜粋がグラウンディングされます。</p>
            </div>
          )}

          {resultText && (
            <div className="space-y-6">
              {/* Synthesized Analysis */}
              <div className="bg-white p-5 rounded-2xl border border-black/10 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-black/50 uppercase font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>GEMINI MAPS SYNTHESIS // 地理情報解析</span>
                </div>
                <div className="text-xs leading-relaxed text-black/85 whitespace-pre-wrap">
                  {resultText}
                </div>
              </div>

              {/* Verified Place Cards */}
              {places.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono tracking-wider text-black font-bold flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span>VERIFIED GOOGLE MAPS LOCATIONS ({places.length}件)</span>
                    </div>
                    <span className="text-[10px] text-black/40">公式マップリンク & レビュー参照</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {places.map((place, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-2xl border border-black/10 shadow-sm hover:border-black/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-black leading-snug">{place.title}</h4>
                            {place.uri && (
                              <a
                                href={place.uri}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="p-1 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 transition-colors shrink-0"
                                title="Google Mapsで開く"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {place.snippets.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {place.snippets.map((snip, sIdx) => (
                                <p key={sIdx} className="text-[11px] text-black/60 italic leading-snug bg-[#FAF9F6] p-2 rounded-xl">
                                  "{snip}"
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                          <a
                            href={place.uri}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Googleマップで確認</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          {onAddSpatialNode && (
                            <button
                              type="button"
                              onClick={() => handleAddAsNode(place)}
                              className="px-2.5 py-1 rounded-lg bg-black text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-black/80 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>3D空間に配置</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

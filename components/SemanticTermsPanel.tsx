import React from 'react';
import { 
  GitMerge, 
  Layers, 
  Sparkles, 
  X, 
  ArrowRight, 
  Radio, 
  Hash,
  Share2
} from 'lucide-react';
import { SemanticTermRelation, DiscoverySector } from '../types';
import { DISCOVERY_SECTORS } from '../data/spatialNodes';

interface SemanticTermsPanelProps {
  terms: SemanticTermRelation[];
  activeTerm: string | null;
  onSelectTerm: (tag: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SemanticTermsPanel: React.FC<SemanticTermsPanelProps> = ({
  terms,
  activeTerm,
  onSelectTerm,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const commonTerms = terms.filter(t => t.type === 'COMMON');
  const relatedTerms = terms.filter(t => t.type === 'RELATED');

  const getSectorColor = (sector: DiscoverySector) => {
    const s = DISCOVERY_SECTORS.find(sc => sc.sector === sector);
    return s ? s.accentColor : '#666666';
  };

  return (
    <div 
      id="semantic-terms-drawer"
      className="fixed bottom-24 left-8 z-30 w-88 max-w-[calc(100vw-3rem)] max-h-[68vh] bg-white/95 backdrop-blur-2xl rounded-3xl border border-black/15 shadow-2xl p-5 flex flex-col gap-4 overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-6 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black/5 text-black">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black tracking-wide flex items-center gap-1.5">
              <span>共通項 & 関連項</span>
              <span className="text-[10px] font-mono font-normal text-black/50">(FR-08)</span>
            </h3>
            <p className="text-[11px] text-black/50">3領域以上＝共通項 / 2領域＝関連項</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activeTerm && (
            <button
              onClick={() => onSelectTerm(null)}
              className="px-2 py-1 rounded-md text-[10px] font-mono text-black/60 bg-black/5 hover:bg-black/10 transition-colors"
            >
              解除
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Selection Banner */}
      {activeTerm && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/5 border border-black/10 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span className="text-black/60">選択中:</span>
            <strong className="text-black font-bold">#{activeTerm}</strong>
          </div>
          <button
            onClick={() => onSelectTerm(null)}
            className="text-[10px] text-black/50 hover:text-black underline"
          >
            すべて表示
          </button>
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Section 1: 共通項 (Common Terms - 3+ Sectors) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider font-bold text-black/70 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>共通項 (3領域以上横断)</span>
            </span>
            <span className="text-[9px] font-mono text-black/40">{commonTerms.length}件</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {commonTerms.map((t) => {
              const isSelected = activeTerm === t.tag;
              return (
                <button
                  key={t.tag}
                  onClick={() => onSelectTerm(isSelected ? null : t.tag)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-black text-white border-black shadow-md' 
                      : 'bg-black/[0.02] hover:bg-black/[0.05] border-black/5 text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono flex items-center gap-1">
                      <Hash className={`w-3 h-3 ${isSelected ? 'text-white/60' : 'text-black/40'}`} />
                      {t.tag}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-black/60'
                    }`}>
                      {t.itemCount}ノード
                    </span>
                  </div>

                  {/* Sectors badges */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {t.sectors.map((sec) => (
                      <span
                        key={sec}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          isSelected 
                            ? 'border-white/30 text-white' 
                            : 'border-black/10 bg-white text-black/70'
                        }`}
                        style={{ borderLeftColor: getSectorColor(sec), borderLeftWidth: 3 }}
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: 関連項 (Related Terms - 2 Sectors) */}
        <div>
          <div className="flex items-center justify-between mb-2 pt-2 border-t border-black/5">
            <span className="text-[10px] font-mono tracking-wider font-bold text-black/70 flex items-center gap-1">
              <GitMerge className="w-3 h-3 text-blue-500" />
              <span>関連項 (2領域ブリッジ)</span>
            </span>
            <span className="text-[9px] font-mono text-black/40">{relatedTerms.length}件</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {relatedTerms.map((t) => {
              const isSelected = activeTerm === t.tag;
              return (
                <button
                  key={t.tag}
                  onClick={() => onSelectTerm(isSelected ? null : t.tag)}
                  className={`text-left p-2 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-black text-white border-black shadow-md' 
                      : 'bg-black/[0.015] hover:bg-black/[0.04] border-black/5 text-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-mono flex items-center gap-1">
                      <Hash className={`w-3 h-3 ${isSelected ? 'text-white/60' : 'text-black/40'}`} />
                      {t.tag}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-black/60">
                      {t.sectors[0]} ⇄ {t.sectors[1]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Wifi, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  ArrowUpRight, 
  Sliders, 
  Layers,
  ExternalLink,
  Compass,
  Radio,
  Share2,
  Users
} from 'lucide-react';
import { SpatialNodeData } from '../types';
import { DISCOVERY_SECTORS } from '../data/spatialNodes';

interface NodeDetailPanelProps {
  node: SpatialNodeData | null;
  allNodes: SpatialNodeData[];
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
  onSelectTag?: (tag: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  allNodes,
  onClose,
  onFocusNode,
  onSelectTag,
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({
    allocation: 78,
    priority: 92,
    sensitivity: 45,
  });

  if (!node) return null;

  const handleAction = (actionId: string, label: string) => {
    setActiveActionId(actionId);
    setTimeout(() => {
      setActiveActionId(null);
      setActionSuccess(`Executed: ${label}`);
      setTimeout(() => setActionSuccess(null), 3500);
    }, 900);
  };

  const handleSliderChange = (key: string, val: number) => {
    setSliderValues(prev => ({ ...prev, [key]: val }));
  };

  const sectorCfg = DISCOVERY_SECTORS.find(s => s.sector === node.sector);
  const connectedNodes = allNodes.filter(n => node.connections.includes(n.id));

  return (
    <div 
      id={`node-inspector-${node.id}`}
      className="fixed top-20 right-8 z-30 w-96 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-120px)] bg-white/95 backdrop-blur-2xl rounded-3xl border border-black/15 shadow-2xl p-6 flex flex-col gap-5 overflow-y-auto pointer-events-auto animate-in fade-in slide-in-from-right-8 duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: sectorCfg?.accentColor || '#1A1A19' }}
            />
            <span className="text-[10px] font-mono tracking-widest text-black/60 font-bold uppercase">
              {node.code} // 【{node.sector}】 // {sectorCfg?.labelEn}
            </span>
          </div>
          <h2 className="text-lg font-bold text-black/90 tracking-tight leading-snug">
            {node.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Radial Coordinates & Topology Badge (FR-07, FR-09, FR-10) */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="p-2.5 rounded-xl bg-black/[0.03] border border-black/5 flex flex-col gap-0.5">
          <span className="text-[9px] text-black/40">極座標 (r, θ, φ)</span>
          <span className="font-bold text-black">
            r={(node.radius_r ?? 0.1).toFixed(2)} | θ={(((node.theta ?? 0) * 180) / Math.PI).toFixed(0)}°
          </span>
          <span className="text-[9px] text-black/50">位相 φ={(node.phi ?? 0).toFixed(2)} rad</span>
        </div>

        <div className="p-2.5 rounded-xl bg-black/[0.03] border border-black/5 flex flex-col gap-0.5">
          <span className="text-[9px] text-black/40">トポロジー分類 (FR-09)</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold">
              {node.topologyLabel || '中核'}
            </span>
            <span className="text-[9px] text-black/60">
              ρ={(node.density_rho ?? 0.9).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary (P2 <= 80 chars requirement) */}
      <div className="bg-black/[0.02] p-3 rounded-2xl border border-black/5">
        <div className="text-[9px] font-mono text-black/40 mb-1">要約 (80字以内)</div>
        <p className="text-xs leading-relaxed text-black/80 font-medium">
          {node.summary}
        </p>
      </div>

      {/* Details */}
      <div className="text-xs leading-relaxed text-black/70">
        <div className="text-[9px] font-mono text-black/40 mb-1">詳細記述</div>
        <p className="p-3 rounded-2xl bg-black/[0.015] border border-black/5">
          {node.details}
        </p>
      </div>

      {/* Source Verification (FR-05) */}
      {node.source && (
        <div className="p-3 rounded-2xl bg-black/[0.03] border border-black/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-black/40">一次出典・検証ソース (FR-05)</span>
            <span className="text-xs font-mono font-bold text-black truncate max-w-[200px]">
              {node.sourceId || 'SRC-VERIFIED'}
            </span>
          </div>
          <a
            href={node.source}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-mono font-bold text-black/80 hover:text-black hover:border-black transition-colors"
          >
            <span>検証元</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Corroboration & Lineage (FR-12, FR-23) */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-700" />
          <div>
            <div className="font-bold text-emerald-900">
              独立裏づけ: {node.corroborationCount || 4}体のエージェント合意
            </div>
            <div className="text-[10px] font-mono text-emerald-700">
              ワーカー: {node.workerId || 'w-core-01'} // 第{node.generation || 1}世代
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
          PASS
        </span>
      </div>

      {/* Tags (Semantic Terms) */}
      {node.tags && node.tags.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-black/40 mb-1.5">抽出タグ (名詞 3〜6個)</div>
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map(t => (
              <button
                key={t}
                onClick={() => onSelectTag?.(t)}
                className="px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10 border border-black/5 text-[11px] font-mono text-black/70 transition-colors"
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {node.metrics && node.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {node.metrics.map((m, idx) => (
            <div key={idx} className="p-3 bg-black/[0.02] border border-black/5 rounded-2xl">
              <span className="text-[9px] font-mono text-black/40 uppercase block mb-1">{m.label}</span>
              <span className="text-base font-bold font-mono text-black block">{m.value}</span>
              <span className="text-[10px] font-mono text-emerald-600 block mt-0.5">{m.trend}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cross-Sector Connected Nodes */}
      {connectedNodes.length > 0 && (
        <div className="border-t border-black/10 pt-4">
          <div className="text-[9px] font-mono text-black/40 mb-2 flex items-center justify-between">
            <span>領域間リンク ({connectedNodes.length}ノード)</span>
            <Share2 className="w-3 h-3 text-black/40" />
          </div>
          <div className="flex flex-col gap-1.5">
            {connectedNodes.map(cn => (
              <button
                key={cn.id}
                onClick={() => onFocusNode(cn.id)}
                className="text-left p-2.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.05] border border-black/5 flex items-center justify-between transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-black/40">【{cn.sector}】 {cn.code}</span>
                  <span className="text-xs font-bold text-black truncate max-w-[220px]">{cn.title}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-black/40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Node Actions */}
      {node.actions && node.actions.length > 0 && (
        <div className="border-t border-black/10 pt-4 flex flex-col gap-2">
          <div className="text-[9px] font-mono text-black/40">自律エージェント介入アクション</div>
          {node.actions.map(act => (
            <button
              key={act.id}
              onClick={() => handleAction(act.id, act.label)}
              disabled={activeActionId === act.id}
              className="w-full text-left p-2.5 rounded-xl border border-black/10 hover:border-black bg-white hover:bg-black/[0.02] transition-all text-xs flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">{act.label}</span>
                {activeActionId === act.id && <Cpu className="w-3 h-3 animate-spin text-black" />}
              </div>
              <span className="text-[10px] text-black/60">{act.description}</span>
            </button>
          ))}
          {actionSuccess && (
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono text-center border border-emerald-200 animate-in fade-in">
              {actionSuccess}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

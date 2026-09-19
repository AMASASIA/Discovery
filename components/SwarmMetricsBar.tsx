import React from 'react';
import { 
  Activity, 
  Cpu, 
  DollarSign, 
  AlertTriangle, 
  Square, 
  Radio, 
  ShieldAlert,
  Zap,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { SwarmStatusMetrics } from '../types';

interface SwarmMetricsBarProps {
  metrics: SwarmStatusMetrics;
  onEmergencyStop: () => void;
  onChangeScaleLimit: (limit: number) => void;
  onOpenSwarmConsole: () => void;
}

export const SwarmMetricsBar: React.FC<SwarmMetricsBarProps> = ({
  metrics,
  onEmergencyStop,
  onChangeScaleLimit,
  onOpenSwarmConsole,
}) => {
  // Kuramoto status label and color
  const rVal = metrics.kuramotoR;
  const isPhaseLocked = rVal >= 0.8;
  const isConverging = rVal >= 0.4 && rVal < 0.8;

  const rStatusText = isPhaseLocked 
    ? 'PHASE-LOCKED (合意収束)' 
    : isConverging 
    ? 'SYNCHRONIZING (同調中)' 
    : 'DISPERSED (広域探索)';

  const rColorClass = isPhaseLocked 
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
    : isConverging 
    ? 'text-blue-700 bg-blue-50 border-blue-200' 
    : 'text-amber-700 bg-amber-50 border-amber-200';

  return (
    <div 
      id="swarm-metrics-hud"
      className="hidden md:flex items-center gap-3 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-black/10 shadow-sm pointer-events-auto text-xs font-medium"
    >
      {/* Kuramoto Synchrony Indicator (FR-24) */}
      <div 
        onClick={onOpenSwarmConsole}
        className="flex items-center gap-2.5 pr-3 border-r border-black/10 cursor-pointer hover:opacity-80 transition-opacity"
        title="Kuramoto Order Parameter R (同期率): 0.8以上で創発的収束"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[9px] tracking-widest font-mono text-black/50 uppercase">
            <Radio className={`w-3 h-3 ${isPhaseLocked ? 'text-emerald-600 animate-pulse' : 'text-blue-500'}`} />
            <span>KURAMOTO R</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-black tracking-tight">
              R = {rVal.toFixed(3)}
            </span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${rColorClass}`}>
              {rStatusText}
            </span>
          </div>
        </div>

        {/* Mini Kuramoto Progress Bar */}
        <div className="w-12 h-2 bg-black/10 rounded-full overflow-hidden shrink-0">
          <div 
            className={`h-full transition-all duration-300 ${
              isPhaseLocked ? 'bg-emerald-500' : isConverging ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, rVal * 100))}%` }}
          />
        </div>
      </div>

      {/* Logical Swarm Agents Count & Scaling (FR-03, NFR-06) */}
      <div className="flex items-center gap-2 pr-3 border-r border-black/10">
        <Cpu className="w-3.5 h-3.5 text-black/40" />
        <div className="flex flex-col">
          <span className="text-[9px] text-black/40 tracking-wider font-mono">ACTIVE AGENTS</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-black font-mono">{metrics.activeAgents}</span>
            <span className="text-[9px] text-black/50">/ {metrics.targetAgentsLimit}</span>
            
            {/* Scale limit buttons */}
            <div className="flex items-center gap-0.5 ml-1 bg-black/5 p-0.5 rounded">
              {[600, 150, 30].map(limit => (
                <button
                  key={limit}
                  onClick={() => onChangeScaleLimit(limit)}
                  title={`規模縮退設定: 最大${limit}エージェント (NFR-06)`}
                  className={`text-[8px] px-1 py-0.2 rounded font-mono transition-colors ${
                    metrics.targetAgentsLimit === limit 
                      ? 'bg-black text-white font-bold' 
                      : 'text-black/50 hover:text-black'
                  }`}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtask Completion Rate */}
      <div className="flex items-center gap-2 pr-3 border-r border-black/10">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <div className="flex flex-col">
          <span className="text-[9px] text-black/40 tracking-wider font-mono">COMPLETION</span>
          <span className="font-bold text-black font-mono">{metrics.completionRate}%</span>
        </div>
      </div>

      {/* Estimated Cost & Guardrail (NFR-01) */}
      <div className="flex items-center gap-1.5 pr-3 border-r border-black/10">
        <DollarSign className="w-3.5 h-3.5 text-black/40" />
        <div className="flex flex-col">
          <span className="text-[9px] text-black/40 tracking-wider font-mono">EST. COST</span>
          <span className="font-bold text-black font-mono">
            ${metrics.estimatedCost.toFixed(3)}
            <span className="text-[8px] text-black/40 font-normal ml-0.5">/ ${metrics.costLimit.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Autonomy Level Gate (FR-13) */}
      <div className="hidden xl:flex items-center gap-1.5 pr-2">
        <div className="px-2 py-1 rounded bg-black/5 text-[9px] font-mono text-black/70">
          <span>AUTONOMY: <strong>Lv.{metrics.autonomyLevel}</strong> (Domain)</span>
        </div>
      </div>

      {/* Emergency Stop Button (FR-15) */}
      <button
        onClick={onEmergencyStop}
        title="緊急停止 (FR-15): 全ワーカーを5秒以内に即時停止"
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all ${
          metrics.emergencyStopped 
            ? 'bg-red-600 text-white animate-pulse shadow' 
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
        }`}
      >
        <Square className="w-2.5 h-2.5 fill-current" />
        <span>{metrics.emergencyStopped ? 'STOPPED' : 'HALT'}</span>
      </button>
    </div>
  );
};

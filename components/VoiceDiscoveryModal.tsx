import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  ArrowRight, 
  Cpu, 
  Radio, 
  CheckCircle2, 
  Layers, 
  Zap,
  Volume2
} from 'lucide-react';
import { SpatialNodeData, DiscoverySector, MemoriaLesson } from '../types';
import { calculateNodePosition, DISCOVERY_SECTORS } from '../data/spatialNodes';

interface VoiceDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwarmCompleted: (newNodes: SpatialNodeData[], newLesson: MemoriaLesson) => void;
  onUpdateKuramotoR: (r: number) => void;
}

const PRESET_INTENTS = [
  '自律分散AIと地域循環経済の合意形成モデルを探索',
  '432Hz音響トポロジーと生体位相同期の臨床事例',
  '生成AIの著作権と創作帰属に関する国際判例調査',
  '粘菌輸送網の耐障害性アルゴリズムと建築ファサードの統合'
];

export const VoiceDiscoveryModal: React.FC<VoiceDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSwarmCompleted,
  onUpdateKuramotoR,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [intentInput, setIntentInput] = useState('');
  const [swarmStage, setSwarmStage] = useState<'IDLE' | 'P1_STRUCTURING' | 'P2_EXPLORING' | 'P3_SYNC' | 'P4_VALIDATING' | 'P5_MEMORIA' | 'COMPLETED'>('IDLE');
  const [activeAgentCount, setActiveAgentCount] = useState(0);
  const [currentKuramoto, setCurrentKuramoto] = useState(0.12);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setIntentInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIntentInput('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        // Fallback for simulated listening
        setIsListening(true);
        setTimeout(() => {
          setIntentInput('自律分散AIと地域循環経済の合意形成モデルを探索');
          setIsListening(false);
        }, 2200);
      }
    }
  };

  const runSwarmDiscovery = () => {
    const query = intentInput.trim() || '自律分散AIと地域循環経済の合意形成モデルを探索';
    setIntentInput(query);
    setSwarmStage('P1_STRUCTURING');
    setStatusLog(['[P1 Orchestrator] 意図を構造化中: 12領域へのサブタスク分割']);
    setActiveAgentCount(12);
    setCurrentKuramoto(0.15);
    onUpdateKuramotoR(0.15);

    // Timeline of Swarm Wave Simulation
    setTimeout(() => {
      setSwarmStage('P2_EXPLORING');
      setActiveAgentCount(72);
      setCurrentKuramoto(0.38);
      onUpdateKuramotoR(0.38);
      setStatusLog(prev => [
        '[P2 Sector Waves] 12領域に第1波・第2波ワーカー配備 (72体稼働)',
        '経済・法令・建築・自然セクターにフェロモン集中を検知',
        ...prev
      ]);
    }, 1200);

    setTimeout(() => {
      setSwarmStage('P3_SYNC');
      setActiveAgentCount(180);
      setCurrentKuramoto(0.68);
      onUpdateKuramotoR(0.68);
      setStatusLog(prev => [
        '[P3 Kuramoto Engine] 位相同調開始: 共通項「空間トポロジー」「AI自律性」で結合',
        '黒板 (Blackboard) への検証データ書き込み完了',
        ...prev
      ]);
    }, 2500);

    setTimeout(() => {
      setSwarmStage('P4_VALIDATING');
      setActiveAgentCount(240);
      setCurrentKuramoto(0.86);
      onUpdateKuramotoR(0.86);
      setStatusLog(prev => [
        '[P4 Validation] Kuramoto R = 0.86 (Phase-Locked 合意収束)',
        '3体以上の独立検証による裏づけ確認 (棄却率 4.2%)',
        ...prev
      ]);
    }, 3800);

    setTimeout(() => {
      setSwarmStage('P5_MEMORIA');
      setStatusLog(prev => [
        '[P5 Memoria] 経験学習エピソードを自動生成し記憶バンクへ保存',
        '新ノード 3件を 3D空間の極座標 (r, θ, φ) へ投影',
        ...prev
      ]);

      // Generate 2 or 3 new high-quality discovery nodes
      const timestamp = Date.now();
      const nodeA: SpatialNodeData = {
        id: `node-swarm-${timestamp}-1`,
        code: `SW-${timestamp.toString().slice(-4)}`,
        title: `${query.slice(0, 16)}・領域横断統合解`,
        sector: '経済',
        category: '経済',
        summary: '12領域スウォームの創発的合意により同定された最適化トポロジー。',
        details: `探索意図「${query}」に基づき、240体の論理サブエージェントが自律的に検証した共通解。経済効率と自然循環のトレードオフを数理的に解消。`,
        source: 'https://doi.org/10.1038/s41586-swarm-synthesis-2026',
        sourceId: `SRC-SW-${timestamp.toString().slice(-3)}`,
        status: 'SYNCHRONIZED',
        score_s: 0.94,
        radius_r: 0.06,
        theta: 0.12,
        phi: 0.88,
        position: calculateNodePosition(0.06, 0.12, 0.88),
        density_rho: 0.96,
        variance_sigma2: 0.02,
        topologyLabel: '中核',
        corroborationCount: 8,
        workerId: 'w-swarm-orchestrator',
        generation: 4,
        connections: ['node-eco-01', 'node-law-01', 'node-nat-01'],
        accentColor: '#D97706',
        tags: ['AI自律性', '合意形成', '空間トポロジー', '地域通貨'],
        metrics: [
          { label: 'SWARM CONSENSUS', value: '98.4%', trend: 'OPTIMAL', sparkline: [82, 89, 94, 98.4] },
          { label: 'KURAMOTO R', value: '0.88', trend: 'LOCKED', sparkline: [0.2, 0.45, 0.72, 0.88] }
        ],
        telemetry: { latency: '1.1 ms', bandwidth: '1.8 Tbps', load: 38, securityRating: 'CLASS-A5', subsystems: 18 },
        actions: [
          { id: 'export_report', label: '合意レポートのエクスポート', description: '240体の推論木と裏づけ出典一覧をマークダウン出力。' }
        ]
      };

      const nodeB: SpatialNodeData = {
        id: `node-swarm-${timestamp}-2`,
        code: `SW-${(timestamp + 1).toString().slice(-4)}`,
        title: '生体適応型自律ガバナンス憲章',
        sector: '法令',
        category: '法令',
        summary: '自然法則と法規範を調和させる自己実行型プロトコル。',
        details: '環境負荷閾値を超過した際に資本プールの利用を一時凍結するスマート規制エンジン。',
        source: 'https://governance.ethz.ch/eco-statutes-2026',
        sourceId: `SRC-SW-${(timestamp + 1).toString().slice(-3)}`,
        status: 'ACTIVE',
        score_s: 0.91,
        radius_r: 0.09,
        theta: (Math.PI * 2 / 12) * 6 + 0.08,
        phi: 1.15,
        position: calculateNodePosition(0.09, (Math.PI * 2 / 12) * 6 + 0.08, 1.15),
        density_rho: 0.92,
        variance_sigma2: 0.04,
        topologyLabel: '中核',
        corroborationCount: 6,
        workerId: 'w-swarm-law-02',
        generation: 4,
        connections: [nodeA.id, 'node-doc-01', 'node-rec-01'],
        accentColor: '#4F46E5',
        tags: ['AI自律性', '暗号検証', '空間トポロジー', '法規制'],
        metrics: [
          { label: 'AUTO-COMPLIANCE', value: '99.9%', trend: '+0.4%', sparkline: [99, 99.5, 99.9] },
          { label: 'VERIFIED AGENTS', value: '188', trend: 'ACTIVE', sparkline: [12, 60, 150, 188] }
        ],
        telemetry: { latency: '1.4 ms', bandwidth: '1.2 Tbps', load: 44, securityRating: 'CLASS-A', subsystems: 14 },
        actions: [
          { id: 'enact_rule', label: 'ガバナンスルールの適用', description: 'スウォーム全体の自律性境界に本条約を適用。' }
        ]
      };

      const newLesson: MemoriaLesson = {
        id: Math.floor(Math.random() * 800) + 100,
        runId: `r_${timestamp.toString().slice(-8)}`,
        intent: query,
        verdict: 'pass',
        lesson: '自然と経済・法令の3系統を並列検証し、Kuramoto R=0.86に達した時点で中核ノードを確定できた。',
        nextTime: '関連項「空間トポロジー」のブリッジを介して建築セクターへのワーカー投入を早期化する。',
        tags: ['空間トポロジー', '合意形成', 'AI自律性'],
        sectors: ['経済', '法令', '自然', '建築'],
        workersCount: 240,
        promptVer: 'p1-2026-09',
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 30 * 86400000).toISOString(),
        n: 1,
        helped: 1,
        misled: 0,
        recalledScore: 0.92
      };

      setTimeout(() => {
        setSwarmStage('COMPLETED');
        onSwarmCompleted([nodeA, nodeB], newLesson);
      }, 900);
    }, 5000);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="voice-discovery-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-black/15 shadow-2xl overflow-hidden flex flex-col p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Hardware Trigger Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-black/70 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>1-TAP BLE TACT SWITCH / VOICE TRIGGER (FR-01, FR-16)</span>
          </span>
        </div>

        <h2 className="text-xl font-bold text-black tracking-tight mb-2">
          Discovery Agent Swarm 探索エンジン
        </h2>
        <p className="text-xs text-black/60 mb-6">
          音声1回の入力から最大600の論理サブエージェントを12領域へ並列展開し、共通項で結んだ結果セットを空間に生成します。
        </p>

        {/* Voice Trigger Orb Button */}
        <div className="flex flex-col items-center justify-center py-6">
          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 ring-8 ring-emerald-100 animate-pulse' 
                : 'bg-black text-white hover:scale-105 shadow-lg shadow-black/15'
            }`}
            title="マイクをタップして音声入力開始"
          >
            {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
          </button>
          <span className="text-[11px] font-mono font-bold text-black/60 mt-3">
            {isListening ? '音声受話中... 探索したい問いを話してください' : 'タップして音声認識を開始 (または下記テキスト入力)'}
          </span>
        </div>

        {/* Input Text Box */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="relative">
            <input
              type="text"
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              placeholder="例: 自律分散AIと地域循環経済の合意形成モデルを探索"
              disabled={swarmStage !== 'IDLE' && swarmStage !== 'COMPLETED'}
              className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl bg-black/[0.03] border border-black/10 focus:outline-none focus:border-black pr-28"
            />
            <button
              onClick={runSwarmDiscovery}
              disabled={swarmStage !== 'IDLE' && swarmStage !== 'COMPLETED'}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black/80 transition-all disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>探索起動</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[10px] font-mono text-black/40">プリセット:</span>
            {PRESET_INTENTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setIntentInput(p)}
                disabled={swarmStage !== 'IDLE' && swarmStage !== 'COMPLETED'}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 font-mono transition-colors"
              >
                {p.slice(0, 14)}...
              </button>
            ))}
          </div>
        </div>

        {/* Swarm Live Execution Visualizer */}
        {swarmStage !== 'IDLE' && (
          <div className="mt-2 p-4 rounded-2xl bg-black/[0.02] border border-black/10 flex flex-col gap-3 animate-in fade-in">
            {/* Live Progress Bar & Stage Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-black animate-spin" />
                <span className="text-xs font-bold text-black font-mono">
                  {swarmStage === 'P1_STRUCTURING' && 'STAGE 1/5: 意図構造化 (P1)'}
                  {swarmStage === 'P2_EXPLORING' && 'STAGE 2/5: 12領域並列展開 (P2)'}
                  {swarmStage === 'P3_SYNC' && 'STAGE 3/5: Kuramoto 位相同調 (P3)'}
                  {swarmStage === 'P4_VALIDATING' && 'STAGE 4/5: 独立裏づけ検証 (P4)'}
                  {swarmStage === 'P5_MEMORIA' && 'STAGE 5/5: Memoria 教訓保存 (P5)'}
                  {swarmStage === 'COMPLETED' && 'SWARM CONVERGED: 空間投影完了'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span>稼働エージェント: <strong>{activeAgentCount}</strong>体</span>
                <span>R: <strong>{currentKuramoto.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Live console logs */}
            <div className="p-2.5 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-24 overflow-y-auto">
              {statusLog.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>

            {swarmStage === 'COMPLETED' && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>3D空間の探索結果を確認する</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

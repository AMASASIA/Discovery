import React, { useState, useCallback, useRef, useMemo } from 'react';
import { SpatialScene } from './components/SpatialScene';
import { NavigationHUD } from './components/NavigationHUD';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { SemanticTermsPanel } from './components/SemanticTermsPanel';
import { MemoriaDrawer } from './components/MemoriaDrawer';
import { VoiceDiscoveryModal } from './components/VoiceDiscoveryModal';
import { 
  INITIAL_SPATIAL_NODES, 
  INITIAL_MEMORIA_LESSONS, 
  INITIAL_REFLECTION_QUESTIONS, 
  INITIAL_CONCEPTS,
  extractSemanticTerms,
  calculateNodePosition,
  DISCOVERY_SECTORS
} from './data/spatialNodes';
import { 
  SpatialNodeData, 
  GestureMode, 
  NodeCategory, 
  SpatialMetrics, 
  SwarmStatusMetrics, 
  MemoriaLesson, 
  DiscoverySector 
} from './types';
import { Plus, Volume2, VolumeX, Sparkles, SlidersHorizontal, Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [nodes, setNodes] = useState<SpatialNodeData[]>(INITIAL_SPATIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [gestureMode, setGestureMode] = useState<GestureMode>('ORBIT');
  const [activeGestureText, setActiveGestureText] = useState<string>('READY (DRAG TO ORBIT)');
  const [targetPreset, setTargetPreset] = useState<'overview' | 'top' | 'cluster' | 'reset' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Swarm Modals & Drawers
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSemanticPanelOpen, setIsSemanticPanelOpen] = useState(false);
  const [isMemoriaOpen, setIsMemoriaOpen] = useState(false);

  // Active Semantic Tag Filter (for 共通項 / 関連項)
  const [activeTermTag, setActiveTermTag] = useState<string | null>(null);

  // Memoria States (FR-14, FR-26)
  const [memoriaLessons, setMemoriaLessons] = useState<MemoriaLesson[]>(INITIAL_MEMORIA_LESSONS);
  const [reflectionQuestions, setReflectionQuestions] = useState(INITIAL_REFLECTION_QUESTIONS);
  const [concepts, setConcepts] = useState(INITIAL_CONCEPTS);

  // Swarm Status Metrics (FR-21~24, NFR-05, NFR-06)
  const [swarmMetrics, setSwarmMetrics] = useState<SwarmStatusMetrics>({
    kuramotoR: 0.74,
    kuramotoPsi: 0.42,
    activeAgents: 240,
    targetAgentsLimit: 600,
    completionRate: 94,
    failureRate: 3.2,
    currentRound: 4,
    maxRounds: 8,
    swarmState: 'SYNCHRONIZING',
    estimatedCost: 0.052,
    costLimit: 0.50,
    autonomyLevel: 3,
    emergencyStopped: false,
  });

  // Calculate Common Terms (3+ sectors) & Related Terms (2 sectors) - FR-08
  const semanticTerms = useMemo(() => {
    return extractSemanticTerms(nodes);
  }, [nodes]);

  // New Node Form State
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeSector, setNewNodeSector] = useState<DiscoverySector>('経済');

  const [metrics, setMetrics] = useState<SpatialMetrics>({
    renderFps: 60,
    nodeCount: INITIAL_SPATIAL_NODES.length,
    spatialEntropy: 0.88,
    activeLinks: 12,
    cameraDistance: 32,
  });

  // Audio synthesizer for spatial feedback
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSpatialTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before gesture
    }
  }, [soundEnabled]);

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) {
      playSpatialTone(587.33, 'triangle', 0.12);
    } else {
      playSpatialTone(293.66, 'sine', 0.06);
    }
  }, [playSpatialTone]);

  const handleHoverNode = useCallback((id: string | null) => {
    setHoveredNodeId(id);
    if (id) {
      playSpatialTone(440, 'sine', 0.04);
    }
  }, [playSpatialTone]);

  const handleApplyPreset = (preset: 'overview' | 'top' | 'cluster' | 'reset') => {
    setTargetPreset(preset);
    playSpatialTone(392, 'triangle', 0.08);
  };

  // Emergency Stop Handler (FR-15)
  const handleEmergencyStop = () => {
    setSwarmMetrics(prev => {
      const nextStopped = !prev.emergencyStopped;
      return {
        ...prev,
        emergencyStopped: nextStopped,
        swarmState: nextStopped ? 'STOPPED' : 'IDLE',
        activeAgents: nextStopped ? 0 : 60,
        kuramotoR: nextStopped ? 0.05 : 0.65
      };
    });
    playSpatialTone(220, 'sawtooth', 0.25);
  };

  // Graceful degradation scaling (NFR-06: 600 -> 150 -> 30)
  const handleChangeScaleLimit = (limit: number) => {
    setSwarmMetrics(prev => ({
      ...prev,
      targetAgentsLimit: limit,
      activeAgents: Math.min(prev.activeAgents, limit)
    }));
    playSpatialTone(523.25, 'triangle', 0.09);
  };

  // Swarm Completed Event
  const handleSwarmCompleted = (newDiscoveredNodes: SpatialNodeData[], newLesson: MemoriaLesson) => {
    setNodes(prev => [...newDiscoveredNodes, ...prev]);
    setMemoriaLessons(prev => [newLesson, ...prev]);
    setSwarmMetrics(prev => ({
      ...prev,
      kuramotoR: 0.88,
      completionRate: 100,
      currentRound: Math.min(8, prev.currentRound + 1),
      estimatedCost: prev.estimatedCost + 0.024,
      swarmState: 'CONVERGED'
    }));
    playSpatialTone(784, 'triangle', 0.25);
    // Focus on the first new node
    if (newDiscoveredNodes[0]) {
      setSelectedNodeId(newDiscoveredNodes[0].id);
    }
  };

  // Add custom node
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;

    const sectorCfg = DISCOVERY_SECTORS.find(s => s.sector === newNodeSector) || DISCOVERY_SECTORS[0];
    const score_s = 0.85;
    const radius_r = 0.15;
    const theta = sectorCfg.thetaBase + (Math.random() - 0.5) * 0.15;
    const phi = Math.random() * Math.PI * 2;
    const pos = calculateNodePosition(radius_r, theta, phi);

    const randomConnectedNode = nodes[Math.floor(Math.random() * nodes.length)].id;
    const newNode: SpatialNodeData = {
      id: `node-${Date.now()}`,
      code: `SEC-${sectorCfg.labelEn.slice(0, 3)}-${Math.floor(700 + Math.random() * 299)}`,
      title: newNodeTitle.toUpperCase(),
      sector: newNodeSector,
      category: newNodeSector,
      summary: 'ユーザー定義による空間探索ノード。',
      details: `極座標 (r=${radius_r}, θ=${(theta * 180 / Math.PI).toFixed(0)}°) に配置されたセクター別トポロジーノード。`,
      source: 'https://discovery.local/manual-entry',
      sourceId: 'SRC-USER',
      status: 'ACTIVE',
      score_s,
      radius_r,
      theta,
      phi,
      position: pos,
      density_rho: 0.85,
      variance_sigma2: 0.08,
      topologyLabel: '分岐',
      corroborationCount: 3,
      workerId: 'w-user-compiler',
      generation: 1,
      connections: [randomConnectedNode],
      accentColor: sectorCfg.accentColor,
      tags: ['空間トポロジー', '手動作成', newNodeSector],
      metrics: [
        { label: 'THROUGHPUT', value: '32.1k/s', trend: '+5.4%', sparkline: [18, 22, 28, 32.1] },
        { label: 'CONFIDENCE', value: '98.5%', trend: 'OPTIMAL', sparkline: [95, 96, 98.5] }
      ],
      telemetry: {
        latency: '2.0 ms',
        bandwidth: '500 Gbps',
        load: 35,
        securityRating: 'CLASS-A',
        subsystems: 8,
      },
      actions: [
        { id: 're-evaluate', label: 'トポロジー再評価', description: '現在のセクター境界との整合性をチェック。' }
      ]
    };

    setNodes(prev => [newNode, ...prev]);
    setSelectedNodeId(newNode.id);
    setNewNodeTitle('');
    setShowAddModal(false);
    playSpatialTone(659.25, 'triangle', 0.15);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F2F2EF] select-none">
      {/* 3D WebGL Canvas Layer */}
      <SpatialScene
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        hoveredNodeId={hoveredNodeId}
        onSelectNode={handleSelectNode}
        onHoverNode={handleHoverNode}
        gestureMode={gestureMode}
        onMetricsUpdate={setMetrics}
        onGestureActive={setActiveGestureText}
        targetPreset={targetPreset}
        onPresetApplied={() => setTargetPreset(null)}
        activeTagFilter={activeTermTag}
        kuramotoR={swarmMetrics.kuramotoR}
      />

      {/* UI Navigation & Spatial HUD Layer */}
      <NavigationHUD
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        hoveredNodeId={hoveredNodeId}
        onSelectNode={handleSelectNode}
        gestureMode={gestureMode}
        onSetGestureMode={setGestureMode}
        activeGestureText={activeGestureText}
        metrics={metrics}
        onApplyPreset={handleApplyPreset}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenVoiceDiscovery={() => setIsVoiceModalOpen(true)}
        onOpenSemanticTerms={() => setIsSemanticPanelOpen(prev => !prev)}
        onOpenMemoria={() => setIsMemoriaOpen(prev => !prev)}
        semanticTermsCount={semanticTerms.length}
        activeTermTag={activeTermTag}
        onClearActiveTerm={() => setActiveTermTag(null)}
      />

      {/* Node Inspector Detail Panel (Right Sidebar) */}
      <NodeDetailPanel
        node={selectedNode}
        allNodes={nodes}
        onClose={() => setSelectedNodeId(null)}
        onFocusNode={(id) => handleSelectNode(id)}
        onSelectTag={(tag) => {
          setActiveTermTag(prev => prev === tag ? null : tag);
          playSpatialTone(520, 'sine', 0.08);
        }}
      />

      {/* 共通項 & 関連項 Semantic Relations Drawer */}
      <SemanticTermsPanel
        terms={semanticTerms}
        activeTerm={activeTermTag}
        onSelectTerm={(tag) => {
          setActiveTermTag(tag);
          playSpatialTone(tag ? 640 : 320, 'triangle', 0.08);
        }}
        isOpen={isSemanticPanelOpen}
        onClose={() => setIsSemanticPanelOpen(false)}
      />

      {/* Memoria Experience Learning Panel */}
      <MemoriaDrawer
        isOpen={isMemoriaOpen}
        onClose={() => setIsMemoriaOpen(false)}
        lessons={memoriaLessons}
        reflectionQuestions={reflectionQuestions}
        concepts={concepts}
        onTriggerReflection={(q) => {
          playSpatialTone(440, 'triangle', 0.1);
        }}
        onClearExpired={() => {
          setMemoriaLessons(prev => prev.filter(l => (l.recalledScore ?? 1) > 0.8));
          playSpatialTone(300, 'sine', 0.12);
        }}
      />

      {/* 1-Tap Voice Discovery & Swarm Orchestrator Modal */}
      <VoiceDiscoveryModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSwarmCompleted={handleSwarmCompleted}
        onUpdateKuramotoR={(r) => {
          setSwarmMetrics(prev => ({ ...prev, kuramotoR: r }));
        }}
      />

      {/* Bottom Right Floating Action Bar */}
      <div className="fixed bottom-6 right-8 z-30 flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setShowAddModal(true)}
          title="新規ノードの追加"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black text-white hover:bg-black/85 transition-all text-xs font-bold tracking-wider shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>SPAWN NODE</span>
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? '音声をミュート' : '音声を再生'}
          className="p-2.5 rounded-xl bg-white/80 backdrop-blur-md border border-black/10 hover:bg-white text-black/70 hover:text-black transition-all shadow-sm"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-black/40" />}
        </button>
      </div>

      {/* Spawn Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-black/15 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-[9px] tracking-[0.3em] font-bold text-black/40">SPATIAL COMPILER</div>
                <h3 className="text-lg font-bold text-black">12領域 空間ノードの生成</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-black/40 hover:text-black p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-black/50 uppercase mb-1">
                  ノード名称 (Title)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 動的分散ルーティングプロトコル"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-bold text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-black/50 uppercase mb-1">
                  所属セクター (12領域)
                </label>
                <select
                  value={newNodeSector}
                  onChange={(e) => setNewNodeSector(e.target.value as DiscoverySector)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-bold text-black focus:outline-none focus:border-black bg-white"
                >
                  {DISCOVERY_SECTORS.map(s => (
                    <option key={s.sector} value={s.sector}>
                      【{s.sector}】 {s.labelEn} - {s.description.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-black/60 hover:text-black"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black text-white text-xs font-bold tracking-wider hover:bg-black/90 shadow-md"
                >
                  空間に配置する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

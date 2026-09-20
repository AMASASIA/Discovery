import React, { useState, useCallback, useRef, useMemo } from 'react';
import { SpatialScene } from './components/SpatialScene';
import { NavigationHUD } from './components/NavigationHUD';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { SemanticTermsPanel } from './components/SemanticTermsPanel';
import { MemoriaDrawer } from './components/MemoriaDrawer';
import { VoiceDiscoveryModal } from './components/VoiceDiscoveryModal';
import { CameraCaptureWidget } from './components/CameraCaptureWidget';
import { QuickDataUploadModal } from './components/QuickDataUploadModal';
import { GeminiLiveVoiceModal } from './components/GeminiLiveVoiceModal';
import { MapsGroundingModal } from './components/MapsGroundingModal';
import { GeminiChatbotPanel } from './components/GeminiChatbotPanel';
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
  DiscoverySector,
  NodeMediaAttachment
} from './types';
import { Plus, Volume2, VolumeX, Sparkles, SlidersHorizontal, Radio, Camera, UploadCloud } from 'lucide-react';

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

  // Media attachment state for Spawn Node Modal (Browser Camera API & photo upload)
  const [spawnNodeMedia, setSpawnNodeMedia] = useState<NodeMediaAttachment | null>(null);

  // Swarm & Feature Modals & Drawers
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSemanticPanelOpen, setIsSemanticPanelOpen] = useState(false);
  const [isMemoriaOpen, setIsMemoriaOpen] = useState(false);
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isMapsGroundingOpen, setIsMapsGroundingOpen] = useState(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState(false);

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

  // Add custom node (with photo / camera snapshot / file metadata)
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;

    const sectorCfg = DISCOVERY_SECTORS.find(s => s.sector === newNodeSector) || DISCOVERY_SECTORS[0];
    const score_s = 0.85;
    const radius_r = 0.15;
    const theta = sectorCfg.thetaBase + (Math.random() - 0.5) * 0.15;
    const phi = Math.random() * Math.PI * 2;
    const pos = calculateNodePosition(radius_r, theta, phi);

    const randomConnectedNode = nodes[Math.floor(Math.random() * nodes.length)]?.id || 'node-01';
    const hasMedia = !!spawnNodeMedia;
    const tags = ['空間トポロジー', '手動作成', newNodeSector];
    if (hasMedia) {
      if (spawnNodeMedia.type === 'snapshot') {
        tags.push('写メ記録', 'カメラ撮影');
      } else {
        tags.push('写真添付');
      }
    }

    const newNode: SpatialNodeData = {
      id: `node-${Date.now()}`,
      code: `SEC-${sectorCfg.labelEn.slice(0, 3)}-${Math.floor(700 + Math.random() * 299)}`,
      title: newNodeTitle.toUpperCase(),
      sector: newNodeSector,
      category: newNodeSector,
      summary: hasMedia 
        ? `${spawnNodeMedia.sourceDevice || 'カメラ'}から埋め込まれた空間記録ノード。` 
        : 'ユーザー定義による空間探索ノード。',
      details: hasMedia
        ? `【添付メディア】${spawnNodeMedia.filename || '写メ'}, 解像度: ${spawnNodeMedia.resolution || 'N/A'}, 撮影: ${spawnNodeMedia.capturedAt || 'N/A'}。極座標 (r=${radius_r}, θ=${(theta * 180 / Math.PI).toFixed(0)}°)`
        : `極座標 (r=${radius_r}, θ=${(theta * 180 / Math.PI).toFixed(0)}°) に配置されたセクター別トポロジーノード。`,
      source: 'https://discovery.local/manual-entry',
      sourceId: hasMedia ? 'SRC-CAMERA-METADATA' : 'SRC-USER',
      status: 'ACTIVE',
      imageUrl: spawnNodeMedia?.dataUrl,
      mediaAttachment: spawnNodeMedia || undefined,
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
      tags,
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
    setSpawnNodeMedia(null);
    setShowAddModal(false);
    playSpatialTone(659.25, 'triangle', 0.15);
  };

  // Add node from Quick Photo & Data Intake Modal
  const handleAddNodeWithMedia = (data: {
    title: string;
    sector: DiscoverySector;
    summary: string;
    details: string;
    media: NodeMediaAttachment | null;
  }) => {
    const sectorCfg = DISCOVERY_SECTORS.find(s => s.sector === data.sector) || DISCOVERY_SECTORS[0];
    const score_s = 0.90;
    const radius_r = 0.12;
    const theta = sectorCfg.thetaBase + (Math.random() - 0.5) * 0.12;
    const phi = Math.random() * Math.PI * 2;
    const pos = calculateNodePosition(radius_r, theta, phi);

    const randomConnectedNode = nodes[Math.floor(Math.random() * nodes.length)]?.id || 'node-01';
    const tags = [data.sector, 'クイック登録'];
    if (data.media?.type === 'snapshot') {
      tags.push('写メ', 'カメラ撮影');
    } else if (data.media) {
      tags.push('データ添付');
    }

    const newNode: SpatialNodeData = {
      id: `node-${Date.now()}`,
      code: `SEC-${sectorCfg.labelEn.slice(0, 3)}-${Math.floor(700 + Math.random() * 299)}`,
      title: data.title.toUpperCase(),
      sector: data.sector,
      category: data.sector,
      summary: data.summary,
      details: data.details,
      source: 'https://discovery.local/quick-intake',
      sourceId: data.media ? 'SRC-MEDIA-INTAKE' : 'SRC-QUICK',
      status: 'ACTIVE',
      imageUrl: data.media?.dataUrl,
      mediaAttachment: data.media || undefined,
      score_s,
      radius_r,
      theta,
      phi,
      position: pos,
      density_rho: 0.90,
      variance_sigma2: 0.05,
      topologyLabel: '中核',
      corroborationCount: 4,
      workerId: 'w-intake-agent',
      generation: 1,
      connections: [randomConnectedNode],
      accentColor: sectorCfg.accentColor,
      tags,
      metrics: [
        { label: 'THROUGHPUT', value: '44.8k/s', trend: '+12.1%', sparkline: [25, 30, 38, 44.8] },
        { label: 'CONFIDENCE', value: '99.1%', trend: 'OPTIMAL', sparkline: [96, 98, 99.1] }
      ],
      telemetry: {
        latency: '1.4 ms',
        bandwidth: '1.2 Tbps',
        load: 28,
        securityRating: 'CLASS-A',
        subsystems: 12,
      },
      actions: [
        { id: 'inspect-media', label: 'メディア整合性検証', description: '撮影日時・位置メタデータと空間トポロジーを照合。' }
      ]
    };

    setNodes(prev => [newNode, ...prev]);
    setSelectedNodeId(newNode.id);
    playSpatialTone(784, 'triangle', 0.18);
  };

  // Add node from Google Maps Grounding
  const handleAddNodeFromMaps = (nodeData: any) => {
    const sector: DiscoverySector = '建築';
    const sectorCfg = DISCOVERY_SECTORS.find(s => s.sector === sector) || DISCOVERY_SECTORS[0];
    const radius_r = 0.18;
    const theta = sectorCfg.thetaBase;
    const phi = Math.PI * 0.5;
    const pos = calculateNodePosition(radius_r, theta, phi);
    const newNode: SpatialNodeData = {
      id: `node-${Date.now()}`,
      code: `SEC-ARC-${Math.floor(700 + Math.random() * 299)}`,
      title: (nodeData.title || 'MAPS SPOT').toUpperCase(),
      sector,
      category: sector,
      summary: nodeData.summary || 'Google Maps 空間スポット',
      details: nodeData.details || 'Maps Grounding経由で取得された位置情報ノード',
      source: nodeData.source || 'https://maps.google.com',
      sourceId: 'SRC-GOOGLE-MAPS',
      status: 'ACTIVE',
      score_s: 0.82,
      radius_r,
      theta,
      phi,
      position: pos,
      density_rho: 0.82,
      variance_sigma2: 0.09,
      topologyLabel: '周縁',
      corroborationCount: 2,
      workerId: 'w-maps-grounding',
      generation: 1,
      connections: [nodes[0]?.id || 'node-01'],
      accentColor: sectorCfg.accentColor,
      tags: ['建築', 'スポット', 'Maps'],
      metrics: [
        { label: 'ACCURACY', value: '96.2%', trend: '+3.1%', sparkline: [88, 92, 96.2] },
        { label: 'VERIFIED', value: 'YES', trend: 'STABLE', sparkline: [1, 1, 1] }
      ],
      telemetry: {
        latency: '3.2 ms',
        bandwidth: '100 Mbps',
        load: 20,
        securityRating: 'CLASS-A',
        subsystems: 4,
      },
      actions: [
        { id: 'maps-sync', label: '位置情報再検証', description: 'Google Maps Place APIと同期。' }
      ]
    };
    setNodes(prev => [newNode, ...prev]);
    setSelectedNodeId(newNode.id);
    playSpatialTone(587.33, 'sine', 0.12);
  };

  // Add node from Gemini Chatbot
  const handleAddNodeFromChat = (nodeData: { title: string; sector: string; summary: string }) => {
    const matchedSector = (DISCOVERY_SECTORS.find(s => s.sector === nodeData.sector)?.sector || '文書') as DiscoverySector;
    const sectorCfg = DISCOVERY_SECTORS.find(s => s.sector === matchedSector) || DISCOVERY_SECTORS[0];
    const radius_r = 0.16;
    const theta = sectorCfg.thetaBase;
    const phi = Math.PI * 0.3;
    const pos = calculateNodePosition(radius_r, theta, phi);
    const newNode: SpatialNodeData = {
      id: `node-${Date.now()}`,
      code: `SEC-DOC-${Math.floor(700 + Math.random() * 299)}`,
      title: nodeData.title.toUpperCase(),
      sector: matchedSector,
      category: matchedSector,
      summary: nodeData.summary,
      details: `Gemini AIチャット対話から抽出・生成された空間ノード。`,
      source: 'https://gemini.google.com',
      sourceId: 'SRC-GEMINI-AI',
      status: 'ACTIVE',
      score_s: 0.88,
      radius_r,
      theta,
      phi,
      position: pos,
      density_rho: 0.88,
      variance_sigma2: 0.07,
      topologyLabel: '中核',
      corroborationCount: 3,
      workerId: 'w-gemini-chat',
      generation: 1,
      connections: [nodes[0]?.id || 'node-01'],
      accentColor: sectorCfg.accentColor,
      tags: [matchedSector, 'Gemini AI', 'チャット生成'],
      metrics: [
        { label: 'COHERENCE', value: '99.4%', trend: '+8.2%', sparkline: [90, 95, 99.4] },
        { label: 'QUALITY', value: 'HIGH', trend: 'OPTIMAL', sparkline: [92, 96, 99.4] }
      ],
      telemetry: {
        latency: '1.8 ms',
        bandwidth: '1 Gbps',
        load: 25,
        securityRating: 'CLASS-A',
        subsystems: 6,
      },
      actions: [
        { id: 'ai-expand', label: '対話深掘り', description: 'Geminiモデルによりさらなる関連ノードを推論。' }
      ]
    };
    setNodes(prev => [newNode, ...prev]);
    setSelectedNodeId(newNode.id);
    playSpatialTone(659.25, 'triangle', 0.12);
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
        onOpenQuickUpload={() => setIsQuickUploadOpen(true)}
        onOpenGeminiLive={() => setIsLiveVoiceOpen(true)}
        onOpenMapsGrounding={() => setIsMapsGroundingOpen(true)}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
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

      {/* Top Screen Quick Photo & Data Intake Modal */}
      <QuickDataUploadModal
        isOpen={isQuickUploadOpen}
        onClose={() => setIsQuickUploadOpen(false)}
        onAddNodeWithMedia={handleAddNodeWithMedia}
      />

      {/* Gemini Live Voice Realtime Modal */}
      <GeminiLiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* Google Maps Grounding Spatial Spots Modal */}
      <MapsGroundingModal
        isOpen={isMapsGroundingOpen}
        onClose={() => setIsMapsGroundingOpen(false)}
        onAddSpatialNode={handleAddNodeFromMaps}
      />

      {/* Gemini Multi-turn Chatbot Panel */}
      <GeminiChatbotPanel
        isOpen={isGeminiChatOpen}
        onClose={() => setIsGeminiChatOpen(false)}
        onAddSpatialNode={handleAddNodeFromChat}
      />

      {/* Bottom Right Floating Action Bar */}
      <div className="fixed bottom-6 right-8 z-30 flex items-center gap-2.5 pointer-events-auto">
        {/* Quick Camera Snapshot / Upload Button */}
        <button
          onClick={() => setIsQuickUploadOpen(true)}
          title="Top画面 写真・写メ・データアップロード"
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/90 hover:bg-white text-black border border-black/10 transition-all text-xs font-bold shadow-md"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">写真/写メ登録</span>
        </button>

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

      {/* Spawn Node Modal (Extended with Browser Camera API & Photo Metadata) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-black/15 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-3">
              <div>
                <div className="text-[9px] tracking-[0.3em] font-bold text-black/40 uppercase">SPATIAL COMPILER</div>
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  <span>12領域 空間ノードの生成</span>
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setSpawnNodeMedia(null);
                }}
                className="text-black/40 hover:text-black p-1.5 rounded-full hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-black/60 uppercase mb-1">
                  1. ノード名称 (Title)
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
                <label className="block text-[10px] font-bold tracking-wider text-black/60 uppercase mb-1">
                  2. 所属セクター (12領域)
                </label>
                <select
                  value={newNodeSector}
                  onChange={(e) => setNewNodeSector(e.target.value as DiscoverySector)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 text-sm font-bold text-black focus:outline-none focus:border-black bg-white"
                >
                  {DISCOVERY_SECTORS.map(s => (
                    <option key={s.sector} value={s.sector}>
                      【{s.sector}】 {s.labelEn} - {s.description.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera & Photo Snapshot embedding into node metadata */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-black/60 uppercase mb-1.5 flex items-center justify-between">
                  <span>3. 写真・写メ・データ添付 (Browser Camera API)</span>
                  {spawnNodeMedia && (
                    <span className="text-[9px] text-emerald-600 font-mono font-bold">● メタデータ準備完了</span>
                  )}
                </label>
                <CameraCaptureWidget
                  onMediaCaptured={setSpawnNodeMedia}
                  currentMedia={spawnNodeMedia}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSpawnNodeMedia(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-black/60 hover:text-black"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold tracking-wider hover:bg-black/90 shadow-md active:scale-98 transition-all"
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

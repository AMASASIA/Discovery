import React, { useState } from 'react';
import { 
  Compass, 
  Rotate3d, 
  Move, 
  Maximize2, 
  Layers, 
  Search, 
  MousePointer, 
  Crosshair, 
  Activity, 
  ChevronRight, 
  Sparkles,
  History,
  Clock,
  X,
  ArrowRight,
  Mic,
  Share2,
  Radio,
  MapPin,
  Bot,
  Camera,
  UploadCloud
} from 'lucide-react';
import { GestureMode, NodeCategory, SpatialNodeData, SpatialMetrics, DiscoverySector } from '../types';
import { DISCOVERY_SECTORS } from '../data/spatialNodes';
import { AuthButton } from './AuthButton';

interface NavigationHUDProps {
  nodes: SpatialNodeData[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  gestureMode: GestureMode;
  onSetGestureMode: (mode: GestureMode) => void;
  activeGestureText: string;
  metrics: SpatialMetrics;
  onApplyPreset: (preset: 'overview' | 'top' | 'cluster' | 'reset') => void;
  selectedCategory: NodeCategory | 'ALL';
  onSelectCategory: (cat: NodeCategory | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenVoiceDiscovery: () => void;
  onOpenSemanticTerms: () => void;
  onOpenMemoria: () => void;
  onOpenQuickUpload?: () => void;
  onOpenGeminiLive?: () => void;
  onOpenMapsGrounding?: () => void;
  onOpenGeminiChat?: () => void;
  semanticTermsCount: number;
  activeTermTag: string | null;
  onClearActiveTerm: () => void;
}

const SEARCH_HISTORY_STORAGE_KEY = 'discovery_spatial_search_history';
const DEFAULT_SEARCH_HISTORY = [
  '自律分散流動性プロトコル (AMM v4)',
  '計算可能契約と自律ガバナンス憲章',
  '生体位相同調と音響トポロジー',
  '粘菌輸送網の分散最適化アルゴリズム',
  '不変台帳とゼロ知識来歴証明 (ZK-Proof)'
];

const CATEGORIES: (NodeCategory | 'ALL')[] = [
  'ALL',
  '経済',
  'アート',
  'SNS',
  '人',
  '音声',
  '文書',
  '法令',
  '建築',
  '自然',
  'スケッチ',
  '記録',
  'メディア'
];

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
  nodes,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  gestureMode,
  onSetGestureMode,
  activeGestureText,
  metrics,
  onApplyPreset,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenVoiceDiscovery,
  onOpenSemanticTerms,
  onOpenMemoria,
  onOpenQuickUpload,
  onOpenGeminiLive,
  onOpenMapsGrounding,
  onOpenGeminiChat,
  semanticTermsCount,
  activeTermTag,
  onClearActiveTerm,
}) => {
  // Persistent Search History: Last 5 queried node titles stored in localStorage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_SEARCH_HISTORY;
  });

  const saveHistory = (newHistory: string[]) => {
    const sliced = newHistory.slice(0, 5);
    setSearchHistory(sliced);
    try {
      localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(sliced));
    } catch {
      // storage unavailable
    }
  };

  const addToSearchHistory = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const filtered = searchHistory.filter(
      item => item.toLowerCase() !== trimmed.toLowerCase()
    );
    saveHistory([trimmed, ...filtered]);
  };

  const removeFromSearchHistory = (e: React.MouseEvent, titleToRemove: string) => {
    e.stopPropagation();
    const filtered = searchHistory.filter(item => item !== titleToRemove);
    saveHistory(filtered);
  };

  const clearSearchHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistory([]);
  };

  const handleJumpToHistoryItem = (title: string) => {
    onSearchChange(title);
    addToSearchHistory(title);
    // Find matching node and focus on it
    const matchingNode = nodes.find(
      n => n.title.toLowerCase() === title.toLowerCase() ||
           n.code.toLowerCase() === title.toLowerCase() ||
           n.title.toLowerCase().includes(title.toLowerCase())
    );
    if (matchingNode) {
      onSelectNode(matchingNode.id);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        const matchingNode = nodes.find(n => 
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const titleToAdd = matchingNode ? matchingNode.title : searchQuery.trim();
        addToSearchHistory(titleToAdd);
        if (matchingNode) {
          onSelectNode(matchingNode.id);
        }
      }
    }
  };

  const handleNodeClick = (node: SpatialNodeData) => {
    const isSelected = selectedNodeId === node.id;
    const nextId = isSelected ? null : node.id;
    onSelectNode(nextId);
    if (nextId) {
      addToSearchHistory(node.title);
    }
  };

  const filteredNodes = nodes.filter(n => {
    const matchesCat = selectedCategory === 'ALL' || n.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      {/* Top Header Bar */}
      <header 
        id="spatial-hud-header"
        className="fixed top-0 left-0 right-0 z-30 px-8 py-5 flex items-center justify-between pointer-events-none"
      >
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="w-9 h-9 rounded-xl border border-black/15 bg-white/80 backdrop-blur-md flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 text-black/80" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] font-bold text-black/40">SPATIAL REGISTRY</div>
            <h1 className="text-xl font-bold tracking-wider text-black/90">DISCOVERY OS v1.0</h1>
          </div>
        </div>

        {/* Live Spatial Telemetry Pills */}
        <div className="hidden lg:flex items-center gap-6 pointer-events-auto bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-black/10 shadow-sm text-[11px] font-semibold text-black/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>NODE ARRAY: <strong className="text-black">{metrics.nodeCount} NODES</strong></span>
          </div>
          <div className="w-[1px] h-3 bg-black/15"></div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-black/40" />
            <span>RENDER FPS: <strong className="text-black">{metrics.renderFps}</strong></span>
          </div>
          <div className="w-[1px] h-3 bg-black/15"></div>
          <div>
            <span>DEPTH: <strong className="text-black">{metrics.cameraDistance}m</strong></span>
          </div>
          <div className="w-[1px] h-3 bg-black/15"></div>
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            <Sparkles className="w-3 h-3" />
            <span>TOPOLOGY STABLE</span>
          </div>
        </div>

        {/* Swarm Engine Actions Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 1-Tap Voice Discovery Button (FR-01, FR-16) */}
          <button
            onClick={onOpenVoiceDiscovery}
            title="1-タップ音声探索 (FR-01, FR-16): 最大600エージェント並列起動"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black text-white hover:bg-black/85 transition-all text-xs font-bold tracking-wide shadow-md"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>1-TAP DISCOVERY</span>
          </button>

          {/* 共通項 & 関連項 Button (FR-08) */}
          <button
            onClick={onOpenSemanticTerms}
            title="共通項 & 関連項インスペクター (FR-08): 領域横断ブリッジ"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
              activeTermTag 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow' 
                : 'bg-white/85 text-black/80 hover:text-black border-black/10 hover:bg-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>共通項 & 関連項</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              activeTermTag ? 'bg-white/25 text-white' : 'bg-black/5 text-black/60'
            }`}>
              {semanticTermsCount}
            </span>
          </button>

          {/* Memoria 経験学習 Button (FR-14) */}
          <button
            onClick={onOpenMemoria}
            title="Memoria 経験学習パネル (FR-14): 検証・教訓・内省"
            className="flex items-center px-3.5 py-2 rounded-xl bg-white/85 text-black/80 hover:text-black hover:bg-white border border-black/10 transition-all text-xs font-semibold tracking-wide shadow-sm"
          >
            <span>MEMORIA</span>
          </button>

          {/* 写真・写メ・データアップロード (Top画面クイック登録) */}
          {onOpenQuickUpload && (
            <button
              onClick={onOpenQuickUpload}
              title="写真・写メ・データアップロード: カメラ撮影や画像・データファイルを3D空間に配置"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 text-black/80 hover:text-black hover:bg-white border border-black/10 transition-all text-xs font-bold tracking-wide shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">写真・データ登録</span>
              <span className="sm:hidden">写メ</span>
            </button>
          )}

          {/* Gemini Live Voice Modal trigger if provided */}
          {onOpenGeminiLive && (
            <button
              onClick={onOpenGeminiLive}
              title="Gemini Live 音声対話"
              className="p-2 rounded-xl bg-white/85 text-black/70 hover:text-black hover:bg-white border border-black/10 transition-all shadow-sm"
            >
              <Radio className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}

          {/* Maps Grounding trigger if provided */}
          {onOpenMapsGrounding && (
            <button
              onClick={onOpenMapsGrounding}
              title="Maps Grounding 空間スポット探索"
              className="p-2 rounded-xl bg-white/85 text-black/70 hover:text-black hover:bg-white border border-black/10 transition-all shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
            </button>
          )}

          {/* Gemini Chatbot trigger if provided */}
          {onOpenGeminiChat && (
            <button
              onClick={onOpenGeminiChat}
              title="Gemini AI チャット"
              className="p-2 rounded-xl bg-white/85 text-black/70 hover:text-black hover:bg-white border border-black/10 transition-all shadow-sm"
            >
              <Bot className="w-3.5 h-3.5 text-purple-600" />
            </button>
          )}

          {/* Google Auth Button */}
          <AuthButton />

          {/* Live Gesture Status Badge */}
          <div className="hidden xl:flex items-center gap-2 bg-black/80 backdrop-blur-md text-white px-3 py-2 rounded-xl text-[10px] font-mono tracking-widest shadow-sm">
            <MousePointer className="w-3 h-3 text-white/70 animate-bounce" />
            <span>{activeGestureText || 'READY'}</span>
          </div>
        </div>
      </header>

      {/* Left Sidebar: Search, Persistent History, Directory & Filters */}
      <aside 
        id="spatial-node-directory"
        className="fixed top-24 left-8 z-30 w-80 flex flex-col gap-3 pointer-events-auto max-h-[calc(100vh-140px)]"
      >
        {/* Search Input */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-black/10 p-3 shadow-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-black/40 ml-1 shrink-0" />
          <input 
            type="text" 
            placeholder="Search spatial nodes (press Enter)..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-transparent text-xs text-black placeholder-black/35 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="text-[10px] text-black/40 hover:text-black px-1.5 py-0.5 rounded bg-black/5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Persistent Search History: Last 5 queried node titles */}
        {searchHistory.length > 0 && (
          <div 
            id="persistent-search-history" 
            className="bg-white/80 backdrop-blur-md rounded-2xl border border-black/10 p-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between text-[9px] tracking-[0.2em] font-bold text-black/40 mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <History className="w-3 h-3 text-black/50" />
                <span>RECENT QUERIES (LAST {searchHistory.length})</span>
              </div>
              <button
                onClick={clearSearchHistory}
                title="Clear Search History"
                className="text-[8px] text-black/40 hover:text-black hover:underline tracking-wider uppercase font-semibold transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="space-y-1">
              {searchHistory.map((item, index) => {
                const isCurrentQuery = searchQuery.trim().toLowerCase() === item.toLowerCase();
                const matchingNode = nodes.find(n => n.title.toLowerCase() === item.toLowerCase());
                const isNodeSelected = matchingNode && selectedNodeId === matchingNode.id;

                return (
                  <div
                    key={`${item}-${index}`}
                    onClick={() => handleJumpToHistoryItem(item)}
                    title={`Jump back to: ${item}`}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer ${
                      isCurrentQuery || isNodeSelected
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-black/[0.02] hover:bg-black/5 border-transparent text-black/80 hover:border-black/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <Clock className={`w-3 h-3 shrink-0 ${isCurrentQuery || isNodeSelected ? 'text-white/60' : 'text-black/35 group-hover:text-black/60'}`} />
                      <span className="truncate font-semibold tracking-wide">{item}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => removeFromSearchHistory(e, item)}
                        title="Remove from history"
                        className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity ${
                          isCurrentQuery || isNodeSelected ? 'text-white/70 hover:text-white' : 'text-black/40 hover:text-black'
                        }`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <ArrowRight className={`w-3 h-3 shrink-0 ${isCurrentQuery || isNodeSelected ? 'text-white' : 'opacity-30 group-hover:opacity-70'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter Chips */}
        <div className="bg-white/75 backdrop-blur-md rounded-2xl border border-black/10 p-2.5 shadow-sm">
          <div className="text-[9px] tracking-[0.2em] font-bold text-black/40 mb-2 px-1">SPATIAL SECTORS</div>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider transition-all ${
                  selectedCategory === cat 
                    ? 'bg-black text-white shadow-sm' 
                    : 'bg-black/5 text-black/60 hover:bg-black/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Node List */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-black/10 p-2.5 shadow-sm flex-1 overflow-y-auto space-y-1.5">
          <div className="text-[9px] tracking-[0.2em] font-bold text-black/40 mb-1 px-1 flex justify-between items-center">
            <span>NODES ({filteredNodes.length})</span>
            <span className="text-[8px] opacity-70">CLICK TO FOCUS</span>
          </div>

          {filteredNodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;

            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected 
                    ? 'bg-black text-white border-black shadow-md' 
                    : isHovered
                    ? 'bg-black/10 border-black/20 text-black'
                    : 'bg-black/[0.02] hover:bg-black/5 border-transparent text-black/80'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                    <span className="text-[9px] font-mono opacity-60">{node.code}</span>
                  </div>
                  <div className="text-xs font-bold truncate">{node.title}</div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-40 ${isSelected ? 'rotate-90 text-white opacity-100' : ''}`} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Bottom Center: Mouse Gesture Navigation Controls & Presets */}
      <nav 
        id="spatial-gesture-toolbar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-black/15 shadow-xl"
      >
        {/* Navigation Presets */}
        <div className="flex items-center gap-1.5 border-r border-black/10 pr-3">
          <button 
            onClick={() => onApplyPreset('overview')}
            title="Overview 3D Perspective"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider text-black/70 hover:text-black hover:bg-black/5 transition-all"
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>OVERVIEW</span>
          </button>
          <button 
            onClick={() => onApplyPreset('top')}
            title="Zenith Top-Down Grid View"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider text-black/70 hover:text-black hover:bg-black/5 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>TOP GRID</span>
          </button>
          <button 
            onClick={() => onApplyPreset('cluster')}
            title="Dense Core Inspection"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider text-black/70 hover:text-black hover:bg-black/5 transition-all"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>CLUSTER</span>
          </button>
          <button 
            onClick={() => onApplyPreset('reset')}
            title="Reset Camera Coordinates"
            className="p-2 rounded-xl text-black/50 hover:text-black hover:bg-black/5 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Gesture Mode Selector */}
        <div className="flex items-center gap-1.5 border-r border-black/10 pr-3">
          <span className="text-[9px] font-bold tracking-wider text-black/40 uppercase ml-1">Gesture:</span>
          <button
            onClick={() => onSetGestureMode('ORBIT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all ${
              gestureMode === 'ORBIT'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/60 hover:bg-black/5'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>ORBIT</span>
          </button>
          <button
            onClick={() => onSetGestureMode('PAN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all ${
              gestureMode === 'PAN'
                ? 'bg-black text-white shadow-sm'
                : 'text-black/60 hover:bg-black/5'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>PAN</span>
          </button>
        </div>

        {/* Mouse Gestures Reference Hints */}
        <div className="hidden xl:flex items-center gap-4 text-[10px] text-black/50 pl-1 font-mono">
          <span><kbd className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 font-bold text-black">Left-Drag</kbd> Orbit</span>
          <span><kbd className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 font-bold text-black">Right / Shift-Drag</kbd> Pan</span>
          <span><kbd className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 font-bold text-black">Scroll</kbd> Zoom</span>
          <span><kbd className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 font-bold text-black">Click Node</kbd> Focus</span>
        </div>
      </nav>
    </>
  );
};

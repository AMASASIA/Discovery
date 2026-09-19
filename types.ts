export type DiscoverySector = 
  | '経済'
  | 'アート'
  | 'SNS'
  | '人'
  | '音声'
  | '文書'
  | '法令'
  | '建築'
  | '自然'
  | 'スケッチ'
  | '記録'
  | 'メディア';

export type NodeCategory = DiscoverySector | 'ANALYTICS' | 'STRATEGY' | 'PROTOCOL' | 'SYSTEM' | 'QUANTUM' | 'STORAGE' | 'TELEMETRY';

export type NodeStatus = 'ONLINE' | 'ACTIVE' | 'SYNCHRONIZED' | 'STANDBY' | 'OPTIMIZING';

export type TopologyLabel = '中核' | '分岐' | '周縁' | '関連';

export interface NodeMetric {
  label: string;
  value: string;
  trend: string;
  sparkline: number[];
}

export interface NodeTelemetry {
  latency: string;
  bandwidth: string;
  load: number;
  securityRating: string;
  subsystems: number;
}

export interface NodeAction {
  id: string;
  label: string;
  description: string;
  statusText?: string;
}

export interface SpatialNodeData {
  id: string;
  code: string;
  title: string;
  sector: DiscoverySector;
  category: DiscoverySector;
  summary: string; // 80字以内の要約 (P2)
  details: string;
  source: string; // URL または ソースID (FR-05)
  sourceId?: string;
  status: NodeStatus;

  // Radial Coordinate Model (FR-07, FR-10)
  score_s: number; // 自己評価 s (0〜1)
  radius_r: number; // 距離 r = 1 - s (0〜1)
  theta: number; // 方位 theta (ラジアン)
  phi: number; // 位相 phi (ラジアン)
  position: [number, number, number]; // 3D極座標マップ変換 [x, y, z]

  // Topology Classification (FR-09)
  density_rho: number; // 密度 rho
  variance_sigma2: number; // 分散 sigma^2
  topologyLabel: TopologyLabel; // 中核 | 分岐 | 周縁 | 関連

  // Swarm Corroboration & Lineage (FR-12, FR-23)
  corroborationCount: number; // 裏づけエージェント数
  workerId: string;
  generation: number;

  connections: string[];
  metrics: NodeMetric[];
  telemetry: NodeTelemetry;
  actions: NodeAction[];
  tags: string[]; // 名詞 3〜6個 (P2)
  accentColor: string;
}

export interface SemanticTermRelation {
  tag: string;
  type: 'COMMON' | 'RELATED'; // 共通項 (3領域以上) | 関連項 (2領域)
  sectors: DiscoverySector[];
  nodeIds: string[];
  itemCount: number;
}

export interface SwarmStatusMetrics {
  kuramotoR: number; // Kuramoto 同期率 R (0〜1.0)
  kuramotoPsi: number; // 平均場位相 psi
  activeAgents: number; // 12〜600体
  targetAgentsLimit: number; // 600 (通常) | 150 | 30 (縮退運転 NFR-06)
  completionRate: number; // サブタスク完了率 (0〜100%)
  failureRate: number; // 失敗率 / reject率 (0〜100%)
  currentRound: number; // 1〜8
  maxRounds: number; // 8
  swarmState: 'IDLE' | 'EXPLORING' | 'CORROBORATING' | 'SYNCHRONIZING' | 'CONVERGED' | 'STOPPED';
  estimatedCost: number; // USD
  costLimit: number; // USD ($0.50)
  autonomyLevel: number; // 3: 領域エージェント / 4: オーケストレーター (FR-13)
  emergencyStopped: boolean;
}

export interface MemoriaLesson {
  id: number;
  runId: string;
  intent: string;
  verdict: 'pass' | 'fail';
  lesson: string;
  nextTime: string;
  tags: string[];
  sectors: DiscoverySector[];
  workersCount: number;
  promptVer: string;
  created: string;
  expires: string;
  n: number;
  helped: number;
  misled: number;
  recalledScore?: number;
}

export interface ReflectionQuestion {
  episodeId: number;
  question: string;
  context: string;
}

export interface ExtractedConcept {
  id: string;
  statement: string;
  appliesWhen: string;
  nextExperiment: string;
  tag: string;
  active: boolean;
}

export type GestureMode = 'ORBIT' | 'PAN' | 'FOCUS';

export interface CameraTargetState {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface SpatialMetrics {
  renderFps: number;
  nodeCount: number;
  spatialEntropy: number;
  activeLinks: number;
  cameraDistance: number;
}

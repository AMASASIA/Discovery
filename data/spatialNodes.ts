import { 
  DiscoverySector, 
  SpatialNodeData, 
  SemanticTermRelation, 
  MemoriaLesson, 
  ReflectionQuestion, 
  ExtractedConcept 
} from '../types';

export interface SectorConfig {
  sector: DiscoverySector;
  index: number;
  labelEn: string;
  thetaBase: number; // in radians
  accentColor: string;
  description: string;
}

export const DISCOVERY_SECTORS: SectorConfig[] = [
  { sector: '経済', index: 0, labelEn: 'ECONOMY', thetaBase: 0, accentColor: '#D97706', description: '市場動態・資本循環・トークノミクス・資源配分' },
  { sector: 'アート', index: 1, labelEn: 'ART', thetaBase: (Math.PI * 2 / 12) * 1, accentColor: '#C026D3', description: '美学・造形生成・文化的文脈・象徴表現' },
  { sector: 'SNS', index: 2, labelEn: 'SOCIAL', thetaBase: (Math.PI * 2 / 12) * 2, accentColor: '#06B6D4', description: '言説伝播・群衆心理・コミュニティ力学・バイラル' },
  { sector: '人', index: 3, labelEn: 'PEOPLE', thetaBase: (Math.PI * 2 / 12) * 3, accentColor: '#EA580C', description: '主客・行動心理・認知バイアス・組織協働' },
  { sector: '音声', index: 4, labelEn: 'AUDIO', thetaBase: (Math.PI * 2 / 12) * 4, accentColor: '#10B981', description: '音響トポロジー・音韻解析・周波数同期・対話' },
  { sector: '文書', index: 5, labelEn: 'DOCUMENT', thetaBase: (Math.PI * 2 / 12) * 5, accentColor: '#2563EB', description: '一次史料・学術論文・公式報告書・テキストコーパス' },
  { sector: '法令', index: 6, labelEn: 'LAW', thetaBase: (Math.PI * 2 / 12) * 6, accentColor: '#4F46E5', description: '法規範・ガバナンス・特許・国際条約・コンプライアンス' },
  { sector: '建築', index: 7, labelEn: 'ARCHITECTURE', thetaBase: (Math.PI * 2 / 12) * 7, accentColor: '#52525B', description: '空間構造・都市計画・モジュール結合・幾何学的配置' },
  { sector: '自然', index: 8, labelEn: 'NATURE', thetaBase: (Math.PI * 2 / 12) * 8, accentColor: '#059669', description: '生態系ネットワーク・生物模倣・エネルギー平衡・物理法則' },
  { sector: 'スケッチ', index: 9, labelEn: 'SKETCH', thetaBase: (Math.PI * 2 / 12) * 9, accentColor: '#E11D48', description: '概念ドラフト・プロトタイプ・直感的マッピング・構想' },
  { sector: '記録', index: 10, labelEn: 'RECORD', thetaBase: (Math.PI * 2 / 12) * 10, accentColor: '#7C3AED', description: 'ブロックチェーン台帳・来歴証明・監査ログ・時系列' },
  { sector: 'メディア', index: 11, labelEn: 'MEDIA', thetaBase: (Math.PI * 2 / 12) * 11, accentColor: '#0284C7', description: 'ジャーナリズム・報道分析・ナラティブ・多層メディア' }
];

export function calculateNodePosition(r: number, theta: number, phi: number): [number, number, number] {
  // r in [0, 1] mapped to radial distance in 3D (Core is close, Fringe is far)
  const r3D = 7 + r * 22;
  const x = Math.cos(theta) * r3D;
  const z = Math.sin(theta) * r3D;
  // y elevation oscillates organically with Kuramoto phase phi and proximity to center
  const y = 2.0 + Math.sin(phi) * 1.2 + (1 - r) * 2.2;
  return [Number(x.toFixed(2)), Number(y.toFixed(2)), Number(z.toFixed(2))];
}

export const INITIAL_SPATIAL_NODES: SpatialNodeData[] = [
  // 1. 経済 (ECONOMY)
  {
    id: 'node-eco-01',
    code: 'SEC-ECO-01',
    title: '自律分散流動性プロトコル (AMM v4)',
    sector: '経済',
    category: '経済',
    summary: '動的手数料アルゴリズムと局所オラクルを統合し資本効率を最大化する流動性プール構造。',
    details: '16のグローバルノードに跨がる資本循環シミュレーション。スリッページを94%削減し、瞬時のボラティリティショックに対して耐性を持つ数学的モデルを立証。',
    source: 'https://archive.org/spec/defi-amm-v4.pdf',
    sourceId: 'SRC-ECO-901',
    status: 'ACTIVE',
    score_s: 0.92,
    radius_r: 0.08,
    theta: 0.04,
    phi: 0.32,
    position: calculateNodePosition(0.08, 0.04, 0.32),
    density_rho: 0.95,
    variance_sigma2: 0.03,
    topologyLabel: '中核',
    corroborationCount: 5,
    workerId: 'w-eco-01',
    generation: 1,
    connections: ['node-law-01', 'node-rec-01', 'node-soc-01'],
    accentColor: '#D97706',
    tags: ['AI自律性', '合意形成', '暗号検証', '流動性'],
    metrics: [
      { label: 'TVL VELOCITY', value: '$48.2M/d', trend: '+14.2%', sparkline: [30, 34, 38, 41, 45, 48] },
      { label: 'SLIPPAGE AVG', value: '0.012%', trend: '-45%', sparkline: [0.08, 0.05, 0.03, 0.02, 0.012] }
    ],
    telemetry: { latency: '1.8 ms', bandwidth: '820 Gbps', load: 72, securityRating: 'CLASS-A', subsystems: 12 },
    actions: [
      { id: 'rebalance', label: 'プール流動性の再調整', description: '各セクター間のトレードペア歪みを自動是正します。' },
      { id: 'audit_reserves', label: '準備金の暗号監査実行', description: 'ゼロ知識証明による裏付け資産のリアルタイム照合。' }
    ]
  },
  // 2. アート (ART)
  {
    id: 'node-art-01',
    code: 'SEC-ART-01',
    title: '生成アルゴリズムによる変量幾何学',
    sector: 'アート',
    category: 'アート',
    summary: '高次元空間の潜在ベクトルから抽出される自己組織化フラクタル構造。',
    details: '非線形微分方程式の軌道を可視化し、感性的受容と数理的秩序の調和を試みるインスタレーション構想。',
    source: 'https://doi.org/10.1016/art-geometry-2026',
    sourceId: 'SRC-ART-402',
    status: 'SYNCHRONIZED',
    score_s: 0.86,
    radius_r: 0.14,
    theta: (Math.PI * 2 / 12) * 1 + 0.06,
    phi: 0.94,
    position: calculateNodePosition(0.14, (Math.PI * 2 / 12) * 1 + 0.06, 0.94),
    density_rho: 0.88,
    variance_sigma2: 0.12,
    topologyLabel: '分岐',
    corroborationCount: 4,
    workerId: 'w-art-01',
    generation: 2,
    connections: ['node-arc-01', 'node-ske-01', 'node-nat-01'],
    accentColor: '#C026D3',
    tags: ['空間トポロジー', '生体リズム', '変量幾何', '自己組織化'],
    metrics: [
      { label: 'DIMENSIONAL ENTROPY', value: '0.94', trend: 'BALANCED', sparkline: [0.8, 0.85, 0.91, 0.94] },
      { label: 'COHESION', value: '98.2%', trend: '+3.1%', sparkline: [92, 95, 96, 98.2] }
    ],
    telemetry: { latency: '3.4 ms', bandwidth: '450 Gbps', load: 55, securityRating: 'CLASS-A', subsystems: 8 },
    actions: [
      { id: 'resynthesize', label: '潜在ベクトルの再合成', description: '空間の曲率パラメータを再計算して新しい造形を展開。' }
    ]
  },
  // 3. SNS (SOCIAL)
  {
    id: 'node-soc-01',
    code: 'SEC-SOC-01',
    title: '集合知の熱力学的ダイナミクス',
    sector: 'SNS',
    category: 'SNS',
    summary: 'ソーシャルネットワーク上における感情伝播と意見分極の相転移モデル。',
    details: '400万ノードの発言タイムラインを自然言語解析。合意形成に至るクリティカルマスと反響室効果の抑制アルゴリズム。',
    source: 'https://arxiv.org/abs/2609.social-phase-transition',
    sourceId: 'SRC-SOC-112',
    status: 'ACTIVE',
    score_s: 0.79,
    radius_r: 0.21,
    theta: (Math.PI * 2 / 12) * 2 - 0.05,
    phi: 1.45,
    position: calculateNodePosition(0.21, (Math.PI * 2 / 12) * 2 - 0.05, 1.45),
    density_rho: 0.76,
    variance_sigma2: 0.28,
    topologyLabel: '分岐',
    corroborationCount: 3,
    workerId: 'w-soc-01',
    generation: 1,
    connections: ['node-peo-01', 'node-med-01', 'node-eco-01'],
    accentColor: '#06B6D4',
    tags: ['合意形成', '感情伝播', '速報性', 'ネットワーク'],
    metrics: [
      { label: 'DIFFUSION RATE', value: '42.8k/s', trend: '+22%', sparkline: [20, 25, 33, 38, 42.8] },
      { label: 'CONSENSUS INDEX', value: '0.81', trend: '+0.12', sparkline: [0.65, 0.71, 0.78, 0.81] }
    ],
    telemetry: { latency: '4.2 ms', bandwidth: '1.1 Tbps', load: 81, securityRating: 'CLASS-B', subsystems: 16 },
    actions: [
      { id: 'dampen_echo', label: '反響室の減衰フィルタ適用', description: '極性バイアスを検知し対抗言説の露出比率を平準化。' }
    ]
  },
  // 4. 人 (PEOPLE)
  {
    id: 'node-peo-01',
    code: 'SEC-PEO-01',
    title: '認知バイアス補正と自律意思決定支援',
    sector: '人',
    category: '人',
    summary: 'ヒューリスティックによる判断誤差をリアルタイムに同定する認知工学フレームワーク。',
    details: '作業ログと対話履歴から認知過負荷および現状維持バイアスを検出し、プロアクティブな内省を促す介入手法。',
    source: 'https://nature.com/articles/s41598-cognitive-agents-2026',
    sourceId: 'SRC-PEO-784',
    status: 'ONLINE',
    score_s: 0.88,
    radius_r: 0.12,
    theta: (Math.PI * 2 / 12) * 3 + 0.02,
    phi: 2.10,
    position: calculateNodePosition(0.12, (Math.PI * 2 / 12) * 3 + 0.02, 2.10),
    density_rho: 0.91,
    variance_sigma2: 0.06,
    topologyLabel: '中核',
    corroborationCount: 4,
    workerId: 'w-peo-01',
    generation: 1,
    connections: ['node-soc-01', 'node-aud-01', 'node-doc-01'],
    accentColor: '#EA580C',
    tags: ['AI自律性', '生体リズム', '感情伝播', '認知モデル'],
    metrics: [
      { label: 'COGNITIVE CLARITY', value: '91.4%', trend: '+8.2%', sparkline: [80, 83, 87, 89, 91.4] },
      { label: 'STRESS INDEX', value: '0.24', trend: '-18%', sparkline: [0.42, 0.35, 0.28, 0.24] }
    ],
    telemetry: { latency: '2.1 ms', bandwidth: '620 Gbps', load: 46, securityRating: 'CLASS-A', subsystems: 9 },
    actions: [
      { id: 'reflect_prompt', label: '内省プロンプトの送出', description: 'Kolbの経験学習サイクルに沿った振り返りの問いを送信。' }
    ]
  },
  // 5. 音声 (AUDIO)
  {
    id: 'node-aud-01',
    code: 'SEC-AUD-01',
    title: '生体位相同調と音響トポロジー',
    sector: '音声',
    category: '音声',
    summary: '432Hz周波数帯域における心拍リズムと発話韻律の位相同期現象の数理解析。',
    details: '音声インターフェイスのレスポンス抑揚を聴取者の呼吸サイクルに位相同調させ、情報受容閾値を38%向上。',
    source: 'https://acoustics.org/papers/resonant-swarm-audio.pdf',
    sourceId: 'SRC-AUD-301',
    status: 'SYNCHRONIZED',
    score_s: 0.84,
    radius_r: 0.16,
    theta: (Math.PI * 2 / 12) * 4 - 0.04,
    phi: 2.80,
    position: calculateNodePosition(0.16, (Math.PI * 2 / 12) * 4 - 0.04, 2.80),
    density_rho: 0.82,
    variance_sigma2: 0.08,
    topologyLabel: '中核',
    corroborationCount: 4,
    workerId: 'w-aud-01',
    generation: 2,
    connections: ['node-peo-01', 'node-arc-01', 'node-nat-01'],
    accentColor: '#10B981',
    tags: ['生体リズム', '都市音景', '音響トポロジー', '位相同調'],
    metrics: [
      { label: 'PHASE LOCK', value: '96.2%', trend: 'OPTIMAL', sparkline: [91, 93, 95, 96.2] },
      { label: 'HARMONIC RATIO', value: '1.618', trend: 'GOLDEN', sparkline: [1.61, 1.615, 1.618] }
    ],
    telemetry: { latency: '1.2 ms', bandwidth: '940 Gbps', load: 62, securityRating: 'CLASS-A', subsystems: 11 },
    actions: [
      { id: 'tune_harmonics', label: '高調波周波数の補正', description: '環境ノイズに合わせた逆相マスキングトーンを生成。' }
    ]
  },
  // 6. 文書 (DOCUMENT)
  {
    id: 'node-doc-01',
    code: 'SEC-DOC-01',
    title: '多言語セマンティックオントロジー体系',
    sector: '文書',
    category: '文書',
    summary: '異言語コーパス間の概念的アイソモーフィズムを保証するベクトル空間アライメント。',
    details: '30万件の学術論文とオープンアーカイブを横断し、概念の翻訳損失をゼロに抑える高次元グラフ埋め込み。',
    source: 'https://openaccess.thecvf.com/doc-semantic-matrix.pdf',
    sourceId: 'SRC-DOC-512',
    status: 'ACTIVE',
    score_s: 0.90,
    radius_r: 0.10,
    theta: (Math.PI * 2 / 12) * 5 + 0.03,
    phi: 3.45,
    position: calculateNodePosition(0.10, (Math.PI * 2 / 12) * 5 + 0.03, 3.45),
    density_rho: 0.94,
    variance_sigma2: 0.04,
    topologyLabel: '中核',
    corroborationCount: 6,
    workerId: 'w-doc-01',
    generation: 1,
    connections: ['node-law-01', 'node-rec-01', 'node-ske-01'],
    accentColor: '#2563EB',
    tags: ['AI自律性', '暗号検証', '生成プロンプト', 'セマンティクス'],
    metrics: [
      { label: 'ALIGNMENT ACCURACY', value: '99.8%', trend: '+0.1%', sparkline: [99.2, 99.5, 99.8] },
      { label: 'INDEXED CORPI', value: '312k docs', trend: '+18k', sparkline: [250, 280, 312] }
    ],
    telemetry: { latency: '3.1 ms', bandwidth: '1.4 Tbps', load: 70, securityRating: 'CLASS-A', subsystems: 14 },
    actions: [
      { id: 'cross_validate', label: 'コーパス相互検証', description: '文書間の主張矛盾をグラフ上で自動検出・隔離。' }
    ]
  },
  // 7. 法令 (LAW)
  {
    id: 'node-law-01',
    code: 'SEC-LAW-01',
    title: '計算可能契約と自律ガバナンス憲章',
    sector: '法令',
    category: '法令',
    summary: '自然言語で記述された法規範を形式論理へ変換し機械執行を可能とする憲法規約。',
    details: '国際私法および各国のデジタル資産規制に適合する動的ルールエンジン。自律性レベル超過を検知し即座に執行停止する安全弁。',
    source: 'https://law.stanford.edu/codex-computable-contracts-2026',
    sourceId: 'SRC-LAW-008',
    status: 'ONLINE',
    score_s: 0.95,
    radius_r: 0.05,
    theta: (Math.PI * 2 / 12) * 6,
    phi: 4.10,
    position: calculateNodePosition(0.05, (Math.PI * 2 / 12) * 6, 4.10),
    density_rho: 0.98,
    variance_sigma2: 0.02,
    topologyLabel: '中核',
    corroborationCount: 7,
    workerId: 'w-law-01',
    generation: 1,
    connections: ['node-eco-01', 'node-doc-01', 'node-rec-01'],
    accentColor: '#4F46E5',
    tags: ['AI自律性', '合意形成', '暗号検証', 'ガバナンス'],
    metrics: [
      { label: 'COMPLIANCE SCORE', value: '100%', trend: 'ABSOLUTE', sparkline: [100, 100, 100, 100] },
      { label: 'DISPUTE RATE', value: '0.00%', trend: 'ZERO', sparkline: [0, 0, 0, 0] }
    ],
    telemetry: { latency: '1.6 ms', bandwidth: '580 Gbps', load: 38, securityRating: 'CLASS-A5', subsystems: 10 },
    actions: [
      { id: 'verify_bounds', label: '自律性レベル境界の監査', description: 'FR-13に基づく権限上限（外部書き込みLv2）の整合性検査。' }
    ]
  },
  // 8. 建築 (ARCHITECTURE)
  {
    id: 'node-arc-01',
    code: 'SEC-ARC-01',
    title: '自律型キネティック建築モジュール',
    sector: '建築',
    category: '建築',
    summary: '環境センサーと太陽追尾アルゴリズムに連動して展開する変形外皮構造。',
    details: '風況、日射量、都市騒音をリアルタイムに吸収し、最適な空調負荷と居住空間を自律形成するモジュラー構造体。',
    source: 'https://archdaily.com/kinetic-adaptive-spaces-2026',
    sourceId: 'SRC-ARC-610',
    status: 'ACTIVE',
    score_s: 0.81,
    radius_r: 0.19,
    theta: (Math.PI * 2 / 12) * 7 + 0.04,
    phi: 4.85,
    position: calculateNodePosition(0.19, (Math.PI * 2 / 12) * 7 + 0.04, 4.85),
    density_rho: 0.85,
    variance_sigma2: 0.14,
    topologyLabel: '分岐',
    corroborationCount: 3,
    workerId: 'w-arc-01',
    generation: 2,
    connections: ['node-nat-01', 'node-art-01', 'node-aud-01'],
    accentColor: '#52525B',
    tags: ['空間トポロジー', 'バイオミミクリー', '都市音景', 'モジュール構造'],
    metrics: [
      { label: 'THERMAL SHIELD', value: '+42%', trend: 'MAX', sparkline: [25, 30, 35, 42] },
      { label: 'KINETIC CYCLES', value: '18,400', trend: 'STABLE', sparkline: [12000, 15000, 18400] }
    ],
    telemetry: { latency: '3.8 ms', bandwidth: '410 Gbps', load: 52, securityRating: 'CLASS-B', subsystems: 7 },
    actions: [
      { id: 'deploy_facade', label: '外皮ファサードの最適化展開', description: '現在の天候および日照ベクトルに基づく開閉角制御。' }
    ]
  },
  // 9. 自然 (NATURE)
  {
    id: 'node-nat-01',
    code: 'SEC-NAT-01',
    title: '粘菌輸送網の分散最適化アルゴリズム',
    sector: '自然',
    category: '自然',
    summary: '真正粘菌モジホコリの管形成プロセスを模倣した高耐障害性ルーティング。',
    details: '中央制御なしに最短経路と冗長ループを動的に切り替える生体ネットワーク。ボトルネック障害時の自動迂回能力を実証。',
    source: 'https://science.org/doi/10.1126/slime-mold-networks',
    sourceId: 'SRC-NAT-990',
    status: 'ONLINE',
    score_s: 0.89,
    radius_r: 0.11,
    theta: (Math.PI * 2 / 12) * 8 - 0.03,
    phi: 5.40,
    position: calculateNodePosition(0.11, (Math.PI * 2 / 12) * 8 - 0.03, 5.40),
    density_rho: 0.93,
    variance_sigma2: 0.05,
    topologyLabel: '中核',
    corroborationCount: 5,
    workerId: 'w-nat-01',
    generation: 1,
    connections: ['node-arc-01', 'node-art-01', 'node-aud-01'],
    accentColor: '#059669',
    tags: ['空間トポロジー', '生体リズム', 'バイオミミクリー', '自己組織化'],
    metrics: [
      { label: 'PATH EFFICIENCY', value: '99.4%', trend: '+4.1%', sparkline: [92, 95, 98, 99.4] },
      { label: 'RESILIENCE INDEX', value: '0.97', trend: 'HIGH', sparkline: [0.91, 0.94, 0.97] }
    ],
    telemetry: { latency: '1.9 ms', bandwidth: '780 Gbps', load: 49, securityRating: 'CLASS-A', subsystems: 11 },
    actions: [
      { id: 'simulate_fault', label: '疑似ノード断線試験', description: '主要リンク切断時の生体バイパス自動形成を検証。' }
    ]
  },
  // 10. スケッチ (SKETCH)
  {
    id: 'node-ske-01',
    code: 'SEC-SKE-01',
    title: '直感的アスペクト比プロトタイピング',
    sector: 'スケッチ',
    category: 'スケッチ',
    summary: 'フリーハンド描画から幾何拘束とUI構造をリアルタイム抽出する推論パイプライン。',
    details: '粗い手書きワイヤーフレームからUIコンポーネントの階層構造とレスポンシブ制約を自動合成。',
    source: 'https://siggraph.org/proceedings/neural-sketch-2026',
    sourceId: 'SRC-SKE-205',
    status: 'ACTIVE',
    score_s: 0.74,
    radius_r: 0.26,
    theta: (Math.PI * 2 / 12) * 9 + 0.05,
    phi: 5.95,
    position: calculateNodePosition(0.26, (Math.PI * 2 / 12) * 9 + 0.05, 5.95),
    density_rho: 0.68,
    variance_sigma2: 0.35,
    topologyLabel: '周縁',
    corroborationCount: 2,
    workerId: 'w-ske-01',
    generation: 3,
    connections: ['node-art-01', 'node-doc-01'],
    accentColor: '#E11D48',
    tags: ['空間トポロジー', '生成プロンプト', 'プロトタイプ', 'UI合成'],
    metrics: [
      { label: 'STROKE FIDELITY', value: '92.1%', trend: '+6.5%', sparkline: [82, 86, 89, 92.1] },
      { label: 'SYNTHESIS TIME', value: '0.42s', trend: '-30%', sparkline: [0.8, 0.6, 0.42] }
    ],
    telemetry: { latency: '4.8 ms', bandwidth: '320 Gbps', load: 41, securityRating: 'CLASS-B', subsystems: 6 },
    actions: [
      { id: 'vectorize', label: 'ベクタージオメトリの確定', description: '手描きベジェ曲線を精密CADラインへクランプ。' }
    ]
  },
  // 11. 記録 (RECORD)
  {
    id: 'node-rec-01',
    code: 'SEC-REC-01',
    title: '不変台帳とゼロ知識来歴証明 (ZK-Proof)',
    sector: '記録',
    category: '記録',
    summary: '全トランザクションと推論決定木を暗号学的に固定する不変監査ログ。',
    details: '各エージェントの思考過程、出典リンク、プロンプト版をマークルツリーに格納し、後から誰でも検証可能なトレーサビリティを担保。',
    source: 'https://eprint.iacr.org/2026/zk-provenance-ledger',
    sourceId: 'SRC-REC-777',
    status: 'SYNCHRONIZED',
    score_s: 0.94,
    radius_r: 0.06,
    theta: (Math.PI * 2 / 12) * 10 - 0.02,
    phi: 0.15,
    position: calculateNodePosition(0.06, (Math.PI * 2 / 12) * 10 - 0.02, 0.15),
    density_rho: 0.96,
    variance_sigma2: 0.03,
    topologyLabel: '中核',
    corroborationCount: 6,
    workerId: 'w-rec-01',
    generation: 1,
    connections: ['node-eco-01', 'node-law-01', 'node-doc-01'],
    accentColor: '#7C3AED',
    tags: ['暗号検証', '合意形成', '監査台帳', 'トレーサビリティ'],
    metrics: [
      { label: 'PROOF TIME', value: '8.4 ms', trend: '-22%', sparkline: [14, 11, 9.5, 8.4] },
      { label: 'BLOCK HEIGHT', value: '4,129,800', trend: 'ACTIVE', sparkline: [4128000, 4129800] }
    ],
    telemetry: { latency: '1.4 ms', bandwidth: '990 Gbps', load: 64, securityRating: 'CLASS-A5', subsystems: 15 },
    actions: [
      { id: 'anchor_proof', label: 'グローバル台帳へアンカー発行', description: '最新エージェント実行履歴のマークルルートをオンチェーン確定。' }
    ]
  },
  // 12. メディア (MEDIA)
  {
    id: 'node-med-01',
    code: 'SEC-MED-01',
    title: 'リアルタイム報道ファクトチェック網',
    sector: 'メディア',
    category: 'メディア',
    summary: '国際ニュースフィードとSNS速報のクロスリファレンスによる自動真偽判定。',
    details: '公的プレスリリース、映像メタデータ、現地通信ログをミリ秒単位で照合し、ディープフェイクや捏造報道を即座に特定・警告。',
    source: 'https://reuters.institute/fact-verification-swarm-2026',
    sourceId: 'SRC-MED-840',
    status: 'ACTIVE',
    score_s: 0.77,
    radius_r: 0.23,
    theta: (Math.PI * 2 / 12) * 11 + 0.03,
    phi: 0.72,
    position: calculateNodePosition(0.23, (Math.PI * 2 / 12) * 11 + 0.03, 0.72),
    density_rho: 0.79,
    variance_sigma2: 0.22,
    topologyLabel: '関連',
    corroborationCount: 3,
    workerId: 'w-med-01',
    generation: 2,
    connections: ['node-soc-01', 'node-rec-01', 'node-doc-01'],
    accentColor: '#0284C7',
    tags: ['速報性', '暗号検証', '真偽判定', 'マルチソース'],
    metrics: [
      { label: 'VERIFIED/MIN', value: '1,420 items', trend: '+15%', sparkline: [950, 1100, 1280, 1420] },
      { label: 'CONFIDENCE', value: '99.1%', trend: 'HIGH', sparkline: [98.2, 98.7, 99.1] }
    ],
    telemetry: { latency: '3.6 ms', bandwidth: '880 Gbps', load: 74, securityRating: 'CLASS-A', subsystems: 12 },
    actions: [
      { id: 'broadcast_alert', label: '真偽判定レポートの生成', description: '矛盾が検出された報道記事に対するファクトシートを作成。' }
    ]
  }
];

// Extract Common terms (3+ sectors) and Related terms (2 sectors) - FR-08
export function extractSemanticTerms(nodes: SpatialNodeData[]): SemanticTermRelation[] {
  const tagSectorMap = new Map<string, Set<DiscoverySector>>();
  const tagNodeMap = new Map<string, Set<string>>();

  nodes.forEach(node => {
    node.tags.forEach(tag => {
      if (!tagSectorMap.has(tag)) {
        tagSectorMap.set(tag, new Set());
        tagNodeMap.set(tag, new Set());
      }
      tagSectorMap.get(tag)!.add(node.sector);
      tagNodeMap.get(tag)!.add(node.id);
    });
  });

  const results: SemanticTermRelation[] = [];

  tagSectorMap.forEach((sectorsSet, tag) => {
    const sectors = Array.from(sectorsSet);
    const nodeIds = Array.from(tagNodeMap.get(tag) || []);
    if (sectors.length >= 3) {
      results.push({
        tag,
        type: 'COMMON', // 共通項
        sectors,
        nodeIds,
        itemCount: nodeIds.length
      });
    } else if (sectors.length === 2) {
      results.push({
        tag,
        type: 'RELATED', // 関連項
        sectors,
        nodeIds,
        itemCount: nodeIds.length
      });
    }
  });

  // Sort by sector count desc then itemCount desc
  return results.sort((a, b) => b.sectors.length - a.sectors.length || b.itemCount - a.itemCount);
}

// Initial Memoria Lessons - FR-14
export const INITIAL_MEMORIA_LESSONS: MemoriaLesson[] = [
  {
    id: 42,
    runId: 'r_20260919_0007',
    intent: '自律分散プロトコルと地域循環経済の合意形成モデルの統合',
    verdict: 'pass',
    lesson: '建築と自然の2系統の出典を突合したことで、生態系負荷のない持続的モデルが同定された',
    nextTime: '法令と経済のワーカー数を増やし、地域通貨の法規制適合性を早期確認する',
    tags: ['空間トポロジー', '合意形成', '持続性'],
    sectors: ['経済', '建築', '自然', '法令'],
    workersCount: 48,
    promptVer: 'p1-2026-09',
    created: '2026-09-19T12:03:00Z',
    expires: '2026-10-19T12:03:00Z',
    n: 3,
    helped: 4,
    misled: 0,
    recalledScore: 0.94
  },
  {
    id: 43,
    runId: 'r_20260919_0008',
    intent: '生成AIの著作権と創作帰属に関する国際判例の横断調査',
    verdict: 'fail',
    lesson: '営業・公的判例の出典が単一の二次報道メディアに偏り、直近改定法令との矛盾が生じた',
    nextTime: '法令と記録の一次資料アーカイブを最優先スコープに固定し、メディア言説は副次参照に留める',
    tags: ['暗号検証', 'AI自律性', '法規制'],
    sectors: ['法令', '記録', 'メディア', 'アート'],
    workersCount: 52,
    promptVer: 'p1-2026-09',
    created: '2026-09-19T13:40:00Z',
    expires: '2026-10-19T13:40:00Z',
    n: 2,
    helped: 2,
    misled: 1,
    recalledScore: 0.78
  },
  {
    id: 44,
    runId: 'r_20260919_0009',
    intent: '生体位相同調と音響インターフェイスの応答最適化',
    verdict: 'pass',
    lesson: '心拍リズムと音声サンプリング周波数の位相同期が、ユーザー認知ストレスを有意に低減させた',
    nextTime: '認知モデル（人）セクターのエージェントを初期波から投入し、個人差の分散を追従する',
    tags: ['生体リズム', '音響トポロジー', '位相同調'],
    sectors: ['音声', '人', '自然'],
    workersCount: 36,
    promptVer: 'p1-2026-09',
    created: '2026-09-19T14:15:00Z',
    expires: '2026-10-19T14:15:00Z',
    n: 1,
    helped: 3,
    misled: 0,
    recalledScore: 0.88
  }
];

export const INITIAL_REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    episodeId: 43,
    question: '二次メディアの報道と一次法例テキストの間で最も乖離が大きかった条項は何でしたか？',
    context: '国際判例調査における情報源の偏り防止'
  },
  {
    episodeId: 42,
    question: '建築と自然の統合モデルにおいて、想定外のボトルネックとなった資本回収期間の変数はありましたか？',
    context: '地域循環経済の成立要件'
  }
];

export const INITIAL_CONCEPTS: ExtractedConcept[] = [
  {
    id: 'c-01',
    statement: '法令と経済の同時検証を行う場合、必ず記録（一次台帳）の裏付けを第1波ワーカーに割り当てることで棄却率が64%低下する',
    appliesWhen: '合意形成・契約・トークノミクス関連の探索',
    nextExperiment: '法令ワーカーと記録ワーカーをペアで同時起動し、片方の結果を他方が即座に独立検証する',
    tag: '暗号検証',
    active: true
  },
  {
    id: 'c-02',
    statement: '空間トポロジーと生体リズムが結合した概念は、人セクターの受容性フィードバックを介すことで収束速度が2倍になる',
    appliesWhen: 'インターフェイス設計・建築・音響探索',
    nextExperiment: '人セクターのワーカー配分を全体の25%に設定しKuramoto同期率Rの到達時間を比較する',
    tag: '生体リズム',
    active: true
  }
];

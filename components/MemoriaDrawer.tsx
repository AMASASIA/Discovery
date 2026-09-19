import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Lightbulb, 
  Clock, 
  Sparkles, 
  Trash2,
  RefreshCw,
  Award,
  ChevronRight,
  Send
} from 'lucide-react';
import { MemoriaLesson, ReflectionQuestion, ExtractedConcept } from '../types';

interface MemoriaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: MemoriaLesson[];
  reflectionQuestions: ReflectionQuestion[];
  concepts: ExtractedConcept[];
  onTriggerReflection: (question: string) => void;
  onClearExpired: () => void;
}

export const MemoriaDrawer: React.FC<MemoriaDrawerProps> = ({
  isOpen,
  onClose,
  lessons,
  reflectionQuestions,
  concepts,
  onTriggerReflection,
  onClearExpired,
}) => {
  const [activeTab, setActiveTab] = useState<'LESSONS' | 'REFLECTION' | 'LAWS'>('LESSONS');
  const [reflectionInput, setReflectionInput] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitReflection = () => {
    if (!reflectionInput.trim()) return;
    setSubmittedAnswer(`内省ログをMemoria記憶バンクに記録しました: "${reflectionInput.slice(0, 36)}..."`);
    setReflectionInput('');
    setTimeout(() => setSubmittedAnswer(null), 4000);
  };

  return (
    <div 
      id="memoria-experience-panel"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white/95 backdrop-blur-2xl border-l border-black/15 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="p-5 border-b border-black/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-black tracking-wider">MEMORIA</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 text-black/60 font-medium">
              経験学習バンク
            </span>
          </div>
          <p className="text-xs text-black/50 mt-0.5">書く・想起する・使う・評価する・忘れる</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-2 bg-black/[0.03] border-b border-black/5 gap-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('LESSONS')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'LESSONS' 
              ? 'bg-white text-black font-bold shadow-sm' 
              : 'text-black/60 hover:text-black'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>教訓 ({lessons.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('REFLECTION')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'REFLECTION' 
              ? 'bg-white text-black font-bold shadow-sm' 
              : 'text-black/60 hover:text-black'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>内省の問い</span>
        </button>
        <button
          onClick={() => setActiveTab('LAWS')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'LAWS' 
              ? 'bg-white text-black font-bold shadow-sm' 
              : 'text-black/60 hover:text-black'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>抽出法則 ({concepts.length})</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {/* TAB 1: Lessons (P5) */}
        {activeTab === 'LESSONS' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-black/60 pb-1">
              <span>探索実行ごとの検証と学び (P5)</span>
              <button 
                onClick={onClearExpired}
                className="text-[10px] font-mono text-black/50 hover:text-red-600 flex items-center gap-1"
                title="古い教訓の想起スコア減衰処理（忘れるフェーズ）"
              >
                <Trash2 className="w-3 h-3" />
                <span>忘却減衰</span>
              </button>
            </div>

            {lessons.map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.verdict === 'pass' 
                    ? 'bg-emerald-50/40 border-emerald-200' 
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.verdict === 'pass' ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3 h-3" /> FAIL
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-black/40">#{item.id} // {item.runId}</span>
                  </div>

                  {item.recalledScore !== undefined && (
                    <span className="text-[10px] font-mono text-black/60">
                      想起率: <strong>{(item.recalledScore * 100).toFixed(0)}%</strong>
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-black/90 mb-1.5">
                  「{item.intent}」
                </div>

                <div className="text-xs text-black/70 mb-2 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-black/5">
                  <strong className="text-black/80 block mb-0.5">教訓:</strong>
                  {item.lesson}
                </div>

                <div className="text-xs text-black/70 mb-2.5 leading-relaxed bg-black/[0.02] p-2.5 rounded-xl">
                  <strong className="text-black/80 block mb-0.5">次回への行動修正 (next_time):</strong>
                  {item.nextTime}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 text-[10px] font-mono text-black/50">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-black/5 rounded text-black/70">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>貢献: +{item.helped}</span>
                    <span>誤導: -{item.misled}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Reflection Questions (P6) */}
        {activeTab === 'REFLECTION' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-black/60">
              Kolbの経験学習モデルに基づく内省の問い。探索の偏りを自覚し、仮説の確信度を深めます。
            </div>

            {submittedAnswer && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
                {submittedAnswer}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {reflectionQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/[0.02] border border-black/10">
                  <div className="text-[10px] font-mono text-black/50 mb-1">
                    文脈: {q.context} (エピソード #{q.episodeId})
                  </div>
                  <div className="text-xs font-bold text-black mb-3">
                    {q.question}
                  </div>
                  <button
                    onClick={() => {
                      setReflectionInput(`[エピソード #${q.episodeId} への洞察]: `);
                    }}
                    className="text-[11px] font-mono text-black/60 hover:text-black flex items-center gap-1 underline"
                  >
                    <span>この問いに応答して内省を深める</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Input area */}
            <div className="mt-2 p-3 rounded-2xl bg-white border border-black/15 shadow-sm flex flex-col gap-2">
              <label className="text-[11px] font-bold text-black/80">内省の記述・フィードバック</label>
              <textarea
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                placeholder="探索プロセスでの気づきや、次回への前提修正を記録..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl bg-black/[0.03] border border-black/10 focus:outline-none focus:border-black resize-none"
              />
              <button
                onClick={handleSubmitReflection}
                className="self-end px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black/80 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>記録する</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Extracted Laws / Concepts (P7) */}
        {activeTab === 'LAWS' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-black/60">
              複数回の探索から抽出された「抽象的概念化（共通法則）」です。
            </div>

            {concepts.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-black/[0.02] border border-black/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-black/70">
                    CONCEPT #{c.id} // #{c.tag}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ACTIVE
                  </span>
                </div>

                <div className="text-xs font-bold text-black leading-relaxed">
                  {c.statement}
                </div>

                <div className="text-xs text-black/70 bg-white/80 p-2.5 rounded-xl border border-black/5 flex flex-col gap-1">
                  <div>
                    <span className="font-bold text-black/80 font-mono text-[10px]">適用条件:</span> {c.appliesWhen}
                  </div>
                  <div>
                    <span className="font-bold text-black/80 font-mono text-[10px]">次回実験:</span> {c.nextExperiment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/10 bg-black/[0.02] flex items-center justify-between text-[11px] text-black/60 font-mono">
        <span>Kolb Cycle: PASS / FAIL 学習ループ稼働中</span>
        <span>v2.4 Memoria</span>
      </div>
    </div>
  );
};

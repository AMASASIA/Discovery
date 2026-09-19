import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Trash2, 
  X, 
  Loader2, 
  Sparkles, 
  Zap, 
  Cpu, 
  Settings2, 
  User as UserIcon,
  ShieldCheck,
  BookmarkPlus
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface GeminiChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSpatialNode?: (nodeData: { title: string; sector: string; summary: string }) => void;
}

interface Message {
  id?: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelName?: string;
}

const SYSTEM_ROLES = [
  {
    id: 'navigator',
    name: 'トポロジー探索ナビゲーター',
    instruction: 'あなたはDiscovery OS v1.0の空間ナビゲーターです。12領域（経済、アート、社会、人、声、資料、法、建築、自然、スケッチ、記録、メディア）の相互連関を読み解き、利用者の思索を深める助言を提供してください。',
  },
  {
    id: 'architect',
    name: '空間設計・構造アーキテクト',
    instruction: 'あなたは建築と空間知覚の専門家です。形態、構造、美学、およびホワイト空間UIのトポロジーについての洞察と提案を提供してください。',
  },
  {
    id: 'researcher',
    name: '総合リサーチャー（深層推論）',
    instruction: 'あなたは高度な学術・社会・自然科学のリサーチャーです。論理的で客観的な事実に基づき、多面的な仮説検証と要約を行ってください。',
  }
];

export const GeminiChatbotPanel: React.FC<GeminiChatbotPanelProps> = ({ isOpen, onClose, onAddSpatialNode }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Discovery OSへようこそ。Geminiチャットボットが待機しています。12領域の知見の統合や空間トポロジーについて何でもご質問ください。',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelName: 'gemini-3.5-flash'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES[0]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history from Firestore if logged in
  useEffect(() => {
    const user = auth.currentUser;
    if (user && isOpen) {
      const loadHistory = async () => {
        try {
          const colPath = `users/${user.uid}/chat_messages`;
          const q = query(collection(db, colPath), orderBy('timestamp', 'asc'), limit(50));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const loaded: Message[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              loaded.push({
                id: doc.id,
                role: data.role,
                text: data.text,
                timestamp: data.timestamp,
                modelName: data.modelName
              });
            });
            if (loaded.length > 0) {
              setMessages(loaded);
            }
          }
        } catch (e) {
          console.warn('Could not load chat history from Firestore:', e);
        }
      };
      loadHistory();
    }
  }, [isOpen]);

  const saveMessageToFirestore = async (msg: Message) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const colPath = `users/${user.uid}/chat_messages`;
      await addDoc(collection(db, colPath), {
        userId: user.uid,
        role: msg.role,
        text: msg.text,
        modelName: msg.modelName || selectedModel,
        timestamp: msg.timestamp
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/chat_messages`);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText('');
    setError(null);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      role: 'user',
      text: userText,
      timestamp: timeStr,
      modelName: selectedModel,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessageToFirestore(userMsg);

    setLoading(true);

    try {
      const currentSystemInstruction = customInstruction.trim() || selectedRole.instruction;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, text: m.text })),
          model: selectedModel,
          systemInstruction: currentSystemInstruction,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get Gemini response.');
      }

      const modelMsg: Message = {
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelName: data.modelUsed || selectedModel,
      };

      setMessages(prev => [...prev, modelMsg]);
      saveMessageToFirestore(modelMsg);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err?.message || 'Gemini応答の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('チャット履歴をクリアしますか？')) {
      setMessages([
        {
          role: 'model',
          text: 'チャット履歴を初期化しました。新たなテーマで対話を開始できます。',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelName: selectedModel
        }
      ]);
    }
  };

  const handleCreateNodeFromMessage = (text: string) => {
    if (onAddSpatialNode) {
      const title = text.slice(0, 24).replace(/[\n\r]+/g, ' ') + '...';
      onAddSpatialNode({
        title,
        sector: '声',
        summary: text.slice(0, 300)
      });
      alert('AI回答を「声」セクターの空間ノードとして追加しました。');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white/95 backdrop-blur-xl border-l border-black/15 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-black/10 flex items-center justify-between bg-[#FAF9F6]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-black tracking-wide">GEMINI CHATBOT</h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black text-white font-semibold">
                {selectedModel}
              </span>
            </div>
            <p className="text-[11px] text-black/50">ロール指定・履歴保持・マルチターン対話</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-xl border transition-colors ${
              showSettings ? 'bg-black text-white border-black' : 'border-black/10 hover:bg-black/5 text-black/60'
            }`}
            title="モデルとロール設定"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-xl border border-black/10 hover:bg-black/5 text-black/60 transition-colors"
            title="チャットクリア"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-black/10 hover:bg-black/5 text-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel (Model & System Instruction) */}
      {showSettings && (
        <div className="p-4 bg-[#F5F4F0] border-b border-black/10 space-y-3.5 text-xs animate-in fade-in duration-150">
          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-black/60 block mb-1.5">
              MODEL SELECTOR // 推論エンジン選択
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.5-flash')}
                className={`p-2 rounded-xl border text-left flex flex-col transition-all ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white border-black/15 text-black hover:bg-black/5'
                }`}
              >
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  3.5-Flash
                </span>
                <span className="text-[9px] opacity-70 mt-0.5">汎用 (標準)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`p-2 rounded-xl border text-left flex flex-col transition-all ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white border-black/15 text-black hover:bg-black/5'
                }`}
              >
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  3.1-Lite
                </span>
                <span className="text-[9px] opacity-70 mt-0.5">高速応答</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                className={`p-2 rounded-xl border text-left flex flex-col transition-all ${
                  selectedModel === 'gemini-3.1-pro-preview'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white border-black/15 text-black hover:bg-black/5'
                }`}
              >
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  3.1-Pro
                </span>
                <span className="text-[9px] opacity-70 mt-0.5">高度推論</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-black/60 block mb-1.5">
              SYSTEM INSTRUCTION / ROLE // ペルソナ設定
            </label>
            <div className="space-y-1.5">
              {SYSTEM_ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setCustomInstruction('');
                  }}
                  className={`w-full p-2 rounded-xl border text-left text-[11px] transition-all flex items-center justify-between ${
                    selectedRole.id === role.id && !customInstruction
                      ? 'bg-black text-white border-black font-semibold'
                      : 'bg-white border-black/15 text-black hover:bg-black/5'
                  }`}
                >
                  <span>{role.name}</span>
                </button>
              ))}
            </div>

            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="カスタムシステム指示を入力（省略時は選択されたロールが適用されます）"
              rows={2}
              className="w-full mt-2 p-2 rounded-xl border border-black/15 text-[11px] bg-white focus:outline-none focus:border-black"
            />
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FCFCF9]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs shadow-sm transition-all ${
                msg.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-white border border-black/10 text-black/90'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1 text-[9px] font-mono opacity-60">
                <span className="font-bold flex items-center gap-1">
                  {msg.role === 'user' ? <UserIcon className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                  {msg.role === 'user' ? 'YOU' : `GEMINI (${msg.modelName || selectedModel})`}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              
              <div className="leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>

              {msg.role === 'model' && onAddSpatialNode && (
                <div className="mt-2.5 pt-2 border-t border-black/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleCreateNodeFromMessage(msg.text)}
                    className="text-[10px] text-black/60 hover:text-black flex items-center gap-1 font-medium transition-colors"
                    title="この回答を空間ノードとして追加"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    <span>空間ノード化</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-black/10 text-black/60 text-xs w-fit shadow-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
            <span className="font-mono text-[10px]">{selectedModel} 推論中...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3.5 border-t border-black/10 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Geminiへ質問・指示を入力..."
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs text-black focus:outline-none focus:border-black bg-[#FAF9F6]"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-4 py-2.5 bg-black text-white rounded-2xl hover:bg-black/85 disabled:opacity-50 transition-all flex items-center justify-center shrink-0 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 text-[10px] text-black/40 px-1">
          <span>Role: {selectedRole.name}</span>
          <span>Shift+Enter で改行</span>
        </div>
      </div>
    </div>
  );
};

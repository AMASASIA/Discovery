import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Radio, Activity, AlertCircle, Sparkles } from 'lucide-react';

interface GeminiLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiLiveVoiceModal: React.FC<GeminiLiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ sender: 'user' | 'model'; text: string; time: string }>>([]);
  const [speakingState, setSpeakingState] = useState<'idle' | 'listening' | 'speaking'>('idle');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcripts]);

  // Convert float32 PCM to base64 16-bit PCM little endian
  const floatTo16BitPCM = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Decode 24kHz raw PCM base64 into AudioBuffer
  const base64ToAudioBuffer = (ctx: AudioContext, base64: string): AudioBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }
    return audioBuffer;
  };

  const playAudioChunk = useCallback((base64: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const buffer = base64ToAudioBuffer(ctx, base64);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      activeSourcesRef.current.push(source);
      setSpeakingState('speaking');

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setSpeakingState('listening');
        }
      };
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }, []);

  const handleInterrupt = useCallback(() => {
    activeSourcesRef.current.forEach(s => {
      try {
        s.stop();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setSpeakingState('listening');
  }, []);

  const stopSession = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    handleInterrupt();
    setIsConnected(false);
    setIsConnecting(false);
    setSpeakingState('idle');
  }, [handleInterrupt]);

  const startSession = async () => {
    try {
      setErrorMessage(null);
      setIsConnecting(true);

      // 1. Request microphone stream (16kHz preferred)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      streamRef.current = stream;

      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;
      if (inputAudioCtx.state === 'suspended') {
        await inputAudioCtx.resume();
      }

      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (outputAudioCtxRef.current.state === 'suspended') {
        await outputAudioCtxRef.current.resume();
      }

      // 2. Open WebSocket to server /api/live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setSpeakingState('listening');
        setTranscripts(prev => [
          ...prev,
          { 
            sender: 'model', 
            text: 'Live voice connection established with gemini-3.8-live. Speak to explore.', 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);

        // 3. Audio input capture processor
        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (!isMuted && ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const base64Audio = floatTo16BitPCM(inputData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
            playAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            handleInterrupt();
          } else if (msg.type === 'text' && msg.text) {
            setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'model' && !last.text.endsWith('.')) {
                return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + msg.text }];
              }
              return [...prev, { 
                sender: 'model', 
                text: msg.text, 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              }];
            });
          } else if (msg.type === 'error') {
            setErrorMessage(msg.error);
            stopSession();
          }
        } catch (err) {
          console.error('Error handling live message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Live API error:', err);
        setErrorMessage('Failed to connect to Live API server. Ensure GEMINI_API_KEY is configured.');
        stopSession();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setErrorMessage(err?.message || 'Failed to access microphone or connect to Live API.');
      stopSession();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen, stopSession]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-black/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-black/10 flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              isConnected ? 'bg-black text-emerald-400 shadow-md' : 'bg-black/5 text-black/40'
            }`}>
              <Radio className={`w-5 h-5 ${isConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-black tracking-wide">GEMINI LIVE // 音声対話</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-black/50">低遅延双方向リアルタイム音声ストリーミング (16kHz / 24kHz)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>エラー:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Live Audio Visualizer Canvas / State */}
        <div className="px-6 py-6 flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#F7F7F4] border-b border-black/5">
          <div className="relative mb-4">
            {/* Outer ripples */}
            {isConnected && (
              <>
                <span className={`absolute -inset-3 rounded-full opacity-30 animate-ping ${
                  speakingState === 'speaking' ? 'bg-purple-400' : 'bg-emerald-400'
                }`} />
                <span className={`absolute -inset-6 rounded-full opacity-15 animate-pulse ${
                  speakingState === 'speaking' ? 'bg-purple-300' : 'bg-emerald-300'
                }`} />
              </>
            )}

            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              !isConnected 
                ? 'bg-black/5 text-black/40' 
                : speakingState === 'speaking'
                  ? 'bg-purple-700 text-white shadow-purple-200'
                  : 'bg-black text-emerald-400 shadow-emerald-200'
            }`}>
              {speakingState === 'speaking' ? (
                <Volume2 className="w-10 h-10 animate-bounce" />
              ) : isConnected ? (
                <Mic className="w-10 h-10 animate-pulse" />
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs font-mono font-bold tracking-widest text-black uppercase">
              {isConnecting ? 'CONNECTING TO LIVE API...' : 
               isConnected ? (speakingState === 'speaking' ? 'GEMINI 3.8 LIVE SPEAKS...' : 'LISTENING TO YOUR VOICE...') : 
               'VOICE ENGINE STANDBY'}
            </div>
            <p className="text-[11px] text-black/50 mt-1 max-w-sm">
              {isConnected 
                ? '話しかけると即座に音声で返答します。質問中に話すと自動で割り込みます。'
                : '「セッション開始」をクリックして、12領域のトポロジーや考察について自由に質問してください。'}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3 mt-5">
            {!isConnected ? (
              <button
                onClick={startSession}
                disabled={isConnecting}
                className="px-6 py-2.5 rounded-2xl bg-black text-white hover:bg-black/85 text-xs font-bold tracking-wider shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isConnecting ? '接続中...' : 'セッション開始 (START LIVE)'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isMuted 
                      ? 'bg-amber-100 border-amber-300 text-amber-800' 
                      : 'bg-white border-black/15 text-black/70 hover:bg-black/5'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'ミュート中' : 'マイク有効'}</span>
                </button>

                <button
                  onClick={stopSession}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold tracking-wide shadow transition-colors"
                >
                  終了 (DISCONNECT)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#FCFCF9] min-h-[160px]">
          <div className="text-[10px] font-mono tracking-widest text-black/40 uppercase font-semibold">
            LIVE TRANSCRIPT // リアルタイム対話ログ
          </div>

          {transcripts.length === 0 ? (
            <div className="py-6 text-center text-xs text-black/40 italic">
              対話ログはここにリアルタイムで表示されます
            </div>
          ) : (
            transcripts.map((t, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                  t.sender === 'user'
                    ? 'bg-black text-white font-medium'
                    : 'bg-white border border-black/10 text-black/85 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-60 text-[9px] font-mono">
                    <span>{t.sender === 'user' ? 'USER VOICE' : 'GEMINI 3.8 LIVE'}</span>
                    <span>•</span>
                    <span>{t.time}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{t.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
};

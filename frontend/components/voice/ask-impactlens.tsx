"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Radio, 
  Layers,
  ChevronRight,
  Send,
  GitCompare,
  Play,
  Film,
  FileText,
} from "lucide-react";
import { api, getMediaAssetUrl } from "@/lib/api";
import { VoiceQueryResponse } from "@/types";

interface AskImpactLensProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (mediaId: string) => void;
}

type AudioState = "idle" | "listening" | "processing" | "speaking";

const QUICK_PROMPTS = [
  "Give me the latest impact report for Severn Basin",
  "Summarize the Severn Basin Riparian Restoration project",
  "What evidence supports the visible improvement?",
  "Show me videos of workers cleaning plastic near a river",
  "Compare baseline and subsequent for River Restoration",
];


export function AskImpactLens({ isOpen, onClose, onSelectMedia }: AskImpactLensProps) {
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [transcript, setTranscript] = useState("");
  const [typedInput, setTypedInput] = useState("");
  const [response, setResponse] = useState<VoiceQueryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setAudioState("listening");
          setErrorMsg(null);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            setErrorMsg(`Microphone error: ${event.error}. You can also type your voice query below.`);
          }
          setAudioState("idle");
        };

        recognition.onend = () => {
          // If we captured a transcript, send it for processing
          setAudioState((prev) => {
            if (prev === "listening") {
              return "processing";
            }
            return prev;
          });
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When speech recognition ends with transcript, process it
  useEffect(() => {
    if (audioState === "processing" && transcript.trim()) {
      handleExecuteQuery(transcript.trim());
    }
  }, [audioState, transcript]);

  // Clean up speech on close
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setAudioState("idle");
      setErrorMsg(null);
    }
  }, [isOpen]);

  const startListening = () => {
    setErrorMsg(null);
    setTranscript("");
    setResponse(null);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition already started or error:", err);
      }
    } else {
      setErrorMsg("Browser voice recognition is not supported in this client. Please type your query below.");
      setAudioState("idle");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (transcript.trim()) {
      setAudioState("processing");
    } else {
      setAudioState("idle");
    }
  };

  const handleExecuteQuery = async (queryText: string) => {
    setAudioState("processing");
    setErrorMsg(null);
    try {
      const res = await api.queryVoice(queryText);
      setResponse(res);
      setAudioState("speaking");

      // Speak response aloud if not muted
      if (!isMuted && typeof window !== "undefined" && window.speechSynthesis && res.spoken_response) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(res.spoken_response);
        utterance.rate = 1.0;
        utterance.pitch = 0.98; // Dignified natural pitch
        utterance.onend = () => {
          setAudioState("idle");
        };
        utterance.onerror = () => {
          setAudioState("idle");
        };
        speechSynthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        setAudioState("idle");
      }
    } catch (err: any) {
      console.error("Voice query failed:", err);
      setErrorMsg(err.message || "Failed to process voice query against ground evidence.");
      setAudioState("idle");
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (audioState === "speaking") setAudioState("idle");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-[#FBFBFA] border border-[#111827]/15 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-[#111827] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tracking-wider uppercase text-emerald-400 font-semibold">
                  OmniDimension Voice
                </span>
                <span className="text-[10px] text-white/50 font-mono">v2.1 Grounded</span>
              </div>
              <h2 className="text-sm font-medium text-white/90">
                Environmental Field Media Intelligence Assistant
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Terminal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Voice Status Area */}
        <div className="p-6 bg-white border-b border-[#111827]/10 flex flex-col items-center justify-center text-center relative">
          {/* Status Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#111827]/10 bg-[#F8F7F4] text-xs font-mono text-[#374151] mb-4">
            {audioState === "idle" && (
              <>
                <Radio className="w-3.5 h-3.5 text-slate-500" />
                <span>Microphone Standby • Press to Inquire</span>
              </>
            )}
            {audioState === "listening" && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-700 font-medium">Listening to Field Inquiry...</span>
              </>
            )}
            {audioState === "processing" && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">Grounding in Project Dossiers & Dense Vectors...</span>
              </>
            )}
            {audioState === "speaking" && (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                <span className="text-emerald-700 font-medium">Delivering Grounded Intelligence Statement</span>
              </>
            )}
          </div>

          {/* Large Audio Interaction Button */}
          <div className="relative my-2">
            {audioState === "listening" && (
              <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-75" />
            )}
            {audioState === "speaking" && (
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-60" />
            )}
            <button
              onClick={audioState === "listening" ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                audioState === "listening"
                  ? "bg-rose-600 text-white scale-105"
                  : audioState === "speaking"
                  ? "bg-[#204533] text-white ring-4 ring-[#204533]/20"
                  : "bg-[#111827] text-white hover:bg-[#1E293B] hover:scale-102"
              }`}
            >
              {audioState === "listening" ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Transcript / Instructions */}
          <div className="mt-4 max-w-lg min-h-[48px] flex items-center justify-center">
            {transcript ? (
              <p className="font-mono text-sm text-[#111827] bg-[#F8F7F4] px-4 py-2 rounded border border-[#111827]/10">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : audioState === "idle" ? (
              <p className="text-xs text-[#6B7280]">
                Speak naturally or select a prompt below. OmniDimension retrieves relevant field evidence directly.
              </p>
            ) : null}
          </div>

          {errorMsg && (
            <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded">
              {errorMsg}
            </div>
          )}

          {/* Quick Prompts */}
          {audioState === "idle" && !response && (
            <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-xl">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setTranscript(prompt);
                    handleExecuteQuery(prompt);
                  }}
                  className="px-3 py-1.5 rounded border border-[#111827]/15 bg-white text-xs font-mono text-[#374151] hover:border-[#111827] hover:bg-[#F3F4F6] transition-colors"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grounded Results & Traceability Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {response && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Spoken Response Statement */}
              <div className="p-4 rounded-lg border border-[#204533]/20 bg-[#204533]/5 text-[#111827]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#204533] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#204533]" />
                    Verified Evidence Finding
                  </span>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    Grounded Query Response
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#1F2937] font-serif">
                  {response.spoken_response}
                </p>
              </div>

              {/* Dedicated Impact Report Result Display */}
              {response.report_id && (
                <div className="p-4 rounded border border-[#204533] bg-[#EAF2EC]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-[#204533] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#204533]" />
                      Synchronized Impact Report
                    </span>
                    <span className="text-[10px] font-mono text-[#204533] bg-white px-2 py-0.5 border border-[#B8D4C0]">
                      Phase 4 Verified
                    </span>
                  </div>

                  {response.report_title && (
                    <p className="font-serif text-sm font-semibold text-[#111827]">
                      {response.report_title}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#B8D4C0]/60">
                    <span className="text-xs font-mono text-[#6B7280]">
                      Project: {response.project_name || "Field Dossier"}
                    </span>
                    <Link
                      href={response.route || `/reports/${response.report_id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-white bg-[#204533] hover:bg-[#1B3A2B] px-3 py-1.5 transition-colors"
                    >
                      Open Impact Report
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Dedicated Comparison Result Display */}
              {response.comparison_id && (
                <div className="p-4 rounded border border-[#204533] bg-[#EAF2EC]/40 space-y-3">

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-[#204533] flex items-center gap-1.5">
                      <GitCompare className="w-4 h-4 text-[#204533]" />
                      Synchronized Impact Comparison
                    </span>
                    <span className="text-[10px] font-mono text-[#204533] bg-white px-2 py-0.5 border border-[#B8D4C0]">
                      Phase 3 Evidence
                    </span>
                  </div>

                  {response.overall_change && (
                    <p className="font-serif text-sm font-semibold text-[#111827]">
                      {response.overall_change}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#B8D4C0]/60">
                    <span className="text-xs font-mono text-[#6B7280]">
                      Project: {response.project_name || "Field Dossier"}
                    </span>
                    <Link
                      href={response.route || `/compare?id=${response.comparison_id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-white bg-[#204533] hover:bg-[#1B3A2B] px-3 py-1.5 transition-colors"
                    >
                      Open Comparison Workspace
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Connected Visual Evidence Records */}
              {response.media_results && response.media_results.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-[#4B5563] flex items-center gap-2">
                      {response.action === "SHOW_VIDEOS" ? (
                        <Film className="w-3.5 h-3.5 text-[#204533]" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-[#6B7280]" />
                      )}
                      <span>
                        {response.action === "SHOW_VIDEOS"
                          ? `Synchronized Video Assets (${response.media_results.length})`
                          : `Synchronized Field Assets (${response.media_results.length})`}
                      </span>
                    </h3>
                    <Link
                      href={response.route || "/search"}
                      onClick={onClose}
                      className="text-xs font-mono text-[#204533] hover:underline flex items-center gap-1"
                    >
                      Open in Find Evidence
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {response.media_results.map((item) => (
                      <div
                        key={item.media_id}
                        className="group border border-[#111827]/10 bg-white rounded overflow-hidden hover:border-[#111827]/40 transition-all shadow-xs flex flex-col"
                      >
                        <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                          <img
                            src={getMediaAssetUrl(item.thumbnail_url || item.secure_url)}
                            alt={item.filename}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231f2937'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='%2310b981' text-anchor='middle'>Synchronized Evidence</text></svg>";
                            }}
                          />

                          {/* Subtle Play Overlay for Videos */}
                          {item.media_type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center border border-white/20">
                                <Play className="w-3.5 h-3.5 ml-0.5 fill-current text-white" />
                              </div>
                            </div>
                          )}

                          {/* Media Type Badge */}
                          <div className="absolute top-2 left-2 pointer-events-none">
                            <span className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white uppercase backdrop-blur-xs">
                              {item.media_type}
                            </span>
                          </div>

                          {item.similarity_score !== undefined && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-300 font-semibold backdrop-blur-xs">
                              {Math.round(item.similarity_score * 100)}% match
                            </div>
                          )}

                          {/* Duration Badge */}
                          {item.media_type === "video" && item.duration_seconds && item.duration_seconds > 0 && (
                            <div className="absolute bottom-2 right-2 pointer-events-none">
                              <span className="px-1.5 py-0.5 bg-black/85 text-white text-[9px] font-mono tabular-nums font-semibold backdrop-blur-xs border border-white/20">
                                ⏱ {Math.floor(item.duration_seconds / 60).toString().padStart(2, "0")}:{Math.floor(item.duration_seconds % 60).toString().padStart(2, "0")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-mono text-[#6B7280] uppercase truncate">
                              {item.project || "Field Site"}
                            </div>
                            <div className="text-xs font-semibold text-[#111827] line-clamp-1 mt-0.5">
                              {item.activity || item.filename}
                            </div>
                            {item.location && (
                              <div className="text-[11px] text-[#6B7280] line-clamp-1 mt-1 font-mono">
                                📍 {item.location}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#111827]/5 flex items-center justify-between">
                            <Link
                              href={`/media/${item.media_id}`}
                              onClick={() => {
                                if (onSelectMedia) onSelectMedia(item.media_id);
                                onClose();
                              }}
                              className="text-xs font-mono text-[#204533] hover:underline flex items-center gap-1 font-medium"
                            >
                              Inspect Dossier
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text input alternative */}
          <div className="pt-4 border-t border-[#111827]/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typedInput.trim()) {
                  setTranscript(typedInput.trim());
                  handleExecuteQuery(typedInput.trim());
                  setTypedInput("");
                }
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder="Or type inquiry e.g. 'Show me river plastic cleanup evidence'..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#111827]/15 rounded text-xs font-mono text-[#111827] focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827]"
                />
              </div>
              <button
                type="submit"
                disabled={!typedInput.trim() || audioState === "processing"}
                className="px-4 py-2 bg-[#111827] text-white rounded text-xs font-mono font-medium hover:bg-[#1E293B] disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <span>Query</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Audit Bar */}
        <div className="px-5 py-2.5 bg-[#F8F7F4] border-t border-[#111827]/10 flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>OmniDimension Grounded Session</span>
          </div>
          <span>Traceability Ledger: Active</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function VoiceNotesClient() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const supportCheckedRef = useRef(false);
  const router = useRouter();

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript("");
      setIsRecording(true);
      recognitionRef.current.start();
    }
  }, []);

  useEffect(() => {
    // Avoid running multiple times
    if (supportCheckedRef.current) return;
    supportCheckedRef.current = true;
    
    // Check for browser support
    if (typeof window === "undefined") return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Use requestAnimationFrame to avoid synchronous setState warning
      requestAnimationFrame(() => setIsSupported(false));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      setTranscript((prev) => {
        if (finalTranscript) {
          return prev + finalTranscript + " ";
        }
        return prev;
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Recognition ended
    };

    recognitionRef.current = recognition;
    // Mark as supported after setup succeeds
    requestAnimationFrame(() => setIsSupported(true));

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAsNote = () => {
    if (transcript.trim()) {
      const params = new URLSearchParams({
        content: transcript.trim(),
        title: "Voice Note - " + new Date().toLocaleDateString(),
      });
      router.push(`/notes/new?${params.toString()}`);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
  };

  if (!isSupported) {
    return (
      <div className="p-8">
        <div className="mb-10">
          <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-3">Voice Notes</h2>
          <p className="text-[#808080] font-light max-w-2xl">
            Record voice memos and transcribe them into text instantly.
          </p>
        </div>
        <div className="max-w-2xl mx-auto premium-feature-card p-8 text-center">
          <div className="mb-6 inline-flex rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0e0e14] p-8 border border-rose-500/20">
            <svg className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-light text-[#e4e4e7] mb-3">Browser Not Supported</h3>
          <p className="text-[#606060] font-light max-w-md mx-auto">
            Your browser doesn&apos;t support the Web Speech API. Please try using Chrome, Edge, or Safari for voice recording functionality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-10">
        <h2 className="text-3xl font-light text-[#e4e4e7] tracking-wide mb-3">Voice Notes</h2>
        <p className="text-[#808080] font-light max-w-2xl">
          Record voice memos and transcribe them into text instantly. Click the microphone to start recording.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-6xl">
        {/* Recording Section */}
        <div className="premium-feature-card p-6">
          <h3 className="text-lg font-light text-[#e4e4e7] mb-6 tracking-wide flex items-center gap-3">
            <svg className="w-5 h-5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Record Voice
          </h3>

          <div className="text-center py-8">
            {/* Recording Button */}
            <motion.button
              onClick={toggleRecording}
              className={`relative inline-flex rounded-full p-8 border transition-all duration-300 ${
                isRecording
                  ? "bg-gradient-to-b from-rose-500/20 to-rose-600/10 border-rose-500/50 shadow-lg shadow-rose-500/30"
                  : "bg-gradient-to-b from-[#1a1a24] to-[#0e0e14] border-[#2a2a38] hover:border-[#7c3aed]/30"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-rose-500/50"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <svg
                className={`w-12 h-12 ${isRecording ? "text-rose-400" : "text-[#7c3aed]"}`}
                fill={isRecording ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.button>

            <p className={`mt-6 text-sm tracking-wide ${isRecording ? "text-rose-400" : "text-[#606060]"}`}>
              {isRecording ? "Recording... Click to stop" : "Click to start recording"}
            </p>

            {isRecording && (
              <div className="mt-4 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-rose-400 rounded-full"
                    animate={{
                      height: [8, 24, 8],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid gap-3 border-t border-[#1a1a24] pt-6">
            <div className="flex items-center gap-3 text-[#808080]">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-light">Real-time transcription</span>
            </div>
            <div className="flex items-center gap-3 text-[#808080]">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-light">Browser-based processing</span>
            </div>
            <div className="flex items-center gap-3 text-[#808080]">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-light">Save as notes instantly</span>
            </div>
          </div>
        </div>

        {/* Transcription Section */}
        <div className="premium-feature-card p-6">
          <h3 className="text-lg font-light text-[#e4e4e7] mb-6 tracking-wide flex items-center gap-3">
            <svg className="w-5 h-5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Transcription
          </h3>

          {transcript ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0a0a10] border border-[#1a1a24] min-h-[200px] max-h-[300px] overflow-y-auto">
                <p className="text-[#c8c4bb] font-light text-sm leading-relaxed">{transcript}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9a7b1a] text-[#08080c] font-semibold tracking-wide uppercase text-sm hover:shadow-lg hover:shadow-[#7c3aed]/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Copy Text"
                  )}
                </button>
                <button
                  onClick={saveAsNote}
                  className="flex-1 py-3 rounded-xl bg-[#1a1a24] text-[#e4e4e7] font-medium tracking-wide text-sm hover:bg-[#24242f] transition-all duration-300 border border-[#2a2a38]"
                >
                  Save as Note
                </button>
              </div>
              <button
                onClick={clearTranscript}
                className="w-full py-2 text-sm text-[#606060] hover:text-[#e4e4e7] transition-colors"
              >
                Clear transcription
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 rounded-full bg-gradient-to-b from-[#1a1a24] to-[#0e0e14] p-8 border border-[#2a2a38]">
                <svg className="w-12 h-12 text-[#404050]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-light text-[#606060] mb-2">No transcription yet</h4>
              <p className="text-sm text-[#404050] max-w-xs">Start recording to see your speech transcribed in real-time</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

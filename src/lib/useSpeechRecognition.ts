import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in lib.dom by default).
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((e: Event) => void) | null;
  onstart: ((e: Event) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type MicStatus =
  | "ready"
  | "listening"
  | "permission-denied"
  | "not-supported"
  | "no-speech";

interface UseSpeechRecognitionOptions {
  onFinalText?: (text: string) => void;
  onInterim?: (text: string) => void;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}) {
  const supported = !!getRecognitionCtor();
  const [status, setStatus] = useState<MicStatus>("ready");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const activeRef = useRef(false);            // user wants to keep listening
  const startingRef = useRef(false);          // guard against double start()
  const restartingRef = useRef(false);        // guard against restart race
  const onFinalRef = useRef(opts.onFinalText);
  const onInterimRef = useRef(opts.onInterim);
  onFinalRef.current = opts.onFinalText;
  onInterimRef.current = opts.onInterim;

  const emitFinal = useCallback(() => {
    const finalText = finalRef.current.trim();
    if (finalText) {
      onFinalRef.current?.(finalText);
    }
    finalRef.current = "";
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    startingRef.current = false;
    restartingRef.current = false;
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
    setStatus("ready");
    setInterim("");
  }, []);

  const cancel = useCallback(() => {
    activeRef.current = false;
    startingRef.current = false;
    restartingRef.current = false;
    finalRef.current = "";
    setInterim("");
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.abort();
      } catch {
        // ignore
      }
    }
    setStatus("ready");
  }, []);

  const start = useCallback((bcp47: string) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setStatus("not-supported");
      return;
    }
    // Prevent duplicate sessions: if already active, stop first.
    if (activeRef.current || startingRef.current) {
      return;
    }

    // Abort any lingering recognition object.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    finalRef.current = "";
    activeRef.current = true;
    startingRef.current = true;
    setInterim("");

    const rec = new Ctor();
    rec.lang = bcp47 || "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      startingRef.current = false;
      if (activeRef.current) setStatus("listening");
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          const piece = transcript.trim();
          if (piece) {
            finalText += (finalText && !finalText.endsWith(" ") ? " " : "") + piece;
          }
        } else {
          interimText += transcript;
        }
      }
      finalRef.current = finalText;
      setInterim(interimText);
      onInterimRef.current?.(finalText + (interimText ? " " + interimText : ""));
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        activeRef.current = false;
        startingRef.current = false;
        setStatus("permission-denied");
      } else if (e.error === "no-speech") {
        // If we never captured anything, surface a no-speech state when it ends.
        // Don't abort here; onend will fire.
      } else if (e.error === "aborted") {
        // intentional — do nothing
      }
      // For network/audio-capture errors, let onend decide whether to restart.
    };

    rec.onend = () => {
      // Guard: if a restart is already in progress, don't recurse.
      if (restartingRef.current) return;

      if (activeRef.current) {
        // Auto-restart to bridge pauses, but keep final text accumulated.
        const hadText = finalRef.current.trim().length > 0;
        if (!hadText && !interim) {
          // Nothing captured at all in this session segment.
          setStatus("no-speech");
          activeRef.current = false;
          startingRef.current = false;
          return;
        }
        restartingRef.current = true;
        try {
          rec.start();
          return;
        } catch {
          restartingRef.current = false;
          // fall through to finalize
        }
      }
      // Finalize: deliver accumulated text.
      setInterim("");
      startingRef.current = false;
      restartingRef.current = false;
      if (finalRef.current.trim()) {
        emitFinal();
        setStatus("ready");
      } else {
        setStatus("no-speech");
      }
    };

    recognitionRef.current = rec;

    // Request mic permission explicitly so denial is surfaced clearly.
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // stop tracks immediately; the recognition engine manages its own mic.
          stream.getTracks().forEach((t) => t.stop());
          try {
            rec.start();
          } catch {
            // already starting/started
          }
        })
        .catch(() => {
          activeRef.current = false;
          startingRef.current = false;
          setStatus("permission-denied");
        });
    } else {
      // No getUserMedia (insecure context or unsupported) — try starting anyway.
      try {
        rec.start();
      } catch {
        activeRef.current = false;
        startingRef.current = false;
        setStatus("not-supported");
      }
    }
  }, [emitFinal, interim]);

  // Stop audio control: let caller stop without finalizing (text already set).
  const stopAndFinalize = useCallback(() => {
    activeRef.current = false;
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      startingRef.current = false;
      restartingRef.current = false;
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { supported, status, interim, start, stop, cancel, stopAndFinalize };
}

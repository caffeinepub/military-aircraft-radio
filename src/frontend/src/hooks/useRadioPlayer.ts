import { useCallback, useEffect, useRef, useState } from "react";
import { type RadioStation, clickStation } from "../services/radioBrowserApi";

export type PlaybackState =
  | "stopped"
  | "loading"
  | "playing"
  | "paused"
  | "error";
export type StreamHealth = "healthy" | "stalled" | "reconnecting" | "failed";

const STORAGE_KEY = "squadron_radio_last_station";
const MAX_RETRIES = 3;

export interface RadioPlayerState {
  currentStation: RadioStation | null;
  playbackState: PlaybackState;
  streamHealth: StreamHealth;
  volume: number;
  analyserNode: AnalyserNode | null;
  play: (station: RadioStation) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (vol: number) => void;
}

export function useRadioPlayer(): RadioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStationRef = useRef<RadioStation | null>(null);

  const [currentStation, setCurrentStation] = useState<RadioStation | null>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as RadioStation;
      } catch {
        // ignore
      }
      return null;
    },
  );

  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [streamHealth, setStreamHealth] = useState<StreamHealth>("healthy");
  const [volume, setVolumeState] = useState(0.8);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const initialVolumeRef = useRef(0.8);

  // Keep ref in sync with state for use inside event handlers
  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const initAudioContext = useCallback((audio: HTMLAudioElement) => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setAnalyserNode(analyser);
    } catch {
      // Web Audio API not available
    }
  }, []);

  const doRetry = useCallback((station: RadioStation, attempt: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const delay = 2 ** (attempt - 1) * 1000; // 1s, 2s, 4s
    setStreamHealth("reconnecting");
    setPlaybackState("loading");

    retryTimerRef.current = setTimeout(() => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.src = station.url_resolved || station.url;
      audioRef.current.load();
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.catch(() => {
          if (attempt < MAX_RETRIES) {
            retryCountRef.current = attempt + 1;
            doRetry(station, attempt + 1);
          } else {
            setStreamHealth("failed");
            setPlaybackState("error");
          }
        });
      }
    }, delay);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = initialVolumeRef.current;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handlePlaying = () => {
      setPlaybackState("playing");
      setStreamHealth("healthy");
      retryCountRef.current = 0;
      clearStallTimer();
      clearRetryTimer();
    };

    const handleWaiting = () => {
      setPlaybackState("loading");
      // Start stall detection timer
      clearStallTimer();
      stallTimerRef.current = setTimeout(() => {
        const station = currentStationRef.current;
        if (station && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          doRetry(station, retryCountRef.current);
        } else if (station) {
          setStreamHealth("failed");
          setPlaybackState("error");
        }
      }, 5000);
    };

    const handleError = () => {
      clearStallTimer();
      const station = currentStationRef.current;
      if (station && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        doRetry(station, retryCountRef.current);
      } else {
        setStreamHealth("failed");
        setPlaybackState("error");
      }
    };

    const handleStalled = () => {
      clearStallTimer();
      const station = currentStationRef.current;
      if (station && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        doRetry(station, retryCountRef.current);
      } else if (station) {
        setStreamHealth("failed");
        setPlaybackState("error");
      }
    };

    const handlePause = () => {
      setPlaybackState((prev) => (prev === "loading" ? "loading" : "paused"));
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audio.src = "";
      clearStallTimer();
      clearRetryTimer();
    };
  }, [clearStallTimer, clearRetryTimer, doRetry]);

  const play = useCallback(
    (station: RadioStation) => {
      const audio = audioRef.current;
      if (!audio) return;

      clearStallTimer();
      clearRetryTimer();
      retryCountRef.current = 0;

      // Resume AudioContext if suspended (browser autoplay policy)
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }

      // Init Web Audio API on first play (requires user gesture)
      if (!audioCtxRef.current) {
        initAudioContext(audio);
      }

      audio.pause();
      audio.src = station.url_resolved || station.url;
      audio.load();
      setCurrentStation(station);
      setPlaybackState("loading");
      setStreamHealth("healthy");

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(station));
      } catch {
        // ignore
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setPlaybackState("error");
          setStreamHealth("failed");
        });
      }

      // Update OS / browser audio widget via Media Session API
      if ("mediaSession" in navigator) {
        const PWA_IMAGE =
          "https://wkeve-6yaaa-aaaaf-qahcq-cai.raw.icp0.io/storage?contentId=kl67x-j6c5g-ptso3-xq4fe-kmcuc-trzl2-nzxqt-qjedv-j3y4m-3746e-tqe-image-29480";
        const artwork: MediaImage[] = [
          { src: PWA_IMAGE, sizes: "512x512", type: "image/png" },
        ];
        // Prefer the station's own favicon if it exists
        if (station.favicon) {
          artwork.unshift({
            src: station.favicon,
            sizes: "96x96",
            type: "image/png",
          });
        }
        navigator.mediaSession.metadata = new MediaMetadata({
          title: station.name,
          artist: station.country || "Internet Radio",
          album: "Antenna",
          artwork,
        });
        navigator.mediaSession.playbackState = "playing";
      }

      clickStation(station.stationuuid);
    },
    [clearStallTimer, clearRetryTimer, initAudioContext],
  );

  const pause = useCallback(() => {
    clearStallTimer();
    clearRetryTimer();
    audioRef.current?.pause();
    setPlaybackState("paused");
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, [clearStallTimer, clearRetryTimer]);

  const resume = useCallback(() => {
    if (!audioRef.current || !currentStation) return;

    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    setPlaybackState("loading");
    setStreamHealth("healthy");
    retryCountRef.current = 0;
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setPlaybackState("error");
        setStreamHealth("failed");
      });
    }
  }, [currentStation]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    clearStallTimer();
    clearRetryTimer();
    audio.pause();
    audio.src = "";
    setCurrentStation(null);
    setPlaybackState("stopped");
    setStreamHealth("healthy");
    retryCountRef.current = 0;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  }, [clearStallTimer, clearRetryTimer]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  return {
    currentStation,
    playbackState,
    streamHealth,
    volume,
    analyserNode,
    play,
    pause,
    resume,
    stop,
    setVolume,
  };
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { RadioStation, clickStation } from '../services/radioBrowserApi';

export type PlaybackState = 'stopped' | 'loading' | 'playing' | 'paused' | 'error';

export interface RadioPlayerState {
  currentStation: RadioStation | null;
  playbackState: PlaybackState;
  volume: number;
  play: (station: RadioStation) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (vol: number) => void;
}

export function useRadioPlayer(): RadioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [volume, setVolumeState] = useState(0.8);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const handlePlaying = () => setPlaybackState('playing');
    const handleWaiting = () => setPlaybackState('loading');
    const handleError = () => setPlaybackState('error');
    const handlePause = () => {
      setPlaybackState((prev) => (prev === 'loading' ? 'loading' : 'paused'));
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const play = useCallback((station: RadioStation) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = station.url_resolved || station.url;
    audio.load();
    setCurrentStation(station);
    setPlaybackState('loading');

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setPlaybackState('error');
      });
    }

    clickStation(station.stationuuid);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaybackState('paused');
  }, []);

  const resume = useCallback(() => {
    if (!audioRef.current || !currentStation) return;
    setPlaybackState('loading');
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => setPlaybackState('error'));
    }
  }, [currentStation]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = '';
    setCurrentStation(null);
    setPlaybackState('stopped');
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  return { currentStation, playbackState, volume, play, pause, resume, stop, setVolume };
}

import { useRef, useState, useEffect, useCallback } from 'react';

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function VoiceMessagePlayer({ src, duration: initialDuration = 0 }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [waveform, setWaveform] = useState([]);
  const animationRef = useRef(null);

  // Generate a simple waveform from the audio file
  useEffect(() => {
    if (!src) return;
    fetch(src)
      .then(r => r.arrayBuffer())
      .then(buffer => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx.decodeAudioData(buffer);
      })
      .then(audioBuffer => {
        const channelData = audioBuffer.getChannelData(0);
        const samples = 60; // number of bars
        const blockSize = Math.floor(channelData.length / samples);
        const bars = [];
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j]);
          }
          bars.push(sum / blockSize);
        }
        const max = Math.max(...bars) || 1;
        setWaveform(bars.map(v => Math.max(0.1, v / max)));
        setDuration(audioBuffer.duration);
      })
      .catch(() => {
        // Fallback: generate random bars
        setWaveform(Array.from({ length: 40 }, () => Math.random() * 0.7 + 0.1));
      });
  }, [src]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveform.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = waveform.length;
    const barWidth = Math.max(2, (width - (barCount - 1) * 2) / barCount);
    const gap = 2;

    ctx.clearRect(0, 0, width, height);
    const progress = duration ? currentTime / duration : 0;

    waveform.forEach((h, i) => {
      const x = i * (barWidth + gap);
      const barHeight = Math.max(2, h * height * 0.8);
      const y = (height - barHeight) / 2;
      const isPlayed = (i / barCount) < progress;
      ctx.fillStyle = isPlayed ? 'var(--accent, #4ade80)' : 'rgba(255,255,255,0.25)';
      roundRect(ctx, x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    });
  }, [waveform, currentTime, duration]);

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [src]);

  return (
    <div className="abv-voice-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button className="abv-voice-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lire'}>
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div className="abv-voice-body">
        <canvas ref={canvasRef} className="abv-voice-waveform" style={{ width: '100%', height: 32 }} />
        <div className="abv-voice-time">{formatDuration(currentTime || 0)} / {formatDuration(duration || 0)}</div>
      </div>
    </div>
  );
}

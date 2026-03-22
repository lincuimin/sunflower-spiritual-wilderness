"use client";
import { useEffect, useRef, useState } from "react";

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
}

const DEFAULT_TRACKS: Track[] = [
  {
    id: "1",
    name: "Canon in D",
    artist: "Pachelbel",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    name: "Ambient Flow",
    artist: "SoundHelix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    name: "Soft Breeze",
    artist: "SoundHelix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

const STORAGE_KEY = "sunflower_tracks";

function loadTracks(): Track[] {
  if (typeof window === "undefined") return DEFAULT_TRACKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TRACKS;
  } catch {
    return DEFAULT_TRACKS;
  }
}

function saveTracks(tracks: Track[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
}

function formatTime(secs: number) {
  if (!isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    setTracks(loadTracks());
  }, []);

  const current = tracks[currentIdx];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.url;
    audio.volume = volume;
    const shouldPlay = playing;
    if (shouldPlay) {
      audio.play().catch(() => setPlaying(false));
    }
  }, [currentIdx, tracks]); // intentionally omit `playing` and `volume` — handled by separate effects

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
  }

  function handleEnded() {
    next();
  }

  function playPause() {
    setPlaying((p) => !p);
  }

  function prev() {
    setCurrentIdx((i) => (i === 0 ? tracks.length - 1 : i - 1));
    setPlaying(true);
  }

  function next() {
    setCurrentIdx((i) => (i === tracks.length - 1 ? 0 : i + 1));
    setPlaying(true);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  }

  function addTrack() {
    if (!newUrl.trim()) return;
    const track: Track = {
      id: Date.now().toString(),
      name: newName.trim() || "未知歌曲",
      artist: newArtist.trim() || "未知艺术家",
      url: newUrl.trim(),
    };
    const updated = [...tracks, track];
    setTracks(updated);
    saveTracks(updated);
    setNewName("");
    setNewArtist("");
    setNewUrl("");
    setShowAdd(false);
  }

  function removeTrack(id: string) {
    const updated = tracks.filter((t) => t.id !== id);
    setTracks(updated);
    saveTracks(updated);
    if (currentIdx >= updated.length) setCurrentIdx(Math.max(0, updated.length - 1));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🎵 听歌</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          用音乐陪伴每一刻
        </p>
      </div>

      {/* Player Card */}
      {current && (
        <div
          className="rounded-2xl p-8 mb-6 text-center"
          style={{
            background: "linear-gradient(135deg, #f8f0e8 0%, #fce8d8 100%)",
            border: "1px solid #e67e2230",
          }}
        >
          <div className="text-8xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold">{current.name}</h2>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {current.artist}
          </p>

          {/* Progress */}
          <div className="mt-6 px-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={seek}
              className="w-full accent-orange-500"
            />
            <div
              className="flex justify-between text-xs mt-1"
              style={{ color: "var(--muted)" }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={prev}
              className="text-3xl hover:scale-110 transition-transform"
            >
              ⏮
            </button>
            <button
              onClick={playPause}
              className="w-14 h-14 rounded-full text-white text-2xl flex items-center justify-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#e67e22" }}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={next}
              className="text-3xl hover:scale-110 transition-transform"
            >
              ⏭
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <span style={{ color: "var(--muted)" }}>🔈</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-32 accent-orange-500"
            />
            <span style={{ color: "var(--muted)" }}>🔊</span>
          </div>
        </div>
      )}

      {/* Playlist */}
      <div
        className="rounded-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3 className="font-bold">播放列表</h3>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#f0f8e8", color: "#27ae60" }}
          >
            + 添加歌曲
          </button>
        </div>

        {showAdd && (
          <div
            className="px-6 py-4 space-y-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <input
              type="text"
              placeholder="歌曲名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)" }}
            />
            <input
              type="text"
              placeholder="艺术家"
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)" }}
            />
            <input
              type="text"
              placeholder="音频 URL（.mp3 / .ogg 等）"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg)" }}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={addTrack}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#27ae60" }}
              >
                添加
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: "1px solid var(--border)" }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <ul>
          {tracks.map((track, idx) => (
            <li
              key={track.id}
              className="group flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors hover:bg-amber-50"
              style={{
                borderBottom: idx < tracks.length - 1 ? "1px solid var(--border)" : "none",
                backgroundColor: idx === currentIdx ? "#fff8f0" : undefined,
              }}
              onClick={() => {
                setCurrentIdx(idx);
                setPlaying(true);
              }}
            >
              <span
                className="text-lg w-6 text-center"
                style={{ color: idx === currentIdx ? "#e67e22" : "var(--muted)" }}
              >
                {idx === currentIdx && playing ? "▶" : "♪"}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium truncate text-sm"
                  style={{ color: idx === currentIdx ? "#e67e22" : "var(--text)" }}
                >
                  {track.name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                  {track.artist}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTrack(track.id);
                }}
                className="text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                style={{ color: "var(--muted)" }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
      />
    </div>
  );
}

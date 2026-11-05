import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AudioLines, FastForward, Mic, Pause, Play, Plus, Redo2, RotateCcw, Volume1, Volume2, VolumeX } from 'lucide-react';
import type { SoundAsset } from '../../studio/types';

interface SoundEditorProps {
  sounds: SoundAsset[];
  onSave: (sound: SoundAsset) => void;
  onDelete: (id: string) => void;
}

function decodeAudio(dataUrl: string, context: AudioContext): Promise<AudioBuffer> {
  return fetch(dataUrl).then((response) => response.arrayBuffer()).then((buffer) => context.decodeAudioData(buffer));
}

export function SoundEditor({ sounds, onSave, onDelete }: SoundEditorProps) {
  const [selectedId, setSelectedId] = useState(sounds[0]?.id ?? '');
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState('');
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const selected = sounds.find((sound) => sound.id === selectedId);

  const getContext = () => {
    if (!contextRef.current) contextRef.current = new AudioContext();
    return contextRef.current;
  };
  useEffect(() => {
    let active = true;
    if (!selected?.dataUrl) {
      setBuffer(null);
      return;
    }
    void decodeAudio(selected.dataUrl, getContext())
      .then((decoded) => { if (active) setBuffer(decoded); })
      .catch((error: unknown) => {
        if (active) setNotice(error instanceof Error ? `This audio file could not be decoded: ${error.message}` : 'This audio file could not be decoded.');
      });
    return () => { active = false; };
  }, [selectedId, selected?.dataUrl]);
  useEffect(() => () => {
    sourceRef.current?.stop();
    void contextRef.current?.close();
  }, []);

  const update = (patch: Partial<SoundAsset>) => {
    if (selected) onSave({ ...selected, ...patch });
  };
  const stop = () => {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setPlaying(false);
  };
  const play = async () => {
    if (!selected || !buffer) return;
    stop();
    const context = getContext();
    await context.resume();
    const source = context.createBufferSource();
    const gain = context.createGain();
    const playbackRate = selected.playbackRate ?? 1;
    let audioBuffer = buffer;
    if (selected.reversed) {
      const reversed = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const samples = buffer.getChannelData(channel);
        reversed.copyToChannel(Float32Array.from(samples).reverse(), channel);
      }
      audioBuffer = reversed;
    }
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    gain.gain.value = selected.muted ? 0 : selected.volume ?? 1;
    source.connect(gain).connect(context.destination);
    source.onended = () => {
      if (sourceRef.current === source) {
        sourceRef.current = null;
        setPlaying(false);
      }
    };
    sourceRef.current = source;
    source.start();
    setPlaying(true);
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setNotice('Choose an audio file to add to your project.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice('Sound files must be 2 MB or smaller to save reliably on this device.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setNotice('The selected sound could not be read.');
        return;
      }
      void decodeAudio(reader.result, getContext()).then((decoded) => {
        const sound: SoundAsset = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, '') || 'Sound',
          dataUrl: reader.result as string,
          duration: decoded.duration,
          playbackRate: 1,
          volume: 1,
          reversed: false,
          muted: false,
        };
        onSave(sound);
        setSelectedId(sound.id);
        setBuffer(decoded);
        setNotice('');
      }).catch((error: unknown) => setNotice(error instanceof Error ? `This sound could not be decoded: ${error.message}` : 'This sound could not be decoded.'));
    };
    reader.onerror = () => setNotice('The selected sound could not be read.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };
  const settings = selected ?? { playbackRate: 1, volume: 1, reversed: false, muted: false };
  const changeRate = (amount: number) => update({ playbackRate: Math.max(0.25, Math.min(3, (selected?.playbackRate ?? 1) + amount)) });
  const changeVolume = (amount: number) => update({ volume: Math.max(0, Math.min(2, (selected?.volume ?? 1) + amount)) });

  return (
    <section className="asset-editor sound-editor" aria-label="Sound editor">
      <aside className="sound-list">
        <div className="asset-list-heading">SOUNDS</div>
        {sounds.map((sound, index) => (
          <button type="button" className={`sound-thumb ${sound.id === selectedId ? 'asset-selected' : ''}`} key={sound.id} onClick={() => { stop(); setSelectedId(sound.id); }}>
            <span>{index + 1}</span><AudioLines size={26} /><b>{sound.name}</b><small>{sound.duration.toFixed(2)}s</small>
          </button>
        ))}
        <label className="asset-add-button" aria-label="Add sound"><Plus size={20} /><input type="file" accept="audio/*" onChange={upload} /></label>
      </aside>
      <div className="sound-workbench">
        <div className="sound-toolbar">
          <label>SOUND <input aria-label="Sound name" value={selected?.name ?? ''} disabled={!selected} onChange={(event) => update({ name: event.target.value })} /></label>
          <button type="button" title="Undo sound effect" onClick={() => update({ playbackRate: 1, volume: 1, reversed: false, muted: false })} disabled={!selected}><RotateCcw size={17} /></button>
          <button type="button" title="Copy sound" onClick={() => {
            if (selected) {
              const copy = { ...selected, id: crypto.randomUUID(), name: `${selected.name} copy` };
              onSave(copy);
              setSelectedId(copy.id);
            }
          }} disabled={!selected}><Redo2 size={17} /></button>
          <label className="sound-upload-button">Upload sound<input type="file" accept="audio/*" onChange={upload} /></label>
          {selected && <button type="button" className="sound-delete" onClick={() => { stop(); onDelete(selected.id); setSelectedId(sounds.find((sound) => sound.id !== selected.id)?.id ?? ''); }}>Delete</button>}
        </div>
        {notice && <p className="sound-notice" role="status">{notice}</p>}
        <div className="waveform-panel">
          {buffer ? (
            <div className="waveform-bars" aria-label={`Waveform for ${selected?.name ?? 'sound'}`}>
              {Array.from({ length: 96 }, (_, index) => {
                const channel = buffer.getChannelData(0);
                const start = Math.floor(index * channel.length / 96);
                const end = Math.max(start + 1, Math.floor((index + 1) * channel.length / 96));
                let peak = 0;
                for (let sample = start; sample < end; sample += 1) peak = Math.max(peak, Math.abs(channel[sample] ?? 0));
                return <i key={index} style={{ height: `${Math.max(3, peak * 96)}%` }} />;
              })}
            </div>
          ) : <div className="waveform-empty"><AudioLines size={38} /><span>Add a sound to see its waveform</span></div>}
        </div>
        <div className="sound-controls">
          <button type="button" className="sound-play" aria-label={playing ? 'Pause sound' : 'Play sound'} onClick={() => playing ? stop() : void play()} disabled={!buffer}>
            {playing ? <Pause size={21} /> : <Play size={21} fill="currentColor" />}
          </button>
          <button type="button" onClick={() => changeRate(.25)} disabled={!selected}><FastForward size={18} /><span>FASTER</span></button>
          <button type="button" onClick={() => changeRate(-.25)} disabled={!selected}><span className="effect-icon">◖</span><span>SLOWER</span></button>
          <button type="button" onClick={() => changeVolume(.2)} disabled={!selected}><Volume2 size={18} /><span>LOUDER</span></button>
          <button type="button" onClick={() => changeVolume(-.2)} disabled={!selected}><Volume1 size={18} /><span>SOFTER</span></button>
          <button type="button" onClick={() => update({ muted: !selected?.muted })} disabled={!selected}>{settings.muted ? <VolumeX size={18} /> : <Volume1 size={18} />}<span>MUTE</span></button>
          <button type="button" onClick={() => update({ reversed: !selected?.reversed })} disabled={!selected}><span className="effect-icon">⇄</span><span>{settings.reversed ? 'FORWARD' : 'REVERSE'}</span></button>
        </div>
        <div className="sound-meta">
          {selected ? <><span>{selected.duration.toFixed(2)} seconds</span><span>Speed {Math.round((selected.playbackRate ?? 1) * 100)}%</span><span>Volume {Math.round((selected.volume ?? 1) * 100)}%</span></> : <span>Upload an audio file to get started.</span>}
        </div>
        <label className="sound-microphone"><Mic size={17} /> Record sound <input type="file" accept="audio/*" capture="user" onChange={upload} /></label>
      </div>
    </section>
  );
}

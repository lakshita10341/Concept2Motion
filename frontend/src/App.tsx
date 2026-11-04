import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  RefreshCw, 
  Download, 
  Code2, 
  BookOpen, 
  FileText, 
  Eye, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  Layers,
  Volume2,
  Upload
} from 'lucide-react';

interface Job {
  id: string;
  request: {
    topic: string;
    audienceLevel: string;
    targetDurationSeconds: number;
    visualStyle: string;
    voice: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  traces: Array<{
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    details: string;
    status: 'info' | 'success' | 'warning' | 'error';
    toolUsed?: string;
  }>;
  research?: {
    topic: string;
    coreConcepts: string[];
    commonMisconceptions: string[];
    stepByStepBreakdown: string[];
    sources: Array<{ title: string; url: string; snippet: string; keyTakeaways: string[] }>;
  };
  script?: {
    title: string;
    segments: Array<{
      segmentId: string;
      concept: string;
      learningOutcome: string;
      narrationText: string;
      audioUrl?: string;
      audioDurationSeconds?: number;
    }>;
  };
  simulation?: {
    algorithm: string;
    language: string;
    code: string;
    states: Array<{ step: number; description: string; stateData: any }>;
  };
  storyboard?: {
    totalDurationSeconds: number;
    scenes: Array<{
      sceneId: string;
      title: string;
      concept: string;
      durationSeconds: number;
      customProps: any;
    }>;
  };
  criticReports?: Array<{
    status: string;
    evaluationModel: string;
    score: number;
    summary: string;
    issues: Array<{
      sceneId?: string;
      severity: string;
      category: string;
      description: string;
      recommendedAction: string;
    }>;
  }>;
  correctionCount: number;
  videoUrl?: string;
  error?: string;
}

export default function App() {
  const [topic, setTopic] = useState('How Bloom Filter Works');
  const [audienceLevel, setAudienceLevel] = useState('beginner');
  const [targetDuration, setTargetDuration] = useState(45);
  const [visualStyle, setVisualStyle] = useState('minimalist_dark');
  const [voice, setVoice] = useState('en-US-GuyNeural');
  const [referenceAudioFile, setReferenceAudioFile] = useState<File | null>(null);
  const [referenceAudioBase64, setReferenceAudioBase64] = useState<string | null>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [selectedTab, setSelectedTab] = useState<'video' | 'timeline' | 'script' | 'simulation' | 'critic' | 'sources'>('video');

  // Load existing jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Poll jobs list ONLY when a job is actively running
  useEffect(() => {
    const isAnyJobRunning = activeJob?.status && !['completed', 'failed'].includes(activeJob.status);
    if (!isAnyJobRunning && !loading) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeJob?.status, loading]);

  // Poll active job ONLY while it is in progress
  useEffect(() => {
    if (!activeJobId) return;
    
    // If active job is already finished, don't poll
    if (activeJob && (activeJob.status === 'completed' || activeJob.status === 'failed')) {
      setLoading(false);
      return;
    }

    const fetchCurrent = async () => {
      try {
        const res = await fetch(`/api/jobs/${activeJobId}`);
        if (res.ok) {
          const data: Job = await res.json();
          setActiveJob(data);
          if (data.status === 'completed' || data.status === 'failed') {
            setLoading(false);
            fetchJobs(); // Final sync
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 1500);
    return () => clearInterval(interval);
  }, [activeJobId, activeJob?.status]);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data: Job[] = await res.json();
        setRecentJobs(data);
        if (!activeJobId && data.length > 0) {
          setActiveJobId(data[0].id);
          setActiveJob(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedTab('timeline');

    try {
      const payload: any = {
        topic,
        audienceLevel,
        targetDurationSeconds: Number(targetDuration),
        visualStyle,
        voice: referenceAudioBase64 ? "meta-seamless-m4t" : voice,
      };

      if (referenceAudioBase64) {
        payload.referenceAudioBase64 = referenceAudioBase64;
        payload.referenceAudioName = referenceAudioFile?.name || "ref_voice.wav";
      }

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.id);
        setActiveJob(data);
        fetchJobs();
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const isJobRunning = activeJob?.status && !['completed', 'failed'].includes(activeJob.status);

  const renderStatusBadge = (status: string) => {
    const isRunning = !['completed', 'failed'].includes(status);
    const map: Record<string, { bg: string; text: string }> = {
      completed: { bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400', text: 'Completed' },
      failed: { bg: 'bg-rose-950/60 border-rose-500/40 text-rose-400', text: 'Failed' },
      researching: { bg: 'bg-zinc-900 border-zinc-700 text-zinc-300', text: 'Researching (Muse Spark)' },
      teaching: { bg: 'bg-zinc-900 border-zinc-700 text-zinc-300', text: 'Scripting (Muse Spark)' },
      simulating: { bg: 'bg-zinc-900 border-zinc-700 text-zinc-300', text: 'Simulating (Python)' },
      planning: { bg: 'bg-zinc-900 border-zinc-700 text-zinc-300', text: 'Visual Planning' },
      narrating: { bg: 'bg-zinc-900 border-zinc-700 text-zinc-300', text: 'TTS Voiceover' },
      critiquing: { bg: 'bg-zinc-900 border-zinc-700 text-zinc-300', text: 'Meta Llama Critic' },
      correcting: { bg: 'bg-amber-950/60 border-amber-500/40 text-amber-400', text: 'Remediating Invariant' },
      rendering: { bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400', text: 'Rendering 1080p MP4' },
    };

    const s = map[status] || { bg: 'bg-zinc-900 text-zinc-300 border-zinc-700', text: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono border ${s.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${isRunning ? 'animate-ping' : ''}`}></span>
        {s.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation Bar: High-Precision Technical Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/90 sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white font-mono">Concept2Motion</h1>
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Meta AI Hackathon</span>
            </div>
            <p className="text-xs text-zinc-400">Autonomous Technical Video Engine • Meta Muse Spark &amp; Open-Weight Critic</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>LLM: <strong className="text-zinc-200">Meta Muse Spark 1.3</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Invariant Engine: <strong className="text-zinc-200">Active</strong></span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job Creator & History */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Generation Configuration Card */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <h2 className="text-sm font-semibold font-mono text-zinc-100 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Configure Video Pipeline
            </h2>

            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">Topic / Concept Specification</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Distributed Consensus with Raft"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">Audience Target</label>
                  <select
                    value={audienceLevel}
                    onChange={(e) => setAudienceLevel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">Target Duration</label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds (1 Min)</option>
                    <option value={90}>90 Seconds (1.5 Min)</option>
                    <option value={120}>120 Seconds (2 Min)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">Neural Voice</label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="en-US-GuyNeural">Guy (Clear Neutral)</option>
                    <option value="en-US-JennyNeural">Jenny (Expressive)</option>
                    <option value="en-GB-RyanNeural">Ryan (Academic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">Visual Layout</label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="minimalist_dark">9:16 Vertical Reel</option>
                    <option value="blueprint">Technical Blueprint</option>
                  </select>
                </div>
              </div>

              {/* Reference Audio Upload for Meta SeamlessM4T-v2 Voice Cloning */}
              <div className="mt-3 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono text-zinc-400">
                    Voice Cloning (Meta SeamlessM4T-v2)
                  </label>
                  {referenceAudioFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setReferenceAudioFile(null);
                        setReferenceAudioBase64(null);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 font-mono transition"
                    >
                      Clear Audio
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="audio/*"
                  id="voice-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setReferenceAudioFile(file);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setReferenceAudioBase64(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="voice-file-input"
                  className={`w-full py-2 px-3 rounded border border-dashed flex items-center justify-center gap-2 cursor-pointer transition text-xs font-mono ${
                    referenceAudioFile
                      ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-400"
                      : "border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {referenceAudioFile ? (
                    <span className="truncate max-w-[220px]">Cloning Voice: {referenceAudioFile.name}</span>
                  ) : (
                    <span>Upload 5-10s Voice Clip (.wav, .mp3)</span>
                  )}
                </label>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  {referenceAudioFile
                    ? "Meta SeamlessM4T-v2 active: Narration will speak in your cloned voice."
                    : "Optional: Upload any voice clip to clone with Meta SeamlessM4T-v2."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-xs font-mono text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Compiling Video Pipeline...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Compile Video Reel
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past Generations List */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex-1 flex flex-col">
            <h3 className="text-xs font-mono font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Pipeline History ({recentJobs.length})
            </h3>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px]">
              {recentJobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => {
                    setActiveJobId(j.id);
                    setActiveJob(j);
                    if (j.status === 'completed' || j.status === 'failed') {
                      setLoading(false);
                    }
                  }}
                  className={`text-left p-2.5 rounded-lg border transition flex flex-col gap-1 ${
                    activeJobId === j.id
                      ? 'bg-zinc-800 border-zinc-600'
                      : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-zinc-200 truncate max-w-[190px]">{j.request.topic}</span>
                    {renderStatusBadge(j.status)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                    <span>{new Date(j.createdAt).toLocaleTimeString()}</span>
                    <span>• {j.traces.length} steps</span>
                    {j.correctionCount > 0 && (
                      <span className="text-amber-400 font-mono">[{j.correctionCount} corrected]</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Workspace & Interactive Inspector */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeJob ? (
            <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-6 flex flex-col gap-6">
              
              {/* Job Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold font-mono text-white">{activeJob.request.topic}</h2>
                    {renderStatusBadge(activeJob.status)}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Job ID: <code className="text-emerald-400">{activeJob.id}</code> • Started {new Date(activeJob.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {activeJob.videoUrl && (
                  <a
                    href={activeJob.videoUrl}
                    download
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono font-medium text-zinc-200 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Export 1080p MP4
                  </a>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono overflow-x-auto">
                <button
                  onClick={() => setSelectedTab('video')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                    selectedTab === 'video' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Video Reel
                </button>

                <button
                  onClick={() => setSelectedTab('timeline')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                    selectedTab === 'timeline' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Pipeline Trace ({activeJob.traces.length})
                </button>

                <button
                  onClick={() => setSelectedTab('critic')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                    selectedTab === 'critic' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Invariant Verification
                  {activeJob.criticReports && activeJob.criticReports.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>

                <button
                  onClick={() => setSelectedTab('simulation')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                    selectedTab === 'simulation' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Simulation Code
                </button>

                <button
                  onClick={() => setSelectedTab('script')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                    selectedTab === 'script' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Narration Script
                </button>

                <button
                  onClick={() => setSelectedTab('sources')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition ${
                    selectedTab === 'sources' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Research Sources
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 min-h-[420px]">
                {/* 1. Video Player */}
                {selectedTab === 'video' && (
                  <div className="flex flex-col gap-4">
                    {activeJob.videoUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-[9/16] w-full max-w-[360px] max-h-[640px] relative shadow-2xl">
                          <video
                            key={activeJob.videoUrl}
                            src={activeJob.videoUrl}
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          9:16 Vertical Reel (1080x1920 @ 60fps)
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-12 flex flex-col items-center justify-center text-center gap-3">
                        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                        <h4 className="font-mono text-sm font-semibold text-zinc-200">Compiling Video Pipeline</h4>
                        <p className="text-xs text-zinc-400 max-w-sm font-mono">
                          Executing simulation runtime, compiling neural narration tracks, verifying algorithmic invariants, and rendering 1080p MP4.
                        </p>
                      </div>
                    )}

                    {activeJob.storyboard && (
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        {activeJob.storyboard.scenes.map((sc, i) => (
                          <div key={sc.sceneId} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-1 text-xs">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase">Stage {i + 1}</span>
                            <span className="font-medium text-zinc-200 truncate">{sc.title}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">Duration: {sc.durationSeconds.toFixed(1)}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Observable Agent Timeline */}
                {selectedTab === 'timeline' && (
                  <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-2">
                    {activeJob.traces.map((trace, idx) => {
                      const isLastStep = idx === activeJob.traces.length - 1;
                      const showActiveSpinner = isLastStep && isJobRunning;

                      return (
                        <div
                          key={trace.id}
                          className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-3 text-xs"
                        >
                          <div className="mt-0.5">
                            {showActiveSpinner ? (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                            ) : trace.status === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : trace.status === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            ) : trace.status === 'error' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Info className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </div>

                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-200 font-mono">{trace.agent}</span>
                                <span className="text-zinc-500 font-mono text-[11px]">• {trace.action}</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {new Date(trace.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed">{trace.details}</p>
                            {trace.toolUsed && (
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded w-fit">
                                exec: {trace.toolUsed}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Critic & Autonomous Self-Correction Report */}
                {selectedTab === 'critic' && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold font-mono text-zinc-200 text-sm flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Algorithmic Invariant Audit Engine
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Independent evaluation performed by <strong className="text-indigo-300">Meta Llama 3.3 70B Instruct</strong> and deterministic invariant checkers.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Remediation Cycles:</span>
                        <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-mono text-xs font-bold">
                          {activeJob.correctionCount}
                        </span>
                      </div>
                    </div>

                    {activeJob.criticReports && activeJob.criticReports.map((report, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Review Pass {idx + 1}:</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              report.status === 'passed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {report.status === 'passed' ? 'Passed (Invariant Verified)' : 'Discrepancy Caught'}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-300">Score: {report.score}/100</span>
                        </div>

                        <p className="text-xs text-slate-300">{report.summary}</p>

                        {report.issues.length > 0 && (
                          <div className="flex flex-col gap-2 mt-2">
                            <span className="text-[11px] font-semibold text-amber-300">Issues Flagged for Orchestrator:</span>
                            {report.issues.map((iss, i) => (
                              <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-amber-400">[{iss.severity.toUpperCase()}] {iss.category}</span>
                                  {iss.sceneId && <span className="text-slate-400 font-mono">({iss.sceneId})</span>}
                                </div>
                                <p className="text-slate-300">{iss.description}</p>
                                <p className="text-emerald-400 text-[11px]"><strong>Remediation:</strong> {iss.recommendedAction}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Simulation Code & States */}
                {selectedTab === 'simulation' && (
                  <div className="flex flex-col gap-4">
                    {activeJob.simulation ? (
                      <>
                        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-zinc-300 font-mono">Sandboxed Python Runtime ({activeJob.simulation.language})</span>
                            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Invariant Tests Passed
                            </span>
                          </div>
                          <pre className="p-3 rounded-md bg-zinc-900 text-zinc-300 text-xs font-mono overflow-x-auto max-h-60 border border-zinc-800">
                            {activeJob.simulation.code}
                          </pre>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-mono text-zinc-400">Captured State Snapshots ({activeJob.simulation.states.length} states):</span>
                          <div className="grid grid-cols-2 gap-3">
                            {activeJob.simulation.states.map((st) => (
                              <div key={st.step} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-1.5 text-xs">
                                <span className="font-mono font-bold text-emerald-400">State {st.step}</span>
                                <p className="text-zinc-300">{st.description}</p>
                                <div className="p-2 rounded bg-zinc-900 font-mono text-[11px] text-zinc-400 flex flex-wrap gap-2 border border-zinc-800">
                                  {Object.entries(st.stateData).map(([k, v]) => (
                                    <span key={k}>{k}: {Array.isArray(v) ? `[${v.join(', ')}]` : String(v ?? 'null')}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs font-mono text-zinc-500">Simulation not yet executed.</p>
                    )}
                  </div>
                )}

                {/* 5. Narration Script */}
                {selectedTab === 'script' && (
                  <div className="flex flex-col gap-3">
                    {activeJob.script ? (
                      activeJob.script.segments.map((seg, idx) => (
                        <div key={seg.segmentId} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-zinc-200">Segment {idx + 1}: {seg.concept}</span>
                            {seg.audioDurationSeconds && (
                              <span className="text-emerald-400 font-mono">{seg.audioDurationSeconds.toFixed(1)}s audio</span>
                            )}
                          </div>
                          <p className="text-zinc-300 text-sm font-sans">"{seg.narrationText}"</p>
                          <span className="text-[11px] text-zinc-500 font-mono"><strong>Takeaway:</strong> {seg.learningOutcome}</span>
                          {seg.audioUrl && (
                            <audio controls src={seg.audioUrl} className="mt-2 h-8 w-full max-w-sm" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-mono text-zinc-500">Script not yet available.</p>
                    )}
                  </div>
                )}

                {/* 6. Research Sources */}
                {selectedTab === 'sources' && (
                  <div className="flex flex-col gap-3">
                    {activeJob.research ? (
                      activeJob.research.sources.map((src, i) => (
                        <div key={i} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-2 text-xs">
                          <a href={src.url} target="_blank" rel="noreferrer" className="font-bold text-indigo-400 hover:underline">
                            {src.title}
                          </a>
                          <p className="text-slate-300">{src.snippet}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {src.keyTakeaways.map((takeaway, k) => (
                              <span key={k} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                • {takeaway}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Research notes not yet generated.</p>
                    )}
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-16 flex flex-col items-center justify-center text-center gap-3">
              <BrainCircuit className="w-8 h-8 text-zinc-500" />
              <h3 className="font-mono font-semibold text-zinc-200 text-sm">Select or Queue a Video Compilation</h3>
              <p className="text-xs text-zinc-400 max-w-sm font-mono">
                Specify an engineering topic to trigger sandboxed Python simulation, neural script synthesis, and 1080p MP4 rendering.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

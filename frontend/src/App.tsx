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
  Layers
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
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          audienceLevel,
          targetDurationSeconds: Number(targetDuration),
          visualStyle,
          voice,
        }),
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
      completed: { bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400', text: 'Completed' },
      failed: { bg: 'bg-rose-950/80 border-rose-500/50 text-rose-400', text: 'Failed' },
      researching: { bg: 'bg-blue-950/80 border-blue-500/50 text-blue-400', text: 'Researching (Muse Spark)' },
      teaching: { bg: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-400', text: 'Scripting (Muse Spark)' },
      simulating: { bg: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400', text: 'Simulating (Python)' },
      planning: { bg: 'bg-purple-950/80 border-purple-500/50 text-purple-400', text: 'Visual Planning' },
      narrating: { bg: 'bg-amber-950/80 border-amber-500/50 text-amber-400', text: 'TTS Voiceover' },
      critiquing: { bg: 'bg-pink-950/80 border-pink-500/50 text-pink-400', text: 'Meta Llama Critic' },
      correcting: { bg: 'bg-orange-950/80 border-orange-500/50 text-orange-400', text: 'Auto-Remediating' },
      rendering: { bg: 'bg-teal-950/80 border-teal-500/50 text-teal-400', text: 'Rendering 1080p MP4' },
    };

    const s = map[status] || { bg: 'bg-slate-800 text-slate-300 border-slate-600', text: status };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.bg}`}>
        <span className={`w-2 h-2 rounded-full bg-current ${isRunning ? 'animate-ping' : ''}`}></span>
        {s.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Concept2Motion</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Meta AI Hackathon</span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Technical Video Engine Powered by Meta Muse Spark & Open-Weight Critic</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Reasoning: <strong className="text-slate-200">Meta Muse Spark 1.3</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Invariant Engine: <strong className="text-slate-200">Active</strong></span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Job Creator & History */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Generation Configuration Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Generate Technical Video
            </h2>

            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic / Algorithm</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. How Bloom Filter Works"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Audience Level</label>
                  <select
                    value={audienceLevel}
                    onChange={(e) => setAudienceLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Duration</label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Voice Style</label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="en-US-GuyNeural">Neural Guy (Clear)</option>
                    <option value="en-US-JennyNeural">Neural Jenny (Expressive)</option>
                    <option value="en-GB-RyanNeural">Ryan (Academic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Visual Aesthetic</label>
                  <select
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none"
                  >
                    <option value="minimalist_dark">Minimalist Dark</option>
                    <option value="blueprint">Technical Blueprint</option>
                    <option value="academic">Academic Lecture</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-sm text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Autonomous Video...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Launch Generation Pipeline
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past Generations List */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Generated Workflows ({recentJobs.length})
            </h3>

            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px]">
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
                  className={`text-left p-3 rounded-xl border transition flex flex-col gap-1.5 ${
                    activeJobId === j.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-slate-200 truncate max-w-[190px]">{j.request.topic}</span>
                    {renderStatusBadge(j.status)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{new Date(j.createdAt).toLocaleTimeString()}</span>
                    <span>• {j.traces.length} steps</span>
                    {j.correctionCount > 0 && (
                      <span className="text-amber-400 font-medium">⚡ {j.correctionCount} self-correction</span>
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
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-6 flex flex-col gap-6">
              
              {/* Job Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{activeJob.request.topic}</h2>
                    {renderStatusBadge(activeJob.status)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Job ID: <code className="text-indigo-300 font-mono">{activeJob.id}</code> • Started {new Date(activeJob.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {activeJob.videoUrl && (
                  <a
                    href={activeJob.videoUrl}
                    download
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download 1080p MP4
                  </a>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs overflow-x-auto">
                <button
                  onClick={() => setSelectedTab('video')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
                    selectedTab === 'video' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Video Preview
                </button>

                <button
                  onClick={() => setSelectedTab('timeline')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
                    selectedTab === 'timeline' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Agent Execution Timeline ({activeJob.traces.length})
                </button>

                <button
                  onClick={() => setSelectedTab('critic')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
                    selectedTab === 'critic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Critic & Self-Correction
                  {activeJob.criticReports && activeJob.criticReports.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>

                <button
                  onClick={() => setSelectedTab('simulation')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
                    selectedTab === 'simulation' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Simulation Code & States
                </button>

                <button
                  onClick={() => setSelectedTab('script')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
                    selectedTab === 'script' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Narration Script
                </button>

                <button
                  onClick={() => setSelectedTab('sources')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition ${
                    selectedTab === 'sources' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
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
                        <div className="rounded-3xl overflow-hidden border-2 border-slate-700/80 bg-black aspect-[9/16] w-full max-w-[360px] max-h-[640px] relative shadow-2xl ring-4 ring-slate-900/50">
                          <video
                            key={activeJob.videoUrl}
                            src={activeJob.videoUrl}
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          9:16 Vertical Reel Format (1080x1920)
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 flex flex-col items-center justify-center text-center gap-3">
                        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                        <h4 className="font-semibold text-white">Synthesizing Educational Video</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          The multi-agent pipeline is executing simulation code, generating neural narration, auditing invariants, and encoding the 1080p MP4.
                        </p>
                      </div>
                    )}

                    {activeJob.storyboard && (
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        {activeJob.storyboard.scenes.map((sc, i) => (
                          <div key={sc.sceneId} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col gap-1 text-xs">
                            <span className="text-[10px] font-mono text-indigo-400 uppercase">Scene {i + 1}</span>
                            <span className="font-semibold text-slate-200 truncate">{sc.title}</span>
                            <span className="text-[11px] text-slate-400">Duration: {sc.durationSeconds.toFixed(1)}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Observable Agent Timeline */}
                {selectedTab === 'timeline' && (
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {activeJob.traces.map((trace, idx) => {
                      const isLastStep = idx === activeJob.traces.length - 1;
                      const showActiveSpinner = isLastStep && isJobRunning;

                      return (
                        <div
                          key={trace.id}
                          className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-start gap-3 text-xs"
                        >
                          <div className="mt-0.5">
                            {showActiveSpinner ? (
                              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                            ) : trace.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : trace.status === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : trace.status === 'error' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Info className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>

                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{trace.agent}</span>
                                <span className="text-slate-400">• {trace.action}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(trace.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">{trace.details}</p>
                            {trace.toolUsed && (
                              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded w-fit">
                                tool: {trace.toolUsed}
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
                    <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Meta Open-Weight Model Verification Engine
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
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-indigo-400 font-mono">Sandboxed Executable Runner ({activeJob.simulation.language})</span>
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Self-Tests Passed
                            </span>
                          </div>
                          <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                            {activeJob.simulation.code}
                          </pre>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-slate-300">Captured State Snapshots ({activeJob.simulation.states.length} steps):</span>
                          <div className="grid grid-cols-2 gap-3">
                            {activeJob.simulation.states.map((st) => (
                              <div key={st.step} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col gap-1.5 text-xs">
                                <span className="font-bold text-indigo-400">Step {st.step}</span>
                                <p className="text-slate-300">{st.description}</p>
                                <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-slate-400 flex flex-wrap gap-2">
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
                      <p className="text-xs text-slate-400">Simulation not yet executed.</p>
                    )}
                  </div>
                )}

                {/* 5. Narration Script */}
                {selectedTab === 'script' && (
                  <div className="flex flex-col gap-3">
                    {activeJob.script ? (
                      activeJob.script.segments.map((seg, idx) => (
                        <div key={seg.segmentId} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">Segment {idx + 1}: {seg.concept}</span>
                            {seg.audioDurationSeconds && (
                              <span className="text-indigo-400 font-mono">{seg.audioDurationSeconds.toFixed(1)}s audio</span>
                            )}
                          </div>
                          <p className="text-slate-300 italic text-sm">"{seg.narrationText}"</p>
                          <span className="text-[11px] text-slate-400"><strong>Learning Outcome:</strong> {seg.learningOutcome}</span>
                          {seg.audioUrl && (
                            <audio controls src={seg.audioUrl} className="mt-2 h-8 w-full max-w-sm" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Script not yet available.</p>
                    )}
                  </div>
                )}

                {/* 6. Research Sources */}
                {selectedTab === 'sources' && (
                  <div className="flex flex-col gap-3">
                    {activeJob.research ? (
                      activeJob.research.sources.map((src, i) => (
                        <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 flex flex-col gap-2 text-xs">
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
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-16 flex flex-col items-center justify-center text-center gap-3">
              <BrainCircuit className="w-10 h-10 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Select or Launch a Generation Workflow</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter any computer science or technical topic on the left to see the autonomous agent network in action.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

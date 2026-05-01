import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Mic, MicOff, ArrowRight, ArrowLeft, RefreshCw, Download, Layers } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Interest, Path, Combination } from './types';
import { DIMS, PATHS, PLACEHOLDERS } from './constants';
import { makeComboDesc } from './utils';
import { analyzeInterests } from './GeminiService';
import { downloadGoldenThreadZip } from './ZipService';

export default function App() {
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState(-1);
  const [interests, setInterests] = useState<Interest[]>([
    { id: '1', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
    { id: '2', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
    { id: '3', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
    { id: '4', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
  ]);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const toggleRecording = (id: string) => {
    if (isRecording === id) {
      recognitionRef.current?.stop();
      setIsRecording(null);
    } else {
      if (isRecording) recognitionRef.current?.stop();
      setIsRecording(id);
      const interestIndex = interests.findIndex(i => i.id === id);
      const baseText = interests[interestIndex].why;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        const updatedInterests = [...interests];
        updatedInterests[interestIndex].why = baseText + (baseText ? ' ' : '') + finalTranscript + interimTranscript;
        setInterests(updatedInterests);
      };

      recognitionRef.current.onend = () => setIsRecording(null);
      recognitionRef.current.start();
    }
  };

  const addInterest = () => {
    setInterests([...interests, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: '', 
      why: '', 
      scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } 
    }]);
  };

  const removeInterest = (id: string) => {
    if (interests.length <= 2) return;
    setInterests(interests.filter(i => i.id !== id));
  };

  const updateInterest = (id: string, field: keyof Interest, value: any) => {
    setInterests(interests.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const updateScore = (id: string, dimension: keyof Interest['scores'], value: number) => {
    setInterests(interests.map(i => i.id === id ? { 
      ...i, 
      scores: { ...i.scores, [dimension]: value } 
    } : i));
  };

  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleToStep2 = async () => {
    const validInts = interests.filter(i => i.name.trim());
    if (validInts.length < 2) {
      alert('Please add at least 2 interests.');
      return;
    }

    setValidating(true);
    setValidationError(null);

    let hasInvalid = false;
    for (const interest of validInts) {
      // Split interest into words, strip punctuation
      const words = interest.name.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/).filter(w => w.length > 2);
      if (words.length === 0) continue;

      let isInterestValid = false;
      // An interest is valid if at least one of its words is in the dictionary (to allow proper nouns mixed with words like "playing Valorant")
      for (const word of words) {
        try {
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
          if (res.ok) {
            isInterestValid = true;
            break;
          }
        } catch (e) {
          // If network fails, default to true to not block the user
          isInterestValid = true;
          break;
        }
      }

      if (!isInterestValid) {
        hasInvalid = true;
        setValidationError(`"${interest.name}" doesn't seem to be a valid interest. Please use real words.`);
        break;
      }
    }

    setValidating(false);

    if (hasInvalid) {
      return;
    }

    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleToStep3 = () => {
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleToResults = async () => {
    setStep(3);
    setAnalyzing(true);
    window.scrollTo(0, 0);
    
    try {
      const validInts = interests.filter(i => i.name.trim());
      const aiResults = await analyzeInterests(validInts);
      
      calculateResults(aiResults);
    } catch (error) {
      console.error("AI Analysis failed, falling back to basic calculation", error);
      calculateResults();
    } finally {
      setAnalyzing(false);
    }
  };

  const calculateResults = (aiData?: any) => {
    const validInts = interests.filter(i => i.name.trim());
    const isc = validInts.map(i => ({
      name: i.name,
      why: i.why,
      scores: i.scores,
      total: (i.scores.energy + i.scores.skill + i.scores.leverage + i.scores.longevity) / 4
    })).sort((a, b) => b.total - a.total);

    const agg: Record<string, number> = {};
    DIMS.forEach(d => {
      agg[d.k] = validInts.reduce((sum, i) => sum + i.scores[d.k], 0) / validInts.length;
    });

    const ps = PATHS.map(p => {
      const score = DIMS.reduce((sum, d) => sum + (agg[d.k] / 10) * p.w[d.k] * 100, 0);
      return { ...p, score: Math.round(score * 10) / 10 };
    }).sort((a, b) => b.score - a.score);

    const stopWords = new Set(['because', 'really', 'about', 'there', 'their', 'which', 'often', 'think', 'like', 'love', 'enjoy', 'makes', 'always', 'never', 'every', 'would', 'could', 'should', 'being', 'having', 'when', 'what', 'that', 'with', 'from', 'just', 'this', 'also', 'have', 'very', 'much', 'more', 'most', 'some', 'them', 'they', 'been', 'into', 'then', 'than', 'your', 'mine', 'feel', 'feeling', 'helps', 'want', 'need', 'great', 'good', 'find', 'know', 'make']);
    const allWhyText = validInts.map(i => i.why).join(' ').toLowerCase().replace(/[^a-z\s]/g, '');
    const words = allWhyText.split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w));
    const freq: Record<string, number> = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    const topW = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);

    let combos: Combination[] = [];
    if (aiData?.synergies) {
      combos = aiData.synergies;
    } else {
      for (let i = 0; i < validInts.length; i++) {
        for (let j = i + 1; j < validInts.length; j++) {
          const si = validInts[i].scores;
          const sj = validInts[j].scores;
          const syn = ((si.energy + sj.energy) / 2 + (si.skill + sj.skill) / 2 + (si.leverage + sj.leverage) / 2) / 3 / 2;
          combos.push({
            a: validInts[i].name,
            b: validInts[j].name,
            desc: makeComboDesc(validInts[i].name, validInts[j].name),
            score: syn
          });
        }
      }
    }
    combos.sort((a, b) => b.score - a.score);

    const top1 = isc[0]?.name || validInts[0].name;
    const top2 = isc[1]?.name || (validInts[1]?.name || validInts[0].name);
    const topD = DIMS.reduce((mx, d) => agg[d.k] > agg[mx.k] ? d : mx, DIMS[0]);
    const thread = aiData?.goldenThread || `At the intersection of "${top1}" and "${top2}" lives your natural ${topD.l.toLowerCase()} — the invisible thread that connects everything you're drawn to.`;

    setResults({ 
      ints: validInts.map(i => i.name), 
      isc, 
      agg, 
      ps, 
      topW, 
      combos, 
      thread,
      deepDives: aiData?.deepDives,
      moat: aiData?.moat || "Your unique moat is built on the intersection of deep discipline and high-leverage curiosity. Others stop at the surface; you find the hidden connections that create rare value.",
      mindMap: aiData?.mindMap
    });
  };

  const reset = () => {
    setStep(0);
    setInterests([
      { id: '1', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
      { id: '2', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
      { id: '3', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
      { id: '4', name: '', why: '', scores: { energy: 5, skill: 5, leverage: 5, longevity: 5 } },
    ]);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-cream text-ink font-sans selection:bg-olive selection:text-white">
      {/* Progress Strip */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-tan z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-olive to-sage"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="max-w-[860px] mx-auto px-6 pt-16 pb-24 relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-4"
          >
            <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none">
              <circle cx="24" cy="24" r="23" stroke="#5A5A40" strokeWidth="1"/>
              <path d="M12 36 Q18 14 24 24 Q30 34 36 12" stroke="#5A5A40" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="36" r="2.5" fill="#5A5A40"/>
              <circle cx="36" cy="12" r="2.5" fill="#5A5A40"/>
            </svg>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl md:text-5xl font-bold mb-3 tracking-tight italic"
          >
            Find Your <span className="text-olive">Golden Thread</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-sage max-w-lg mx-auto leading-relaxed"
          >
            Your interests aren't scattered — they're connected. This tool finds the invisible thread and shows exactly how each interest amplifies the others.
          </motion.p>
        </header>

        {/* Steps Breadcrumb */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3, 4].map((s, i) => (
            <React.Fragment key={s}>
              <div 
                className={`w-7 h-7 rounded-full border-1.5 flex items-center justify-center text-[10px] font-mono transition-all duration-500
                  ${step > i ? 'bg-olive border-olive text-white' : 
                    step === i ? 'bg-olive/15 border-olive text-olive' : 
                    'bg-white border-tan text-sage'}`}
              >
                0{s}
              </div>
              {i < 3 && (
                <div className={`w-10 h-px transition-colors duration-500 ${step > i ? 'bg-olive' : 'bg-tan'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === -1 && (
            <motion.section 
              key="stepName"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md mx-auto py-12 text-center space-y-8"
            >
              <div className="space-y-4">
                <h2 className="font-serif text-3xl font-bold text-olive">Welcome, Traveler.</h2>
                <p className="text-sage text-sm italic">Before we start weaving your thread, what shall we call you?</p>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  autoFocus
                  className="w-full text-center bg-white border border-tan rounded-xl p-4 text-lg font-serif italic text-olive outline-none focus:border-olive shadow-sm transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && userName.trim() && setStep(0)}
                />
                
                <button 
                  onClick={() => userName.trim() && setStep(0)}
                  disabled={!userName.trim()}
                  className="px-10 py-3 bg-olive text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-30 disabled:translate-y-0 hover:-translate-y-0.5"
                >
                  Begin the discovery
                </button>
              </div>
            </motion.section>
          )}

          {step === 0 && (
            <motion.section 
              key="step0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="font-mono text-[10px] tracking-widest text-olive uppercase">Step 01 of 04</span>
                <h2 className="font-serif text-2xl font-bold">What are you drawn to?</h2>
                <p className="text-sage text-sm">Add your interests, hobbies, topics or skills. Even things that seem unrelated.</p>
              </div>

              <div className="space-y-2.5">
                {interests.map((interest, idx) => (
                  <div key={interest.id} className="group flex items-center gap-3 bg-white border border-tan rounded-xl p-3 focus-within:border-olive transition-colors shadow-sm shadow-black/5">
                    <span className="font-mono text-[10px] text-sage w-5 text-center">{(idx + 1).toString().padStart(2, '0')}</span>
                    <input 
                      type="text"
                      value={interest.name}
                      onChange={(e) => updateInterest(interest.id, 'name', e.target.value)}
                      placeholder={PLACEHOLDERS[idx % PLACEHOLDERS.length] || 'Another interest...'}
                      className="bg-transparent border-none outline-none w-full text-sm placeholder-sage/40"
                      maxLength={60}
                    />
                    <button 
                      onClick={() => removeInterest(interest.id)}
                      className="text-sage hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={addInterest}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-tan rounded-xl text-sage text-xs hover:border-olive hover:text-olive transition-all"
              >
                <Plus size={14} /> Add another interest
              </button>

              <div className="pt-4 space-y-3">
                {validationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 italic"
                  >
                    {validationError}
                  </motion.div>
                )}
                <button 
                  onClick={handleToStep2} 
                  disabled={validating}
                  className="px-7 py-2.5 bg-olive text-white font-medium rounded-lg text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {validating ? (
                    <><RefreshCw size={16} className="animate-spin" /> Verifying...</>
                  ) : (
                    <>Continue <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </motion.section>
          )}

          {step === 1 && (
            <motion.section 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="font-mono text-[10px] tracking-widest text-olive uppercase">Step 02 of 04</span>
                <h2 className="font-serif text-2xl font-bold">The Curiosity Audit</h2>
                <p className="text-sage text-sm">For each interest, pinpoint the "Spark". What was the specific moment, problem, or observation that pulled you in?</p>
              </div>

              <div className="space-y-4">
                {interests.filter(i => i.name.trim()).map((interest) => (
                  <div key={interest.id} className="bg-white border border-tan rounded-xl p-4 space-y-3 focus-within:border-olive transition-colors shadow-sm shadow-black/5">
                    <div className="text-[11px] font-mono text-olive tracking-wide">◆ {interest.name}</div>
                    <p className="text-[12px] text-sage">What specifically sparked this? What problem does it solve for you?</p>
                    <div className="flex gap-3 items-start">
                      <textarea 
                        value={interest.why}
                        onChange={(e) => updateInterest(interest.id, 'why', e.target.value)}
                        placeholder="I was first curious when... It helps me..."
                        className="bg-transparent border-none outline-none w-full text-sm leading-relaxed resize-none h-20 placeholder-sage/30"
                      />
                      <button 
                        onClick={() => toggleRecording(interest.id)}
                        className={`w-9 h-9 rounded-full border border-tan flex items-center justify-center transition-all flex-shrink-0
                          ${isRecording === interest.id ? 'border-red-500 bg-red-500/10 animate-pulse' : 'hover:border-olive bg-cream'}`}
                      >
                        {isRecording === interest.id ? <MicOff size={14} className="text-red-500" /> : <Mic size={14} className="text-sage" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleToStep3} className="px-7 py-2.5 bg-olive text-white font-medium rounded-lg text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all">
                  Score each interest →
                </button>
                <button onClick={() => setStep(0)} className="px-7 py-2.5 border border-tan text-sage rounded-lg text-sm hover:text-olive hover:border-olive transition-all">
                  ← Back
                </button>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="font-mono text-[10px] tracking-widest text-olive uppercase">Step 03 of 04</span>
                <h2 className="font-serif text-2xl font-bold">Rate each interest</h2>
                <p className="text-sage text-sm">Score every interest across four dimensions. Be honest — this shapes your results.</p>
              </div>

              <div className="space-y-4">
                {interests.filter(i => i.name.trim()).map((interest) => (
                  <div key={interest.id} className="bg-white border border-tan rounded-xl p-5 space-y-4 shadow-sm shadow-black/5">
                    <div className="flex items-center gap-2 font-medium text-sm text-olive">
                      <div className="w-1.5 h-1.5 rounded-full bg-olive" />
                      {interest.name}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {DIMS.map((d) => (
                        <div key={d.k} className="space-y-2">
                          <div className="flex justify-between text-[11px] text-sage">
                            <span className="italic">{d.l}</span>
                            <span className="font-mono text-olive font-bold">{interest.scores[d.k]}</span>
                          </div>
                          <input 
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={interest.scores[d.k]}
                            onChange={(e) => updateScore(interest.id, d.k, parseInt(e.target.value))}
                            className="w-full h-1 bg-tan rounded-lg appearance-none cursor-pointer accent-olive"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleToResults} className="px-7 py-2.5 bg-olive text-white font-medium rounded-lg text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all">
                  Find my thread →
                </button>
                <button onClick={() => setStep(1)} className="px-7 py-2.5 border border-tan text-sage rounded-lg text-sm hover:text-olive hover:border-olive transition-all">
                  ← Back
                </button>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section 
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {analyzing ? (
                <div className="py-24 text-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-olive animate-spin mx-auto" />
                  <p className="font-mono text-[10px] text-sage">Weaving your thread...</p>
                </div>
              ) : results && (
                <div className="space-y-6">
                  {/* Result Card: The Thread */}
                  <div className="bg-white border border-tan rounded-2xl p-8 relative overflow-hidden text-center shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-olive to-transparent" />
                    <div className="space-y-4">
                      <span className="font-mono text-[10px] tracking-[0.2em] text-olive uppercase">✦ Your Golden Thread</span>
                      <p className="font-serif text-xl sm:text-2xl text-olive italic leading-relaxed max-w-xl mx-auto">
                        {results.thread}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {results.topW.map((w: string) => (
                          <span key={w} className="px-3 py-1 rounded-full bg-tan/50 border border-tan text-olive text-[11px] font-mono italic">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Moat Analysis */}
                  <div className="bg-olive/5 border border-olive/20 rounded-2xl p-6 space-y-3 shadow-sm border-dashed">
                    <div className="flex items-center gap-2 text-olive font-serif font-bold italic">
                      <Layers size={18} />
                      Your Unique Moat
                    </div>
                    <p className="text-xs text-ink leading-relaxed italic">
                      {results.moat}
                    </p>
                  </div>

                  {/* Interest Analysis Breakdown */}
                  <div className="bg-white border border-tan rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="font-serif text-base font-semibold text-olive">Interest Analysis</h3>
                    <div className="space-y-6">
                      {results.isc.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <span className="font-mono text-[10px] text-sage">{(idx + 1).toString().padStart(2, '0')}</span>
                              <h4 className="font-serif text-sm font-bold text-olive">{item.name}</h4>
                            </div>
                            <span className="font-mono text-olive text-xs font-bold">{item.total.toFixed(1)}/10</span>
                          </div>
                          
                          {results.deepDives?.[item.name] && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[11px] text-ink leading-relaxed italic bg-cream/50 p-2.5 rounded-lg border-l-2 border-sage"
                            >
                              {results.deepDives[item.name]}
                            </motion.p>
                          )}

                          <div className="h-1 bg-tan rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round((item.total / 10) * 100)}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-olive to-sage" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dimension Chart */}
                  <div className="bg-white border border-tan rounded-2xl p-6 space-y-6 shadow-sm">
                    <h3 className="font-serif text-base font-semibold text-olive">Dimension Profile</h3>
                    <div className="h-64 sm:h-80 w-full relative">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={DIMS.map(d => ({ subject: d.l, value: results.agg[d.k] }))}>
                          <PolarGrid stroke="#EBE7DF" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#8C937A', fontSize: 11 }} />
                          <Radar name="Profile" dataKey="value" stroke="#5A5A40" fill="#5A5A40" fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Combinations: Permutations & Connectivity */}
                  <div className="bg-white border border-tan rounded-2xl p-6 space-y-6 shadow-sm">
                    <div className="space-y-1">
                      <h3 className="font-serif text-base font-semibold text-olive">How Your Interests Amplify Each Other</h3>
                      <p className="text-xs text-sage italic">Every pair of your interests creates a compounding effect.</p>
                    </div>
                    <div className="space-y-4">
                      {results.combos.map((combo: any, idx: number) => (
                        <div key={idx} className="bg-cream border border-tan rounded-xl p-5 relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-olive" />
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-tan/80 text-olive text-[10px] font-mono font-medium italic">{combo.a}</span>
                            <span className="text-sage opacity-50 text-xs">↔</span>
                            <span className="px-3 py-1 rounded-full bg-tan/80 text-olive text-[10px] font-mono font-medium italic">{combo.b}</span>
                          </div>
                          <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">
                            {combo.desc.split('**').map((part: string, i: number) => 
                              i % 2 === 1 ? <strong key={i} className="text-olive font-bold">{part}</strong> : part
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-4">
                            <span className="text-[10px] text-sage uppercase tracking-widest">Synergy</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((dot) => (
                                <div 
                                  key={dot} 
                                  className={`w-1.5 h-1.5 rounded-full ${dot <= Math.round(combo.score * 5) ? 'bg-olive' : 'bg-tan'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best Match Paths */}
                  <div className="bg-white border border-tan rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="font-serif text-base font-semibold text-olive">Your Best-Fit Paths</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.ps.map((path: any, i: number) => (
                        <div 
                          key={path.n} 
                          className={`p-5 rounded-xl border transition-all ${i === 0 ? 'bg-olive/5 border-olive' : 'bg-cream border-tan'}`}
                        >
                          <div className="text-[10px] font-mono text-olive mb-2 uppercase tracking-widest font-bold">
                            {i === 0 ? '✦ Best Match' : `#${(i + 1).toString().padStart(2, '0')}`}
                          </div>
                          <h4 className="font-serif text-sm font-bold mb-1 text-olive">{path.n}</h4>
                          <p className="text-[11px] text-sage italic leading-relaxed mb-3">{path.d}</p>
                          <div className="h-1 bg-tan rounded-full overflow-hidden">
                            <div className="h-full bg-olive" style={{ width: `${Math.round((path.score / 30) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <button 
                      onClick={() => downloadGoldenThreadZip(results, userName)}
                      className="px-8 py-3 bg-olive text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2"
                    >
                      <Download size={16} /> Download {userName ? `${userName}'s` : 'My'} Bundle (ZIP)
                    </button>
                    <button 
                      onClick={reset}
                      className="px-8 py-3 text-sage text-sm hover:text-olive transition-all flex items-center gap-2"
                    >
                      <RefreshCw size={16} /> Start Over
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Minimal Footer */}
        <footer className="mt-20 pt-8 border-t border-tan text-center">
            <p className="text-[10px] font-serif italic text-olive/60">
              "The people most at risk aren't the generalists. They're the ones who went too narrow, too early." — theMITmonk
            </p>
        </footer>
      </div>
    </div>
  );
}

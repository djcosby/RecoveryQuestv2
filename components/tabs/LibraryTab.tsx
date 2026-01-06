
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, BookOpen, Brain, Sparkles, MessageSquare, Trophy, ChevronRight, ChevronLeft, 
  Upload, Search, Loader2, CheckCircle, Trash2, Star, Volume2, StopCircle
} from 'lucide-react';
import { useLibraryStore } from '../../context/LibraryContext';
import { useUserStore } from '../../context/UserContext';
import { LibraryBook, BookSkin, GeneratedQuiz, QuizQuestion } from '../../types';
import { analyzeTextWithSkin, generateQuizFromText, generateSpeech, decodeBase64ToBytes, decodePCMData } from '../../services/geminiService';

// --- READER COMPONENT ---

interface ReaderModalProps {
  book: LibraryBook;
  onClose: () => void;
}

const ReaderModal: React.FC<ReaderModalProps> = ({ book, onClose }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeSkin, setActiveSkin] = useState<BookSkin>('standard');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  
  // TTS State
  const [isReading, setIsReading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { addXP, addGems } = useUserStore();
  const { updateBookProgress, markChapterQuizComplete } = useLibraryStore();
  
  // Guard against missing chapters
  const chapter = book.chapters?.[activeChapterIndex];

  // Auto-update progress and scroll to top on chapter change
  useEffect(() => {
      if (!book.chapters || book.chapters.length === 0) return;
      const progress = Math.round(((activeChapterIndex + 1) / book.chapters.length) * 100);
      updateBookProgress(book.id, progress);
      
      if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
      }
  }, [activeChapterIndex, book.chapters, book.id, updateBookProgress]);

  useEffect(() => {
    if (!chapter) return;
    const fetchAnalysis = async () => {
      setIsAnalyzing(true);
      const result = await analyzeTextWithSkin(chapter.content, activeSkin);
      setAiAnalysis(result);
      setIsAnalyzing(false);
    };
    fetchAnalysis();
  }, [chapter, activeSkin]);

  // Clean up audio on unmount or chapter change
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [chapter]);

  const stopAudio = () => {
    if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
    }
    setIsReading(false);
  };

  const toggleAudio = async () => {
    if (!chapter) return;
    
    if (isReading) {
        stopAudio();
        return;
    }

    setIsGeneratingAudio(true);
    // Limit text length to avoid timeouts/limits for this demo
    const textToRead = chapter.content.substring(0, 4000); 
    const audioData = await generateSpeech(textToRead);
    setIsGeneratingAudio(false);

    if (audioData) {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const bytes = decodeBase64ToBytes(audioData);
        const buffer = await decodePCMData(bytes, audioContextRef.current);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        sourceRef.current = source;
        setIsReading(true);
        
        source.onended = () => {
            setIsReading(false);
            sourceRef.current = null;
        };
    } else {
        alert("Could not generate audio. Please check API key or try again.");
    }
  };

  const handleStartQuiz = async () => {
    if (!chapter) return;
    setIsAnalyzing(true);
    const generatedQuiz = await generateQuizFromText(chapter.id, chapter.content);
    if (generatedQuiz) {
        setQuiz(generatedQuiz);
        setShowQuiz(true);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizFinished(false);
    } else {
        window.alert("Could not generate quiz. Try again later.");
    }
    setIsAnalyzing(false);
  };

  const handleAnswerSelect = (index: number) => {
      if (answerSubmitted) return;
      setSelectedAnswer(index);
      setAnswerSubmitted(true);
      if (quiz && index === quiz.questions[currentQuestionIndex].correctIndex) {
          setScore(s => s + 1);
      }
  };

  const handleNextQuestion = () => {
      if (!quiz) return;
      if (currentQuestionIndex < quiz.questions.length - 1) {
          setCurrentQuestionIndex(i => i + 1);
          setSelectedAnswer(null);
          setAnswerSubmitted(false);
      } else {
          setQuizFinished(true);
          const finalScore = score;
          if (finalScore >= 1) { // At least 1 correct
             addXP(quiz.xpReward);
             addGems(5);
             markChapterQuizComplete(book.id, chapter.id, finalScore);
          }
      }
  };

  const goToPrevChapter = () => {
      if (activeChapterIndex > 0) {
          setActiveChapterIndex(i => i - 1);
      }
  };

  const goToNextChapter = () => {
      if (activeChapterIndex < (book.chapters?.length || 0) - 1) {
          setActiveChapterIndex(i => i + 1);
      }
  };

  if (!chapter) {
      return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center animate-fade-in">
            <div className="p-8 text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="font-bold text-slate-700 text-lg">No content found</h3>
                <p className="text-slate-500 text-sm mb-6">This book appears to be empty.</p>
                <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-6 rounded-xl transition-colors">
                    Close
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slide-in-bottom">
      {/* Top Bar */}
      <div className={`h-16 ${book.themeColor} flex items-center justify-between px-4 shadow-md shrink-0`}>
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors" title="Close Reader"><X size={24} /></button>
          <div className="text-white overflow-hidden hidden sm:block">
            <h2 className="font-bold text-sm leading-tight truncate max-w-[150px]">{book.title}</h2>
            <p className="text-[10px] opacity-80 truncate max-w-[150px] uppercase tracking-wider">{chapter.title}</p>
          </div>
        </div>

        {/* Header Navigation Controls */}
        <div className="flex items-center bg-black/10 rounded-xl px-2 py-1 space-x-1">
           <button 
             disabled={activeChapterIndex === 0}
             onClick={goToPrevChapter}
             className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
             title="Previous Chapter"
           >
             <ChevronLeft size={20} />
           </button>
           <div className="px-3 text-white text-xs font-black min-w-[50px] text-center border-x border-white/10">
             {activeChapterIndex + 1} / {book.chapters.length}
           </div>
           <button 
             disabled={activeChapterIndex === book.chapters.length - 1}
             onClick={goToNextChapter}
             className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
             title="Next Chapter"
           >
             <ChevronRight size={20} />
           </button>
        </div>

        <div className="flex items-center space-x-2">
           <button 
             onClick={toggleAudio}
             disabled={isGeneratingAudio}
             className={`p-2 rounded-full transition-colors ${isReading ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/20 text-white hover:bg-white/30'}`}
             title={isReading ? "Stop Reading" : "Read Aloud"}
           >
             {isGeneratingAudio ? <Loader2 size={16} className="animate-spin" /> : isReading ? <StopCircle size={16} /> : <Volume2 size={16} />}
           </button>
           
           <select 
             value={activeSkin} 
             onChange={(e) => setActiveSkin(e.target.value as BookSkin)}
             className="bg-white/20 text-white text-[10px] font-black uppercase py-1.5 px-2 rounded-lg border border-white/30 outline-none focus:bg-white/30 cursor-pointer hidden md:block"
           >
             <option value="standard">Standard</option>
             <option value="scholar">Scholar</option>
             <option value="street">Street</option>
             <option value="mystic">Mystic</option>
             <option value="gamer">Gamer</option>
           </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 scroll-smooth">
          <div className="max-w-2xl mx-auto bg-white p-6 md:p-12 rounded-[2.5rem] shadow-sm min-h-full border border-slate-100">
            <div className="flex justify-between items-start mb-8 border-b border-slate-50 pb-6">
               <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 block">Chapter {activeChapterIndex + 1}</span>
                  <h3 className="text-3xl font-serif font-bold text-slate-800 leading-tight">{chapter.title}</h3>
               </div>
               {chapter.quizCompleted && (
                   <div className="flex flex-col items-end">
                       <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center border border-emerald-200">
                           <CheckCircle size={12} className="mr-1" /> Mastery Confirmed
                       </span>
                       {chapter.lastScore !== undefined && (
                           <span className="text-[9px] text-slate-400 font-bold mt-2">Accuracy: {chapter.lastScore}/3</span>
                       )}
                   </div>
               )}
            </div>
            
            <div className="prose prose-indigo prose-lg leading-relaxed font-serif text-slate-700 whitespace-pre-wrap">
              {chapter.content}
            </div>
            
            {/* Footer Nav Controls */}
            <div className="flex justify-between items-center mt-16 pt-8 border-t-2 border-slate-50">
                <button 
                    disabled={activeChapterIndex === 0} 
                    onClick={goToPrevChapter} 
                    className="group flex flex-col items-start space-y-1 text-slate-400 disabled:opacity-20 transition-all hover:text-indigo-600"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center">
                        <ChevronLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back
                    </span>
                    <span className="text-xs font-bold hidden sm:block">Previous Chapter</span>
                </button>

                <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mb-1"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mb-1"></div>
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                </div>

                <button 
                    disabled={activeChapterIndex === book.chapters.length - 1} 
                    onClick={goToNextChapter} 
                    className="group flex flex-col items-end space-y-1 text-indigo-500 disabled:opacity-20 transition-all hover:text-indigo-800"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center">
                        Next <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-xs font-bold hidden sm:block">Next Chapter</span>
                </button>
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="w-85 bg-white border-l-2 border-slate-100 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
                <Brain size={18} /><span>Deep Synthesis</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Lens Selection</h4>
                <div className="grid grid-cols-5 gap-2">
                    {(['standard', 'scholar', 'street', 'mystic', 'gamer'] as BookSkin[]).map(skin => (
                        <button 
                            key={skin}
                            onClick={() => setActiveSkin(skin)}
                            className={`p-2 rounded-xl text-lg transition-all flex items-center justify-center border-2
                            ${activeSkin === skin ? 'bg-white border-white scale-110 shadow-md' : 'bg-indigo-700 border-indigo-500 opacity-60 hover:opacity-100'}`}
                            title={`${skin.charAt(0).toUpperCase() + skin.slice(1)} Perspective`}
                        >
                            {skin === 'gamer' ? '👾' : skin === 'mystic' ? '✨' : skin === 'street' ? '🛑' : skin === 'scholar' ? '🎓' : '📚'}
                        </button>
                    ))}
                </div>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-300">
                  <Sparkles className="animate-spin text-indigo-400" size={32} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Refracting Insight...</span>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 relative">
                  <div className="flex items-center space-x-2 mb-4">
                      <h4 className="font-black text-xs text-indigo-600 uppercase tracking-widest">{activeSkin} Lens Analysis</h4>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {aiAnalysis}
                  </div>
                  <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
                      <Sparkles size={40} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
            <button 
                onClick={handleStartQuiz} 
                disabled={isAnalyzing}
                className={`w-full group hover:scale-[1.02] disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-xl active:scale-95
                ${chapter.quizCompleted ? 'bg-emerald-600 shadow-emerald-100' : 'bg-indigo-600 shadow-indigo-100'}`}
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : (chapter.quizCompleted ? <CheckCircle size={18} /> : <Trophy size={18} />)}
                <span className="text-sm uppercase tracking-widest">{chapter.quizCompleted ? 'Recalibrate Quiz' : 'Initialize Quiz'}</span>
            </button>
            <p className="text-[9px] text-center mt-3 font-bold text-slate-400 uppercase tracking-tighter">Gain 50 XP & 5 Gems per chapter mastery</p>
          </div>
        </div>
      </div>

      {/* Quiz Overlay */}
      {showQuiz && quiz && (
        <div className="absolute inset-0 z-[70] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
            
            {!quizFinished ? (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-black text-2xl text-slate-800 tracking-tighter">Chapter Insight</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verification Phase</p>
                        </div>
                        <button onClick={() => setShowQuiz(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20}/></button>
                    </div>
                    
                    <div className="mb-10">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                            <span>Vector {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                            <span className="text-indigo-500">Stability: {score}/{quiz.questions.length}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`}}></div>
                        </div>
                    </div>

                    <h4 className="text-xl font-bold text-slate-800 mb-8 leading-tight">
                        {quiz.questions[currentQuestionIndex].text}
                    </h4>

                    <div className="space-y-3 mb-10">
                        {quiz.questions[currentQuestionIndex].options.map((opt, idx) => {
                            let btnClass = "bg-white border-slate-100 hover:border-indigo-400 text-slate-600";
                            if (answerSubmitted) {
                                if (idx === quiz.questions[currentQuestionIndex].correctIndex) btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md shadow-emerald-50";
                                else if (idx === selectedAnswer) btnClass = "bg-rose-50 border-rose-500 text-rose-800 shadow-md shadow-rose-50";
                                else btnClass = "bg-slate-50 border-slate-50 text-slate-300 opacity-50";
                            } else if (idx === selectedAnswer) {
                                btnClass = "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg shadow-indigo-50 ring-2 ring-indigo-200";
                            }

                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => handleAnswerSelect(idx)} 
                                    disabled={answerSubmitted}
                                    className={`w-full p-5 border-2 rounded-[1.5rem] text-left font-bold text-sm transition-all active:scale-95 ${btnClass}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${selectedAnswer === idx ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-100 text-slate-300'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span>{opt}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {answerSubmitted && (
                        <div className="animate-slide-in-bottom">
                            {quiz.questions[currentQuestionIndex].explanation && (
                                <div className={`p-4 rounded-2xl mb-6 text-xs font-bold leading-relaxed border flex items-start gap-3 
                                    ${quiz.questions[currentQuestionIndex].correctIndex === selectedAnswer ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                    <Sparkles size={16} className="shrink-0 mt-0.5" />
                                    <span>{quiz.questions[currentQuestionIndex].explanation}</span>
                                </div>
                            )}
                            <button onClick={handleNextQuestion} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
                                {currentQuestionIndex < quiz.questions.length - 1 ? 'Acknowledge & Proceed' : 'Finalize Insight'}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <div className="w-28 h-28 bg-yellow-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-5xl shadow-xl shadow-yellow-50 border-4 border-white animate-zoom-in">
                        🏆
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">Logic Grid Decrypted</h2>
                    <p className="text-lg font-black text-indigo-600 mb-8 uppercase tracking-widest">Mastery: {Math.round((score / quiz.questions.length) * 100)}%</p>
                    <div className="grid grid-cols-2 gap-3 mb-10">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">XP Earned</span>
                            <span className="text-xl font-black text-slate-800">+{score >= 1 ? quiz.xpReward : 0}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Vector Alignment</span>
                            <span className="text-xl font-black text-slate-800">{score}/{quiz.questions.length}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowQuiz(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs">
                        Return to Archives
                    </button>
                </div>
            )}
            
            {/* Background decoration for quiz */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
                <Brain size={250} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LibraryTab: React.FC = () => {
  const { library, uploadBook, deleteBook } = useLibraryStore();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadBook(e.target.files[0]);
    }
  };

  const filteredBooks = library.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));
  const activeBook = library.find(b => b.id === selectedBookId);

  return (
    <div className="pb-24 px-4 pt-6 bg-slate-50 min-h-screen animate-fade-in">
      {activeBook && <ReaderModal book={activeBook} onClose={() => setSelectedBookId(null)} />}
      
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Archives</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Personal recovery knowledge base</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all"
        >
          <Upload size={18} />
          <span>Upload Archive</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.md" 
          onChange={handleFileUpload} 
        />
      </div>

      <div className="relative mb-8 group">
        <input 
          type="text" 
          placeholder="Filter archives by title..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm group-hover:shadow-md"
        />
        <Search className="absolute left-4 top-4 text-slate-400 group-hover:text-indigo-400 transition-colors" size={20} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map(book => (
          <div key={book.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
             {book.type === 'upload' && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
                    className="absolute top-4 right-4 p-2 bg-slate-50 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete Archive"
                 >
                     <Trash2 size={16} />
                 </button>
             )}
             <button onClick={() => setSelectedBookId(book.id)} className="w-full text-left flex flex-col h-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 ${book.themeColor.replace('bg-', 'bg-').replace('600', '50')} ${book.themeColor.replace('bg-', 'text-').replace('600', '600')} border-b-4 border-black/5`}>
                    {book.coverEmoji}
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight line-clamp-2 min-h-[3rem]">{book.title}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{book.author}</p>
                
                <div className="mt-auto">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <span>{book.progress}% Processed</span>
                        {book.masteryLevel > 0 && <span className="text-amber-500 flex items-center bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100"><Star size={10} className="mr-1 fill-current" /> Lvl {book.masteryLevel}</span>}
                    </div>
                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${book.progress}%` }}></div>
                    </div>
                </div>
             </button>
          </div>
        ))}
      </div>
      
      {filteredBooks.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <BookOpen size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Zero archive results found</p>
          </div>
      )}
    </div>
  );
};

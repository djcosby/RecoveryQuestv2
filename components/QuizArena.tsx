import React, { useState, useEffect } from 'react';
import { Unit, QuizQuestion } from '../types';
import { db } from '../services/mockDb';
import { geminiService } from '../services/geminiService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { SilverbookEngine } from '../services/mockDb';

interface QuizArenaProps {
  unit: Unit;
  userId: string;
  onComplete: () => void;
  onExit: () => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({ unit, userId, onComplete, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Load Questions (Simulating RAG generation)
  useEffect(() => {
    const loadQuiz = async () => {
        const startTime = Date.now();
      try {
        if (unit.libraryRefId) {
          const resource = await db.getLibraryResource(unit.libraryRefId);
          if (resource) {
            const generatedQuestions = await geminiService.generateQuizFromContent(resource);
            setQuestions(generatedQuestions);
          }
        } else {
          // Fallback static questions for demo if no RAG source
          setQuestions([
            {
              question: "What is the first step in recovery?",
              options: ["Admitting powerlessness", "Making amends", "Helping others", "Meditation"],
              correctAnswerIndex: 0,
              explanation: "Step 1 is the foundation."
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load quiz", err);
      } finally {
        setLoading(false);
        // Log "started" to Silverbook
        SilverbookEngine.logInteraction({
            userId,
            resourceId: unit.id,
            timestamp: new Date().toISOString(),
            durationSeconds: 0,
            completionStatus: 'started'
        });
      }
    };
    loadQuiz();
  }, [unit, userId]);

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Finished
        SilverbookEngine.logInteraction({
            userId,
            resourceId: unit.id,
            timestamp: new Date().toISOString(),
            durationSeconds: 60, // Mock duration
            completionStatus: 'completed'
        });
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-brand-500" size={48} />
        <p className="text-slate-500 animate-pulse">Consulting the Great Library...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg mx-auto border border-slate-100">
      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-6">
        <div 
          className="bg-brand-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-6">{currentQ.question}</h3>

      <div className="space-y-3">
        {currentQ.options.map((option, idx) => {
          let styles = "border-slate-200 hover:bg-slate-50";
          if (isAnswered) {
             if (idx === currentQ.correctAnswerIndex) styles = "bg-green-100 border-green-500 text-green-800";
             else if (idx === selectedOption) styles = "bg-red-100 border-red-500 text-red-800";
             else styles = "opacity-50";
          } else if (selectedOption === idx) {
             styles = "bg-brand-100 border-brand-500";
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${styles}`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isAnswered && idx === currentQ.correctAnswerIndex && <CheckCircle size={20} className="text-green-600"/>}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswerIndex && <XCircle size={20} className="text-red-600"/>}
              </div>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-lg text-sm">
          <p className="font-bold mb-1">Insight:</p>
          {currentQ.explanation}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
        <button 
          onClick={nextQuestion}
          disabled={!isAnswered}
          className="bg-brand-600 disabled:opacity-50 text-white px-6 py-2 rounded-full font-semibold hover:bg-brand-700 transition-colors"
        >
          {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};
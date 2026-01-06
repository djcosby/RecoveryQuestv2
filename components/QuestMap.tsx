import React from 'react';
import { Unit } from '../types';
import { motion } from 'framer-motion';
import { Check, Lock, Star, BookOpen, MessageCircle } from 'lucide-react';

interface QuestMapProps {
  units: Unit[];
  completedUnitIds: string[];
  onUnitSelect: (unit: Unit) => void;
}

export const QuestMap: React.FC<QuestMapProps> = ({ units, completedUnitIds, onUnitSelect }) => {
  return (
    <div className="flex flex-col items-center space-y-8 py-10 w-full max-w-md mx-auto relative">
      {/* Path Line */}
      <div className="absolute top-10 bottom-10 w-1 bg-slate-200 -z-10 rounded-full" />

      {units.map((unit, index) => {
        const isCompleted = completedUnitIds.includes(unit.id);
        // A unit is unlocked if it's not explicitly locked OR if the previous one is completed
        // For this demo, we use a simpler logic: mock `isLocked` plus sequential check
        const isLocked = unit.isLocked && !isCompleted; 
        
        // Stagger the layout slightly left/right for visual interest
        const xOffset = index % 2 === 0 ? -20 : 20;

        return (
          <motion.button
            key={unit.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: xOffset }}
            whileHover={!isLocked ? { scale: 1.1 } : {}}
            onClick={() => !isLocked && onUnitSelect(unit)}
            className={`
              relative w-20 h-20 rounded-full flex items-center justify-center border-b-4 transition-colors
              ${isCompleted 
                ? 'bg-recovery-green text-white border-green-700' 
                : isLocked 
                  ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' 
                  : 'bg-brand-500 text-white border-brand-700 shadow-lg animate-pulse-slow'
              }
            `}
          >
            {/* Icon based on Type */}
            {isLocked ? (
              <Lock size={24} />
            ) : isCompleted ? (
              <Check size={32} strokeWidth={3} />
            ) : (
              <>
                {unit.type === 'quiz' && <Star size={28} fill="currentColor" />}
                {unit.type === 'roleplay' && <MessageCircle size={28} />}
                {unit.type === 'learning' && <BookOpen size={28} />}
              </>
            )}

            {/* Label Tooltip */}
            <div className={`absolute -bottom-8 whitespace-nowrap text-xs font-bold px-2 py-1 rounded bg-white shadow-sm text-slate-700
              ${isLocked ? 'opacity-50' : 'opacity-100'}
            `}>
              {unit.title}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
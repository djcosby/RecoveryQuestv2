import React, { useEffect, useState } from 'react';
import { LibraryResource } from '../types';
import { db } from '../services/mockDb';
import { Search, Book } from 'lucide-react';

export const GreatLibrary: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  useEffect(() => {
    db.getAllLibraryResources().then(setResources);
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">The Great Library</h2>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search the texts..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
        {/* List */}
        <div className={`md:w-1/3 overflow-y-auto space-y-2 ${selectedResource ? 'hidden md:block' : 'block'}`}>
          {resources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResource(res)}
              className={`w-full text-left p-4 rounded-xl border transition-all
                ${selectedResource?.id === res.id 
                  ? 'bg-brand-50 border-brand-500 shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-brand-300'}
              `}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                  <Book size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{res.title}</h4>
                  <p className="text-xs text-slate-500">{res.author}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Reader */}
        <div className={`flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${selectedResource ? 'block' : 'hidden md:flex'}`}>
          {selectedResource ? (
            <>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg">{selectedResource.title}</h3>
                <button 
                  onClick={() => setSelectedResource(null)} 
                  className="md:hidden text-sm text-brand-600"
                >
                  Back
                </button>
              </div>
              <div className="p-6 overflow-y-auto prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                  {selectedResource.content}
                </p>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Book size={48} className="mb-4 opacity-50" />
              <p>Select a text to begin reading.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
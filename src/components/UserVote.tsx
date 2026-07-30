import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Config } from '../types';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function UserVote() {
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Generate or retrieve local userId
  const userId = useMemo(() => {
    let id = localStorage.getItem('poll_user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('poll_user_id', id);
    }
    return id;
  }, []);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig({ id: docSnap.id, ...docSnap.data() } as Config);
      } else {
        setConfig(null);
      }
      setLoading(false);
    });

    return () => unsubConfig();
  }, []);

  useEffect(() => {
    // Read the user's vote directly by document ID
    const fetchMyVote = async () => {
      try {
        const voteDoc = await getDoc(doc(db, 'votes', `vote_${userId}`));
        if (voteDoc.exists()) {
          const data = voteDoc.data();
          if (data.optionIds) {
            setSelectedOptions(data.optionIds);
            setHasVoted(true);
          } else if (data.optionId) {
            setSelectedOptions([data.optionId]);
            setHasVoted(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch vote', e);
      }
    };
    fetchMyVote();
  }, [userId]);

  const toggleOption = (id: string) => {
    if (submitting || hasVoted || (config?.endTime && Date.now() > config.endTime)) return;
    
    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter(o => o !== id));
    } else {
      if (selectedOptions.length < 3) {
        setSelectedOptions([...selectedOptions, id]);
      }
    }
  };

  const handleVote = async () => {
    if (!config?.isActive || submitting || hasVoted) return;
    if (selectedOptions.length < 3) return;
    
    setSubmitting(true);
    
    try {
      await setDoc(doc(db, 'votes', `vote_${userId}`), {
        optionIds: selectedOptions,
        userId,
        timestamp: Date.now()
      });
      setHasVoted(true);
    } catch (e) {
      console.error(e);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-slate-400 w-8 h-8" />
      </div>
    );
  }

  if (!config || !config.isActive) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 5deg, white 5deg 10deg)' }}></div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-red-600 max-w-sm w-full relative z-10">
          <h1 className="text-2xl font-black text-red-700 mb-2">Matsuri Break</h1>
          <p className="text-sm text-slate-600 font-medium">There is no active poll at the moment. Please wait for the admin to start one.</p>
        </motion.div>
      </div>
    );
  }

  const isExpired = config.endTime && Date.now() > config.endTime;

  return (
    <div className="flex flex-col min-h-screen p-6 md:p-12 items-center justify-center bg-gradient-to-b from-sky-400 via-blue-500 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 5deg, white 5deg 10deg)' }}></div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[360px] bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-4 border-red-600 relative z-10 flex flex-col"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-200">
            {isExpired ? 'CLOSED' : 'LIVE NOW'}
          </span>
          {config.endTime && !isExpired && (
            <span className="text-[10px] text-slate-500 font-medium bg-white/50 px-2 py-1 rounded-full">Ends soon</span>
          )}
        </div>
        
        <h2 className="mt-2 text-2xl font-black text-slate-900 leading-tight">
          {config.question}
        </h2>
        <p className="text-sm text-slate-600 mt-2 font-medium">Select 3 options you like best.</p>

        <div className="mt-8 space-y-3">
          {config.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const isMaxReached = selectedOptions.length >= 3;
            const isDisabled = submitting || isExpired || hasVoted || (isMaxReached && !isSelected);
            
            return (
              <button
                key={option.id}
                disabled={isDisabled}
                onClick={() => toggleOption(option.id)}
                className={`w-full p-4 rounded-xl border-2 flex items-center justify-between outline-none transition-all duration-300
                  ${isSelected 
                    ? 'border-red-600 bg-red-50 shadow-md shadow-red-100' 
                    : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                  }
                  ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className={`font-bold ${isSelected ? 'text-red-700' : 'text-slate-700'}`}>
                  {option.text}
                </span>
                {isSelected ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <button 
            disabled={hasVoted || isExpired || selectedOptions.length !== 3 || submitting} 
            onClick={handleVote}
            className={`w-full py-4 bg-gradient-to-r font-black text-lg rounded-xl shadow-lg uppercase tracking-wider transition-all
              ${hasVoted 
                ? 'from-green-400 to-emerald-500 text-white shadow-green-500/30'
                : selectedOptions.length === 3
                  ? 'from-amber-400 to-amber-500 text-red-950 shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400'
                  : 'from-slate-200 to-slate-300 text-slate-500 shadow-none cursor-not-allowed'}
            `}
          >
            {hasVoted ? 'Vote Recorded' : (isExpired ? 'Voting Closed' : (submitting ? 'Submitting...' : `Vote (${selectedOptions.length}/3)`))}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

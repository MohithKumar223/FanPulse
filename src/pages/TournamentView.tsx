import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tournament, Match, Prediction } from '../types';
import { Trophy, Calendar, MapPin, Search, ChevronRight, Zap, Brain, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { formatDateTime, cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

const TournamentView = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // Fetch Tournament
        const tDoc = await getDoc(doc(db, 'tournaments', id));
        if (tDoc.exists()) {
          setTournament({ id: tDoc.id, ...tDoc.data() } as Tournament);
        } else {
          // ... (demo data)
          if (id === 'pl-2024') {
            setTournament({
              id: 'pl-2024',
              name: 'Premier League 2024/25',
              description: 'The most watched football league in the world.',
              sport: 'Football',
              status: 'active',
              startDate: '2024-08-16T00:00:00Z',
              endDate: '2025-05-25T00:00:00Z',
              bannerImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
            });
          }
        }

        // Fetch Matches
        const mQ = query(collection(db, 'tournaments', id, 'matches'));
        const mSnapshot = await getDocs(mQ);
        const mData = mSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Match[];
        
        if (mData.length === 0 && id === 'pl-2024') {
          // Seed mock matches
          setMatches([
            {
              id: 'm1',
              tournamentId: id,
              teamA: 'Arsenal',
              teamB: 'Manchester City',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              status: 'scheduled',
            },
            {
              id: 'm2',
              tournamentId: id,
              teamA: 'Liverpool',
              teamB: 'Chelsea',
              startTime: new Date(Date.now() + 172800000).toISOString(),
              status: 'scheduled',
            },
            {
              id: 'm3',
              tournamentId: id,
              teamA: 'Manchester United',
              teamB: 'Tottenham',
              startTime: new Date(Date.now() - 3600000).toISOString(),
              status: 'ongoing',
              scoreA: 1,
              scoreB: 1
            }
          ]);
        } else {
          setMatches(mData);
        }

        // Fetch User Predictions
        if (user) {
          const pQ = query(collection(db, 'users', user.uid, 'predictions'), where('matchId', 'in', mData.map(m => m.id).concat(['m1', 'm2', 'm3'])));
          const pSnapshot = await getDocs(pQ);
          const pData: Record<string, Prediction> = {};
          pSnapshot.docs.forEach(doc => {
            const pred = doc.data() as Prediction;
            pData[pred.matchId] = pred;
          });
          setUserPredictions(pData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `tournaments/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handlePredict = async (matchId: string, team: string) => {
    if (!user || !profile) return;
    
    try {
      const predictionId = `${user.uid}_${matchId}`;
      const predictionRef = doc(db, 'users', user.uid, 'predictions', predictionId);
      
      const newPrediction: Prediction = {
        id: predictionId,
        userId: user.uid,
        matchId,
        predictedWinner: team,
        status: 'pending',
        pointsEarned: 0,
        createdAt: new Date().toISOString(),
      };

      await setDoc(predictionRef, newPrediction);
      setUserPredictions(prev => ({ ...prev, [matchId]: newPrediction }));
      
      // Update user stats
      await updateDoc(doc(db, 'users', user.uid), {
        predictionsCount: increment(1)
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/predictions`);
    }
  };

  const getAIAnalysis = async (match: Match) => {
    if (analysisLoading === match.id) return;
    setAnalysisLoading(match.id);
    const analysis = await geminiService.getMatchAnalysis(match.teamA, match.teamB, tournament?.sport || 'sport');
    
    // Ideally update match doc with analysis
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, aiAnalysis: analysis } : m));
    setAnalysisLoading(null);
  };

  if (loading || !tournament) return <div className="p-8 text-center text-gray-500">Loading Arena...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Tournament Header */}
      <div className="relative h-48 rounded-3xl overflow-hidden border border-white/10">
        <img src={tournament.bannerImage} alt="" className="w-full h-full object-cover opacity-50 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 p-8 space-y-1">
          <Link to="/" className="text-orange-500 font-mono text-[10px] font-bold uppercase tracking-widest hover:underline mb-2 block">
            ← Back to tournaments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          <p className="text-gray-400 text-sm max-w-xl">{tournament.description}</p>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Upcoming Battles
          <span className="text-white/20 font-mono text-sm">(Season 1)</span>
        </h2>
        
        <div className="space-y-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                {/* Team A */}
                <button
                  onClick={() => match.status === 'scheduled' && handlePredict(match.id, match.teamA)}
                  disabled={match.status !== 'scheduled'}
                  className={cn(
                    "flex-1 w-full text-center space-y-4 p-4 rounded-2xl transition-all border outline-none",
                    userPredictions[match.id]?.predictedWinner === match.teamA 
                      ? "bg-orange-500/10 border-orange-500 scale-[1.02]" 
                      : "bg-black/20 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-full mx-auto flex items-center justify-center font-bold text-lg">
                    {match.teamA.charAt(0)}
                  </div>
                  <h3 className="font-bold text-lg uppercase tracking-tight">{match.teamA}</h3>
                  {userPredictions[match.id]?.predictedWinner === match.teamA && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-1 text-orange-500">
                      <CheckCircle2 className="w-4 h-4 fill-orange-500 text-black" />
                      <span className="text-[10px] font-black uppercase">Your Pick</span>
                    </motion.div>
                  )}
                </button>

                {/* Match Meta */}
                <div className="text-center space-y-2 min-w-[120px]">
                  <div className="px-3 py-1 bg-white/10 rounded-full inline-block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {match.status === 'scheduled' ? formatDateTime(match.startTime) : match.status}
                    </span>
                  </div>
                  <div className="text-4xl font-black italic tracking-tighter text-white/10">VS</div>
                  {match.status === 'ongoing' && (
                    <div className="text-2xl font-mono font-bold text-orange-500">
                      {match.scoreA} : {match.scoreB}
                    </div>
                  )}
                </div>

                {/* Team B */}
                <button
                  onClick={() => match.status === 'scheduled' && handlePredict(match.id, match.teamB)}
                  disabled={match.status !== 'scheduled'}
                  className={cn(
                    "flex-1 w-full text-center space-y-4 p-4 rounded-2xl transition-all border outline-none",
                    userPredictions[match.id]?.predictedWinner === match.teamB 
                      ? "bg-orange-500/10 border-orange-500 scale-[1.02]" 
                      : "bg-black/20 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="w-16 h-16 bg-white/10 rounded-full mx-auto flex items-center justify-center font-bold text-lg">
                    {match.teamB.charAt(0)}
                  </div>
                  <h3 className="font-bold text-lg uppercase tracking-tight">{match.teamB}</h3>
                  {userPredictions[match.id]?.predictedWinner === match.teamB && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-1 text-orange-500">
                      <CheckCircle2 className="w-4 h-4 fill-orange-500 text-black" />
                      <span className="text-[10px] font-black uppercase">Your Pick</span>
                    </motion.div>
                  )}
                </button>
              </div>

              {/* AI Insight Box */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 relative group">
                {match.aiAnalysis ? (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">AI Prediction Insight</p>
                      <p className="text-gray-300 text-sm leading-relaxed italic">"{match.aiAnalysis}"</p>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => getAIAnalysis(match)}
                    className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors py-2 text-xs font-bold uppercase tracking-widest"
                  >
                    {analysisLoading === match.id ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Brain className="w-4 h-4" /></motion.div>
                    ) : <Brain className="w-4 h-4" />}
                    {analysisLoading === match.id ? 'Analyzing Tactics...' : 'Generate AI Match Insight'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentView;

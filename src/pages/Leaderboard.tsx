import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Trophy, Medal, Crown, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../App';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

const Leaderboard = () => {
  const { profile: currentProfile } = useAuth();
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('totalPoints', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as UserProfile);
        
        if (data.length === 0) {
          // ... (mock data)
          setLeaders([
            { userId: '1', displayName: 'Alex "The Oracle" Chen', photoURL: '', totalPoints: 12450, currentStreak: 5, maxStreak: 12, level: 14, predictionsCount: 89, correctPredictions: 64, experience: 0, lastActive: '' },
            { userId: '2', displayName: 'Sarah Strike', photoURL: '', totalPoints: 11200, currentStreak: 3, maxStreak: 8, level: 12, predictionsCount: 75, correctPredictions: 50, experience: 0, lastActive: '' },
            { userId: '3', displayName: 'FootballFanatic', photoURL: '', totalPoints: 9800, currentStreak: 8, maxStreak: 8, level: 10, predictionsCount: 60, correctPredictions: 42, experience: 0, lastActive: '' },
            { userId: '4', displayName: 'PredictorPro', photoURL: '', totalPoints: 8500, currentStreak: 0, maxStreak: 15, level: 15, predictionsCount: 120, correctPredictions: 80, experience: 0, lastActive: '' },
            { userId: '5', displayName: 'GoalSeeker', photoURL: '', totalPoints: 7200, currentStreak: 1, maxStreak: 4, level: 8, predictionsCount: 40, correctPredictions: 25, experience: 0, lastActive: '' },
          ].sort((a, b) => b.totalPoints - a.totalPoints));
        } else {
          setLeaders(data);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Global Arena</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Top Predictors of Season 1</p>
        </div>
        <div className="bg-orange-500 h-1 md:flex-1 md:mx-12 mb-2 rounded-full hidden md:block" />
        <div className="flex items-center gap-2 text-orange-500 font-bold">
          <TrendingUp className="w-5 h-5" />
          <span className="text-2xl font-mono">LIVE</span>
        </div>
      </div>

      <div className="space-y-3">
        {leaders.map((leader, index) => {
          const isTop3 = index < 3;
          const isMe = currentProfile?.userId === leader.userId;

          return (
            <motion.div
              key={leader.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group relative bg-white/5 border rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-white/10",
                isMe ? "border-orange-500 shadow-[0_0_20px_rgba(255,99,33,0.1)]" : "border-white/5",
                isTop3 && "md:p-6"
              )}
            >
              <div className="flex items-center gap-4 md:gap-8">
                <div className="w-8 flex items-center justify-center">
                  {index === 0 ? <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" /> :
                   index === 1 ? <Medal className="w-5 h-5 text-gray-300 fill-gray-300" /> :
                   index === 2 ? <Medal className="w-5 h-5 text-orange-800 fill-orange-800" /> :
                   <span className="font-mono text-gray-500 font-bold">{index + 1}</span>}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${leader.displayName}`} alt="" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-lg group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                      {leader.displayName}
                      {isMe && <span className="ml-2 text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-black">YOU</span>}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 tracking-wider">
                      <span>LVL {leader.level}</span>
                      <span>•</span>
                      <span>{leader.correctPredictions} WINS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <p className="text-lg md:text-2xl font-black font-mono tracking-tighter">
                  {leader.totalPoints.toLocaleString()}
                </p>
                <div className="flex items-center justify-end gap-1 text-orange-500 text-[10px] font-bold uppercase">
                  <Zap className="w-3 h-3 fill-orange-500" />
                  {leader.currentStreak}x STREAK
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Leaderboard;

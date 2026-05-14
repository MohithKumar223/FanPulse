import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Achievement, Prediction } from '../types';
import { Trophy, Award, Zap, History, Settings, LogOut, LayoutGrid, Brain } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';

import { handleFirestoreError, OperationType } from '../lib/error-handler';

const Profile = () => {
  const { user, profile, logout } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [rewardMsg, setRewardMsg] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Achievements
        const aQ = query(collection(db, 'users', user.uid, 'achievements'), limit(10));
        const aSnapshot = await getDocs(aQ);
        const aData = aSnapshot.docs.map(doc => doc.data() as Achievement);
        
        // ... (demo data)
        if (aData.length === 0) {
          setAchievements([
            { id: '1', userId: user.uid, title: 'First Steps', description: 'Make your first prediction', type: 'beginner', unlockedAt: new Date().toISOString(), badgeIcon: 'Trophy' },
            { id: '2', userId: user.uid, title: 'Oracle Apprentice', description: 'Correct prediction on a Major match', type: 'specialist', unlockedAt: new Date().toISOString(), badgeIcon: 'Brain' }
          ]);
        } else {
          setAchievements(aData);
        }

        // Recent Predictions
        const pQ = query(collection(db, 'users', user.uid, 'predictions'), orderBy('createdAt', 'desc'), limit(5));
        const pSnapshot = await getDocs(pQ);
        setRecentPredictions(pSnapshot.docs.map(doc => doc.data() as Prediction));

        // Get AI Praise
        if (profile) {
          setLoadingMsg(true);
          const msg = await geminiService.getPersonalizedRewardMessage(profile.displayName, profile.currentStreak, profile.totalPoints);
          setRewardMsg(msg);
          setLoadingMsg(false);
        }

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}`);
      }
    };

    fetchData();
  }, [user, profile?.userId]);

  if (!user || !profile) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-20 h-20 bg-white/5 rounded-full mx-auto flex items-center justify-center">
          <Award className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-xl font-bold">Join the Pulse</h2>
        <p className="text-gray-400">Sign in to track your progression and earn rewards.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-48 h-48 rotate-12" />
        </div>

        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-2 border-orange-500 shadow-[0_0_30px_rgba(255,99,33,0.3)]">
            <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-orange-500 text-lg">
            {profile.level}
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{profile.displayName}</h1>
            <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded inline-block">
              Pulse Member since 2024
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
              <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="font-mono font-bold text-orange-500">{profile.currentStreak}x STREAK</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
              <History className="w-4 h-4 text-gray-400" />
              <span className="font-mono font-bold">{profile.predictionsCount} PREDICTIONS</span>
            </div>
          </div>

          {/* AI Reward Message */}
          <div className="bg-orange-500 text-black p-4 rounded-2xl relative">
            <div className="absolute -top-3 left-4 bg-black text-orange-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
              Personalized Reward Insight
            </div>
            {loadingMsg ? (
              <p className="animate-pulse font-mono text-sm font-bold uppercase tracking-tighter">Syncing Mastery Data...</p>
            ) : (
              <p className="font-bold leading-tight">{rewardMsg || "Keep making predictions to unlock personalized mastery insights!"}</p>
            )}
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2">
           <button onClick={() => logout()} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-orange-500 hover:text-black transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Achievements */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            Milestone Vault
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center space-y-3 group hover:border-orange-500/50 transition-colors">
                <div className="w-12 h-12 bg-black rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  {achievement.badgeIcon === 'Trophy' ? <Trophy className="text-orange-500 w-6 h-6" /> : <Brain className="text-blue-500 w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-tighter text-sm">{achievement.title}</h3>
                  <p className="text-gray-500 text-[10px] uppercase leading-tight mt-1">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prediction History */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-orange-500" />
            Battle Logs
          </h2>
          <div className="space-y-3">
            {recentPredictions.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center text-gray-500 italic">No logs yet...</div>
            ) : (
              recentPredictions.map((pred) => (
                <div key={pred.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      pred.status === 'correct' ? "bg-green-500" : pred.status === 'incorrect' ? "bg-red-500" : "bg-yellow-500"
                    )} />
                    <span className="font-bold text-sm tracking-tight capitalize">{pred.predictedWinner} Pick</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{pred.status}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default Profile;

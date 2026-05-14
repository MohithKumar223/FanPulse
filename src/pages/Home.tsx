import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tournament } from '../types';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, ChevronRight, Zap, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

const Home = () => {
  const { profile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const q = query(collection(db, 'tournaments'), limit(10));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tournament[];
        
        // ... (rest of the data handling)
        if (data.length === 0) {
          setTournaments([
            {
              id: 'pl-2024',
              name: 'Premier League 2024/25',
              description: 'The most watched football league in the world.',
              sport: 'Football',
              status: 'active',
              startDate: '2024-08-16T00:00:00Z',
              endDate: '2025-05-25T00:00:00Z',
              bannerImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
            },
            {
              id: 'wc-2026-qual',
              name: 'World Cup 2026 Qualifiers',
              description: 'The road to North America 2026 begins.',
              sport: 'Football',
              status: 'active',
              startDate: '2024-03-01T00:00:00Z',
              endDate: '2025-11-01T00:00:00Z',
              bannerImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
            }
          ]);
        } else {
          setTournaments(data);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero Stats Section */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Points</p>
            <p className="text-2xl font-bold font-mono">{profile.totalPoints}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl relative overflow-hidden group">
            <Zap className="absolute -right-4 -bottom-4 w-16 h-16 text-orange-500/20 group-hover:scale-110 transition-transform" />
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Current Streak</p>
            <p className="text-2xl font-bold font-mono text-orange-500">{profile.currentStreak}x</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Level</p>
            <p className="text-2xl font-bold font-mono">Lvl {profile.level}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Win Rate</p>
            <p className="text-2xl font-bold font-mono">
              {profile.predictionsCount > 0 
                ? Math.round((profile.correctPredictions / profile.predictionsCount) * 100) 
                : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Featured Tournaments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Active Tournaments</h2>
          <div className="h-px flex-1 mx-4 bg-white/10 hidden md:block" />
          <p className="text-orange-500 font-mono text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            {tournaments.length} Season Live
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/tournament/${tournament.id}`}
              className="group relative h-64 rounded-3xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-colors"
            >
              <img
                src={tournament.bannerImage}
                alt={tournament.name}
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 opacity-60 group-hover:opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 p-6 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded uppercase">
                    {tournament.sport}
                  </span>
                  <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded uppercase">
                    {tournament.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold leading-tight">{tournament.name}</h3>
                <p className="text-gray-300 text-xs line-clamp-2 max-w-sm">
                  {tournament.description}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-bold font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      AUG - MAY
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      14.2K FANS
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Rewards Teaser */}
      <section className="bg-orange-500 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 text-black">
        <div className="p-4 bg-black rounded-2xl">
          <Award className="w-12 h-12 text-orange-500" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h3 className="text-2xl font-bold leading-none tracking-tight">Unlock AI-Driven Mastery Badges</h3>
          <p className="text-black/80 font-medium">Earn personalized rewards based on your prediction style and historic performance.</p>
        </div>
        <button className="bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
          VIEW MILESTONES
        </button>
      </section>
    </motion.div>
  );
};

export default Home;

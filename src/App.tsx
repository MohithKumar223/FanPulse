import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Trophy, Zap, User as UserIcon, LogIn, LayoutDashboard, Flag, Award, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from './types';
import { cn } from './lib/utils';
import { testFirestoreConnection } from './lib/db-check';
import { handleFirestoreError, OperationType } from './lib/error-handler';

// Pages
import Home from './pages/Home';
import TournamentView from './pages/TournamentView';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

// Auth Content
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              userId: user.uid,
              displayName: user.displayName || 'Anonymous Fan',
              photoURL: user.photoURL || '',
              totalPoints: 0,
              currentStreak: 0,
              maxStreak: 0,
              level: 1,
              experience: 0,
              predictionsCount: 0,
              correctPredictions: 0,
              lastActive: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userDoc.data() as UserProfile);
            // Subscribe to profile changes
            onSnapshot(userRef, (doc) => {
              if (doc.exists()) setProfile(doc.data() as UserProfile);
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [authInProgress, setAuthInProgress] = useState(false);

  const signIn = async () => {
    if (authInProgress) return;
    setAuthInProgress(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this site to sign in.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore cancelled popups
      } else {
        console.error('Sign in error:', error);
      }
    } finally {
      setAuthInProgress(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navbar
const Navbar = () => {
  const { user, profile, signIn, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/leaderboard', label: 'Leaderboard', icon: Flag },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-3 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="hidden md:flex items-center gap-2 group">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FanPulse</span>
        </Link>

        <div className="flex items-center gap-8 w-full md:w-auto justify-around md:justify-end">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors",
                location.pathname === item.path ? "text-orange-500" : "text-gray-400 hover:text-white"
              )}
            >
              <item.icon className="w-6 h-6 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-4 ml-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-white text-xs font-bold leading-none">{profile?.totalPoints} PTS</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
                  <span className="text-orange-500 text-[10px] font-bold uppercase">{profile?.currentStreak} Streak</span>
                </div>
              </div>
              <button 
                onClick={() => logout()}
                className="w-10 h-10 rounded-full border border-white/20 overflow-hidden hover:border-orange-500 transition-colors"
              >
                <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>JOIN NOW</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Trophy className="w-12 h-12 text-orange-500" />
        </motion.div>
        <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">Initializing FanPulse Arena...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500 selection:text-white pb-24 md:pb-0 md:pt-20">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournament/:id" element={<TournamentView />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

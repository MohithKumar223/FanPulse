export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  currentStreak: number;
  maxStreak: number;
  level: number;
  experience: number;
  predictionsCount: number;
  correctPredictions: number;
  lastActive: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  sport: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  bannerImage: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  teamA: string;
  teamB: string;
  startTime: string;
  status: 'scheduled' | 'ongoing' | 'finished' | 'cancelled';
  winner?: string;
  scoreA?: number;
  scoreB?: number;
  aiAnalysis?: string;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedWinner: string;
  status: 'pending' | 'correct' | 'incorrect';
  pointsEarned: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: string;
  unlockedAt: string;
  badgeIcon: string;
}

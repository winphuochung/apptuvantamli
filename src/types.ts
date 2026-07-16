/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StudentProfile {
  nickname: string;
  grade: '6' | '7' | '8' | '9';
  favoriteSubjects: string[];
  interests: string[];
  previousIssues: string[];
}

export interface MoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  note: string;
  score: number; // 1 to 5 (1: Rất tệ, 5: Rất tuyệt)
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface EarlyWarningAlert {
  id: string;
  timestamp: string;
  grade: '6' | '7' | '8' | '9';
  nickname: string;
  issueCategory: 'Học tập' | 'Bạn bè' | 'Gia đình' | 'Cảm xúc cá nhân' | 'Định hướng bản thân';
  riskLevel: 1 | 2 | 3;
  detectedReason: string;
  status: 'pending' | 'supporting' | 'resolved';
  notes: string;
  chatSummary?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: {
    text: string;
    score: number; // For assessing stress, EQ, etc.
  }[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, Send, Sparkles, User, Smile, BookOpen, AlertTriangle, 
  HelpCircle, CheckCircle2, ChevronRight, Activity, Calendar, 
  PhoneCall, Shield, Check, Info, FileText, MessageCircle, GraduationCap, Target
} from "lucide-react";
import BreathingExercise from "./BreathingExercise";
import { StudentProfile, MoodLog, ChatMessage } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface StudentPanelProps {
  studentId: string;
}

// Predefined lists for customization
const GRADE_OPTIONS = ["6", "7", "8", "9"] as const;

const SUBJECT_OPTIONS = [
  "Toán học", "Ngữ văn", "Tiếng Anh", "Vật lý", "Hóa học", 
  "Sinh học", "Lịch sử", "Địa lý", "Tin học", "Mỹ thuật", "Âm nhạc"
];

const INTEREST_OPTIONS = [
  "Đọc sách", "Vẽ tranh", "Chơi nhạc cụ", "Bóng đá", "Bóng rổ", 
  "Chơi game", "Viết lách", "Nấu ăn", "Xếp hình lego", "Nuôi thú cưng"
];

const ISSUE_OPTIONS = [
  "Áp lực điểm số", "Mất động lực học tập", "Sợ thi cử", 
  "Bị cô lập/tẩy chay", "Mâu thuẫn bạn bè", "Áp lực từ cha mẹ", 
  "Thiếu sự chia sẻ từ gia đình", "Lo âu/Căng thẳng", "Mất định hướng bản thân"
];

const EMOJIS = [
  { emoji: "🌟", label: "Rất Tuyệt", score: 5, bg: "bg-amber-100 text-amber-700 border-amber-300" },
  { emoji: "😊", label: "Vui Vẻ", score: 4, bg: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { emoji: "😐", label: "Bình Thường", score: 3, bg: "bg-blue-100 text-blue-700 border-blue-300" },
  { emoji: "😔", label: "Buồn Bã", score: 2, bg: "bg-violet-100 text-violet-700 border-violet-300" },
  { emoji: "😰", label: "Lo Âu", score: 2, bg: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  { emoji: "😠", label: "Tức Giận", score: 2, bg: "bg-rose-100 text-rose-700 border-rose-300" },
  { emoji: "😢", label: "Đau Lòng", score: 1, bg: "bg-red-100 text-red-700 border-red-300" }
];

// Interactive Stress Quiz questions
const STRESS_QUIZ = {
  title: "Đánh giá mức độ áp lực học tập",
  description: "Bộ câu hỏi ngắn giúp bạn tự kiểm tra xem mức độ căng thẳng của mình hiện tại đang ở ngưỡng nào nhé.",
  questions: [
    {
      id: "q1",
      text: "Bạn có thường xuyên cảm thấy đau đầu, mệt mỏi hoặc mất ngủ khi nghĩ về bài vở không?",
      options: [
        { text: "Rất hiếm khi xảy ra", score: 1 },
        { text: "Thỉnh thoảng mới bị", score: 2 },
        { text: "Thường xuyên xảy ra gần đây", score: 4 },
        { text: "Luôn luôn bị, hầu như mỗi ngày", score: 5 }
      ]
    },
    {
      id: "q2",
      text: "Khi nhận được điểm kiểm tra không như ý, phản ứng của bạn thế nào?",
      options: [
        { text: "Hơi buồn chút thôi, mình sẽ cố gắng lần sau", score: 1 },
        { text: "Khá lo lắng, nhưng tự giải tỏa được", score: 2 },
        { text: "Cực kỳ căng thẳng, khóc hoặc dằn vặt bản thân cả ngày", score: 4 },
        { text: "Sợ hãi tột độ, sợ phải đối diện với ba mẹ và thầy cô", score: 5 }
      ]
    },
    {
      id: "q3",
      text: "Bạn dành bao nhiêu thời gian rảnh rỗi trong tuần cho sở thích cá nhân?",
      options: [
        { text: "Rất nhiều, mình luôn cân bằng được", score: 1 },
        { text: "Vẫn có vài tiếng cuối tuần", score: 2 },
        { text: "Hầu như không có, lúc nào cũng ngập đầu trong bài tập", score: 4 },
        { text: "Hoàn toàn không có, ngay cả ăn ngủ cũng lo học", score: 5 }
      ]
    },
    {
      id: "q4",
      text: "Bạn có cảm thấy lo sợ và tim đập nhanh mỗi khi bước vào phòng thi không?",
      options: [
        { text: "Không, mình khá tự tin", score: 1 },
        { text: "Hơi hồi hộp một chút lúc đầu thôi", score: 2 },
        { text: "Rất run, đôi khi quên hết kiến thức đã học", score: 4 },
        { text: "Hoảng loạn, đổ mồ hôi tay, nghẹt thở không làm được bài", score: 5 }
      ]
    },
    {
      id: "q5",
      text: "Bạn có cảm giác không ai xung quanh (ba mẹ, bạn bè) thấu hiểu được áp lực bạn đang gánh?",
      options: [
        { text: "Mọi người đều lắng nghe và ủng hộ mình", score: 1 },
        { text: "Thỉnh thoảng mình thấy hơi cô độc", score: 2 },
        { text: "Thường thấy cô đơn, không dám kể với ai", score: 4 },
        { text: "Hoàn toàn cô lập, cảm thấy bế tắc không lối thoát", score: 5 }
      ]
    }
  ]
};

// Reading resources / CBT mental health exercises
const MENTAL_ARTICLES = [
  {
    id: "art-1",
    title: "Bí kíp hít thở 4-7-8 điều hòa cơn lo âu",
    category: "Bài tập thở",
    summary: "Một phương pháp cực kỳ đơn giản giúp xoa dịu hệ thần kinh trong vòng 2 phút khi bạn cảm thấy tim đập nhanh hoặc quá hoảng loạn.",
    steps: [
      "Tìm một tư thế ngồi thật thoải mái, thẳng lưng.",
      "Hít vào bằng mũi thật nhẹ nhàng trong vòng 4 giây.",
      "Giữ hơi thở lại trong lồng ngực đúng 7 giây.",
      "Thở ra từ từ bằng miệng, phát ra âm thanh nhẹ nhàng trong 8 giây.",
      "Lặp lại chu kỳ này 4 lần. Bạn sẽ thấy lồng ngực nhẹ nhõm và đầu óc bình tĩnh lại ngay lập tức."
    ]
  },
  {
    id: "art-2",
    title: "Bí kíp giải tỏa tâm lý lo sợ phòng thi",
    category: "Kỹ năng học tập",
    summary: "Nỗi sợ phòng thi là rất bình thường. Hãy học cách chuyển hóa nỗi sợ thành sự tập trung để chinh phục đề thi.",
    steps: [
      "Chuẩn bị kỹ lưỡng: Ôn tập sớm, không học dồn vào đêm cuối trước ngày thi.",
      "Đóng sách lại trước giờ thi 30 phút: Đi dạo nhẹ nhàng hoặc trò chuyện vui vẻ với bạn bè.",
      "Khi nhận đề thi: Không vội làm ngay, hãy dành 1-2 phút đọc lướt qua toàn bộ đề, đánh dấu các câu dễ làm trước.",
      "Tự nhủ thầm: 'Mình đã cố gắng hết sức ôn tập, mình hoàn toàn làm được bài này.'",
      "Nếu gặp câu khó: Đừng hoảng, hãy bỏ qua làm câu khác trước, quay lại giải quyết sau cùng."
    ]
  },
  {
    id: "art-3",
    title: "Làm thế nào khi cãi vã, mâu thuẫn với ba mẹ?",
    category: "Quan hệ gia đình",
    summary: "Khoảng cách thế hệ đôi khi khiến tiếng nói của chúng mình và ba mẹ bị lệch nhịp. Hãy thử giải quyết bằng giao tiếp phi bạo lực.",
    steps: [
      "Giữ bình tĩnh: Khi cả hai bên đang nóng giận, tuyệt đối không nói lời chống đối hay đóng sầm cửa. Hãy xin phép: 'Con hơi bối rối, con xin phép trả lời mẹ sau ạ.'",
      "Viết thư hoặc nhắn tin: Nếu nói chuyện trực tiếp quá khó, hãy viết ra những suy nghĩ của bạn một cách chân thành.",
      "Công thức chia sẻ NVC: Trình bày sự việc khách quan -> Nói lên cảm xúc của bạn -> Chia sẻ mong muốn của bạn. (Ví dụ: 'Mẹ ơi, khi mẹ mắng con lười trước mặt cô dì, con thấy rất tủi thân và buồn. Con mong mẹ sẽ góp ý riêng với con ạ.')",
      "Lắng nghe góc nhìn của ba mẹ: Ba mẹ cũng từng là trẻ con nhưng có thể họ đã quên mất, hoặc lo lắng cho bạn theo cách vụng về."
    ]
  }
];

export default function StudentPanel({ studentId }: StudentPanelProps) {
  // Navigation tabs: 'home' | 'chat' | 'mood' | 'toolkit' | 'sos'
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'mood' | 'toolkit' | 'sos'>('home');
  
  // Student Profile state
  const [profile, setProfile] = useState<StudentProfile>({
    nickname: "",
    grade: "7",
    favoriteSubjects: [],
    interests: [],
    previousIssues: []
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mood Tracker state
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<typeof EMOJIS[0] | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [moodSaved, setMoodSaved] = useState(false);

  // SOS state
  const [sosCategory, setSosCategory] = useState<'Học tập' | 'Bạn bè' | 'Gia đình' | 'Cảm xúc cá nhân' | 'Định hướng bản thân'>('Cảm xúc cá nhân');
  const [sosMessage, setSosMessage] = useState("");
  const [sosSent, setSosSent] = useState(false);

  // Interactive Quiz state
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Fetch initial profile & history on mount
  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoadingProfile(true);
        const profileRes = await fetch(`/api/student/profile/${studentId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setProfileSaved(true);
        } else {
          // If profile does not exist yet, we keep empty state so they can fill it
          setProfileSaved(false);
        }

        const chatsRes = await fetch(`/api/student/chats/${studentId}`);
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json();
          setMessages(chatsData);
        }

        const moodsRes = await fetch(`/api/student/moods/${studentId}`);
        if (moodsRes.ok) {
          const moodsData = await moodsRes.json();
          setMoodHistory(moodsData);
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadStudentData();
  }, [studentId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle saving Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.nickname.trim()) {
      alert("Vui lòng nhập biệt danh của bạn!");
      return;
    }
    if (!profile.grade) {
      alert("Vui lòng chọn khối lớp học!");
      return;
    }

    try {
      const res = await fetch(`/api/student/profile/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setProfileSaved(true);
        // Show floating message or switch tab
        setActiveTab('chat');
      } else {
        alert("Đã có lỗi xảy ra. Vui lòng tải lại trang và thử lại!");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Lỗi kết nối mạng, không thể lưu cấu hình.");
    }
  };

  // Profile array toggles
  const toggleSubject = (subj: string) => {
    setProfile(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subj)
        ? prev.favoriteSubjects.filter(s => s !== subj)
        : [...prev.favoriteSubjects, subj]
    }));
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleIssue = (issue: string) => {
    setProfile(prev => ({
      ...prev,
      previousIssues: prev.previousIssues.includes(issue)
        ? prev.previousIssues.filter(i => i !== issue)
        : [...prev.previousIssues, issue]
    }));
  };

  // Handle Sending Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendingChat) return;

    const userText = inputText;
    setInputText("");
    
    // Optimistic user update
    const userMsg: ChatMessage = {
      id: `msg-opt-${Date.now()}-user`,
      sender: "user",
      text: userText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setSendingChat(true);

    try {
      const geminiApiKey = localStorage.getItem("gemini_api_key") || "";
      const geminiModel = localStorage.getItem("gemini_model") || "gemini-3-pro-preview";

      const res = await fetch(`/api/student/chat/${studentId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiApiKey,
          "x-gemini-model": geminiModel
        },
        body: JSON.stringify({ text: userText })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Set official history from backend response
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev.filter(m => m.id !== userMsg.id), { ...userMsg, id: `msg-${Date.now()}-user` }, aiMsg]);
        
        if (data.alertTriggered) {
          // Let student know gently or trigger internal actions
          console.warn("High-risk assessment triggered internal school assistance request.");
        }
      } else {
        const errData = await res.json();
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai-error`,
          sender: "ai",
          text: `Đã dừng do lỗi: ${errData.details || "Lỗi hệ thống"}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev.filter(m => m.id !== userMsg.id), { ...userMsg, id: `msg-${Date.now()}-user` }, aiMsg]);
      }
    } catch (err) {
      console.error("Error sending chat:", err);
    } finally {
      setSendingChat(false);
    }
  };

  // Handle Mood Save
  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmoji) return;

    try {
      const res = await fetch(`/api/student/mood/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji: selectedEmoji.emoji,
          note: moodNote,
          score: selectedEmoji.score
        })
      });
      if (res.ok) {
        setMoodSaved(true);
        setMoodNote("");
        setSelectedEmoji(null);
        // Refresh mood history
        const moodsRes = await fetch(`/api/student/moods/${studentId}`);
        if (moodsRes.ok) {
          const moodsData = await moodsRes.json();
          setMoodHistory(moodsData);
        }
        setTimeout(() => setMoodSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error saving mood:", err);
    }
  };

  // Handle emergency alert submission
  const handleSendSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosMessage.trim()) return;

    try {
      const res = await fetch(`/api/student/emergency-help/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueCategory: sosCategory,
          text: sosMessage
        })
      });
      if (res.ok) {
        setSosSent(true);
        setSosMessage("");
      }
    } catch (err) {
      console.error("Error creating emergency help request:", err);
    }
  };

  // Handle Stress Quiz Submission
  const handleQuizAnswer = (qId: string, score: number) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const handleQuizSubmit = () => {
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < STRESS_QUIZ.questions.length) {
      alert("Vui lòng trả lời đầy đủ các câu hỏi nha!");
      return;
    }

    const totalScore = Object.values(quizAnswers).reduce<number>((a, b) => a + Number(b), 0);
    setQuizSubmitted(true);

    let resultMsg = "";
    if (totalScore <= 8) {
      resultMsg = "Mức độ Stress Thấp (An toàn). Bạn đang quản lý tâm lý rất tốt! Cuộc sống và học tập của bạn đang ở trạng thái cân bằng hoàn hảo. Hãy tiếp tục duy trì thói quen đọc sách, giải trí lành mạnh nha.";
    } else if (totalScore <= 15) {
      resultMsg = "Mức độ Stress Trung Bình (Cảnh giác). Bài tập, thi cử bắt đầu khiến bạn thấy hơi lo lắng rồi đấy. Hãy áp dụng phương pháp thở 4-7-8, ngủ đủ giấc 8 tiếng/ngày và dành thêm thời gian trò chuyện với bạn bè, ba mẹ nhé.";
    } else {
      resultMsg = "Mức độ Stress Cao (Cần hỗ trợ). Áp lực hiện tại đang vượt quá ngưỡng chịu đựng thông thường của bạn. Lồng ngực bạn có thể đang cảm thấy rất nặng nề. Mình khuyên bạn nên mở lòng chia sẻ câu chuyện này ngay với AI Tư vấn ở tab bên cạnh, hoặc hẹn gặp cô Tổng phụ trách Đội trường mình để được định hướng gỡ rối kịp thời.";
    }
    setQuizResult(resultMsg);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  // Prompt students to set profile first
  const renderProfileGateMessage = () => {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-rose-50 p-4 rounded-full text-rose-500 mb-4 animate-bounce">
          <Heart size={36} fill="currentColor" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Xin chào bạn yêu quý!</h3>
        <p className="text-gray-600 max-w-md mb-6 text-sm">
          Trước khi chúng mình bắt đầu trò chuyện hay ghi nhật ký, bạn hãy dành 1 phút để tạo một chiếc hồ sơ nhỏ xinh để AI có thể hiểu và giúp đỡ bạn tốt nhất nhé!
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-6 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-md shadow-rose-100"
        >
          <User size={18} /> Thiết lập Hồ sơ ngay
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-rose-50/40">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-rose-100 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <Heart size={24} className="text-white fill-current animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight font-display">Trái Tim Yêu Thương</h1>
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest font-sans">Liên đội THCS Phước Hưng</p>
          </div>
        </div>
        
        {profileSaved && (
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 pl-4 rounded-full border border-slate-100 shadow-sm">
            <span className="text-xs font-bold text-slate-600">Chào, {profile.nickname}!</span>
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amber-400 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold font-display">
              {profile.nickname.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </header>

      {/* Tabs Navbar */}
      <div className="bg-rose-50/60 px-4 py-3 shrink-0 border-b border-rose-100/50">
        <div className="max-w-4xl mx-auto flex justify-start overflow-x-auto gap-2 py-0.5 scrollbar-thin">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'home' 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200' 
                : 'hover:bg-rose-100/60 text-slate-600 hover:text-rose-600'
            }`}
          >
            <User size={14} /> Hồ sơ cá nhân
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200' 
                : 'hover:bg-rose-100/60 text-slate-600 hover:text-rose-600'
            }`}
          >
            <Sparkles size={14} /> AI Tư vấn
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'mood' 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200' 
                : 'hover:bg-rose-100/60 text-slate-600 hover:text-rose-600'
            }`}
          >
            <Smile size={14} /> Nhật ký cảm xúc
          </button>
          <button
            onClick={() => setActiveTab('toolkit')}
            className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'toolkit' 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200' 
                : 'hover:bg-rose-100/60 text-slate-600 hover:text-rose-600'
            }`}
          >
            <BookOpen size={14} /> Góc tự nhận thức
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sos' 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200 animate-pulse' 
                : 'hover:bg-rose-100/60 text-slate-600 hover:text-rose-600'
            }`}
          >
            <AlertTriangle size={14} /> Trợ giúp khẩn cấp
          </button>
        </div>
      </div>

      {/* Primary Workspace Panel */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-rose-50/20">
        <div className="max-w-3xl mx-auto bg-white rounded-[32px] md:rounded-[40px] shadow-xl shadow-rose-100/40 border border-rose-100/50 min-h-[480px] flex flex-col overflow-hidden">
          {loadingProfile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-20 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent"></div>
              <p className="text-sm font-mono">Đang tải thông tin kết nối...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Profile setup View */}
              {activeTab === 'home' && (
                <motion.div
                  key="home-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 md:p-8 flex-1 bg-white"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-display">
                      <User className="text-rose-500" /> Thiết lập hồ sơ cá nhân của bạn
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      Chúng mình bảo mật tuyệt đối 100% nội dung cá nhân của bạn, hãy thoải mái chia sẻ nhé.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Biệt danh của bạn (Hoặc tên thật) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Bánh Mì Muối, Thỏ Ngọc, Hoa Hồng..."
                          value={profile.nickname}
                          onChange={e => setProfile(prev => ({ ...prev, nickname: e.target.value }))}
                          className="w-full px-4 py-3 border border-rose-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-sm bg-rose-50/20 placeholder:text-slate-300 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Khối lớp học *</label>
                        <div className="grid grid-cols-4 gap-2">
                          {GRADE_OPTIONS.map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setProfile(prev => ({ ...prev, grade: g }))}
                              className={`py-2.5 text-center rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                                profile.grade === g 
                                  ? 'bg-gradient-to-br from-rose-500 to-amber-500 border-transparent text-white shadow-md shadow-rose-200' 
                                  : 'bg-white border-rose-100 text-slate-600 hover:bg-rose-50'
                              }`}
                            >
                              Khối {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Môn học yêu thích (Chọn những môn bạn hào hứng nhất)</label>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECT_OPTIONS.map(subj => {
                          const isSelected = profile.favoriteSubjects.includes(subj);
                          return (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => toggleSubject(subj)}
                              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                isSelected 
                                  ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-rose-50/50 hover:text-rose-500 hover:border-rose-100'
                              }`}
                            >
                              {subj} {isSelected && <Check size={12} className="stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Sở thích cá nhân của bạn là gì?</label>
                      <div className="flex flex-wrap gap-2">
                        {INTEREST_OPTIONS.map(interest => {
                          const isSelected = profile.interests.includes(interest);
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-rose-50/50 hover:text-rose-500 hover:border-rose-100'
                              }`}
                            >
                              {interest} {isSelected && <Check size={12} className="stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Những rắc rối/vấn đề bạn từng gặp phải gần đây (nếu có)</label>
                      <div className="flex flex-wrap gap-2">
                        {ISSUE_OPTIONS.map(issue => {
                          const isSelected = profile.previousIssues.includes(issue);
                          return (
                            <button
                              key={issue}
                              type="button"
                              onClick={() => toggleIssue(issue)}
                              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                isSelected 
                                  ? 'bg-rose-100 border-rose-300 text-rose-800 shadow-sm' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-rose-50/50 hover:text-rose-500 hover:border-rose-100'
                              }`}
                            >
                              {issue} {isSelected && <Check size={12} className="stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-rose-100/60 flex items-center justify-between">
                      <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                        <Shield size={14} /> Dữ liệu được bảo vệ an toàn 100%
                      </span>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-rose-200 transition-all text-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        Lưu và Tiếp tục <ChevronRight size={16} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* AI Counselor View */}
              {activeTab === 'chat' && (
                <motion.div
                  key="chat-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full flex-1"
                >
                  {!profileSaved ? (
                    renderProfileGateMessage()
                  ) : (
                    <div className="flex flex-col h-[520px] flex-1">
                      {/* Chat Messages Panel */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white bg-[radial-gradient(#fecdd3_0.8px,transparent_0.8px)] [background-size:20px_20px] min-h-[360px]">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 py-12">
                            <div className="bg-rose-100 p-4 rounded-full text-rose-500 mb-4 shadow-lg shadow-rose-200/50">
                              <Sparkles size={32} />
                            </div>
                            <h4 className="text-base font-bold text-slate-800 font-display">Cửa sổ tâm sự với Chuyên gia AI</h4>
                            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                              Chào mừng bạn ghé thăm phòng tham vấn tâm lý học đường <b>Trái Tim Yêu Thương</b>. AI luôn đồng hành, thấu hiểu và lắng nghe mọi vui buồn, khúc mắc của bạn. Hãy gửi tin nhắn để chia sẻ nhé!
                            </p>
                          </div>
                        ) : (
                          messages.map((m) => {
                            const isUser = m.sender === "user";
                            return (
                              <div
                                key={m.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <div className={`p-2 rounded-xl self-start shrink-0 shadow-sm ${
                                    isUser ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-600'
                                  }`}>
                                    {isUser ? <User size={16} /> : <Heart size={16} className="fill-current animate-pulse" />}
                                  </div>
                                  <div className={`rounded-3xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                                    isUser 
                                      ? 'bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200/40' 
                                      : (m.text.includes('Đã dừng do lỗi') ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none font-bold' : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-tl-none shadow-rose-100')
                                  }`}>
                                    <p className="whitespace-pre-line font-medium">{m.text}</p>
                                    <span className={`block text-[10px] mt-1.5 text-right font-mono ${isUser ? 'text-slate-400' : 'text-rose-100/90'}`}>
                                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        {sendingChat && (
                          <div className="flex justify-start">
                            <div className="flex gap-3 items-center">
                              <div className="bg-rose-100 p-2 rounded-xl text-rose-600 shadow-sm">
                                <Heart size={16} className="fill-current animate-bounce" />
                              </div>
                              <div className="bg-white border border-rose-100 rounded-3xl rounded-tl-none px-5 py-3.5 shadow-sm flex items-center gap-2">
                                <span className="text-xs text-rose-500 font-bold italic">Bạn ấy đang lắng nghe...</span>
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input controls */}
                      <div className="p-4 bg-rose-50/30 border-t border-rose-100/40">
                        <form onSubmit={handleSendChat} className="flex gap-3 bg-white p-2 pl-6 rounded-full border border-rose-100/60 shadow-md">
                          <input
                            type="text"
                            required
                            disabled={sendingChat}
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="Chia sẻ suy nghĩ của bạn với mình nhé..."
                            className="flex-1 text-sm bg-transparent outline-none border-none placeholder:text-slate-300 disabled:opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={sendingChat || !inputText.trim()}
                            className="w-12 h-12 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-rose-300/40 transition-all cursor-pointer shrink-0"
                          >
                            <Send size={18} />
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Mood Tracker View */}
              {activeTab === 'mood' && (
                <motion.div
                  key="mood-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 md:p-8 flex-1 bg-white"
                >
                  {!profileSaved ? (
                    renderProfileGateMessage()
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* Left: Input Mood Form */}
                      <div className="md:col-span-2 bg-rose-50/40 p-5 rounded-3xl border border-rose-100/60">
                        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5 font-display">
                          <Smile size={18} className="text-amber-500 animate-spin-slow" /> Cảm xúc hôm nay thế nào?
                        </h3>

                        <form onSubmit={handleSaveMood} className="space-y-4">
                          <div className="grid grid-cols-4 gap-2">
                            {EMOJIS.map(em => (
                              <button
                                key={em.emoji}
                                type="button"
                                onClick={() => setSelectedEmoji(em)}
                                className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                  selectedEmoji?.emoji === em.emoji
                                    ? em.bg + ' border-transparent scale-105 shadow-md shadow-amber-200 ring-2 ring-amber-400 font-bold text-slate-900'
                                    : 'bg-white border-rose-100/50 text-slate-600 hover:bg-rose-50/40 hover:scale-[1.02]'
                                }`}
                              >
                                <span className="text-2xl">{em.emoji}</span>
                                <span className="text-[10px] mt-1.5 font-bold tracking-tight truncate w-full">{em.label}</span>
                              </button>
                            ))}
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Ghi chú nhỏ về ngày hôm nay (nếu có)</label>
                            <textarea
                              rows={3}
                              placeholder="Kể ngắn gọn điều gì khiến bạn có cảm xúc này nhé..."
                              value={moodNote}
                              onChange={e => setMoodNote(e.target.value)}
                              className="w-full px-3 py-2.5 border border-rose-100 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-xs resize-none placeholder:text-slate-300 font-medium"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={!selectedEmoji}
                            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-rose-200/50 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            Ghi lại nhật ký cảm xúc
                          </button>
                        </form>

                        {moodSaved && (
                          <div className="mt-3.5 p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 font-bold">
                            <CheckCircle2 size={14} /> Nhật ký của bạn đã được lưu cất bí mật!
                          </div>
                        )}
                      </div>

                      {/* Right: History List */}
                      <div className="md:col-span-3">
                        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5 font-display">
                          <Calendar size={18} className="text-rose-500" /> Lịch sử cảm xúc gần đây
                        </h3>

                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                          {moodHistory.length === 0 ? (
                            <div className="text-center py-12 bg-rose-50/10 rounded-2xl border border-dashed border-rose-200 text-xs text-slate-400 font-medium">
                              Chưa có nhật ký cảm xúc nào được lưu. Hãy viết trang đầu tiên của hôm nay nhé!
                            </div>
                          ) : (
                            [...moodHistory].reverse().map(m => (
                              <div key={m.id} className="bg-white border border-rose-100/50 p-4 rounded-2xl flex gap-3.5 shadow-sm items-start hover:shadow-md transition-all">
                                <div className="text-3xl bg-rose-50 p-2 rounded-xl border border-rose-100/50 self-center">
                                  {m.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-bold text-slate-700">
                                      {EMOJIS.find(e => e.emoji === m.emoji)?.label || "Cảm xúc"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                      <Calendar size={10} /> {m.date}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 break-words leading-relaxed italic font-medium">
                                    {m.note || "Không ghi chú"}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reflection Toolkit View */}
              {activeTab === 'toolkit' && (
                <motion.div
                  key="toolkit-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 md:p-8 flex-1 bg-white"
                >
                  <div className="mb-6 border-b border-rose-100/60 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-display">
                      <BookOpen className="text-rose-500 animate-pulse" /> Góc tự nhận thức & Thư giãn
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      Nơi bạn thấu hiểu bản thân hơn qua các bài trắc nghiệm và học các kỹ thuật tâm lý thực tiễn.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Interactive Stress Test Card */}
                    <div className="bg-gradient-to-br from-rose-50/50 via-rose-50/20 to-amber-50/40 border border-rose-100 shadow-sm rounded-3xl p-6">
                      <h3 className="font-bold text-rose-800 text-sm flex items-center gap-1.5 mb-1.5 font-display">
                        <Activity size={18} className="text-rose-500 animate-pulse" /> TRẮC NGHIỆM: {STRESS_QUIZ.title}
                      </h3>
                      <p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">{STRESS_QUIZ.description}</p>

                      {!quizSubmitted ? (
                        <div className="space-y-4">
                          {STRESS_QUIZ.questions.map((q, index) => (
                            <div key={q.id} className="bg-white border border-rose-100/60 p-4 rounded-2xl shadow-sm">
                              <p className="text-xs font-bold text-slate-800 mb-3 font-display">
                                Câu {index + 1}: {q.text}
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {q.options.map(opt => {
                                  const isSelected = quizAnswers[q.id] === opt.score;
                                  return (
                                    <button
                                      key={opt.text}
                                      onClick={() => handleQuizAnswer(q.id, opt.score)}
                                      className={`text-left px-4 py-2.5 rounded-xl text-xs transition-all border cursor-pointer font-medium ${
                                        isSelected
                                          ? "bg-gradient-to-r from-rose-500 to-amber-500 border-transparent text-white font-bold shadow-md shadow-rose-200"
                                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-rose-50/50 hover:text-rose-500 hover:border-rose-100"
                                      }`}
                                    >
                                      {opt.text}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={handleQuizSubmit}
                            className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold py-3 rounded-2xl shadow-lg shadow-rose-200/50 transition-all text-xs cursor-pointer"
                          >
                            Nộp bài tự đánh giá
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/30 border border-emerald-200 p-6 rounded-3xl text-center shadow-lg shadow-emerald-100/20">
                          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2.5 animate-bounce" />
                          <h4 className="text-base font-bold text-slate-800 mb-2 font-display">Kết quả phân tích tâm lý của bạn</h4>
                          <p className="text-xs text-slate-700 leading-relaxed mb-5 px-2 italic font-medium">
                            &ldquo; {quizResult} &rdquo;
                          </p>
                          <button
                            onClick={resetQuiz}
                            className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-5 py-2 rounded-full text-xs shadow-sm border border-slate-200 transition-all cursor-pointer"
                          >
                            Làm lại trắc nghiệm
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Algorithmic Art / Breathing Exercise */}
                    <div className="mt-8">
                      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5 font-display">
                        <Activity size={18} className="text-emerald-500" /> Liệu pháp thư giãn bằng nghệ thuật thuật toán
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        Hãy làm theo nhịp thở của vòng tròn dưới đây. Sự chuyển động của các hạt được lập trình để tạo ra một không gian thư giãn, giúp bạn lấy lại bình tĩnh ngay lập tức.
                      </p>
                      <BreathingExercise />
                    </div>

                    {/* Helpful psychological articles */}
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5 font-display">
                        <FileText size={18} className="text-rose-500" /> Bí kíp gỡ rối & Bài tập thực hành
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        {MENTAL_ARTICLES.map(art => (
                          <div key={art.id} className="border border-rose-100/50 bg-slate-50/30 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                              {art.category}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-3 mb-1.5 font-display">
                              {art.title}
                            </h4>
                            <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">{art.summary}</p>
                            <div className="bg-white p-4 rounded-2xl border border-rose-100/30 space-y-2.5">
                              {art.steps.map((step, idx) => (
                                <p key={idx} className="text-xs text-slate-600 leading-relaxed flex items-start gap-2.5 font-medium">
                                  <span className="bg-amber-100 text-amber-800 text-[10px] rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-bold mt-0.5 shadow-sm">
                                    {idx + 1}
                                  </span>
                                  {step}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Emergency SOS View */}
              {activeTab === 'sos' && (
                <motion.div
                  key="sos-tab"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-6 md:p-8 flex-1 bg-white"
                >
                  <div className="bg-gradient-to-r from-rose-500 to-rose-600 border border-transparent rounded-3xl p-6 mb-6 text-center shadow-lg shadow-rose-200">
                    <AlertTriangle size={44} className="text-white mx-auto mb-2.5 animate-bounce" />
                    <h3 className="text-lg font-bold text-white mb-1.5 font-display">Bạn Đang Gặp Nguy Hiểm Hoặc Rất Bế Tắc?</h3>
                    <p className="text-xs text-rose-50 leading-relaxed max-w-lg mx-auto font-medium">
                      Đừng giữ một mình. Nhà trường và thầy cô cam kết luôn bảo mật thông tin và bảo vệ sự an toàn của bạn trên hết. Bạn không có lỗi trong bất kỳ bạo lực hay sợ hãi nào đang phải chịu đựng.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Direct helplines */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 font-display">
                        <PhoneCall size={18} className="text-emerald-500" /> Các số điện thoại khẩn cấp
                      </h4>

                      <div className="bg-emerald-50/40 border border-emerald-100/80 p-5 rounded-3xl space-y-4 shadow-sm">
                        <div className="flex gap-3.5 items-start">
                          <span className="text-3xl filter drop-shadow">📞</span>
                          <div>
                            <h5 className="font-bold text-emerald-900 text-xs font-display">Tổng đài Quốc gia Bảo vệ Trẻ em</h5>
                            <span className="text-xl font-black font-mono text-emerald-700">111</span>
                            <p className="text-[10px] text-emerald-800 leading-tight mt-1 font-medium">Gọi miễn phí 24/7, bảo mật danh tính tuyệt đối, tư vấn tâm lý khẩn cấp và bảo vệ an toàn cho em.</p>
                          </div>
                        </div>

                        <div className="border-t border-emerald-100 pt-4 flex gap-3.5 items-start">
                          <span className="text-3xl filter drop-shadow">🏫</span>
                          <div>
                            <h5 className="font-bold text-emerald-900 text-xs font-display">Đường dây trợ giúp THCS Phước Hưng</h5>
                            <span className="text-base font-bold font-mono text-emerald-700">0254.3821.xxx</span>
                            <p className="text-[10px] text-emerald-800 leading-tight mt-1 font-medium">Phòng Tư vấn học đường & Thầy Tổng phụ trách Đội trường Phước Hưng luôn sẵn sàng lắng nghe và cứu giúp.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Secret Silent Alert Form */}
                    <div className="bg-rose-50/20 border border-rose-100 p-5 rounded-3xl shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5 font-display">
                        <Shield size={18} className="text-rose-500" /> Trợ giúp khẩn cấp & bí mật
                      </h4>
                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
                        Nhấn nút dưới đây để gửi tin báo khẩn cấp cho thầy cô phụ trách. Thầy cô sẽ kín đáo hẹn gặp riêng hỗ trợ em mà không để lộ thông tin trước lớp.
                      </p>

                      {!sosSent ? (
                        <form onSubmit={handleSendSos} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Nhóm vấn đề khẩn cấp *</label>
                            <select
                              value={sosCategory}
                              onChange={e => setSosCategory(e.target.value as any)}
                              className="w-full px-4 py-2 border border-rose-100 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-xs font-medium cursor-pointer"
                            >
                              <option value="Cảm xúc cá nhân">Khủng hoảng tinh thần/Khóc thầm</option>
                              <option value="Bạn bè">Bị bắt nạt/Cô lập/Tẩy chay</option>
                              <option value="Gia đình">Bạo lực gia đình/Áp lực đe dọa</option>
                              <option value="Học tập">Khủng hoảng thi cử/Cực kỳ bế tắc</option>
                              <option value="Định hướng bản thân">Vấn đề cá nhân khác</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Lời nhắn gửi tới thầy cô (Bảo mật 100%)</label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Kể ngắn điều em đang chịu đựng (Ví dụ: Con bị chặn đòi tiền ngoài cổng trường, con rất sợ hãi không dám đi học...)"
                              value={sosMessage}
                              onChange={e => setSosMessage(e.target.value)}
                              className="w-full px-4 py-3 border border-rose-100 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 text-xs resize-none placeholder:text-slate-300 font-medium"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={!sosMessage.trim()}
                            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-bold py-3.5 rounded-full text-xs shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <AlertTriangle size={15} /> Gửi yêu cầu trợ giúp khẩn cấp
                          </button>
                        </form>
                      ) : (
                        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl text-center shadow-sm">
                          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2.5 animate-bounce" />
                          <h5 className="font-bold text-emerald-900 text-xs mb-1.5 font-display">Yêu cầu trợ giúp đã được gửi đi!</h5>
                          <p className="text-[10px] text-emerald-800 leading-relaxed mb-4 font-medium">
                            Thầy cô Tổng phụ trách và Ban cố vấn tâm lý học đường đã nhận được tín hiệu của bạn. Hãy bình tĩnh, thầy cô sẽ kín đáo kết nối hỗ trợ bạn sớm nhất có thể. Bạn rất dũng cảm!
                          </p>
                          <button
                            onClick={() => setSosSent(false)}
                            className="text-[11px] text-emerald-800 font-bold underline cursor-pointer"
                          >
                            Tạo yêu cầu trợ giúp khác
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

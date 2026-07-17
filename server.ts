/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { StudentProfile, MoodLog, ChatMessage, EarlyWarningAlert } from "./src/types";
import admin from 'firebase-admin';

dotenv.config();

let firestore: admin.firestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    firestore = admin.firestore();
    console.log("🔥 Firebase Firestore connected successfully.");
  }
} catch (e) {
  console.error("🔥 Firebase init error:", e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to database
const DATA_DIR = process.env.VERCEL === "1" ? "/tmp" : path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, "db.json");

// Dynamic Seeding Helper for high-fidelity interactive data
function getSeededDatabase(): {
  students: { [id: string]: StudentProfile };
  moods: { [studentId: string]: MoodLog[] };
  chats: { [studentId: string]: ChatMessage[] };
  alerts: EarlyWarningAlert[];
} {
  return { students: {}, moods: {}, chats: {}, alerts: [] };
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load DB from file or seed
let db: ReturnType<typeof getSeededDatabase>;
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    console.error("Failed to parse db.json, generating a new seeded DB", e);
    db = getSeededDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
} else {
  db = getSeededDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let dbLoaded = false;
app.use(async (req, res, next) => {
  if (firestore && !dbLoaded) {
    try {
      const doc = await firestore.collection('database').doc('v2').get();
      if (doc.exists) {
        db = doc.data() as ReturnType<typeof getSeededDatabase>;
        console.log("🔥 Data loaded from Firestore.");
      } else {
        await firestore.collection('database').doc('v2').set(db);
        console.log("🔥 Initial seeded data saved to Firestore.");
      }
      dbLoaded = true;
    } catch (e) {
      console.error("🔥 Error loading from Firestore:", e);
    }
  }
  next();
});

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Error saving database file:", err);
  }
  
  if (firestore) {
    firestore.collection('database').doc('v2').set(db)
      .then(() => console.log("🔥 Data saved to Firestore."))
      .catch(err => console.error("🔥 Error saving to Firestore:", err));
  }
}

// Clean and Parse Gemini responses safely
function parseGeminiJson(rawText: string) {
  let cleaned = rawText.trim();
  // Strip markdown code blocks
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/, "");
    cleaned = cleaned.replace(/```$/, "");
    cleaned = cleaned.trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", rawText, e);
    // Attempt regex extraction
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        console.error("Failed to parse extracted regex JSON block:", innerE);
      }
    }
    // Deep fallback parsing for typical keys if JSON fails completely
    const replyMatch = cleaned.match(/"reply"\s*:\s*"([\s\S]*?)"\s*,?\s*"/);
    const riskMatch = cleaned.match(/"riskLevel"\s*:\s*(\d)/);
    const categoryMatch = cleaned.match(/"detectedCategory"\s*:\s*"([\s\S]*?)"/);
    
    return {
      reply: replyMatch ? replyMatch[1].replace(/\\n/g, "\n") : rawText,
      riskLevel: riskMatch ? parseInt(riskMatch[1], 10) : 1,
      detectedCategory: categoryMatch ? categoryMatch[1] : "Cảm xúc cá nhân",
      reason: "Hệ thống tự động phân loại do phản hồi thô của AI lỗi cấu trúc",
      needsTeacherAlert: riskMatch ? parseInt(riskMatch[1], 10) === 3 : false
    };
  }
}

// Helper to get Gemini client, preferring request-specific key
function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.warn("No Gemini API key provided. Falling back to local rules-based simulation.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ------------------------------------------
// API ROUTES FOR STUDENT PROFILE
// ------------------------------------------

app.get("/api/student/profile/:studentId", (req, res) => {
  const { studentId } = req.params;
  const profile = db.students[studentId];
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }
  res.json(profile);
});

app.post("/api/student/profile/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { nickname, grade, favoriteSubjects, interests, previousIssues } = req.body;
  
  if (!nickname || !grade) {
    return res.status(400).json({ error: "Biệt danh và khối lớp là bắt buộc" });
  }

  db.students[studentId] = {
    nickname,
    grade,
    favoriteSubjects: favoriteSubjects || [],
    interests: interests || [],
    previousIssues: previousIssues || []
  };
  saveDb();
  res.json({ success: true, profile: db.students[studentId] });
});

// ------------------------------------------
// API ROUTES FOR MOOD TRACKING
// ------------------------------------------

app.get("/api/student/moods/:studentId", (req, res) => {
  const { studentId } = req.params;
  const studentMoods = db.moods[studentId] || [];
  res.json(studentMoods);
});

app.post("/api/student/mood/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { emoji, note, score } = req.body;
  
  if (!emoji || typeof score !== "number") {
    return res.status(400).json({ error: "Cảm xúc và điểm số là bắt buộc" });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const newMood: MoodLog = {
    id: `mood-${Date.now()}`,
    date: todayStr,
    emoji,
    note: note || "",
    score
  };

  if (!db.moods[studentId]) {
    db.moods[studentId] = [];
  }
  
  // Clean up existing entry for today to avoid duplicates
  db.moods[studentId] = db.moods[studentId].filter(m => m.date !== todayStr);
  db.moods[studentId].push(newMood);
  saveDb();
  res.json({ success: true, mood: newMood });
});

// ------------------------------------------
// API ROUTES FOR CHAT & AI COUNSELING
// ------------------------------------------

app.get("/api/student/chats/:studentId", (req, res) => {
  const { studentId } = req.params;
  const studentChats = db.chats[studentId] || [];
  res.json(studentChats);
});

app.post("/api/student/chat/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Nội dung tin nhắn không được trống" });
  }

  // Get or initialize chat history
  if (!db.chats[studentId]) {
    db.chats[studentId] = [];
  }

  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-user`,
    sender: "user",
    text,
    timestamp: new Date().toISOString()
  };
  db.chats[studentId].push(userMsg);

  // Get student profile for personalization
  const profile = db.students[studentId] || {
    nickname: "Học sinh ẩn danh",
    grade: "7",
    favoriteSubjects: [],
    interests: [],
    previousIssues: []
  };

  const customApiKey = req.headers['x-gemini-api-key'] as string | undefined;
  const preferredModel = (req.headers['x-gemini-model'] as string) || 'gemini-3-pro-preview';
  
  const gemini = getGeminiClient(customApiKey);
  let replyObj: {
    reply: string;
    riskLevel: number;
    detectedCategory: string;
    reason: string;
    needsTeacherAlert: boolean;
  };

  if (gemini) {
    try {
      // Build context of previous messages (limit to last 10 messages for safety)
      const chatContext = db.chats[studentId].slice(-10).map(m => {
        return `${m.sender === "user" ? "Học sinh" : "AI Counselor"}: ${m.text}`;
      }).join("\n");

      const systemPrompt1 = `Bạn là Agent 1 (Lắng nghe & Phân tích) của hệ thống AI tư vấn tâm lý 'Trái Tim Yêu Thương'.
Nhiệm vụ: Lắng nghe, phân tích cảm xúc, xoa dịu và đánh giá rủi ro.
Thông tin học sinh:
- Biệt danh: ${profile.nickname}
- Vấn đề từng gặp: ${(profile.previousIssues || []).join(", ")}

BẮT BUỘC TRẢ LỜI JSON:
{
  "empathyText": "<Lời xoa dịu chân thành, thấu cảm, xưng 'mình' gọi 'bạn' hoặc tên học sinh.>",
  "riskLevel": <1, 2, hoặc 3. 3 là nguy hiểm tính mạng/bạo lực.>,
  "detectedCategory": "<Học tập | Bạn bè | Gia đình | Cảm xúc cá nhân | Định hướng bản thân>",
  "reason": "<Lý do phân loại rủi ro>",
  "needsTeacherAlert": <true nếu Mức 3, còn lại false>
}`;

      let response1;
      
      const fallbackModels = [
        "gemini-3-flash-preview",
        "gemini-3-pro-preview",
        "gemini-2.5-flash"
      ];
      const modelsToTry = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)];
      let lastError;
      
      // Step 1: Empathy & Risk Assessment
      for (const modelName of modelsToTry) {
        try {
          console.log(`Agent 1 trying model: ${modelName}`);
          response1 = await gemini.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: `Lịch sử chat:\n${chatContext}` }] }],
            config: { systemInstruction: systemPrompt1, responseMimeType: "application/json" }
          });
          break;
        } catch (err: any) {
          lastError = err;
        }
      }
      
      if (!response1) throw lastError;
      const agent1Data = parseGeminiJson(response1.text || "");

      // Step 2: Solution & Recommendation
      const systemPrompt2 = `Bạn là Agent 2 (Gợi ý & Hành động) của hệ thống 'Trái Tim Yêu Thương'.
Nhiệm vụ: Dựa vào lời xoa dịu của Agent 1, hãy đề xuất 2-3 phương pháp giải quyết hoặc bài viết phù hợp, sau đó ghép lại thành một câu trả lời hoàn chỉnh và ấm áp.

Dữ liệu từ Agent 1:
- Lời xoa dịu: "${agent1Data.empathyText || agent1Data.reply}"
- Phân loại: ${agent1Data.detectedCategory}
- Mức độ: ${agent1Data.riskLevel}

BẮT BUỘC TRẢ LỜI JSON:
{
  "reply": "<Phản hồi hoàn chỉnh: Lời xoa dịu của Agent 1 + Giải pháp của bạn + Lời động viên + Câu hỏi mở. Đảm bảo ngôn từ thân thiện, tự nhiên.>",
  "suggestedMethods": ["<Phương pháp 1, ví dụ: Thở 4-7-8>", "<Phương pháp 2>"]
}`;

      let response2;
      for (const modelName of modelsToTry) {
        try {
          console.log(`Agent 2 trying model: ${modelName}`);
          response2 = await gemini.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: `Hãy tạo phản hồi cuối cùng cho học sinh dựa trên thông tin trên.` }] }],
            config: { systemInstruction: systemPrompt2, responseMimeType: "application/json" }
          });
          break;
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!response2) throw lastError;
      const agent2Data = parseGeminiJson(response2.text || "");

      replyObj = {
        reply: agent2Data.reply || agent1Data.empathyText,
        riskLevel: agent1Data.riskLevel,
        detectedCategory: agent1Data.detectedCategory,
        reason: agent1Data.reason,
        needsTeacherAlert: agent1Data.needsTeacherAlert
      };
    } catch (err: any) {
      console.error("Gemini API Error after all retries:", err);
      return res.status(500).json({ 
        error: "Đã dừng do lỗi", 
        details: err.message || "Lỗi không xác định từ API" 
      });
    }
  } else {
    // Rules-based response simulator if Gemini key is missing
    replyObj = getFallbackResponse(text, profile);
  }

  // Save AI response message
  const aiMsg: ChatMessage = {
    id: `msg-${Date.now()}-ai`,
    sender: "ai",
    text: replyObj.reply,
    timestamp: new Date().toISOString()
  };
  db.chats[studentId].push(aiMsg);

  // If High Risk (Level 3), trigger internal early warning alert
  if (replyObj.riskLevel === 3 || replyObj.needsTeacherAlert) {
    const alertId = `alert-${Date.now()}`;
    const newAlert: EarlyWarningAlert = {
      id: alertId,
      timestamp: new Date().toISOString(),
      grade: profile.grade,
      nickname: profile.nickname,
      issueCategory: (replyObj.detectedCategory as any) || "Cảm xúc cá nhân",
      riskLevel: 3,
      detectedReason: replyObj.reason || "AI phát hiện dấu hiệu nguy cơ cao (ý định tự hủy hoại/bạo lực).",
      status: "pending",
      notes: "",
      chatSummary: text
    };
    db.alerts.unshift(newAlert); // New alerts go to the top
  }

  saveDb();
  res.json({
    success: true,
    reply: replyObj.reply,
    riskLevel: replyObj.riskLevel,
    detectedCategory: replyObj.detectedCategory,
    reason: replyObj.reason,
    alertTriggered: replyObj.riskLevel === 3
  });
});

// Fallback logic for robust local operation and key fallback
function getFallbackResponse(text: string, profile: StudentProfile): {
  reply: string;
  riskLevel: number;
  detectedCategory: string;
  reason: string;
  needsTeacherAlert: boolean;
} {
  const normalized = text.toLowerCase();
  let reply = "";
  let riskLevel = 1;
  let category = "Cảm xúc cá nhân";
  let reason = "Mặc định (Không có API Key)";
  let needsTeacherAlert = false;

  if (normalized.includes("tự tử") || normalized.includes("muốn chết") || normalized.includes("rạch tay") || normalized.includes("làm hại bản thân") || normalized.includes("đánh đập dã man") || normalized.includes("bị bạo hành")) {
    riskLevel = 3;
    category = "Cảm xúc cá nhân";
    reason = "Phát hiện từ khóa nguy cơ tự hại/bạo lực nghiêm trọng: " + text.substring(0, 40);
    needsTeacherAlert = true;
    reply = `Chào ${profile.nickname}, mình đang lắng nghe bạn đây. Mình cảm thấy rất lo lắng khi nghe bạn chia sẻ những lời này. 

Bạn đang phải trải qua những cảm giác vô cùng đau đớn và cô độc phải không? Mình muốn bạn biết rằng bạn không hề cô đơn và luôn có mọi người xung quanh muốn bảo bọc bạn.

Vì sự an toàn của bạn là điều quan trọng nhất lúc này, mình tha thiết khuyên bạn hãy liên hệ ngay với người lớn đáng tin cậy: ba mẹ, thầy cô chủ nhiệm, cô Tổng phụ trách Đội trường THCS Phước Hưng, hoặc gọi ngay tới Tổng đài Quốc gia Bảo vệ Trẻ em 111 (hoàn toàn miễn phí và bảo mật). 

Mình đã ghi nhận yêu cầu trợ giúp và sẽ đồng hành cùng bạn để tìm kiếm sự bảo vệ tốt nhất. Hãy hứa với mình bạn sẽ không làm đau bản thân nhé. Bạn có muốn cùng mình nói chuyện tiếp để vơi bớt lòng không?`;
  } else if (normalized.includes("áp lực") || normalized.includes("điểm số") || normalized.includes("thi cử") || normalized.includes("lo lắng")) {
    category = "Học tập";
    reply = `Chào bạn ${profile.nickname}, mình nghe thấy sự lo lắng và mệt mỏi của bạn về việc học tập lúc này. Có vẻ kỳ thi sắp tới hoặc áp lực điểm số đang đè nặng lên vai bạn. 

Mình hoàn toàn đồng cảm rằng ở độ tuổi khối ${profile.grade}, lượng kiến thức nhiều cùng với sự kỳ vọng từ thầy cô, ba mẹ đôi khi khiến bạn cảm thấy ngột thở.

Để vượt qua cảm giác này, chúng mình có thể cùng thử một vài cách nhỏ nhé:
1. Hãy tạm dừng học khoảng 10 phút, hít thở sâu theo nhịp 4-7-8 (hít vào 4 giây, giữ 7 giây, thở ra 8 giây) để nhịp tim bình ổn lại.
2. Chia nhỏ mục tiêu học tập hằng ngày thay vì cố nhồi nhét tất cả cùng một lúc.
3. Chia sẻ thành thật lo lắng này với ba mẹ hoặc một người bạn thân thiết.

Bạn là một học sinh rất có trách nhiệm đấy. Đừng quá khắt khe với bản thân nhé. Ngày mai bạn có bài kiểm tra môn nào lớn không, kể cho mình nghe thêm nhé?`;
  } else if (normalized.includes("bắt nạt") || normalized.includes("cô lập") || normalized.includes("tẩy chay") || normalized.includes("bạn bè")) {
    category = "Bạn bè";
    reply = `Chào bạn ${profile.nickname}, cảm ơn bạn đã tin tưởng chia sẻ câu chuyện nhạy cảm này với mình. Việc bị bạn bè cô lập hay bạo lực học đường thực sự là một trải nghiệm vô cùng khó khăn và tổn thương.

Mình hiểu bạn đang cảm thấy sợ hãi, bất an và có thể là cả sự tức giận nữa. Không ai xứng đáng bị đối xử như vậy cả.

Để bảo vệ bản thân an toàn, bạn hãy thử áp dụng những phương án này nhé:
1. Tránh đi một mình ở những khu vực vắng vẻ trong trường, hãy luôn đi cùng nhóm bạn khác hoặc đi gần thầy cô.
2. Ghi lại bằng chứng hoặc nhớ rõ thời gian xảy ra sự việc để báo cáo.
3. Quan trọng nhất: Hãy báo ngay cho Giáo viên chủ nhiệm hoặc cô Tổng phụ trách Đội trường Phước Hưng để nhà trường can thiệp kịp thời. Bạn không có lỗi trong chuyện này, hãy để thầy cô đồng hành cùng bạn.

Mình luôn ở đây để làm chỗ dựa cho bạn. Bạn có muốn chia sẻ rõ hơn việc này đã diễn ra lâu chưa để mình hỗ trợ bạn tốt nhất?`;
  } else {
    reply = `Chào bạn ${profile.nickname}, mình rất vui được trò chuyện cùng bạn hôm nay. Lắng nghe những chia sẻ của bạn giúp mình hiểu thêm về những gì học sinh khối ${profile.grade} đang trải qua.

Có vẻ như bạn đang có khá nhiều suy tư trong lòng. Dù là chuyện học hành, bạn bè, gia đình hay chỉ là một nỗi buồn nho nhỏ không tên, mình đều sẵn sàng lắng nghe bạn mà không phán xét.

Chúng mình có thể cùng trò chuyện về:
1. Những niềm vui hay rắc rối nhỏ trên lớp hôm nay.
2. Sở thích ${(profile.interests || []).join(", ") || "vẽ tranh, nghe nhạc"} của bạn.
3. Cách giải quyết một vướng mắc nào đó bạn đang băn khoăn.

Bạn thấy thoải mái nhất khi chia sẻ về chủ đề nào lúc này? Hãy nói cho mình biết nhé!`;
  }

  return { reply, riskLevel, detectedCategory: category, reason, needsTeacherAlert };
}

// ------------------------------------------
// API ROUTES FOR TEACHER / ADMIN PANEL
// ------------------------------------------

app.get("/api/teacher/stats", (req, res) => {
  // Aggregate stats from db dynamically
  const studentsList = Object.values(db.students);
  const totalStudents = studentsList.length;
  
  // Calculate grade distribution
  const gradeCounts: { [grade: string]: number } = {};
  studentsList.forEach(s => {
    gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
  });

  // Calculate topic counts based on alerts and mood log categories
  const topicCounts: { [category: string]: number } = {};
  db.alerts.forEach(a => {
    topicCounts[a.issueCategory] = (topicCounts[a.issueCategory] || 0) + 1;
  });

  // Calculate consulting stats by day
  const dailyCounts: { [date: string]: number } = {};

  // Count active chats dynamically
  Object.values(db.chats).forEach(chatList => {
    if (chatList.length > 0) {
      const lastMsg = chatList[chatList.length - 1];
      const dateStr = lastMsg.timestamp.split("T")[0];
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++;
      } else {
        dailyCounts[dateStr] = 1;
      }
    }
  });

  // Trend analysis (average mood score over past 7 days)
  const today = new Date();
  const last7Days: { date: string; avgScore: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Find all mood scores on this day
    let totalScore = 0;
    let count = 0;
    Object.values(db.moods).forEach(moodList => {
      moodList.forEach(m => {
        if (m.date === dateStr) {
          totalScore += m.score;
          count++;
        }
      });
    });

    const avgScore = count > 0 ? Number((totalScore / count).toFixed(1)) : 0;

    last7Days.push({
      date: dateStr.substring(5), // MM-DD format
      avgScore
    } as any);
  }

  res.json({
    totalStudents,
    totalConsultations: db.alerts.length,
    gradeCounts,
    topicCounts,
    dailyCounts,
    moodTrends: last7Days
  });
});

app.get("/api/teacher/alerts", (req, res) => {
  res.json(db.alerts);
});

app.post("/api/teacher/alerts/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const alertIndex = db.alerts.findIndex(a => a.id === id);
  if (alertIndex === -1) {
    return res.status(404).json({ error: "Alert not found" });
  }

  if (status) db.alerts[alertIndex].status = status;
  if (notes !== undefined) db.alerts[alertIndex].notes = notes;

  saveDb();
  res.json({ success: true, alert: db.alerts[alertIndex] });
});

app.get("/api/teacher/export-report", async (req, res) => {
  try {
    const docx = await import("docx");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

    const pendingAlerts = db.alerts.filter(a => a.status === 'pending');
    const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
    const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Học sinh", bold: true })] })] }),
          new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Phân loại", bold: true })] })] }),
          new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Lý do", bold: true })] })] })
        ]
      })
    ];

    pendingAlerts.forEach(a => {
      tableRows.push(new TableRow({
        children: [
          new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(`${a.nickname} (Khối ${a.grade})`)] })] }),
          new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(a.issueCategory)] })] }),
          new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun(a.detectedReason)] })] })
        ]
      }));
    });

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun("BÁO CÁO TÂM LÝ HỌC ĐƯỜNG")],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("1. Tóm tắt tình hình")],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Ngày xuất báo cáo: " + new Date().toLocaleDateString("vi-VN"), bold: true }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun(`Tổng số ca cảnh báo chưa xử lý: ${pendingAlerts.length}`),
            ]
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("2. Danh sách cảnh báo cần chú ý")],
          }),
          new Table({
            columnWidths: [2340, 2340, 4680],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            rows: tableRows
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename=bao_cao_tam_ly.docx');
    res.type('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(Buffer.from(buffer)); // Ensure it's a buffer

  } catch (err: any) {
    console.error("Export DOCX error:", err);
    res.status(500).json({ error: "Lỗi tạo file báo cáo (Hãy kiểm tra đã chạy npm install docx chưa)", details: err.message });
  }
});

app.post("/api/student/emergency-help/:studentId", (req, res) => {
  const { studentId } = req.params;
  const { issueCategory, text } = req.body;

  const profile = db.students[studentId] || {
    nickname: "Học sinh ẩn danh",
    grade: "7",
    favoriteSubjects: [],
    interests: [],
    previousIssues: []
  };

  const alertId = `alert-${Date.now()}`;
  const newAlert: EarlyWarningAlert = {
    id: alertId,
    timestamp: new Date().toISOString(),
    grade: profile.grade,
    nickname: profile.nickname,
    issueCategory: issueCategory || "Cảm xúc cá nhân",
    riskLevel: 3,
    detectedReason: "Học sinh chủ động bấm nút yêu cầu hỗ trợ khẩn cấp: " + (text || "Không có lời nhắn đi kèm"),
    status: "pending",
    notes: "",
    chatSummary: text || "Yêu cầu khẩn cấp qua kênh Trợ giúp"
  };

  db.alerts.unshift(newAlert);
  saveDb();

  res.json({ success: true, alert: newAlert });
});

// Serve frontend assets in production or Vite middleware in dev
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  import("vite").then(async (vite) => {
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(viteServer.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  // Let Vercel handle static routing, only fallback locally
  if (process.env.VERCEL !== "1") {
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Trái Tim Yêu Thương] Server is running on port ${PORT}`);
  });
}

export default app;

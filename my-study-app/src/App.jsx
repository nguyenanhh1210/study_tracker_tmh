import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  increment,
  writeBatch,
  getDocs
} from 'firebase/firestore';
// Bỏ getStorage và các hàm liên quan
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  CheckCircle,
  Circle,
  Plus,
  Target,
  BookOpen,
  Calendar,
  X,
  TrendingUp,
  Award, // Sẽ bỏ Award vì bỏ streak
  Loader2,
  User,
  Copy,
  LogOut,
  LogIn
} from 'lucide-react';

// --- CẤU HÌNH FIREBASE ---
// HÃY DÁN firebaseConfig "THẬT" CỦA BẠN VÀO ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyBuSPwtyntSMlT3NwWXn3Ws2OOKZR8j79A",
  authDomain: "database-of-tmh.firebaseapp.com",
  projectId: "database-of-tmh",
  storageBucket: "database-of-tmh.firebasestorage.app",
  messagingSenderId: "805432088197",
  appId: "1:805432088197:web:914c8e22d8968f8a333bec",
  measurementId: "G-42E8MR1KPC"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Bỏ const storage = getStorage(app);

// Đường dẫn Firestore (Đã cập nhật)
const usersPath = 'users';
const publicCodesPath = 'publicCodes';
const goalsPath = 'goals';
const goalTodosPath = 'goalTodos';
const studyLogsPath = 'studyLogs';
// Bỏ generalTodosPath

// --- Helper Functions (Giữ nguyên) ---

/**
 * Tạo một mã 6 chữ số duy nhất
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<string>} - Mã 6 chữ số duy nhất
 */
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeRef = doc(db, publicCodesPath, code);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      isUnique = true;
    }
  }
  return code;
};

/**
 * Định dạng ngày YYYY-MM-DD
 * @param {Date} date - Đối tượng Date
 * @returns {string} - Chuỗi ngày 'YYYY-MM-DD'
 */
const getISODate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Bỏ hàm getYesterdayISODate vì không còn streak

// --- React Components ---

/**
 * Màn hình Đăng nhập
 * HƯỚNG DẪN SỬA LỖI (auth/unauthorized-domain):
 * 1. Mở Bảng điều khiển Firebase (Firebase Console) của bạn.
 * 2. Vào mục "Authentication".
 * 3. Nhấn vào tab "Settings" (Cài đặt).
 * 4. Chọn "Authorized domains" (Tên miền được ủy quyền).
 * 5. Nhấn "Add domain" (Thêm miền) và dán tên miền này vào:
 * scf.usercontent.goog
 * 6. Nhấn "Add". Lỗi sẽ biến mất sau vài phút.
 * 7. Bạn cũng cần thêm tên miền "web thật" của bạn (ví dụ: ten-app.web.app) và "localhost" vào đây.
 */
function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged sẽ xử lý phần còn lại
    } catch (err) {
      console.error("Lỗi đăng nhập Google: ", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Lỗi Cấu hình: Tên miền này (scf.usercontent.goog) chưa được cho phép. Vui lòng xem Hướng dẫn sửa lỗi trong code (dòng 118).');
      } else {
        setError('Không thể đăng nhập với Google. Vui lòng thử lại.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-10 rounded-lg shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Chào mừng bạn!</h1>
        <p className="text-gray-600 mb-8">
          Đăng nhập để bắt đầu quản lý mục tiêu và theo dõi tiến độ học tập của bạn.
        </p>
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center text-lg"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <svg className="w-6 h-6 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 5.2-6.4 9-11.3 9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.8 3.1l6.1-6.1C34 4.5 29.3 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.3-.2-2.7-.5-4z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.1 6.1C14.8 14.8 19.1 12 24 12c3.1 0 5.8 1.2 7.8 3.1l6.1-6.1C34 4.5 29.3 2 24 2 16.9 2 10.8 5.8 6.3 10.3z" />
              <path fill="#4CAF50" d="M24 46c5.3 0 10-1.8 13.5-4.8l-6.1-6.1c-2 1.9-4.7 3-7.4 3-4.9 0-9.2-3.8-10.9-8.7l-6.1 6.1C10.8 40.2 16.9 46 24 46z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.8l6.1 6.1C40.6 36.6 44 30.6 44 24c0-1.3-.2-2.7-.5-4z" />
            </svg>
          )}
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
        </button>
        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Modal Đăng ký cho người dùng mới
 */
function SignupModal({ userAuth, onSignupSuccess }) {
  const [name, setName] = useState(() => userAuth.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const userId = userAuth.uid;
      const userRef = doc(db, usersPath, userId);
      
      const publicCode = await generateUniqueCode();

      const newUser = {
        userId: userId,
        name: name.trim(),
        email: userAuth.email,
        publicCode: publicCode,
        points: 0,
        // Bỏ streakDays và lastCompletionDate
        createdAt: new Date().toISOString(),
      };

      const batch = writeBatch(db);
      batch.set(userRef, newUser);
      batch.set(doc(db, publicCodesPath, publicCode), { userId });
      
      await batch.commit();

      onSignupSuccess(newUser);
    } catch (err) {
      console.error("Lỗi đăng ký: ", err);
      setError('Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Chào mừng bạn mới!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Vui lòng xác nhận tên của bạn để bắt đầu.
        </p>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Họ và Tên
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tên của bạn"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Bắt đầu hành trình'}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Hiển thị 1 mục tiêu và các To-do list con (ĐÃ CẬP NHẬT)
 */
function GoalItem({ goal, userId, onGoalTodoComplete }) {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTodoDate, setNewTodoDate] = useState(getISODate());
  const [isLoading, setIsLoading] = useState(false);

  const goalTodosQuery = useMemo(() => {
    return query(
      collection(db, goalTodosPath),
      where('userId', '==', userId),
      where('goalId', '==', goal.id)
    );
  }, [userId, goal.id]);

  // Lắng nghe các to-do list con
  useEffect(() => {
    const unsubscribe = onSnapshot(goalTodosQuery, (snapshot) => {
      const fetchedTodos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sắp xếp: ngày hoàn thành (tăng dần), sau đó là ngày tạo (tăng dần)
      fetchedTodos.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return new Date(a.createdAt) - new Date(a.createdAt);
      });
      setTodos(fetchedTodos);
    }, (error) => {
      console.error("Lỗi lắng nghe goal todos: ", error);
    });
    return () => unsubscribe();
  }, [goalTodosQuery]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !newTodoDate) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, goalTodosPath), {
        userId,
        goalId: goal.id,
        task: newTask.trim(),
        date: newTodoDate, // Thêm ngày cho to-do
        completed: false,
        createdAt: new Date().toISOString(),
      });
      setNewTask('');
      setNewTodoDate(getISODate());
    } catch (error) {
      console.error("Lỗi thêm to-do con: ", error);
    }
    setIsLoading(false);
  };

  const toggleTodo = async (todoId, currentStatus) => {
    const isCompleting = !currentStatus;
    try {
      const todoRef = doc(db, goalTodosPath, todoId);
      await updateDoc(todoRef, { completed: isCompleting });
      
      // Nếu đang ĐÁNH DẤU HOÀN THÀNH, cộng 2 điểm
      if (isCompleting) {
        onGoalTodoComplete(2); // Gọi callback cộng 2 điểm
      }
      // (Chúng ta không trừ điểm nếu người dùng bỏ check)
      
    } catch (error) {
      console.error("Lỗi cập nhật to-do con: ", error);
    }
  };

  const handleMarkGoalComplete = async () => {
    try {
      const goalRef = doc(db, goalsPath, goal.id);
      await updateDoc(goalRef, { completed: true });
    } catch (error) {
      console.error("Lỗi hoàn thành mục tiêu: ", error);
    }
  };
  
  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  // Decor màu đỏ nổi bật
  return (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${goal.completed ? 'bg-gray-100 border-gray-400 opacity-70' : 'bg-red-50 border-red-500'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-xl font-bold ${goal.completed ? 'text-gray-600 line-through' : 'text-red-700'}`}>
            {goal.title}
          </h3>
          <p className="text-sm text-gray-500 flex items-center">
            <Calendar size={14} className="mr-1" />
            Hạn chót Mục tiêu: {goal.endDate}
          </p>
        </div>
        {!goal.completed && (
          <button
            onClick={handleMarkGoalComplete}
            className="text-sm bg-green-500 text-white py-1 px-3 rounded-full hover:bg-green-600 transition"
          >
            Hoàn thành Mục tiêu
          </button>
        )}
      </div>

      {totalTodos > 0 && !goal.completed && (
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-600">Tiến độ: {completedTodos}/{totalTodos}</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 pl-4 border-l-2 border-red-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Các việc cần làm (+2 điểm/việc):</h4>
        <ul className="space-y-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex items-center">
              <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mr-2">
                {todo.completed ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-red-400" />
                )}
              </button>
              <span className={`text-sm ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                {todo.task}
              </span>
              <span className={`text-xs ml-2 ${todo.completed ? 'text-gray-400' : 'text-red-600'}`}>
                (Ngày: {todo.date})
              </span>
            </li>
          ))}
        </ul>
        {!goal.completed && (
          <form onSubmit={handleAddTodo} className="mt-3 space-y-2">
            <div className="flex">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-grow px-3 py-1.5 border border-gray-300 rounded-l-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                placeholder="Thêm việc cần làm..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1.5 bg-red-500 text-white rounded-r-md hover:bg-red-600 disabled:bg-gray-400 flex items-center justify-center"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>
            <div>
              <input
                type="date"
                value={newTodoDate}
                onChange={(e) => setNewTodoDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                required
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Panel quản lý Mục tiêu (ĐÃ CẬP NHẬT)
 */
function GoalsPanel({ userId, onGoalTodoComplete }) {
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(getISODate());
  const [isLoading, setIsLoading] = useState(false);

  const goalsQuery = useMemo(() => {
    return query(
      collection(db, goalsPath),
      where('userId', '==', userId)
    );
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const fetchedGoals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedGoals.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setGoals(fetchedGoals);
    }, (error) => {
      console.error("Lỗi lắng nghe goals: ", error);
    });
    return () => unsubscribe();
  }, [goalsQuery]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalDate) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, goalsPath), {
        userId,
        title: newGoalTitle.trim(),
        endDate: newGoalDate,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      setNewGoalTitle('');
      setNewGoalDate(getISODate());
    } catch (error) {
      console.error("Lỗi thêm mục tiêu: ", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <Target size={24} className="mr-2 text-red-600" />
        Quản lý Mục tiêu
      </h2>
      
      <form onSubmit={handleAddGoal} className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-3">Thêm mục tiêu mới (Lớn)</h3>
        <div className="mb-3">
          <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700 mb-1">Tên mục tiêu</label>
          <input
            id="goalTitle"
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Ví dụ: Đạt 8.0 IELTS"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="goalDate" className="block text-sm font-medium text-gray-700 mb-1">Ngày hoàn thành (dự kiến)</label>
          <input
            id="goalDate"
            type="date"
            value={newGoalDate}
            onChange={(e) => setNewGoalDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            min={getISODate()}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-red-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Plus className="mr-1" />} Thêm mục tiêu
        </button>
      </form>

      <div className="space-y-4">
        {goals.length > 0 ? (
          goals.map(goal => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              userId={userId}
              onGoalTodoComplete={onGoalTodoComplete} // Truyền callback xuống
            />
          ))
        ) : (
          <p className="text-center text-gray-500 italic">Bạn chưa có mục tiêu nào. Hãy bắt đầu!</p>
        )}
      </div>
    </div>
  );
}

/**
 * Panel Ghi lại giờ học (ĐÃ BỎ ẢNH)
 */
function StudyLoggerPanel({ userId, onStudyLogged }) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  
  const studyLogsQuery = useMemo(() => {
     return query(
       collection(db, studyLogsPath),
       where('userId', '==', userId)
     );
   }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(studyLogsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLogs(fetchedLogs.slice(0, 10)); 
    }, (error) => {
      console.error("Lỗi lắng nghe study logs: ", error);
    });
    return () => unsubscribe();
  }, [studyLogsQuery]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (totalMinutes <= 0) {
      setError('Thời gian học phải lớn hơn 0.');
      return;
    }

    setIsLoading(true);
    
    try {
      const totalHours = totalMinutes / 60;
      const pointsEarned = Math.round(totalHours * 20);

      const logData = {
        userId,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
        totalHours: totalHours,
        points: pointsEarned,
        date: getISODate(),
        // Không có imageUrl
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, studyLogsPath), logData);
      
      onStudyLogged(pointsEarned);
      
      setHours(0);
      setMinutes(0);
      e.target.reset();

    } catch (err) {
      console.error("Lỗi ghi giờ học: ", err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <BookOpen size={24} className="mr-2 text-green-600" />
        Ghi lại Giờ học (+20 điểm/giờ)
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">Giờ</label>
            <input
              id="hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-1">Phút</label>
            <input
              id="minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              min="0"
              max="59"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Ghi lại'}
        </button>
      </form>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Lịch sử gần đây</h3>
        {logs.length > 0 ? (
          <ul className="space-y-3">
            {logs.map(log => (
              <li key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-800">
                    {log.hours} giờ {log.minutes} phút
                    <span className="ml-2 text-green-600 font-bold">(+{log.points} điểm)</span>
                  </p>
                  <p className="text-sm text-gray-500">{log.date}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 italic py-4">Chưa có lịch sử học tập.</p>
        )}
      </div>
    </div>
  );
}

/**
 * Modal hiển thị Báo cáo Biểu đồ (Giữ nguyên)
 */
function ReportModal({ userId, onClose }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const processData = useCallback((logs) => {
    const monthLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const aggregatedData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString(),
      hours: 0,
    }));

    monthLogs.forEach(log => {
      const dayOfMonth = new Date(log.date).getDate();
      aggregatedData[dayOfMonth - 1].hours += log.totalHours || 0;
    });

    setData(aggregatedData.map(d => ({ ...d, hours: parseFloat(d.hours.toFixed(2)) })));
  }, [currentMonth, currentYear]);

  useEffect(() => {
    setIsLoading(true);
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, studyLogsPath), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const allLogs = querySnapshot.docs.map(doc => doc.data());
        processData(allLogs);
      } catch (error) {
        console.error("Lỗi tải báo cáo: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [userId, processData]);
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('vi-VN', { month: 'long' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Báo cáo Giờ học (Tháng {monthName} / {currentYear})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={28} />
          </button>
        </div>
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Ngày', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Số giờ học', angle: -90, position: 'insideLeft', offset: 10 }} />
                <Tooltip formatter={(value) => [`${value} giờ`, "Giờ học"]} />
                <Legend />
                <Bar dataKey="hours" fill="#2563eb" name="Giờ học" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component App chính (ĐÃ CẬP NHẬT)
 */
export default function App() {
  const [userAuth, setUserAuth] = useState(null); // Đối tượng Auth của Firebase
  const [userId, setUserId] = useState(null); // Chỉ là user.uid
  const [currentUser, setCurrentUser] = useState(null); // Dữ liệu từ Firestore
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // 1. Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserAuth(user);
        setUserId(user.uid);
      } else {
        setUserAuth(null);
        setUserId(null);
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Lắng nghe dữ liệu User từ Firestore khi có userId
  useEffect(() => {
    if (!userId) {
      setShowSignup(false);
      return;
    }

    const userRef = doc(db, usersPath, userId);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUser(docSnap.data());
        setShowSignup(false);
      } else {
        setShowSignup(true);
      }
    }, (error) => {
      console.error("Lỗi lắng nghe user data: ", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất: ", error);
    }
  };

  const handleSignupSuccess = (userData) => {
    setCurrentUser(userData);
    setShowSignup(false);
    setShowCodeModal(true);
  };
  
  // Callback khi ghi giờ học
  const handleStudyLogged = useCallback(async (pointsEarned) => {
    if (!userId) return;
    try {
      const userRef = doc(db, usersPath, userId);
      await updateDoc(userRef, {
        points: increment(pointsEarned)
      });
    } catch (error) {
      console.error("Lỗi cộng điểm học: ", error);
    }
  }, [userId]);

  // Callback MỚI khi hoàn thành To-do trong Mục tiêu
  const handleGoalTodoComplete = useCallback(async (pointsToAdd) => {
    if (!userId) return;
    try {
      const userRef = doc(db, usersPath, userId);
      await updateDoc(userRef, {
        points: increment(pointsToAdd) // Cộng 2 điểm
      });
    } catch (error) {
      console.error("Lỗi cộng điểm to-do: ", error);
    }
  }, [userId]);
  
  
  const copyCodeToClipboard = () => {
    if (currentUser?.publicCode) {
      const el = document.createElement('textarea');
      el.value = currentUser.publicCode;
      document.body.appendChild(el);
      el.select();
      try {
        // Dùng execCommand vì navigator.clipboard có thể bị chặn trong iframe
        document.execCommand('copy');
        
        // Tạo một thông báo tùy chỉnh thay vì alert()
        const copyMessage = document.createElement('div');
        copyMessage.textContent = 'Đã sao chép mã code!';
        copyMessage.style.position = 'fixed';
        copyMessage.style.bottom = '20px';
        copyMessage.style.left = '50%';
        copyMessage.style.transform = 'translateX(-50%)';
        copyMessage.style.backgroundColor = '#333';
        copyMessage.style.color = 'white';
        copyMessage.style.padding = '10px 20px';
        copyMessage.style.borderRadius = '5px';
        copyMessage.style.zIndex = '1000';
        document.body.appendChild(copyMessage);
        setTimeout(() => {
          document.body.removeChild(copyMessage);
        }, 2000);

      } catch (err) {
        console.error('Không thể sao chép');
      }
      document.body.removeChild(el);
    }
  };

  // Màn hình loading
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <p className="ml-4 text-lg text-gray-700">Đang khởi động...</p>
      </div>
    );
  }

  // Màn hình Đăng nhập
  if (!userAuth) {
    return <LoginScreen />;
  }

  // Màn hình Đăng ký (nhập tên)
  if (showSignup) {
    return <SignupModal userAuth={userAuth} onSignupSuccess={handleSignupSuccess} />;
  }
  
  // Màn hình chính của ứng dụng
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-inter">
        {/* Header */}
        <header className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Chào mừng, {currentUser.name}!
              </h1>
              <div 
                className="flex items-center text-gray-600 mt-2 group cursor-pointer"
                onClick={copyCodeToClipboard}
                title="Sao chép mã code"
              >
                <User size={16} className="mr-1.5" />
                <span>Mã code của bạn:</span>
                <span className="ml-1.5 font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  {currentUser.publicCode}
                </span>
                <Copy size={14} className="ml-2 text-gray-400 group-hover:text-blue-600 transition" />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
               <div className="flex space-x-4">
                <div className="text-center p-3 bg-yellow-100 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Tổng Điểm</div>
                  <div className="text-2xl font-bold text-yellow-900">{currentUser.points}</div>
                </div>
                {/* ĐÃ BỎ ĐIỂM STREAK */}
              </div>
              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-semibold hover:bg-gray-300 transition duration-300 flex items-center justify-center"
              >
                <LogOut size={16} className="mr-2" />
                Đăng xuất
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="mt-6 w-full md:w-auto bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
          >
            <TrendingUp size={20} className="mr-2" />
            Xem Báo cáo Giờ học
          </button>
        </header>

        {/* Main Content Grid (ĐÃ CẬP NHẬT) */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột Mục tiêu chiếm 1 nửa */}
          <div className="lg:col-span-1 space-y-8">
            <GoalsPanel 
              userId={userId} 
              onGoalTodoComplete={handleGoalTodoComplete} // Truyền callback mới
            />
          </div>
          {/* Cột Ghi giờ học chiếm 1 nửa */}
          <div className="lg:col-span-1">
            <StudyLoggerPanel 
              userId={userId} 
              onStudyLogged={handleStudyLogged} 
            />
          </div>
        </main>
        
        {/* Modals (Giữ nguyên) */}
        {showReport && (
          <ReportModal userId={userId} onClose={() => setShowReport(false)} />
        )}
        
        {showCodeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Đăng ký thành công!</h2>
              <p className="text-gray-600 mb-6">Mã code của bạn là:</p>
              <div 
                className="inline-flex items-center bg-gray-100 px-6 py-3 rounded-lg font-mono text-3xl font-bold text-blue-700 cursor-pointer"
                onClick={copyCodeToClipboard}
                title="Sao chép"
              >
                {currentUser.publicCode}
                <Copy size={20} className="ml-3 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Đây là mã định danh CÔNG KHAI của bạn.
                <b>KHÔNG dùng mã này để đăng nhập.</b>
                Để đăng nhập, hãy dùng tài khoản Google của bạn.
              </p>
              <button
                onClick={() => setShowCodeModal(false)}
                className="mt-8 w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback (giữ nguyên)
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <Loader2 size={48} className="animate-spin text-blue-600" />
      <p className="ml-4 text-lg text-gray-700">Đang tải dữ liệu người dùng...</p>
    </div>
  );
}

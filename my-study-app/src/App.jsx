import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  getDocs,
  deleteDoc,
  orderBy,
  Timestamp,
  serverTimestamp,
  limit // <-- ĐÃ THÊM DÒNG NÀY ĐỂ SỬA LỖI
} from 'firebase/firestore';
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
  Loader2,
  User,
  Copy,
  LogOut,
  LogIn,
  Archive,
  Eye,
  EyeOff,
  Edit2, // Sửa Goal/Sub-task
  Save,  // Lưu
  AlertTriangle, // Cảnh báo
  Play,  // Bấm giờ
  StopCircle, // Dừng
  Bold, // Ghi chú
  Italic, // Ghi chú
  Underline, // Ghi chú
  List, // Ghi chú
  Trash2, // Xóa
  Clock, // Countdown
  MessageSquare, // Reflection
  Notebook, // Ghi chú
  History, // Recent History
  Award // Thành tích
} from 'lucide-react';
import ContentEditable from 'react-contenteditable/lib/react-contenteditable.js'; // <-- SỬA LỖI BẰNG CÁCH CHỈ RÕ ĐƯỜNG DẪN

// --- CẤU HÌNH FIREBASE ---
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

// --- CẤU TRÚC DATABASE V1 (ĐÃ SỬA LỖI) ---
const usersPath = 'users';
const publicCodesPath = 'publicCodes';
const goalsPath = 'goals';
const goalTodosPath = 'goalTodos';
const studyLogsPath = 'studyLogs';
const notesPath = 'notes';

// --- Helper Functions ---

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

const getISODate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Helper (Hàm thông dịch) MỚI: Đọc an toàn CẢ data cũ (lỗi String) và data mới (Timestamp)
function getDisplayDate(timestamp) {
  if (!timestamp) return 'Just now';
  
  // Case 1: Data mới (chuẩn Timestamp của Firebase)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }
  // Case 2: Data cũ (bị lỗi String) - Fix lỗi `M.createdAt.toDate is not a function`
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString();
    }
  }
  // Case 3: Fallback (Dự phòng)
  try {
    // Nếu là đối tượng Date hoặc timestamp không chuẩn, vẫn cố gắng đọc
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString();
    }
    return 'Invalid date';
  } catch (e) {
    return 'Invalid date';
  }
}

/**
 * Login Screen
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
    } catch (err) {
      console.error("Google Login Error: ", err);
      setError('Could not sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4 font-quicksand">
      <div className="bg-white p-10 rounded-lg shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome!</h1>
        <p className="text-gray-600 mb-8">
          Sign in to start managing your goals and tracking your study progress.
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
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Signup Modal
 */
function SignupModal({ userAuth, onSignupSuccess }) {
  const [name, setName] = useState(() => userAuth.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
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
        createdAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(userRef, newUser);
      batch.set(doc(db, publicCodesPath, publicCode), { userId });
      
      await batch.commit();
      
      onSignupSuccess({ ...newUser, createdAt: new Date().toISOString() });
    } catch (err) {
      console.error("Signup Error: ", err);
      setError('An error occurred while creating your account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome, new user!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Please confirm your name to get started.
        </p>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Name"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Start my Journey'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- V3.0: TÁCH RIÊNG COMPONENT SUB-TASK (ĐỂ QUẢN LÝ "SỬA") ---
function SubTaskItem({ todo, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.task);
  const [editDate, setEditDate] = useState(todo.date);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editText.trim() || !editDate) return;
    setIsLoading(true);
    
    try {
      const todoRef = doc(db, goalTodosPath, todo.id);
      await updateDoc(todoRef, {
        task: editText.trim(),
        date: editDate,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating sub-task: ", error);
    }
    setIsLoading(false);
  };

  if (isEditing) {
    return (
      <li className="bg-white p-2 rounded-md shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-lg font-bold focus:outline-none focus:ring-1 focus:ring-goal"
            required
          />
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-goal"
            required
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="text-sm bg-goal text-white px-3 py-1 rounded-md hover:opacity-80 disabled:bg-gray-400 flex items-center"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center bg-todo p-2 rounded-md shadow-sm group">
      <button onClick={onToggle} className="mr-2 shrink-0">
        {todo.completed ? (
          <CheckCircle size={20} className="text-green-600" />
        ) : (
          <Circle size={20} className="text-goal" />
        )}
      </button>
      <span className={`grow text-sm ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {todo.task}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-700 transition-opacity shrink-0"
        title="Edit sub-task"
      >
        <Edit2 size={16} />
      </button>
      <button
        onClick={onDelete}
        className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity shrink-0"
        title="Delete sub-task"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

// --- V3.0: TÁCH RIÊNG COMPONENT COUNTDOWN (ĐẾM NGƯỢC) ---
function CountdownTimer({ targetDate }) {
  const [daysLeft, setDaysLeft] = useState(null);
  const [colorClass, setColorClass] = useState('text-gray-600');

  useEffect(() => {
    const calculateDaysLeft = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày
      const target = new Date(targetDate + "T00:00:00"); // Đảm bảo targetDate là đầu ngày
      
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysLeft(diffDays);

      // Cập nhật màu sắc
      if (diffDays < 0) {
        setColorClass('text-red-600 font-bold'); // Quá hạn
      } else if (diffDays <= 3) {
        setColorClass('text-red-500 font-bold animate-pulse'); // Sắp hết hạn
      } else if (diffDays <= 7) {
        setColorClass('text-yellow-600 font-medium'); // Còn 1 tuần
      } else {
        setColorClass('text-green-600 font-medium'); // Còn nhiều thời gian
      }
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60 * 24);
    return () => clearInterval(interval);
  }, [targetDate]);

  const getMessage = () => {
    if (daysLeft === null) {
      return <Loader2 size={14} className="animate-spin" />;
    }
    if (daysLeft < 0) {
      return `Overdue by ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'day' : 'days'}`;
    }
    if (daysLeft === 0) {
      return 'Due Today!';
    }
    return `Only ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left!`;
  };

  return (
    <div className={`text-sm flex items-center ${colorClass}`}>
      <Clock size={14} className="mr-1" />
      {getMessage()}
    </div>
  );
}

/**
 * Goal Item (V3.0 - ĐÃ VIẾT LẠI HOÀN TOÀN)
 */
function GoalItem({ goal, userId, onGoalTodoComplete, onGoalAchieved }) {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTodoDate, setNewTodoDate] = useState(getISODate());
  const [isLoading, setIsLoading] = useState(false);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalTitle, setEditGoalTitle] = useState(goal.title);
  const [editGoalDate, setEditGoalDate] = useState(goal.endDate);

  const goalTodosQuery = useMemo(() => {
    return query(
      collection(db, goalTodosPath),
      where('userId', '==', userId),
      where('goalId', '==', goal.id)
    );
  }, [userId, goal.id]);

  useEffect(() => {
    const unsubscribe = onSnapshot(goalTodosQuery, (snapshot) => {
      const fetchedTodos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedTodos.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime;
      });
      setTodos(fetchedTodos);
    }, (error) => {
      console.error("Goal Todos listener error: ", error);
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
        date: newTodoDate,
        completed: false,
        createdAt: serverTimestamp(), // <-- ĐÃ SỬA
      });
      setNewTask('');
      setNewTodoDate(getISODate());
    } catch (error) {
      console.error("Error adding sub-task: ", error);
    }
    setIsLoading(false);
  };

  const toggleTodo = async (todoId, currentStatus) => {
    const isCompleting = !currentStatus;
    const pointsToAdd = isCompleting ? 2 : -2;
    try {
      const todoRef = doc(db, goalTodosPath, todoId);
      await updateDoc(todoRef, { completed: isCompleting });
      onGoalTodoComplete(pointsToAdd);
    } catch (error) {
      console.error("Error updating sub-task: ", error);
    }
  };
  const handleDeleteTodo = async (todo) => {
    // Mình tạm dùng window.confirm cho nhanh, vì nó đơn giản
    if (!window.confirm(`Bạn có chắc muốn xóa sub-task: "${todo.task}"?`)) {
      return; // Người dùng bấm "Cancel"
    }

    try {
      // 1. Xóa sub-task khỏi database
      const todoRef = doc(db, goalTodosPath, todo.id);
      await deleteDoc(todoRef);
      
      // 2. TRỪ ĐIỂM (quan trọng!)
      // Nếu sub-task này đã hoàn thành, thì khi xóa, phải trừ 2 điểm
      if (todo.completed) {
        onGoalTodoComplete(-2); // Gửi -2 điểm
      }
      // Nếu chưa hoàn thành thì không trừ điểm
      
    } catch (error) {
      console.error("Error deleting sub-task: ", error);
    }
  };
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    if (!editGoalTitle.trim() || !editGoalDate) return;
    setIsLoading(true);
    try {
      const goalRef = doc(db, goalsPath, goal.id);
      await updateDoc(goalRef, {
        title: editGoalTitle.trim(),
        endDate: editGoalDate,
      });
      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error updating goal: ", error);
    }
    setIsLoading(false);
  };
  
  const handleMarkGoalComplete = () => {
    onGoalAchieved(goal); 
  };

  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
  
  const groupedTodos = todos.reduce((acc, todo) => {
    const date = todo.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(todo);
    return acc;
  }, {});

  return (
    <div className={`p-4 rounded-lg shadow-lg border-l-4 ${goal.completed ? 'bg-gray-200 border-gray-400 opacity-70' : 'bg-goal-form border-goal'}`}>
      
      {isEditingGoal ? (
        <form onSubmit={handleUpdateGoal} className="space-y-2 p-2 bg-white rounded-md shadow-inner">
          <input
            type="text"
            value={editGoalTitle}
            onChange={(e) => setEditGoalTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-lg font-bold focus:outline-none focus:ring-2 focus:ring-goal"
            required
          />
          <input
            type="date"
            value={editGoalDate}
            onChange={(e) => setEditGoalDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-goal"
            required
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditingGoal(false)}
              className="text-sm text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="text-sm bg-goal text-white px-3 py-1 rounded-md hover:opacity-80 disabled:bg-gray-400 flex items-center"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save Goal
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-start group">
          <div>
            <h3 className={`text-xl font-bold ${goal.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
              {goal.title}
            </h3>
            <p className="text-sm text-gray-700 flex items-center mt-1">
              <Calendar size={14} className="mr-1" />
              Goal Deadline: {goal.endDate}
            </p>
            {!goal.completed && <CountdownTimer targetDate={goal.endDate} />}
            {goal.completed && goal.reflection && (
              <p className="text-sm text-gray-600 italic mt-2 bg-white/50 p-2 rounded-md">Reflection: "{goal.reflection}"</p>
            )}
          </div>
          <div className='flex flex-col items-end space-y-2'>
            {!goal.completed && (
              <button
                onClick={handleMarkGoalComplete}
                title="Mark entire goal as complete"
                className="text-sm bg-green-600 text-white py-1 px-3 rounded-full hover:bg-green-700 transition shadow-md flex items-center"
              >
                <Archive size={16} className="mr-1" /> Achieved
              </button>
            )}
            {!goal.completed && (
              <button
                onClick={() => setIsEditingGoal(true)}
                title="Edit this goal"
                className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-700 transition-opacity"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {totalTodos > 0 && !goal.completed && (
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-800">Progress: {completedTodos}/{totalTodos}</span>
          <div className="w-full bg-goal rounded-full h-2.5 mt-1">
            <div 
              className="bg-[#f08080] h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 pl-4 border-l-2 border-goal">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Sub-Tasks (+2 pts each):</h4>
        
        <div className="space-y-3">
          {Object.keys(groupedTodos).length > 0 ? (
            Object.entries(groupedTodos).map(([date, dateTodos]) => (
              <div key={date} className="bg-white/60 p-3 rounded-lg shadow-inner">
                <h5 className="semibold text-sm text-gray-700 mb-2 border-b border-goal-form pb-1">
                  Due: {date}
                </h5>
                <ul className="space-y-2">
                  {dateTodos.map(todo => (
                    <SubTaskItem
                      key={todo.id}
                      todo={todo}
                      onToggle={() => toggleTodo(todo.id, todo.completed)}
                      onUpdate={() => {}}
                      onDelete={() => handleDeleteTodo(todo)}
                    />
                  ))}
                </ul>
              </div>
            ))
          ) : (
             !goal.completed && <p className="text-sm text-gray-700 italic">No sub-tasks added yet.</p>
          )}
        </div>

        {!goal.completed && (
          <form onSubmit={handleAddTodo} className="mt-4 space-y-2">
            <div className="flex">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="grow px-3 py-1.5 border border-gray-300 rounded-l-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-goal"
                placeholder="Add new sub-task..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1.5 bg-goal text-white rounded-r-md hover:opacity-80 disabled:bg-gray-400 flex items-center justify-center shadow-sm"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Due Date for new task:</label>
              <input
                type="date"
                value={newTodoDate}
                onChange={(e) => setNewTodoDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-goal"
                min={getISODate()}
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
 * V3.0: MODAL XÁC NHẬN HOÀN THÀNH GOAL
 */
function GoalCompletionModal({ goal, onClose, onConfirm }) {
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reflection.trim()) {
      setError('Reflection note is required to complete a goal.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      await onConfirm(reflection.trim());
      onClose(); 
    } catch (err) {
      console.error("Error confirming completion: ", err);
      setError("Failed to save. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <CheckCircle size={24} className="mr-2 text-green-600" />
            Goal Achieved!
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-gray-700 mb-2">You are about to complete the goal:</p>
        <p className="text-lg font-bold text-goal mb-4">{goal.title}</p>
        
        <div className="mb-4">
          <label htmlFor="reflection" className="block text-sm font-medium text-gray-700 mb-1">
            Reflection Note (Required)
          </label>
          <p className="text-xs text-gray-500 mb-2">What did you learn? How did you change?</p>
          <textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g., I learned to be more disciplined..."
          />
        </div>
        
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm & Get +100 Points'}
        </button>
      </div>
    </div>
  );
}


/**
 * Goals Panel (V3.0)
 */
function GoalsPanel({ userId, onGoalTodoComplete, onGoalAchieved, onViewArchived }) {
  const [goals, setGoals] = useState([]);

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
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setGoals(fetchedGoals);
    }, (error) => {
      console.error("Goals listener error: ", error);
    });
    return () => unsubscribe();
  }, [goalsQuery]);
  
  const activeGoals = goals.filter(g => !g.completed);
  const archivedGoalsCount = goals.filter(g => g.completed).length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Target size={28} className="mr-2 text-goal" />
        My Goals
      </h2>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-goal-form pb-2">Active Goals</h3>
        {activeGoals.length > 0 ? (
          <div className="space-y-4">
            {activeGoals.map(goal => (
              <GoalItem 
                key={goal.id} 
                goal={goal} 
                userId={userId}
                onGoalTodoComplete={onGoalTodoComplete}
                onGoalAchieved={onGoalAchieved}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-4">You have no active goals. Add one above!</p>
        )}
        
        {/* NÚT MỚI: HIỂN THỊ ARCHIVED GOALS DẠNG BUTTON NỔI */}
        <div className="pt-4 border-t border-gray-100">
           <button
            onClick={onViewArchived} // <-- GỌI MODAL TỪ APP.JSX
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-semibold shadow-md hover:bg-gray-300 transition duration-300 flex items-center justify-center"
          >
            <Archive size={16} className="mr-2" /> View Archived Goals ({archivedGoalsCount})
          </button>
        </div>
      </div>
      
      {/* ĐÃ XÓA TOÀN BỘ PHẦN HIỂN THỊ ARCHIVED GOALS INLINE CŨ */}
    </div>
  );
}
        

/**
 * V3.0: VIẾT LẠI HOÀN TOÀN Study Logger Panel (Bấm giờ)
 */
function StudyLoggerPanel({ userId, onStudyLogged, onViewHistory }) { // <-- ĐÃ THÊM onViewHistory
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]); // Giữ logs để tính MINIMUM_LOG_SECONDS
  const [isLoading, setIsLoading] = useState(false);
  // Loại bỏ showHistory state

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // SỬA LỖI: Thêm "limit" vào query
  const studyLogsQuery = useMemo(() => {
     return query(
       collection(db, studyLogsPath),
       where('userId', '==', userId),
       orderBy("createdAt", "desc"),
       limit(5)
     );
   }, [userId]);

  useEffect(() => {
    // Chỉ lắng nghe logs, không cần show ra ở đây nữa
    const unsubscribe = onSnapshot(studyLogsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(fetchedLogs);
    }, (error) => {
      console.error("Study logs listener error: ", error);
    });
    return () => unsubscribe();
  }, [studyLogsQuery]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - (time * 1000);
      timerRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, time]);
  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRunning && time > 0) {
        e.preventDefault();
        e.returnValue = 'You have a study session in progress. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning, time]);

  const handleStart = () => {
    setError('');
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleLogAndReset = async () => {
    if (isRunning) {
      setError('Please stop the timer before logging.');
      return;
    }
    
    const MINIMUM_LOG_SECONDS = 15 * 60; // 15 phút
    
    if (time < MINIMUM_LOG_SECONDS) {
      setError(`Minimum study session is 15 minutes to log. (Current: ${formatTime(time)})`);
      setTime(0); // Vẫn reset
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const totalHours = time / 3600;
      const pointsEarned = Math.round(totalHours * 20);
      
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);

      const logData = {
        userId,
        hours: hours,
        minutes: minutes,
        totalHours: totalHours,
        points: pointsEarned,
        date: getISODate(),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, studyLogsPath), logData);
      
      onStudyLogged(pointsEarned);
      setTime(0);

    } catch (err) {
      console.error("Error logging study time: ", err);
      setError('An error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
        <BookOpen size={28} className="mr-2 text-study" />
        Study Timer
      </h2>
      <p className="text-sm text-gray-600 mb-4">(+20 points per hour)</p>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="p-6 bg-study rounded-lg border border-blue-200 shadow-md text-center">
        <div className="font-mono text-6xl font-bold text-gray-900 mb-4">
          {formatTime(time)}
        </div>
        <div className="flex justify-center space-x-4 mb-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="w-24 bg-green-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-green-700 transition duration-300 flex items-center justify-center"
            >
              <Play size={16} className="mr-1" /> Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-24 bg-red-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-red-700 transition duration-300 flex items-center justify-center"
            >
              <StopCircle size={16} className="mr-1" /> Stop
            </button>
          )}
        </div>
        
        <button
          onClick={handleLogAndReset}
          disabled={isLoading || isRunning}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Log & Reset Session (Min 15min)'}
        </button>
        
        {/* NÚT MỚI: HIỂN THỊ LỊCH SỬ DẠNG BUTTON NỔI */}
        <button
          onClick={onViewHistory}
          className="w-full mt-3 bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-semibold shadow-md hover:bg-gray-300 transition duration-300 flex items-center justify-center"
        >
          <History size={16} className="mr-2" /> View Full History
        </button>
      </div>
      
      {/* ĐÃ LOẠI BỎ PHẦN HISTORY DÀI XUỐNG DƯỚI */}
    </div>
  );
}
/**
 * (MỚI) Modal Hiển thị Lịch sử Học tập Chi tiết
 */
function StudyHistoryModal({ userId, onClose }) {
  const [allLogs, setAllLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tải TẤT CẢ logs (không giới hạn)
  useEffect(() => {
    const fetchAllLogs = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, studyLogsPath),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching all study logs: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllLogs();
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <History size={24} className="mr-2 text-study" />
            Full Study History
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-y-auto space-y-3 pr-2">
            {allLogs.length > 0 ? (
              allLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md shadow-sm border-l-4 border-study">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {log.hours}h {log.minutes}m
                      <span className="ml-2 text-green-700 font-bold">(+{log.points} pts)</span>
                    </p>
                    <p className="text-sm text-gray-600">{getDisplayDate(log.createdAt)}</p>
                  </div>
                  <span className="text-sm text-gray-500">{log.date}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 italic py-8">No study sessions logged yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// --- (MỚI) Component Thanh Công Cụ (Toolbar) ---
// Component này chứa các nút (B, I, U, Bullet, Header)
function NotesToolbar({ onCommand }) {
  const tools = [
    { cmd: 'bold', icon: <Bold size={16} />, value: null, title: 'In đậm (Ctrl+B)' },
    { cmd: 'italic', icon: <Italic size={16} />, value: null, title: 'In nghiêng (Ctrl+I)' },
    { cmd: 'underline', icon: <Underline size={16} />, value: null, title: 'Gạch chân (Ctrl+U)' },
    { cmd: 'insertUnorderedList', icon: <List size={16} />, value: null, title: 'Bullet Point (Tab/Ctrl+Shift+8)' },
  ];

  const handleMouseDown = (e, cmd, value) => {
    e.preventDefault(); // Ngăn không cho <ContentEditable> bị mất focus
    
    if (cmd === 'insertUnorderedList') {
        // Fix lỗi Bullet point không hoạt động
        document.execCommand('insertHTML', false, '<ul><li>• &nbsp;</li></ul>');
    } else if (cmd === 'formatBlock' && value === '<h2>') {
        // Fix lỗi Header: dùng thẻ H2 và xóa định dạng cũ
        document.execCommand('formatBlock', false, '<h2>');
        document.execCommand('bold', false, null); // Giữ cho nó đậm
    } else {
        document.execCommand(cmd, false, value); // Thực hiện các lệnh B, I, U
    }
  };

  return (
    <div className="bg-gray-100 p-2 rounded-t-lg border-b border-gray-300 flex space-x-2">
      {tools.map((tool) => (
        <button
          key={tool.cmd + tool.value}
          type="button" // <--- Đã thêm type="button" để ngăn form submit
          onMouseDown={(e) => handleMouseDown(e, tool.cmd, tool.value)}
          className="p-2 rounded-md hover:bg-gray-200 text-gray-700"
          title={tool.title}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

// --- V4.3: COMPONENT HIỂN THỊ VÀ CHỈNH SỬA GHI CHÚ ĐÃ LƯU ---
function NoteItemEditable({ note, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editHtml, setEditHtml] = useState(note.content);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref để giữ con trỏ chuột
  const contentRef = useRef(null);

  const handleUpdate = async () => {
    if (!editHtml.trim()) return;
    setIsLoading(true);

    try {
      const noteRef = doc(db, notesPath, note.id);
      await updateDoc(noteRef, {
        content: editHtml.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating note: ", error);
      alert("Error updating note! Check F12 Console.");
    }
    setIsLoading(false);
  };
  
  const handleToolbarCommand = (command, value) => {
    // Phải đảm bảo ContentEditable đang focus trước khi chạy execCommand
    if (contentRef.current) {
        contentRef.current.focus();
    }
    
    if (command === 'insertUnorderedList') {
        document.execCommand('insertHTML', false, '<li> &nbsp;</li>');
    } else {
        document.execCommand(command, false, value);
    }
    
    // Cập nhật lại HTML sau khi lệnh được thực thi (để đồng bộ state)
    // Sửa lỗi tự ngắt: Dùng requestAnimationFrame để cho phép DOM cập nhật xong
    requestAnimationFrame(() => {
        if (contentRef.current) {
             setEditHtml(contentRef.current.innerHTML);
        }
    });
  };
  
  // Lấy ra HTML ban đầu khi bắt đầu chỉnh sửa
  useEffect(() => {
    if (isEditing) {
      setEditHtml(note.content);
    }
  }, [isEditing, note.content]);
  
  return (
    <div className="note-item bg-gray-50 p-4 rounded-lg shadow-sm">
      
      {isEditing ? (
        // Chế độ CHỈNH SỬA
        <>
          <NotesToolbar onCommand={(cmd, value) => handleToolbarCommand(cmd, value)} />
          <ContentEditable
            innerRef={contentRef}
            html={editHtml}
            onChange={(e) => setEditHtml(e.target.value)}
            className="prose prose-sm max-w-none w-full p-4 h-48 border border-gray-300 rounded-b-lg shadow-inner overflow-y-auto focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm text-gray-600 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isLoading}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 disabled:bg-gray-400 flex items-center"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
            </button>
          </div>
        </>
      ) : (
        // Chế độ XEM
        <>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-500">
              {getDisplayDate(note.createdAt)}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-gray-700 transition-opacity"
                title="Edit note"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="text-gray-400 hover:text-red-600 transition-opacity"
                title="Delete note"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div
            className="prose prose-sm max-w-none" 
            dangerouslySetInnerHTML={{ __html: note.content }} 
          />
        </>
      )}
    </div>
  );
}

// --- (MỚI) Component Ghi Chú (Bản "Google Docs") ---
function NotesPanel({ userId }) {
  const [notes, setNotes] = useState([]);
  const [newNoteHtml, setNewNoteHtml] = useState(''); // <-- Giờ dùng HTML
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef(null); // Ref cho ContentEditable mới
  
  // (Query này phải chạy được, nếu bạn đã "Tạo Chỉ mục" (Index) trên Firebase)
  const notesQuery = useMemo(() => {
    return query(
      collection(db, notesPath),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(fetchedNotes);
      setIsLoading(false);
    }, (error) => {
      // (LỖI "Requires an index" sẽ xuất hiện ở Console F12 nếu bạn chưa click link)
      console.error("Notes listener error: ", error); 
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [notesQuery]);

  const handleNoteChange = (e) => {
    setNewNoteHtml(e.target.value); // Cập nhật state với HTML mới
  };

  const handleToolbarCommand = (command, value) => {
    // Phải đảm bảo ContentEditable đang focus trước khi chạy execCommand
    if (contentRef.current) {
        contentRef.current.focus();
    }
    
    if (command === 'insertUnorderedList') {
        document.execCommand('insertHTML', false, '<li> &nbsp;</li>');
    } else {
        document.execCommand(command, false, value);
    }
    
    // Sửa lỗi ngắt note: Sau khi lệnh được thực thi, dùng requestAnimationFrame để đồng bộ state
    requestAnimationFrame(() => {
        if (contentRef.current) {
             setNewNoteHtml(contentRef.current.innerHTML);
        }
    });
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!newNoteHtml.trim()) return;
    setIsLoading(true);
    
    try {
      await addDoc(collection(db, notesPath), {
        userId,
        content: newNoteHtml.trim(), // <-- Lưu HTML
        createdAt: serverTimestamp(),
      });
      setNewNoteHtml(''); // Reset
      if (contentRef.current) { // Xóa nội dung trong editor sau khi lưu
          contentRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error("Error saving note: ", error);
      alert("Error saving note! Check F12 Console for details. (Did you fix Firestore Rules/Indexes?)");
    }
    setIsLoading(false);
  };
  
  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Bạn có chắc muốn xóa ghi chú này vĩnh viễn?")) {
      try {
        const noteRef = doc(db, notesPath, noteId);
        await deleteDoc(noteRef);
      } catch (error) {
        console.error("Error deleting note: ", error);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
        <Notebook size={28} className="mr-2 text-yellow-600" />
        My Notes
      </h2>
      
      {/* KHUNG SOẠN THẢO MỚI (v4.0) */}
      <form onSubmit={handleSaveNote} className="mb-6">
        <NotesToolbar onCommand={handleToolbarCommand} />
        <ContentEditable
          innerRef={contentRef} // Gán ref
          html={newNoteHtml}
          onChange={handleNoteChange}
          className="prose prose-sm max-w-none w-full p-4 h-48 border border-gray-300 rounded-b-lg shadow-inner overflow-y-auto focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 bg-yellow-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-yellow-700 transition duration-300 disabled:bg-gray-400"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Save Note'}
        </button>
      </form>
      
      {/* DANH SÁCH GHI CHÚ ĐÃ LƯU */}
      <div className="h-full overflow-y-auto space-y-4 pr-2">
        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-yellow-200 pb-2">Saved Notes</h3>
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-yellow-600" />
          </div>
        )}
        {!isLoading && notes.length === 0 && (
          <p className="text-center text-gray-500 italic py-4">No notes saved yet.</p>
        )}
        {!isLoading && notes.map(note => (
          <NoteItemEditable 
            key={note.id} 
            note={note} 
            onDelete={handleDeleteNote}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * (MỚI) Modal Hiển thị Mục tiêu đã hoàn thành (Archived Goals)
 */
function ArchivedGoalsModal({ userId, onClose }) {
  const [allArchivedGoals, setAllArchivedGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tải TẤT CẢ mục tiêu đã hoàn thành (Tương tự StudyHistoryModal)
  useEffect(() => {
    const fetchArchivedGoals = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, goalsPath),
          where("userId", "==", userId),
          orderBy("endDate", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedGoals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // BỘ LỌC JAVASCRIPT: Lọc ra các mục tiêu có completed là truthy
        // Logic này tương đương với logic đếm archivedGoalsCount, nên nó sẽ tìm thấy 9 mục tiêu của bạn
        const archivedGoals = fetchedGoals.filter(g => g.completed); 
        
        setAllArchivedGoals(archivedGoals); 
      } catch (error) {
        console.error("Error fetching archived goals: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArchivedGoals();
  }, [userId]);

  return (
    // Dùng layout Modal cố định (fixed inset-0)
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Archive size={24} className="mr-2 text-gray-600" />
            Archived Goals History
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-gray-600" />
          </div>
        ) : (
          <div className="overflow-y-auto space-y-3 pr-2">
            {allArchivedGoals.length > 0 ? (
              allArchivedGoals.map(goal => (
                <div key={goal.id} className="p-3 bg-gray-100 rounded-md shadow-sm border-l-4 border-gray-400">
                  <h4 className="font-bold text-gray-800">{goal.title}</h4>
                  <p className="text-sm text-gray-600">Achieved on: {getDisplayDate(goal.createdAt)}</p>
                  {goal.reflection && <p className="text-xs italic mt-1">Reflection: "{goal.reflection}"</p>}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 italic py-8">No goals have been archived yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Report Modal
 */
function ReportModal({ userId, onClose }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const processData = useCallback((logs) => {
    // SỬA LỖI: Đổi logic đọc ngày tháng để an toàn hơn
    const monthLogs = logs.filter(log => {
      const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.date || log.createdAt);
      if (isNaN(logDate.getTime())) return false; // Bỏ qua ngày không hợp lệ
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const aggregatedData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString(),
      hours: 0,
    }));

    monthLogs.forEach(log => {
      const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.date || log.createdAt);
      const dayOfMonth = logDate.getDate();
      aggregatedData[dayOfMonth - 1].hours += log.totalHours || 0;
    });

    setData(aggregatedData.map(d => ({ ...d, hours: parseFloat(d.hours.toFixed(2)) })));
  }, [currentMonth, currentYear]);

  useEffect(() => {
    setIsLoading(true);
    const fetchLogs = async () => {
      try {
        // Lấy hết logs, sau đó processData sẽ lọc theo tháng/năm
        const q = query(collection(db, studyLogsPath), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const allLogs = querySnapshot.docs.map(doc => doc.data());
        processData(allLogs);
      } catch (error) {
        console.error("Error loading report: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [userId, processData]);
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Study Report ({monthName} / {currentYear})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={28} />
          </button>
        </div>
        {isLoading ? (
          <div className="grow flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Study Hours', angle: -90, position: 'insideLeft', offset: 10 }} />
                <Tooltip formatter={(value) => [`${value} hours`, "Study Time"]} />
                <Legend />
                <Bar dataKey="hours" fill="#2563eb" name="Study Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
// --- (MỚI) Component Bảng Vàng (Leaderboard) ---
function LeaderboardPanel() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Truy vấn 10 người dùng (users) có điểm cao nhất.
  const leaderboardQuery = useMemo(() => {
    return query(
      collection(db, usersPath),
      orderBy('points', 'desc'),
      limit(10)
    );
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Leaderboard listener error: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [leaderboardQuery]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Award size={28} className="mr-2 text-yellow-500" />
        Top 10 Best Students
      </h2>
      
      <p className="text-sm text-gray-600 mb-4">Ranked by Total Points</p>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 size={32} className="animate-spin text-yellow-500" />
        </div>
      )}
      
      {!isLoading && leaderboard.length > 0 && (
        <ul className="space-y-3">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            let rankClass = 'text-gray-700';
            let icon = null;

            if (rank === 1) {
              rankClass = 'text-yellow-600 font-extrabold text-lg';
              icon = <Award size={20} className="text-yellow-500 fill-yellow-300 mr-2" />;
            } else if (rank <= 3) {
              rankClass = 'text-green-600 font-bold';
            }
            
            // Highlight user if logged in
            const isCurrentUser = user.userId === auth.currentUser?.uid;

            return (
              <li 
                key={user.id} 
                className={`flex items-center justify-between p-3 rounded-xl shadow-md transition-all duration-300 ${isCurrentUser ? 'bg-blue-100 border-2 border-blue-500 scale-105' : 'bg-gray-50 hover:bg-yellow-50'}`}
              >
                <div className="flex items-center">
                  <span className={`w-8 text-center mr-3 ${rankClass}`}>
                    {icon || `#${rank}`}
                  </span>
                  <span className={`font-semibold ${rankClass} ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                    {user.name} {isCurrentUser && "(You)"}
                  </span>
                </div>
                <span className={`text-xl font-bold ${isCurrentUser ? 'text-blue-600' : 'text-gray-800'}`}>
                  {user.points} pts
                </span>
              </li>
            );
          })}
        </ul>
      )}
       {!isLoading && leaderboard.length === 0 && (
          <p className="text-center text-gray-500 italic py-8">No data found on the leaderboard.</p>
      )}
    </div>
  );
}

/**
 * Main App Component (V4.2 - Final)
 */
export default function App() {
  const [userAuth, setUserAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(getISODate());
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  
  const [goalToComplete, setGoalToComplete] = useState(null);

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
      console.error("User data listener error: ", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error: ", error);
    }
  };

  const handleSignupSuccess = (userData) => {
    setCurrentUser(userData);
    setShowSignup(false);
    setShowCodeModal(true);
  };
  
  const handlePointUpdate = useCallback(async (pointsToAdd) => {
    if (!userId) return;
    try {
      const userRef = doc(db, usersPath, userId);
      await updateDoc(userRef, {
        points: increment(pointsToAdd)
      });
    } catch (error) {
      console.error("Error updating points: ", error);
    }
  }, [userId]);
  
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalDate) return;

    setIsAddingGoal(true);
    try {
      await addDoc(collection(db, goalsPath), {
        userId,
        title: newGoalTitle.trim(),
        endDate: newGoalDate,
        completed: false,
        reflection: "",
        createdAt: serverTimestamp(), // <-- SỬA LỖI: Ghi bằng Timestamp
      });
      setNewGoalTitle('');
      setNewGoalDate(getISODate());
    } catch (error) {
      console.error("Error adding goal: ", error);
    }
    setIsAddingGoal(false);
  };
  
  const handleConfirmGoalCompletion = async (reflection) => {
    if (!goalToComplete) return;
    
    try {
      const goalRef = doc(db, goalsPath, goalToComplete.id);
      await updateDoc(goalRef, {
        completed: true,
        reflection: reflection,
      });
      
      handlePointUpdate(100);
      setGoalToComplete(null);
      
    } catch (error) {
      console.error("Error completing goal: ", error);
      throw error; 
    }
  };
  
  const copyCodeToClipboard = () => {
    if (currentUser?.publicCode) {
      const textToCopy = currentUser.publicCode;
      
      const el = document.createElement('textarea');
      el.value = textToCopy;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      
      try {
        document.execCommand('copy');
        
        const copyMessage = document.createElement('div');
        copyMessage.textContent = 'Code copied to clipboard!';
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
        console.error('Could not copy');
      }
      document.body.removeChild(el);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100 font-quicksand">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userAuth) {
    return <LoginScreen />;
  }

  if (showSignup) {
    return <SignupModal userAuth={userAuth} onSignupSuccess={handleSignupSuccess} />;
  }
  
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-quicksand">
        {/* Header */}
        <header className="bg-white shadow-xl rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                Welcome, {currentUser.name}!
              </h1>
              <div 
                className="flex items-center text-gray-600 mt-2 group cursor-pointer"
                onClick={copyCodeToClipboard}
                title="Copy your code"
              >
                <User size={16} className="mr-1.5" />
                <span>Your Code:</span>
                <span className="ml-1.5 font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  {currentUser.publicCode}
                </span>
                <Copy size={14} className="ml-2 text-gray-400 group-hover:text-blue-600 transition" />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
               <div 
                 className="text-center p-4 bg-[#f08080] rounded-xl shadow-lg"
                 title="Dùng mã màu tùy ý [f08080]"
               >
                  <div className="text-sm font-bold text-white uppercase tracking-wider">Total Points</div>
                  <div className="text-4xl font-bold text-white">{currentUser.points}</div>
                </div>
              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-semibold hover:bg-gray-300 transition duration-300 flex items-center justify-center"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="mt-4 w-full md:w-auto bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
          >
            <TrendingUp size={20} className="mr-2" />
            View Monthly Report
          </button>
        </header>

        {/* --- V3.0: BỐ CỤC MỚI (FORM ADD GOAL LÊN TRÊN) --- */}
        <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
           <form onSubmit={handleAddGoal} className="p-4 bg-goal-form rounded-lg border border-goal shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add a New Goal</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-3">
              <div className="md:col-span-2">
                <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input
                  id="goalTitle"
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-goal"
                  placeholder="e.g., Master React Hooks"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="goalDate" className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  id="goalDate"
                  type="date"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-goal"
                  min={getISODate()}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isAddingGoal}
              className="w-full md:w-auto bg-goal text-red-600 py-2 px-6 rounded-md font-semibold shadow-lg hover:opacity-80 disabled:bg-gray-400 flex items-center justify-center"
            >
              {isAddingGoal ? <Loader2 className="animate-spin" /> : <Plus className="mr-1" />} Add Goal
            </button>
          </form>
        </div>

        {/* --- V7.0: BỐ CỤC THEO TỈ LỆ 2:3:3 (TỔNG 8 CỘT) --- */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-8">
          
          {/* Cột 1 (2/8): LEADERBOARD */}
          <div className="lg:col-span-2"> 
            <LeaderboardPanel />
          </div>
          
          {/* Cột 2 (3/8): ACTIVE GOALS (Cột trọng tâm) */}
          <div className="lg:col-span-3"> 
            <GoalsPanel 
              userId={userId} 
              onGoalTodoComplete={handlePointUpdate}
              onGoalAchieved={(goal) => setGoalToComplete(goal)}
              onViewArchived={() => setShowArchivedModal(true)}
            />
          </div>
          
          {/* Cột 3 (3/8): TIMER + NOTES (GOM CHUNG 1 CỘT DỌC) */}
          <div className="lg:col-span-3 space-y-8"> 
            {/* 1. Study Timer (Trình hẹn giờ) */}
            <StudyLoggerPanel 
              userId={userId} 
              onStudyLogged={handlePointUpdate}
              onViewHistory={() => setShowHistoryModal(true)}
            />
            {/* 2. My Notes (Nằm ngay dưới Timer, cách 32px nhờ space-y-8) */}
            <NotesPanel 
              userId={userId} 
            />
          </div>
        </main>
        
        {/* Modals */}
        {showReport && (
          <ReportModal userId={userId} onClose={() => setShowReport(false)} />
        )}
        
        {goalToComplete && (
          <GoalCompletionModal
            goal={goalToComplete}
            onClose={() => setGoalToComplete(null)}
            onConfirm={handleConfirmGoalCompletion}
          />
        )}

        {showHistoryModal && ( // <-- THÊM DÒNG NÀY
          <StudyHistoryModal
            userId={userId}
            onClose={() => setShowHistoryModal(false)}
          />
        )}

        {showArchivedModal && ( // <-- THÊM MODAL NÀY
          <ArchivedGoalsModal
            userId={userId}
            onClose={() => setShowArchivedModal(false)}
          />
        )}

        {showCodeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Signup Successful!</h2>
              <p className="text-gray-600 mb-6">Your personal code is:</p>
              <div 
                className="inline-flex items-center bg-gray-100 px-6 py-3 rounded-lg font-mono text-3xl font-bold text-blue-700 cursor-pointer"
                onClick={copyCodeToClipboard}
                title="Copy"
              >
                {currentUser.publicCode}
                <Copy size={20} className="ml-3 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 mt-4">
                This is your public identifier.
                <b>Do NOT use this to log in.</b>
                Use your Google Account to log in.
              </p>
              <button
                onClick={() => setShowCodeModal(false)}
                className="mt-8 w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100 font-quicksand">
      <Loader2 size={48} className="animate-spin text-blue-600" />
    </div>
  );
}

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
  EyeOff
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

// Đường dẫn Firestore (Vẫn như cũ)
const usersPath = 'users';
const publicCodesPath = 'publicCodes';
const goalsPath = 'goals';
const goalTodosPath = 'goalTodos';
const studyLogsPath = 'studyLogs';

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

// --- React Components (Đã đổi sang Tiếng Anh) ---

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
      if (err.code === 'auth/unauthorized-domain') {
        setError('Config Error: This domain is not authorized. Please add it in your Firebase Console (Authentication > Settings > Authorized domains).');
      } else {
        setError('Could not sign in with Google. Please try again.');
      }
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
        createdAt: new Date().toISOString(),
      };

      const batch = writeBatch(db);
      batch.set(userRef, newUser);
      batch.set(doc(db, publicCodesPath, publicCode), { userId });
      
      await batch.commit();

      onSignupSuccess(newUser);
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

/**
 * Goal Item (Đã cập nhật logic + UI)
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

  useEffect(() => {
    const unsubscribe = onSnapshot(goalTodosQuery, (snapshot) => {
      const fetchedTodos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedTodos.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return new Date(a.createdAt) - new Date(a.createdAt);
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
        createdAt: new Date().toISOString(),
      });
      setNewTask('');
      setNewTodoDate(getISODate());
    } catch (error) {
      console.error("Error adding sub-task: ", error);
    }
    setIsLoading(false);
  };

  // CẬP NHẬT: +2 khi check, -2 khi uncheck
  const toggleTodo = async (todoId, currentStatus) => {
    const isCompleting = !currentStatus;
    const pointsToAdd = isCompleting ? 2 : -2; // +2 or -2
    try {
      const todoRef = doc(db, goalTodosPath, todoId);
      await updateDoc(todoRef, { completed: isCompleting });
      
      onGoalTodoComplete(pointsToAdd); // Gửi +2 hoặc -2
      
    } catch (error) {
      console.error("Error updating sub-task: ", error);
    }
  };

  const handleMarkGoalComplete = async () => {
    try {
      const goalRef = doc(db, goalsPath, goal.id);
      await updateDoc(goalRef, { completed: true });
    } catch (error) {
      console.error("Error completing goal: ", error);
    }
  };
  
  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
  
  // CẬP NHẬT: Nhóm to-do theo ngày
  const groupedTodos = todos.reduce((acc, todo) => {
    const date = todo.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(todo);
    return acc;
  }, {});

  return (
    // CẬP NHẬT: Dùng màu custom `bg-goal`
    <div className={`p-4 rounded-lg shadow-lg border-l-4 ${goal.completed ? 'bg-gray-200 border-gray-400 opacity-60' : 'bg-goal border-red-500'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-xl font-bold ${goal.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
            {goal.title}
          </h3>
          <p className="text-sm text-gray-700 flex items-center">
            <Calendar size={14} className="mr-1" />
            Goal Deadline: {goal.endDate}
          </p>
        </div>
        {!goal.completed && (
          <button
            onClick={handleMarkGoalComplete}
            title="Mark entire goal as complete (Archive)"
            className="text-sm bg-green-600 text-white py-1 px-3 rounded-full hover:bg-green-700 transition shadow-md"
          >
            <Archive size={16} className="inline-block" /> Mark as Done
          </button>
        )}
      </div>

      {totalTodos > 0 && !goal.completed && (
        <div className="mt-3">
          <span className="text-xs font-medium text-gray-800">Progress: {completedTodos}/{totalTodos}</span>
          <div className="w-full bg-red-100 rounded-full h-2.5 mt-1">
            <div 
              className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 pl-4 border-l-2 border-red-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Sub-Tasks (+2 pts each):</h4>
        
        {/* CẬP NHẬT: Hiển thị theo nhóm ngày */}
        <div className="space-y-3">
          {Object.keys(groupedTodos).length > 0 ? (
            Object.entries(groupedTodos).map(([date, dateTodos]) => (
              <div key={date} className="bg-white/60 p-3 rounded-lg shadow-inner">
                <h5 className="font-semibold text-sm text-gray-700 mb-2 border-b border-red-100 pb-1">
                  Due: {date}
                </h5>
                <ul className="space-y-2">
                  {dateTodos.map(todo => (
                    // CẬP NHẬT: Dùng màu custom `bg-todo`
                    <li key={todo.id} className="flex items-center bg-todo p-2 rounded-md shadow-sm">
                      <button onClick={() => toggleTodo(todo.id, todo.completed)} className="mr-2">
                        {todo.completed ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : (
                          <Circle size={20} className="text-red-500" />
                        )}
                      </button>
                      <span className={`grow text-sm ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {todo.task}
                      </span>
                    </li>
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
                className="grow px-3 py-1.5 border border-gray-300 rounded-l-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                placeholder="Add new sub-task..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1.5 bg-red-600 text-white rounded-r-md hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center shadow-sm"
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
 * Goals Panel (Đã cập nhật logic + UI)
 */
function GoalsPanel({ userId, onGoalTodoComplete }) {
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(getISODate());
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false); // CẬP NHẬT: State lưu trữ

  const goalsQuery = useMemo(() => {
    return query(
      collection(db, goalsPath),
      where('userId', '==', userId)
    );
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const fetchedGoals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sắp xếp: chưa xong lên trước, sau đó là ngày tạo (mới nhất)
      fetchedGoals.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setGoals(fetchedGoals);
    }, (error) => {
      console.error("Goals listener error: ", error);
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
      console.error("Error adding goal: ", error);
    }
    setIsLoading(false);
  };
  
  // CẬP NHẬT: Lọc ra 2 danh sách
  const activeGoals = goals.filter(g => !g.completed);
  const archivedGoals = goals.filter(g => g.completed);

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
        <Target size={28} className="mr-2 text-red-600" />
        My Goals
      </h2>
      
      {/* CẬP NHẬT: Dùng màu custom `bg-goal-form` */}
      <form onSubmit={handleAddGoal} className="mb-6 p-4 bg-goal-form rounded-lg border border-red-200 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Add a New Goal</h3>
        <div className="mb-3">
          <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
          <input
            id="goalTitle"
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Master React Hooks"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="goalDate" className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
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
          {isLoading ? <Loader2 className="animate-spin" /> : <Plus className="mr-1" />} Add Goal
        </button>
      </form>

      {/* CẬP NHẬT: Hiển thị 2 danh sách */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-red-200 pb-2">Active Goals</h3>
        {activeGoals.length > 0 ? (
          activeGoals.map(goal => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              userId={userId}
              onGoalTodoComplete={onGoalTodoComplete}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 italic py-4">You have no active goals. Add one above!</p>
        )}
        
        <div className="pt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center"
          >
            {showArchived ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
            {showArchived ? 'Hide' : 'Show'} Archived Goals ({archivedGoals.length})
          </button>
          
          {showArchived && (
            <div className="space-y-4 mt-4">
              {archivedGoals.length > 0 ? (
                 archivedGoals.map(goal => (
                  <GoalItem 
                    key={goal.id} 
                    goal={goal} 
                    userId={userId}
                    onGoalTodoComplete={onGoalTodoComplete}
                  />
                ))
              ) : (
                 <p className="text-center text-gray-500 italic py-4">No archived goals yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Study Logger Panel (Đã cập nhật UI + logic)
 */
function StudyLoggerPanel({ userId, onStudyLogged, onShowReport }) {
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
      setLogs(fetchedLogs.slice(0, 5)); // Lấy 5 logs gần nhất
    }, (error) => {
      console.error("Study logs listener error: ", error);
    });
    return () => unsubscribe();
  }, [studyLogsQuery]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (totalMinutes <= 0) {
      setError('Study time must be greater than 0.');
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
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, studyLogsPath), logData);
      
      onStudyLogged(pointsEarned);
      
      setHours(0);
      setMinutes(0);
      e.target.reset();

    } catch (err) {
      console.error("Error logging study time: ", err);
      setError('An error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
        <BookOpen size={28} className="mr-2 text-blue-600" />
        Log Study Time
      </h2>
      <p className="text-sm text-gray-600 mb-4">(+20 points per hour)</p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* CẬP NHẬT: Dùng màu custom `bg-study` */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-study rounded-lg border border-blue-200 shadow-md">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
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
            <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Log Session'}
        </button>
      </form>
      
      {/* CẬP NHẬT: Dùng màu custom `bg-history` */}
      <div className="bg-history p-4 rounded-lg shadow-inner">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Recent History</h3>
        {logs.length > 0 ? (
          <ul className="space-y-3">
            {logs.map(log => (
              <li key={log.id} className="flex items-center justify-between p-3 bg-white/70 rounded-md shadow-sm">
                <div>
                  <p className="font-semibold text-gray-900">
                    {log.hours}h {log.minutes}m
                    <span className="ml-2 text-green-700 font-bold">(+{log.points} pts)</span>
                  </p>
                  <p className="text-sm text-gray-600">{log.date}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600 italic py-4">No study sessions logged yet.</p>
        )}
        
        {/* CẬP NHẬT: Nút Báo cáo ở đây */}
        <button
          onClick={onShowReport}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
        >
          <TrendingUp size={20} className="mr-2" />
          View Monthly Report
        </button>
      </div>
    </div>
  );
}

/**
 * Report Modal (Đã đổi sang Tiếng Anh)
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
        console.error("Error loading report: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLogs();
  }, [userId, processData]);
  
  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' });

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
                margin={{
                  top: 5,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
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

/**
 * Main App Component (Đã cập nhật)
 */
export default function App() {
  const [userAuth, setUserAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

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
        points: increment(pointsToAdd) // Dùng chung cho cả +20, +2, -2
      });
    } catch (error) {
      console.error("Error updating points: ", error);
    }
  }, [userId]);
  
  const copyCodeToClipboard = () => {
    if (currentUser?.publicCode) {
      const el = document.createElement('textarea');
      el.value = currentUser.publicCode;
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
        <p className="ml-4 text-lg text-gray-700">Loading...</p>
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
               {/* CẬP NHẬT: Styling cho Total Score */}
               <div className="text-center p-4 bg-score rounded-xl shadow-lg">
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
          {/* CẬP NHẬT: Đã bỏ nút Báo cáo khỏi Header */}
        </header>

        {/* Main Content Grid (2 CỘT) */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <GoalsPanel 
              userId={userId} 
              onGoalTodoComplete={handlePointUpdate} // Dùng chung 1 hàm
            />
          </div>
          <div className="lg:col-span-1">
            <StudyLoggerPanel 
              userId={userId} 
              onStudyLogged={handlePointUpdate} // Dùng chung 1 hàm
              onShowReport={() => setShowReport(true)} // Thêm prop này
            />
          </div>
        </main>
        
        {/* Modals */}
        {showReport && (
          <ReportModal userId={userId} onClose={() => setShowReport(false)} />
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
      <p className="ml-4 text-lg text-gray-700">Loading user data...</p>
    </div>
  );
}
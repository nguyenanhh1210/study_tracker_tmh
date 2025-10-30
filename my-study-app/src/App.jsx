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
  Timestamp,
  orderBy,
  deleteDoc
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
// CẬP NHẬT: Đã chuyển sang dùng lucide-react (giống project của bạn)
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
  Edit2, // Icon Sửa
  Save,  // Icon Lưu
  Trash2, // Icon Xóa
  Clock, // Icon Đồng hồ
  Play,  // Icon Bắt đầu
  Square, // Icon Dừng
  StickyNote, // Icon Ghi chú
  Send, // Icon Gửi
  Bell // Icon Chuông
} from 'lucide-react';

// --- CẤU HÌNH FIREBASE ---
// (Đây là config bạn đã cung cấp)
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

// CẬP NHẬT: Thêm collection path cho 'notes'
const usersPath = 'users';
const publicCodesPath = 'publicCodes';
const goalsPath = 'goals';
const goalTodosPath = 'goalTodos'; // Đổi tên từ goalTodos sang subTasks cho rõ
const studyLogsPath = 'studyLogs';
const notesPath = 'notes'; // Collection mới cho Ghi chú

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

// Lấy ngày hôm nay theo format YYYY-MM-DD
const getISODate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// CẬP NHẬT: Hàm đếm ngược ngày (MỚI)
const calculateDaysLeft = (targetDate) => {
  if (!targetDate) return { days: 0, status: 'nodate' };
  const today = new Date();
  const target = new Date(targetDate);
  
  // Set today và target về 00:00:00 để so sánh ngày
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { days: Math.abs(diffDays), status: 'overdue' };
  if (diffDays === 0) return { days: 0, status: 'today' };
  if (diffDays <= 7) return { days: diffDays, status: 'urgent' };
  return { days: diffDays, status: 'normal' };
};

// CẬP NHẬT: Hàm format thời gian cho đồng hồ (MỚI)
const formatStopwatchTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  
  const pad = (num) => num.toString().padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};


// --- React Components ---

/**
 * Login Screen (Như cũ)
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
            <LogIn className="w-6 h-6 mr-3" />
          )}
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}

/**
 * Signup Modal (Như cũ)
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

// CẬP NHẬT: Component đếm ngược ngày (MỚI)
function CountdownTimer({ targetDate }) {
  const { days, status } = calculateDaysLeft(targetDate);
  
  let text = '';
  let colorClass = '';

  switch (status) {
    case 'overdue':
      text = `Overdue by ${days} day(s)`;
      colorClass = 'bg-red-600 text-white';
      break;
    case 'today':
      text = 'Due Today!';
      colorClass = 'bg-red-500 text-white animate-pulse';
      break;
    case 'urgent':
      text = `${days} day(s) left!`;
      colorClass = 'bg-yellow-400 text-yellow-900';
      break;
    case 'normal':
      text = `${days} days left`;
      colorClass = 'bg-green-100 text-green-700';
      break;
    default:
      text = 'No date set';
      colorClass = 'bg-gray-200 text-gray-500';
  }

  return (
    <div className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${colorClass}`}>
      <Bell size={14} className="inline-block mr-1.5" />
      {text}
    </div>
  );
}

// CẬP NHẬT: Component Modal Ghi chú Hoàn thành Goal (MỚI)
function GoalCompletionModal({ goal, userId, onClose, onConfirm }) {
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reflection.trim()) return; // Ghi chú là bắt buộc
    
    setIsLoading(true);
    try {
      const goalRef = doc(db, usersPath, userId, goalsPath, goal.id);
      await updateDoc(goalRef, {
        completed: true,
        reflection: reflection.trim(),
        completedAt: Timestamp.now(),
      });
      
      // Cộng 100 điểm
      onConfirm(100); 

    } catch (error) {
      console.error("Error completing goal: ", error);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Complete Goal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-700 mb-2">
          Congratulations on finishing: <strong>{goal.title}</strong>!
        </p>
        <p className="text-gray-600 text-sm mb-4">
          (This will award you <strong>100 points!</strong>)
        </p>
        
        <div className="w-full">
          <label htmlFor="reflection" className="block text-sm font-bold text-gray-700 mb-2">
            Your Reflection (Required)
          </label>
          <textarea
            id="reflection"
            rows="5"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="How do you feel? What did you learn? What changed?"
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!reflection.trim() || isLoading}
          className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm & Get 100 Points'}
        </button>
      </div>
    </div>
  );
}


// CẬP NHẬT: Component Sub-task Item (MỚI)
// Component này quản lý logic nội tại của nó (sửa, lưu)
function SubTaskItem({ todo, userId, goalId, onGoalTodoComplete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.task);
  const [editDate, setEditDate] = useState(todo.date);
  const [isLoading, setIsLoading] = useState(false);
  
  const subTaskRef = doc(db, usersPath, userId, goalsPath, goalId, goalTodosPath, todo.id);

  const toggleTodo = async () => {
    const isCompleting = !todo.completed;
    const pointsToAdd = isCompleting ? 2 : -2; // +2 or -2
    try {
      await updateDoc(subTaskRef, { completed: isCompleting });
      onGoalTodoComplete(pointsToAdd); // Gửi +2 hoặc -2
    } catch (error) {
      console.error("Error updating sub-task: ", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(todo.task);
    setEditDate(todo.date);
  };
  
  const handleSave = async () => {
     if (!editText.trim() || !editDate) return;
     setIsLoading(true);
     try {
       await updateDoc(subTaskRef, {
         task: editText.trim(),
         date: editDate,
       });
       setIsEditing(false);
     } catch (error) {
       console.error("Error saving sub-task: ", error);
     }
     setIsLoading(false);
  };

  /* ĐÃ XÓA hàm handleDelete */

  if (isEditing) {
    return (
      <li className="flex flex-col gap-2 bg-white/60 p-3 rounded-lg shadow-inner ring-2 ring-blue-500">
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
        />
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
        />
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={handleCancel} className="text-sm text-gray-600 hover:text-gray-900 font-medium p-1">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isLoading}
            className="text-sm bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={`flex items-center p-2 rounded-md group ${todo.completed ? 'bg-gray-100' : 'bg-todo'}`}>
      <button onClick={toggleTodo} className="mr-2 shrink-0">
        {todo.completed ? (
          <CheckCircle size={20} className="text-green-600" />
        ) : (
          <Circle size={20} className="text-blue-500" />
        )}
      </button>
      <div className="grow">
        <span className={`text-sm ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {todo.task}
        </span>
        <span className="block text-xs text-gray-500">
          Due: {todo.date}
        </span>
      </div>
      {!todo.completed && (
        <button 
          onClick={handleEdit} 
          className="ml-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 size={16} />
        </button>
      )}
      {/* ĐÃ XÓA Nút Xóa (Trash2) */}
    </li>
  );
}

/**
 * SubTask List Component
 */
function SubTaskList({ userId, goal, onGoalTodoComplete }) {
  const [subTasks, setSubTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTodoDate, setNewTodoDate] = useState(getISODate());
  const [isLoading, setIsLoading] = useState(false);

  const subTasksQuery = useMemo(() => {
    // CẬP NHẬT: Query vào sub-collection
    return query(
      collection(db, usersPath, userId, goalsPath, goal.id, goalTodosPath),
      orderBy('date', 'asc') // Sắp xếp theo ngày
    );
  }, [userId, goal.id]);

  useEffect(() => {
    const unsubscribe = onSnapshot(subTasksQuery, (snapshot) => {
      const fetchedTodos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubTasks(fetchedTodos);
    }, (error) => {
      console.error("Goal Todos listener error: ", error);
    });
    return () => unsubscribe();
  }, [subTasksQuery]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !newTodoDate) return;

    setIsLoading(true);
    try {
      // CẬP NHẬT: Thêm vào sub-collection
      await addDoc(collection(db, usersPath, userId, goalsPath, goal.id, goalTodosPath), {
        task: newTask.trim(),
        date: newTodoDate,
        completed: false,
        createdAt: Timestamp.now(), // Dùng Timestamp của server
      });
      setNewTask('');
      setNewTodoDate(getISODate());
    } catch (error) {
      console.error("Error adding sub-task: ", error);
    }
    setIsLoading(false);
  };
  
  const completedTodos = subTasks.filter(t => t.completed).length;
  const totalTodos = subTasks.length;
  const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  return (
    <div className="mt-4 pl-4 border-l-2 border-blue-200">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">Sub-Tasks (+2 pts each):</h4>

      {totalTodos > 0 && (
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-800">Progress: {completedTodos}/{totalTodos}</span>
          <div className="w-full bg-blue-100 rounded-full h-2.5 mt-1">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {subTasks.length > 0 ? (
          <ul className="space-y-2">
            {subTasks.map(todo => (
              <SubTaskItem 
                key={todo.id}
                todo={todo}
                userId={userId}
                goalId={goal.id}
                onGoalTodoComplete={onGoalTodoComplete}
              />
            ))}
          </ul>
        ) : (
           <p className="text-sm text-gray-700 italic">No sub-tasks added yet.</p>
        )}
      </div>

      <form onSubmit={handleAddTodo} className="mt-4 space-y-2">
        <div className="flex">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="grow px-3 py-1.5 border border-gray-300 rounded-l-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add new sub-task..."
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center shadow-sm"
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
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            min={getISODate()}
            required
          />
        </div>
      </form>
    </div>
  );
}

/**
 * Goal Item (Đã cập nhật)
 */
function GoalItem({ goal, userId, onGoalTodoComplete, onMarkComplete }) {
  
  return (
    <div className={`p-4 rounded-lg shadow-lg border-l-4 ${goal.completed ? 'bg-gray-100 border-gray-300 opacity-70' : 'bg-goal border-blue-500'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={`text-xl font-bold ${goal.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
            {goal.title}
          </h3>
          <p className="text-sm text-gray-700 flex items-center mt-1">
            <Calendar size={14} className="mr-1.5" />
            Target: {goal.endDate}
          </p>
        </div>
        {/* CẬP NHẬT: Nút "Mark as Done" giờ sẽ mở Modal */}
        {!goal.completed && (
          <button
            onClick={() => onMarkComplete(goal)}
            title="Mark entire goal as complete (Archive)"
            className="text-sm bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition shadow-md flex items-center"
          >
            <Archive size={16} className="inline-block mr-1.5" /> Mark as Done
          </button>
        )}
      </div>

      {/* CẬP NHẬT: Thêm Countdown */}
      {!goal.completed && (
        <div className="mb-4">
          <CountdownTimer targetDate={goal.endDate} />
        </div>
      )}

      {/* Nếu đã xong, hiển thị reflection */}
      {goal.completed && goal.reflection && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <h5 className="text-sm font-bold text-green-800 mb-1">My Reflection:</h5>
          <p className="text-sm text-gray-700 italic">"{goal.reflection}"</p>
        </div>
      )}
      
      {/* Chỉ hiển thị Sub-tasks nếu Goal chưa xong */}
      {!goal.completed && (
        <SubTaskList 
          userId={userId} 
          goal={goal} 
          onGoalTodoComplete={onGoalTodoComplete}
        />
      )}
    </div>
  );
}


/**
 * Goals Panel (Đã cập nhật)
 */
function GoalsPanel({ userId, onGoalTodoComplete }) {
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(getISODate());
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // CẬP NHẬT: State cho Modal
  const [completingGoal, setCompletingGoal] = useState(null); 

  const goalsQuery = useMemo(() => {
    // CẬP NHẬT: Query vào sub-collection
    return query(
      collection(db, usersPath, userId, goalsPath)
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
      console.error("Goals listener error: ", error);
    });
    return () => unsubscribe();
  }, [goalsQuery]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalDate) return;

    setIsLoading(true);
    try {
      // CẬP NHẬT: Thêm vào sub-collection
      await addDoc(collection(db, usersPath, userId, goalsPath), {
        title: newGoalTitle.trim(),
        endDate: newGoalDate,
        completed: false,
        reflection: '', // Thêm trường reflection
        createdAt: Timestamp.now(),
      });
      setNewGoalTitle('');
      setNewGoalDate(getISODate());
    } catch (error) {
      console.error("Error adding goal: ", error);
    }
    setIsLoading(false);
  };
  
  const activeGoals = goals.filter(g => !g.completed);
  const archivedGoals = goals.filter(g => g.completed);
  
  // CẬP NHẬT: Hàm xác nhận (được gọi từ Modal)
  const handleConfirmCompletion = (pointsToAdd) => {
    onGoalTodoComplete(pointsToAdd); // Chuyển 100 điểm lên App
    setCompletingGoal(null); // Đóng modal
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
        <Target size={28} className="mr-2 text-blue-600" />
        My Goals
      </h2>
      
      <form onSubmit={handleAddGoal} className="mb-6 p-4 bg-goal-form rounded-lg border border-blue-200 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Add a New Goal</h3>
        <div className="mb-3">
          <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
          <input
            id="goalTitle"
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={getISODate()}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Plus className="mr-1" />} Add Goal
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2">Active Goals</h3>
        {activeGoals.length > 0 ? (
          activeGoals.map(goal => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              userId={userId}
              onGoalTodoComplete={onGoalTodoComplete}
              onMarkComplete={setCompletingGoal} // CẬP NHẬT: Mở Modal
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
                    onMarkComplete={setCompletingGoal} // Vẫn cho phép mở modal
                  />
                ))
              ) : (
                 <p className="text-center text-gray-500 italic py-4">No archived goals yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* CẬP NHẬT: Render Modal */}
      {completingGoal && (
        <GoalCompletionModal 
          goal={completingGoal}
          userId={userId}
          onClose={() => setCompletingGoal(null)}
          onConfirm={handleConfirmCompletion}
        />
      )}
    </div>
  );
}

/**
 * CẬP NHẬT: Study Logger Panel (Đã đổi thành Đồng hồ bấm giờ)
 */
function StudyLoggerPanel({ userId, onStudyLogged, onShowReport }) {
  const [elapsedTime, setElapsedTime] = useState(0); // Tính bằng giây
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Refs để giữ giá trị khi component re-render
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // Tải logs (như cũ)
  const studyLogsQuery = useMemo(() => {
     return query(
       collection(db, usersPath, userId, studyLogsPath),
       orderBy('createdAt', 'desc'),
       where('userId', '==', userId)
     );
   }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(studyLogsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLogs(fetchedLogs.slice(0, 5)); // Lấy 5 logs gần nhất
    }, (error) => {
      console.error("Study logs listener error: ", error);
    });
    return () => unsubscribe();
  }, [studyLogsQuery]);
  
  // Cảnh báo khi tắt tab (MỚI)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = 'You have a study session in progress. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning]);

  // Dọn dẹp interval (MỚI)
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);
  
  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    // startTimeRef lưu thời điểm bắt đầu (đã trừ đi thời gian đã chạy)
    // Điều này giúp đồng hồ chạy đúng ngay cả khi đổi tab
    startTimeRef.current = Date.now() - (elapsedTime * 1000); 
    
    timerRef.current = setInterval(() => {
      // Tính toán thời gian đã trôi qua chính xác
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(seconds);
    }, 1000);
  };

  const handleStop = () => {
    if (!isRunning) return;
    setIsRunning(false);
    clearInterval(timerRef.current);
  };

  const handleLogSession = async () => {
    if (isRunning) {
      handleStop(); // Tự động dừng nếu đang chạy
    }
    
    if (elapsedTime < 60) { // Chỉ log nếu > 1 phút
      alert("You need to study for at least 1 minute to log a session.");
      setElapsedTime(0); // Reset
      return;
    }

    setIsLoading(true);
    
    const totalMinutes = Math.floor(elapsedTime / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHours = totalMinutes / 60;
    const pointsEarned = Math.round(totalHours * 20);

    try {
      const logData = {
        userId,
        hours: hours,
        minutes: minutes,
        totalHours: totalHours,
        points: pointsEarned,
        date: getISODate(),
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, usersPath, userId, studyLogsPath), logData);
      
      onStudyLogged(pointsEarned);
      setElapsedTime(0); // Reset đồng hồ

    } catch (err) {
      console.error("Error logging study time: ", err);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
        <Clock size={28} className="mr-2 text-green-600" />
        Study Timer
      </h2>
      <p className="text-sm text-gray-600 mb-6">(+20 points per hour)</p>

      {/* Đồng hồ */}
      <div className="text-center p-6 bg-study rounded-lg border border-green-200 shadow-md">
        <h3 className="text-7xl font-bold text-gray-900 font-mono">
          {formatStopwatchTime(elapsedTime)}
        </h3>
        <p className="text-sm text-gray-700">Hours : Minutes : Seconds</p>
        
        <div className="flex justify-center gap-4 mt-6">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="w-28 bg-green-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-green-700 transition duration-300 flex items-center justify-center"
            >
              <Play size={16} className="mr-1.5" /> Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-28 bg-yellow-500 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-yellow-600 transition duration-300 flex items-center justify-center"
            >
              <Square size={16} className="mr-1.5" /> Stop
            </button>
          )}
          
          <button
            onClick={handleLogSession}
            disabled={isLoading || isRunning || elapsedTime === 0}
            className="w-40 bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Log & Reset Session'}
          </button>
        </div>
      </div>
      
      {/* Lịch sử */}
      <div className="bg-history p-4 rounded-lg shadow-inner mt-6 grow flex flex-col">
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
                  <p className="text-sm text-gray-600">
                    {/* Chuyển Timestamp (nếu có) về Date */}
                    {log.createdAt.toDate ? log.createdAt.toDate().toLocaleString() : log.createdAt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600 italic py-4">No study sessions logged yet.</p>
        )}
        
        <button
          onClick={onShowReport}
          className="mt-auto w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center"
        >
          <TrendingUp size={20} className="mr-2" />
          View Monthly Report
        </button>
      </div>
    </div>
  );
}

// CẬP NHẬT: Component Ghi chú tự do (MỚI)
function NotesPanel({ userId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const notesQuery = useMemo(() => {
    return query(
      collection(db, usersPath, userId, notesPath),
      orderBy('createdAt', 'desc')
    );
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotes(fetchedNotes);
    }, (error) => {
      console.error("Notes listener error: ", error);
    });
    return () => unsubscribe();
  }, [notesQuery]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, usersPath, userId, notesPath), {
        content: newNote.trim(),
        createdAt: Timestamp.now(),
      });
      setNewNote('');
    } catch (error) {
      console.error("Error adding note: ", error);
    }
    setIsLoading(false);
  };
  
  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteDoc(doc(db, usersPath, userId, notesPath, noteId));
      } catch (error) {
        console.error("Error deleting note: ", error);
      }
    }
  };
  
  // Nhóm ghi chú theo ngày
  const groupedNotes = notes.reduce((acc, note) => {
    const date = note.createdAt.toDate().toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(note);
    return acc;
  }, {});

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
        <StickyNote size={28} className="mr-2 text-yellow-500" />
        My Notes
      </h2>
      
      <form onSubmit={handleAddNote} className="mb-4">
        <textarea
          rows="4"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="Write down your thoughts, ideas, or reminders..."
        />
        <button
          type="submit"
          disabled={isLoading || !newNote.trim()}
          className="w-full mt-2 bg-yellow-500 text-white py-2 px-4 rounded-md font-semibold shadow-lg hover:bg-yellow-600 transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Send size={16} className="mr-1.5" />} Save Note
        </button>
      </form>

      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">Recent Notes</h3>
      <div className="grow overflow-y-auto space-y-4 pr-2">
        {notes.length > 0 ? (
          Object.entries(groupedNotes).map(([date, dateNotes]) => (
            <div key={date}>
              <h4 className="font-bold text-gray-700 text-md mb-2">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
              <ul className="space-y-2">
                {dateNotes.map(note => (
                  <li key={note.id} className="bg-yellow-50 p-3 rounded-md shadow-sm group relative">
                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {note.createdAt.toDate().toLocaleTimeString()}
                    </p>
                    <button 
                      onClick={() => handleDeleteNote(note.id)} 
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 italic py-4">No notes saved yet.</p>
        )}
      </div>
    </div>
  );
}


/**
 * Report Modal (Như cũ)
 */
function ReportModal({ userId, onClose }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const processData = useCallback((logs) => {
    const monthLogs = logs.filter(log => {
      // CẬP NHẬT: Xử lý cả Timestamp và string
      const logDate = log.date.toDate ? log.date.toDate() : new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const aggregatedData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString(),
      hours: 0,
    }));

    monthLogs.forEach(log => {
      const dayOfMonth = (log.date.toDate ? log.date.toDate() : new Date(log.date)).getDate();
      aggregatedData[dayOfMonth - 1].hours += log.totalHours || 0;
    });

    setData(aggregatedData.map(d => ({ ...d, hours: parseFloat(d.hours.toFixed(2)) })));
  }, [currentMonth, currentYear]);

  useEffect(() => {
    setIsLoading(true);
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, usersPath, userId, studyLogsPath), where("userId", "==", userId));
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
  const totalStudyHours = data.reduce((acc, day) => acc + day.hours, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 font-quicksand">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Study Report ({monthName} {currentYear})
            </h2>
            <p className="text-gray-600">
              Total study time this month: <strong>{totalStudyHours.toFixed(2)} hours</strong>
            </p>
          </div>
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
                  bottom: 20, // Tăng bottom margin
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Day of the Month', position: 'insideBottom', offset: -10 }} />
                <YAxis label={{ value: 'Study Hours', angle: -90, position: 'insideLeft', offset: 10 }} />
                <Tooltip formatter={(value) => [`${value} hours`, "Study Time"]} />
                <Legend verticalAlign="top" />
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

  // Auth listener
  useEffect(() => {
    // setLogLevel('debug'); // Bật log của Firebase
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

  // User data listener
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
    setShowCodeModal(true); // Hiển thị modal code
  };
  
  // Hàm cập nhật điểm (chung cho all)
  const handlePointUpdate = useCallback(async (pointsToAdd) => {
    if (!userId || pointsToAdd === 0) return;
    try {
      const userRef = doc(db, usersPath, userId);
      await updateDoc(userRef, {
        points: increment(pointsToAdd)
      });
    } catch (error) {
      console.error("Error updating points: ", error);
    }
  }, [userId]);
  
  // Hàm copy code (như cũ)
  const copyCodeToClipboard = () => {
    if (currentUser?.publicCode) {
      const el = document.createElement('textarea');
      el.value = currentUser.publicCode;
      document.body.appendChild(el);
      el.select();
      try {
        // Dùng execCommand vì clipboard.writeText có thể bị block trong iframe
        document.execCommand('copy');
        
        // Tạo thông báo "Copied!"
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
        console.error('Could not copy code');
      }
      document.body.removeChild(el);
    }
  };
  
  // --- Render ---

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
        {/* Header (Như cũ) */}
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
               {/* Dùng màu đỏ tùy ý */}
               <div className="text-center p-4 bg-[#f08080] rounded-xl shadow-lg">
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
        </header>

        {/* CẬP NHẬT: Main Content Grid (3 CỘT) */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT 1: GOALS */}
          <div className="lg:col-span-1">
            <GoalsPanel 
              userId={userId} 
              onGoalTodoComplete={handlePointUpdate}
            />
          </div>
          
          {/* CỘT 2: TIMER */}
          <div className="lg:col-span-1">
            <StudyLoggerPanel 
              userId={userId} 
              onStudyLogged={handlePointUpdate} 
              onShowReport={() => setShowReport(true)}
            />
          </div>
          
          {/* CỘT 3: NOTES (MỚI) */}
          <div className="lg:col-span-1">
            <NotesPanel 
              userId={userId}
            />
          </div>
        </main>
        
        {/* Modals (Như cũ) */}
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
import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Calendar, Search, PieChart, FastForward, AlertCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import habitApi from '../api/habitAPI';
import authApi from '../api/authAPI';
import CheckInModal from '../components/CheckInModal';
import QuoteCarousel from '../components/QuoteCarousel';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  
  const getTodayString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d - offset)).toISOString().slice(0, 10);
  };
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const [habits, setHabits] = useState([]); 
  const [allHabitsToday, setAllHabitsToday] = useState([]); 
  const [logsToday, setLogsToday] = useState([]); 
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);

  const [checkInHabit, setCheckInHabit] = useState(null); 
  const [logToEdit, setLogToEdit] = useState(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const fetchDashboardData = async (search = '', dateStr = selectedDate) => {
    try {
      const [statsData, habitsData, logsData, catsData] = await Promise.all([
        habitApi.getDailyStats(dateStr),
        habitApi.getHabitsByDate(dateStr),
        habitApi.getLogsByDate(dateStr),
        habitApi.getCategories() 
      ]);

      setDailyStats(statsData);
      setLogsToday(logsData);
      console.log("Habits Data:", habitsData);
      setAllHabitsToday(habitsData);
      setCategories(catsData);

      let filtered = habitsData;
      if (search || searchTerm) {
        const term = search || searchTerm;
        filtered = habitsData.filter(h => h.name.toLowerCase().includes(term.toLowerCase()));
      }
      setHabits(filtered);
    } catch (error) {
      console.error("Lỗi load data:", error);
    }
  };

  const handleSearchChange = (e) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
        if (!keyword) setHabits(allHabitsToday);
        else setHabits(allHabitsToday.filter(h => h.name.toLowerCase().includes(keyword.toLowerCase())));
    }, 300));
  };

  useEffect(() => {
    const initData = async () => {
      if(!user) {
          try { const u = await authApi.getMe(); setUser(u); } catch(e){}
      }
      setLoading(true);

      if (selectedDate === getTodayString()) {
          try { await habitApi.syncAutoFail(selectedDate); } catch (err) { console.warn(err); }
      }

      await fetchDashboardData(searchTerm, selectedDate);
      setLoading(false);
    };
    initData();
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleCardClick = (habit) => {
    const existingLog = logsToday.find(log => log.habit_id === habit.id);
    setCheckInHabit(habit);
    if (existingLog) setLogToEdit(existingLog);
    else setLogToEdit(null);
    setIsCheckInModalOpen(true);
  };

  const handleUndo = async (e, habit) => {
    e.stopPropagation();
    const existingLog = logsToday.find(log => log.habit_id === habit.id);
    if (!existingLog) return;

    if (window.confirm(`Bạn muốn hủy kết quả "${habit.name}" ngày ${selectedDate}?`)) {
      try {
        await habitApi.deleteLog(existingLog.id);
        await fetchDashboardData(searchTerm, selectedDate);
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
        case 'COMPLETED': return { color: 'bg-green-500', border: 'border-green-200', bg: 'bg-green-50', icon: <CheckCircle size={16} className="text-green-600"/>, label: 'Hoàn thành' };
        case 'PARTIAL': return { color: 'bg-blue-500', border: 'border-blue-200', bg: 'bg-blue-50', icon: <PieChart size={16} className="text-blue-600"/>, label: 'Một phần' };
        case 'SKIPPED': return { color: 'bg-yellow-500', border: 'border-yellow-200', bg: 'bg-yellow-50', icon: <FastForward size={16} className="text-yellow-600"/>, label: 'Bỏ qua' };
        case 'FAILED': return { color: 'bg-red-500', border: 'border-red-200', bg: 'bg-red-50', icon: <AlertCircle size={16} className="text-red-600"/>, label: 'Thất bại' };
        default: return { color: 'bg-transparent', border: 'border-gray-100', bg: 'bg-white', icon: null, label: '' };
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải... ⏳</div>;

  return (
    <div className="relative pb-20">
      <QuoteCarousel />
      
      {/* Header & Date Picker */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Xin chào, {user?.full_name || "Bạn"}! 👋</h1>
            <p className="mt-1 text-sm md:text-base text-gray-500">
                {selectedDate === getTodayString() 
                    ? "Hôm nay, " + new Date().toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long'})
                    : "Đang xem: " + new Date(selectedDate).toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long'})
                }
            </p>
        </div>

        {/* Date Picker Responsive: flex-wrap để xuống dòng khi màn hình nhỏ */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
            <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={20}/></button>
            <div className="relative flex-1 min-w-[140px]">
                <input type="date" className="w-full pl-9 pr-2 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-700 outline-none border-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                <Calendar className="absolute left-2.5 top-2.5 text-gray-500 pointer-events-none" size={16}/>
            </div>
            <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={20}/></button>
            
            {selectedDate !== getTodayString() && (
                <button onClick={() => setSelectedDate(getTodayString())} className="ml-auto sm:ml-2 px-3 py-2 bg-indigo-100 text-indigo-700 text-xs md:text-sm font-bold rounded-lg hover:bg-indigo-200 transition">
                    Hôm nay
                </button>
            )}
        </div>
      </div>

       {/* Stats Grid - Responsive Grid: 1 cột (mobile) -> 3 cột (md) */}
       <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3 mb-8">
        <div className="flex items-center gap-4 rounded-xl bg-white p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-green-100"><CheckCircle className="text-green-500" size={20} /></div>
          <div><p className="text-xs md:text-sm font-medium text-gray-500">Hoàn thành</p><p className="text-xl md:text-2xl font-bold text-gray-900">{dailyStats?.daily_rate || 0}%</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-blue-100"><Activity className="text-blue-500" size={20} /></div>
          <div><p className="text-xs md:text-sm font-medium text-gray-500">Cần làm</p><p className="text-xl md:text-2xl font-bold text-gray-900">{dailyStats?.total_assigned || 0}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-orange-100"><Calendar className="text-orange-500" size={20} /></div>
          <div><p className="text-xs md:text-sm font-medium text-gray-500">Ngày chọn</p><p className="text-lg md:text-xl font-bold text-gray-900">{new Date(selectedDate).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}</p></div>
        </div>
      </div>

      {/* Habit List */}
      <div className="rounded-xl bg-white p-4 md:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Danh sách công việc</h2>
          {/* Search Box Responsive */}
          <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm nhanh..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    value={searchTerm} 
                    onChange={handleSearchChange}
                />
          </div>
        </div>
        
        <div className="space-y-3">
          {habits.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm">{searchTerm ? 'Không tìm thấy kết quả phù hợp.' : `Ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')} bạn không có lịch cho thói quen nào.`}</div>
          ) : (
            habits.map((habit) => {
              const todayLog = logsToday.find(log => log.habit_id === habit.id);
              const isDone = !!todayLog;
              const statusStyle = isDone ? getStatusStyle(todayLog.status) : getStatusStyle('DEFAULT');
              const categoryName = categories.find(c => c.id === habit.category_id)?.name || 'Chung';

              return (
                <div key={habit.id} onClick={() => handleCardClick(habit)}
                  className={`group flex items-center justify-between rounded-lg border p-3 pl-0 transition cursor-pointer select-none relative overflow-hidden
                    ${isDone ? `${statusStyle.bg} ${statusStyle.border} opacity-90` : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isDone ? statusStyle.color : 'bg-transparent'}`}></div>
                  
                  {/* Left Side Info */}
                  <div className="flex items-center gap-3 md:gap-4 pl-4 overflow-hidden">
                    <div className={`flex h-5 w-5 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isDone ? 'border-transparent bg-white shadow-sm' : 'border-gray-300 group-hover:border-indigo-400'}`} style={{ backgroundColor: isDone ? 'white' : 'transparent' }}>
                      {isDone ? statusStyle.icon : null} 
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-medium text-base md:text-lg truncate ${isDone ? 'text-gray-600 line-through' : 'text-gray-800'}`}>{habit.name}</span>
                        {isDone && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusStyle.border} bg-white opacity-80 whitespace-nowrap`}>{statusStyle.label}</span>}
                      </div>
                      <p className="text-xs md:text-sm text-gray-400 truncate">
                        {isDone && todayLog.value > 0 ? `Kết quả: ${todayLog.value} ${habit.unit || ''}` : (habit.target_value ? `Mục tiêu: ${habit.target_value} ${habit.unit}` : habit.desc)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right Side Info */}
                  <div className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 shrink-0">
                      {/* Ẩn Category trên mobile để tiết kiệm diện tích */}
                      <span className="hidden sm:inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{categoryName}</span>
                      
                      {isDone && (
                        <button onClick={(e) => handleUndo(e, habit)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Hủy kết quả (Undo)">
                            <RotateCcw size={18} />
                        </button>
                      )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CheckInModal 
        isOpen={isCheckInModalOpen} 
        onClose={() => setIsCheckInModalOpen(false)} 
        habit={checkInHabit} 
        logToEdit={logToEdit} 
        checkInDate={selectedDate} 
        onSuccess={() => fetchDashboardData(searchTerm, selectedDate)} 
      />
    </div>
  );
};

export default DashboardPage;

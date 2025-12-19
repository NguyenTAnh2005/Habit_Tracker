import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Plus, Calendar, Pencil, Trash2, Search } from 'lucide-react';
import habitApi from '../api/habitAPI';
import authApi from '../api/authApi';
import CreateHabitModal from '../components/CreateHabitModal';
import CheckInModal from '../components/CheckInModal';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  
  // State quản lý danh sách thói quen
  const [habits, setHabits] = useState([]); // Danh sách đang hiển thị (có thể đã bị lọc)
  const [allHabitsToday, setAllHabitsToday] = useState([]); // Danh sách gốc của ngày hôm nay
  
  const [logsToday, setLogsToday] = useState([]); 
  const [loading, setLoading] = useState(true);

  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [checkInHabit, setCheckInHabit] = useState(null); 
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  // --- HÀM LOAD DỮ LIỆU ---
  const fetchDashboardData = async () => {
    try {
      // 1. Gọi API lấy dữ liệu song song
      const [statsData, habitsTodayData, logsData] = await Promise.all([
        habitApi.getDailyStats(),
        habitApi.getHabitsToday(), // <--- DÙNG API MỚI (chỉ lấy việc hôm nay)
        habitApi.getTodaysLogs()
      ]);

      setDailyStats(statsData);
      setLogsToday(logsData);
      
      // 2. Lưu danh sách gốc
      setAllHabitsToday(habitsTodayData);

      // 3. Nếu đang có từ khóa tìm kiếm -> Lọc luôn trên client
      if (searchTerm) {
        const filtered = habitsTodayData.filter(h => 
            h.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setHabits(filtered);
      } else {
        setHabits(habitsTodayData);
      }

    } catch (error) {
      console.error("Lỗi load data:", error);
    }
  };

  // --- XỬ LÝ TÌM KIẾM (CLIENT SIDE) ---
  const handleSearchChange = (e) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);

    if (!keyword) {
        // Nếu xóa trắng ô tìm kiếm -> Hiện lại toàn bộ
        setHabits(allHabitsToday);
    } else {
        // Lọc trên danh sách gốc
        const filtered = allHabitsToday.filter(h => 
            h.name.toLowerCase().includes(keyword.toLowerCase())
        );
        setHabits(filtered);
    }
  };

  // Load lần đầu khi vào trang
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        await fetchDashboardData();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- CÁC HÀM SỰ KIỆN ---

  const handleCheckInClick = async (habit) => {
    const existingLog = logsToday.find(log => log.habit_id === habit.id);

    // UNDO CHECK-IN
    if (existingLog) {
      if (window.confirm(`Bạn muốn hủy check-in "${habit.name}"?`)) {
        try {
          await habitApi.deleteLog(existingLog.id); 
          await fetchDashboardData(); 
        } catch (error) {
          alert("Hủy thất bại!");
        }
      }
      return; 
    }

    // CHECK-IN (Định lượng hoặc Cơ bản)
    if (habit.target_value && habit.target_value > 0) {
      setCheckInHabit(habit);
      setIsCheckInModalOpen(true);
    } else {
      try {
        const getLocalDate = () => {
            const d = new Date();
            const offset = d.getTimezoneOffset() * 60000;
            return (new Date(d - offset)).toISOString().slice(0, 10);
        };
        await habitApi.checkIn({
          habit_id: habit.id,
          record_date: getLocalDate(),
          status: "COMPLETED"
        });
        await fetchDashboardData(); 
      } catch (error) {
        alert("Lỗi check-in: " + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleDeleteHabit = async (e, habitId) => {
    e.stopPropagation(); 
    if (window.confirm("Bạn có chắc chắn muốn xóa thói quen này không?")) {
      try {
        await habitApi.deleteHabit(habitId);
        await fetchDashboardData(); 
      } catch (error) {
        alert("Xóa thất bại!");
      }
    }
  };

  const handleEditHabit = (e, habit) => {
    e.stopPropagation(); 
    setEditingHabit(habit); 
    setIsCreateModalOpen(true); 
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingHabit(null); 
  };

  if (loading) return <div className="p-10 text-center">Đang tải... ⏳</div>;

  return (
    <div className="relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Xin chào, {user?.full_name || "Bạn"}! 👋</h1>
        <p className="mt-1 text-gray-500">Tiến độ ngày {new Date().toLocaleDateString('vi-VN')}</p>
      </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><CheckCircle className="text-green-500" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
            <p className="text-2xl font-bold text-gray-900">{dailyStats?.daily_rate || 0}%</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"><Activity className="text-blue-500" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Thói quen hôm nay</p>
            <p className="text-2xl font-bold text-gray-900">{allHabitsToday.length || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100"><Calendar className="text-orange-500" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Hôm nay</p>
            <p className="text-xl font-bold text-gray-900">{new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Danh sách thói quen */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Danh sách thói quen cần làm hôm nay</h2>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm nhanh..." 
                    className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition whitespace-nowrap"
            >
              <Plus size={18} /> Thêm mới
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {habits.length === 0 ? (
             <div className="text-center py-8 text-gray-400">
                {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Hôm nay bạn không có lịch cho thói quen nào.'}
             </div>
          ) : (
            habits.map((habit) => {
              const isCompleted = logsToday.some(log => log.habit_id === habit.id);
              const habitColor = habit.color || '#4F46E5';

              return (
                <div 
                  key={habit.id} 
                  onClick={() => handleCheckInClick(habit)}
                  className={`group flex items-center justify-between rounded-lg border p-4 transition cursor-pointer select-none
                    ${isCompleted ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${isCompleted ? 'border-transparent text-white' : 'border-gray-300 group-hover:border-indigo-400'}`}
                      style={{ backgroundColor: isCompleted ? habitColor : 'transparent' }}
                    >
                      {isCompleted && <CheckCircle size={16} fill="white" />}
                    </div>
                    <div>
                      <span className={`font-medium block text-lg ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{habit.name}</span>
                      <span className="text-sm text-gray-400">{habit.target_value ? `Mục tiêu: ${habit.target_value} ${habit.unit}` : habit.desc}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hidden md:inline-block">
                        {habit.category_id === 1 ? 'Chung' : 'Khác'}
                      </span>
                      <button onClick={(e) => handleEditHabit(e, habit)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition" title="Sửa"><Pencil size={18} /></button>
                      <button onClick={(e) => handleDeleteHabit(e, habit.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Xóa"><Trash2 size={18} /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateHabitModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => fetchDashboardData()} 
        habitToEdit={editingHabit} 
      />

      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        habit={checkInHabit}
        onSuccess={() => fetchDashboardData()} 
      />
    </div>
  );
};

export default DashboardPage;
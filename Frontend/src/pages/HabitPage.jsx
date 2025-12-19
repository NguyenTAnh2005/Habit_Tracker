import { useEffect, useState } from 'react';
// 👇 Thêm icon Flame, History
import { Plus, Search, Filter, Pencil, Trash2, CalendarDays, Flame, History } from 'lucide-react';
import habitApi from '../api/habitAPI';
import CreateHabitModal from '../components/CreateHabitModal';
import HabitHistoryModal from '../components/HabitHistoryModal'; // Import Modal Lịch sử bạn vừa làm

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Modal Lịch sử
  const [historyHabit, setHistoryHabit] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 👇 HÀM FETCH DATA (ĐÃ SỬA LOGIC LẤY STREAK)
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Lấy danh sách thói quen & danh mục trước
      const [habitsRes, catsRes] = await Promise.all([
        habitApi.getAllHabits({ search: search, category_id: selectedCat || null }),
        habitApi.getCategories()
      ]);

      // 2. Gọi API Stats cho từng habit để lấy Streak (Chạy song song)
      const habitsWithStreak = await Promise.all(habitsRes.map(async (habit) => {
        try {
          const stats = await habitApi.getHabitStreak(habit.id);
          return { ...habit, streak: stats.streak }; // Ghép streak vào object
        } catch (err) {
          return { ...habit, streak: 0 }; // Nếu lỗi hoặc chưa có log thì streak = 0
        }
      }));

      setHabits(habitsWithStreak); // Lưu danh sách đã có streak
      setCategories(catsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, selectedCat]);

  // ... (Các hàm handleDelete, openEdit, openCreate giữ nguyên) ...
  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa? Toàn bộ lịch sử của thói quen này sẽ mất!")) {
      try {
        await habitApi.deleteHabit(id);
        fetchData();
      } catch (e) {
        alert("Xóa thất bại");
      }
    }
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  // Hàm mở lịch sử
  const handleOpenHistory = (e, habit) => {
    e.stopPropagation();
    setHistoryHabit(habit);
    setIsHistoryModalOpen(true);
  };

  const formatFreq = (arr) => {
    if (!arr || arr.length === 7) return "Mỗi ngày";
    const mapDay = {2:'T2', 3:'T3', 4:'T4', 5:'T5', 6:'T6', 7:'T7', 8:'CN'};
    const list = Array.isArray(arr) ? arr : (typeof arr === 'string' ? arr.split(',').map(Number) : []);
    return list.map(d => mapDay[d]).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thói Quen</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <Plus size={20} /> Tạo mới
        </button>
      </div>

      {/* Toolbar Lọc (Giữ nguyên) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"/>
          <input 
            type="text" placeholder="Tìm tên thói quen..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-[150px]">
          <Filter className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"/>
          <select 
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
            value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Danh sách */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p>Đang tải...</p> : habits.length === 0 ? <p className="text-gray-500">Không tìm thấy thói quen nào.</p> : 
          habits.map(habit => (
            <div key={habit.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div className="px-3 py-1 rounded-full text-xs font-bold" style={{backgroundColor: habit.color + '20', color: habit.color}}>
                  {categories.find(c => c.id === habit.category_id)?.name || 'Chung'}
                </div>
                
                <div className="flex gap-2">
                  {/* Nút Xem Lịch Sử */}
                  <button onClick={(e) => handleOpenHistory(e, habit)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Xem lịch sử">
                    <History size={16}/>
                  </button>
                  {/* Nút Sửa */}
                  <button onClick={() => openEdit(habit)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={16}/></button>
                  {/* Nút Xóa */}
                  <button onClick={() => handleDelete(habit.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1">{habit.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{habit.desc || "Không có mô tả"}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2 text-sm text-gray-600">
                {/* 👇 HIỂN THỊ STREAK VÀ TẦN SUẤT */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-indigo-500"/>
                        <span>{formatFreq(habit.frequency)}</span>
                    </div>
                    
                    {/* Icon Ngọn lửa + Số Streak */}
                    <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg font-bold" title="Chuỗi liên tục hiện tại">
                        <Flame size={16} fill="currentColor" />
                        <span>{habit.streak || 0}</span>
                    </div>
                </div>

                {habit.target_value && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Mục tiêu:</span> 
                    {habit.target_value} {habit.unit}
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>

      <CreateHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
        habitToEdit={editingHabit} 
      />

      {/* Render Modal Lịch sử */}
      <HabitHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        habit={historyHabit}
      />
    </div>
  );
};

export default HabitsPage;
import { useEffect, useState } from 'react';
import { 
  Plus, Search, Filter, Pencil, Trash2, CalendarDays, 
  Flame, History, X, Eye, EyeOff, Lock 
} from 'lucide-react';
import habitApi from '../api/habitAPI';
import userApi from '../api/userAPI'; // 👈 Thêm userApi để xác thực
import CreateHabitModal from '../components/CreateHabitModal';
import HabitHistoryModal from '../components/HabitHistoryModal'; 

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [historyHabit, setHistoryHabit] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // --- STATE CHO LỚP BẢO MẬT XÓA ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [verifyPass, setVerifyPass] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [habitsRes, catsRes] = await Promise.all([
        habitApi.getAllHabits({ search: search, category_id: selectedCat || null }),
        habitApi.getCategories()
      ]);

      const habitsWithStreak = await Promise.all(habitsRes.map(async (habit) => {
        try {
          const stats = await habitApi.getHabitStreak(habit.id);
          return { ...habit, streak: stats.streak }; 
        } catch (err) {
          return { ...habit, streak: 0 }; 
        }
      }));

      setHabits(habitsWithStreak);
      setCategories(catsRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 500);
    return () => clearTimeout(timer);
  }, [search, selectedCat]);

  // 1. Khi bấm nút Xóa -> Hiện Modal xác nhận mật khẩu
  const handleDeleteClick = (habit) => {
    setHabitToDelete(habit);
    setVerifyPass('');
    setShowPass(false);
    setShowDeleteModal(true);
  };

  // 2. Xử lý xác nhận xóa sau khi nhập pass
  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      // Bước 1: Xác thực mật khẩu
      await userApi.verifyPassword(verifyPass);
      
      // Bước 2: Nếu pass đúng -> Xóa habit
      await habitApi.deleteHabit(habitToDelete.id);
      
      alert("✅ Đã xóa thói quen thành công!");
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      alert("❌ Mật khẩu không chính xác hoặc lỗi hệ thống!");
    } finally {
      setVerifying(false);
    }
  };

  const openEdit = (habit) => { setEditingHabit(habit); setIsModalOpen(true); };
  const openCreate = () => { setEditingHabit(null); setIsModalOpen(true); };
  
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
    <div className="space-y-6 pb-20">
      {/* Header & Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thói Quen</h1>
        <button onClick={openCreate} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          <Plus size={20} /> Tạo mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"/>
          <input type="text" placeholder="Tìm tên thói quen..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative md:w-48">
          <Filter className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"/>
          <select className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
            value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p>Đang tải...</p> : habits.length === 0 ? <p className="text-gray-500">Không tìm thấy thói quen nào.</p> : 
          habits.map(habit => (
            <div key={habit.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div className="px-3 py-1 rounded-full text-xs font-bold truncate max-w-[50%]" style={{backgroundColor: habit.color + '20', color: habit.color}}>
                  {categories.find(c => c.id === habit.category_id)?.name || 'Chung'}
                </div>
                
                <div className="flex gap-2">
                  <button onClick={(e) => handleOpenHistory(e, habit)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Xem lịch sử">
                    <History size={16}/>
                  </button>
                  <button onClick={() => openEdit(habit)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={16}/></button>
                  {/* 👇 SỬA HÀM ONCLICK */}
                  <button onClick={() => handleDeleteClick(habit)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{habit.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{habit.desc || "Không có mô tả"}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 max-w-[60%]"><CalendarDays size={16} className="text-indigo-500 shrink-0"/><span className="truncate">{formatFreq(habit.frequency)}</span></div>
                    <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg font-bold" title="Chuỗi liên tục hiện tại">
                        <Flame size={16} fill="currentColor" /><span>{habit.streak || 0}</span>
                    </div>
                </div>
                {habit.target_value && (<div className="flex items-center gap-2"><span className="font-semibold text-gray-800">Mục tiêu:</span> {habit.target_value} {habit.unit}</div>)}
              </div>
            </div>
          ))
        }
      </div>

      <CreateHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} habitToEdit={editingHabit} />
      <HabitHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} habit={historyHabit} />

      {/* 👇 MODAL XÁC MINH MẬT KHẨU ĐỂ XÓA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Lock size={20}/> Xác minh để xóa
              </h3>
              <button onClick={() => setShowDeleteModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
                Bạn đang thực hiện xóa thói quen <b>"{habitToDelete?.name}"</b>. <br/>
                Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử thói quen. Vui lòng nhập mật khẩu để xác nhận.
            </p>
            
            <form onSubmit={handleConfirmDelete}>
              <div className="mb-4 relative">
                  <input 
                    type={showPass ? "text" : "password"} 
                    autoFocus required
                    placeholder="Mật khẩu của bạn..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-red-500 outline-none"
                    value={verifyPass}
                    onChange={e => setVerifyPass(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition">
                    Hủy bỏ
                </button>
                <button type="submit" disabled={verifying} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition flex justify-center items-center gap-2">
                    {verifying ? "Đang xóa..." : "Xác nhận xóa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
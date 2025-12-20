import { useState, useEffect } from 'react';
import { User, Tag, X, Calendar, Mail, Shield } from 'lucide-react';
import habitApi from '../../api/habitAPI';
import userApi from '../../api/userAPI';

const HabitsManager = () => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try { const res = await habitApi.getAllHabitsAdmin(); setHabits(res); } 
            catch (e) { console.error(e); } finally { setLoading(false); }
        };
        load();
    }, []);

    const handleViewUser = async (userId) => {
        try {
            const user = await userApi.getUser(userId);
            setSelectedUser(user);
            setIsUserModalOpen(true);
        } catch (error) {
            alert("Không thể tải thông tin User: " + userId);
        }
    };

    const handleViewCategory = async (catId) => {
        try {
            const cat = await habitApi.getCategory(catId);
            setSelectedCategory(cat);
            setIsCatModalOpen(true);
        } catch (error) {
            alert("Không thể tải thông tin danh mục: " + catId);
        }
    };

    if (loading) return <p className="p-8 text-center text-gray-500">Đang tải dữ liệu...</p>;

    return (
        // Thêm overflow-x-auto vào đây để bảng cuộn được trên mobile
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">ID</th>
                        <th className="px-4 py-3">Tên Habit</th>
                        <th className="px-4 py-3">Người dùng</th>
                        <th className="px-4 py-3">Danh mục</th>
                        <th className="px-4 py-3">Mục tiêu</th>
                        <th className="px-4 py-3 rounded-tr-lg">Ngày tạo</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-t border-gray-100 bg-white">
                    {habits.map(h => (
                        <tr key={h.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-gray-500">#{h.id}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                            
                            <td className="px-4 py-3">
                                <button 
                                    onClick={() => handleViewUser(h.user_id)}
                                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold hover:bg-indigo-100 transition"
                                >
                                    <User size={12}/> UID: {h.user_id}
                                </button>
                            </td>

                            <td className="px-4 py-3">
                                <button 
                                    onClick={() => handleViewCategory(h.category_id)}
                                    className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold hover:bg-orange-100 transition"
                                >
                                    <Tag size={12}/> CID: {h.category_id}
                                </button>
                            </td>

                            <td className="px-4 py-3">{h.target_value ? `${h.target_value} ${h.unit}` : 'Không'}</td>
                            <td className="px-4 py-3 text-gray-500">{new Date(h.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {habits.length === 0 && <div className="text-center py-8 text-gray-400">Chưa có thói quen nào trong hệ thống.</div>}

            {/* ================= MODAL USER INFO ================= */}
            {isUserModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2"><User/> Thông tin User</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="hover:bg-white/20 p-1 rounded"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{selectedUser.full_name}</h2>
                                <p className="text-gray-500">@{selectedUser.username}</p>
                            </div>
                            
                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Mail className="text-gray-400" size={18}/> 
                                    <span className="truncate">{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Shield className="text-gray-400" size={18}/> 
                                    <span className={selectedUser.role_id === 1 ? "text-purple-600 font-bold" : "text-gray-600"}>
                                        {selectedUser.role_id === 1 ? "Quản trị viên (Admin)" : "Người dùng (User)"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Calendar className="text-gray-400" size={18}/> 
                                    <span>Tham gia: {new Date(selectedUser.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL CATEGORY INFO ================= */}
            {isCatModalOpen && selectedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Tag className="text-orange-500"/> Chi tiết Danh mục</h3>
                            <button onClick={() => setIsCatModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">Tên danh mục</label>
                                <p className="text-xl font-bold text-gray-800 mt-1">{selectedCategory.name}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Mô tả</label>
                                <p className="text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {selectedCategory.desc || "Không có mô tả nào."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HabitsManager;
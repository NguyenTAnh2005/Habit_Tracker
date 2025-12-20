import { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldCheck, X } from 'lucide-react';
import userApi from '../../api/userAPI';

const RolesManager = () => {
    const [roles, setRoles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', desc: '' });

    const fetchRoles = async () => {
        try { const res = await userApi.getAllRoles(); setRoles(res); } catch (e) { console.error(e); }
    };
    useEffect(() => { fetchRoles(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await userApi.createRole(form);
            alert("Đã tạo Role mới!");
            setIsModalOpen(false); 
            fetchRoles();
        } catch (error) { alert("Lỗi: " + (error.response?.data?.detail || "Không thể tạo")); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Xóa quyền này? Các user đang có quyền này sẽ bị lỗi.")) return;
        try {
            await userApi.deleteRole(id);
            fetchRoles();
        } catch (error) { 
            alert("Không thể xóa: " + error.response?.data?.detail); 
        }
    };

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button onClick={() => { setForm({name: '', desc: ''}); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow font-medium">
                    <Plus size={18}/> Thêm Role
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(r => (
                    <div key={r.id} className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck size={18} className="text-indigo-600 shrink-0"/>
                                <h3 className="font-bold text-gray-800 text-lg truncate">{r.name}</h3>
                            </div>
                            <p className="text-sm text-gray-500 ml-6 line-clamp-2">{r.desc || "Không có mô tả"}</p>
                            <p className="text-xs text-gray-400 mt-2 ml-6 font-mono">ID: {r.id}</p>
                        </div>
                        {/* Chỉ hiện nút xóa với các role custom (ID > 2) */}
                        {r.id > 2 && (
                            <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50 shrink-0 transition">
                                <Trash2 size={18}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                    {/* Thêm animate-in zoom-in và overflow cho mobile */}
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Tạo Role Mới</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên Role</label>
                                <input type="text" placeholder="VD: Moderator" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea placeholder="Mô tả quyền hạn..." className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" rows="3"
                                    value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-3 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesManager;
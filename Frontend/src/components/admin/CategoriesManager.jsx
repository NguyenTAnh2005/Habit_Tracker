import { useState, useEffect } from 'react';
import { Trash2, Pencil, Plus, X } from 'lucide-react';
import habitApi from '../../api/habitAPI';

const CategoriesManager = () => {
    const [cats, setCats] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState(null); 
    const [form, setForm] = useState({ name: '', desc: '' });

    // Load danh sách
    const fetchCats = async () => {
        try { 
            const res = await habitApi.getCategories(); 
            setCats(res); 
        } catch (e) { 
            console.error("Lỗi load categories:", e); 
        }
    };

    useEffect(() => { fetchCats(); }, []);

    // Xử lý Submit (Tạo / Sửa)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCat) {
                await habitApi.updateCategory(editingCat.id, form);
                alert("✅ Cập nhật danh mục thành công!"); 
            } else {
                await habitApi.createCategory(form);
                alert("✅ Tạo danh mục mới thành công!"); 
            }
            setIsModalOpen(false); 
            fetchCats();
        } catch (error) { 
            const msg = error.response?.data?.detail || "Có lỗi xảy ra khi lưu!";
            alert("❌ Lỗi: " + msg); 
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id) => {
        if(!window.confirm("Bạn muốn xóa danh mục này?")) return;
        try {
            await habitApi.deleteCategory(id);
            alert("✅ Đã xóa danh mục thành công!");
            fetchCats();
        } catch (error) { 
            const msg = error.response?.data?.detail || "Lỗi server hoặc mất kết nối";
            alert("⚠️ Không thể xóa: " + msg); 
        }
    };

    const openCreate = () => { setEditingCat(null); setForm({name: '', desc: ''}); setIsModalOpen(true); };
    const openEdit = (cat) => { setEditingCat(cat); setForm({name: cat.name, desc: cat.desc}); setIsModalOpen(true); };

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow"><Plus size={18}/> Thêm danh mục</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cats.map(c => (
                    <div key={c.id} className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition flex justify-between items-start group">
                        <div className="min-w-0">
                            <h3 className="font-bold text-gray-800 text-lg truncate">{c.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.desc || "Không có mô tả"}</p>
                        </div>
                        {/* Fix nút bấm responsive */}
                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                            <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-indigo-600 rounded bg-gray-50 hover:bg-indigo-50"><Pencil size={18}/></button>
                            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold mb-4">{editingCat ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                                <input type="text" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" rows="3"
                                    value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-3 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesManager;
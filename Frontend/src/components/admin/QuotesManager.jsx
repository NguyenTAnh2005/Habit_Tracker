import { useState, useEffect } from 'react';
import { Trash2, Pencil, Plus, X } from 'lucide-react';
import habitApi from '../../api/habitAPI';

const QuotesManager = () => {
    const [quotes, setQuotes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [form, setForm] = useState({ quote: '', author: '' });

    const fetchQuotes = async () => {
        try { const res = await habitApi.getAllQuotes(); setQuotes(res); } catch (e) { console.error(e); }
    };
    useEffect(() => { fetchQuotes(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingQuote) {
                await habitApi.updateQuote(editingQuote.id, form);
                alert("✅ Cập nhật câu nói thành công!");
            } else {
                await habitApi.createQuote(form);
                alert("✅ Thêm câu nói mới thành công!");
            }
            
            setIsModalOpen(false); 
            fetchQuotes();
            
        } catch (error) { 
            const msg = error.response?.data?.detail || "Có lỗi xảy ra khi lưu!";
            alert("❌ Lỗi: " + msg); 
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Xóa câu nói này?")) {
            await habitApi.deleteQuote(id); fetchQuotes();
        }
    };

    const openCreate = () => { setEditingQuote(null); setForm({quote: '', author: ''}); setIsModalOpen(true); };
    const openEdit = (q) => { setEditingQuote(q); setForm({quote: q.quote, author: q.author}); setIsModalOpen(true); };

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow"><Plus size={18}/> Thêm câu nói</button>
            </div>
            <div className="space-y-3">
                {quotes.map(q => (
                    <div key={q.id} className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center group hover:border-indigo-200 transition gap-3">
                        <div className="flex-1">
                            <p className="font-medium text-gray-800 text-lg italic">"{q.quote}"</p>
                            <p className="text-sm text-indigo-600 font-semibold mt-1">— {q.author || 'Khuyết danh'}</p>
                        </div>
                        {/* Fix Responsive: 
                           - opacity-100: Mặc định hiện (cho mobile)
                           - md:opacity-0: Ẩn trên Desktop
                           - md:group-hover:opacity-100: Hiện khi hover trên Desktop
                        */}
                        <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity justify-end">
                            <button onClick={() => openEdit(q)} className="p-2 text-gray-400 hover:text-indigo-600 rounded bg-gray-50 hover:bg-indigo-50"><Pencil size={18}/></button>
                            <button onClick={() => handleDelete(q.id)} className="p-2 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold mb-4">{editingQuote ? 'Sửa Quote' : 'Thêm Quote'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung</label>
                                <textarea required rows="3" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    value={form.quote} onChange={e => setForm({...form, quote: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tác giả</label>
                                <input type="text" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" 
                                    value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
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

export default QuotesManager;
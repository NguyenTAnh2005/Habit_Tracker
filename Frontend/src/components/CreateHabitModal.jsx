import { useState, useEffect } from 'react';
import { X, Save, CalendarDays, Target, Hash, Palette } from 'lucide-react';
import habitApi from '../api/habitAPI';

const CreateHabitModal = ({ isOpen, onClose, onSuccess, habitToEdit }) => {
  const [loading, setLoading] = useState(false);

  // State form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState([2, 3, 4, 5, 6, 7, 8]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  
  // State nâng cao
  const [isQuantitative, setIsQuantitative] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [color, setColor] = useState('#4F46E5');

  const daysOfWeek = [
    { label: 'T2', value: 2 }, { label: 'T3', value: 3 }, { label: 'T4', value: 4 },
    { label: 'T5', value: 5 }, { label: 'T6', value: 6 }, { label: 'T7', value: 7 }, { label: 'CN', value: 8 },
  ];

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const res = await habitApi.getCategories();
          setCategories(res);
          if (!habitToEdit && res.length > 0) setCategoryId(res[0].id);
        } catch (error) {
          console.error(error);
        }
      };
      fetchCategories();

      if (habitToEdit) {
        setName(habitToEdit.name);
        setDescription(habitToEdit.desc || '');
        
        let freqData = habitToEdit.frequency;
        if (typeof freqData === 'string') {
            freqData = freqData.split(',').map(Number);
        }
        setFrequency(freqData || []);

        setCategoryId(habitToEdit.category_id);
        setColor(habitToEdit.color || '#4F46E5');

        if (habitToEdit.target_value) {
          setIsQuantitative(true);
          setTargetValue(habitToEdit.target_value);
          setUnit(habitToEdit.unit || '');
        } else {
          setIsQuantitative(false);
          setTargetValue('');
          setUnit('');
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, habitToEdit]);

  const resetForm = () => {
    setName(''); setDescription('');
    setFrequency([2, 3, 4, 5, 6, 7, 8]);
    setIsQuantitative(false);
    setColor('#4F46E5');
    setTargetValue(''); setUnit('');
  };

  const toggleDay = (dayValue) => {
    if (frequency.includes(dayValue)) {
      setFrequency(frequency.filter(d => d !== dayValue));
    } else {
      setFrequency([...frequency, dayValue].sort());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (frequency.length === 0) {
      alert("Chọn ít nhất 1 ngày!"); return;
    }
    
    setLoading(true);
    try {
      const payload = {
        name,
        desc: description,
        frequency: frequency,
        target_value: isQuantitative ? parseFloat(targetValue) : null,
        unit: isQuantitative ? unit : null,
        category_id: categoryId ? parseInt(categoryId) : 1,
        color: color
      };

      if (habitToEdit) {
        await habitApi.updateHabit(habitToEdit.id, payload);
      } else {
        await habitApi.createHabit(payload);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Lỗi: " + (error.response?.data?.detail || "Thất bại"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      
      {/* Container: flex flex-col và max-h-[90vh] để giới hạn chiều cao và tạo layout Header/Body/Footer */}
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        
        {/* === HEADER (Fixed) === */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {habitToEdit ? '✏️ Cập nhật' : '✨ Tạo thói quen'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>

        {/* === BODY FORM (Scrollable) === */}
        <div className="flex-1 overflow-y-auto p-6">
            <form id="habit-form" onSubmit={handleSubmit} className="space-y-5">
                
                {/* Tên & Danh mục */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Tên thói quen *</label>
                        <input type="text" required placeholder="VD: Tập thể dục" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1 text-gray-700">Danh mục</label>
                            <select className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Màu sắc</label>
                            <div className="flex items-center gap-2 h-[42px] border rounded-lg px-2 w-full sm:w-auto">
                                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-12 border-none bg-transparent cursor-pointer"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Mô tả ngắn</label>
                        <textarea className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                            placeholder="Mô tả mục đích..." rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>
                </div>

                {/* Tần suất */}
                <div>
                    <label className=" text-sm font-medium mb-2 flex items-center gap-2 text-gray-700"><CalendarDays size={18} className="text-indigo-600"/> Lặp lại:</label>
                    <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map(day => (
                            <button key={day.value} type="button" onClick={() => toggleDay(day.value)}
                                className={`h-10 w-10 rounded-full text-sm font-bold transition-all ${frequency.includes(day.value) ? 'text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                style={frequency.includes(day.value) ? {backgroundColor: color} : {}}>{day.label}</button>
                        ))}
                    </div>
                </div>

                {/* Định lượng */}
                <div className="rounded-xl border p-4 bg-gray-50 transition-all">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-medium flex items-center gap-2 text-gray-700"><Target size={18} className="text-orange-500"/> Có mục tiêu số lượng?</label>
                        <button type="button" onClick={() => setIsQuantitative(!isQuantitative)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isQuantitative ? '' : 'bg-gray-300'}`} style={isQuantitative ? {backgroundColor: color} : {}}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isQuantitative ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    {isQuantitative && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                            <div>
                                <input type="number" step="0.1" placeholder="Số lượng (5)" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
                            </div>
                            <div>
                                <input type="text" placeholder="Đơn vị (km, trang)" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={unit} onChange={e => setUnit(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>

        {/* === FOOTER (Fixed) === */}
        <div className="flex justify-end gap-3 border-t px-6 py-4 bg-gray-50 rounded-b-2xl shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">Hủy</button>
            <button form="habit-form" type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 text-white rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-70 font-bold"
                style={{backgroundColor: color}}>
                {loading ? 'Đang lưu...' : <><Save size={18} /> {habitToEdit ? 'Cập nhật' : 'Lưu lại'}</>}
            </button>
        </div>

      </div>
    </div>
  );
};

export default CreateHabitModal;
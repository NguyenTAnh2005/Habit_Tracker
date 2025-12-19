import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, FastForward, PieChart } from 'lucide-react';
import habitApi from '../api/habitAPI';

const CheckInModal = ({ isOpen, onClose, habit, logToEdit = null, checkInDate, onSuccess }) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('COMPLETED'); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && habit) {
      if (logToEdit) {
        setStatus(logToEdit.status);
        setValue(logToEdit.value > 0 ? logToEdit.value : '');
      } else {
        setValue('');
        setStatus('COMPLETED');
      }
    }
  }, [isOpen, habit, logToEdit]);

  if (!isOpen || !habit) return null;

  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d - offset)).toISOString().slice(0, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numValue = parseFloat(value);
    const target = habit?.target_value;
    if (target && target > 0) {
        if (status === 'COMPLETED' && (!value || numValue < target)) {
            alert(`⚠️ Lỗi: Để "Hoàn thành", kết quả phải >= ${target}!`); return;
        }
    }

    setLoading(true);
    try {
      const finalValue = (status === 'COMPLETED' || status === 'PARTIAL') && value ? parseFloat(value) : 0;

      if (logToEdit) {
        await habitApi.updateLog(logToEdit.id, {
          habit_id: habit.id,
          status: status,
          value: finalValue,
          record_date: logToEdit.record_date 
        });
        alert("Cập nhật thành công!");
      } else {
        await habitApi.checkIn({
          habit_id: habit.id,
          record_date: checkInDate || getLocalDate(), 
          status: status, 
          value: finalValue
        });
        alert("Check-in thành công!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert("Thất bại: " + (error.response?.data?.detail || "Lỗi server"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">{logToEdit ? 'Sửa nhật ký' : 'Check-in'}: {habit.name}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-4 text-sm text-center bg-indigo-50 text-indigo-700 py-1 rounded border border-indigo-100">
            Ngày: <b>{new Date(logToEdit ? logToEdit.record_date : (checkInDate || getLocalDate())).toLocaleDateString('vi-VN')}</b>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái:</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setStatus('COMPLETED')} className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${status === 'COMPLETED' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}><CheckCircle size={18} /> Hoàn thành</button>
              <button type="button" onClick={() => setStatus('PARTIAL')} className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${status === 'PARTIAL' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}><PieChart size={18} /> Một phần</button>
              <button type="button" onClick={() => setStatus('SKIPPED')} className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${status === 'SKIPPED' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}><FastForward size={18} /> Bỏ qua</button>
              <button type="button" onClick={() => setStatus('FAILED')} className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${status === 'FAILED' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}><AlertCircle size={18} /> Thất bại</button>
            </div>
          </div>

          {(status === 'COMPLETED' || status === 'PARTIAL') && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả thực tế ({habit.unit || 'lần'}):</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.1" required autoFocus className="flex-1 rounded-lg border border-gray-300 p-2.5 text-lg font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={status === 'PARTIAL' ? 'VD: 0.5' : habit.target_value} value={value} onChange={(e) => setValue(e.target.value)} />
                <span className="text-gray-500 font-medium">/ {habit.target_value || '∞'}</span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-bold text-white transition shadow-md ${status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : status === 'PARTIAL' ? 'bg-blue-600 hover:bg-blue-700' : status === 'SKIPPED' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}`}>
            {loading ? 'Đang xử lý...' : (logToEdit ? 'Lưu thay đổi' : 'Xác nhận Check-in')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
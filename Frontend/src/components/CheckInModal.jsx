import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, FastForward, PieChart } from 'lucide-react';
import habitApi from '../api/habitAPI';

const CheckInModal = ({ isOpen, onClose, habit, logToEdit = null, checkInDate, onSuccess }) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('COMPLETED'); 
  const [loading, setLoading] = useState(false);

  // Kiểm tra xem habit này có mục tiêu số hay không (VD: 2 lít, 5 km...)
  // Nếu null hoặc 0 => Dạng Boolean (Làm/Không làm)
  const hasTarget = habit?.target_value && habit.target_value > 0;

  useEffect(() => {
    if (isOpen && habit) {
      if (logToEdit) {
        setStatus(logToEdit.status);
        // Chỉ set value nếu habit có target
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

  // Cấu hình danh sách trạng thái
  const STATUS_OPTIONS = [
    { 
      id: 'COMPLETED', 
      label: 'Hoàn thành', 
      desc: 'Đã xong hết',
      icon: CheckCircle, 
      activeClass: 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500',
      hoverClass: 'hover:bg-green-50 hover:border-green-300 hover:text-green-600'
    },
    { 
      id: 'PARTIAL', 
      label: 'Một phần', 
      desc: 'Chưa đủ chỉ tiêu',
      icon: PieChart, 
      activeClass: 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500',
      hoverClass: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600',
      hidden: !hasTarget // 👈 Ẩn nếu không có target
    },
    { 
      id: 'SKIPPED', 
      label: 'Bỏ qua', 
      desc: 'Bận / Nghỉ ngơi',
      icon: FastForward, 
      activeClass: 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500',
      hoverClass: 'hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600'
    },
    { 
      id: 'FAILED', 
      label: 'Thất bại', 
      desc: 'Quên / Không làm',
      icon: AlertCircle, 
      activeClass: 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500',
      hoverClass: 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalValue = 0;

    // --- 1. LOGIC CHO HABIT CÓ SỐ LƯỢNG (Target > 0) ---
    if (hasTarget) {
        const numValue = parseFloat(value);
        const target = habit.target_value;

        // Validation
        if (status === 'COMPLETED' && (!value || numValue < target)) {
            alert(`⚠️ Lỗi: Để "Hoàn thành", kết quả phải >= ${target}!`); 
            return;
        }
        if (status === 'PARTIAL') {
            if (!value || numValue <= 0) {
                alert(`⚠️ Lỗi: Kết quả thực hiện phải lớn hơn 0!`); return;
            }
            if (numValue >= target) {
                alert(`⚠️ Lỗi: Bạn đã đạt mục tiêu (${target}). Vui lòng chọn "Hoàn thành"!`); return;
            }
        }
        
        // Gán value
        finalValue = (status === 'COMPLETED' || status === 'PARTIAL') && value ? parseFloat(value) : 0;
    } 
    // --- 2. LOGIC CHO HABIT BOOLEAN (Target = Null/0) ---
    else {
        // Nếu chọn Hoàn thành -> Tự động tính là 1 (Done). Các trạng thái khác là 0.
        finalValue = (status === 'COMPLETED') ? 1 : 0;
    }

    setLoading(true);
    try {
      const payload = {
          habit_id: habit.id,
          record_date: logToEdit ? logToEdit.record_date : (checkInDate || getLocalDate()),
          status: status,
          value: finalValue
      };

      if (logToEdit) {
        await habitApi.updateLog(logToEdit.id, payload);
        alert("Cập nhật thành công!");
      } else {
        await habitApi.checkIn(payload);
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
          <h3 className="text-lg font-bold text-gray-800 truncate pr-2">{logToEdit ? 'Sửa nhật ký' : 'Check-in'}: {habit.name}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="mb-4 text-sm text-center bg-indigo-50 text-indigo-700 py-1 rounded border border-indigo-100">
            Ngày: <b>{new Date(logToEdit ? logToEdit.record_date : (checkInDate || getLocalDate())).toLocaleDateString('vi-VN')}</b>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái:</label>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_OPTIONS.map((opt) => {
                  if (opt.hidden) return null; // Ẩn nút nếu cần (VD: Partial)
                  const Icon = opt.icon;
                  const isSelected = status === opt.id;
                  
                  return (
                    <button 
                        key={opt.id}
                        type="button" 
                        onClick={() => setStatus(opt.id)} 
                        className={`
                            p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200
                            ${isSelected ? opt.activeClass : `border-gray-200 text-gray-500 ${opt.hoverClass}`}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            <Icon size={18} />
                            <span className="font-bold text-sm">{opt.label}</span>
                        </div>
                        {/* 👇 CHÚ THÍCH TRẠNG THÁI Ở ĐÂY */}
                        <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'opacity-60'}`}>{opt.desc}</span>
                    </button>
                  );
              })}
            </div>
          </div>

          {/* Chỉ hiện ô nhập khi: Có Target VÀ (Chọn Completed hoặc Partial) */}
          {hasTarget && (status === 'COMPLETED' || status === 'PARTIAL') && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả thực tế ({habit.unit || 'lần'}):</label>
              <div className="flex items-center gap-2">
                <input 
                    type="number" step="0.1" required autoFocus 
                    className="flex-1 rounded-lg border border-gray-300 p-2.5 text-lg font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder={status === 'PARTIAL' ? 'VD: 0.5' : habit.target_value} 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                />
                <span className="text-gray-500 font-medium">/ {habit.target_value}</span>
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
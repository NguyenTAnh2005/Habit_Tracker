import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, FastForward, PieChart } from 'lucide-react';
import habitApi from '../api/habitAPI';

const CheckInModal = ({ isOpen, onClose, habit, onSuccess }) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('COMPLETED'); 
  const [loading, setLoading] = useState(false);

  // Reset form mỗi khi mở modal
  useEffect(() => {
    if (isOpen && habit) {
      setValue('');
      setStatus('COMPLETED');
    }
  }, [isOpen, habit]);

  if (!isOpen || !habit) return null;

  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return (new Date(d - offset)).toISOString().slice(0, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 👇 --- BẮT ĐẦU LOGIC VALIDATE MỚI ---
    const numValue = parseFloat(value);
    const target = habit?.target_value; // Lấy mục tiêu của thói quen

    // Chỉ kiểm tra nếu thói quen có định lượng (có target_value)
    if (target && target > 0) {
      // 1. Logic cho HOÀN THÀNH (COMPLETED)
      if (status === 'COMPLETED') {
        if (!value || numValue < target) {
          alert(`⚠️ Lỗi: Để "Hoàn thành", kết quả phải lớn hơn hoặc bằng mục tiêu (${target} ${habit.unit || ''})!\n\nHãy nhập đúng số lượng hoặc chọn "Một phần" nếu chưa làm xong.`);
          return; // Dừng lại, không gửi API
        }
      }

      // 2. Logic cho MỘT PHẦN (PARTIAL)
      if (status === 'PARTIAL') {
        if (!value || numValue <= 0) {
          alert("⚠️ Lỗi: Giá trị thực hiện phải lớn hơn 0.");
          return;
        }
        if (numValue >= target) {
          alert(`🎉 Bạn đã đạt đủ mục tiêu (${target} ${habit.unit || ''}) rồi!\n\nHãy chuyển sang chọn trạng thái "Hoàn thành" để được tính điểm tối đa nhé.`);
          return;
        }
      }
    }
    // 👆 --- KẾT THÚC LOGIC VALIDATE ---

    setLoading(true);
    try {
      // Logic giá trị: Chỉ gửi value nếu là COMPLETED hoặc PARTIAL
      const finalValue = (status === 'COMPLETED' || status === 'PARTIAL') && value 
        ? parseFloat(value) 
        : 0;

      await habitApi.checkIn({
        habit_id: habit.id,
        record_date: getLocalDate(),
        status: status, 
        value: finalValue
      });

      onSuccess();
      onClose();
    } catch (error) {
      alert("Check-in thất bại: " + (error.response?.data?.detail || "Lỗi server"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Check-in: {habit.name}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 👇 1. Chọn Trạng thái (Grid 2x2) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái hôm nay:</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Nút HOÀN THÀNH */}
              <button
                type="button"
                onClick={() => setStatus('COMPLETED')}
                className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${
                  status === 'COMPLETED' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <CheckCircle size={18} /> Hoàn thành
              </button>

              {/* Nút MỘT PHẦN (Mới) */}
              <button
                type="button"
                onClick={() => setStatus('PARTIAL')}
                className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${
                  status === 'PARTIAL' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <PieChart size={18} /> Một phần
              </button>

              {/* Nút BỎ QUA */}
              <button
                type="button"
                onClick={() => setStatus('SKIPPED')}
                className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${
                  status === 'SKIPPED' ? 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <FastForward size={18} /> Bỏ qua
              </button>

              {/* Nút THẤT BẠI */}
              <button
                type="button"
                onClick={() => setStatus('FAILED')}
                className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition ${
                  status === 'FAILED' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <AlertCircle size={18} /> Thất bại
              </button>
            </div>
          </div>

          {/* 👇 2. Nhập số lượng (Hiện khi chọn Xong HOẶC Một phần) */}
          {(status === 'COMPLETED' || status === 'PARTIAL') && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kết quả thực tế ({habit.unit || 'lần'}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.1" required autoFocus
                  className="flex-1 rounded-lg border border-gray-300 p-2.5 text-lg font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={status === 'PARTIAL' ? 'VD: 0.5' : habit.target_value}
                  value={value} onChange={(e) => setValue(e.target.value)}
                />
                <span className="text-gray-500 font-medium">/ {habit.target_value || '∞'}</span>
              </div>
              {status === 'PARTIAL' && (
                <p className="text-xs text-blue-600 mt-2">
                  * Ghi chú: Bạn chưa đạt đủ mục tiêu nhưng vẫn có sự cố gắng! 💪
                </p>
              )}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition shadow-md flex justify-center items-center gap-2
              ${status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : 
                status === 'PARTIAL' ? 'bg-blue-600 hover:bg-blue-700' :
                status === 'SKIPPED' ? 'bg-yellow-500 hover:bg-yellow-600' : 
                'bg-red-500 hover:bg-red-600'}`}
          >
            {loading ? 'Đang lưu...' : 'Xác nhận Check-in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
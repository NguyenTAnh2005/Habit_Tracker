import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import habitApi from '../api/habitAPI';

const CheckInModal = ({ isOpen, onClose, habit, onSuccess }) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !habit) return null;

  // 👇 HÀM MỚI: Lấy ngày hiện tại theo giờ máy tính (Local Time)
  const getLocalDate = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - offset)).toISOString().slice(0, 10);
    return localISOTime; // Trả về YYYY-MM-DD đúng giờ VN
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await habitApi.checkIn({
        habit_id: habit.id,
        record_date: getLocalDate(), // 👈 DÙNG HÀM NÀY THAY VÌ new Date().toISOString()
        status: "COMPLETED",
        value: parseFloat(value) || 0 // Fix lỗi nếu value rỗng
      });

      onSuccess();
      onClose();
      setValue('');
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
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bạn đã đạt được bao nhiêu {habit.unit}?
            </label>
            <input
              type="number" step="0.1" required autoFocus
              className="w-full rounded-lg border border-gray-300 p-3 text-lg font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder={`Mục tiêu: ${habit.target_value}`}
              value={value} onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex justify-center items-center gap-2 rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 transition"
          >
            {loading ? 'Đang lưu...' : <><CheckCircle size={20} /> Hoàn thành</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
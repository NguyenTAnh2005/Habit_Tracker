import { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import habitApi from '../api/habitAPI';

const HabitHistoryModal = ({ isOpen, onClose, habit }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0); // Trang hiện tại (bắt đầu từ 0)
  
  // Mặc định lấy tháng hiện tại (Format: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const LIMIT = 10; // Số lượng log mỗi trang

  // Mỗi khi mở Modal hoặc đổi Tháng/Trang -> Gọi API
  useEffect(() => {
    if (isOpen && habit) {
      fetchLogs();
    }
  }, [isOpen, habit, page, selectedMonth]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 1. Tính ngày đầu tháng và cuối tháng từ selectedMonth
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Ngày 0 của tháng sau = ngày cuối tháng này

      // Format sang YYYY-MM-DD để gửi xuống Backend
      // Lưu ý: Dùng chuỗi cứng để tránh lệch múi giờ
      const fDate = `${year}-${month}-01`;
      const tDate = `${year}-${month}-${endDate.getDate()}`;

      // 2. Gọi API lấy lịch sử (Cần thêm hàm này vào habitAPI.js)
      const res = await habitApi.getHabitLogs(habit.id, {
        skip: page * LIMIT,
        limit: LIMIT,
        from_date: fDate,
        to_date: tDate
      });
      
      setLogs(res);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Lịch sử: {habit.name}</h3>
            <p className="text-xs text-gray-500">Xem lại các lần check-in của thói quen này</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Toolbar: Chọn tháng & Phân trang */}
        <div className="flex justify-between items-center mb-4">
            {/* Bộ chọn tháng */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                <Calendar size={16} className="text-gray-500"/>
                <input 
                    type="month" 
                    className="bg-transparent text-sm outline-none text-gray-700 font-medium cursor-pointer"
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setPage(0); // Reset về trang 1 khi đổi tháng
                    }}
                />
            </div>
            
            {/* Nút Phân trang (Next/Prev) */}
            <div className="flex gap-1">
                <button 
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Trang trước"
                >
                    <ChevronLeft size={20}/>
                </button>
                <button 
                    disabled={logs.length < LIMIT} // Nếu trả về ít hơn Limit nghĩa là hết dữ liệu
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Trang sau"
                >
                    <ChevronRight size={20}/>
                </button>
            </div>
        </div>

        {/* Danh sách Logs (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
                <div className="text-center py-10 text-gray-400">Đang tải dữ liệu...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                    Không có dữ liệu check-in nào trong tháng {selectedMonth.split('-')[1]}.
                </div>
            ) : (
                <div className="space-y-2">
                    {logs.map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                            
                            {/* Cột trái: Ngày tháng */}
                            <div className="flex items-center gap-3">
                                {/* Thanh màu trạng thái */}
                                <div className={`w-1.5 h-10 rounded-full ${
                                    log.status === 'COMPLETED' ? 'bg-green-500' : 
                                    log.status === 'PARTIAL' ? 'bg-blue-500' :
                                    log.status === 'SKIPPED' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                
                                <div>
                                    <p className="text-sm font-bold text-gray-700">
                                        {new Date(log.record_date).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {new Date(log.record_date).toLocaleDateString('vi-VN', {weekday: 'long'})}
                                    </p>
                                </div>
                            </div>

                            {/* Cột phải: Giá trị & Trạng thái */}
                            <div className="text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border 
                                    ${log.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                      log.status === 'PARTIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      log.status === 'SKIPPED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                      'bg-red-50 text-red-700 border-red-200'}`}>
                                    {log.status === 'PARTIAL' && <PieChart size={10} />}
                                    {log.status}
                                </span>
                                {log.value > 0 && (
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                        Kết quả: {log.value} {log.unit || habit.unit}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* Footer: Số trang */}
        <div className="mt-4 pt-3 border-t text-center text-xs text-gray-400">
            Trang {page + 1}
        </div>

      </div>
    </div>
  );
};

export default HabitHistoryModal;
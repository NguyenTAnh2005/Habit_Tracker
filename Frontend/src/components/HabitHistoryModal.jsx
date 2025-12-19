import { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, PieChart, Pencil } from 'lucide-react';
import habitApi from '../api/habitAPI';
import CheckInModal from './CheckInModal';

const HabitHistoryModal = ({ isOpen, onClose, habit }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // State chỉnh sửa log
  const [editingLog, setEditingLog] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    if (isOpen && habit) fetchLogs();
  }, [isOpen, habit, page, selectedMonth]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const endDate = new Date(year, month, 0);
      const fDate = `${year}-${month}-01`;
      const tDate = `${year}-${month}-${endDate.getDate()}`;

      const res = await habitApi.getHabitLogs(habit.id, {
        skip: page * LIMIT,
        limit: LIMIT,
        from_date: fDate,
        to_date: tDate
      });
      setLogs(res);
    } catch (error) { console.error("Lỗi:", error); } 
    finally { setLoading(false); }
  };

  const handleEditClick = (log) => {
    setEditingLog(log);
    setIsEditModalOpen(true);
  };

  if (!isOpen || !habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div><h3 className="text-lg font-bold text-gray-800">Lịch sử: {habit.name}</h3></div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
                <Calendar size={16} className="text-gray-500"/>
                <input type="month" className="bg-transparent text-sm outline-none text-gray-700 font-medium"
                    value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(0); }} />
            </div>
            <div className="flex gap-1">
                <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={20}/></button>
                <button disabled={logs.length<LIMIT} onClick={()=>setPage(p=>p+1)} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={20}/></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
            {loading ? <div className="text-center py-10 text-gray-400">Đang tải...</div> : 
             logs.length === 0 ? <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">Không có dữ liệu.</div> : 
            (
                <div className="space-y-2">
                    {logs.map(log => (
                        <div key={log.id} className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-10 rounded-full ${
                                    log.status === 'COMPLETED' ? 'bg-green-500' : 
                                    log.status === 'PARTIAL' ? 'bg-blue-500' :
                                    log.status === 'SKIPPED' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700">{new Date(log.record_date).toLocaleDateString('vi-VN')}</p>
                                    <p className="text-xs text-gray-500 capitalize">{new Date(log.record_date).toLocaleDateString('vi-VN', {weekday: 'long'})}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border 
                                        ${log.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                          log.status === 'PARTIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          log.status === 'SKIPPED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                          'bg-red-50 text-red-700 border-red-200'}`}>
                                        {log.status === 'PARTIAL' && <PieChart size={10} />}
                                        {log.status}
                                    </span>
                                    {log.value > 0 && <p className="text-xs text-gray-500 mt-1">{log.value} {log.unit || habit.unit}</p>}
                                </div>
                                <button onClick={() => handleEditClick(log)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition" title="Sửa log này">
                                    <Pencil size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="mt-4 pt-3 border-t text-center text-xs text-gray-400">Trang {page + 1}</div>
      </div>

      <CheckInModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        habit={habit}
        logToEdit={editingLog} 
        onSuccess={() => fetchLogs()}
      />
    </div>
  );
};

export default HabitHistoryModal;
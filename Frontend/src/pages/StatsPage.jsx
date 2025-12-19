import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Calendar, Filter, PieChart as PieChartIcon } from 'lucide-react';
import habitApi from '../api/habitAPI';

const StatsPage = () => {
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7); // Mặc định xem 7 ngày qua

  // 👇 MÀU SẮC: Thêm màu Xanh Dương (#3B82F6) cho Partial
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']; 
  // Thứ tự: [Hoàn thành, Một phần, Bỏ qua, Thất bại]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - range + 1);

        const res = await habitApi.getHistory({
          from_date: startDate.toISOString().split('T')[0],
          to_date: endDate.toISOString().split('T')[0]
        });
        
        setLogs(res);
        processChartData(res, startDate, range);

      } catch (error) {
        console.error("Lỗi load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range]);

  const processChartData = (data, startDate, days) => {
    // A. Xử lý BarChart
    const statsMap = {};
    
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
      // 👇 Thêm trường partial vào statsMap
      statsMap[dateStr] = { date: displayDate, completed: 0, partial: 0 };
    }

    // Biến đếm cho PieChart
    let countCompleted = 0;
    let countPartial = 0; // 👇 Thêm biến đếm Partial
    let countSkipped = 0;
    let countFailed = 0;

    data.forEach(log => {
      const dateKey = log.record_date;
      
      // 1. Đếm tổng cho PieChart
      if (log.status === 'COMPLETED') countCompleted++;
      else if (log.status === 'PARTIAL') countPartial++; // 👇 Logic mới
      else if (log.status === 'SKIPPED') countSkipped++;
      else countFailed++;

      // 2. Đếm theo ngày cho BarChart
      if (statsMap[dateKey]) {
        if (log.status === 'COMPLETED') statsMap[dateKey].completed += 1;
        if (log.status === 'PARTIAL') statsMap[dateKey].partial += 1; // 👇 Logic mới
      }
    });

    setChartData(Object.values(statsMap));

    // B. Xử lý PieChart (Thêm 'Một phần' vào data)
    const pieSource = [
      { name: 'Hoàn thành', value: countCompleted },
      { name: 'Một phần', value: countPartial }, // 👇
      { name: 'Bỏ qua', value: countSkipped },
      { name: 'Thất bại', value: countFailed }
    ];
    
    // Lọc bỏ những cái value = 0 để biểu đồ đỡ rối
    setPieData(pieSource.filter(item => item.value > 0));
  };

  if (loading) return <div className="p-10 text-center">Đang tính toán số liệu... 📊</div>;

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê hoạt động</h1>
          <p className="text-gray-500">Xem lại hiệu suất của bạn trong thời gian qua</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border">
          <button onClick={() => setRange(7)} className={`px-4 py-2 text-sm font-medium rounded-md transition ${range === 7 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>7 ngày qua</button>
          <button onClick={() => setRange(30)} className={`px-4 py-2 text-sm font-medium rounded-md transition ${range === 30 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>30 ngày qua</button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Tần suất (Cột Chồng) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500"/> Số thói quen thực hiện
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#F3F4F6'}}
                />
                <Legend iconType="circle"/>
                {/* 👇 Cột Hoàn thành (Xanh lá) */}
                <Bar name="Hoàn thành" dataKey="completed" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={range === 7 ? 40 : 10} />
                {/* 👇 Cột Một phần (Xanh dương) - Stack lên trên */}
                <Bar name="Một phần" dataKey="partial" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={range === 7 ? 40 : 10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tỉ lệ trạng thái (Tròn) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Filter size={20} className="text-orange-500"/> Tỉ lệ thực hiện
          </h3>
          <div className="h-64 relative">
            {pieData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                    {pieData.map((entry, index) => {
                       // Logic chọn màu dựa trên tên
                       let color = '#9CA3AF'; // Default gray
                       if (entry.name === 'Hoàn thành') color = '#10B981';
                       else if (entry.name === 'Một phần') color = '#3B82F6'; // Blue
                       else if (entry.name === 'Bỏ qua') color = '#F59E0B';
                       else if (entry.name === 'Thất bại') color = '#EF4444';
                       return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Lịch sử chi tiết */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Lịch sử chi tiết</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Ngày</th>
                <th className="px-6 py-3 font-medium">Thói quen</th>
                <th className="px-6 py-3 font-medium">Kết quả</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">Chưa có dữ liệu.</td></tr>
              ) : (
                  logs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-600">
                        {new Date(log.record_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                        {log.habit_name || "Thói quen cũ"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                        {log.value > 0 ? log.value : '-'}
                        {" " + log.unit}
                    </td>
                    <td className="px-6 py-3">
                        {/* 👇 BADGE HIỂN THỊ TRẠNG THÁI */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${log.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                          log.status === 'PARTIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          log.status === 'SKIPPED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          'bg-red-50 text-red-700 border-red-200'}`}>
                          
                          {log.status === 'PARTIAL' && <PieChartIcon size={12}/>}
                          {log.status}
                        </span>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
import { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import habitApi from '../api/habitAPI';

const QuoteCarousel = () => {
  const [quotes, setQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await habitApi.getAllQuotes();
        if (res && res.length > 0) {
          setQuotes(res);
        }
      } catch (error) {
        console.error("Lỗi load quotes", error);
      }
    };
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? quotes.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  };

  if (quotes.length === 0) return null;

  return (
    <div className="mb-6 md:mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 md:p-6 text-white shadow-lg transition-all duration-500 relative group">
      
      {/* Nút Prev: 
          - opacity-100: Mặc định hiện (cho mobile)
          - md:opacity-0: Trên PC thì ẩn đi, hover mới hiện
      */}
      <button 
        onClick={handlePrev}
        className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 z-10"
      >
        <ChevronLeft size={20} className="md:w-6 md:h-6" />
      </button>

      {/* Nút Next */}
      <button 
        onClick={handleNext}
        className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-0 z-10"
      >
        <ChevronRight size={20} className="md:w-6 md:h-6" />
      </button>

      <div className="flex flex-col items-center text-center px-6 md:px-8">
        <Quote size={24} className="mb-2 opacity-50 md:w-8 md:h-8" />
        
        <div className="min-h-[80px] flex flex-col justify-center animate-in fade-in zoom-in duration-500 key={currentIndex}">
            {/* Chữ nhỏ hơn trên mobile (text-base) */}
            <p className="text-base md:text-2xl font-bold italic">
            "{quotes[currentIndex].quote}"
            </p>
            <p className="mt-2 text-xs md:text-sm font-medium opacity-80">
            — {quotes[currentIndex].author || "Khuyết danh"}
            </p>
        </div>

        <div className="mt-4 flex gap-2">
          {quotes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-4 md:w-6 bg-white' : 'w-1.5 md:w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuoteCarousel;
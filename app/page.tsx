"use client";
import { useState, useEffect } from 'react';
import charactersData from '../data/characters.json';

export default function Home() {
  const [hasWon, setHasWon] = useState(false);
  const [board, setBoard] = useState<any[]>([]);
  const [currentWish, setCurrentWish] = useState<any>(null);
  const [isWishing, setIsWishing] = useState(false);
  const [pulledChars, setPulledChars] = useState<string[]>([]);

  // 1. Hàm khởi tạo bảng Bingo
  const generateNewBoard = () => {
    setHasWon(false)
    // Xáo trộn toàn bộ 80+ nhân vật
    const poolWithoutPaimon = charactersData.filter(char => char.name !== "Paimon");
    const shuffled = [...poolWithoutPaimon].sort(() => 0.5 - Math.random());
    
    // Lấy 24 nhân vật ngẫu nhiên cho bảng
    const selected = shuffled.slice(0, 24).map(char => ({
      ...char,
      isMarked: false 
    }));
    
    // Ô Paimon ở giữa (Free Slot)
    const paimon = {
      name: "Paimon",
      imageUrl: "/assets/images/paimon_icon.png", 
      isFree: true,
      isMarked: true 
    };
    
    selected.splice(12, 0, paimon);
    setBoard(selected);
    setCurrentWish(null); // Reset kết quả quay cũ
  };

  useEffect(() => {
    generateNewBoard();
  }, []);

  // 2. Logic quay Gacha
  const handleWish = () => {
    if (isWishing) return;
    
    const availablePool = charactersData.filter(char => !pulledChars.includes(char.name));

    if (availablePool.length === 0) {
      alert("Đã quay hết toàn bộ nhân vật!");
      return;
    }

    setIsWishing(true);

    // Hiệu ứng chờ 800ms cho giống cảm giác "nổ" trong game
    setTimeout(() => {
      const randomChar = charactersData[Math.floor(Math.random() * charactersData.length)];
      setCurrentWish(randomChar);
      
      // Kiểm tra xem nhân vật vừa quay có nằm trên bảng không
      setBoard(prevBoard => 
        prevBoard.map(item => 
          item.name === randomChar.name ? { ...item, isMarked: true } : item
        )
      );
      
      setIsWishing(false);
    }, 200);
  };

  const toggleMark = (index: number) => {
    // Không cho phép toggle ô Paimon vì nó là Free Slot luôn luôn đúng
    if (board[index].isFree) return;

    setBoard(prevBoard => {
      const newBoard = [...prevBoard];
      newBoard[index] = { 
        ...newBoard[index], 
        isMarked: !newBoard[index].isMarked // Đảo trạng thái true/false
      };
      return newBoard;
    });
  };

  useEffect(() => {
    if (board.length > 0 && !hasWon) {
      if (checkWin(board)) {
        setHasWon(true);
      }
    }
  }, [board]);

  const checkWin = (currentBoard: any[]) => {
    const size = 5;
    
    // 1. Kiểm tra hàng ngang
    for (let i = 0; i < size; i++) {
      const row = currentBoard.slice(i * size, i * size + size);
      if (row.every(cell => cell.isMarked)) return true;
    }

    // 2. Kiểm tra hàng dọc
    for (let i = 0; i < size; i++) {
      const col = [currentBoard[i], currentBoard[i+5], currentBoard[i+10], currentBoard[i+15], currentBoard[i+20]];
      if (col.every(cell => cell.isMarked)) return true;
    }

    // 3. Kiểm tra 2 đường chéo
    const diag1 = [currentBoard[0], currentBoard[6], currentBoard[12], currentBoard[18], currentBoard[24]];
    const diag2 = [currentBoard[4], currentBoard[8], currentBoard[12], currentBoard[16], currentBoard[20]];
    if (diag1.every(cell => cell.isMarked) || diag2.every(cell => cell.isMarked)) return true;

    return false;
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center py-8 px-4 font-sans overflow-hidden">
      {/* Layer Background */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/assets/images/backgrounds/genshin_bg.png')",
          filter: "brightness(0.6)" // Làm tối ảnh một chút để nổi bật bảng Bingo
        }}
      />
      <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f3d183] to-[#b88a44] mb-10 tracking-widest uppercase">
        Genshin Bingo
      </h1>

      <div className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full max-w-6xl">
        
        {/* --- BẢNG BINGO --- */}
        <div className="relative p-4 bg-[#1b1e23] border-[6px] border-[#323942] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-5 gap-1.5 md:gap-3">
            {board.map((char, index) => (
              <div 
                key={index}
                onClick={() => toggleMark(index)} 
                className={`
                  relative w-16 h-16 sm:w-24 sm:h-24 flex flex-col items-center justify-center 
                  border-2 rounded-xl transition-all duration-500 overflow-hidden
                  ${char.isMarked 
                    ? 'border-[#f3d183] bg-[#f3d183]/20 shadow-[0_0_15px_rgba(243,209,131,0.4)]' 
                    : 'border-[#3c4550] bg-[#252a31]'}
                `}
              >
                {/* Ảnh nhân vật - Đã bỏ grayscale để luôn có màu */}
                <img 
                  src={char.imageUrl} 
                  alt={char.name} 
                  className={`w-full h-full object-cover transition-all ${char.isMarked ? 'scale-110' : 'opacity-80'}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/assets/images/paimon_icon.png";
                  }}
                />
                
                {/* Tên nhân vật - Hiện ở dưới cùng của ô */}
                <div className="absolute bottom-0 w-full bg-black/70 text-[8px] sm:text-[10px] text-white py-0.5 text-center font-medium">
                  {char.name}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* --- KHU VỰC QUAY GACHA --- */}
        <div className="flex flex-col items-center min-w-[300px]">
          <div className="relative w-56 h-56 flex items-center justify-center mb-8">
            {/* Vòng sáng trang trí */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-[#f3d183]/20 ${isWishing ? 'animate-spin-slow' : ''}`}></div>
            
            <div className="w-48 h-48 bg-[#1b1e23] rounded-full border-4 border-[#323942] flex items-center justify-center overflow-hidden shadow-inner">
              {currentWish ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <img src={currentWish.imageUrl} alt="Result" className="w-32 h-32 object-contain" />
                  <p className="text-[#f3d183] font-bold text-lg mt-1 drop-shadow-md">{currentWish.name}</p>
                </div>
              ) : (
                <p className="text-gray-500 font-medium italic text-sm">Sẵn sàng Wish?</p>
              )}
            </div>
          </div>

          <button 
            onClick={handleWish}
            disabled={isWishing}
            className={`
              w-full py-5 rounded-full font-black text-xl tracking-widest transition-all
              ${isWishing 
                ? 'bg-[#323942] text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#f3d183] to-[#dcb35c] text-[#4a3512] hover:scale-105 hover:brightness-110 active:scale-95 shadow-[0_10px_25px_rgba(243,209,131,0.3)]'}
            `}
          >
            {isWishing ? "WISHING..." : "WISH x1"}
          </button>

          <button 
            onClick={generateNewBoard}
            className="mt-6 text-gray-500 hover:text-[#f3d183] transition-colors text-sm font-bold uppercase tracking-widest"
          >
            Làm mới bảng Bingo
          </button>
        </div>

      </div>

      <style jsx>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .shadow-glow { box-shadow: 0 0 10px #f3d183; }
      `}</style>
      {hasWon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-500">
          <div className="bg-[#1b1e23] border-4 border-[#f3d183] p-10 rounded-3xl text-center shadow-[0_0_50px_#f3d183]">
            <h2 className="text-5xl font-black text-[#f3d183] mb-4 animate-bounce">BINGO!</h2>
            <p className="text-white text-xl mb-8">Chúc mừng Nhà Lữ Hành đã thắng!</p>
            <button 
              onClick={() => {
                setHasWon(false);
                generateNewBoard();
              }}
              className="px-10 py-4 bg-[#f3d183] text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              CHƠI VÁN MỚI
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
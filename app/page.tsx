"use client";
import { useState, useEffect } from 'react';
import charactersData from '../data/characters.json';


export default function Home() {
  const [hasWon, setHasWon] = useState(false);
  const [board, setBoard] = useState<any[]>([]);
  const [currentWish, setCurrentWish] = useState<any>(null);
  const [isWishing, setIsWishing] = useState(false);
  const [pulledChars, setPulledChars] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 1. Hàm khởi tạo bảng Bingo
  const generateNewBoard = () => {
    setHasWon(false);
    setPulledChars([]);
    setShowConfetti(false);
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
      id: "paimon",
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
  const revealResult = (availablePool: any[]) => {
    if (availablePool.length === 0 || !isWishing) return;

    const randomIndex = Math.floor(Math.random() * availablePool.length);
    const randomChar = availablePool[randomIndex];

    if (randomChar) {
      setCurrentWish(randomChar);
      const newBoard = board.map(item => item.name === randomChar.name ? { ...item, isMarked: true } : item);
      setBoard(newBoard);
      setPulledChars(prev => [...prev, randomChar.name]);

      const revealSound = new Audio('/assets/videos/wish_reveal.m4a');
      revealSound.volume = 0.5;
      revealSound.play().catch(err => console.log(err));

      if (checkWin(newBoard)) {
        setShowConfetti(true); 
   
        setTimeout(() => {
          setHasWon(true);
        }, 1500); 
        // ----------------------------------------------
      }
    }

    setShowVideo(false);
    setIsWishing(false);
  };

  const handleWish = () => {
    if (isWishing || hasWon) return;
    const availablePool = charactersData.filter(char => !pulledChars.includes(char.name));
    if (availablePool.length === 0) {
      alert("Đã quay hết nhân vật!");
      return;
    }
    setIsWishing(true);
    setShowVideo(true);
  };

  const handleSkip = () => {
    const availablePool = charactersData.filter(char => !pulledChars.includes(char.name));
    revealResult(availablePool);
  };

  const toggleMark = (index: number) => {
    if (board[index].isFree) return;

    // 1. Tạo bản sao board mới
    const newBoardState = [...board];
    newBoardState[index] = { 
      ...newBoardState[index], 
      isMarked: !newBoardState[index].isMarked
    };
    
    // 2. Cập nhật state board
    setBoard(newBoardState);

    // 3. Kiểm tra thắng ngay tại đây thay vì dùng useEffect
    if (checkWin(newBoardState)) {
      setShowConfetti(true); // Hiện pháo bông ngay
      setTimeout(() => {
        setHasWon(true); // 3 giây sau mới hiện bảng thông báo
      }, 1500);
    } else {
      setShowConfetti(false);
    }
  };

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
    <main className="min-h-screen relative flex flex-col items-center py-8 px-4 font-['GenshinDrip'] overflow-hidden">
      {/* Layer Background */}
      {/* Layer Background */}
      <div className="fixed inset-0 z-[-1]">
        {/* Lớp ảnh nền gốc - Giữ độ sáng tự nhiên */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/images/backgrounds/genshin_bg_2.png')" }}
        />
        
        {/* Lớp phủ Blur + Gradient ở phía trên cùng (Header Area) */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-black/20 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>
      <h1 className="text-3xl md:text-5xl font-black text-white mb-10 tracking-widest uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] z-10">
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

          {/* --- NÚT WISH CUSTOM VỚI FRAME GENSHIN (SỬA Ở ĐÂY) --- */}
          <button 
            onClick={handleWish}
            disabled={isWishing}
            className={`
              relative group flex items-center justify-center w-[280px] h-[72px]
              font-['GenshinDrip'] transition-all duration-300 ease-out
              
              /* 1. NỀN VÀ GÓC BO: Bo tròn cực đại (full rounded) */
              rounded-full overflow-visible border-0 ring-0 focus:outline-none
              
              ${isWishing 
                ? 'cursor-not-allowed' 
                : 'hover:scale-105 active:scale-95' /* Hiệu ứng nhấn */
              }
            `}
          >
            <div 
              className={`
                absolute inset-0 rounded-full z-10 transition-all duration-300
                bg-white border-[3px] border-[#ddc888]
                ${isWishing ? 'brightness-90' : 'group-hover:border-[#c4b17a] group-hover:shadow-[0_0_15px_rgba(221,200,136,0.4)]'}
              `}
            />

            <div 
              className="absolute inset-[6px] rounded-full z-15 border border-[#ddc888]/30 pointer-events-none" 
            />

            {/* 4. CHỮ WISH - Nằm trên cùng */}
            <span 
              className={`
                relative z-20 text-3xl font-black tracking-[0.2em] uppercase transition-all
                ${isWishing 
                  ? 'text-[#ddc888]/50'
                  : 'text-[#4a3512] group-hover:text-black'
                }
              `}
            >
              WISH
            </span>
        
            <div className="absolute inset-x-6 inset-y-2 border border-[#f3d183]/30 rounded-full z-15 group-hover:border-white/20 transition-all" />
          </button>

          <button 
            onClick={generateNewBoard}
            className="mt-6 text-white hover:text-[#f3d183] transition-all text-sm font-bold uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            Làm mới bảng Bingo
          </button>

          {/* --- NÚT MỞ LỊCH SỬ --- */}
          <button 
            onClick={() => setShowHistory(true)}
            className="mt-4 flex items-center gap-2 bg-[#323942] hover:bg-[#3c4550] text-[#f3d183] px-6 py-2 rounded-lg border border-[#f3d183]/30 transition-all font-['GenshinDrip']"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            HISTORY
          </button>

          {/* --- MODAL LỊCH SỬ (DẠNG GRID ICON) --- */}
          {showHistory && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-[#1b1e23] border-2 border-[#323942] rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                
                {/* Header của Modal */}
                <div className="flex justify-between items-center p-6 border-b border-[#323942]">
                  <h2 className="text-[#f3d183] text-2xl font-['GenshinDrip'] uppercase tracking-widest">Recent Wishes</h2>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Grid danh sách nhân vật */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {pulledChars.length === 0 ? (
                    <p className="text-gray-500 text-center italic py-20 font-['GenshinDrip']">No records found...</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                      {pulledChars.map((charName, idx) => {
                        // Tìm dữ liệu nhân vật để lấy ảnh
                        const charInfo = charactersData.find(c => c.name === charName);
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 animate-in zoom-in duration-300">
                            <div className="relative w-full aspect-square bg-[#252a31] rounded-lg border-2 border-[#3c4550] overflow-hidden group hover:border-[#f3d183] transition-all">
                              <img 
                                src={charInfo?.imageUrl || "/assets/images/paimon_icon.png"} 
                                alt={charName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 text-center leading-tight h-5 overflow-hidden">
                              {charName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* --- VIDEO WISH ANIMATION OVERLAY --- */}
        {showVideo && (
          <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            <video autoPlay className="w-full h-full object-cover" onEnded={() => revealResult(charactersData.filter(c => !pulledChars.includes(c.name)))}>
              <source src="/assets/videos/gacha_animation.mp4" type="video/mp4" />
            </video>
            <button onClick={handleSkip} className="absolute top-10 right-10 text-white/50 hover:text-white font-bold uppercase tracking-widest text-sm bg-black/20 px-4 py-2 rounded-full border border-white/10">Skip {">>"}</button>
          </div>
        )}
        {/* --- PHÁO BÔNG OVERLAY (NEW EFFECT) --- */}
        {showConfetti && (
          <div className="fixed inset-0 z-[65] pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#f3d183', '#ffffff', '#ddc888', '#ffeb3b'][i % 4],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                  "--x-end": `${(Math.random() - 0.5) * 200}px` // Tạo độ lệch ngang khi rơi
                } as any}
              />
            ))}
          </div>
        )}
        
      </div>

      <style jsx>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .shadow-glow { box-shadow: 0 0 10px #f3d183; }
        @font-face {
          font-family: 'GenshinDrip';
          src: url('/fonts/Genshin Impact DRIP FONT.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1b1e23;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #323942;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f3d183;
        }
        .header-blur {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%);
        }
        .wish-button:hover .border-trace {
          opacity: 1;
          scale: 1.03; /* Làm cho viền hơi to hơn nút một chút */
          filter: brightness(100) blur(1px) drop-shadow(0 0 5px rgba(255,255,255,0.8));
          /* Giúp viền trắng hoàn toàn và có độ phát sáng nhẹ */
        }

        .border-trace {
          transition: all 0.4s ease-out; /* Hiệu ứng hiện ra mượt mà */
          opacity: 0;
          pointer-events: none; /* Đảm bảo chuột không tương tác với lớp viền */
        }
        .confetti-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          top: -10px;
          border-radius: 2px;
          animation: fall linear forwards;
        }

        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) translateX(var(--x-end)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {hasWon && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] animate-in fade-in duration-500">
          <div className="bg-[#1b1e23] border-4 border-[#f3d183] p-10 rounded-3xl text-center shadow-[0_0_50px_#f3d183] animate-in zoom-in duration-300">
            <h2 className="text-5xl font-black text-[#f3d183] mb-4 uppercase tracking-tighter">BINGO!</h2>
            <p className="text-white text-xl mb-8">Chúc mừng Nhà Lữ Hành!</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={generateNewBoard}
                className="px-10 py-4 bg-[#f3d183] text-black font-bold rounded-full hover:scale-105 transition-transform uppercase"
              >
                BẮT ĐẦU VÁN MỚI
              </button>
              <button 
                onClick={() => {
                  setHasWon(false);
                  // Không tắt confetti ở đây để pháo bông tiếp tục rơi nếu user muốn xem bảng
                }} 
                className="text-gray-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
              >
                HỦY
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
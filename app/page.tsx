"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [videoSrc, setVideoSrc] = useState("");
  const [useElementVideo, setUseElementVideo] = useState(true);
  const [isElementalVideo, setIsElementalVideo] = useState(false);

  const allCharacters = useMemo(() => {
    return charactersData.flatMap(elementGroup => 
      elementGroup.characters.map(char => ({
        ...char,
        element: elementGroup.element
      }))
    );
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Hàm khởi tạo bảng Bingo
  const generateNewBoard = () => {
    setHasWon(false);
    setPulledChars([]);
    setShowConfetti(false);
    // Xáo trộn toàn bộ 80+ nhân vật
    const poolWithoutPaimon = allCharacters.filter(char => char.name !== "Paimon");
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
      star: 6,
      element: "None",
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
  // Hàm xử lý khi video kết thúc
  const handleVideoEnded = () => {
    if (useElementVideo && !isElementalVideo) {
      // 1. Nếu vừa xong video Sao, chuyển sang video Nguyên tố
      const element = currentWish?.element || "Pyro"; // Mặc định Pyro nếu lỗi
      setVideoSrc(`/assets/videos/${element}_animation_sound.mp4`); 
      setIsElementalVideo(true);
    } else {
      // 2. Nếu đã xong video Nguyên tố, mới hiện kết quả
      revealResult();
      setIsElementalVideo(false); 
    }
  };

  const revealResult = () => {
    if (!currentWish) return;
    
    const newBoard = board.map(item => 
      item.name === currentWish.name ? { ...item, isMarked: true } : item
    );
    setBoard(newBoard);
    setPulledChars(prev => [...prev, currentWish.name]);

    // Âm thanh hiện nhân vật
    const revealSound = new Audio('/assets/videos/wish_reveal.m4a');
    revealSound.play().catch(e => {});

    if (checkWin(newBoard)) {
      setShowConfetti(true);
      setTimeout(() => setHasWon(true), 1500);
    }

    setShowVideo(false);
    setIsWishing(false);
  };

  const handleWish = () => {
    if (isWishing) return;
    
    const availablePool = allCharacters.filter(char => !pulledChars.includes(char.name));
    if (availablePool.length === 0) {
      alert("Đã hết nhân vật để quay!");
      return;
    }

    // Bốc thăm nhân vật NGAY TẠI ĐÂY
    const randomIndex = Math.floor(Math.random() * availablePool.length);
    const selectedChar = availablePool[randomIndex];

    // Chọn video dựa trên star
    const videoPath = selectedChar.star === 5 
      ? "/assets/videos/5star_wish_animation.mp4" 
      : "/assets/videos/4star_wish_animation.mp4";

    setVideoSrc(videoPath);
    setCurrentWish(selectedChar); // Lưu nhân vật vào state để revealResult dùng
    setIsWishing(true);
    setShowVideo(true);
  };

  const handleSkip = () => { revealResult(); };

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
    <main className="min-h-screen relative flex flex-col items-center py-6 md:py-12 px-4 md:px-6 font-['GenshinDrip'] overflow-x-hidden">
      {/* Background Layer - Giữ nguyên */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/images/backgrounds/genshin_bg_2.png')" }} />
        <div className="absolute top-0 left-0 right-0 h-1/5 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-white mb-6 md:mb-10 tracking-widest uppercase drop-shadow-2xl z-10 text-center">
        Genshin Bingo
      </h1>
      
      {/* --- CONTAINER CHÍNH: Xử lý Responsive ở đây --- */}
      <div className="flex flex-col xl:flex-row gap-10 xl:gap-40 items-center xl:items-start justify-center w-full max-w-[1600px] z-10">
      
        {/* --- CỘT BẢNG BINGO --- */}
        <div className="flex flex-col items-center w-full max-w-fit">
          <div className="p-2 md:p-4 bg-[#1b1e23] border-[2px] md:border-[3px] border-[#DDD3C5] rounded-2xl shadow-2xl">
            {/* Grid co giãn theo màn hình */}
            <div className="grid grid-cols-5 gap-1 md:gap-2.5">
              {board.map((char, index) => (
                <div 
                  key={index}
                  onClick={() => toggleMark(index)} 
                  className={`
                    relative w-[65px] h-[65px] sm:w-20 sm:h-20 flex flex-col items-center justify-center border rounded-xl md:rounded-2xl transition-all duration-500 overflow-hidden cursor-pointer 
                    ${char.isMarked ? 'border-[#f3d183] shadow-glow' : 'border-[#3c4550]'}
                    ${char.star === 6 ? 'bg-gradient-to-b from-[#1D1C55] to-[#5C87C1]' : 
                      char.star === 5 ? 'bg-gradient-to-b from-[#9E7040] to-[#BF7E3E]' : 
                      'bg-gradient-to-b from-[#6A629F] to-[#A179C0]'}
                  `}
                >
                  <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${char.isMarked ? 'opacity-0' : 'bg-black/40'}`} />
                  <img 
                    src={char.imageUrl} alt={char.name} 
                    className={`w-full h-full object-cover transition-all ${char.isMarked ? 'scale-110' : 'opacity-80'}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/assets/images/paimon_icon.png"; }}
                  />
                  <div className="absolute bottom-0 w-full bg-black/70 text-[6px] sm:text-[10px] text-white py-0.5 text-center font-medium truncate px-0.5">
                    {char.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={generateNewBoard} className="mt-6 md:mt-12 text-white/90 hover:text-[#F3D183] transition-all text-lg md:text-2xl font-medium uppercase tracking-widest drop-shadow-lg">
            Làm mới bảng
          </button>
        </div>
        

        {/* --- KHU VỰC QUAY GACHA --- */}
        <div className="flex flex-col items-center w-full max-w-[350px] xl:self-stretch">
          <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center mb-4 md:mb-8">
            <div className="w-full h-full bg-[#1b1e23] rounded-full border-4 border-[#323942] flex items-center justify-center overflow-hidden shadow-inner">
              {currentWish ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <img src={currentWish.imageUrl} alt="Result" className="w-24 h-24 md:w-36 md:h-36 object-contain" />
                  <p className="text-[#f3d183] font-bold text-sm md:text-lg mt-1 drop-shadow-md text-center">{currentWish.name}</p>
                </div>
              ) : (
                <p className="text-gray-500 font-medium italic text-xs md:text-sm">Sẵn sàng Wish?</p>
              )}
            </div>
          </div>
        
          <button 
            onClick={handleWish} disabled={isWishing}
            className="relative group flex items-center justify-center w-[220px] md:w-[280px] h-[50px] md:h-[60px] rounded-full overflow-visible transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 rounded-full z-10 bg-white border-[3px] border-[#ddc888]" />
            <span className="relative z-20 text-xl md:text-3xl font-black tracking-[0.2em] uppercase text-[#4a3512]">WISH</span>
          </button>

          <button onClick={() => setShowHistory(true)} className="mt-8 md:mt-auto py-4 text-white/90 hover:text-[#F3D183] transition-all text-lg md:text-2xl font-medium uppercase tracking-widest drop-shadow-lg">
            Xem lịch sử
          </button>
        </div>
      </div>

      {/* --- CỬA SỔ VIDEO: Fix tỉ lệ trên Mobile --- */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2">
          <div className="relative w-full max-w-[800px] aspect-video bg-black rounded-lg md:rounded-2xl border-2 md:border-[3px] border-white shadow-2xl overflow-hidden">
            <video ref={videoRef} key={videoSrc} autoPlay onEnded={handleVideoEnded} className="w-full h-full object-contain">
              <source src={videoSrc} type="video/mp4" />
            </video>
            <button onClick={revealResult} className="absolute top-2 right-2 md:top-4 md:right-4 z-[110] text-white/70 text-[8px] md:text-[10px] bg-black/40 px-2 py-1 rounded-full border border-white/20">
              Skip {">>"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ & WIN: Co giãn theo màn hình */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/95 z-[120] flex items-center justify-center p-2 md:p-4">
          <div className="bg-[#1b1e23] border-2 border-[#323942] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-[#323942]">
              <h2 className="text-[#f3d183] text-lg md:text-2xl uppercase tracking-widest">History</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 text-2xl">✕</button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {pulledChars.map((charName, idx) => {
                  const charInfo = allCharacters.find(c => c.name === charName);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="w-full aspect-square bg-[#252a31] rounded-lg border border-[#3c4550] overflow-hidden">
                        <img src={charInfo?.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[7px] text-gray-400 text-center truncate w-full">{charName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
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
      {hasWon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[130] animate-in fade-in duration-500 p-4">
          <div className="bg-white border-4 border-[#ddc888] p-6 md:p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(221,200,136,0.6)] animate-in zoom-in duration-300 max-w-sm md:max-w-md w-full">
            <h2 className="text-4xl md:text-5xl font-black text-[#4a3512] mb-4 uppercase drop-shadow-[0_2px_4px_rgba(221,200,136,0.5)]">
              BINGO!
            </h2>
            <p className="text-[#c4b17a] text-lg md:text-xl mb-8 font-bold uppercase tracking-widest">
              Chúc mừng Nhà Lữ Hành!
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={generateNewBoard}
                className="w-full px-10 py-4 bg-[#f3d183] text-[#4a3512] font-bold rounded-full hover:scale-105 transition-transform uppercase border-2 border-[#ddc888] shadow-lg"
              >
                VÁN MỚI
              </button>
              <button 
                onClick={() => {
                  setHasWon(false);
                  setShowConfetti(false);
                }} 
                className="text-gray-400 hover:text-[#4a3512] text-sm font-bold uppercase tracking-widest transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS: Không đổi */}
      <style jsx global>{`
        .shadow-glow { box-shadow: 0 0 10px #f3d183; }
        @font-face {
          font-family: 'GenshinDrip';
          src: url('assets/fonts/Genshin Impact DRIP FONT.otf') format('opentype');
          font-weight: normal; font-style: normal;
        }
        .confetti-particle { position: absolute; width: 6px; height: 6px; top: -10px; border-radius: 2px; animation: fall linear infinite; }
        @keyframes fall { 
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--x-end)) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </main>
  );
}
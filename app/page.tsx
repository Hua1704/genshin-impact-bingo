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
    <main className="min-h-screen relative flex flex-col items-center py-12 px-6 font-['GenshinDrip'] overflow-hidden">
      <link rel="preload" href="/assets/videos/5star_wish_animation.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/4star_wish_animation.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/anemo_animation_sound.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/geo_animation_sound.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/dendro_animation_sound.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/electro_animation_sound.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/hydro_animation_sound.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/pyro_animation_sound.mp4" as="video" type="video/mp4" />
      <link rel="preload" href="/assets/videos/cryo_animation_sound.mp4" as="video" type="video/mp4" />
      {/* Layer Background */}
      <div className="fixed inset-0 z-[-1]">
        {/* Lớp ảnh nền gốc - Giữ độ sáng tự nhiên */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/images/backgrounds/genshin_bg_2.png')" }}
        />
        
        {/* Lớp phủ Blur + Gradient ở phía trên cùng (Header Area) */}
        <div className="absolute top-0 left-0 right-0 h-1/5 bg-gradient-to-b from-black/70 to-transparent" />

        {/* Lớp phủ Gradient Đen ở ĐÁY (Bottom Overlay) - Độ mờ 70% ở mép */}
        <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-black/70 to-transparent" />

      </div>
      <h1 className="text-5xl font-black text-white mb-10 tracking-widest uppercase drop-shadow-2xl z-10">
        Genshin Bingo
      </h1>
      
      {/* ========================================================== */}
      {/* --- CONTAINER CHÍNH (TWO COLUMNS PC FORMAT) --- */}
      {/* ========================================================== */}
      <div className="flex flex-col xl:flex-row gap-40 items-start justify-center w-full max-w-[1600px] z-10">
      
        {/* --- BẢNG BINGO --- */}
        <div className="flex flex-col items-center">
          <div className="p-4 bg-[#1b1e23] border-[3px] border-[#DDD3C5] rounded-2xl shadow--2xl shadow-white/20">
            <div className="grid grid-cols-5 gap-1.5 md:gap-2.5">
              {board.map((char, index) => (
                <div 
                  key={index}
                  onClick={() => toggleMark(index)} 
                  className={`
                    relative relative w-20 h-20 sm:w-20 sm:h-20 flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-500 overflow-hidden cursor-pointer 
                    
                    /* MÀU VIỀN: Sáng lên khi được chọn, mặc định là xám tối */
                    ${char.isMarked ? 'border-[#f3d183] shadow-glow' : 'border-[#3c4550]'}

                    /* MÀU NỀN PHÍA SAU NHÂN VẬT (LUÔN HIỂN THỊ) */
                    ${char.star === 6
                      ? 'bg-gradient-to-b from-[#1D1C55] to-[#5C87C1]' /* Paimon: Xanh dương đặc biệt */
                      : char.star === 5 
                        ? 'bg-gradient-to-b from-[#9E7040] to-[#BF7E3E]' /* 5 sao: Cam */
                        : 'bg-gradient-to-b from-[#6A629F] to-[#A179C0]' /* 4 sao: Tím */
                    }
                  `}
                >
                  {/* LỚP PHỦ TỐI (Nếu chưa được chọn thì hơi mờ đi để dễ phân biệt) */}
                  <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${char.isMarked ? 'opacity-0' : 'bg-black/40'}`} />

                  {/* ẢNH NHÂN VẬT */}
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

          <button 
            onClick={generateNewBoard}
            className="mt-12 text-white/90 hover:text-[#F3D183] transition-all text-2xl font-medium uppercase tracking-widest drop-shadow-lg"
          >
            Làm mới bảng
          </button>
        </div>
        

        {/* --- KHU VỰC QUAY GACHA --- */}
        <div className="flex flex-col items-center self-stretch">
          {/* Vòng sáng trang trí */}
          <div className="relative w-56 h-56 flex items-center justify-center mb-8">
            <div className="w-56 h-56 bg-[#1b1e23] rounded-full border-4 border-[#323942] flex items-center justify-center overflow-hidden shadow-inner">
              {currentWish ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <img src={currentWish.imageUrl} alt="Result" className="w-36 h-36 object-contain" />
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
              relative group flex items-center justify-center w-[280px] h-[60px] mt-12
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
          </button>

          {/* --- NÚT MỞ LỊCH SỬ --- */}
          <div className="mt-auto pt-12">
            <button onClick={() => setShowHistory(true)} className="text-white/90 hover:text-[#F3D183] transition-all text-2xl font-medium uppercase tracking-widest drop-shadow-lg">
              Xem lịch sử
            </button>
          </div>

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
                        const charInfo = allCharacters.find(c => c.name === charName);
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
  
        {/* --- VIDEO WISH ANIMATION (CỬA SỔ NHỎ) --- */}
        {showVideo && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            
            {/* Container cho Video - Tỉ lệ 16:9 chuẩn Genshin */}
            <div className="relative w-full max-w-[800px] aspect-video bg-black rounded-2xl border-[3px] border-[#ffffff] shadow-[0_0_50px_rgba(221,200,136,0.5)] overflow-hidden animate-in zoom-in duration-300">
              
              <video 
                ref={videoRef}
                key={videoSrc}
                autoPlay 
                className="w-full h-full object-contain" // object-contain để không bị mất góc video
                onLoadedMetadata={() => {
                  if (videoRef.current) videoRef.current.playbackRate = 1; // Giữ tốc độ nhanh
                }}
                onEnded={handleVideoEnded}
              >
                <source src={videoSrc} type="video/mp4" />
              </video>

              {/* Nút Skip nhỏ gọn hơn */}
              <button 
                onClick={revealResult}
                className="absolute top-4 right-4 z-[110] text-white/70 hover:text-white font-bold uppercase tracking-widest text-[10px] bg-black/40 px-3 py-1.5 rounded-full border border-white/20 transition-all hover:bg-black/60"
              >
                Skip {">>"}
              </button>

              {/* Hiệu ứng viền mờ bên trong video cho sang */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-black/10 inset-shadow-sm" />
            </div>
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

        {hasWon && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] animate-in fade-in duration-500">
            <div className="bg-white border-4 border-[#ddc888] p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(221,200,136,0.6)] animate-in zoom-in duration-300">
              <h2 className="text-5xl font-black text-[#4a3512] mb-4 uppercase drop-shadow-[0_2px_4px_rgba(221,200,136,0.5)]">BINGO!</h2>
              <p className="text-[#c4b17a] text-xl mb-8 font-bold uppercase tracking-widest">Chúc mừng Nhà Lữ Hành!</p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={generateNewBoard}
                  className="px-10 py-4 bg-[#f3d183] text-[#4a3512] font-bold rounded-full hover:scale-105 transition-transform uppercase border-2 border-[#ddc888]"
                >
                  VÁN MỚI
                </button>
                <button 
                  onClick={() => {
                    setHasWon(false);
                    setShowConfetti(false); // Tắt pháo bông khi hủy
                  }} 
                  className="text-gray-400 hover:text-[#4a3512] text-sm font-bold uppercase tracking-widest transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
        
      </div>

      <style jsx global>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .shadow-glow { box-shadow: 0 0 10px #f3d183; }
        @font-face {
          font-family: 'GenshinDrip';
          src: url('assets/fonts/Genshin Impact DRIP FONT.otf') format('opentype'),
               url('assets/fonts/Genshin Impact DRIP FONT.ttf') format('truetype');
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
    </main>
  );
}
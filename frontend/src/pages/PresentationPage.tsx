import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Slides Data
const slides = [
    {
        id: 'intro',
        title: "Hair Omakase",
        subtitle: "내 손 안의 AI 헤어 디자이너",
        content: (
            <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="text-9xl mb-4">🎨</div>
                <h1 className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Hair Omakase
                </h1>
                <p className="text-4xl text-gray-400">실패 없는 스타일링의 시작</p>
                <div className="mt-12 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 animate-pulse">
                    <p className="text-xl">Press → or Click to Start</p>
                </div>
            </div>
        )
    },
    {
        id: 'problem',
        title: "The Problem",
        subtitle: "머리, 망해본 적 있으시죠?",
        layout: 'split',
        content: (
            <div className="grid grid-cols-2 gap-12 h-full items-center px-12">
                <div className="space-y-8 text-left">
                    <div className="space-y-4">
                        <h3 className="text-5xl font-bold text-red-400">Pain Points</h3>
                        <ul className="space-y-6 text-3xl text-gray-300 list-disc pl-8">
                            <li>"미용실 가서 사진 보여주기 민망해요..."</li>
                            <li>"자르고 나서 안 어울리면 이미 늦어요."</li>
                            <li>"퍼스널 컨설팅? 1회 10만원... 너무 비싸요."</li>
                        </ul>
                    </div>
                </div>
                <div className="flex items-center justify-center p-12 bg-white/5 rounded-3xl">
                    <span className="text-9xl">😱</span>
                </div>
            </div>
        )
    },
    {
        id: 'solution',
        title: "Our Solution",
        subtitle: "0원, 3초 만에 끝나는 AI 컨설팅",
        layout: 'center',
        content: (
            <div className="text-center space-y-12">
                <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        { icon: "🧠", title: "AI Analysis", desc: "얼굴형/모질/피부톤 정밀 분석" },
                        { icon: "⚡", title: "Fast", desc: "Gemini Vision으로 3초 컷" },
                        { icon: "🎯", title: "Personalized", desc: "나에게 딱 맞는 스타일 추천" }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white/5 p-12 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="text-8xl mb-6">{item.icon}</div>
                            <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                            <p className="text-xl text-gray-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'core-tech',
        title: "Core Technology",
        subtitle: "Identity Preservation (Face-ID 보존 기술)",
        content: (
            <div className="flex flex-col items-center justify-center h-full max-w-5xl mx-auto text-center space-y-12">
                <div className="grid grid-cols-2 gap-24 items-center">
                    <div className="space-y-6">
                        <div className="text-red-400 text-3xl font-bold">Existing Apps</div>
                        <div className="bg-red-500/10 p-8 rounded-2xl border border-red-500/30 min-h-[300px] flex items-center justify-center">
                            <p className="text-2xl">가발 쓴 듯한 어색함<br />내 얼굴이 사라짐</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="text-green-400 text-3xl font-bold">Hair Omakase</div>
                        <div className="bg-purple-500/10 p-8 rounded-2xl border border-purple-500/30 min-h-[300px] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse" />
                            <p className="text-2xl relative z-10 font-bold">내 표정, 조명 그대로<br />헤어스타일만 교체</p>
                        </div>
                    </div>
                </div>
                <p className="text-2xl text-gray-300 bg-black/50 px-8 py-4 rounded-full border border-white/20">
                    Powered by <span className="text-blue-400 font-bold">Google Gemini Imagen 3</span>
                </p>
            </div>
        )
    },
    {
        id: 'wow-1',
        title: "Killer Feature #1",
        subtitle: "Time Machine & Simulation",
        content: (
            <div className="flex flex-col items-center justify-center space-y-12">
                <h2 className="text-6xl font-bold">"지금 자르면 1년 뒤엔?"</h2>
                <div className="flex space-x-4 items-center mt-12 overflow-x-auto p-4">
                    {['Now', '1 Month', '3 Months', '1 Year'].map((label, idx) => (
                        <div key={label} className="flex flex-col items-center space-y-4">
                            <div className="w-64 h-80 bg-gray-800 rounded-2xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                                <span className="text-5xl group-hover:scale-110 transition-transform duration-500">
                                    {['💇', '🌱', '🌿', '🌳'][idx]}
                                </span>
                                <div className="absolute bottom-0 w-full bg-black/60 p-2 text-center text-sm">
                                    Simulation
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-gray-300">{label}</span>
                        </div>
                    ))}
                </div>
                <p className="text-2xl text-gray-400 max-w-3xl text-center">
                    단순 합성 결과물이 아니라, 모발의 자라는 속도와 방향까지 계산하여 예측합니다.
                </p>
            </div>
        )
    },
    {
        id: 'wow-2',
        title: "Killer Feature #2",
        subtitle: "Multi-Angle & Photo Shoot",
        content: (
            <div className="grid grid-cols-2 gap-16 items-center max-w-6xl mx-auto h-full">
                <div className="space-y-8">
                    <h3 className="text-5xl font-bold text-yellow-400">인생샷 제조기</h3>
                    <ul className="space-y-6 text-2xl text-gray-300">
                        <li className="flex items-center space-x-4">
                            <span className="bg-white/20 p-2 rounded-lg">📸</span>
                            <span>미용실 의자 360도 뷰 (앞/옆/뒤)</span>
                        </li>
                        <li className="flex items-center space-x-4">
                            <span className="bg-white/20 p-2 rounded-lg">✨</span>
                            <span>런웨이, 화보 컨셉 촬영</span>
                        </li>
                        <li className="flex items-center space-x-4">
                            <span className="bg-white/20 p-2 rounded-lg">🎞️</span>
                            <span>인생세컷 포토부스 모드</span>
                        </li>
                    </ul>
                </div>
                <div className="grid grid-cols-2 gap-4 animate-[spin_60s_linear_infinite]">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-800 aspect-[3/4] rounded-xl transform rotate-3 hover:rotate-0 transition-all duration-300 border border-white/10 shadow-2xl flex items-center justify-center">
                            <span className="text-4xl">📸</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'roadmap',
        title: "Future Roadmap",
        subtitle: "Business & Expansion Plan",
        content: (
            <div className="grid grid-cols-3 gap-8 max-w-7xl mx-auto mt-8">
                {[
                    { title: "O2O Matching", desc: "이 머리 잘하는 디자이너 바로 예약 (수수료 모델)", icon: "🤝" },
                    { title: "Smart Mirror", desc: "미용실 거울에 AR 착용 (B2B SaaS 솔루션)", icon: "🪞", highlight: true },
                    { title: "Commerce", desc: "스타일링 제품(왁스/에센스) 자동 추천 판매", icon: "🛍️" }
                ].map((item, idx) => (
                    <div key={idx} className={`p-10 rounded-3xl border flex flex-col items-center text-center space-y-6 transform hover:-translate-y-2 transition-transform duration-300 ${item.highlight ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/10'}`}>
                        <div className="text-7xl">{item.icon}</div>
                        <h3 className="text-3xl font-bold">{item.title}</h3>
                        <p className="text-xl text-gray-300">{item.desc}</p>
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'outro',
        title: "Hair Omakase",
        subtitle: "지금 바로 시작하세요",
        content: (
            <div className="flex flex-col items-center justify-center h-full space-y-12">
                <div className="bg-white p-4 rounded-2xl">
                    {/* QR Code Placeholder */}
                    <div className="w-64 h-64 bg-gray-900 flex items-center justify-center rounded-xl">
                        <span className="text-xl text-white">QR Code</span>
                    </div>
                </div>
                <h2 className="text-5xl font-bold">Try Free Demo</h2>
                <p className="text-2xl text-gray-400">miniproj-hair-consulting/frontend</p>
                <button onClick={() => window.location.href = '/'}
                    className="px-12 py-4 bg-white text-black text-2xl font-bold rounded-full hover:scale-105 transition-transform">
                    Go to App 🚀
                </button>
            </div>
        )
    }
];

export default function PresentationPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
    };

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'Escape') navigate('/');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    return (
        <div className="w-full h-screen bg-black text-white relative overflow-hidden" onClick={nextSlide}>
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Slide Content */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="relative z-10 w-full h-full flex flex-col p-16"
                >
                    {/* Header */}
                    {slides[currentSlide].id !== 'intro' && slides[currentSlide].id !== 'outro' && (
                        <div className="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-6xl font-black mb-2 tracking-tight">{slides[currentSlide].title}</h1>
                                <p className="text-3xl text-gray-400 font-light">{slides[currentSlide].subtitle}</p>
                            </div>
                            <span className="text-6xl opacity-20 font-bold">{currentSlide + 1} <span className="text-3xl">/ {slides.length}</span></span>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-hidden">
                        {slides[currentSlide].content}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls Overlay */}
            <div className="absolute bottom-8 right-8 z-50 flex space-x-4 opacity-0 hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="p-4 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md"
                >
                    ◀
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="p-4 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md"
                >
                    ▶
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-800">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </div>
    );
}

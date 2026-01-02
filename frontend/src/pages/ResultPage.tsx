import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Home, ArrowLeft, Loader2, Download, Link2, X, ZoomIn, Heart, Share2, Search, Zap, Clock, RotateCcw, Monitor } from 'lucide-react';
import axios from 'axios';
import ComparisonSlider from '../components/ComparisonSlider';
import TimeChangeModal from '../components/TimeChangeModal';
import MultiAngleModal from '../components/MultiAngleModal';
import PoseModal from '../components/PoseModal';

// API Configuration
const API_HOST = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${API_HOST}:8000/api`;

export default function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { style, imagePreview, analysis } = location.state || {};

    const [isGenerating, setIsGenerating] = useState(true);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showDesigner, setShowDesigner] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Advanced Generation Modals
    const [showTimeChangeModal, setShowTimeChangeModal] = useState(false);
    const [showMultiAngleModal, setShowMultiAngleModal] = useState(false);
    const [showPoseModal, setShowPoseModal] = useState(false);

    // Initial Check
    if (!style || !imagePreview) {
        useEffect(() => { navigate('/'); }, [navigate]);
        return null;
    }

    // Fitting Logic
    useEffect(() => {
        const performFitting = async () => {
            if (resultImage) return;
            try {
                const fileId = analysis?.file_id;
                if (!fileId) {
                    console.error("No file_id found");
                    setIsGenerating(false);
                    return;
                }
                const response = await axios.post(`${API_BASE_URL}/consultant/fitting`, {
                    style_id: style.id,
                    user_image_path: fileId
                });
                if (response.data.generated_image_url) {
                    setResultImage(`http://${API_HOST}:8000${response.data.generated_image_url}`);
                }
            } catch (error) {
                console.error("Fitting failed:", error);
            } finally {
                setIsGenerating(false);
            }
        };
        performFitting();
    }, [style, analysis, resultImage]);

    // Check initial favorite status
    useEffect(() => {
        if (!resultImage) return;
        const saved = JSON.parse(localStorage.getItem('myStyles') || '[]');
        const exists = saved.some((item: any) => item.imageUrl === resultImage);
        setIsFavorite(exists);
    }, [resultImage]);

    // Toggle Favorite
    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!resultImage) return;

        const saved = JSON.parse(localStorage.getItem('myStyles') || '[]');

        if (isFavorite) {
            // Remove
            const newSaved = saved.filter((item: any) => item.imageUrl !== resultImage);
            localStorage.setItem('myStyles', JSON.stringify(newSaved));
            setIsFavorite(false);
        } else {
            // Add
            const newItem = {
                id: Date.now().toString(),
                imageUrl: resultImage,
                styleName: style.name,
                date: new Date().toISOString()
            };
            localStorage.setItem('myStyles', JSON.stringify([...saved, newItem]));
            setIsFavorite(true);
        }
    };

    // Download Handler
    const handleDownload = async () => {
        if (!resultImage) return;
        try {
            const response = await fetch(resultImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `studion_hair_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('다운로드에 실패했습니다. 이미지를 길게 눌러 저장해주세요.');
        }
    };

    // Share Handler (Opens Share Menu Modal)
    const handleShare = () => {
        if (!resultImage) return;
        setShowShareMenu(true);
    };

    // Copy Link Handler
    const handleCopyLink = async () => {
        if (resultImage) {
            try {
                await navigator.clipboard.writeText(resultImage);
                setShareMessage("링크 복사완료!");
                // Delay closing modal so user sees the success toast
                setTimeout(() => {
                    setShareMessage(null);
                    setShowShareMenu(false);
                }, 1500);
            } catch (err) {
                console.error('Clipboard write failed:', err);
                setShareMessage("복사 실패. URL을 직접 복사해주세요.");
                setTimeout(() => setShareMessage(null), 2000);
            }
        }
    };

    return (
        <div className="min-h-screen p-6 pt-20 max-w-md mx-auto flex flex-col relative pb-24">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-40 bg-gradient-to-b from-gray-900 via-gray-900/90 to-transparent max-w-md mx-auto">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/mystyles')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
                        <Heart className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
                        <Home className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Your New Look
                </h2>

                {/* Result Image Card */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800 aspect-[4/5] group mb-8">
                    {/* Action Buttons (Bottom Right) */}
                    <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                        {/* Zoom Button */}
                        <button
                            onClick={() => setShowZoomModal(true)}
                            className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
                        >
                            <ZoomIn className="w-6 h-6 text-white" />
                        </button>
                        {/* Favorite Button */}
                        <button
                            onClick={toggleFavorite}
                            className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
                        >
                            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>
                    </div>

                    {(isGenerating || !resultImage) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <span className="text-sm text-gray-400 animate-pulse">AI가 스타일링 중입니다...</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            <ComparisonSlider
                                beforeImage={imagePreview || style.image_url}
                                afterImage={resultImage || style.image_url}
                            />

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="font-bold text-white text-lg">{style.name}</p>
                                <p className="text-xs text-gray-300">AI Virtual Fitting</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Requested: Quick Actions (Download & Share) */}
                {resultImage && (
                    <div className="flex justify-center gap-6 mb-8 -mt-4 z-10 relative">
                        <button onClick={handleDownload} className="flex flex-col items-center gap-2 group">
                            <div className="p-4 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20 backdrop-blur-md shadow-lg">
                                <Download className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-gray-400 font-medium group-hover:text-red-400 transition-colors">다운로드</span>
                        </button>
                        <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                            <div className="p-4 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/20 backdrop-blur-md shadow-lg">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-gray-400 font-medium group-hover:text-red-400 transition-colors">공유하기</span>
                        </button>
                    </div>
                )}

                {/* Multi-Image Generation Options (Glass Grid) */}
                {resultImage && !isGenerating && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <span>추가 스타일 생성</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => setShowTimeChangeModal(true)} className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 overflow-hidden">
                                    <div className="p-2 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-200">시간 변화</p>
                                        <p className="text-[10px] text-gray-500">머리 자람</p>
                                    </div>
                                </button>
                                <button onClick={() => setShowMultiAngleModal(true)} className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 overflow-hidden">
                                    <div className="p-2 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                                        <RotateCcw className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-200">다각도</p>
                                        <p className="text-[10px] text-gray-500">앞/옆/뒤</p>
                                    </div>
                                </button>
                                <button onClick={() => setShowPoseModal(true)} className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 overflow-hidden">
                                    <div className="p-2 rounded-full bg-pink-500/20 text-pink-400 group-hover:bg-pink-500/30 transition-colors">
                                        <Monitor className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-200">포즈</p>
                                        <p className="text-[10px] text-gray-500">화보 컷</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommended Designer (Collapsible) */}
                <div className="mb-8">
                    {!showDesigner ? (
                        <button
                            onClick={() => setShowDesigner(true)}
                            className="w-full py-4 rounded-xl border border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all flex items-center justify-center gap-2"
                        >
                            <Search className="w-5 h-5" />
                            <span>이 스타일을 해줄 디자이너 찾기</span>
                        </button>
                    ) : (
                        <div className="glass-panel p-4 animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                    <span>추천 디자이너</span>
                                </h3>
                                <button onClick={() => setShowDesigner(false)} className="text-xs text-gray-500 hover:text-white">닫기</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden shrink-0">
                                    <img src="/chahong.png" alt="차홍 원장" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate">차홍 (Cha Hong)</h4>
                                    <p className="text-xs text-gray-400 truncate">차홍아르더 • 강남/청담</p>
                                </div>
                                <button
                                    className="px-4 py-2 bg-yellow-400 text-black text-xs font-bold rounded-full hover:bg-yellow-300 transition-colors whitespace-nowrap"
                                    onClick={() => window.open('https://map.kakao.com/link/search/차홍', '_blank')}
                                >
                                    예약하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Menu Modal */}
            {showShareMenu && resultImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowShareMenu(false)}
                >
                    <div
                        className="bg-gray-900 rounded-2xl p-5 w-[300px] shadow-2xl border border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-white mb-4 text-center">공유하기</h3>

                        {/* URL Copy Row */}
                        <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl mb-4">
                            <input
                                type="text"
                                readOnly
                                value={resultImage}
                                className="flex-1 bg-transparent text-xs text-gray-300 outline-none truncate"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                                title="링크 복사"
                            >
                                <Link2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Social Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button className="flex flex-col items-center gap-2 p-3 hover:bg-white/5 rounded-xl opacity-50 cursor-not-allowed">
                                <span className="text-3xl">💬</span>
                                <span className="text-xs text-gray-400">카카오톡</span>
                                <span className="text-[10px] text-gray-600">(준비중)</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-3 hover:bg-white/5 rounded-xl opacity-50 cursor-not-allowed">
                                <span className="text-3xl">📷</span>
                                <span className="text-xs text-gray-400">인스타그램</span>
                                <span className="text-[10px] text-gray-600">(준비중)</span>
                            </button>
                        </div>

                        {/* Share Message Toast */}
                        {shareMessage && (
                            <div className="mt-4 text-center bg-green-500/20 text-green-400 py-2 px-3 rounded-full text-sm font-bold animate-bounce">
                                {shareMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Enhanced Zoom Modal */}
            {showZoomModal && resultImage && (
                <div className="fixed inset-0 z-50 bg-black animate-fade-in flex flex-col">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                        <button onClick={() => setShowZoomModal(false)} className="p-2 text-white/80 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex gap-4">
                            <a
                                href={resultImage}
                                download={`hairstyle_ai_${Date.now()}.png`}
                                className="p-2 text-white/80 hover:text-white flex flex-col items-center gap-1"
                            >
                                <Download className="w-6 h-6" />
                            </a>
                            <div className="relative">
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="p-2 text-white/80 hover:text-white flex flex-col items-center gap-1"
                                >
                                    <Share2 className="w-6 h-6" />
                                </button>
                                {/* Share Dropdown */}
                                {showShareMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1">
                                        <button onClick={handleCopyLink} className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg text-left transition-colors">
                                            <Link2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-200">링크 복사</span>
                                        </button>
                                        <button className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg text-left transition-colors opacity-50 cursor-not-allowed">
                                            <span className="w-4 h-4 flex items-center justify-center text-xs">💬</span>
                                            <span className="text-sm text-gray-200">KakaoTalk</span>
                                        </button>
                                        <button className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg text-left transition-colors opacity-50 cursor-not-allowed">
                                            <span className="w-4 h-4 flex items-center justify-center text-xs">📷</span>
                                            <span className="text-sm text-gray-200">Instagram</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 flex items-center justify-center p-4">
                        <img
                            src={resultImage}
                            alt="Zoomed"
                            className="max-w-full max-h-full object-contain drop-shadow-2xl"
                        />
                    </div>

                    {/* Share Message Toast */}
                    {shareMessage && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                            {shareMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Advanced Generation Modals */}
            <TimeChangeModal
                isOpen={showTimeChangeModal}
                onClose={() => setShowTimeChangeModal(false)}
                userImagePath={resultImage || ''}
                styleName={style.name}
            />
            <MultiAngleModal
                isOpen={showMultiAngleModal}
                onClose={() => setShowMultiAngleModal(false)}
                userImagePath={resultImage || ''}
                styleName={style.name}
            />
            <PoseModal
                isOpen={showPoseModal}
                onClose={() => setShowPoseModal(false)}
                userImagePath={resultImage || ''}
                styleName={style.name}
            />
        </div>
    );
}

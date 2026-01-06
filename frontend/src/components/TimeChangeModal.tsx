import { useState, useEffect } from 'react';
import { X, Clock, Loader2, RefreshCw, ZoomIn } from 'lucide-react';
import axios from 'axios';

// ImageActionButtons is no longer used in the zoom modal, so its import is removed.

// const API_BASE_URL = `/api`; // Moved inside generateImages

// ... imports remain the same

interface TimeChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userImagePath: string;  // This is the original fitting result image
    styleName: string;
}

// Helper to extract path (same as others)
const getPathOnly = (fullUrl: string) => {
    try {
        if (!fullUrl) return '';
        // If it starts with http, remove origin
        if (fullUrl.startsWith('http')) {
            const url = new URL(fullUrl);
            return url.pathname;
        }
        return fullUrl;
    } catch (e) {
        return fullUrl;
    }
}

export function TimeChangeModal({
    isOpen,
    onClose,
    userImagePath,
    styleName
}: TimeChangeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<Record<string, string>>({});
    // const [error, setError] = useState<string | null>(null); // Replaced by toast
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string>('');

    const periodLabels: Record<string, string> = {
        original: '현재',
        '1month': '1개월 후',
        '3months': '3개월 후',
        '1year': '1년 후'
    };

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setImages({ 'original': userImagePath });
            // Don't auto-generate, let user see "Current" first or auto start? 
            // Better to auto-start if no results yet.
            if (Object.keys(images).length <= 1) {
                generateImages();
            }
        }
    }, [isOpen, userImagePath]); // Added userImagePath to dependencies

    const generateImages = async () => {
        setIsLoading(true);
        // setError(null); // Replaced by toast
        try {
            // Fix: Handle both full URL and relative URL for replacement
            // Ideally, the backend should accept the full URL and handle parsing,
            // or we strip the origin if present.
            // const pathOnly = userImagePath.replace(/^https?:\/\/[^\/]+/, ''); // Replaced by getPathOnly

            // API Call
            // Use relative path for API
            const API_BASE_URL = '/api';
            // Extract path from userImagePath (which might be full URL)
            const pathOnly = getPathOnly(userImagePath);

            const response = await axios.post(`${API_BASE_URL}/consultant/time-change`, {
                // base_image_url: userImagePath, // Removed
                user_image_path: pathOnly,
                style_name: styleName,
                // seed: Math.floor(Math.random() * 1000000) // Removed
            });

            // setImages({ // Replaced with merge
            //     original: userImagePath,
            //     '1month': response.data['1month'],
            //     '3months': response.data['3months'],
            //     '1year': response.data['1year']
            // });
            if (response.data) {
                setImages(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (err) {
            console.error('Time change generation failed:', err);
            // setError('이미지 생성에 실패했습니다. 다시 시도해주세요.'); // Replaced by toast
            alert("이미지 생성 실패");
        } finally {
            setIsLoading(false);
        }
    };

    // History handling for Zoom
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const modalState = event.state?.modal;
            if (modalState === 'nested_timeChange_zoom') {
                // We are in zoom state
                // If we were already zoomed, do nothing. If not, maybe we should be?
                // Actually this handler is mostly for catching the BACK action.
                // If the new state is NOT nested_timeChange_zoom, but IS timeChange (parent), we should close zoom.
            } else if (modalState === 'timeChange') {
                // Back to parent modal
                setSelectedImage(null);
                setSelectedLabel(''); // Clear label too
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const openZoom = (img: string, label: string) => {
        window.history.pushState({ modal: 'nested_timeChange_zoom' }, '', '');
        setSelectedImage(img);
        setSelectedLabel(label);
    };

    const closeZoom = () => {
        window.history.back();
        // Popstate will handle closing via effect?
        // Or we can set null here?
        // Ideally we sync with history.
        // But if we just call back(), popstate event fires.
        // Our handler sees 'timeChange' (previous state) and sets selectedImage(null). Correct.
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-white/10 shrink-0">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Clock className="w-5 h-5 text-blue-400" />
                        시간 변화
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={generateImages} disabled={isLoading} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="다시 생성">
                            <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    {isLoading && Object.keys(images).length <= 1 ? ( // Only show full loading if no images are loaded yet
                        <div className="aspect-square flex flex-col items-center justify-center bg-gray-800 rounded-xl">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-sm text-gray-400">AI가 시간 변화를 시뮬레이션 중...</p>
                            <p className="text-xs text-gray-500 mt-2">약 1분 소요됩니다</p>
                        </div>
                    ) : (
                        /* 2x2 Grid View */
                        <div className="grid grid-cols-2 gap-3">
                            {/* Current (Original) */}
                            <div
                                className="aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer border-2 border-blue-500/30"
                                onClick={() => openZoom(userImagePath, periodLabels.original)}
                            >
                                <img src={userImagePath} alt="Current" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-sm font-bold text-white text-center block">현재</span>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                                </div>
                            </div>

                            {/* Generated Images */}
                            {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).filter(key => key !== 'original').map(key => {
                                const resultUrl = images[key];
                                const label = periodLabels[key];

                                return (
                                    <div
                                        key={key}
                                        className={`aspect-[3/4] rounded-xl overflow-hidden relative group bg-gray-800 ${resultUrl ? 'cursor-pointer border border-white/10' : ''}`}
                                        onClick={() => resultUrl && openZoom(resultUrl, label)}
                                    >
                                        {isLoading && !resultUrl ? ( // Show individual loader if still loading and no image yet
                                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                <span className="text-xs text-gray-500">생성 중...</span>
                                            </div>
                                        ) : resultUrl ? (
                                            <>
                                                <img src={resultUrl} alt={label} className="w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                    <span className="text-sm font-bold text-white text-center block">{label}</span>
                                                </div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                                                <Clock className="w-8 h-8 text-gray-600" />
                                                <span className="text-xs text-gray-500">{label}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 text-center shrink-0">
                    <p className="text-xs text-gray-500">
                        실제 모발 성장은 개인차가 있을 수 있습니다
                    </p>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in" onClick={closeZoom}>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeZoom(); }}
                        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-[70]"
                    >
                        <X className="w-8 h-8 text-white" />
                    </button>
                    {/* Add label display */}
                    {selectedLabel && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-bold backdrop-blur-md z-[70]">
                            {selectedLabel}
                        </div>
                    )}
                    <img
                        src={selectedImage}
                        alt="Zoom"
                        className="max-w-full max-h-screen object-contain p-4"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

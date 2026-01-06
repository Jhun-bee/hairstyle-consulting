import { useState, useEffect } from 'react';
import { X, RotateCcw, Loader2, RefreshCw, ZoomIn } from 'lucide-react';
import axios from 'axios';

interface MultiAngleModalProps {
    isOpen: boolean;
    onClose: () => void;
    userImagePath: string;
    styleName: string;
}

// Helper to extract path
const getPathOnly = (fullUrl: string) => {
    try {
        if (!fullUrl) return '';
        if (fullUrl.startsWith('http')) {
            const url = new URL(fullUrl);
            return url.pathname;
        }
        return fullUrl;
    } catch (e) {
        return fullUrl;
    }
}

export function MultiAngleModal({
    isOpen,
    onClose,
    userImagePath,
    styleName
}: MultiAngleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<Record<string, string>>({});

    // Zoom State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string>('');

    const angleLabels: Record<string, string> = {
        'left': '왼쪽',
        'right': '오른쪽',
        'back': '뒷모습'
    };

    // Reset/Generate
    useEffect(() => {
        if (isOpen) {
            // Auto generate if empty (checking keys length < 1 because we don't set 'front' initially in state unlike TimeChange)
            // But actually we should verify if we want to show 'front' as userImagePath by default?
            if (Object.keys(images).length === 0) {
                generateImages();
            }
        }
    }, [isOpen]);

    const generateImages = async () => {
        setIsLoading(true);
        try {
            const API_BASE_URL = '/api';
            const pathOnly = getPathOnly(userImagePath);

            const response = await axios.post(`${API_BASE_URL}/consultant/multi-angle`, {
                user_image_path: pathOnly,
                style_name: styleName
            });

            if (response.data) {
                setImages(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (err) {
            console.error('Multi-angle generation failed:', err);
            alert('이미지 생성 실패');
        } finally {
            setIsLoading(false);
        }
    };

    // History handling for Zoom
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const modalState = event.state?.modal;
            if (modalState === 'nested_multiAngle_zoom') {
                // Zoom active
            } else if (modalState === 'multiAngle') {
                // Back to parent
                setSelectedImage(null);
                setSelectedLabel('');
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const openZoom = (img: string, label: string) => {
        window.history.pushState({ modal: 'nested_multiAngle_zoom' }, '', '');
        setSelectedImage(img);
        setSelectedLabel(label);
    };

    const closeZoom = () => {
        window.history.back();
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
                        <RotateCcw className="w-5 h-5 text-purple-400" />
                        다각도 뷰
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
                    <div className="grid grid-cols-2 gap-3">
                        {/* Current (Original) */}
                        <div
                            className="aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer border-2 border-purple-500/30"
                            onClick={() => openZoom(userImagePath, '정면 (현재)')}
                        >
                            <img src={userImagePath} alt="Current" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <span className="text-sm font-bold text-white text-center block">정면 (현재)</span>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                        </div>

                        {/* Generated Images */}
                        {['left', 'right', 'back'].map((key) => {
                            const resultUrl = images[key];
                            const label = angleLabels[key];

                            return (
                                <div
                                    key={key}
                                    className={`aspect-[3/4] rounded-xl overflow-hidden relative group bg-gray-800 ${resultUrl ? 'cursor-pointer border border-white/10' : ''}`}
                                    onClick={() => resultUrl && openZoom(resultUrl, label)}
                                >
                                    {isLoading && !resultUrl ? (
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
                                            <RotateCcw className="w-8 h-8 text-gray-600" />
                                            <span className="text-xs text-gray-500">{label}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 text-center shrink-0">
                    <p className="text-xs text-gray-500">AI가 생성한 측면/후면 모습입니다</p>
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

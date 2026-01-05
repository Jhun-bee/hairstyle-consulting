import { useState, useEffect } from 'react';
import { X, RotateCcw, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import ImageActionButtons from './ImageActionButtons';

const API_HOST = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${API_HOST}:8000/api`;

interface MultiAngleModalProps {
    isOpen: boolean;
    onClose: () => void;
    userImagePath: string;
    styleName: string;
}

type AngleKey = 'front' | 'left' | 'right' | 'back';

export default function MultiAngleModal({
    isOpen,
    onClose,
    userImagePath,
    styleName
}: MultiAngleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<Record<AngleKey, string>>({
        front: '',
        left: '',
        right: '',
        back: ''
    });
    const [selectedAngle, setSelectedAngle] = useState<AngleKey | null>(null);
    const [error, setError] = useState<string | null>(null);

    const angleLabels: Record<AngleKey, string> = {
        front: '정면',
        left: '왼쪽',
        right: '오른쪽',
        back: '뒷모습'
    };

    // Generate images when modal opens
    useEffect(() => {
        if (isOpen && !images.front) {
            generateImages();
        }
    }, [isOpen]);

    const generateImages = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/consultant/multi-angle`, {
                base_image_url: userImagePath,
                user_image_path: userImagePath.replace(`http://${API_HOST}:8000`, ''),
                style_name: styleName,
                seed: Math.floor(Math.random() * 1000000)
            });

            const newImages: Record<AngleKey, string> = {
                front: response.data.front ? `http://${API_HOST}:8000${response.data.front}` : '',
                left: response.data.left ? `http://${API_HOST}:8000${response.data.left}` : '',
                right: response.data.right ? `http://${API_HOST}:8000${response.data.right}` : '',
                back: response.data.back ? `http://${API_HOST}:8000${response.data.back}` : ''
            };
            setImages(newImages);
        } catch (err) {
            console.error('Multi-angle generation failed:', err);
            setError('이미지 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">다각도</h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={generateImages} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="다시 생성">
                            <RefreshCw className="w-5 h-5 text-gray-400" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="aspect-square flex flex-col items-center justify-center bg-gray-800 rounded-xl">
                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                            <p className="text-sm text-gray-400">AI가 다각도 이미지를 생성 중...</p>
                            <p className="text-xs text-gray-500 mt-2">약 1분 소요됩니다</p>
                        </div>
                    ) : error ? (
                        <div className="aspect-square flex flex-col items-center justify-center bg-gray-800 rounded-xl">
                            <p className="text-red-400 mb-4">{error}</p>
                            <button
                                onClick={generateImages}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(angleLabels) as AngleKey[]).map(angle => (
                                <div
                                    key={angle}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedAngle(angle)}
                                >
                                    <div className="aspect-[4/5] bg-gray-800 rounded-xl overflow-hidden">
                                        {images[angle] ? (
                                            <img
                                                src={images[angle]}
                                                alt={angleLabels[angle]}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 py-2 bg-black/70 backdrop-blur-sm">
                                        <p className="text-xs font-medium text-white text-center">{angleLabels[angle]}</p>
                                    </div>
                                    {/* Action buttons at bottom center */}
                                    {images[angle] && (
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageActionButtons
                                                imageUrl={images[angle]}
                                                styleName={`${styleName} - ${angleLabels[angle]}`}
                                                size="sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Image Modal */}
                {selectedAngle && images[selectedAngle] && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
                        onClick={() => setSelectedAngle(null)}
                    >
                        <div className="relative max-w-lg w-full mx-4">
                            <img
                                src={images[selectedAngle]}
                                alt={angleLabels[selectedAngle]}
                                className="w-full rounded-xl"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <ImageActionButtons
                                    imageUrl={images[selectedAngle]}
                                    styleName={`${styleName} - ${angleLabels[selectedAngle]}`}
                                    size="lg"
                                />
                            </div>
                            <button
                                onClick={() => setSelectedAngle(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

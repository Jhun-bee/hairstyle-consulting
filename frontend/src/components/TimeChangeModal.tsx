import { useState, useEffect } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import ImageActionButtons from './ImageActionButtons';

const API_HOST = window.location.hostname || 'localhost';
const API_BASE_URL = `http://${API_HOST}:8000/api`;

interface TimeChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userImagePath: string;  // This is the original fitting result image
    styleName: string;
}

export default function TimeChangeModal({
    isOpen,
    onClose,
    userImagePath,
    styleName
}: TimeChangeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<{
        original: string;
        '1month': string;
        '3months': string;
        '1year': string;
    }>({
        original: '',
        '1month': '',
        '3months': '',
        '1year': ''
    });
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string>('');

    const periodLabels = {
        original: '현재',
        '1month': '1개월 후',
        '3months': '3개월 후',
        '1year': '1년 후'
    };

    // Generate images when modal opens
    useEffect(() => {
        if (isOpen && !images['1month']) {
            setImages(prev => ({ ...prev, original: userImagePath }));
            generateImages();
        }
    }, [isOpen, userImagePath]);

    const generateImages = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/consultant/time-change`, {
                base_image_url: userImagePath,
                user_image_path: userImagePath.replace(`http://${API_HOST}:8000`, ''),
                style_name: styleName
            });

            setImages({
                original: userImagePath,
                '1month': response.data['1month'] ? `http://${API_HOST}:8000${response.data['1month']}` : '',
                '3months': response.data['3months'] ? `http://${API_HOST}:8000${response.data['3months']}` : '',
                '1year': response.data['1year'] ? `http://${API_HOST}:8000${response.data['1year']}` : ''
            });
        } catch (err) {
            console.error('Time change generation failed:', err);
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
                className="bg-gray-900 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">시간 변화</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content - Grid View showing all 4 images */}
                <div className="p-4">
                    {isLoading ? (
                        <div className="aspect-square flex flex-col items-center justify-center bg-gray-800 rounded-xl">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-sm text-gray-400">AI가 시간 변화를 시뮬레이션 중...</p>
                            <p className="text-xs text-gray-500 mt-2">약 1분 소요됩니다</p>
                        </div>
                    ) : error ? (
                        <div className="aspect-square flex flex-col items-center justify-center bg-gray-800 rounded-xl">
                            <p className="text-red-400 mb-4">{error}</p>
                            <button
                                onClick={generateImages}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : (
                        /* 2x2 Grid View */
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map(key => (
                                <div
                                    key={key}
                                    className="relative group cursor-pointer"
                                    onClick={() => {
                                        if (images[key]) {
                                            setSelectedImage(images[key]);
                                            setSelectedLabel(periodLabels[key]);
                                        }
                                    }}
                                >
                                    <div className={`aspect-[4/5] rounded-xl overflow-hidden ${key === 'original' ? 'ring-2 ring-blue-500' : 'bg-gray-800'}`}>
                                        {images[key] ? (
                                            <img
                                                src={images[key]}
                                                alt={periodLabels[key]}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Label */}
                                    <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl ${key === 'original' ? 'from-blue-900/80' : ''}`}>
                                        <p className={`text-xs font-bold text-center ${key === 'original' ? 'text-blue-300' : 'text-white'}`}>
                                            {periodLabels[key]}
                                        </p>
                                    </div>
                                    {/* Action buttons */}
                                    {images[key] && (
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageActionButtons
                                                imageUrl={images[key]}
                                                styleName={`${styleName} - ${periodLabels[key]}`}
                                                size="sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-500">
                        실제 모발 성장은 개인차가 있을 수 있습니다
                    </p>
                </div>
            </div>

            {/* Selected Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-lg w-full mx-4">
                        <img
                            src={selectedImage}
                            alt={selectedLabel}
                            className="w-full rounded-xl"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                            {selectedLabel}
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <ImageActionButtons
                                imageUrl={selectedImage}
                                styleName={`${styleName} - ${selectedLabel}`}
                                size="lg"
                            />
                        </div>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

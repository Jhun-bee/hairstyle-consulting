import { useState, useEffect } from 'react';
import { X, Camera, Loader2, Check, RefreshCw, ZoomIn } from 'lucide-react';
import axios from 'axios';
import ImageActionButtons from './ImageActionButtons';

interface PoseModalProps {
    isOpen: boolean;
    onClose: () => void;
    userImagePath: string;
    styleName: string;
}

type SceneType = 'studio' | 'outdoor' | 'runway';

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

export default function PoseModal({
    isOpen,
    onClose,
    userImagePath,
    styleName
}: PoseModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingPhotoBooth, setIsCreatingPhotoBooth] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [selectedScene, setSelectedScene] = useState<SceneType>('studio');
    const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
    const [photoBoothImage, setPhotoBoothImage] = useState<string | null>(null);

    // Zoom State
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    const sceneLabels: Record<SceneType, { label: string; icon: string }> = {
        studio: { label: '스튜디오', icon: '🎬' },
        outdoor: { label: '야외', icon: '🌳' },
        runway: { label: '런웨이', icon: '👠' }
    };

    // Reset when scene changes
    useEffect(() => {
        setImages([]);
        setSelectedImages(new Set());
        setPhotoBoothImage(null);
    }, [selectedScene]);

    // History handling for Zoom
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const modalState = event.state?.modal;
            if (modalState === 'nested_pose_zoom') {
                // Zoom active
            } else if (modalState === 'pose') {
                // Back to parent
                setZoomImage(null);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const openZoom = (img: string) => {
        window.history.pushState({ modal: 'nested_pose_zoom' }, '', '');
        setZoomImage(img);
    };

    const closeZoom = () => {
        window.history.back();
    };

    // Generate images when scene selected and modal open
    const generateImages = async () => {
        setIsLoading(true);
        setImages([]);
        setSelectedImages(new Set());
        setPhotoBoothImage(null);

        try {
            const API_BASE_URL = '/api';
            const pathOnly = getPathOnly(userImagePath);

            const response = await axios.post(`${API_BASE_URL}/consultant/pose`, {
                user_image_path: pathOnly,
                style_name: styleName,
                scene_type: selectedScene
            });

            if (response.data && response.data.images) {
                setImages(response.data.images);
            }
        } catch (err) {
            console.error('Pose generation failed:', err);
            alert('이미지 생성 실패');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle image selection
    const toggleImageSelection = (index: number) => {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else if (newSelected.size < 3) {
            newSelected.add(index);
        }
        setSelectedImages(newSelected);
    };

    // Create photo booth
    const createPhotoBooth = async () => {
        if (selectedImages.size !== 3) return;

        setIsCreatingPhotoBooth(true);
        try {
            const API_BASE_URL = '/api';
            const selectedUrls = Array.from(selectedImages).map(i => {
                const url = images[i];
                return getPathOnly(url);
            });

            const response = await axios.post(`${API_BASE_URL}/consultant/photo-booth`, {
                image_urls: selectedUrls,
                style_name: styleName
            });

            const photoBoothUrl = response.data.photo_booth_url;
            setPhotoBoothImage(photoBoothUrl);
        } catch (err) {
            console.error('Photo booth creation failed:', err);
            alert('인생세컷 생성 실패');
        } finally {
            setIsCreatingPhotoBooth(false);
        }
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
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-pink-400" />
                        <h3 className="text-lg font-bold text-white">포즈 (화보 컷)</h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={generateImages} disabled={isLoading} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="다시 생성">
                            <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Scene Selection Tabs */}
                <div className="flex border-b border-white/10 shrink-0">
                    {(Object.keys(sceneLabels) as SceneType[]).map(scene => (
                        <button
                            key={scene}
                            onClick={() => setSelectedScene(scene)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${selectedScene === scene
                                ? 'text-pink-400 border-b-2 border-pink-400 bg-pink-500/10'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span>{sceneLabels[scene].icon}</span>
                            <span>{sceneLabels[scene].label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Photo Booth Result */}
                    {photoBoothImage ? (
                        <div className="space-y-4">
                            <div className="relative group cursor-pointer" onClick={() => openZoom(photoBoothImage)}>
                                <img
                                    src={photoBoothImage}
                                    alt="인생세컷"
                                    className="w-full rounded-xl shadow-lg"
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                                <div className="absolute bottom-4 right-4" onClick={e => e.stopPropagation()}>
                                    <ImageActionButtons
                                        imageUrl={photoBoothImage}
                                        styleName={`${styleName} 인생세컷`}
                                        size="md"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setPhotoBoothImage(null)}
                                className="w-full py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                            >
                                ← 이미지 다시 선택하기
                            </button>
                        </div>
                    ) : images.length === 0 ? (
                        /* Generate Button */
                        <div className="aspect-square flex flex-col items-center justify-center bg-gray-800 rounded-xl">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                                    <p className="text-sm text-gray-400">AI가 화보 이미지를 생성 중...</p>
                                    <p className="text-xs text-gray-500 mt-2">약 1분 30초 소요됩니다</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-6xl mb-4">{sceneLabels[selectedScene].icon}</div>
                                    <p className="text-gray-300 font-medium mb-2">
                                        {sceneLabels[selectedScene].label} 컨셉
                                    </p>
                                    <p className="text-sm text-gray-500 mb-6 text-center px-8">
                                        6장의 화보 스타일 이미지를 생성합니다.<br />
                                        3장을 선택하여 인생세컷을 만들어보세요!
                                    </p>
                                    <button
                                        onClick={generateImages}
                                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all"
                                    >
                                        이미지 생성하기
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Image Grid with Selection */
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400 text-center">
                                인생세컷을 위해 <span className="text-pink-400 font-bold">3장</span>을 선택하세요
                                <span className="ml-2 text-white">({selectedImages.size}/3)</span>
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedImages.has(index)
                                            ? 'border-pink-500 ring-2 ring-pink-500/50'
                                            : 'border-transparent hover:border-white/30'
                                            }`}
                                        onClick={() => toggleImageSelection(index)}
                                    >
                                        <div className="aspect-[4/5] bg-gray-800 relative">
                                            {img.includes('placehold.co') ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                                    <span className="text-sm">생성 실패</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={img}
                                                    alt={`Pose ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>

                                        {/* Zoom Button (Top Left - moved to allow Checkbox on Right) */}
                                        {!img.includes('placehold.co') && (
                                            <button
                                                className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-lg hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); openZoom(img); }}
                                            >
                                                <ZoomIn className="w-4 h-4 text-white" />
                                            </button>
                                        )}

                                        {/* Checkbox */}
                                        <div
                                            className={`absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${selectedImages.has(index)
                                                ? 'bg-pink-500'
                                                : 'bg-black/50 border border-white/30'
                                                }`}
                                        >
                                            {selectedImages.has(index) && (
                                                <Check className="w-4 h-4 text-white" />
                                            )}
                                        </div>

                                        {/* Selection Order */}
                                        {selectedImages.has(index) && (
                                            <div className="absolute bottom-2 left-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                {Array.from(selectedImages).indexOf(index) + 1}
                                            </div>
                                        )}

                                        {/* Action buttons at bottom center */}
                                        <div
                                            className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <ImageActionButtons
                                                imageUrl={img}
                                                styleName={`${styleName} - ${sceneLabels[selectedScene].label} ${index + 1}`}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Photo Booth Button */}
                {images.length > 0 && !photoBoothImage && (
                    <div className="p-4 pt-0 shrink-0">
                        <button
                            onClick={createPhotoBooth}
                            disabled={selectedImages.size !== 3 || isCreatingPhotoBooth}
                            className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${selectedImages.size === 3
                                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isCreatingPhotoBooth ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>인생세컷 만드는 중...</span>
                                </>
                            ) : (
                                <span>인생세컷 만들기 ({selectedImages.size}/3)</span>
                            )}
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 pt-0 text-center shrink-0">
                    <p className="text-xs text-gray-500">
                        💡 생성된 이미지를 개별 저장하거나 인생세컷으로 합성할 수 있습니다
                    </p>
                </div>
            </div>

            {/* Zoom Modal */}
            {zoomImage && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in" onClick={closeZoom}>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeZoom(); }}
                        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-[70]"
                    >
                        <X className="w-8 h-8 text-white" />
                    </button>
                    <img
                        src={zoomImage}
                        alt="Zoom"
                        className="max-w-full max-h-screen object-contain p-4"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Heart, Download, Share2, Link2, X } from 'lucide-react';

interface ImageActionButtonsProps {
    imageUrl: string;
    styleName: string;
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    onFavoriteChange?: (isFavorite: boolean) => void;
}

export default function ImageActionButtons({
    imageUrl,
    styleName,
    size = 'md',
    showLabels = false,
    onFavoriteChange
}: ImageActionButtonsProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);

    // Icon sizes based on prop
    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    const buttonSize = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';

    // Check if already favorited
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('myStyles') || '[]');
        const exists = saved.some((item: any) => item.imageUrl === imageUrl);
        setIsFavorite(exists);
    }, [imageUrl]);

    // Toggle favorite
    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        const saved = JSON.parse(localStorage.getItem('myStyles') || '[]');

        if (isFavorite) {
            const newSaved = saved.filter((item: any) => item.imageUrl !== imageUrl);
            localStorage.setItem('myStyles', JSON.stringify(newSaved));
            setIsFavorite(false);
            onFavoriteChange?.(false);
        } else {
            const newItem = {
                id: Date.now().toString(),
                imageUrl: imageUrl,
                styleName: styleName,
                date: new Date().toISOString()
            };
            localStorage.setItem('myStyles', JSON.stringify([...saved, newItem]));
            setIsFavorite(true);
            onFavoriteChange?.(true);
        }
    };

    // Download handler
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hair_omakase_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('다운로드에 실패했습니다.');
        }
    };

    // Share handler
    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowShareMenu(true);
    };

    // Copy link
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(imageUrl);
            setShareMessage("링크 복사완료!");
            setTimeout(() => {
                setShareMessage(null);
                setShowShareMenu(false);
            }, 1500);
        } catch (err) {
            setShareMessage("복사 실패");
            setTimeout(() => setShareMessage(null), 2000);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                {/* Favorite */}
                <button
                    onClick={handleToggleFavorite}
                    className={`${buttonSize} rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all`}
                    title="저장"
                >
                    <Heart className={`${iconSize} ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                {showLabels && <span className="text-xs text-gray-400">저장</span>}

                {/* Download */}
                <button
                    onClick={handleDownload}
                    className={`${buttonSize} rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all`}
                    title="다운로드"
                >
                    <Download className={`${iconSize} text-white`} />
                </button>

                {/* Share */}
                <button
                    onClick={handleShare}
                    className={`${buttonSize} rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all`}
                    title="공유"
                >
                    <Share2 className={`${iconSize} text-white`} />
                </button>
            </div>

            {/* Share Menu Modal */}
            {showShareMenu && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowShareMenu(false)}
                >
                    <div
                        className="bg-gray-900 rounded-2xl p-5 w-[300px] shadow-2xl border border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">공유하기</h3>
                            <button onClick={() => setShowShareMenu(false)}>
                                <X className="w-5 h-5 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* URL Copy */}
                        <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl mb-4">
                            <input
                                type="text"
                                readOnly
                                value={imageUrl}
                                className="flex-1 bg-transparent text-xs text-gray-300 outline-none truncate"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
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

                        {shareMessage && (
                            <div className="mt-4 text-center bg-green-500/20 text-green-400 py-2 px-3 rounded-full text-sm font-bold">
                                {shareMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

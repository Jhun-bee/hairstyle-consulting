import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Trash2, Download, Share2, Check, X } from 'lucide-react';

interface SavedStyle {
    id: string;
    imageUrl: string;
    styleName: string;
    date: string;
}

const MyStylePage = () => {
    const navigate = useNavigate();
    const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('myStyles') || '[]');
        setSavedStyles(saved.reverse()); // Show newest first
    }, []);

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDelete = () => {
        if (!window.confirm("선택한 스타일을 삭제하시겠습니까?")) return;

        const newStyles = savedStyles.filter(style => !selectedIds.has(style.id));
        localStorage.setItem('myStyles', JSON.stringify(newStyles.reverse())); // Store in original order (oldest first logic) or just re-reverse
        setSavedStyles(newStyles);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const handleDownload = async () => {
        for (const id of selectedIds) {
            const style = savedStyles.find(s => s.id === id);
            if (style) {
                const link = document.createElement('a');
                link.href = style.imageUrl;
                link.download = `mystyle_${style.styleName}_${id}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
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
                <h1 className="text-lg font-bold">My Style</h1>
                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedIds(new Set());
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${isSelectionMode ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isSelectionMode ? '취소' : '선택'}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
                {savedStyles.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-gray-500">
                        <p>저장된 스타일이 없습니다.</p>
                        <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
                            새로운 스타일 찾으러 가기
                        </button>
                    </div>
                ) : (
                    savedStyles.map((style) => (
                        <div
                            key={style.id}
                            className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-800 group"
                            onClick={() => isSelectionMode ? toggleSelection(style.id) : null}
                        >
                            <img src={style.imageUrl} alt={style.styleName} className="w-full h-full object-cover" />

                            {/* Overlay info (when not selecting) */}
                            {!isSelectionMode && (
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white font-bold text-sm">{style.styleName}</p>
                                    <p className="text-gray-400 text-xs">{new Date(style.date).toLocaleDateString()}</p>
                                </div>
                            )}

                            {/* Selection Checkbox */}
                            {isSelectionMode && (
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all ${selectedIds.has(style.id) ? 'bg-black/60' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedIds.has(style.id) ? 'bg-blue-500 border-blue-500' : 'border-white'}`}>
                                        {selectedIds.has(style.id) && <Check className="w-5 h-5 text-white" />}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Action Bar (Selection Mode) */}
            {isSelectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex justify-around items-center z-50 animate-slide-up">
                    <button
                        onClick={handleDelete}
                        className="flex flex-col items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-xs">삭제 ({selectedIds.size})</span>
                    </button>
                    <div className="w-px h-8 bg-white/10"></div>
                    <button
                        onClick={handleDownload}
                        className="flex flex-col items-center gap-1 text-white hover:text-blue-300 transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        <span className="text-xs">다운로드</span>
                    </button>
                    <button
                        onClick={() => alert("준비 중입니다.")}
                        className="flex flex-col items-center gap-1 text-white hover:text-blue-300 transition-colors opacity-50 cursor-not-allowed"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-xs">공유</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MyStylePage;

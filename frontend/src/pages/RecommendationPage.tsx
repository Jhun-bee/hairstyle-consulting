import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recommendStyles, FaceAnalysisResult, Style } from '../services/api';
import { Loader2, Check, Home, ArrowLeft, Sparkles, Heart } from 'lucide-react';

const RecommendationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const previewRef = useRef<HTMLDivElement>(null); // Ref for scrolling
    const { analysis, imagePreview, genderFilter = 'all' } = location.state || {};

    const [recommendations, setRecommendations] = useState<Style[]>([]);
    const [comment, setComment] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);

    // Use relative path (Vite proxy handles /uploads)
    // const BACKEND_URL = ... (removed)

    const handleStyleSelect = (style: Style) => {
        setSelectedStyle(style);
        // Smooth scroll to preview on mobile/desktop
        setTimeout(() => {
            previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    useEffect(() => {
        if (!analysis) {
            navigate('/');
            return;
        }

        const fetchRecommendations = async () => {
            try {
                // Pass gender filter to API
                const result = await recommendStyles(analysis as FaceAnalysisResult, genderFilter);
                setRecommendations(result.recommendations);
                setComment(result.consultant_comment);
                setIsLoading(false);
            } catch (error) {
                console.error(error);
                // Mock fallback if offline
                setIsLoading(false);
            }
        };

        fetchRecommendations();
    }, [analysis, navigate, genderFilter]);

    const handleTryOn = () => {
        if (selectedStyle) {
            navigate('/result', {
                state: {
                    style: selectedStyle,
                    imagePreview,
                    analysis
                }
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                <p className="text-gray-400">Consulting with AI Stylist...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full pb-20 pt-20"
        >
            {/* Navigation Header */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-gray-900 to-transparent max-w-md mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/mystyles')}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                    >
                        <Heart className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                    >
                        <Home className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Analysis Summary */}
            <div className="glass-panel p-4 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <img src={imagePreview} className="w-20 h-20 rounded-full object-cover" alt="User" />
                </div>
                <h3 className="text-lg font-bold text-accent mb-2">Analysis Result</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>
                        <span className="text-gray-500 block text-xs">Face Shape</span>
                        {analysis.face_shape}
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs">Skin Tone</span>
                        {analysis.skin_tone}
                    </div>
                    <div className="col-span-2 mt-2 pt-2 border-t border-white/10 italic text-white/80">
                        "{comment}"
                    </div>
                </div>
            </div>

            {/* Main Content: Vertical Stack */}
            <div className="flex flex-col gap-6 pb-24">

                {/* 1. Style List */}
                <h3 className="text-xl font-bold">Recommended Styles</h3>
                <div className="grid grid-cols-1 gap-4">
                    {recommendations.map((style) => (
                        <div
                            key={style.id}
                            onClick={() => handleStyleSelect(style)}
                            className={`glass-panel p-4 flex items-center space-x-4 cursor-pointer transition-all ${selectedStyle?.id === style.id ? 'border-accent bg-white/10 scale-[1.02]' : 'hover:bg-white/5'
                                }`}
                        >
                            <img
                                src={style.image_url}
                                alt={style.name}
                                className="w-16 h-20 object-cover rounded-lg bg-gray-800 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-lg truncate pr-2">{style.name}</h4>
                                    {selectedStyle?.id === style.id && <Check className="w-6 h-6 text-accent shrink-0" />}
                                </div>
                                <p className="text-sm text-gray-400">{style.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 2. Preview Panel (Appears when selected) */}
                <div ref={previewRef} className="glass-panel p-6 border-t border-white/10 mt-2">
                    <h4 className="font-bold text-center mb-6 text-accent text-lg">
                        {selectedStyle ? `Preview: ${selectedStyle.name} ` : "Select a style to preview"}
                    </h4>

                    {selectedStyle ? (
                        <div className="flex flex-col items-center justify-center gap-4 w-full">

                            {/* Row 1: Original + Style */}
                            <div className="flex items-center justify-center gap-2 w-full">
                                {/* Original */}
                                <div className="relative w-1/2 aspect-[3/4] rounded-lg overflow-hidden shadow-md">
                                    <img src={imagePreview} className="w-full h-full object-cover opacity-90" alt="Me" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1 text-center text-xs font-bold text-white">Original</div>
                                </div>

                                <div className="text-white text-xl font-bold">+</div>

                                {/* Style */}
                                <div className="relative w-1/2 aspect-[3/4] rounded-lg overflow-hidden shadow-md border-2 border-accent/30">
                                    <img
                                        src={selectedStyle.image_url}

                                        className="w-full h-full object-cover"
                                        alt="Style"
                                    />
                                    <div className="absolute bottom-0 inset-x-0 bg-accent/90 text-black py-1 text-center text-xs font-bold">Target</div>
                                </div>
                            </div>

                            <div className="text-accent text-2xl font-bold animate-pulse">↓</div>

                            {/* Row 2: Expected Result Placeholder */}
                            <div className="w-full bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Sparkles className="w-6 h-6 text-yellow-400" />
                                <p className="text-sm font-bold text-gray-200">Virtual Fitting Result</p>
                                <p className="text-xs text-gray-500">Click the button below to generate!</p>
                            </div>

                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-gray-500">
                            <p className="text-center">Select a style to<br />preview the transformation formula!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 left-0 w-full px-4 flex justify-center z-50">
                <button
                    onClick={handleTryOn}
                    disabled={!selectedStyle}
                    className={`max-w-md w-full btn-primary shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    Try Virtual Fitting
                </button>
            </div>

        </motion.div>
    );
};

export default RecommendationPage;

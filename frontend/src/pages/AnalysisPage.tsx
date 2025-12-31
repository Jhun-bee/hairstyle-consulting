import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Loader2, ScanFace, ArrowLeft, Home, X } from 'lucide-react';
import { analyzeFace } from '../services/api';

const AnalysisPage = () => {
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setIsLoading(true);
        try {
            const result = await analyzeFace(selectedImage);
            // Navigate to next page with state
            navigate('/recommend', {
                state: {
                    analysis: result,
                    imagePreview: previewUrl
                }
            });
        } catch (err) {
            console.error(err);
            setError("Failed to analyze image. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 pt-20 flex flex-col items-center max-w-md mx-auto relative">

            {/* Navigation Header */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-gray-900 to-transparent max-w-md mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                >
                    <Home className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="w-full text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    AI Face Analysis
                </h2>
                <p className="text-gray-400">Upload a selfie to find your best style</p>
            </div>

            {/* Upload Area */}
            <div className="w-full aspect-square relative mb-8">
                {previewUrl ? (
                    <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 group">
                        <img
                            src={previewUrl}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                        />
                        {/* Scanning Effect Overlay */}
                        {isLoading && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"
                                initial={{ top: '-100%' }}
                                animate={{ top: '100%' }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                        )}
                        <button
                            onClick={handleRemoveImage}
                            className="absolute top-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                ) : (
                    <label className="w-full h-full rounded-3xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-400/5 transition-all group">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-blue-400" />
                        </div>
                        <span className="text-gray-400 font-medium group-hover:text-blue-300">Tap to Upload</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </label>
                )}
            </div>

            {/* Action Button */}
            <div className="w-full mt-auto pb-8">
                <button
                    onClick={handleAnalyze}
                    disabled={!selectedImage || isLoading}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${!selectedImage
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-white text-black hover:scale-[1.02] shadow-lg shadow-blue-500/20'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <ScanFace className="w-6 h-6" />
                            <span>Analyze Face</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

export default AnalysisPage;

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Home, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function ResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { style, imagePreview, analysis } = location.state || {}; // Expect analysis to have file_id

    const [isGenerating, setIsGenerating] = useState(true);
    const [resultImage, setResultImage] = useState<string | null>(null);

    if (!style || !imagePreview) {
        // Handle cases where state is missing, e.g., direct navigation without data
        useEffect(() => {
            navigate('/'); // Redirect to home if essential data is missing
        }, [navigate]);
        return null;
    }

    useEffect(() => {
        const performFitting = async () => {
            // If we already have a result, don't generate again (optimization)
            if (resultImage) return;

            try {
                // Determine user's image ID from analysis or assumption
                // analysis.file_id should be present if we updated the backend/frontend flow correctly
                const fileId = analysis?.file_id;

                if (!fileId) {
                    console.error("No file_id found in analysis data");
                    setIsGenerating(false);
                    return;
                }

                const response = await axios.post(`${API_BASE_URL}/consultant/fitting`, {
                    style_id: style.id,
                    user_image_path: fileId
                });

                if (response.data.generated_image_url) {
                    // Backend returns relative path "/results/..."
                    // We need to append base URL if it's not absolute, 
                    // but for now let's assume we need to handle static file serving or absolute url
                    // Note: Backend 'generate_hairstyle' returns "/results/filename.png"
                    // We need to make sure backend serves "/results" statically.
                    setResultImage(`http://127.0.0.1:8000${response.data.generated_image_url}`);
                }
            } catch (error) {
                console.error("Fitting failed:", error);
            } finally {
                setIsGenerating(false);
            }
        };

        performFitting();
    }, [style, analysis]);

    return (
        <div className="min-h-screen p-6 pt-20 max-w-md mx-auto flex flex-col relative">
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

            <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6 text-center">Your New Look</h2>

                {/* Comparison / Result View */}
                <div className="glass-panel p-2 mb-8 relative">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Original"
                                className="w-full h-48 object-cover rounded-l-lg opacity-50 grayscale"
                            />
                            <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">Original</span>
                        </div>
                        <div className="relative bg-gray-800 rounded-r-lg overflow-hidden h-48">
                            {isGenerating ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
                                    <span className="text-xs text-gray-400">Generating...</span>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={resultImage || style.image_url}
                                        alt="Target Style"
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error("Image load error:", e);
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('bg-red-900');
                                            // Show debug text
                                            const debugSpan = document.createElement('span');
                                            debugSpan.innerText = "❌ Image Load Error\n" + (resultImage || style.image_url);
                                            debugSpan.className = "text-xs text-red-300 p-2 break-all";
                                            e.currentTarget.parentElement?.appendChild(debugSpan);
                                        }}
                                    />
                                    <span className="absolute bottom-2 left-2 bg-accent text-black font-bold px-2 py-1 rounded text-xs">
                                        {resultImage ? "Simulation Result" : "Style Reference"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 p-4 text-center">
                        <p className="text-gray-300 text-sm mb-2">
                            ✨ <b>Virtual Fitting Result</b> ✨
                        </p>
                        {resultImage ? (
                            <p className="text-xs text-accent">
                                AI has generated your new look!
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500">
                                (Generating your style using Google Imagen...)
                            </p>
                        )}
                    </div>
                </div>

                {/* Designer Recommendation */}
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    <span>Recommended Designer</span>
                </h3>

                <div className="glass-panel p-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
                            <img src="https://placehold.co/100x100?text=Shop" alt="Designer" />
                        </div>
                        <div>
                            <h4 className="font-bold">Cha Hong (Mock)</h4>
                            <p className="text-xs text-gray-400">Ardor Academy • Gangnam</p>
                        </div>
                        <button
                            onClick={() => alert("Redirecting to Naver Booking...")}
                            className="ml-auto bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full hover:bg-yellow-300 transition-colors"
                        >
                            Book Now
                        </button>
                    </div>
                    {/* Mock Map */}
                    <div className="mt-3 w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Kakao Map View</span>
                    </div>
                </div>

                <div className="pb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="btn-outline w-full flex items-center justify-center space-x-2"
                    >
                        <Home className="w-4 h-4" />
                        <span>Back to Home</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

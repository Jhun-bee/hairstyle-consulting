import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ComparisonSlider from '../components/ComparisonSlider';
import { ArrowLeft, Download, RotateCcw, Heart, Share2, Home } from 'lucide-react';

const QuickResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);

    const imageUrl = searchParams.get('url');
    const resultUrl = searchParams.get('resultUrl');
    const style = searchParams.get('style');
    const imageId = searchParams.get('id');
    const gender = searchParams.get('gender') || 'male';

    // Fix: Prepend Backend Host if resultUrl is relative
    const API_HOST = window.location.hostname || 'localhost';
    const backendResultUrl = resultUrl?.startsWith('/')
        ? `http://${API_HOST}:8000${resultUrl}`
        : resultUrl;

    // Fix: Also do it for imageUrl if needed (uploads are usually relative too)
    const backendImageUrl = imageUrl?.startsWith('/')
        ? `http://${API_HOST}:8000${imageUrl}`
        : imageUrl;

    const handleDownload = async () => {
        if (!backendResultUrl) return;
        try {
            const response = await fetch(backendResultUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hair-omakase-${style}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        // TODO: Save to localStorage or backend
        if (!isLiked && backendResultUrl) {
            const savedStyles = JSON.parse(localStorage.getItem('myStyles') || '[]');
            savedStyles.push({
                id: Date.now(),
                style,
                imageUrl: backendResultUrl,
                originalUrl: backendImageUrl,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('myStyles', JSON.stringify(savedStyles));
        }
    };

    const handleShare = async () => {
        if (navigator.share && backendResultUrl) {
            try {
                await navigator.share({
                    title: `Hair Omakase - ${style}`,
                    text: `Check out my new ${style} hairstyle!`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share cancelled or failed');
            }
        } else {
            // Fallback: Copy URL to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (!imageUrl || !resultUrl) return <div className="min-h-screen flex items-center justify-center text-white">Invalid Result</div>;

    return (
        <div className="min-h-screen px-6 pt-20 pb-32 flex flex-col items-center max-w-md mx-auto relative">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-gray-900 to-transparent max-w-md mx-auto">
                <button
                    onClick={() => navigate(`/quick-fitting?step=2&id=${imageId}&gender=${gender}&uploadedUrl=${encodeURIComponent(imageUrl || '')}`)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/mystyles')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
                        <Heart className="w-5 h-5 text-white" />
                    </button>
                    <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
                        <Home className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Title */}
            <div className="w-full text-center space-y-2 mb-6">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Your New Look
                </h2>
                <p className="text-gray-400">{style}</p>
            </div>

            {/* Comparison Slider */}
            <div className="w-full mb-6">
                <ComparisonSlider beforeImage={backendImageUrl!} afterImage={backendResultUrl!} />
            </div>

            {/* Action Icons Row - Order: Try Another, Download, Share, Like */}
            <div className="flex justify-center gap-6 mb-6">
                <button
                    onClick={() => navigate(`/quick-fitting?step=2&id=${imageId}&gender=${gender}&uploadedUrl=${encodeURIComponent(imageUrl || '')}`)}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
                <button
                    onClick={handleDownload}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                    <Download className="w-6 h-6" />
                </button>
                <button
                    onClick={handleShare}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                    <Share2 className="w-6 h-6" />
                </button>
                <button
                    onClick={handleLike}
                    className={`p-3 rounded-full transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </button>
            </div>
        </div>
    );
};

export default QuickResultPage;

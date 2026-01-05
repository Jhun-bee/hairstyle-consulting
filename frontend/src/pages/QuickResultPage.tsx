import { useSearchParams, useNavigate } from 'react-router-dom';
import ComparisonSlider from '../components/ComparisonSlider';
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';

const QuickResultPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const imageUrl = searchParams.get('url');
    const resultUrl = searchParams.get('resultUrl');
    const style = searchParams.get('style');

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

    if (!imageUrl || !resultUrl) return <div>Invalid Result</div>;

    return (
        <div className="min-h-screen px-8 pt-20 flex flex-col items-center max-w-md mx-auto relative">
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-gray-900 to-transparent max-w-md mx-auto">
                <button
                    onClick={() => navigate('/quick-fitting')}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="w-full text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Your New Look
                </h2>
                <p className="text-gray-400">{style}</p>
            </div>

            <div className="w-full mb-8">
                <ComparisonSlider beforeImage={backendImageUrl!} afterImage={backendResultUrl!} />
            </div>

            <div className="flex gap-4 w-full">
                <button
                    onClick={() => navigate('/quick-fitting')}
                    className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Try Another</span>
                </button>
                <button
                    onClick={handleDownload}
                    className="flex-1 py-4 rounded-2xl bg-white text-black font-bold hover:scale-[1.02] shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                >
                    <Download className="w-5 h-5" />
                    <span>Save Photo</span>
                </button>
            </div>
        </div>
    );
};

export default QuickResultPage;

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, X, Loader2, Sparkles, ArrowRight, ArrowLeft, Heart, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStyles, uploadImage, generateQuickFitting } from '../services/api';

const QuickFittingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // State
    const [step, setStep] = useState<1 | 2>(1); // 1: Upload, 2: Select Style
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageId, setImageId] = useState<string | null>(null);

    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [styles, setStyles] = useState<{ male: string[], female: string[] }>({ male: [], female: [] });
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    // Restore state from URL params (when returning from result page)
    useEffect(() => {
        const urlStep = searchParams.get('step');
        const urlId = searchParams.get('id');
        const urlGender = searchParams.get('gender') as 'male' | 'female' | null;
        const urlUploadedUrl = searchParams.get('uploadedUrl');

        if (urlStep === '2' && urlId) {
            setStep(2);
            setImageId(urlId);
            // Use uploaded URL from params if available
            if (urlUploadedUrl) {
                setUploadedUrl(decodeURIComponent(urlUploadedUrl));
            }
        }
        if (urlGender) {
            setGender(urlGender);
        }
    }, [searchParams]);

    // Load Styles
    useEffect(() => {
        const fetchStyles = async () => {
            try {
                const data = await getStyles();
                setStyles(data);
            } catch (err) {
                console.error("Failed to load styles", err);
            }
        };
        fetchStyles();
    }, []);

    // Handlers
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadNext = async () => {
        if (!selectedImage) return;
        setIsLoading(true);
        try {
            const res = await uploadImage(selectedImage);
            setImageId(res.image_id); // Ensure backend returns image_id
            setUploadedUrl(res.url); // Store the actual URL with correct extension
            setStep(2);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!imageId || !selectedStyle) return;
        setIsThinking(true);
        try {
            const res = await generateQuickFitting(imageId, selectedStyle, gender);
            // Use uploadedUrl from state (has correct extension from backend)
            const API_HOST = window.location.hostname || 'localhost';
            const fullUploadedUrl = uploadedUrl?.startsWith('/')
                ? `http://${API_HOST}:8000${uploadedUrl}`
                : uploadedUrl;
            navigate(`/quick-result?id=${imageId}&url=${encodeURIComponent(fullUploadedUrl || '')}&resultUrl=${encodeURIComponent(res.result_image)}&style=${selectedStyle}&gender=${gender}`);
        } catch (err) {
            console.error(err);
            alert("Generation failed.");
            setIsThinking(false);
        }
    };

    return (
        <div className="min-h-screen px-8 pt-20 flex flex-col items-center max-w-md mx-auto relative">
            <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-gray-900 to-transparent max-w-md mx-auto">
                <button onClick={() => step === 1 ? navigate('/') : setStep(1)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all">
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

            <div className="w-full text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Quick Fitting
                </h2>
                <p className="text-gray-400">
                    {step === 1 ? "Upload your photo" : "Select a style"}
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full flex-1 flex flex-col items-center"
                        key="step1"
                    >
                        <div className="w-full aspect-square relative mb-8">
                            {previewUrl ? (
                                <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors">
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-full h-full rounded-3xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-400/5 transition-all group">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <span className="text-gray-400 font-medium group-hover:text-blue-300">Tap to Upload</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>

                        <button
                            onClick={handleUploadNext}
                            disabled={!selectedImage || isLoading}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${!selectedImage ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02] shadow-lg shadow-blue-500/20'
                                }`}
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Select Style</span><ArrowRight className="w-6 h-6" /></>}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full flex-1 flex flex-col"
                        key="step2"
                    >
                        {/* Gender Toggle */}
                        <div className="flex bg-gray-800 rounded-full p-1 mb-6">
                            {(['male', 'female'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${gender === g ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {g === 'male' ? 'Male' : 'Female'}
                                </button>
                            ))}
                        </div>

                        {/* Styles Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-20 overflow-y-auto pb-8 scrollbar-hide" style={{ maxHeight: '60vh' }}>
                            {styles[gender]?.map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`p-4 rounded-2xl text-left transition-all border ${selectedStyle === style ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20 shadow-lg' : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mb-3 flex items-center justify-center text-white font-bold text-lg">
                                        {style.charAt(0)}
                                    </div>
                                    <h4 className="text-white font-medium text-sm">{style}</h4>
                                </button>
                            ))}
                        </div>

                        {/* Generate Button (Fixed Bottom) */}
                        <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto">
                            <button
                                onClick={handleGenerate}
                                disabled={!selectedStyle || isThinking}
                                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${!selectedStyle || isThinking ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-[1.02] shadow-lg shadow-purple-500/30'
                                    }`}
                            >
                                {isThinking ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Designing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6" />
                                        <span>Try This Style</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickFittingPage;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Camera } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full min-h-screen flex flex-col justify-center px-4"
        >
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Hair Omakase
            </h1>
            <p className="text-gray-400 mb-12">AI Consultant & Virtual Fitting</p>

            <div className="space-y-4 w-full">
                {/* Mode A: Omakase */}
                <button
                    onClick={() => navigate('/analyze')}
                    className="group w-full glass-panel p-6 text-left hover:border-white/30 transition-all active:scale-95"
                >
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">AI Omakase</h3>
                            <p className="text-sm text-gray-400">Analysis • Reccommendation • Fitting</p>
                        </div>
                    </div>
                </button>

                {/* Mode B: Fitting Only */}
                <button
                    onClick={() => navigate('/quick-fitting')}
                    className="group w-full glass-panel p-6 text-left hover:border-white/30 transition-all active:scale-95"
                >
                    <div className="flex items-center space-x-4 mb-2">
                        <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Quick Fitting</h3>
                            <p className="text-sm text-gray-400">Instant Style Change</p>
                        </div>
                    </div>
                </button>
            </div>

            <p className="mt-12 text-xs text-gray-600">Powered by Gemini & Nano Banana</p>
        </motion.div>
    );
};

export default LandingPage;

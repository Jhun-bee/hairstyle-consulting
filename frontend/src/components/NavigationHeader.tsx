import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Camera } from 'lucide-react';

const NavigationHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine current mode based on path
    const isQuickMode = location.pathname.startsWith('/quick');
    // const isOmakaseMode = !isQuickMode;

    // Hide on Home Page
    if (location.pathname === '/') {
        return null;
    }

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
            <button
                onClick={() => navigate(isQuickMode ? '/analyze' : '/quick-fitting')}
                className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/90 text-sm font-medium transition-all shadow-lg hover:scale-105"
            >
                {isQuickMode ? (
                    <>
                        <Sparkles size={14} className="text-purple-400" />
                        <span>Go Omakase</span>
                    </>
                ) : (
                    <>
                        <Camera size={14} className="text-blue-400" />
                        <span>Go Quick</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default NavigationHeader;

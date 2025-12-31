import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages (to be created)
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import RecommendationPage from './pages/RecommendationPage';
import ResultPage from './pages/ResultPage';

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/analyze" element={<AnalysisPage />} />
                <Route path="/recommend" element={<RecommendationPage />} />
                <Route path="/result" element={<ResultPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-neutral-900 text-white overflow-hidden relative">
                {/* Background Ambient Light */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
                    <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-4">
                    <AnimatedRoutes />
                </div>
            </div>
        </Router>
    );
}

export default App;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns } from 'lucide-react';

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeImage, afterImage }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [position, setPosition] = useState(50); // percentage (0-100)
    const containerRef = useRef<HTMLDivElement>(null);

    const handleStart = () => setIsResizing(true);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const newPos = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setPosition(newPos);
    }, []);

    // Mouse events
    const onMouseMove = (e: React.MouseEvent) => {
        if (isResizing) handleMove(e.clientX);
    };

    // Touch events
    const onTouchMove = (e: React.TouchEvent) => {
        if (isResizing) handleMove(e.touches[0].clientX);
    };

    // Add global event listeners for drag end
    useEffect(() => {
        const handleGlobalEnd = () => setIsResizing(false);
        const handleGlobalMove = (e: MouseEvent) => {
            if (isResizing) handleMove(e.clientX);
        };
        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (isResizing) handleMove(e.touches[0].clientX);
        };

        if (isResizing) {
            window.addEventListener('mouseup', handleGlobalEnd);
            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('touchend', handleGlobalEnd);
            window.addEventListener('touchmove', handleGlobalTouchMove);
        }

        return () => {
            window.removeEventListener('mouseup', handleGlobalEnd);
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalEnd);
            window.removeEventListener('touchmove', handleGlobalTouchMove);
        };
    }, [isResizing, handleMove]);

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden select-none cursor-ew-resize group shadow-2xl"
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
        >
            {/* After Image (Background - Full) */}
            <img
                src={afterImage}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
            />
            <div
                className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded font-bold z-10 pointer-events-none transition-opacity duration-300"
                style={{ opacity: position > 90 ? 0 : 1 }}
            >
                After
            </div>

            {/* Before Image (Clipping Mask) */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
                <img
                    src={beforeImage}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />
                <div
                    className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded font-bold z-10 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: position < 10 ? 0 : 1 }}
                >
                    Before
                </div>
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${position}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transform active:scale-110 transition-transform">
                    <Columns className="w-4 h-4 text-gray-800" />
                </div>
            </div>
        </div>
    );
};

export default ComparisonSlider;

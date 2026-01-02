// Three.js type declarations for React Three Fiber
import '@react-three/fiber';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            mesh: any;
            boxGeometry: any;
            meshBasicMaterial: any;
            ambientLight: any;
            pointLight: any;
        }
    }
}

export { };

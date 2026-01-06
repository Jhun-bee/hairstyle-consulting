import axios from 'axios';

// Dynamic API URL - uses current hostname so it works on LAN
// Relative API URL - uses Vite proxy
const API_BASE_URL = `/api/consultant`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface FaceAnalysisResult {
    face_shape: string;
    skin_tone: string;
    hair_length: string;
    hair_texture: string;
    hair_color: string;
    feature_summary: string;
}

export interface Style {
    id: string;
    name: string;
    description: string;
    image_url: string;
}

export interface RecommendationResponse {
    analysis: FaceAnalysisResult;
    recommendations: Style[];
    consultant_comment: string;
}

export const analyzeFace = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<FaceAnalysisResult>('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const recommendStyles = async (analysis: FaceAnalysisResult, genderFilter: string = 'all') => {
    const response = await api.post<RecommendationResponse>('/recommend', analysis, {
        params: { gender_filter: genderFilter }
    });
    return response.data;
};

export const virtualFitting = async (styleId: string) => {
    const response = await api.post('/fitting', null, { params: { style_id: styleId } });
    return response.data;
};

// Quick Fitting API (Ported)
const GENERAL_API_BASE_URL = `/api`;
export const generalApi = axios.create({
    baseURL: GENERAL_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const getStyles = async () => {
    const response = await generalApi.get('/styles');
    return response.data;
};

export const generateQuickFitting = async (imageId: string, style: string, gender: string) => {
    const response = await generalApi.post('/generate', { image_id: imageId, style, gender });
    return response.data;
};

export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await generalApi.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

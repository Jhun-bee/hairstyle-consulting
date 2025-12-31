from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv
from PIL import Image
import typing_extensions as typing

load_dotenv()

# Data Models
class FaceAnalysisSchema(typing.TypedDict):
    face_shape: str
    skin_tone: str
    hair_length: str
    hair_texture: str
    hair_color: str
    feature_summary: str

class RecommendationSchema(typing.TypedDict):
    recommended_style_ids: list[str]
    comment: str

class GeminiClient:
    def __init__(self):
        try:
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                print("Error: GOOGLE_API_KEY not found.")
                return

            # Initialize the unified client
            self.client = genai.Client(api_key=api_key)
            
            # Model IDs - Updated to use available Gemini 2.5 models
            # From check_models_v2.py output
            # Analysis/Rec: Keep Gemini 3 (It works well)
            self.analysis_model_id = 'gemini-3-flash-preview'
            self.recommendation_model_id = 'gemini-3-flash-preview'
            
            # Image: Revert to Nano Banana (Gemini 3 Pro Image was failing with 206 byte files)
            self.imagen_model_id = 'gemini-2.5-flash-image'
            
        except Exception as e:
            print(f"Error initializing Gemini Client: {e}")

    async def analyze_face(self, image_path: str) -> FaceAnalysisSchema:
        """
        Analyzes the face using Gemini Vision to determine face shape and features.
        """
        try:
            print(f"DEBUG: Analyzing face from {image_path}")
            # The new SDK handles localized file paths or PIL images differently.
            # For simplicity, we can pass the PIL image if supported, or uploads.
            # v1 SDK supports PIL images directly in contents.
            img = Image.open(image_path)
            
            prompt = """
            이 사람의 얼굴과 헤어스타일을 분석해서 다음 정보를 JSON 형식으로 반환해줘.
            모든 값은 한국어로 작성해야 해.

            Identify:
            1. Face Shape (얼굴형: 계란형, 둥근형, 각진형, 긴형, 다이아몬드형 등)
            2. Skin Tone (피부톤: 웜톤, 쿨톤, 밝음, 어두움 등)
            3. Current Hair Length (기장: 숏, 미디엄, 롱)
            4. Current Hair Texture (모질: 직모, 반곱슬, 곱슬)
            5. Current Hair Color (색상)
            6. Feature Summary (특징 요약: 헤어스타일 추천에 필요한 얼굴 특징을 1-2문장으로 요약)
            
            Return the result in JSON format matching this schema:
            {
                "face_shape": "...",
                "skin_tone": "...",
                "hair_length": "...",
                "hair_texture": "...",
                "hair_color": "...",
                "feature_summary": "..."
            }
            """
            
            response = self.client.models.generate_content(
                model=self.analysis_model_id,
                contents=[prompt, img],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    safety_settings=[
                        types.SafetySetting(
                            category="HARM_CATEGORY_HARASSMENT",
                            threshold="BLOCK_NONE",
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HATE_SPEECH",
                            threshold="BLOCK_NONE",
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold="BLOCK_NONE",
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_NONE",
                        ),
                    ]
                )
            )

            print(f"DEBUG: Gemini Raw Response: {response.text}") 
            return json.loads(response.text)
        except Exception as e:
            print(f"CRITICAL ERROR in analysis: {e}")
            import traceback
            traceback.print_exc()
            return {
                "face_shape": "Unknown",
                "skin_tone": "Unknown",
                "hair_length": "Medium",
                "hair_texture": "Unknown",
                "hair_color": "Black",
                "feature_summary": "Could not analyze image due to an error."
            }

    async def recommend_styles_with_llm(self, analysis_result: dict, styles_db: list) -> RecommendationSchema:
        """
        Uses Gemini Pro to select best styles from the curated DB based on analysis.
        """
        try:
            # Prepare context
            analysis_context = json.dumps(analysis_result, indent=2)
            
            # Simple styles dump using the passed styles_db
            styles_context = json.dumps([{
                "id": s["id"], 
                "name": s["name"], 
                "tags": s["tags"], 
                "face_shape_match": s["face_shape_match"]
            } for s in styles_db], ensure_ascii=False)
            
            prompt = f"""
            You are a world-class celebrity hair consultant AI. You provide personalized, high-end styling advice.
            
            User Analysis:
            {analysis_context}
            
            Style Database:
            {styles_context}
            
            Task:
            1. Select exactly 3 styles from the database that PERFECTLY match the user's face shape and features.
            2. Write a warm, professional, and HIGHLY PERSONALIZED comment in Korean.
               - Do NOT use generic phrases like "잘 어울립니다".
               - Explain specifically WHY based on their features (e.g., "Since you have a round jawline, this cut adds volume to the top...").
               - Tone: Encouraging, sophisticated, expert.
            
            Return JSON:
            {{
                "recommended_style_ids": ["id1", "id2", "id3"],
                "comment": "..."
            }}
            """
            
            response = self.client.models.generate_content(
                model=self.recommendation_model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Error in recommendation: {e}")
            return {
                "recommended_style_ids": ["m_01", "m_02", "m_03"],
                "comment": "기본 추천 스타일입니다."
            }

    async def generate_hairstyle(self, original_image_path: str, prompt_modifier: str) -> str:
        """
        Generates a virtual fitting image using Nano Banana Pro (gemini-3-pro-image-preview).
        Preserves the original face and only changes the hairstyle.
        """
        try:
            print(f"DEBUG: Generating hairstyle with modifier: {prompt_modifier}")
            print(f"DEBUG: Original image path: {original_image_path}")
            
            # Load the original user image
            original_img = Image.open(original_image_path)
            
            # Craft a prompt using the user's requested structure
            # Craft a simplified prompt for Nano Banana (2.5 Flash Image)
            # Complex prompts often cause this lightweight model to return empty images (safety fallback or confusion)
            edit_prompt = f"""
            Change the hairstyle of the person in this image to: {prompt_modifier}.
            Important: Keep the face and facial features exactly the same. Only change the hair. 
            Photorealistic, high quality.
            """
            
            # Send both the image and the editing prompt
            response = self.client.models.generate_content(
                model=self.imagen_model_id,
                contents=[edit_prompt, original_img],
                config=types.GenerateContentConfig(
                    response_modalities=["image", "text"],
                )
            )
            
            # VERBOSE DEBUG: Print the entire response structure
            print(f"DEBUG: Full response object: {response}")
            if response.candidates:
                for idx, candidate in enumerate(response.candidates):
                    print(f"DEBUG: Candidate {idx}: finish_reason={getattr(candidate, 'finish_reason', 'N/A')}")
                    if candidate.content and candidate.content.parts:
                        for pidx, part in enumerate(candidate.content.parts):
                            print(f"DEBUG: Part {pidx}: type={type(part).__name__}")
                            if hasattr(part, 'text') and part.text:
                                print(f"DEBUG: Part {pidx} TEXT: {part.text[:500]}")
                            if hasattr(part, 'inline_data') and part.inline_data:
                                print(f"DEBUG: Part {pidx} INLINE_DATA: mime={part.inline_data.mime_type}, data_len={len(part.inline_data.data) if part.inline_data.data else 0}")
            else:
                print(f"DEBUG: No candidates! prompt_feedback={getattr(response, 'prompt_feedback', 'N/A')}")
            
            # Handle response - Nano Banana returns image in parts
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # Save the generated image
                        # NOTE: inline_data.data is ALREADY raw bytes (not base64!)
                        filename = f"generated_{os.urandom(4).hex()}.png"
                        save_path = os.path.join("results", filename)
                        os.makedirs("results", exist_ok=True)
                        
                        # Write raw bytes directly (no decoding needed!)
                        image_data = part.inline_data.data
                        with open(save_path, 'wb') as f:
                            f.write(image_data)
                        
                        abs_path = os.path.abspath(save_path)
                        print(f"DEBUG: Generated image saved to {abs_path}")
                        print(f"DEBUG: File size: {os.path.getsize(abs_path)} bytes")
                        
                        # Return web-friendly path (forward slashes)
                        web_path = f"/results/{filename}"
                        print(f"DEBUG: Returning URL path: {web_path}")
                        return web_path
                        
            print("DEBUG: No image generated in response")
            return "https://placehold.co/400x600?text=Generation+Failed"
            
        except Exception as e:
            print(f"Error in image generation: {e}")
            import traceback
            traceback.print_exc()
            # Fallback
            return "https://placehold.co/400x600?text=Fitting+Service+Unavailable"

client = GeminiClient()

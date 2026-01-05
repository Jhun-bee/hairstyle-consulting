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
            
            # Load the original user image and fix EXIF orientation (prevents 90 degree rotation)
            from PIL import ImageOps
            original_img = Image.open(original_image_path)
            original_img = ImageOps.exif_transpose(original_img)  # Fix rotation based on EXIF
            
            # Enhanced prompt for better results:
            # - Keep original hair COLOR (no dyeing)
            # - Hair length must be SAME or SHORTER (no extensions/wigs)
            # - Preserve face and orientation
            edit_prompt = f"""
            Apply this hairstyle to the person: {prompt_modifier}.
            
            CRITICAL RULES:
            1. Keep the ORIGINAL HAIR COLOR - do NOT change the hair color at all.
            2. Hair length must be the SAME or SHORTER than the original - never longer.
            3. Preserve the face, skin tone, and facial features exactly.
            4. Keep the same image orientation and angle as the input.
            5. PRESERVE ALL ACCESSORIES: Keep hats, caps, glasses, and earrings EXACTLY as they are. Do not remove or alter them.
            6. Photorealistic, high quality output.
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

    async def generate_time_change(self, user_image_path: str, style_name: str, seed: int = None) -> dict:
        """
        Generates hair growth simulation images for 1month, 3months, 1year.
        Returns: {"1month": url, "3months": url, "1year": url}
        """
        results = {}
        time_periods = [
            ("1month", "1개월 후", "slightly longer, about 1-2cm more growth"),
            ("3months", "3개월 후", "noticeably longer, about 3-5cm more growth"),
            ("1year", "1년 후", "significantly longer, about 12-15cm more growth")
        ]
        
        try:
            from PIL import ImageOps
            original_img = Image.open(user_image_path)
            original_img = ImageOps.exif_transpose(original_img)
            
            for key, korean_label, growth_desc in time_periods:
                prompt = f"""
                Show how this hairstyle "{style_name}" would look after hair growth.
                Time passed: {korean_label} ({growth_desc})
                
                RULES:
                1. Keep the same face, skin tone, and facial features EXACTLY.
                2. The hairstyle should be the same style but with natural hair growth.
                3. **BANGS/FRINGE GROWTH**: If there are bangs/fringe, they MUST grow longer naturally down the forehead/eyes. Do NOT keep them short or curled unnaturally.
                4. Avoid unnatural "comma" shapes or perfect geometric curls. Hair should fall naturally with gravity.
                5. Keep the original hair color - do NOT change it.
                6. Photorealistic, high quality output.
                7. Same image orientation and angle as input.
                """
                
                if seed is not None:
                    prompt += f"\n<!-- Variation Seed: {seed} -->"
                
                response = self.client.models.generate_content(
                    model=self.imagen_model_id,
                    contents=[prompt, original_img],
                    config=types.GenerateContentConfig(
                        response_modalities=["image", "text"],
                    )
                )
                
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            filename = f"time_{key}_{os.urandom(4).hex()}.png"
                            save_path = os.path.join("results", filename)
                            os.makedirs("results", exist_ok=True)
                            with open(save_path, 'wb') as f:
                                f.write(part.inline_data.data)
                            results[key] = f"/results/{filename}"
                            break
                
                if key not in results:
                    results[key] = "https://placehold.co/400x600?text=Generation+Failed"
                    
        except Exception as e:
            print(f"Error in time change generation: {e}")
            import traceback
            traceback.print_exc()
            for key, _, _ in time_periods:
                if key not in results:
                    results[key] = "https://placehold.co/400x600?text=Error"
        
        return results

    async def generate_multi_angle(self, user_image_path: str, style_name: str, seed: int = None) -> dict:
        """
        Generates 4 angle views: front, left, right, back.
        Returns: {"front": url, "left": url, "right": url, "back": url}
        """
        results = {}
        angles = [
            ("front", "정면", "front view, looking directly at camera"),
            ("left", "왼쪽 옆모습", "left side profile view, 90 degrees to the left"),
            ("right", "오른쪽 옆모습", "right side profile view, 90 degrees to the right"),
            ("back", "뒷모습", "back view, showing the back of the head")
        ]
        
        try:
            from PIL import ImageOps
            original_img = Image.open(user_image_path)
            original_img = ImageOps.exif_transpose(original_img)
            
            for key, korean_label, angle_desc in angles:
                prompt = f"""
                Show this EXACT person with the EXACT same hairstyle from a different viewing angle.
                Requested Angle: {korean_label} ({angle_desc})
                
                CRITICAL HAIR CONSISTENCY RULES:
                1. The hairstyle MUST be EXACTLY the same as shown in the input image.
                2. If the hair is down/loose in the input, it MUST remain down/loose from all angles.
                3. DO NOT add ponytails, buns, braids, or any hair accessories that are not in the input.
                4. DO NOT change the hair length, volume, or texture.
                5. Hair color must remain EXACTLY the same.
                6. The hairstyle "{style_name}" characteristics must be consistent from all angles.
                
                OTHER RULES:
                7. Keep the same person's face, skin tone, and body EXACTLY.
                8. Only change the viewing angle to: {angle_desc}.
                9. Photorealistic, high quality output with consistent lighting.
                10. Same clothing and background style.
                """
                
                if seed is not None:
                    prompt += f"\n<!-- Variation Seed: {seed} -->"

                response = self.client.models.generate_content(
                    model=self.imagen_model_id,
                    contents=[prompt, original_img],
                    config=types.GenerateContentConfig(
                        response_modalities=["image", "text"],
                    )
                )
                
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            filename = f"angle_{key}_{os.urandom(4).hex()}.png"
                            save_path = os.path.join("results", filename)
                            os.makedirs("results", exist_ok=True)
                            with open(save_path, 'wb') as f:
                                f.write(part.inline_data.data)
                            results[key] = f"/results/{filename}"
                            break
                
                if key not in results:
                    results[key] = "https://placehold.co/400x600?text=Generation+Failed"
                    
        except Exception as e:
            print(f"Error in multi-angle generation: {e}")
            import traceback
            traceback.print_exc()
            for key, _, _ in angles:
                if key not in results:
                    results[key] = "https://placehold.co/400x600?text=Error"
        
        return results

    async def generate_pose(self, user_image_path: str, style_name: str, scene_type: str, seed: int = None) -> dict:
        """
        Generates 6 photoshoot-style images based on scene type with unique poses.
        scene_type: "studio" | "outdoor" | "runway"
        Returns: {"images": [url1, url2, url3, url4, url5, url6]}
        """
        # Each prompt has a unique pose description to ensure variety
        scene_configs = {
            "studio": {
                "name": "스튜디오",
                "prompts": [
                    "professional studio portrait, soft lighting, neutral backdrop, POSE: looking directly at camera with confident smile",
                    "dramatic studio lighting, dark background, fashion editorial, POSE: side profile view, chin slightly up",
                    "bright high-key studio, white background, beauty shot, POSE: head tilted, looking over shoulder",
                    "artistic studio with colored gel lights, creative portrait, POSE: sitting pose, relaxed posture",
                    "classic black and white studio portrait, timeless elegance, POSE: looking down with closed eyes, peaceful expression",
                    "cinematic studio lighting, moody atmosphere, POSE: looking upward, aspirational expression"
                ]
            },
            "outdoor": {
                "name": "야외",
                "prompts": [
                    "golden hour outdoor portrait, warm sunlight, natural bokeh, POSE: walking towards camera, candid movement",
                    "urban street style, city background, lifestyle shot, POSE: leaning against wall, casual cool pose",
                    "beach setting, ocean breeze, relaxed summer vibe, POSE: sitting on sand, looking at horizon",
                    "autumn park, colorful fall leaves, romantic atmosphere, POSE: spinning with arms slightly out, joyful movement",
                    "rooftop at sunset, city skyline, trendy urban portrait, POSE: side view looking into distance, contemplative",
                    "cafe terrace, european vibes, natural daylight, POSE: seated at table, hand on chin, thoughtful"
                ]
            },
            "runway": {
                "name": "런웨이",
                "prompts": [
                    "FASHION RUNWAY CATWALK, actual runway with audience on both sides, dramatic catwalk lighting, POSE: mid-stride walking down the runway, confident model walk",
                    "FASHION RUNWAY CATWALK, long white runway with spotlights, fashion show atmosphere, POSE: standing at end of runway, powerful stance facing camera",
                    "FASHION RUNWAY CATWALK, modern minimalist runway stage, professional fashion photography, POSE: turning at runway end, elegant pivot movement",
                    "FASHION RUNWAY CATWALK, luxury fashion week setting, dramatic overhead lighting, POSE: walking towards camera on runway, fierce expression",
                    "FASHION RUNWAY CATWALK, sleek black runway with dramatic lighting, high fashion atmosphere, POSE: profile view walking on runway, elongated silhouette",
                    "FASHION RUNWAY CATWALK, premium fashion show runway, designer lighting setup, POSE: runway finale pose, arms at sides, commanding presence"
                ]
            }
        }
        
        config = scene_configs.get(scene_type, scene_configs["studio"])
        results = {"images": []}
        
        try:
            from PIL import ImageOps
            original_img = Image.open(user_image_path)
            original_img = ImageOps.exif_transpose(original_img)
            
            for i, scene_prompt in enumerate(config["prompts"]):
                prompt = f"""
                Create a stunning photoshoot image of this person with hairstyle "{style_name}".
                Scene: {scene_prompt}
                
                RULES:
                1. Keep the same person's face and identity EXACTLY.
                2. Apply the hairstyle "{style_name}" perfectly styled for this scene.
                3. Create a professional, magazine-quality photograph.
                4. Match the lighting and mood to the scene description.
                5. The person should have a natural, confident pose.
                6. Keep the original hair color.
                7. High resolution, photorealistic output.
                """
                
                if seed is not None:
                    prompt += f"\n<!-- Variation Seed: {seed} -->"

                response = self.client.models.generate_content(
                    model=self.imagen_model_id,
                    contents=[prompt, original_img],
                    config=types.GenerateContentConfig(
                        response_modalities=["image", "text"],
                    )
                )
                
                if response.candidates and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            filename = f"pose_{scene_type}_{i}_{os.urandom(4).hex()}.png"
                            save_path = os.path.join("results", filename)
                            os.makedirs("results", exist_ok=True)
                            with open(save_path, 'wb') as f:
                                f.write(part.inline_data.data)
                            results["images"].append(f"/results/{filename}")
                            break
                
                # Fallback for this image
                if len(results["images"]) <= i:
                    results["images"].append("https://placehold.co/400x600?text=Generation+Failed")
                    
        except Exception as e:
            print(f"Error in pose generation: {e}")
            import traceback
            traceback.print_exc()
            while len(results["images"]) < 6:
                results["images"].append("https://placehold.co/400x600?text=Error")
        
        return results

    async def generate_photo_booth(self, image_urls: list, style_name: str) -> str:
        """
        Composites 3 images into a photo booth strip layout (인생세컷).
        Uses Pillow for image composition.
        Returns: URL of the composed image
        """
        from PIL import Image as PILImage, ImageDraw, ImageFont
        from datetime import datetime
        import io
        import requests as req
        
        try:
            # Configuration
            cell_width = 400
            cell_height = 500
            padding = 20
            footer_height = 80
            
            # Total dimensions
            total_width = cell_width + padding * 2
            total_height = cell_height * 3 + padding * 4 + footer_height
            
            # Create canvas with white background
            canvas = PILImage.new('RGB', (total_width, total_height), '#FFFFFF')
            draw = ImageDraw.Draw(canvas)
            
            # Load and place each image
            y_offset = padding
            for i, img_url in enumerate(image_urls[:3]):
                try:
                    # Handle local file paths
                    if img_url.startswith('/results/'):
                        img_path = os.path.join("results", img_url.replace('/results/', ''))
                        img = PILImage.open(img_path)
                    else:
                        # Remote URL
                        response = req.get(img_url)
                        img = PILImage.open(io.BytesIO(response.content))
                    
                    # Resize to fit cell
                    img = img.convert('RGB')
                    img.thumbnail((cell_width, cell_height), PILImage.Resampling.LANCZOS)
                    
                    # Center in cell
                    x_pos = padding + (cell_width - img.width) // 2
                    y_pos = y_offset + (cell_height - img.height) // 2
                    
                    canvas.paste(img, (x_pos, y_pos))
                    
                except Exception as e:
                    print(f"Error loading image {i}: {e}")
                    # Draw placeholder
                    draw.rectangle([padding, y_offset, padding + cell_width, y_offset + cell_height], 
                                   fill='#F0F0F0', outline='#CCCCCC')
                
                y_offset += cell_height + padding
            
            # Footer with branding
            footer_y = y_offset
            draw.rectangle([0, footer_y, total_width, total_height], fill='#1a1a2e')
            
            # Try to use Korean-compatible fonts on Windows
            title_font = None
            date_font = None
            font_candidates = [
                "malgun.ttf",      # Windows 맑은 고딕
                "malgunbd.ttf",    # Windows 맑은 고딕 Bold
                "NanumGothic.ttf", # Nanum Gothic
                "gulim.ttc",       # Windows 굴림
                "batang.ttc",      # Windows 바탕
                "C:/Windows/Fonts/malgun.ttf",
                "C:/Windows/Fonts/NanumGothic.ttf",
            ]
            
            for font_path in font_candidates:
                try:
                    title_font = ImageFont.truetype(font_path, 24)
                    date_font = ImageFont.truetype(font_path, 16)
                    break
                except:
                    continue
            
            if title_font is None:
                title_font = ImageFont.load_default()
                date_font = ImageFont.load_default()
            
            # Title (without emojis for font compatibility)
            title_text = f"- {style_name} -"
            title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
            title_x = (total_width - (title_bbox[2] - title_bbox[0])) // 2
            draw.text((title_x, footer_y + 15), title_text, fill='white', font=title_font)
            
            # Date
            date_text = datetime.now().strftime("%Y.%m.%d")
            date_bbox = draw.textbbox((0, 0), date_text, font=date_font)
            date_x = (total_width - (date_bbox[2] - date_bbox[0])) // 2
            draw.text((date_x, footer_y + 48), date_text, fill='#888888', font=date_font)
            
            # Save
            filename = f"photobooth_{os.urandom(4).hex()}.png"
            save_path = os.path.join("results", filename)
            os.makedirs("results", exist_ok=True)
            canvas.save(save_path, 'PNG', quality=95)
            
            return f"/results/{filename}"
            
        except Exception as e:
            print(f"Error in photo booth generation: {e}")
            import traceback
            traceback.print_exc()
            return "https://placehold.co/400x1600?text=Photo+Booth+Failed"

client = GeminiClient()

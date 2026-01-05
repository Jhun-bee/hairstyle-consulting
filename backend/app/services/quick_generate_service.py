from app.services.gemini_client import gemini_client

class GenerateService:
    def generate(self, image_id: str, style: str, gender: str = "person") -> str:
        # 1. Image Generation (Local SD or HF)
        # Pass gender to the image gen client
        try:
            # Refactored to use the unified gemini_client method
            result = gemini_client.generate_quick_fitting_hairstyle(image_id, style, gender)
            # image_gen_client returns (id, url)
            if isinstance(result, tuple):
                return result[1]
            return result
        except Exception as e:
            print(f"Generate Service Error: {e}")
            import traceback
            traceback.print_exc()
            # Fallback for now if gen fails - try different extensions
            import os
            BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            UPLOADS_DIR = os.path.join(BACKEND_ROOT, "uploads")
            for ext in [".png", ".jpg", ".jpeg", ".webp"]:
                if os.path.exists(os.path.join(UPLOADS_DIR, f"{image_id}{ext}")):
                    return f"/uploads/{image_id}{ext}"
            return f"/uploads/{image_id}.png"

quick_generate_service = GenerateService()

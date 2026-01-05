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
            # Fallback for now if gen fails
            return f"/uploads/{image_id}.jpg"

quick_generate_service = GenerateService()

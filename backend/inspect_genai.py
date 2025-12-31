import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

print("Available attributes in genai:")
print(dir(genai))

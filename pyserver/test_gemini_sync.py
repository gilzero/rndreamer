import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"  # or whatever model you're using

def test_gemini_sync():
    print("\n=== Testing Gemini Chat (Sync) ===\n")
    
    # Initialize the model
    print("Initializing Gemini model...")
    llm = ChatGoogleGenerativeAI(
        api_key=GEMINI_API_KEY,
        model=GEMINI_MODEL,
        temperature=0.7,
        max_output_tokens=2048,
        safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    # Test simple invocation
    print("\nTesting simple invocation...")
    response = llm.invoke("What is 2+2?")
    print(f"Response: {response.content}")
    
    # Test with system message
    print("\nTesting with system message...")
    response = llm.invoke([
        {"role": "system", "content": "You are a helpful math tutor."},
        {"role": "user", "content": "What is 2+2?"}
    ])
    print(f"Response: {response.content}")

if __name__ == "__main__":
    try:
        test_gemini_sync()
    except Exception as e:
        print(f"\nTest failed with error: {str(e)}")
        raise 
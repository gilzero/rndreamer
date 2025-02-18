import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory
from langchain.schema import HumanMessage, SystemMessage
import asyncio
from langchain.callbacks import AsyncIteratorCallbackHandler

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"  # or whatever model you're using

async def test_gemini():
    print("\n=== Testing Gemini Chat ===\n")
    
    # Initialize the model
    print("Initializing Gemini model...")
    llm = ChatGoogleGenerativeAI(
        api_key=GEMINI_API_KEY,
        model=GEMINI_MODEL,
        temperature=0.7,
        max_output_tokens=2048,
        top_p=1,
        top_k=40,
        safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    # Test 1: Simple message
    print("\nTest 1: Simple message")
    messages = [
        HumanMessage(content="What is 2+2?")
    ]
    
    response = await llm.agenerate([messages])
    print(f"Response: {response.generations[0][0].text}")
    
    # Test 2: System + User message
    print("\nTest 2: System + User message")
    messages = [
        SystemMessage(content="You are a helpful math tutor."),
        HumanMessage(content="What is 2+2?")
    ]
    
    response = await llm.agenerate([messages])
    print(f"Response: {response.generations[0][0].text}")
    
    # Update Test 3: Streaming response
    print("\nTest 3: Streaming response")
    callback = AsyncIteratorCallbackHandler()
    llm_with_streaming = ChatGoogleGenerativeAI(
        api_key=GEMINI_API_KEY,
        model=GEMINI_MODEL,
        temperature=0.7,
        max_output_tokens=2048,
        streaming=True,
        convert_messages=True,
        callbacks=[callback],
        safety_settings={
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        }
    )
    
    messages = [
        HumanMessage(content="Count from 1 to 5 slowly.")
    ]
    
    # Create and start the generation task
    task = asyncio.create_task(llm_with_streaming.agenerate([messages]))
    
    collected_tokens = []
    print("Streaming response:")
    try:
        async for token in callback.aiter():
            collected_tokens.append(token)
            print(f"Token: {token}", end="", flush=True)
    except Exception as e:
        print(f"\nStreaming error: {str(e)}")
    
    # Wait for completion and print results
    try:
        result = await task
        print("\nTask complete")
        print(f"Final response: {result.generations[0][0].text}")
        print(f"Total tokens received: {len(collected_tokens)}")
    except Exception as e:
        print(f"\nTask error: {str(e)}")
    
    # Test 4: Error handling
    print("\nTest 4: Error handling")
    try:
        messages = [
            HumanMessage(content="")  # Empty message to test error handling
        ]
        response = await llm.agenerate([messages])
        print(f"Response: {response.generations[0][0].text}")
    except Exception as e:
        print(f"Caught error (as expected): {str(e)}")

async def main():
    try:
        await test_gemini()
    except Exception as e:
        print(f"\nTest failed with error: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 
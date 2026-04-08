#!/usr/bin/env python3
"""Quick LLM diagnostic test - shows configuration and tests basic connectivity."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))


async def main():
    print("\n╔════════════════════════════════════════════════════════╗")
    print("║     Multi-LLM Provider System - Quick Diagnostic      ║")
    print("╚════════════════════════════════════════════════════════╝\n")

    # Test 1: Configuration
    print("📋 Configuration:")
    print("-" * 60)
    try:
        from src.config.llm_settings import get_llm_settings

        settings = get_llm_settings()
        print(f"   Provider: {settings.DEFAULT_LLM_PROVIDER}")
        print(f"   Model: {settings.DEFAULT_MODEL}")
        print(f"   Fallback: {settings.FALLBACK_MODEL if settings.ENABLE_FALLBACK else 'Disabled'}")

        api_key = settings.get_api_key_for_provider(settings.DEFAULT_LLM_PROVIDER)
        if api_key:
            print(f"   API Key: {api_key[:10]}...{api_key[-4:]} (configured)")
        else:
            print("   ❌ API Key: MISSING")
            return

    except Exception as e:
        print(f"❌ Config error: {e}")
        return

    # Test 2: Simple LLM call with detailed error handling
    print("\n📡 Testing LLM Call:")
    print("-" * 60)
    try:
        from src.api.llm_client import get_client

        client = get_client()

        prompt = "Respond with exactly: Hello, detective!"
        print(f"   Prompt: '{prompt}'")
        print(f"   Calling {settings.DEFAULT_MODEL}...")

        response = await client.get_response(
            prompt=prompt,
            max_tokens=100,
            temperature=0.1,  # Low temp for deterministic response
        )

        if response:
            print(f"   ✅ Response: '{response}'")
            print(f"   Length: {len(response)} chars")
        else:
            print("   ⚠️  Response is empty!")
            print("   This may indicate:")
            print("      - Free tier rate limit")
            print("      - Model doesn't support this request type")
            print("      - API key issue")
            print("\n   Trying fallback model...")

            # Try fallback explicitly
            if settings.ENABLE_FALLBACK:
                fallback_response = await client._call_llm(
                    model=settings.FALLBACK_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=100,
                    temperature=0.1,
                )
                if fallback_response:
                    print(f"   ✅ Fallback response: '{fallback_response}'")
                else:
                    print("   ❌ Fallback also empty")

    except Exception as e:
        print(f"   ❌ LLM call failed: {e}")
        import traceback

        traceback.print_exc()
        return

    print("\n" + "=" * 60)
    print("✅ Multi-LLM system is configured and working!")
    print("\nℹ️  If responses are empty, try:")
    print("   1. Switch to a paid model (e.g., openrouter/anthropic/claude-sonnet)")
    print("   2. Check rate limits on your OpenRouter dashboard")
    print("   3. Try a different free model (e.g., google/gemini-2.0-flash-lite)")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

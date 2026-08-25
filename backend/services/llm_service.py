import os
import json
import httpx
from typing import List, Dict, Any, AsyncGenerator, Optional
from config import settings

class LLMService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=60.0)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """
        Non-streaming response generator with fallback resilience.
        """
        provider = provider or settings.DEFAULT_LLM_PROVIDER
        
        # 1. Try Gemini
        if provider == "gemini" or (not provider and settings.GEMINI_API_KEY):
            if settings.GEMINI_API_KEY:
                try:
                    return await self._call_gemini(messages, system_prompt, model or settings.GEMINI_MODEL, temperature)
                except Exception as e:
                    print(f"Gemini error: {e}. Trying fallbacks...")

        # 2. Try OpenAI
        if provider == "openai" or settings.OPENAI_API_KEY:
            if settings.OPENAI_API_KEY:
                try:
                    return await self._call_openai(messages, system_prompt, model or settings.OPENAI_MODEL, temperature)
                except Exception as e:
                    print(f"OpenAI error: {e}. Trying fallbacks...")

        # 3. Try Groq
        if provider == "groq" or settings.GROQ_API_KEY:
            if settings.GROQ_API_KEY:
                try:
                    return await self._call_groq(messages, system_prompt, model or settings.GROQ_MODEL, temperature)
                except Exception as e:
                    print(f"Groq error: {e}")

        # If no API key configured yet, return a helpful friendly response with setup guidance
        return (
            "Assalam-o-Alaikum! 🌸 Main hoon **Billa ai**.\n\n"
            "Mujhe baat cheet shuru karne ke liye aapki **Free Gemini API Key** ya **OpenAI Key** chahiye.\n\n"
            "👉 Please backend ke `.env` file mein `GEMINI_API_KEY=your_key_here` daal dein (Google AI Studio se 100% Free mil jati hai). Phir hum khoob saari baatein karenge! 😊"
        )

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        Streaming response generator yielding chunks in real-time.
        """
        provider = provider or settings.DEFAULT_LLM_PROVIDER

        if provider == "gemini" and settings.GEMINI_API_KEY:
            async for chunk in self._stream_gemini(messages, system_prompt, model or settings.GEMINI_MODEL, temperature):
                yield chunk
            return

        if (provider == "openai" or not settings.GEMINI_API_KEY) and settings.OPENAI_API_KEY:
            async for chunk in self._stream_openai(messages, system_prompt, model or settings.OPENAI_MODEL, temperature):
                yield chunk
            return

        if settings.GROQ_API_KEY:
            async for chunk in self._stream_groq(messages, system_prompt, model or settings.GROQ_MODEL, temperature):
                yield chunk
            return

        # Fallback simulated stream for setup reminder
        fallback = await self.generate_response(messages, system_prompt, provider, model, temperature)
        words = fallback.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")

    # ================= GOOGLE GEMINI =================
    async def _call_gemini(self, messages: List[Dict[str, str]], system_prompt: str, model_name: str, temperature: float) -> str:
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": m["content"]}]
            })

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
            }
        }

        # Normalize model candidates
        candidate_models = ["models/gemini-3.1-flash-lite", "models/gemini-3.7-flash", "models/gemini-3.5-flash"]
        if model_name:
            clean = model_name if model_name.startswith("models/") else f"models/{model_name}"
            if clean not in candidate_models:
                candidate_models.insert(0, clean)

        last_error = None
        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{m}:generateContent?key={settings.GEMINI_API_KEY}"
            try:
                response = await self.http_client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
            except Exception as e:
                last_error = e
                continue

        return "Mujhe samajh nahi aya, kya aap dobara bata sakti hain? 🤔"

    async def _stream_gemini(self, messages: List[Dict[str, str]], system_prompt: str, model_name: str, temperature: float) -> AsyncGenerator[str, None]:
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": m["content"]}]
            })

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 2048,
            }
        }

        candidate_models = ["models/gemini-3.1-flash-lite", "models/gemini-3.7-flash", "models/gemini-3.5-flash"]
        if model_name:
            clean = model_name if model_name.startswith("models/") else f"models/{model_name}"
            if clean not in candidate_models:
                candidate_models.insert(0, clean)

        streamed_any = False
        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{m}:streamGenerateContent?key={settings.GEMINI_API_KEY}&alt=sse"
            try:
                async with self.http_client.stream("POST", url, json=payload, headers={"Content-Type": "application/json"}) as resp:
                    if resp.status_code != 200:
                        continue
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            json_str = line[6:].strip()
                            if json_str:
                                try:
                                    chunk_data = json.loads(json_str)
                                    candidates = chunk_data.get("candidates", [])
                                    if candidates and "content" in candidates[0]:
                                        parts = candidates[0]["content"].get("parts", [])
                                        for p in parts:
                                            if "text" in p:
                                                streamed_any = True
                                                yield p["text"]
                                except Exception:
                                    continue
                if streamed_any:
                    return
            except Exception:
                continue

        # If SSE fails on all models, fallback to standard generateContent and stream word by word
        if not streamed_any:
            fallback_text = await self._call_gemini(messages, system_prompt, model_name, temperature)
            words = fallback_text.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.02)

    # ================= OPENAI (CHATGPT) =================
    async def _call_openai(self, messages: List[Dict[str, str]], system_prompt: str, model_name: str, temperature: float) -> str:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages
        payload = {
            "model": model_name or "gpt-4o-mini",
            "messages": formatted_messages,
            "temperature": temperature
        }
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        response = await self.http_client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def _stream_openai(self, messages: List[Dict[str, str]], system_prompt: str, model_name: str, temperature: float) -> AsyncGenerator[str, None]:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages
        payload = {
            "model": model_name or "gpt-4o-mini",
            "messages": formatted_messages,
            "temperature": temperature,
            "stream": True
        }
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        async with self.http_client.stream("POST", "https://api.openai.com/v1/chat/completions", json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_str)
                        delta = chunk_json["choices"][0].get("delta", {})
                        if "content" in delta and delta["content"]:
                            yield delta["content"]
                    except Exception:
                        continue

    # ================= GROQ =================
    async def _call_groq(self, messages: List[Dict[str, str]], system_prompt: str, model_name: str, temperature: float) -> str:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages
        chosen_model = model_name or settings.GROQ_MODEL or "openai/gpt-oss-120b"
        payload = {
            "model": chosen_model,
            "messages": formatted_messages,
            "temperature": temperature
        }
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        response = await self.http_client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def _stream_groq(self, messages: List[Dict[str, str]], system_prompt: str, model_name: str, temperature: float) -> AsyncGenerator[str, None]:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages
        chosen_model = model_name or settings.GROQ_MODEL or "openai/gpt-oss-120b"
        payload = {
            "model": chosen_model,
            "messages": formatted_messages,
            "temperature": temperature,
            "stream": True
        }
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        async with self.http_client.stream("POST", "https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_str)
                        delta = chunk_json["choices"][0].get("delta", {})
                        if "content" in delta and delta["content"]:
                            yield delta["content"]
                    except Exception:
                        continue

llm_service = LLMService()

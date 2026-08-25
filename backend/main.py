import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import settings
from database import db
from routers import auth, chat, conversations, memories, profile, tuning

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB connection on startup
    await db.connect()
    print(f"🚀 {settings.PROJECT_NAME} Backend is running on http://{settings.HOST}:{settings.PORT}")
    yield
    print("👋 Shutting down backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personal AI Assistant & Companion ('Billa ai') Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(memories.router)
app.include_router(profile.router)
app.include_router(tuning.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "mode": "MongoDB" if db.is_mongo else "Local Persistent JSON",
        "default_llm": settings.DEFAULT_LLM_PROVIDER
    }

# Serve compiled React frontend if available (e.g. for Render single-service deployment)
dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_path, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    async def root_fallback():
        return {
            "status": "online",
            "app": settings.PROJECT_NAME,
            "mode": "MongoDB" if db.is_mongo else "Local Persistent JSON",
            "default_llm": settings.DEFAULT_LLM_PROVIDER
        }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )

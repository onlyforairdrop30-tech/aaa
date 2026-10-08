import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables
from routes import auth, register, password, search, admin

app = FastAPI(
    title="Private College Search Engine",
    description="A private search engine for college students",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(register.router)
app.include_router(password.router)
app.include_router(search.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup():
    create_tables()
    print("[+] College Search Engine API started successfully!")
    print("[+] API Docs: http://localhost:8000/docs")


@app.get("/")
def root():
    return {
        "name": "Private College Search Engine API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
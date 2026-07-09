from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router

app = FastAPI(title="AI Meeting Analyzer")

# Allow frontend to connect (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow all origins (fine for college project)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our single route
app.include_router(router)

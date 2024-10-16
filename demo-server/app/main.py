from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import spaces, boards, cards, users, common


API_BASE_PATH = "/api/latest"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(boards.router, prefix=API_BASE_PATH)
app.include_router(spaces.router, prefix=API_BASE_PATH)
app.include_router(cards.router, prefix=API_BASE_PATH)
app.include_router(users.router, prefix=API_BASE_PATH)
app.include_router(common.router, prefix=API_BASE_PATH)
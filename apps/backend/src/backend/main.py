from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shared.utils import get_version


app = FastAPI(title="Backend API", version=get_version())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str


@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(
        status="healthy",
        version=get_version(),
        service="backend"
    )


@app.get("/api/hello")
async def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}
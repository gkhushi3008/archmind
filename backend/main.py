from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_service import analyze_with_ai
from database import (
    create_tables,
    save_analysis,
    save_tasks,
    save_decisions,
    get_analyses,
    search_analyses,
    get_tasks,
    get_decisions,
)


app = FastAPI(
    title="ArchMind API",
    version="0.1.0"
)


create_tables()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.101:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConversationRequest(BaseModel):
    conversation: str


@app.get("/")
def home():
    return {
        "message": "ArchMind backend is running"
    }


@app.post("/analyze")
def analyze_conversation(data: ConversationRequest):
    result = analyze_with_ai(data.conversation)

    analysis_id = save_analysis(
        data.conversation,
        result["summary"]
    )

    save_tasks(
        analysis_id,
        result["tasks"]
    )

    save_decisions(
        analysis_id,
        result["decisions"]
    )

    return result


@app.get("/history")
def history():
    return get_analyses()


@app.get("/search")
def search(query: str):
    return search_analyses(query)


@app.get("/tasks")
def tasks():
    return get_tasks()


@app.get("/decisions")
def decisions():
    return get_decisions()
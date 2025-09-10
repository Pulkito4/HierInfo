from fastapi import FastAPI
from app.api import news

app = FastAPI(title="News Analyzer NLP Service")

app.include_router(news.router, prefix="/news")

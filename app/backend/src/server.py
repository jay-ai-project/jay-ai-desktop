import json
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse

from src.agent import agent
from src.schemas import ChatRequest


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):

    async def stream_generator():
        """Generator function that yields events for the SSE stream."""
        try:
            # The input to the graph is a list of messages
            input_content = [{"text": request.prompt}]
            stream: AsyncIterator[dict] = agent.stream_async(prompt=[{"role": "user", "content": input_content}])

            async for event in stream:
                if event.get("data"):
                    chunk = {
                        "type": "message",
                        "data": event["data"]
                    }
                    yield json.dumps(chunk) + "\n"
            yield json.dumps({"type": "end", "data": "Stream ended"}) + "\n"

        except Exception as e:
            print(f"Error during stream: {e}")
            yield json.dumps({"type": "error", "data": str(e)}) + "\n"

    return StreamingResponse(stream_generator(), media_type="application/x-ndjson")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

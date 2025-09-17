import asyncio

from strands import Agent
from strands.models.ollama import OllamaModel
from strands.agent.conversation_manager import NullConversationManager


ollama_model = OllamaModel(
    host="http://localhost:11434",
    model_id="gpt-oss:20b"
)

agent = Agent(
    system_prompt=("당신은 Jay 라는 이름의 AI 비서 입니다."),
    model=ollama_model,
    callback_handler=None,
    conversation_manager=NullConversationManager(),
)


import asyncio

from strands import Agent, tool
from strands.models.ollama import OllamaModel
from strands_tools import calculator, current_time
from strands.agent.conversation_manager import NullConversationManager


# Define a custom tool as a Python function using the @tool decorator
@tool
def letter_counter(word: str, letter: str) -> int:
    """
    Count occurrences of a specific letter in a word.

    Args:
        word (str): The input word to search in
        letter (str): The specific letter to count

    Returns:
        int: The number of occurrences of the letter in the word
    """
    if not isinstance(word, str) or not isinstance(letter, str):
        return 0

    if len(letter) != 1:
        raise ValueError("The 'letter' parameter must be a single character")

    return word.lower().count(letter.lower())


# Create an agent with tools from the community-driven strands-tools package
# as well as our custom letter_counter tool
ollama_model = OllamaModel(
    host="http://localhost:11434",
    model_id="gpt-oss:20b",
    options={"think": True, "reasoning": True, "thinking": True}
)

agent = Agent(
    system_prompt=(
        "당신은 Jay 라는 이름의 AI 비서 입니다."
    ),
    model=ollama_model,
    tools=[calculator, current_time, letter_counter],
    callback_handler=None,
    conversation_manager=NullConversationManager(),
)


async def run():
    prompt = "안녕 내 이름은 범준이야."
    stream = agent.stream_async(prompt=[
        {"role": "user", "content": [{"text": prompt}]}
    ])
    async for event in stream:
        if "data" in event:
            print(event)
    print(agent.messages)
    print('-----------------')

    prompt = "내 이름이 뭐라고?"
    stream = agent.stream_async(prompt=[
        {"role": "user", "content": [{"text": prompt}]}
    ])
    async for event in stream:
        if "data" in event:
            print(event["data"])
    print(agent.messages)


asyncio.run(run())

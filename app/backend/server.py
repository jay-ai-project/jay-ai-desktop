import asyncio
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_ollama.chat_models import ChatOllama
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
import operator

# --- FastAPI App Setup ---
app = FastAPI()

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- LangGraph Implementation ---

# Define the state for our graph
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]

# Set up the ChatOllama model
model = ChatOllama(
    base_url="http://localhost:11434",
    model="gpt-oss:20b",
)

# Define the nodes
def call_model(state: AgentState):
    """Calls the LLM.

    Args:
        state (AgentState): The current graph state

    Returns:
        dict: The new state with the LLM response appended to messages
    """
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

# Define the graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.set_entry_point("agent")
workflow.add_edge("agent", END)

langgraph_app = workflow.compile()

# --- API Endpoint ---

@app.get("/chat/stream")
async def chat_stream(request: Request, prompt: str):

    async def event_generator():
        """Generator function that yields events for the SSE stream."""
        try:
            # The input to the graph is a list of messages
            inputs = {"messages": [HumanMessage(content=prompt)]}

            # Stream the graph output
            async for step in langgraph_app.astream(inputs, stream_mode="messages", subgraphs=True):
                print(step)
                node_name = list(step.keys())[0]
                if node_name != "__end__":
                    # Send metadata about the current node
                    yield {
                        "event": "metadata",
                        "data": json.dumps({"langgraph_trace": {"node": node_name}})
                    }

                # Check for new AI message content
                ai_message = step.get(node_name, {}).get("messages", [])[-1]
                if isinstance(ai_message, AIMessage):
                    yield {
                        "event": "content",
                        "data": ai_message.content
                    }
                    # Send reasoning/metadata if available
                    if ai_message.response_metadata:
                         yield {
                            "event": "metadata",
                            "data": json.dumps({"reasoning": ai_message.response_metadata})
                        }

            yield {"event": "end", "data": "Stream ended"}

        except Exception as e:
            print(f"Error during stream: {e}")
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())

# To run this server for testing: uvicorn backend.server:app --reload

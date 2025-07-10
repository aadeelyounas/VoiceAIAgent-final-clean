import os
import asyncio
import uuid
import traceback
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
from dotenv import load_dotenv
from voiceaiagent.helpers.utils import store_file
from voiceaiagent.prompts import *
from voiceaiagent.helpers.logger_config import configure_logger
from voiceaiagent.models import *
from voiceaiagent.llms import LiteLLM
from voiceaiagent.agent_manager.assistant_manager import AssistantManager

# Get the agent data directory from environment variable, defaulting to local agent_data
AGENT_DATA_DIR = os.getenv('AGENT_DATA_DIR', 'agent_data')

load_dotenv()
logger = configure_logger(__name__)

redis_pool = redis.ConnectionPool.from_url(os.getenv('REDIS_URL'), decode_responses=True)
redis_client = redis.Redis.from_pool(redis_pool)
active_websockets: List[WebSocket] = []

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class CreateAgentPayload(BaseModel):
    agent_config: AgentModel
    agent_prompts: Optional[Dict[str, Dict[str, str]]]


@app.get("/agent/{agent_id}")
async def get_agent(agent_id: str):
    """Fetches an agent's information by ID."""
    try:
        agent_data = await redis_client.get(agent_id)
        if not agent_data:
            raise HTTPException(status_code=404, detail="Agent not found")

        return json.loads(agent_data)

    except Exception as e:
        logger.error(f"Error fetching agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/agent/{agent_id}/prompts")
async def get_agent_prompts(agent_id: str):
    """Fetches an agent's conversation details/prompts by ID."""
    try:
        stored_prompt_file_path = f"{agent_id}/conversation_details.json"
        # Read the file from the Docker volume
        full_path = os.path.join(AGENT_DATA_DIR, stored_prompt_file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Agent prompts not found")
        
        with open(full_path, 'r') as f:
            prompt_data = json.load(f)
        
        return prompt_data

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Agent prompts not found")
    except Exception as e:
        logger.error(f"Error fetching agent prompts {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")



@app.post("/agent")
async def create_agent(agent_data: CreateAgentPayload):
    agent_uuid = str(uuid.uuid4())
    data_for_db = agent_data.agent_config.model_dump()
    data_for_db["assistant_status"] = "seeding"
    agent_prompts = agent_data.agent_prompts
    logger.info(f'Data for DB {data_for_db}')

    if len(data_for_db['tasks']) > 0:
        logger.info("Setting up follow up tasks")
        for index, task in enumerate(data_for_db['tasks']):
            if task['task_type'] == "extraction":
                extraction_prompt_llm = os.getenv("EXTRACTION_PROMPT_GENERATION_MODEL")
                extraction_prompt_generation_llm = LiteLLM(model=extraction_prompt_llm, max_tokens=2000)
                extraction_prompt = await extraction_prompt_generation_llm.generate(
                    messages=[
                        {'role': 'system', 'content': EXTRACTION_PROMPT_GENERATION_PROMPT},
                        {'role': 'user', 'content': data_for_db["tasks"][index]['tools_config']["llm_agent"]['extraction_details']}
                    ])
                data_for_db["tasks"][index]["tools_config"]["llm_agent"]['extraction_json'] = extraction_prompt

    stored_prompt_file_path = f"{agent_uuid}/conversation_details.json"
    await asyncio.gather(
        redis_client.set(agent_uuid, json.dumps(data_for_db)),
        store_file(file_key=stored_prompt_file_path, file_data=agent_prompts, local=True, preprocess_dir=AGENT_DATA_DIR)
    )

    return {"agent_id": agent_uuid, "state": "created"}


@app.put("/agent/{agent_id}")
async def edit_agent(agent_id: str, agent_data: CreateAgentPayload = Body(...)):
    """Edits an existing agent based on the provided agent_id."""
    try:

        existing_data = await redis_client.get(agent_id)
        if not existing_data:
            raise HTTPException(status_code=404, detail="Agent not found")

        existing_data = json.loads(existing_data)


        new_data = agent_data.agent_config.model_dump()
        new_data["assistant_status"] = "updated"
        agent_prompts = agent_data.agent_prompts

        logger.info(f"Updating Agent {agent_id}: {new_data}")


        for index, task in enumerate(new_data.get("tasks", [])):
            if task.get("task_type") == "extraction":
                extraction_prompt_llm = os.getenv("EXTRACTION_PROMPT_GENERATION_MODEL")
                if not extraction_prompt_llm:
                    raise HTTPException(status_code=500, detail="Extraction model not configured")

                extraction_prompt_generation_llm = LiteLLM(model=extraction_prompt_llm, max_tokens=2000)
                extraction_details = task["tools_config"]["llm_agent"].get("extraction_details", "")

                extraction_prompt = await extraction_prompt_generation_llm.generate(
                    messages=[
                        {"role": "system", "content": EXTRACTION_PROMPT_GENERATION_PROMPT},
                        {"role": "user", "content": extraction_details}
                    ]
                )

                new_data["tasks"][index]["tools_config"]["llm_agent"]["extraction_json"] = extraction_prompt


        stored_prompt_file_path = f"{agent_id}/conversation_details.json"
        await asyncio.gather(
            redis_client.set(agent_id, json.dumps(new_data)),
            store_file(file_key=stored_prompt_file_path, file_data=agent_prompts, local=True, preprocess_dir=AGENT_DATA_DIR)
        )

        return {"agent_id": agent_id, "state": "updated"}

    except Exception as e:
        logger.error(f"Error updating agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/agent/{agent_id}")
async def delete_agent(agent_id: str):
    """Deletes an agent by ID."""
    try:
        # Check if agent exists in Redis
        agent_exists_in_redis = await redis_client.exists(agent_id)
        
        # Check if agent data exists in the file system
        stored_prompt_file_path = f"{agent_id}/conversation_details.json"
        full_path = os.path.join(AGENT_DATA_DIR, stored_prompt_file_path)
        agent_exists_in_files = os.path.exists(full_path)
        
        # If agent doesn't exist in either place, return 404
        if not agent_exists_in_redis and not agent_exists_in_files:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Delete from Redis if it exists there
        if agent_exists_in_redis:
            await redis_client.delete(agent_id)
            logger.info(f"Deleted agent {agent_id} from Redis")
        
        # Delete files if they exist
        if agent_exists_in_files:
            try:
                os.remove(full_path)
                logger.info(f"Deleted conversation details file: {full_path}")
                
                # Try to remove the agent directory if it's empty
                agent_dir = os.path.join(AGENT_DATA_DIR, agent_id)
                try:
                    os.rmdir(agent_dir)
                    logger.info(f"Deleted empty agent directory: {agent_dir}")
                except OSError:
                    # Directory not empty or doesn't exist, that's okay
                    pass
            except Exception as file_error:
                logger.warning(f"Could not delete conversation details file for agent {agent_id}: {file_error}")
                # Don't fail the entire delete operation if file deletion fails
        
        return {"agent_id": agent_id, "state": "deleted"}

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error deleting agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/all")
async def get_all_agents():
    """Fetches all agents stored in Redis."""
    try:

        agent_keys = await redis_client.keys("*")  
        
        if not agent_keys:
            return {"agents": []}  
        agents_data = []
        for key in agent_keys:
            try:
                data = await redis_client.get(key)
                agents_data.append(data)
            except Exception as e:
                logger.error(f"An error occurred with key {key}: {e}")


        agents = [{ "agent_id": key, "data": json.loads(data) } for key, data in zip(agent_keys, agents_data) if data]

        return {"agents": agents}

    except Exception as e:
        logger.error(f"Error fetching all agents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


############################################################################################# 
# Websocket 
#############################################################################################
@app.websocket("/chat/v1/{agent_id}")
async def websocket_endpoint(agent_id: str, websocket: WebSocket, user_agent: str = Query(None)):
    logger.info("Connected to ws")
    await websocket.accept()
    active_websockets.append(websocket)
    agent_config, context_data = None, None
    try:
        retrieved_agent_config = await redis_client.get(agent_id)
        logger.info(
            f"Retrieved agent config: {retrieved_agent_config}")
        agent_config = json.loads(retrieved_agent_config)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail="Agent not found")

    assistant_manager = AssistantManager(agent_config, websocket, agent_id)

    try:
        async for index, task_output in assistant_manager.run(local=True):
            logger.info(task_output)
    except WebSocketDisconnect:
        active_websockets.remove(websocket)
    except Exception as e:
        traceback.print_exc()
        logger.error(f"error in executing {e}")


@app.post("/cleanup/orphaned-agents")
async def cleanup_orphaned_agents():
    """Removes agent data files that exist in the volume but not in Redis."""
    try:
        cleanup_results = {
            "deleted_directories": [],
            "deleted_files": [],
            "errors": []
        }
        
        # Get all agent IDs from Redis
        redis_agent_keys = await redis_client.keys("*")
        redis_agent_ids = set(redis_agent_keys)
        
        # Get all directories in the agent data volume
        if os.path.exists(AGENT_DATA_DIR):
            volume_agent_dirs = [d for d in os.listdir(AGENT_DATA_DIR) 
                               if os.path.isdir(os.path.join(AGENT_DATA_DIR, d))]
            
            for agent_dir in volume_agent_dirs:
                # If the agent directory exists in volume but not in Redis, it's orphaned
                if agent_dir not in redis_agent_ids:
                    agent_dir_path = os.path.join(AGENT_DATA_DIR, agent_dir)
                    try:
                        # Remove all files in the directory
                        for file_name in os.listdir(agent_dir_path):
                            file_path = os.path.join(agent_dir_path, file_name)
                            if os.path.isfile(file_path):
                                os.remove(file_path)
                                cleanup_results["deleted_files"].append(file_path)
                        
                        # Remove the directory
                        os.rmdir(agent_dir_path)
                        cleanup_results["deleted_directories"].append(agent_dir_path)
                        logger.info(f"Cleaned up orphaned agent directory: {agent_dir_path}")
                        
                    except Exception as e:
                        error_msg = f"Error cleaning up {agent_dir}: {str(e)}"
                        cleanup_results["errors"].append(error_msg)
                        logger.error(error_msg)
        
        return {
            "message": "Orphaned agent cleanup completed",
            "results": cleanup_results
        }
        
    except Exception as e:
        logger.error(f"Error during orphaned agent cleanup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

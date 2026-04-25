"""Voice catalog endpoint.

GET /api/voices — Return list of predefined speakers with metadata.
"""

from fastapi import APIRouter

from workers.engine.model_manager import SPEAKERS

router = APIRouter(tags=["voices"])


@router.get("/voices")
async def list_voices() -> dict:
    """Return the catalog of predefined TTS speakers.

    Returns 9 predefined speakers with id, name, language, gender,
    and description for frontend display.
    """
    return {"speakers": SPEAKERS, "total": len(SPEAKERS)}

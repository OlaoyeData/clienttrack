"""
Calls the Anthropic API to turn a project brief into a week-by-week task
breakdown. Falls back to a deterministic template if no API key is set or
the call fails, so project creation never hard-fails on an LLM outage.
"""
import json
import logging
from urllib import response

from google import genai
from google.genai.errors import APIError

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: genai.Client | None = None


def _get_client() -> genai.Client | None:
    global _client
    if not settings.gemini_api_key:
        return None
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


SYSTEM_PROMPT = """You are a project-planning assistant for a freelance developer/designer.
Given a client project brief, break the work into weekly milestones.

Respond ONLY with valid JSON (no markdown fences, no commentary) in this exact shape:
{
  "weeks": [
    {
      "week_number": 1,
      "tasks": [
        {"title": "short task title", "description": "one sentence of detail"}
      ]
    }
  ]
}

Rules:
- Produce exactly one entry per week from 1 to the given duration_weeks.
- Each week should have 2-5 concrete, sequential tasks appropriate to the project type.
- Early weeks: discovery, design, structure. Middle weeks: build-out. Final week(s): testing,
  revisions, handoff/delivery.
- If num_pages is given, distribute page-building work across weeks realistically.
- Keep titles under 8 words. Keep descriptions under 20 words.
- Never include extra keys, comments, or trailing text outside the JSON object.
"""


def _fallback_breakdown(duration_weeks: int, project_type: str) -> dict:
    """Simple deterministic plan used if the LLM is unavailable."""
    weeks = []
    for w in range(1, duration_weeks + 1):
        if w == 1:
            tasks = [
                {"title": "Kickoff & requirements review", "description": "Confirm scope, gather assets and brand materials."},
                {"title": "Wireframes / structure draft", "description": f"Draft the initial structure for the {project_type.replace('_', ' ')}."},
            ]
        elif w == duration_weeks:
            tasks = [
                {"title": "Final QA & revisions", "description": "Test across devices and apply client feedback."},
                {"title": "Delivery & handoff", "description": "Deploy and hand over all files/access."},
            ]
        else:
            tasks = [
                {"title": f"Build-out — phase {w - 1}", "description": "Continue implementation based on the approved design."},
                {"title": "Client check-in", "description": "Share progress and collect feedback."},
            ]
        weeks.append({"week_number": w, "tasks": tasks})
    return {"weeks": weeks}


def generate_task_breakdown(
    title: str,
    project_type: str,
    description: str,
    num_pages: int | None,
    duration_weeks: int,
    duration_days: int,
) -> dict:
    client = _get_client()
    if client is None:
        return _fallback_breakdown(duration_weeks, project_type)

    user_prompt = json.dumps({
        "title": title,
        "project_type": project_type,
        "description": description,
        "num_pages": num_pages,
        "duration_weeks": duration_weeks,
        "duration_days": duration_days,
    })

    try:
        response = client.models.generate_content(
            model=settings.llm_model,
            contents=user_prompt,
            config={
                "system_instruction": SYSTEM_PROMPT,
                "response_mime_type": "application/json",
            },
        )
        raw_text = (response.text or "").strip()
         # Guard against accidental markdown fences even though we asked for none.
        raw_text = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(raw_text)
        if "weeks" not in parsed or not isinstance(parsed["weeks"], list):
            raise ValueError("Malformed LLM response: missing 'weeks' list")
        return parsed
    except (APIError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("LLM task breakdown failed, using fallback plan: %s", exc)
        return _fallback_breakdown(duration_weeks, project_type)

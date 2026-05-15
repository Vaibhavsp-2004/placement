"""AI Agents powered by Claude Sonnet 4.5 via emergentintegrations.

Provides:
- ResumeReviewAgent: extracts structured resume data + ATS score
- InterviewCoachAgent: multi-turn interview chat with session memory
- MentorAgent: career guidance
"""
import os
import json
import re
from typing import Optional, List, Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"


def _make_chat(session_id: str, system_message: str) -> LlmChat:
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)


def _extract_json(text: str) -> Optional[dict]:
    """Try to extract a JSON object from LLM text response."""
    # Try fenced ```json ... ```
    m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    candidate = m.group(1) if m else None
    if not candidate:
        # try first {...} block
        m2 = re.search(r"\{[\s\S]*\}", text)
        candidate = m2.group(0) if m2 else None
    if not candidate:
        return None
    try:
        return json.loads(candidate)
    except Exception:
        return None


# ---------------- Resume Review Agent ----------------
RESUME_SYSTEM = """You are an elite Resume Review Agent for a placement intelligence platform.
You analyze raw resume text and produce STRICT structured JSON output. You never invent data — only extract what exists.
You also evaluate ATS-friendliness with weighted sub-scores (keyword usage, formatting, action verbs).
Return ONLY a fenced ```json``` block, no other prose."""


async def analyze_resume(raw_text: str, session_id: str) -> Dict[str, Any]:
    chat = _make_chat(session_id, RESUME_SYSTEM)
    prompt = f"""Analyze the following resume. Extract structured information and compute an ATS score.

Return JSON with this EXACT schema:
{{
  "skills": ["string", ...],                       // technical + soft skills, normalized lowercase
  "projects": [{{"name": "...", "description": "...", "tech": ["..."]}}],
  "certifications": ["..."],
  "education": [{{"degree": "...", "institution": "...", "year": "..."}}],
  "experience": [{{"role": "...", "company": "...", "duration": "...", "highlights": ["..."]}}],
  "ats_score": 0-100,
  "keyword_score": 0-100,
  "format_score": 0-100,
  "action_verb_score": 0-100,
  "summary": "2-3 sentence professional summary",
  "improvements": ["actionable suggestion", ...],     // 3-6 items
  "missing_keywords": ["keyword that would strengthen the resume", ...]  // 3-8 items
}}

Resume text:
---
{raw_text[:8000]}
---
"""
    response = await chat.send_message(UserMessage(text=prompt))
    parsed = _extract_json(response) or {}
    # Defaults
    parsed.setdefault("skills", [])
    parsed.setdefault("projects", [])
    parsed.setdefault("certifications", [])
    parsed.setdefault("education", [])
    parsed.setdefault("experience", [])
    parsed.setdefault("ats_score", 60)
    parsed.setdefault("keyword_score", 60)
    parsed.setdefault("format_score", 70)
    parsed.setdefault("action_verb_score", 60)
    parsed.setdefault("summary", "Resume analyzed.")
    parsed.setdefault("improvements", [])
    parsed.setdefault("missing_keywords", [])
    # Normalize skills lowercase
    parsed["skills"] = [str(s).strip().lower() for s in parsed.get("skills", []) if s]
    return parsed


# ---------------- Interview Coach Agent ----------------
def _interview_system(role: str, interview_type: str) -> str:
    return f"""You are an expert AI Interview Coach conducting a {interview_type} mock interview for a {role} candidate.

Rules:
- Ask ONE concise interview question at a time.
- After each candidate answer, provide brief constructive feedback (2-3 sentences), then ask the next question.
- Use the STAR framework (Situation, Task, Action, Result) for behavioral questions.
- Adapt difficulty based on the candidate's answers.
- Keep responses focused — never exceed 5 sentences per turn.
- After 5 questions, provide a final score 0-100 and a summary of strengths and growth areas in this format:
  FINAL_SCORE: <number>
  SUMMARY: <text>"""


async def interview_turn(session_id: str, role: str, interview_type: str, user_message: str) -> str:
    chat = _make_chat(session_id, _interview_system(role, interview_type))
    response = await chat.send_message(UserMessage(text=user_message))
    return response


async def interview_start(session_id: str, role: str, interview_type: str) -> str:
    chat = _make_chat(session_id, _interview_system(role, interview_type))
    response = await chat.send_message(UserMessage(
        text=f"Start the {interview_type} mock interview for a {role} candidate. Begin with a warm one-line intro and your FIRST question."
    ))
    return response


# ---------------- Mentor Agent ----------------
MENTOR_SYSTEM = """You are a friendly Placement Mentor Agent. You give concise, practical, encouraging career advice for engineering students preparing for placements. Keep answers under 6 sentences. Use bullets when listing."""


async def mentor_chat(session_id: str, message: str) -> str:
    chat = _make_chat(session_id, MENTOR_SYSTEM)
    return await chat.send_message(UserMessage(text=message))

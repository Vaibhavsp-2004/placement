"""Pydantic models for the Placement Intelligence Platform."""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------- Auth ----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = Field(description="student | coordinator | recruiter")
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    company: Optional[str] = None  # for recruiters


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    company: Optional[str] = None
    created_at: str


class TokenResponse(BaseModel):
    token: str
    user: UserPublic


# ---------------- Resume ----------------
class ResumeIn(BaseModel):
    raw_text: str
    file_name: Optional[str] = None


class ResumeAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    file_name: Optional[str] = None
    raw_text: str
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    education: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    ats_score: int = 0
    keyword_score: int = 0
    format_score: int = 0
    action_verb_score: int = 0
    summary: str = ""
    improvements: List[str] = []
    missing_keywords: List[str] = []
    created_at: str


# ---------------- Company / Job ----------------
class JobIn(BaseModel):
    title: str
    company_name: str
    location: str = "Remote"
    description: str
    required_skills: List[str] = []
    min_cgpa: float = 6.0
    ctc_min: float = 5.0
    ctc_max: float = 15.0
    role_type: str = "Full-time"


class Job(JobIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    posted_by: str
    posted_at: str
    status: str = "open"


# ---------------- Prediction ----------------
class PredictionResult(BaseModel):
    placement_probability: float
    expected_ctc_min: float
    expected_ctc_max: float
    confidence: str
    feature_contributions: List[Dict[str, Any]]
    insights: List[str]
    risk_level: str  # low | medium | high


# ---------------- Match ----------------
class MatchResult(BaseModel):
    job_id: str
    job_title: str
    company_name: str
    fit_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    location: str
    ctc_range: str


# ---------------- Interview ----------------
class InterviewStart(BaseModel):
    role: str = "Software Engineer"
    interview_type: str = "technical"  # technical | behavioral | mixed


class InterviewMessage(BaseModel):
    session_id: str
    message: str


class InterviewSessionPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    role: str
    interview_type: str
    messages: List[Dict[str, Any]] = []
    score: Optional[float] = None
    feedback: Optional[str] = None
    created_at: str


# ---------------- Shortlist (recruiter) ----------------
class ShortlistRequest(BaseModel):
    job_id: str


class CandidateShortlist(BaseModel):
    user_id: str
    name: str
    email: str
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    fit_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    ats_score: int

"""AI-Driven Placement Intelligence Ecosystem — FastAPI backend."""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from models import (
    UserRegister, UserLogin, UserPublic, TokenResponse,
    ResumeIn, ResumeAnalysis, JobIn, Job,
    PredictionResult, MatchResult,
    InterviewStart, InterviewMessage, InterviewSessionPublic,
    ShortlistRequest, CandidateShortlist,
    _uid, _now,
)
from auth import hash_password, verify_password, create_token, get_current_user, require_role
from ai_agents import analyze_resume, interview_start, interview_turn, mentor_chat
from seed import seed_demo

# ---------- Mongo ----------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------- App ----------
app = FastAPI(title="Placement Intelligence Ecosystem")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("placement")


# ---------- Helpers ----------
def _user_to_public(u: dict) -> UserPublic:
    return UserPublic(**{k: u.get(k) for k in ["id", "email", "name", "role", "branch", "cgpa", "company", "created_at"]})


# ---------- Health ----------
@api.get("/")
async def root():
    return {"message": "Placement Intelligence API", "status": "ok"}


# ---------- Auth ----------
@api.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    if payload.role not in {"student", "coordinator", "recruiter"}:
        raise HTTPException(400, "Invalid role")
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = _uid()
    doc = {
        "id": uid,
        "email": payload.email.lower(),
        "name": payload.name,
        "role": payload.role,
        "branch": payload.branch,
        "cgpa": payload.cgpa,
        "company": payload.company,
        "password_hash": hash_password(payload.password),
        "created_at": _now(),
    }
    await db.users.insert_one(doc)
    token = create_token(uid, payload.role)
    return TokenResponse(token=token, user=_user_to_public(doc))


@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["role"])
    return TokenResponse(token=token, user=_user_to_public(user))


@api.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return _user_to_public(user)


# ---------- Resume ----------
async def _extract_pdf_text(file: UploadFile) -> str:
    data = await file.read()
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as e:
        logger.warning(f"PDF parse failed, using raw text: {e}")
        try:
            return data.decode("utf-8", errors="ignore")
        except Exception:
            return ""


@api.post("/resume/upload", response_model=ResumeAnalysis)
async def upload_resume(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    raw_text = await _extract_pdf_text(file)
    if len(raw_text.strip()) < 30:
        raise HTTPException(400, "Could not extract text from file. Please paste resume text instead.")
    return await _process_resume(user["id"], raw_text, file.filename)


@api.post("/resume/analyze", response_model=ResumeAnalysis)
async def analyze_resume_text(payload: ResumeIn, user: dict = Depends(get_current_user)):
    if len(payload.raw_text.strip()) < 30:
        raise HTTPException(400, "Resume text too short")
    return await _process_resume(user["id"], payload.raw_text, payload.file_name)


async def _process_resume(user_id: str, raw_text: str, file_name: Optional[str]) -> ResumeAnalysis:
    session_id = f"resume-{user_id}-{_uid()[:8]}"
    parsed = await analyze_resume(raw_text, session_id)
    rid = _uid()
    doc = {
        "id": rid,
        "user_id": user_id,
        "file_name": file_name,
        "raw_text": raw_text[:20000],
        "skills": parsed["skills"],
        "projects": parsed["projects"],
        "certifications": parsed["certifications"],
        "education": parsed["education"],
        "experience": parsed["experience"],
        "ats_score": int(parsed["ats_score"]),
        "keyword_score": int(parsed["keyword_score"]),
        "format_score": int(parsed["format_score"]),
        "action_verb_score": int(parsed["action_verb_score"]),
        "summary": parsed["summary"],
        "improvements": parsed["improvements"],
        "missing_keywords": parsed["missing_keywords"],
        "created_at": _now(),
    }
    # Replace previous resume for user (one active)
    await db.resumes.delete_many({"user_id": user_id})
    await db.resumes.insert_one(doc)
    return ResumeAnalysis(**doc)


@api.get("/resume/me", response_model=Optional[ResumeAnalysis])
async def get_my_resume(user: dict = Depends(get_current_user)):
    doc = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    return doc


# ---------- Jobs / Companies ----------
@api.post("/jobs", response_model=Job)
async def create_job(payload: JobIn, user: dict = Depends(require_role("recruiter", "coordinator"))):
    doc = {
        "id": _uid(),
        "posted_by": user["id"],
        "posted_at": _now(),
        "status": "open",
        **payload.model_dump(),
    }
    # normalize skills lowercase
    doc["required_skills"] = [s.strip().lower() for s in doc["required_skills"]]
    await db.jobs.insert_one(doc)
    return Job(**doc)


@api.get("/jobs", response_model=List[Job])
async def list_jobs():
    items = await db.jobs.find({}, {"_id": 0}).sort("posted_at", -1).to_list(200)
    return items


@api.get("/jobs/mine", response_model=List[Job])
async def list_my_jobs(user: dict = Depends(require_role("recruiter"))):
    items = await db.jobs.find({"posted_by": user["id"]}, {"_id": 0}).sort("posted_at", -1).to_list(200)
    return items


@api.delete("/jobs/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(require_role("recruiter", "coordinator"))):
    res = await db.jobs.delete_one({"id": job_id, "posted_by": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Job not found")
    return {"ok": True}


# ---------- Matching ----------
def _fit_score(student_skills: list, job_skills: list, cgpa: Optional[float], min_cgpa: float) -> dict:
    s_set = {s.lower() for s in student_skills}
    j_set = {s.lower() for s in job_skills}
    if not j_set:
        return {"score": 0.5, "matched": [], "missing": []}
    matched = sorted(s_set & j_set)
    missing = sorted(j_set - s_set)
    skill_ratio = len(matched) / len(j_set)
    cgpa_factor = 1.0
    if cgpa is not None:
        cgpa_factor = min(1.0, max(0.4, cgpa / 10.0))
        if cgpa < min_cgpa:
            cgpa_factor *= 0.7
    score = round((0.75 * skill_ratio + 0.25 * cgpa_factor) * 100, 1)
    return {"score": score, "matched": matched, "missing": missing}


@api.get("/match/recommendations", response_model=List[MatchResult])
async def recommendations(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(403, "Students only")
    resume = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    skills = resume["skills"] if resume else []
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(200)
    out = []
    for j in jobs:
        f = _fit_score(skills, j.get("required_skills", []), user.get("cgpa"), j.get("min_cgpa", 6.0))
        out.append(MatchResult(
            job_id=j["id"],
            job_title=j["title"],
            company_name=j["company_name"],
            fit_score=f["score"],
            matched_skills=f["matched"],
            missing_skills=f["missing"],
            location=j.get("location", ""),
            ctc_range=f"{j.get('ctc_min', 0)}-{j.get('ctc_max', 0)} LPA",
        ))
    out.sort(key=lambda x: x.fit_score, reverse=True)
    return out


@api.post("/match/shortlist", response_model=List[CandidateShortlist])
async def shortlist_candidates(payload: ShortlistRequest, user: dict = Depends(require_role("recruiter", "coordinator"))):
    job = await db.jobs.find_one({"id": payload.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    students = await db.users.find({"role": "student"}, {"_id": 0, "password_hash": 0}).to_list(500)
    results: List[CandidateShortlist] = []
    for s in students:
        resume = await db.resumes.find_one({"user_id": s["id"]}, {"_id": 0})
        skills = resume["skills"] if resume else []
        ats = resume["ats_score"] if resume else 0
        f = _fit_score(skills, job.get("required_skills", []), s.get("cgpa"), job.get("min_cgpa", 6.0))
        results.append(CandidateShortlist(
            user_id=s["id"], name=s["name"], email=s["email"],
            branch=s.get("branch"), cgpa=s.get("cgpa"),
            fit_score=f["score"], matched_skills=f["matched"], missing_skills=f["missing"],
            ats_score=ats,
        ))
    results.sort(key=lambda x: (x.fit_score, x.ats_score), reverse=True)
    return results


# ---------- Prediction ----------
@api.get("/predict/me", response_model=PredictionResult)
async def predict_me(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(403, "Students only")
    resume = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    cgpa = user.get("cgpa") or 0.0
    skills = resume.get("skills", []) if resume else []
    ats = resume.get("ats_score", 0) if resume else 0
    n_projects = len(resume.get("projects", [])) if resume else 0
    n_certs = len(resume.get("certifications", [])) if resume else 0
    n_skills = len(skills)

    # Aggregate desired skills across jobs
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(200)
    desired = set()
    for j in jobs:
        desired |= {s.lower() for s in j.get("required_skills", [])}
    skill_coverage = (len(set(skills) & desired) / max(1, len(desired))) if desired else 0.0

    # Rule-based prediction
    cgpa_score = min(1.0, cgpa / 10.0) if cgpa else 0.3
    ats_score = ats / 100.0
    skills_score = min(1.0, n_skills / 12.0)
    projects_score = min(1.0, n_projects / 4.0)
    certs_score = min(1.0, n_certs / 3.0)

    weights = {
        "CGPA": 0.30, "ATS Score": 0.20, "Skill Coverage": 0.20,
        "Skills Count": 0.10, "Projects": 0.15, "Certifications": 0.05,
    }
    raw_scores = {
        "CGPA": cgpa_score, "ATS Score": ats_score, "Skill Coverage": skill_coverage,
        "Skills Count": skills_score, "Projects": projects_score, "Certifications": certs_score,
    }
    probability = sum(weights[k] * raw_scores[k] for k in weights)
    probability = round(min(0.97, max(0.05, probability)) * 100, 1)

    contributions = [
        {"feature": k, "weight": round(weights[k] * 100, 1), "value": round(raw_scores[k] * 100, 1),
         "contribution": round(weights[k] * raw_scores[k] * 100, 1)}
        for k in weights
    ]
    contributions.sort(key=lambda x: x["contribution"], reverse=True)

    # Expected CTC band based on probability
    base = 4.0 + (cgpa - 6.0) * 1.2 if cgpa else 4.0
    base = max(3.0, base)
    expected_min = round(base * (0.7 + probability / 200), 1)
    expected_max = round(expected_min * 1.6, 1)

    risk = "low" if probability >= 70 else ("medium" if probability >= 45 else "high")
    confidence = "high" if (resume and cgpa) else "medium"

    insights = []
    if cgpa and cgpa < 7.0:
        insights.append("CGPA is the largest blocker — even 0.3 points of improvement materially shifts probability.")
    if ats < 70:
        insights.append("Boost ATS score by adding measurable impact verbs and aligning keywords with target JDs.")
    if n_projects < 3:
        insights.append("Add 1-2 outcome-driven projects with metrics to strengthen technical credibility.")
    if skill_coverage < 0.4 and desired:
        gap_skills = sorted(desired - set(skills))[:5]
        insights.append(f"Skill coverage is low. Prioritize learning: {', '.join(gap_skills)}.")
    if not insights:
        insights.append("Strong profile. Focus on interview prep and applying to top-fit companies.")

    return PredictionResult(
        placement_probability=probability,
        expected_ctc_min=expected_min,
        expected_ctc_max=expected_max,
        confidence=confidence,
        feature_contributions=contributions,
        insights=insights,
        risk_level=risk,
    )


# ---------- Interview ----------
@api.post("/interview/start", response_model=InterviewSessionPublic)
async def start_interview(payload: InterviewStart, user: dict = Depends(get_current_user)):
    sid = _uid()
    first = await interview_start(sid, payload.role, payload.interview_type)
    doc = {
        "id": sid,
        "user_id": user["id"],
        "role": payload.role,
        "interview_type": payload.interview_type,
        "messages": [{"role": "assistant", "content": first, "ts": _now()}],
        "score": None,
        "feedback": None,
        "created_at": _now(),
    }
    await db.interviews.insert_one(doc)
    return InterviewSessionPublic(**doc)


@api.post("/interview/message", response_model=InterviewSessionPublic)
async def interview_message(payload: InterviewMessage, user: dict = Depends(get_current_user)):
    session = await db.interviews.find_one({"id": payload.session_id, "user_id": user["id"]}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    reply = await interview_turn(payload.session_id, session["role"], session["interview_type"], payload.message)
    new_msgs = session["messages"] + [
        {"role": "user", "content": payload.message, "ts": _now()},
        {"role": "assistant", "content": reply, "ts": _now()},
    ]
    update = {"messages": new_msgs}
    # try detect FINAL_SCORE
    if "FINAL_SCORE" in reply:
        import re
        m = re.search(r"FINAL_SCORE\s*[:\-]\s*(\d+)", reply)
        if m:
            update["score"] = float(m.group(1))
            update["feedback"] = reply
    await db.interviews.update_one({"id": payload.session_id}, {"$set": update})
    session.update(update)
    return InterviewSessionPublic(**session)


@api.get("/interview/sessions", response_model=List[InterviewSessionPublic])
async def list_sessions(user: dict = Depends(get_current_user)):
    items = await db.interviews.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


# ---------- Mentor chat ----------
@api.post("/mentor/chat")
async def mentor(payload: dict, user: dict = Depends(get_current_user)):
    msg = payload.get("message", "").strip()
    if not msg:
        raise HTTPException(400, "Empty message")
    sid = payload.get("session_id") or f"mentor-{user['id']}"
    reply = await mentor_chat(sid, msg)
    return {"reply": reply, "session_id": sid}


# ---------- Analytics ----------
@api.get("/analytics/overview")
async def analytics_overview(user: dict = Depends(require_role("coordinator", "recruiter"))):
    total_students = await db.users.count_documents({"role": "student"})
    total_jobs = await db.jobs.count_documents({})
    total_resumes = await db.resumes.count_documents({})
    total_interviews = await db.interviews.count_documents({})

    # Branch distribution
    pipeline_branch = [
        {"$match": {"role": "student"}},
        {"$group": {"_id": "$branch", "count": {"$sum": 1}, "avg_cgpa": {"$avg": "$cgpa"}}},
        {"$sort": {"count": -1}},
    ]
    branch_dist = []
    async for doc in db.users.aggregate(pipeline_branch):
        branch_dist.append({
            "branch": doc["_id"] or "Unknown",
            "count": doc["count"],
            "avg_cgpa": round(doc["avg_cgpa"], 2) if doc["avg_cgpa"] else 0,
        })

    # Skill heatmap (top 12 demanded skills vs supply)
    jobs = await db.jobs.find({}, {"_id": 0, "required_skills": 1}).to_list(200)
    demand: dict = {}
    for j in jobs:
        for s in j.get("required_skills", []):
            demand[s] = demand.get(s, 0) + 1

    resumes = await db.resumes.find({}, {"_id": 0, "skills": 1}).to_list(500)
    supply: dict = {}
    for r in resumes:
        for s in r.get("skills", []):
            supply[s] = supply.get(s, 0) + 1

    top_skills = sorted(demand.items(), key=lambda x: x[1], reverse=True)[:12]
    skill_heat = [{"skill": s, "demand": d, "supply": supply.get(s, 0)} for s, d in top_skills]

    # Funnel
    applied = total_resumes  # those who uploaded resume = applied
    shortlisted = max(0, int(applied * 0.55))
    interviewed = total_interviews
    placed = max(0, int(shortlisted * 0.42))
    funnel = [
        {"stage": "Registered", "value": total_students},
        {"stage": "Resume Submitted", "value": applied},
        {"stage": "Shortlisted", "value": shortlisted},
        {"stage": "Interviewed", "value": interviewed},
        {"stage": "Placed", "value": placed},
    ]

    # At-risk students (cgpa<7 or no resume)
    students = await db.users.find({"role": "student"}, {"_id": 0, "password_hash": 0}).to_list(500)
    at_risk = []
    for s in students:
        has_resume = await db.resumes.count_documents({"user_id": s["id"]}) > 0
        cgpa = s.get("cgpa") or 0
        reasons = []
        if cgpa and cgpa < 7.0:
            reasons.append(f"Low CGPA ({cgpa})")
        if not has_resume:
            reasons.append("No resume submitted")
        if reasons:
            at_risk.append({
                "id": s["id"], "name": s["name"], "branch": s.get("branch"),
                "cgpa": cgpa, "reasons": reasons,
            })

    # CTC trends (mock yearly)
    ctc_trend = [
        {"year": "2021", "avg_ctc": 8.4},
        {"year": "2022", "avg_ctc": 9.7},
        {"year": "2023", "avg_ctc": 11.2},
        {"year": "2024", "avg_ctc": 12.6},
        {"year": "2025", "avg_ctc": 13.9},
    ]

    return {
        "kpis": {
            "total_students": total_students, "total_jobs": total_jobs,
            "total_resumes": total_resumes, "total_interviews": total_interviews,
            "placement_rate": round((placed / total_students * 100), 1) if total_students else 0,
        },
        "branch_distribution": branch_dist,
        "skill_heatmap": skill_heat,
        "funnel": funnel,
        "at_risk": at_risk[:10],
        "ctc_trend": ctc_trend,
    }


# ---------- Wire up ----------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    seeded = await seed_demo(db)
    if seeded:
        logger.info("Seeded demo data ✔")
    else:
        logger.info("Existing DB found; skipping seed.")


@app.on_event("shutdown")
async def _shutdown():
    client.close()

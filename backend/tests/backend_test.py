"""Backend regression tests for Placement Intelligence Ecosystem.

Covers:
- Health
- Auth (register, login, /me, RBAC errors)
- Demo seed login (student/coordinator/recruiter)
- Resume analyze (Claude call) + GET /resume/me
- Prediction (student-only)
- Jobs CRUD + RBAC
- Matching: recommendations + shortlist
- Interview: start, message, list
- Analytics: coordinator overview + student 403
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://placement-nexus-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Generous timeout for Claude calls
LLM_TIMEOUT = 90
DEFAULT_TIMEOUT = 30

SAMPLE_RESUME = """
Aarav Sharma
Email: aarav@example.com | Phone: +91-9999999999
B.Tech, Computer Science, IIT Bombay, CGPA 8.4 (2022-2026)

SKILLS
Python, FastAPI, React, JavaScript, TypeScript, SQL, MongoDB, Docker, Git, AWS, Machine Learning, PyTorch

PROJECTS
- Placement Intelligence Platform: Built a full-stack app with FastAPI + React + MongoDB. Integrated Claude for resume parsing. Improved ATS scoring accuracy by 35%.
- Real-time Chat App: Designed a WebSocket-based chat with Redis pub/sub, supporting 5000+ concurrent users.
- ML Pipeline: Trained an XGBoost model on student data to predict placement probability with 87% accuracy.

EXPERIENCE
- SDE Intern, Acme AI (Summer 2024): Shipped 4 features to production, reduced API p95 latency by 40%.

CERTIFICATIONS
- AWS Certified Cloud Practitioner
- Google Data Analytics

ACHIEVEMENTS
- Top 5% in Smart India Hackathon 2024
"""


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(http, email, password):
    r = http.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=DEFAULT_TIMEOUT)
    return r


@pytest.fixture(scope="session")
def student_token(http):
    r = _login(http, "student@demo.com", "demo1234")
    if r.status_code != 200:
        pytest.skip(f"student login failed: {r.status_code} {r.text[:200]}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def coordinator_token(http):
    r = _login(http, "coordinator@demo.com", "demo1234")
    if r.status_code != 200:
        pytest.skip(f"coordinator login failed: {r.status_code}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def recruiter_token(http):
    r = _login(http, "recruiter@demo.com", "demo1234")
    if r.status_code != 200:
        pytest.skip(f"recruiter login failed: {r.status_code}")
    return r.json()["token"]


def H(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Health ----------------
class TestHealth:
    def test_root(self, http):
        r = http.get(f"{API}/", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"


# ---------------- Auth ----------------
class TestAuth:
    def test_demo_logins_all_roles(self, http):
        for email in ["student@demo.com", "coordinator@demo.com", "recruiter@demo.com"]:
            r = _login(http, email, "demo1234")
            assert r.status_code == 200, f"{email} → {r.status_code} {r.text[:200]}"
            data = r.json()
            assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
            assert data["user"]["email"] == email

    def test_invalid_credentials_401(self, http):
        r = http.post(f"{API}/auth/login", json={"email": "student@demo.com", "password": "wrong"}, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 401

    def test_register_invalid_role_400(self, http):
        uniq = uuid.uuid4().hex[:8]
        r = http.post(f"{API}/auth/register", json={
            "email": f"TEST_{uniq}@demo.com",
            "password": "test12345",
            "name": "Test User",
            "role": "admin",
        }, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 400

    def test_register_then_me(self, http):
        uniq = uuid.uuid4().hex[:8]
        email = f"TEST_{uniq}@demo.com"
        r = http.post(f"{API}/auth/register", json={
            "email": email, "password": "test12345", "name": "Test U",
            "role": "student", "branch": "CS", "cgpa": 8.0,
        }, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        token = r.json()["token"]
        m = http.get(f"{API}/auth/me", headers=H(token), timeout=DEFAULT_TIMEOUT)
        assert m.status_code == 200
        assert m.json()["email"] == email.lower()
        assert m.json()["role"] == "student"

    def test_me_no_token_401(self, http):
        r = http.get(f"{API}/auth/me", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 401


# ---------------- Resume ----------------
class TestResume:
    def test_analyze_and_get_me(self, http, student_token):
        r = http.post(f"{API}/resume/analyze",
                      headers=H(student_token),
                      json={"raw_text": SAMPLE_RESUME, "file_name": "test.txt"},
                      timeout=LLM_TIMEOUT)
        assert r.status_code == 200, r.text[:400]
        data = r.json()
        assert isinstance(data.get("skills"), list)
        assert isinstance(data.get("ats_score"), int)
        assert 0 <= data["ats_score"] <= 100
        assert data["user_id"]
        # GET /resume/me persists
        g = http.get(f"{API}/resume/me", headers=H(student_token), timeout=DEFAULT_TIMEOUT)
        assert g.status_code == 200
        body = g.json()
        assert body is not None
        assert body["user_id"] == data["user_id"]

    def test_analyze_short_text_400(self, http, student_token):
        r = http.post(f"{API}/resume/analyze", headers=H(student_token),
                      json={"raw_text": "hi"}, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 400


# ---------------- Prediction ----------------
class TestPrediction:
    def test_predict_student(self, http, student_token):
        r = http.get(f"{API}/predict/me", headers=H(student_token), timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        assert 0 <= d["placement_probability"] <= 100
        assert isinstance(d["feature_contributions"], list) and len(d["feature_contributions"]) > 0
        assert isinstance(d["insights"], list)
        assert d["risk_level"] in {"low", "medium", "high"}

    def test_predict_recruiter_403(self, http, recruiter_token):
        r = http.get(f"{API}/predict/me", headers=H(recruiter_token), timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 403


# ---------------- Jobs ----------------
class TestJobs:
    def test_list_jobs_has_seeded(self, http):
        r = http.get(f"{API}/jobs", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # Seed includes 6 jobs minimum; allow >=6
        assert len(items) >= 6, f"Expected ≥6 seeded jobs, got {len(items)}"

    def test_student_cannot_post_job(self, http, student_token):
        r = http.post(f"{API}/jobs", headers=H(student_token), json={
            "title": "X", "company_name": "Y", "description": "Z",
            "required_skills": ["python"],
        }, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 403

    def test_recruiter_create_and_delete_job(self, http, recruiter_token):
        payload = {
            "title": "TEST_QA Engineer", "company_name": "TEST_Corp",
            "location": "Remote", "description": "QA role for testing",
            "required_skills": ["Python", "Pytest"], "min_cgpa": 6.5,
            "ctc_min": 5.0, "ctc_max": 10.0, "role_type": "Full-time",
        }
        r = http.post(f"{API}/jobs", headers=H(recruiter_token), json=payload, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        job = r.json()
        assert job["id"]
        assert job["required_skills"] == ["python", "pytest"]  # lowercased
        # Delete
        d = http.delete(f"{API}/jobs/{job['id']}", headers=H(recruiter_token), timeout=DEFAULT_TIMEOUT)
        assert d.status_code == 200
        # Second delete should 404
        d2 = http.delete(f"{API}/jobs/{job['id']}", headers=H(recruiter_token), timeout=DEFAULT_TIMEOUT)
        assert d2.status_code == 404


# ---------------- Matching ----------------
class TestMatching:
    def test_recommendations_student(self, http, student_token):
        r = http.get(f"{API}/match/recommendations", headers=H(student_token), timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        first = items[0]
        for key in ("job_id", "job_title", "company_name", "fit_score", "matched_skills", "missing_skills"):
            assert key in first
        # sorted desc
        scores = [i["fit_score"] for i in items]
        assert scores == sorted(scores, reverse=True)

    def test_recommendations_recruiter_403(self, http, recruiter_token):
        r = http.get(f"{API}/match/recommendations", headers=H(recruiter_token), timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 403

    def test_shortlist_recruiter(self, http, recruiter_token):
        jobs = http.get(f"{API}/jobs", timeout=DEFAULT_TIMEOUT).json()
        assert jobs, "need at least one job"
        job_id = jobs[0]["id"]
        r = http.post(f"{API}/match/shortlist", headers=H(recruiter_token),
                      json={"job_id": job_id}, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        first = items[0]
        for key in ("user_id", "name", "email", "fit_score", "matched_skills", "missing_skills", "ats_score"):
            assert key in first

    def test_shortlist_bad_job_404(self, http, recruiter_token):
        r = http.post(f"{API}/match/shortlist", headers=H(recruiter_token),
                      json={"job_id": "nonexistent-id"}, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 404


# ---------------- Interview ----------------
class TestInterview:
    def test_start_message_list(self, http, student_token):
        # Start
        r = http.post(f"{API}/interview/start", headers=H(student_token),
                      json={"role": "Software Engineer", "interview_type": "technical"},
                      timeout=LLM_TIMEOUT)
        assert r.status_code == 200, r.text[:400]
        sess = r.json()
        assert sess["id"]
        assert len(sess["messages"]) >= 1
        assert sess["messages"][0]["role"] == "assistant"
        assert isinstance(sess["messages"][0]["content"], str) and len(sess["messages"][0]["content"]) > 5

        # Message
        m = http.post(f"{API}/interview/message", headers=H(student_token),
                      json={"session_id": sess["id"], "message": "I would use a hash map to solve it in O(n)."},
                      timeout=LLM_TIMEOUT)
        assert m.status_code == 200, m.text[:400]
        sess2 = m.json()
        assert len(sess2["messages"]) >= 3  # initial + user + assistant
        roles = [msg["role"] for msg in sess2["messages"]]
        assert "user" in roles and roles.count("assistant") >= 2

        # List
        lst = http.get(f"{API}/interview/sessions", headers=H(student_token), timeout=DEFAULT_TIMEOUT)
        assert lst.status_code == 200
        ids = [s["id"] for s in lst.json()]
        assert sess["id"] in ids


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_coordinator_overview(self, http, coordinator_token):
        r = http.get(f"{API}/analytics/overview", headers=H(coordinator_token), timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200, r.text[:200]
        d = r.json()
        for key in ("kpis", "branch_distribution", "skill_heatmap", "funnel", "at_risk", "ctc_trend"):
            assert key in d, f"missing {key}"
        assert isinstance(d["funnel"], list) and len(d["funnel"]) == 5
        assert d["kpis"]["total_students"] >= 1

    def test_student_analytics_403(self, http, student_token):
        r = http.get(f"{API}/analytics/overview", headers=H(student_token), timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 403

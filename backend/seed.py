"""Seed demo users, jobs, and a sample resume."""
from auth import hash_password
from models import _uid, _now


DEMO_USERS = [
    {
        "email": "student@demo.com", "password": "demo1234", "name": "Aarav Sharma",
        "role": "student", "branch": "Computer Science", "cgpa": 8.4,
    },
    {
        "email": "coordinator@demo.com", "password": "demo1234", "name": "Dr. Priya Menon",
        "role": "coordinator", "branch": "Placement Cell", "cgpa": None,
    },
    {
        "email": "recruiter@demo.com", "password": "demo1234", "name": "Rahul Verma",
        "role": "recruiter", "company": "Acme AI",
    },
]


DEMO_JOBS = [
    {
        "title": "Software Engineer Intern", "company_name": "Acme AI",
        "location": "Bangalore", "role_type": "Internship",
        "description": "Build LLM-powered tools. Work with Python, FastAPI, React. Strong fundamentals in DSA required.",
        "required_skills": ["python", "fastapi", "react", "sql", "git", "machine learning"],
        "min_cgpa": 7.5, "ctc_min": 8.0, "ctc_max": 14.0,
    },
    {
        "title": "Frontend Engineer", "company_name": "Lumen Labs",
        "location": "Remote", "role_type": "Full-time",
        "description": "Design and ship pixel-perfect React UIs. Tailwind, TypeScript, Framer Motion expertise expected.",
        "required_skills": ["react", "typescript", "tailwind", "javascript", "figma"],
        "min_cgpa": 7.0, "ctc_min": 10.0, "ctc_max": 18.0,
    },
    {
        "title": "Data Scientist", "company_name": "Northwind Analytics",
        "location": "Hyderabad", "role_type": "Full-time",
        "description": "Build ML models, run experiments, ship dashboards. Strong stats + Python + SQL needed.",
        "required_skills": ["python", "sql", "machine learning", "statistics", "pandas", "scikit-learn"],
        "min_cgpa": 7.8, "ctc_min": 12.0, "ctc_max": 22.0,
    },
    {
        "title": "Backend Engineer", "company_name": "Stripeline",
        "location": "Pune", "role_type": "Full-time",
        "description": "Design scalable APIs in Python/Go. Postgres, Redis, distributed systems experience preferred.",
        "required_skills": ["python", "go", "postgresql", "redis", "docker", "kubernetes"],
        "min_cgpa": 7.0, "ctc_min": 11.0, "ctc_max": 20.0,
    },
    {
        "title": "ML Research Intern", "company_name": "Quanta Research",
        "location": "Remote", "role_type": "Internship",
        "description": "Reproduce SOTA papers, implement transformer variants, contribute to open-source.",
        "required_skills": ["python", "pytorch", "transformers", "machine learning", "research"],
        "min_cgpa": 8.0, "ctc_min": 6.0, "ctc_max": 12.0,
    },
    {
        "title": "Cloud Engineer", "company_name": "Skyforge",
        "location": "Bangalore", "role_type": "Full-time",
        "description": "Own AWS infra, terraform, CI/CD, observability. Reliability mindset required.",
        "required_skills": ["aws", "terraform", "docker", "kubernetes", "linux", "ci/cd"],
        "min_cgpa": 7.0, "ctc_min": 10.0, "ctc_max": 18.0,
    },
]


async def seed_demo(db):
    existing = await db.users.count_documents({})
    if existing > 0:
        return False

    recruiter_id = None
    for u in DEMO_USERS:
        uid = _uid()
        doc = {
            "id": uid,
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "branch": u.get("branch"),
            "cgpa": u.get("cgpa"),
            "company": u.get("company"),
            "password_hash": hash_password(u["password"]),
            "created_at": _now(),
        }
        await db.users.insert_one(doc)
        if u["role"] == "recruiter":
            recruiter_id = uid

    # Seed jobs
    for j in DEMO_JOBS:
        await db.jobs.insert_one({
            "id": _uid(),
            "posted_by": recruiter_id or "system",
            "posted_at": _now(),
            "status": "open",
            **j,
        })

    # Seed a few more students for coordinator analytics
    extra_students = [
        {"email": "neha@demo.com", "name": "Neha Iyer", "branch": "Information Technology", "cgpa": 9.1},
        {"email": "kabir@demo.com", "name": "Kabir Singh", "branch": "Electronics", "cgpa": 6.3},
        {"email": "diya@demo.com", "name": "Diya Patel", "branch": "Computer Science", "cgpa": 7.7},
        {"email": "arjun@demo.com", "name": "Arjun Rao", "branch": "Mechanical", "cgpa": 6.8},
        {"email": "isha@demo.com", "name": "Isha Kapoor", "branch": "Computer Science", "cgpa": 8.9},
    ]
    for s in extra_students:
        await db.users.insert_one({
            "id": _uid(),
            "email": s["email"],
            "name": s["name"],
            "role": "student",
            "branch": s["branch"],
            "cgpa": s["cgpa"],
            "company": None,
            "password_hash": hash_password("demo1234"),
            "created_at": _now(),
        })
    return True

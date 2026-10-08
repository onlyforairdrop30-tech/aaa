import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

backend_dir = os.path.dirname(os.path.abspath(__file__))

# Load .env from backend directory or current working directory
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Resolve SQLite database file to an absolute, normalized path inside backend directory
default_sqlite_path = os.path.join(backend_dir, "college_search.db").replace("\\", "/")
default_sqlite_url = f"sqlite:///{default_sqlite_path}"

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "college_search")
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
elif DATABASE_URL.startswith("sqlite"):
    # Always normalize relative sqlite paths to absolute path inside backend folder
    DATABASE_URL = default_sqlite_url
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fail visibly when a configured remote database is unavailable. Falling back to a
# local SQLite database in production would make the app appear healthy while losing data.
try:
    if DATABASE_URL.startswith("sqlite"):
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        temp_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
except Exception:
    print("[!] Could not connect to the configured database.")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from models import User, DeviceToken, PasswordReset, SearchLog, Admin
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        admin_user = os.getenv("ADMIN_USERNAME", "admin@college.edu").strip().lower()
        admin_pass = os.getenv("ADMIN_PASSWORD", "AdminPass123!").strip()
        
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Remove any other admin accounts to ensure exclusivity
        db.query(Admin).filter(func.lower(Admin.username) != admin_user).delete()
        
        existing = db.query(Admin).filter(func.lower(Admin.username) == admin_user).first()
        if not existing:
            admin = Admin(
                username=admin_user,
                password_hash=pwd_context.hash(admin_pass)
            )
            db.add(admin)
            db.commit()
            print(f"[+] Exclusive admin created (username: {admin_user})")
        else:
            # Update password hash if needed
            existing.username = admin_user
            existing.password_hash = pwd_context.hash(admin_pass)
            db.commit()
            print(f"[+] Exclusive admin credentials synchronized (username: {admin_user})")
    finally:
        db.close()

# Ensure tables and admin exist upon module load
create_tables()
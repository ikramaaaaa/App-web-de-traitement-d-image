from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base



DATABASE_URL="postgresql://postgres.kmrkgxuxalpilfzseamc:S-s.nFgCN%40H259J@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
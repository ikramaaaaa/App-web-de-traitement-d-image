from pydantic import BaseModel
from typing import Optional


# ---------------- RESPONSE ----------------
class ImageOut(BaseModel):
    id: str
    file_url: str
    user_id: Optional[str] = None
    class Config:
        from_attributes = True
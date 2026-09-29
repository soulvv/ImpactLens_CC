from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ActivityBase(BaseModel):
    project_id: Optional[str] = None
    action: str
    description: str


class ActivityResponse(ActivityBase):
    id: str
    created_at: datetime
    project_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

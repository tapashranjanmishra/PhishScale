from pydantic import BaseModel, ConfigDict


# ==================================================
# TARGET GROUP
# ==================================================

class TargetGroupCreate(BaseModel):
    name: str
    department: str


class TargetGroupResponse(BaseModel):
    id: int
    name: str
    department: str

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# TARGET
# ==================================================

class TargetCreate(BaseModel):
    name: str
    email: str
    department: str


class TargetResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str
    group_id: int

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# CAMPAIGN
# ==================================================

class CampaignCreate(BaseModel):
    name: str
    template_name: str
    group_id: int


class CampaignResponse(BaseModel):
    id: int
    name: str
    template_name: str
    group_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# CAMPAIGN EVENTS
# ==================================================

class CampaignEventCreate(BaseModel):
    target_id: int
    event_type: str


class CampaignStats(BaseModel):
    sent: int
    opened: int
    clicked: int
    compromised: int


# ==================================================
# TEMPLATES
# ==================================================

class TemplateCreate(BaseModel):
    name: str
    category: str
    subject: str
    sender: str
    provider: str
    body: str


class TemplateResponse(BaseModel):
    id: int
    name: str
    category: str
    subject: str
    sender: str
    provider: str
    body: str

    model_config = ConfigDict(from_attributes=True)
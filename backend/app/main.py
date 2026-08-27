from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import Base, engine, get_db
from . import models
from .routers import targets, campaigns, templates, tracking


# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="PhishScale API",
    description="Security Awareness Simulation Platform",
    version="1.0.0",
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(targets.router)
app.include_router(campaigns.router)
app.include_router(templates.router)
app.include_router(tracking.router)

# --------------------------------------------------
# BASIC ROUTES
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "PhishScale API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# --------------------------------------------------
# TARGET ROUTES
# --------------------------------------------------

@app.get("/api/target-groups/{group_id}/targets")

def get_targets(
    group_id: int,
    db: Session = Depends(get_db)
):
    # Make sure the group exists
    group = (
        db.query(models.TargetGroup)
        .filter(models.TargetGroup.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Target group not found"
        )

    targets_list = (
        db.query(models.Target)
        .filter(models.Target.group_id == group_id)
        .order_by(models.Target.id.asc())
        .all()
    )

    return targets_list

def create_target(
    group_id: int,
    target: dict,
    db: Session = Depends(get_db)
):
    # Make sure the group exists
    group = (
        db.query(models.TargetGroup)
        .filter(models.TargetGroup.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Target group not found"
        )

    # Extract data
    name = target.get("name")
    email = target.get("email")
    department = target.get("department")

    if not name or not email or not department:
        raise HTTPException(
            status_code=400,
            detail="Name, email and department are required"
        )

    # Check whether this email already exists
    existing_target = (
        db.query(models.Target)
        .filter(models.Target.email == email)
        .first()
    )

    if existing_target:
        raise HTTPException(
            status_code=400,
            detail="A target with this email already exists"
        )

    new_target = models.Target(
        name=name,
        email=email,
        department=department,
        group_id=group_id,
    )

    db.add(new_target)
    db.commit()
    db.refresh(new_target)

    return new_target


@app.delete("/api/targets/{target_id}")
def delete_target(
    target_id: int,
    db: Session = Depends(get_db)
):
    target = (
        db.query(models.Target)
        .filter(models.Target.id == target_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Target not found"
        )

    db.delete(target)
    db.commit()

    return {
        "message": "Target deleted successfully"
    }


# --------------------------------------------------
# ANALYTICS
# --------------------------------------------------

@app.get("/api/analytics/{campaign_id}")
def get_campaign_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    # Get campaign
    campaign = (
        db.query(models.Campaign)
        .filter(models.Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found"
        )

    # ----------------------------------------------
    # TOTAL TARGETS
    # ----------------------------------------------

    total_targets = (
        db.query(models.Target)
        .filter(
            models.Target.group_id == campaign.group_id
        )
        .count()
    )

    # ----------------------------------------------
    # UNIQUE OPENED TARGETS
    # ----------------------------------------------

    opened = (
        db.query(
            func.count(
                func.distinct(
                    models.CampaignEvent.target_id
                )
            )
        )
        .filter(
            models.CampaignEvent.campaign_id == campaign_id,
            models.CampaignEvent.event_type == "opened"
        )
        .scalar()
    )

    # ----------------------------------------------
    # UNIQUE CLICKED TARGETS
    # ----------------------------------------------

    clicked = (
        db.query(
            func.count(
                func.distinct(
                    models.CampaignEvent.target_id
                )
            )
        )
        .filter(
            models.CampaignEvent.campaign_id == campaign_id,
            models.CampaignEvent.event_type == "clicked"
        )
        .scalar()
    )

    # ----------------------------------------------
    # UNIQUE SUBMITTED TARGETS
    # ----------------------------------------------

    submitted = (
        db.query(
            func.count(
                func.distinct(
                    models.CampaignEvent.target_id
                )
            )
        )
        .filter(
            models.CampaignEvent.campaign_id == campaign_id,
            models.CampaignEvent.event_type == "submitted"
        )
        .scalar()
    )

    # ----------------------------------------------
    # DEPARTMENT RISK
    # ----------------------------------------------

    department_rows = (
        db.query(
            models.Target.department,
            func.count(
                func.distinct(
                    models.CampaignEvent.target_id
                )
            )
        )
        .join(
            models.CampaignEvent,
            models.CampaignEvent.target_id
            == models.Target.id
        )
        .filter(
            models.CampaignEvent.campaign_id == campaign_id,
            models.CampaignEvent.event_type.in_(
                ["clicked", "submitted"]
            )
        )
        .group_by(
            models.Target.department
        )
        .all()
    )

    department_risk = []

    for department, risky_targets in department_rows:

        department_total = (
            db.query(models.Target)
            .filter(
                models.Target.group_id == campaign.group_id,
                models.Target.department == department
            )
            .count()
        )

        if department_total > 0:
            risk = round(
                (risky_targets / department_total) * 100
            )
        else:
            risk = 0

        department_risk.append(
            {
                "department": department,
                "risk": risk
            }
        )

    # ----------------------------------------------
    # RESPONSE
    # ----------------------------------------------

    return {
        "campaign": {
            "id": campaign.id,
            "name": campaign.name,
            "template_name": campaign.template_name,
            "group_id": campaign.group_id,
            "status": campaign.status
        },

        "stats": {
            "sent": total_targets,
            "opened": opened or 0,
            "clicked": clicked or 0,
            "submitted": submitted or 0
        },

        "department_risk": department_risk
    }
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign, CampaignEvent, TargetGroup, Target
from ..schemas import (
    CampaignCreate,
    CampaignResponse,
    CampaignEventCreate,
    CampaignStats,
)


router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"],
)


# ---------------------------------------------------------
# GET ALL CAMPAIGNS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[CampaignResponse],
)
def get_campaigns(
    db: Session = Depends(get_db),
):
    return (
        db.query(Campaign)
        .order_by(Campaign.id.desc())
        .all()
    )


# ---------------------------------------------------------
# CREATE CAMPAIGN
# ---------------------------------------------------------

@router.post(
    "",
    response_model=CampaignResponse,
    status_code=201,
)
def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
):
    # Make sure target group exists
    group = (
        db.query(TargetGroup)
        .filter(TargetGroup.id == campaign.group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Target group not found",
        )

    new_campaign = Campaign(
        name=campaign.name,
        template_name=campaign.template_name,
        group_id=campaign.group_id,
        status="Draft",
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    return new_campaign


# ---------------------------------------------------------
# LAUNCH CAMPAIGN
# ---------------------------------------------------------

@router.post(
    "/{campaign_id}/launch",
    response_model=CampaignResponse,
)
def launch_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    if campaign.status == "Active":
        return campaign

    campaign.status = "Active"

    db.commit()
    db.refresh(campaign)

    return campaign


# ---------------------------------------------------------
# RECORD CAMPAIGN EVENT
# ---------------------------------------------------------

@router.post(
    "/{campaign_id}/events",
)
def create_campaign_event(
    campaign_id: int,
    event: CampaignEventCreate,
    db: Session = Depends(get_db),
):
    # Check campaign
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # Check target
    target = (
        db.query(Target)
        .filter(Target.id == event.target_id)
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Target not found",
        )

    # Make sure target belongs to campaign group
    if target.group_id != campaign.group_id:
        raise HTTPException(
            status_code=400,
            detail="Target does not belong to this campaign's group",
        )

    # Only allow supported simulation events
    allowed_events = {
        "opened",
        "clicked",
        "submitted",
    }

    if event.event_type not in allowed_events:
        raise HTTPException(
            status_code=400,
            detail="Invalid event type",
        )

    # Prevent duplicate event for same target
    existing_event = (
        db.query(CampaignEvent)
        .filter(
            CampaignEvent.campaign_id == campaign_id,
            CampaignEvent.target_id == event.target_id,
            CampaignEvent.event_type == event.event_type,
        )
        .first()
    )

    if existing_event:
        return {
            "message": "Event already recorded",
            "event_id": existing_event.id,
        }

    new_event = CampaignEvent(
        campaign_id=campaign_id,
        target_id=event.target_id,
        event_type=event.event_type,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "message": "Event recorded successfully",
        "event_id": new_event.id,
    }


# ---------------------------------------------------------
# CAMPAIGN STATISTICS
# ---------------------------------------------------------

@router.get(
    "/{campaign_id}/stats",
    response_model=CampaignStats,
)
def get_campaign_stats(
    campaign_id: int,
    db: Session = Depends(get_db),
):
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id)
        .first()
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # Total targets in the campaign group
    sent = (
        db.query(Target)
        .filter(
            Target.group_id == campaign.group_id
        )
        .count()
    )

    opened = (
        db.query(CampaignEvent)
        .filter(
            CampaignEvent.campaign_id == campaign_id,
            CampaignEvent.event_type == "opened",
        )
        .count()
    )

    clicked = (
        db.query(CampaignEvent)
        .filter(
            CampaignEvent.campaign_id == campaign_id,
            CampaignEvent.event_type == "clicked",
        )
        .count()
    )

    compromised = (
        db.query(CampaignEvent)
        .filter(
            CampaignEvent.campaign_id == campaign_id,
            CampaignEvent.event_type == "submitted",
        )
        .count()
    )

    return {
        "sent": sent,
        "opened": opened,
        "clicked": clicked,
        "compromised": compromised,
    }
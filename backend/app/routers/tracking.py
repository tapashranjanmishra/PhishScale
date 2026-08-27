from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign, CampaignEvent, Target


router = APIRouter(
    prefix="/api/tracking",
    tags=["Tracking"],
)


# ---------------------------------------------------------
# HELPER — RECORD EVENT
# ---------------------------------------------------------

def record_tracking_event(
    campaign_id: int,
    target_id: int,
    event_type: str,
    db: Session,
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
        .filter(Target.id == target_id)
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
            detail="Target does not belong to this campaign",
        )

    # Only allow supported events
    allowed_events = {
        "opened",
        "clicked",
        "submitted",
    }

    if event_type not in allowed_events:
        raise HTTPException(
            status_code=400,
            detail="Invalid tracking event",
        )

    # Prevent duplicate event
    existing_event = (
        db.query(CampaignEvent)
        .filter(
            CampaignEvent.campaign_id == campaign_id,
            CampaignEvent.target_id == target_id,
            CampaignEvent.event_type == event_type,
        )
        .first()
    )

    if existing_event:
        return {
            "message": "Event already recorded",
            "event_id": existing_event.id,
        }

    # Create event
    new_event = CampaignEvent(
        campaign_id=campaign_id,
        target_id=target_id,
        event_type=event_type,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "message": "Event recorded successfully",
        "event_id": new_event.id,
    }


# ---------------------------------------------------------
# OPEN TRACKING
# ---------------------------------------------------------

@router.get("/open/{campaign_id}/{target_id}")
def track_open(
    campaign_id: int,
    target_id: int,
    db: Session = Depends(get_db),
):
    return record_tracking_event(
        campaign_id=campaign_id,
        target_id=target_id,
        event_type="opened",
        db=db,
    )


# ---------------------------------------------------------
# CLICK TRACKING
# ---------------------------------------------------------

@router.get("/click/{campaign_id}/{target_id}")
def track_click(
    campaign_id: int,
    target_id: int,
    db: Session = Depends(get_db),
):
    return record_tracking_event(
        campaign_id=campaign_id,
        target_id=target_id,
        event_type="clicked",
        db=db,
    )


# ---------------------------------------------------------
# SUBMISSION TRACKING
# ---------------------------------------------------------

@router.post("/submit/{campaign_id}/{target_id}")
def track_submission(
    campaign_id: int,
    target_id: int,
    db: Session = Depends(get_db),
):
    return record_tracking_event(
        campaign_id=campaign_id,
        target_id=target_id,
        event_type="submitted",
        db=db,
    )
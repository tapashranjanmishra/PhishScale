from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TargetGroup, Target
from ..schemas import (
    TargetGroupCreate,
    TargetGroupResponse,
    TargetCreate,
    TargetResponse,
)


router = APIRouter(
    prefix="/api/target-groups",
    tags=["Target Groups"],
)


# ============================================================
# TARGET GROUPS
# ============================================================


@router.get(
    "",
    response_model=list[TargetGroupResponse],
)
def get_target_groups(
    db: Session = Depends(get_db),
):
    return (
        db.query(TargetGroup)
        .order_by(TargetGroup.id.desc())
        .all()
    )


@router.post(
    "",
    response_model=TargetGroupResponse,
    status_code=201,
)
def create_target_group(
    group: TargetGroupCreate,
    db: Session = Depends(get_db),
):
    new_group = TargetGroup(
        name=group.name,
        department=group.department,
    )

    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    return new_group


@router.delete(
    "/{group_id}",
)
def delete_target_group(
    group_id: int,
    db: Session = Depends(get_db),
):
    group = (
        db.query(TargetGroup)
        .filter(TargetGroup.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Target group not found",
        )

    db.delete(group)
    db.commit()

    return {
        "message": "Target group deleted successfully"
    }


# ============================================================
# TARGETS / EMPLOYEES
# ============================================================


@router.get(
    "/{group_id}/targets",
    response_model=list[TargetResponse],
)
def get_targets(
    group_id: int,
    db: Session = Depends(get_db),
):
    # Check that the target group exists
    group = (
        db.query(TargetGroup)
        .filter(TargetGroup.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Target group not found",
        )

    # Get all targets belonging to this group
    targets = (
        db.query(Target)
        .filter(Target.group_id == group_id)
        .order_by(Target.id.asc())
        .all()
    )

    return targets


@router.post(
    "/{group_id}/targets",
    response_model=TargetResponse,
    status_code=201,
)
def create_target(
    group_id: int,
    target: TargetCreate,
    db: Session = Depends(get_db),
):
    # Check that the target group exists
    group = (
        db.query(TargetGroup)
        .filter(TargetGroup.id == group_id)
        .first()
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Target group not found",
        )

    # Check for duplicate email
    existing_target = (
        db.query(Target)
        .filter(Target.email == target.email)
        .first()
    )

    if existing_target:
        raise HTTPException(
            status_code=400,
            detail="A target with this email already exists",
        )

    # Create the target
    new_target = Target(
        name=target.name,
        email=target.email,
        department=target.department,
        group_id=group_id,
    )

    db.add(new_target)
    db.commit()
    db.refresh(new_target)

    return new_target


# ============================================================
# DELETE TARGET
# ============================================================


@router.delete(
    "/targets/{target_id}",
)
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
):
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

    db.delete(target)
    db.commit()

    return {
        "message": "Target deleted successfully"
    }
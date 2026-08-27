from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Template
from ..schemas import (
    TemplateCreate,
    TemplateResponse,
)


router = APIRouter(
    prefix="/api/templates",
    tags=["Templates"],
)


# --------------------------------------------------
# GET ALL TEMPLATES
# --------------------------------------------------

@router.get(
    "",
    response_model=list[TemplateResponse],
)
def get_templates(
    db: Session = Depends(get_db),
):
    return (
        db.query(Template)
        .order_by(Template.id.desc())
        .all()
    )


# --------------------------------------------------
# CREATE TEMPLATE
# --------------------------------------------------

@router.post(
    "",
    response_model=TemplateResponse,
    status_code=201,
)
def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
):
    new_template = Template(
        name=template.name,
        category=template.category,
        subject=template.subject,
        sender=template.sender,
        provider=template.provider,
        body=template.body,
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template


# --------------------------------------------------
# DELETE TEMPLATE
# --------------------------------------------------

@router.delete(
    "/{template_id}",
)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
):
    template = (
        db.query(Template)
        .filter(Template.id == template_id)
        .first()
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    db.delete(template)
    db.commit()

    return {
        "message": "Template deleted successfully"
    }
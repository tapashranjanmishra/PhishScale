from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from .database import Base


class TargetGroup(Base):
    __tablename__ = "target_groups"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    department = Column(
        String(100),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Target(Base):
    __tablename__ = "targets"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    email = Column(
        String(255),
        nullable=False,
    )

    department = Column(
        String(100),
        nullable=False,
    )

    group_id = Column(
        Integer,
        ForeignKey(
            "target_groups.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    template_name = Column(
        String(200),
        nullable=False,
    )

    group_id = Column(
        Integer,
        ForeignKey(
            "target_groups.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="Draft",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class CampaignEvent(Base):
    __tablename__ = "campaign_events"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    campaign_id = Column(
        Integer,
        ForeignKey(
            "campaigns.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    target_id = Column(
        Integer,
        ForeignKey(
            "targets.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    event_type = Column(
        String(30),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "campaign_id",
            "target_id",
            "event_type",
            name="uq_campaign_target_event",
        ),
    )


class Template(Base):
    __tablename__ = "templates"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
    )

    subject = Column(
        String(300),
        nullable=False,
    )

    sender = Column(
        String(200),
        nullable=False,
    )

    provider = Column(
        String(100),
        nullable=False,
        default="Custom",
    )

    body = Column(
        String(5000),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
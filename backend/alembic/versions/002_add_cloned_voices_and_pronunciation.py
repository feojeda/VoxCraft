"""Add cloned voices and pronunciation tables.

Revision ID: 002
Revises:
Create Date: 2026-04-25
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create cloned_voices and pronunciation_dict tables."""
    op.create_table(
        "cloned_voices",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("audio_path", sa.String(), nullable=False),
        sa.Column("ref_text", sa.Text(), nullable=False),
        sa.Column("duration_seconds", sa.Float(), nullable=False),
        sa.Column("sample_rate", sa.Integer(), nullable=False, server_default="24000"),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "pronunciation_dict",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("word", sa.String(), nullable=False),
        sa.Column("replacement", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("word"),
    )


def downgrade() -> None:
    """Drop cloned_voices and pronunciation_dict tables."""
    op.drop_table("pronunciation_dict")
    op.drop_table("cloned_voices")

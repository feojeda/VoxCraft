"""Add voice_clone_prompt_b64 to cloned_voices.

Revision ID: 003
Revises: 002
Create Date: 2026-04-26
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: str = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add voice_clone_prompt_b64 column to cloned_voices."""
    with op.batch_alter_table("cloned_voices") as batch_op:
        batch_op.add_column(
            sa.Column("voice_clone_prompt_b64", sa.Text(), nullable=True)
        )


def downgrade() -> None:
    """Remove voice_clone_prompt_b64 column."""
    with op.batch_alter_table("cloned_voices") as batch_op:
        batch_op.drop_column("voice_clone_prompt_b64")

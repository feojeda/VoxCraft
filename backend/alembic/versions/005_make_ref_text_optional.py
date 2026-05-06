"""Make ref_text nullable in cloned_voices.

Revision ID: 005
Revises: 004
Create Date: 2026-05-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: str = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Make ref_text column nullable in cloned_voices."""
    with op.batch_alter_table("cloned_voices") as batch_op:
        batch_op.alter_column(
            "ref_text",
            existing_type=sa.Text(),
            nullable=True,
        )


def downgrade() -> None:
    """Make ref_text column non-nullable in cloned_voices."""
    with op.batch_alter_table("cloned_voices") as batch_op:
        batch_op.alter_column(
            "ref_text",
            existing_type=sa.Text(),
            nullable=False,
        )

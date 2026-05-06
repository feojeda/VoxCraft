"""Add x_vector_only_mode to cloned_voices and jobs.

Revision ID: 004
Revises: 003
Create Date: 2026-05-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: str = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add x_vector_only_mode column to cloned_voices and jobs."""
    with op.batch_alter_table("cloned_voices") as batch_op:
        batch_op.add_column(
            sa.Column("x_vector_only_mode", sa.Boolean(), nullable=False, server_default=sa.false())
        )
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.add_column(
            sa.Column("x_vector_only_mode", sa.Boolean(), nullable=False, server_default=sa.false())
        )


def downgrade() -> None:
    """Remove x_vector_only_mode columns."""
    with op.batch_alter_table("cloned_voices") as batch_op:
        batch_op.drop_column("x_vector_only_mode")
    with op.batch_alter_table("jobs") as batch_op:
        batch_op.drop_column("x_vector_only_mode")

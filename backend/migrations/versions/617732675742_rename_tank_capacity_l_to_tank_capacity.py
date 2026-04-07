"""rename tank_capacity_l to tank_capacity

Revision ID: 617732675742
Revises: eab5dda0353f
Create Date: 2026-04-05 20:06:04.545549

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '617732675742'
down_revision: Union[str, Sequence[str], None] = 'eab5dda0353f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

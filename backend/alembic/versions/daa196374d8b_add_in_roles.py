"""add in roles

Revision ID: daa196374d8b
Revises: 7a55612dd058
Create Date: 2025-03-13 23:25:19.402423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'daa196374d8b'
down_revision: Union[str, None] = '7a55612dd058'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # create ADMIN and USER roles
    op.execute("INSERT INTO roles (name) VALUES ('ADMIN'), ('USER')")


def downgrade() -> None:
    # first we need to remove any user_roles that are using these roles
    op.execute("""
        DELETE FROM user_roles
        WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('ADMIN', 'USER')
        )
    """)

    # remove ADMIN and USER roles
    op.execute("DELETE FROM roles WHERE name IN ('ADMIN', 'USER')")

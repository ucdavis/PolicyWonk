"""default assistant

Revision ID: bc221af58bd5
Revises: daa196374d8b
Create Date: 2025-04-07 23:01:08.139516

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'bc221af58bd5'
down_revision: Union[str, None] = 'daa196374d8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # create default assistant if it doesn't exist
    op.execute(
        """
INSERT INTO public.assistants (slug, name, description, theme)
VALUES (
    'policywonk', 
    'PolicyWonk', 
    'An assistant dedicated to policy analysis and insights.', 
    'default'
)
ON CONFLICT (slug) DO NOTHING;
        """
    )


def downgrade() -> None:
    # do nothing, if the assistant already exists it can stay
    pass

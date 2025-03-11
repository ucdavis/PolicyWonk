"""docs should be identity

Revision ID: d5b6aaeb712e
Revises: d6082e2cc4a3
Create Date: 2025-03-06 21:42:40.540987

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5b6aaeb712e'
down_revision: Union[str, None] = 'd6082e2cc4a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('document_contents_document_id_fkey',
                       'document_contents', type_='foreignkey')
    op.create_foreign_key('document_contents_document_id_fkey', 'document_contents', 'documents', [
                          'document_id'], ['id'], ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('document_contents_document_id_fkey',
                       'document_contents', type_='foreignkey')
    op.create_foreign_key('document_contents_document_id_fkey',
                          'document_contents', 'documents', ['document_id'], ['id'])
    # ### end Alembic commands ###

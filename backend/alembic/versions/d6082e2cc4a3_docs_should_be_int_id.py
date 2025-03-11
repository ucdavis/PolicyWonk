"""docs should be int id

Revision ID: d6082e2cc4a3
Revises: f87f07e6f643
Create Date: 2025-03-06 21:31:20.838799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6082e2cc4a3'
down_revision: Union[str, None] = 'f87f07e6f643'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# here we convert doc_id from str -> int
# before we were using url as PK but it seems to me multiple sources could index the same url


def upgrade() -> None:
    # First drop the foreign key constraints
    op.execute(
        'ALTER TABLE document_chunks DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey')
    op.execute(
        'ALTER TABLE document_contents DROP CONSTRAINT IF EXISTS document_contents_document_id_fkey')

    # Now convert all columns to INTEGER
    op.execute(
        'ALTER TABLE documents ALTER COLUMN id TYPE INTEGER USING id::INTEGER')
    op.execute(
        'ALTER TABLE document_contents ALTER COLUMN document_id TYPE INTEGER USING document_id::INTEGER')
    op.execute(
        'ALTER TABLE document_chunks ALTER COLUMN document_id TYPE INTEGER USING document_id::INTEGER')

    # Re-create the foreign key constraints
    op.execute('ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id)')
    op.execute('ALTER TABLE document_contents ADD CONSTRAINT document_contents_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id)')


def downgrade() -> None:
    # First drop the foreign key constraints
    op.execute(
        'ALTER TABLE document_chunks DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey')
    op.execute(
        'ALTER TABLE document_contents DROP CONSTRAINT IF EXISTS document_contents_document_id_fkey')

    # Now convert all columns back to VARCHAR
    op.execute(
        'ALTER TABLE documents ALTER COLUMN id TYPE VARCHAR USING id::VARCHAR')
    op.execute(
        'ALTER TABLE document_contents ALTER COLUMN document_id TYPE VARCHAR USING document_id::VARCHAR')
    op.execute(
        'ALTER TABLE document_chunks ALTER COLUMN document_id TYPE VARCHAR USING document_id::VARCHAR')

    # Re-create the foreign key constraints
    op.execute('ALTER TABLE document_chunks ADD CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id)')
    op.execute('ALTER TABLE document_contents ADD CONSTRAINT document_contents_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id)')

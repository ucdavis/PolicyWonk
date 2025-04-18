"""create embedding tables

Revision ID: f87f07e6f643
Revises: b83f8109ce65
Create Date: 2025-03-05 19:37:51.755864

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector

# revision identifiers, used by Alembic.
revision: str = 'f87f07e6f643'
down_revision: Union[str, None] = 'b83f8109ce65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # enable the vector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')

    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('document_chunks',
                    sa.Column('id', sa.Integer(),
                              autoincrement=True, nullable=False),
                    sa.Column('document_id', sa.String(), nullable=False),
                    sa.Column('chunk_index', sa.Integer(), nullable=False),
                    sa.Column('chunk_text', sa.Text(), nullable=False),
                    sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(
                        dim=1536), nullable=False),
                    sa.Column('meta', sa.JSON(), nullable=True),
                    sa.ForeignKeyConstraint(
                        ['document_id'], ['documents.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('document_chunks_embedding_idx', 'document_chunks', [
                    'embedding'], unique=False, postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.create_table('document_contents',
                    sa.Column('document_id', sa.String(), nullable=False),
                    sa.Column('content', sa.Text(), nullable=False),
                    sa.ForeignKeyConstraint(
                        ['document_id'], ['documents.id'], ondelete='CASCADE'),
                    sa.PrimaryKeyConstraint('document_id')
                    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('document_contents')
    op.drop_index('document_chunks_embedding_idx', table_name='document_chunks',
                  postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.drop_table('document_chunks')
    # ### end Alembic commands ###
    # disable the vector extension
    op.execute('DROP EXTENSION IF EXISTS vector;')

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')


def get_env_var(key):
    # Retrieve the environment variable or raise an error if not found
    value = os.environ.get(key)
    if value is None:
        raise EnvironmentError(f"Environment variable '{key}' not set")
    return value


def generate_policy_dataset_from_db(source_name: str):
    # Get database connection string from environment variable
    db_url = get_env_var("eval_database_url")

    # Create database engine
    engine = create_engine(db_url)

    # Query for all entries in document_chunks table
    with engine.connect() as conn:
        query = text("""
            SELECT document_id, chunk_index, chunk_text 
            FROM document_chunks 
            INNER JOIN public.documents d ON d.id = document_chunks.document_id 
            INNER JOIN public.sources s ON s.id = d.source_id 
            WHERE s.name = :source_name
        """)
        results = conn.execute(query, {"source_name": source_name}).fetchall()

    # Organize chunks by document_id and order by chunk_index
    documents = {}
    for row in results:
        # row can be a tuple; assuming order: document_id, chunk_index, chunk_text
        doc_id, chunk_index, chunk_text = row[0], row[1], row[2]
        if doc_id not in documents:
            documents[doc_id] = []
        documents[doc_id].append((chunk_index, chunk_text))

    # Build a list of contexts: each context is a list of chunk_text strings sorted by chunk_index
    contexts = []
    for doc_id in sorted(documents.keys()):
        # Sort chunks by chunk_index
        chunks = sorted(documents[doc_id], key=lambda x: x[0])
        contexts.append([chunk_text for _, chunk_text in chunks])

    # Ensure the output directory exists
    output_path = "./data/policy_chunks.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Empty the file if it exists before writing
    with open(output_path, "w") as f:
        json.dump(contexts, f, indent=4)


if __name__ == "__main__":
    generate_policy_dataset_from_db("UCOP Policies")

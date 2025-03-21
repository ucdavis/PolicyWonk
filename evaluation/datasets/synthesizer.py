import logging
from typing import List
from deepeval.synthesizer import Synthesizer
from deepeval.models.providers.ollama_model import OllamaModel


def run_synthesizer(documents: List[str]):
    # need to turn our list str into a list of lists, but each list is just a single str element
    # deepeval expects you to be passing in chunks but we're just passing in the whole document

    doc_context = [[doc] for doc in documents]

    # TODO: Testing, just take the first few documents
    doc_context = doc_context[:3]

    # generate synthetic data from our docs https://docs.confident-ai.com/docs/synthesizer-introduction
    synthesizer = Synthesizer(model=OllamaModel())
    synthesizer.generate_goldens_from_contexts(
        contexts=doc_context
    )

    dataframe = synthesizer.to_pandas()
    print(dataframe)


def get_policy_dataset():
    """Get full policy dataset from CSV file"""
    from pathlib import Path
    csv_path = Path('./data/policies_for_eval.csv')

    if csv_path.exists():
        logging.info(f"Reading policies from CSV: {csv_path}")
        import pandas as pd
        # Read CSV without headers and assign column names
        df = pd.read_csv(csv_path, header=None, names=['id', 'url', 'content'])
        documents = [
            str(row.content) for row in df.itertuples(index=False)
        ]
    else:
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    return documents


if __name__ == "__main__":
    docs = get_policy_dataset()

    run_synthesizer(docs)

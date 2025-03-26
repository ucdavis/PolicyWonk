import json
import logging
from typing import List
from deepeval.synthesizer import Synthesizer
from deepeval.models.providers.ollama_model import OllamaModel


def run_synthesizer(contexts):
    # TODO: Testing, just take the first few context arrays
    contexts = contexts[:3]

    # generate synthetic data from our docs https://docs.confident-ai.com/docs/synthesizer-introduction
    synthesizer = Synthesizer()
    synthesizer.generate_goldens_from_contexts(
        contexts=contexts
    )

    dataframe = synthesizer.to_pandas()

    # save the synthetic data to a csv file
    synthesizer.save_as(file_type='json', directory='./data')
    print(dataframe)


def get_policy_dataset():
    """Get full policy dataset from JSON file"""
    from pathlib import Path
    json_path = Path('./data/policy_chunks.json')

    if json_path.exists():
        logging.info(f"Reading policies from JSON: {json_path}")
        with open(json_path, 'r') as f:
            contexts = json.load(f)
    else:
        raise FileNotFoundError(f"CSV file not found: {json_path}")

    return contexts


if __name__ == "__main__":
    docs = get_policy_dataset()

    run_synthesizer(docs)

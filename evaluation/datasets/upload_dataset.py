import json
from deepeval.dataset import EvaluationDataset, Golden


def upload_dataset(json_path: str):
    # load dataset from json file
    with open(json_path, 'r') as f:
        golden_data = json.load(f)

    # convert our json data to a list of Goldens
    goldens = [Golden(**golden) for golden in golden_data]

    print(f"Loaded {len(goldens)} goldens from {json_path}")

    # now upload to confident ai
    dataset = EvaluationDataset(goldens=goldens)
    dataset.push(alias="UCOP Policies")

    print(f"Uploaded {len(goldens)} goldens to confident ai")


if __name__ == "__main__":
    # Example usage
    json_path = "./data/synthucop.json"
    upload_dataset(json_path)

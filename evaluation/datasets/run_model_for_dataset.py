# We want to take an existing (goldens) dataset in deepeval
# and then run our model on it and save the results to a new dataset
from deepeval.dataset import EvaluationDataset
import requests


def run_model_for_dataset(dataset_name: str):
    # Initialize dataset and pull using provided dataset_name
    dataset = EvaluationDataset()
    dataset.pull(alias=dataset_name, auto_convert_goldens_to_test_cases=False)

    for golden in dataset.goldens:
        print(f"Evaluating golden: {golden.input}")
        # Call our model with the input text
        actual_output, retrieval_context = call_model(golden.input)

        # update the golden with the actual output
        golden.actual_output = actual_output
        golden.retrieval_context = retrieval_context

    # now save our dataset with a new name
    dataset.push(f"{dataset_name}-ans-v1", overwrite=False)


def call_model(input_text: str):
    # call our API (http://localhost:3000/api/chat/completions) and get back the response
    response = requests.post(
        "http://localhost:3000/api/chat/completions",
        json={
            "input": input_text,
            "focus": {
                "name": "core"
            }
        }
    )

    response.raise_for_status()
    data = response.json()

    # we have output, context (str[])
    return data["output"], data["context"]


if __name__ == "__main__":
    # run_model_for_dataset("testv1")
    run_model_for_dataset("CoreFromReactions")

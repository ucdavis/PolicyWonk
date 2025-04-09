import sys
from typing import List
from deepeval.test_case import LLMTestCase
from deepeval.dataset import EvaluationDataset
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric
from deepeval import evaluate


def hypothetical_llm_app(input_text: str, context: List[str]):
    # our fake LLM app for now
    return "prompt", "actual_output", context


def run_evaluation(dataset_name):
    # Initialize dataset and pull using provided dataset_name
    dataset = EvaluationDataset()
    dataset.pull(alias=dataset_name, auto_convert_goldens_to_test_cases=False)

    goldens = dataset.goldens[0:3]  # Limit to first 3 for testing

    print(f"Evaluating {len(goldens)} goldens from {dataset_name}")

    # Create and append LLMTestCase for each golden
    for golden in goldens:
        print(f"Evaluating golden: {golden.input}")
        # Replace with your own LLM application
        prompt_to_llm, actual_output, retrieval_context = hypothetical_llm_app(
            golden.input, context=golden.context or [])
        test_case = LLMTestCase(
            input=prompt_to_llm,
            expected_output=golden.expected_output,
            actual_output=actual_output,
            retrieval_context=retrieval_context,
        )
        dataset.add_test_case(test_case)

    # Define metrics
    answer_relevancy = AnswerRelevancyMetric(threshold=0.5)
    faithfulness = FaithfulnessMetric(threshold=0.5)

    print(f"Running evaluation with {len(dataset.test_cases)} test cases")

    # Run evaluation with dataset.test_cases and dataset_name as the identifier
    evaluate(test_cases=dataset.test_cases, metrics=[  # type: ignore
             answer_relevancy, faithfulness], identifier=dataset_name)


def sample_evaluate():
    # just a sample test case to see if evaluate() works
    test_case = LLMTestCase(
        input="What is the capital of France?",
        actual_output="Paris",
        retrieval_context=["France is a country in Europe.",
                           "Paris is its capital."],
    )
    answer_relevancy = AnswerRelevancyMetric(threshold=0.5)

    print(test_case)

    evaluate(
        test_cases=[test_case],
        metrics=[answer_relevancy],
        identifier="Sample Test Case"
    )


if __name__ == "__main__":
    dataset_name = sys.argv[1] if len(sys.argv) > 1 else "UCOP Policies"
    run_evaluation(dataset_name)
    # sample_evaluate()

from typing import List, Optional
from pathlib import Path
import json
from dataclasses import asdict
import logging
import os
from tqdm import tqdm
from dotenv import load_dotenv
from litellm import completion
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')


def get_env_var(key: str, default: str | None = None) -> str:
    """Get environment variable with eval_ prefix"""
    value = os.getenv(f"eval_{key}", default)
    if value is None:
        raise ValueError(f"Missing required environment variable: eval_{key}")
    return value


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


class QAPair(BaseModel):
    question: str
    answer: str


class ResponseModel(BaseModel):
    qa_pairs: List[QAPair]


class Document(BaseModel):
    """Input document schema"""
    id: str
    url: str
    content: str


class SyntheticExample(BaseModel):
    """Schema for synthetic QA examples"""
    prompt: str
    expected_output: str
    context: str = Field(description="Source document URL")


class DatasetConfig(BaseModel):
    """Configuration for synthetic dataset generation"""
    max_examples_per_doc: int = Field(
        default=int(get_env_var("max_examples_per_doc", "3")),
        ge=1,
        description="Maximum number of examples to generate per document"
    )
    model_name: str = Field(
        default=get_env_var("llm_model_name", "llama3.2"),
        description="Ollama model to use"
    )
    output_path: Path = Field(
        default=Path(get_env_var("output_path", "./data/synthetic.json"))
    )
    temperature: float = Field(
        default=float(get_env_var("temperature", "0.7")),
        ge=0,
        le=1.0
    )

    # Default prompt template for generating synthetic examples
    prompt_template: str = Field(
        default="""You are helping create a synthetic dataset for evaluating LLMs on policy document comprehension.
        
Given the following policy document content, generate appropriate question-answer pairs that test understanding and reasoning about the policies. Focus on questions that require analysis rather than simple fact extraction.

Important: Generate only meaningful Q&A pairs based on the content density, up to a maximum of {max_count}. Quality over quantity - only create pairs that test substantial policy understanding.

Policy Content:
{content}

Return your response in this exact JSON format:
{{
  "qa_pairs": [
    {{
      "question": "A natural policy-related question",
      "answer": "A clear, accurate answer based on the policy content"
    }},
    ...
  ]
}}

Remember to:
- Make questions sound natural and realistic
- Include both simple and complex reasoning questions
- Focus on practical policy implications
- Ensure answers are fully supported by the content
- Only create high-quality pairs that test meaningful policy understanding
- It's okay to generate fewer pairs if the content doesn't warrant more

Response as JSON:""")


class SyntheticDatasetGenerator:
    def __init__(self, config: DatasetConfig):
        self.config = config

        # Ensure output directory exists
        self.config.output_path.parent.mkdir(parents=True, exist_ok=True)

    def generate_prompt(self, content: str, max_count: int) -> str:
        """Generate formatted prompt from template"""
        return self.config.prompt_template.format(
            content=content,
            max_count=max_count
        )

    def generate_qa_pairs(self, doc: Document) -> List[QAPair]:
        """Generate synthetic examples for a single document"""
        try:
            # Generate prompt
            logging.info(f"Generating examples for document {doc.id}")

            prompt = self.generate_prompt(
                # Truncate to avoid context length issues
                content=doc.content[:4000],
                max_count=self.config.max_examples_per_doc
            )

            try:
                logging.info(f"Using model: ollama/{self.config.model_name}")
                logging.info(f"Temperature: {self.config.temperature}")
                logging.info("Sending prompt to model...")

                # Call litellm
                response = completion(
                    model=f"ollama/{self.config.model_name}",
                    api_base="http://host.docker.internal:11434",
                    messages=[{"role": "user", "content": prompt}],
                    stream=False,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {"schema": ResponseModel.model_json_schema()}
                    },
                    temperature=self.config.temperature,
                )
                logging.info("Received={}".format(response))

                example_data = ResponseModel.model_validate_json(
                    response.choices[0].message.content or "{}")

                return example_data.qa_pairs

            except Exception as e:
                logging.error(f"Error calling model: {e}")
                return []
        except Exception as e:
            logging.exception(
                f"Error generating examples for document {doc.id}: {e}")
            return []

    def process_documents(self, documents: List[Document]):
        """Process all documents and save results"""
        all_examples: List[SyntheticExample] = []

        for doc in tqdm(documents, desc="Processing documents"):
            qa_pairs = self.generate_qa_pairs(doc)

            doc_context = f'[{doc.id}] {doc.url}'

            # Create synthetic examples from the QA pairs
            doc_qa_examples = [SyntheticExample(
                prompt=qap.question, expected_output=qap.answer, context=doc_context) for qap in qa_pairs]

            all_examples.extend(doc_qa_examples)

            # Incrementally save results
            self.save_results(all_examples)

        return all_examples

    def save_results(self, examples: List[SyntheticExample]):
        """Save results to JSON file"""
        try:
            # Use model_dump() for Pydantic models instead of asdict()
            output = {"entries": [ex.model_dump() for ex in examples]}
            with open(self.config.output_path, 'w') as f:
                json.dump(output, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving results: {e}")


def create_test_dataset():
    """Create a small test dataset with example policy scenarios"""
    test_doc = Document(
        id="test1",
        url="https://example.com/test-policy",
        content="""
        Academic Freedom Policy
        
        The University upholds and supports principles of academic freedom for faculty and students:
        
        1. Freedom of Research and Publication: Faculty members are entitled to full freedom in research and publication, subject to adequate performance of other academic duties.
        
        2. Freedom in the Classroom: Faculty members have freedom in discussing their subject in the classroom, but should avoid introducing controversial matters unrelated to the subject.
        
        3. Rights and Responsibilities: When faculty members speak or write as private citizens, they should be free from institutional censorship, but their position in the community imposes special obligations.
        """
    )

    # Use environment variables for test configuration
    config = DatasetConfig()

    generator = SyntheticDatasetGenerator(config)
    examples = generator.process_documents([test_doc])
    return examples


if __name__ == "__main__":
    # Create test dataset
    examples = create_test_dataset()
    logging.info(f"Generated {len(examples)} synthetic examples")

    for ex in examples:
        logging.info(f"Q: {ex.prompt}")
        logging.info(f"A: {ex.expected_output}")
        logging.info(f"Context: {ex.context}")
        logging.info("\n")

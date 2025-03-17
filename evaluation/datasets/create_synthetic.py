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
        default=int(get_env_var("max_examples_per_doc", "2")),
        ge=1,
        description="Maximum number of examples to generate per document"
    )
    model_name: str = Field(
        default=get_env_var("llm_model_name", "llama3.2"),
        description="Ollama model to use"
    )
    model_url: str = Field(
        default=get_env_var(
            "llm_model_url", "http://host.docker.internal:11434"),
        description="URL for the LLM API"
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
    prompt_template: str = """
You are helping create a synthetic dataset for evaluating LLMs on policy document comprehension.

**Goal**: Given the policy content, generate question-answer pairs that test genuine understanding and nuanced reasoning about the policy. Focus on questions that require analysis rather than simple fact extraction.

**Maximum Q&A Pairs**: {max_count}  
- Only generate as many pairs as the content truly supports. Quality over quantity.
- If the policy has been rescinded or has no useful content, do not generate examples and just return an empty list of "qa_pairs".

**Policy Content**:
{content}

---

**Important Instructions**:
1. **Relevance & Accuracy**: Ensure each question and answer pair is directly grounded in the policy. The answers must be factually supported by the text.
2. **Depth & Reasoning**: Aim for questions that require interpretation or application of the policy (e.g., scenario-based questions, questions on procedural details, or inquiries that highlight policy nuances).
3. **Practicality**: Questions should sound like realistic inquiries a university administrator, manager, or employee might ask. Answers should be concise but precise.
4. **Variety**: Include both straightforward clarifications (e.g., about policy scope) and more complex scenario-driven questions.
5. **Format**: Return the final output in **valid JSON** under the key `"qa_pairs"` as shown in the example structure.

---

**Examples of High-Quality Q&A Pairs**  
*(Use these as stylistic and structural guidance for your final output.)*

{{
  "qa_pairs": [
    {{
      "question": "A supervisor is insulting an employee during feedback. What should we do next?",
      "answer": "Look for policies regarding harassment or abusive conduct in the workplace. After confirming the conduct meets criteria for abusive behavior, document the incidents and consult the appropriate office (e.g., HR or Employee Relations) to determine if early resolution or a formal investigation is necessary."
    }},
    {{
      "question": "A consultant is belittling staff at a department meeting. They're not an employee.",
      "answer": "Check any sections on third-party or contractor conduct. Even non-employees must follow workplace standards. Document the remarks, contact the relevant office (HR or whoever manages the consultant's contract), and decide whether informal mediation or formal action is needed."
    }}
  ]
}}

Your Task:

Based on the policy text above, craft up to {max_count} realistic and meaningful question-answer pairs.
Each pair must test substantive understanding or application of the policy.

Return your response in this exact JSON format:

{{
  "qa_pairs": [
    {{
      "question": "Your policy-related question",
      "answer": "Your corresponding answer"
    }},
    ...
  ]
}}

ONLY RESPOND WITH VALID JSON
"""


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
                    api_base=self.config.model_url,
                    messages=[{"role": "user", "content": prompt}],
                    stream=False,
                    drop_params=True,  # drop thinking params
                    response_format={
                        "type": "json_schema",
                        "json_schema": {"schema": ResponseModel.model_json_schema()}
                    },
                    temperature=self.config.temperature,
                )
                logging.info("Received={}".format(response))

                # let's cleanup the raw content before we try to parse it
                raw_content = response.choices[0].message.content or "{}"

                # Remove thinking content between <think> and </think> tags
                import re
                raw_content = re.sub(r'<think>.*?</think>', '',
                                     raw_content, flags=re.DOTALL).strip()

                # sometimes the model tries to put the response in a code block
                json_match = re.search(
                    r'```(?:json)?\s*([\s\S]*?)```', raw_content)
                if json_match:
                    raw_content = json_match.group(1).strip()

                example_data = ResponseModel.model_validate_json(raw_content)

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


def get_policy_dataset():
    """Get full policy dataset from database"""
    from sqlalchemy import create_engine, text

    # Get database connection string from environment variable
    db_url = get_env_var("database_url")

    # Create database engine
    engine = create_engine(db_url)

    # Query to fetch documents
    query = """
    select d.id, d.url, content
    from document_contents
    inner join public.documents d on d.id = document_contents.document_id
    """

    # Execute query and create Document objects
    with engine.connect() as conn:
        result = conn.execute(text(query))
        documents = [
            Document(
                id=str(row.id),  # Convert to string since Document.id is str
                url=row.url,
                content=row.content
            )
            for row in result
        ]

    # Use environment variables for configuration
    config = DatasetConfig()

    generator = SyntheticDatasetGenerator(config)
    examples = generator.process_documents(documents)  # Pass documents list
    return examples


if __name__ == "__main__":
    # Create test dataset
    # examples = create_test_dataset()
    examples = get_policy_dataset()
    logging.info(f"Generated {len(examples)} synthetic examples")

    for ex in examples:
        logging.info(f"Q: {ex.prompt}")
        logging.info(f"A: {ex.expected_output}")
        logging.info(f"Context: {ex.context}")
        logging.info("\n")


from docling.document_converter import DocumentConverter

converter = DocumentConverter()

# document per local path or URL
source = "https://policy.ucop.edu/doc/4000701/AbusiveConduct"
result = converter.convert(source)

# output: "## Docling Technical Report[...]"
print(result.document.export_to_markdown())

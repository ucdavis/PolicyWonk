import marimo

__generated_with = "0.11.2"
app = marimo.App(width="medium")


@app.cell
def _():
    from docling.document_converter import DocumentConverter
    return (DocumentConverter,)


@app.cell
def _(DocumentConverter):
    converter = DocumentConverter()
    return (converter,)


@app.cell
def _(converter):
    source = "https://policy.ucop.edu/doc/4000701/AbusiveConduct"  # document per local path or URL
    result = converter.convert(source)
    return result, source


@app.cell
def _(result):
    print(result.document.export_to_markdown())  # output: "## Docling Technical Report[...]"
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()

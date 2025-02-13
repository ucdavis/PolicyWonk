import marimo

__generated_with = "0.11.2"
app = marimo.App()


@app.cell
def _():
    import marimo as mo
    import requests
    import pymupdf4llm
    import pymupdf
    import tempfile
    return mo, pymupdf, pymupdf4llm, requests, tempfile


@app.cell
def _(pymupdf, requests, tempfile):
    url = requests.get('https://policy.ucop.edu/doc/4000701/AbusiveConduct')

    pdf = None

    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp.write(url.content)
        temp.seek(0)
        pdf = pymupdf.open(temp.name)
    return pdf, temp, url


@app.cell
def _(pdf, pymupdf4llm):
    md_text_1 = pymupdf4llm.to_markdown(pdf, pages=[0])
    return (md_text_1,)


@app.cell
def _(md_text_1):
    print(md_text_1)
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()

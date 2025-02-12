import marimo

__generated_with = "0.11.2"
app = marimo.App()


@app.cell
def _():
    import asyncio
    from playwright.async_api import async_playwright

    return async_playwright, asyncio


@app.cell
def _(async_playwright):
    async def run():
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            await page.goto("https://example.com")
            html = await page.content()
            print(html)
            await browser.close()
    return (run,)


@app.cell
async def _(run):
    await run()
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()

from pathlib import Path
import os
import re
import csv

from playwright.sync_api import sync_playwright, expect


def main():
    screenshot_path = Path("verification-dashboard.png").resolve()
    base_url = os.environ.get("DRAGON_TRACKER_URL", "http://127.0.0.1:3000")
    source_csv = Path("data/dragons.csv").resolve()
    with source_csv.open(newline="", encoding="utf-8") as csv_file:
        baseline_count = sum(1 for _ in csv.DictReader(csv_file))

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto(base_url, wait_until="networkidle")

        expect(page.locator("#stat-total")).to_have_text(str(baseline_count))
        expect(page.locator("#element-chart svg")).to_be_visible()
        expect(page.locator("#element-chart svg")).to_have_attribute("aria-label", re.compile(r"Fire: 1"))
        expect(page.get_by_role("row", name=re.compile(r"Ember DRG-001"))).to_be_visible()
        shadow_scale = page.get_by_role("row", name=re.compile(r"Shadow Scale DRG-006.*Celestial.*Common"))
        expect(shadow_scale).to_be_visible()

        page.get_by_role("button", name="Add dragon").click()
        expect(page.locator("#dragon-modal")).to_be_visible()
        page.locator("#dragon-form input[name='name']").fill("Test Comet")
        page.locator("#dragon-form input[name='species']").fill("Sky Drake")
        page.locator("#dragon-form input[name='element']").fill("Air")
        page.locator("#dragon-form input[name='health']").fill("88")
        page.locator("#dragon-form input[name='account']").fill("Verifier")
        page.get_by_role("button", name="Save record").click()

        expect(page.locator("#dragon-modal")).to_be_hidden()
        expect(page.locator("#stat-total")).to_have_text(str(baseline_count + 1))
        expect(page.locator("#element-chart svg")).to_have_attribute("aria-label", re.compile(r"Air: 2"))
        expect(page.get_by_role("row", name=re.compile(r"Test Comet"))).to_be_visible()

        page.reload(wait_until="networkidle")
        expect(page.locator("#stat-total")).to_have_text(str(baseline_count + 1))
        expect(page.get_by_role("row", name=re.compile(r"Test Comet"))).to_be_visible()

        export_response = page.request.get(f"{base_url}/api/export")
        assert export_response.ok
        assert "text/csv" in export_response.headers["content-type"]
        assert "Test Comet" in export_response.text()

        page.get_by_role("button", name="Import sheet").click()
        page.locator("#sheet-url").fill("https://example.com/not-a-sheet")
        page.get_by_role("button", name="Import records").click()
        expect(page.locator("#import-form-error")).to_contain_text("must come from a Google Sheets URL")

        page.locator("#import-modal").get_by_role("button", name="Cancel").click()
        page.get_by_role("button", name="Import sheet").click()
        page.locator("#csv-file").set_input_files(str(source_csv))
        expect(page.locator("#csv-file-label")).to_have_text("dragons.csv")
        page.get_by_role("button", name="Import records").click()
        expect(page.locator("#import-form-success")).to_contain_text("updated")
        expect(page.locator("#stat-total")).to_have_text(str(baseline_count + 1))

        page.on("dialog", lambda dialog: dialog.accept())
        page.locator("#import-modal").get_by_role("button", name="Cancel").click()
        page.get_by_role("button", name="Delete Test Comet").click()
        expect(page.locator("#stat-total")).to_have_text(str(baseline_count))
        expect(page.get_by_role("row", name=re.compile(r"Test Comet"))).not_to_be_visible()

        page.screenshot(path=str(screenshot_path), full_page=True)
        browser.close()

    print(f"Verified dashboard, CRUD persistence, chart redraw, CSV export, downloaded CSV upload, and sheet URL validation. Screenshot: {screenshot_path}")


if __name__ == "__main__":
    main()

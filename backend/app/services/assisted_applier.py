"""Assisted apply service — fills forms but pauses at review for human submission.

Unlike the full JobApplier which auto-submits, this service:
1. Opens the application URL in Playwright
2. Fills form fields with user profile data
3. Navigates to the review/submit step
4. Takes a screenshot and STOPS — returning the browser state for the user
"""
import asyncio
import logging
import os
import random
import re
from datetime import datetime, timezone
from typing import Optional

from playwright.async_api import Page

from app.services.linkedin_scraper import LinkedInScraper

logger = logging.getLogger(__name__)


class AssistedApplier:
    """Fills job applications but stops before final submit."""

    SCREENSHOT_DIR = os.environ.get("SCREENSHOT_DIR", "/tmp/job_agent_screenshots")

    def __init__(self, scraper: LinkedInScraper):
        self.scraper = scraper
        os.makedirs(self.SCREENSHOT_DIR, mode=0o700, exist_ok=True)

    async def prepare_application(self, job: dict, user_profile: dict) -> dict:
        """Fill out an application form and pause at the review step.

        Returns:
            dict with keys:
                status: "ready_for_review" | "external_redirect" | "error"
                message: Human-readable status
                apply_url: URL the user should open to review and submit
                screenshot: Path to screenshot of current state (if available)
        """
        apply_url = job.get("apply_url", "") or job.get("job_url", "")
        if not apply_url:
            return {"status": "error", "message": "No application URL provided"}

        if not apply_url.startswith("https://"):
            return {"status": "error", "message": "Invalid application URL"}

        # For external application URLs, just return the URL for the user
        is_linkedin = "linkedin.com" in apply_url
        if not is_linkedin:
            return {
                "status": "external_redirect",
                "message": "This job applies on the company's site. Click the link to apply.",
                "apply_url": apply_url,
            }

        # LinkedIn Easy Apply — fill but don't submit
        try:
            page = self.scraper.page
            if not page:
                return {
                    "status": "external_redirect",
                    "message": "Browser not available. Open this link to apply directly.",
                    "apply_url": apply_url,
                }

            await page.goto(apply_url, wait_until="domcontentloaded")
            await asyncio.sleep(random.uniform(2.0, 4.0))

            # Look for Easy Apply button
            easy_apply_btn = await page.query_selector("button.jobs-apply-button")
            if not easy_apply_btn:
                easy_apply_btn = await page.query_selector('button[aria-label*="Easy Apply"]')

            if not easy_apply_btn:
                return {
                    "status": "external_redirect",
                    "message": "No Easy Apply found. Open this link to apply directly.",
                    "apply_url": apply_url,
                }

            await easy_apply_btn.click()
            await asyncio.sleep(random.uniform(1.5, 3.0))

            # Fill form fields through the multi-step flow
            max_steps = 10
            for step in range(max_steps):
                await self._fill_form_fields(page, user_profile)
                await asyncio.sleep(random.uniform(0.5, 1.5))

                # Check for submit button — if found, STOP here
                submit_btn = await page.query_selector('button[aria-label="Submit application"]')
                if not submit_btn:
                    submit_btn = await page.query_selector('button[aria-label="Review your application"]')

                if submit_btn:
                    btn_text = (await submit_btn.inner_text()).strip().lower()
                    if "review" in btn_text:
                        await submit_btn.click()
                        await asyncio.sleep(random.uniform(1.0, 2.0))
                        # Now on review page — take screenshot and stop
                        screenshot = await self._capture_screenshot(page, job, "review")
                        return {
                            "status": "ready_for_review",
                            "message": "Application filled and ready for your review. Open LinkedIn to submit.",
                            "apply_url": apply_url,
                            "screenshot": screenshot,
                        }
                    elif "submit" in btn_text:
                        # On the submit page — DO NOT click, take screenshot
                        screenshot = await self._capture_screenshot(page, job, "ready")
                        return {
                            "status": "ready_for_review",
                            "message": "Application is filled out and ready to submit. Open LinkedIn to review and click Submit.",
                            "apply_url": apply_url,
                            "screenshot": screenshot,
                        }

                # Click next to continue through form steps
                next_btn = await page.query_selector('button[aria-label="Continue to next step"]')
                if not next_btn:
                    next_btn = await page.query_selector('button[data-easy-apply-next-button]')
                if not next_btn:
                    next_btn = await page.query_selector("footer button.artdeco-button--primary")

                if next_btn:
                    await next_btn.click()
                    await asyncio.sleep(random.uniform(1.0, 2.5))
                else:
                    break

            screenshot = await self._capture_screenshot(page, job, "stuck")
            return {
                "status": "ready_for_review",
                "message": "Application partially filled. Please open LinkedIn to complete and submit.",
                "apply_url": apply_url,
                "screenshot": screenshot,
            }

        except Exception as e:
            logger.error(f"Assisted apply failed: {e}")
            return {
                "status": "external_redirect",
                "message": "Could not auto-fill. Open this link to apply manually.",
                "apply_url": apply_url,
            }

    async def _fill_form_fields(self, page: Page, user_profile: dict):
        """Fill common form fields with user profile data."""
        field_mappings = {
            "first name": user_profile.get("name", "").split()[0] if user_profile.get("name") else "",
            "last name": " ".join(user_profile.get("name", "").split()[1:]) if user_profile.get("name") else "",
            "full name": user_profile.get("name", ""),
            "email": user_profile.get("email", ""),
            "phone": user_profile.get("phone", ""),
            "city": user_profile.get("location", ""),
            "linkedin": f"https://www.linkedin.com/in/{user_profile.get('linkedin_id', '')}",
            "headline": user_profile.get("headline", ""),
        }

        inputs = await page.query_selector_all("input[type='text'], input[type='email'], input[type='tel']")
        for input_el in inputs:
            try:
                label_text = ""
                input_id = await input_el.get_attribute("id")
                if input_id:
                    label_el = await page.query_selector(f'label[for="{input_id}"]')
                    if label_el:
                        label_text = (await label_el.inner_text()).strip().lower()

                if not label_text:
                    placeholder = await input_el.get_attribute("placeholder")
                    if placeholder:
                        label_text = placeholder.lower()

                if not label_text:
                    aria_label = await input_el.get_attribute("aria-label")
                    if aria_label:
                        label_text = aria_label.lower()

                current_value = await input_el.input_value()
                if current_value:
                    continue

                for field_key, field_value in field_mappings.items():
                    if field_key in label_text and field_value:
                        await input_el.fill("")
                        await asyncio.sleep(random.uniform(0.1, 0.3))
                        for char in field_value:
                            await input_el.type(char, delay=random.randint(30, 100))
                        break
            except Exception as e:
                logger.debug(f"Could not fill input field: {e}")

    async def _capture_screenshot(self, page: Page, job: dict, stage: str) -> Optional[str]:
        """Capture a screenshot of the current application state."""
        try:
            raw_id = str(job.get("linkedin_job_id", job.get("source_id", "unknown")))
            clean_id = re.sub(r'[^a-zA-Z0-9_-]', '', raw_id)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            filename = f"{stage}_{clean_id}_{timestamp}.png"
            filepath = os.path.join(self.SCREENSHOT_DIR, filename)

            real_path = os.path.realpath(filepath)
            if not real_path.startswith(os.path.realpath(self.SCREENSHOT_DIR) + os.sep):
                return None

            await page.screenshot(path=filepath, full_page=True)
            return filepath
        except Exception as e:
            logger.warning(f"Screenshot failed: {e}")
            return None

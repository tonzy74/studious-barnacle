import asyncio
import logging
import os
import random
import re
from datetime import datetime, timezone
from typing import Optional

from playwright.async_api import Page, async_playwright

from app.services.captcha_solver import CaptchaSolver

logger = logging.getLogger(__name__)


class JobApplier:
    """Playwright-based job application automation for external company sites."""

    SCREENSHOT_DIR = os.environ.get("SCREENSHOT_DIR", "/tmp/job_agent_screenshots")

    def __init__(self, captcha_solver: Optional[CaptchaSolver] = None):
        self.captcha_solver = captcha_solver
        self._playwright = None
        self._browser = None
        self._page: Optional[Page] = None
        os.makedirs(self.SCREENSHOT_DIR, mode=0o700, exist_ok=True)

    async def _ensure_browser(self):
        """Initialize Playwright browser if not already running."""
        if self._page is not None:
            return
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(headless=True)
        context = await self._browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        self._page = await context.new_page()

    async def close(self):
        """Close browser and Playwright."""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        self._page = None

    async def fill_application(self, job: dict, user_profile: dict) -> dict:
        """
        Navigate to a job posting and fill out the application form.

        Accepts any valid HTTP(S) job URL (company careers pages, ATS systems
        like Greenhouse, Lever, Workday, etc.).

        Returns a result dict with status, message, and optional screenshot path.
        """
        job_url = job.get("job_url", "")
        if not job_url:
            return {"status": "error", "message": "No job URL provided"}

        if not job_url.startswith("https://") and not job_url.startswith("http://"):
            return {"status": "error", "message": "Invalid job URL"}

        try:
            await self._ensure_browser()
            page = self._page
            if not page:
                return {"status": "error", "message": "Browser not initialized"}

            await page.goto(job_url, wait_until="domcontentloaded")
            await asyncio.sleep(random.uniform(2.0, 4.0))

            if self.captcha_solver:
                captcha_detected = await self.captcha_solver.detect_captcha(page)
                if captcha_detected:
                    solved = await self.captcha_solver.solve_captcha(page, "generic")
                    if not solved:
                        return {
                            "status": "captcha_required",
                            "message": "Captcha detected and could not be solved automatically",
                        }

            # Fill form fields on the page
            await self._fill_form_fields(page, user_profile)

            # Try to find and click submit button
            submit_btn = await page.query_selector(
                'button[type="submit"]'
            )
            if not submit_btn:
                submit_btn = await page.query_selector(
                    'input[type="submit"]'
                )

            if submit_btn:
                await submit_btn.click()
                await asyncio.sleep(random.uniform(2.0, 4.0))
                return {
                    "status": "applied",
                    "message": "Application submitted on external site",
                    "applied_at": datetime.now(timezone.utc).isoformat(),
                }

            return {
                "status": "error",
                "message": "Could not find submit button on application page",
            }

        except Exception as e:
            screenshot_path = await self._capture_error_screenshot(self._page, job)
            logger.error(f"Application failed for job {job.get('source_job_id')}: {e}")
            return {
                "status": "error",
                "message": str(e),
                "screenshot": screenshot_path,
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
            "location": user_profile.get("location", ""),
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
                continue

        textareas = await page.query_selector_all("textarea")
        for textarea in textareas:
            try:
                current_value = await textarea.input_value()
                if current_value:
                    continue

                label_text = ""
                ta_id = await textarea.get_attribute("id")
                if ta_id:
                    label_el = await page.query_selector(f'label[for="{ta_id}"]')
                    if label_el:
                        label_text = (await label_el.inner_text()).strip().lower()

                if "cover" in label_text or "summary" in label_text:
                    summary = user_profile.get("headline", "Experienced professional seeking new opportunities.")
                    await textarea.fill(summary)
            except Exception as e:
                logger.debug(f"Could not fill textarea: {e}")
                continue

        resume_input = await page.query_selector('input[type="file"]')
        if resume_input:
            resume_path = user_profile.get("resume_path")
            if resume_path and os.path.exists(resume_path):
                allowed_dir = os.path.realpath(
                    os.environ.get("RESUME_UPLOAD_DIR", "/app/uploads/resumes")
                )
                real_path = os.path.realpath(resume_path)
                if real_path.startswith(allowed_dir + os.sep):
                    await resume_input.set_input_files(resume_path)
                else:
                    logger.warning(f"Resume path traversal blocked: {resume_path}")

        # Handle select fields
        selects = await page.query_selector_all("select")
        for select_el in selects:
            try:
                options = await select_el.query_selector_all("option")
                if len(options) > 1:
                    label_text = ""
                    select_id = await select_el.get_attribute("id")
                    if select_id:
                        label_el = await page.query_selector(f'label[for="{select_id}"]')
                        if label_el:
                            label_text = (await label_el.inner_text()).strip().lower()

                    if "country" in label_text or "location" in label_text:
                        for option in options:
                            opt_text = (await option.inner_text()).strip().lower()
                            if "united states" in opt_text or "us" == opt_text:
                                value = await option.get_attribute("value")
                                if value:
                                    await select_el.select_option(value=value)
                                break

                    elif "experience" in label_text or "years" in label_text:
                        experience = user_profile.get("experience", [])
                        total_years = sum(
                            int(e.get("years", 0)) for e in experience if isinstance(e, dict)
                        )
                        for option in options:
                            opt_text = (await option.inner_text()).strip()
                            if str(total_years) in opt_text:
                                value = await option.get_attribute("value")
                                if value:
                                    await select_el.select_option(value=value)
                                break
            except Exception as e:
                logger.debug(f"Could not fill select field: {e}")
                continue

    async def _capture_error_screenshot(self, page: Optional[Page], job: dict) -> Optional[str]:
        """Capture a screenshot on application failure for debugging."""
        if not page:
            return None
        try:
            raw_job_id = str(job.get("source_job_id", "unknown"))
            job_id = re.sub(r'[^a-zA-Z0-9_-]', '', raw_job_id)
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            filename = f"error_{job_id}_{timestamp}.png"
            filepath = os.path.join(self.SCREENSHOT_DIR, filename)
            real_path = os.path.realpath(filepath)
            if not real_path.startswith(os.path.realpath(self.SCREENSHOT_DIR) + os.sep):
                logger.warning(f"Screenshot path traversal blocked: {filepath}")
                return None
            await page.screenshot(path=filepath, full_page=True)
            logger.info(f"Error screenshot saved: {filename}")
            return filepath
        except Exception as e:
            logger.warning(f"Failed to capture error screenshot: {e}")
            return None

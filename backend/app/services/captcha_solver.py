import asyncio
import logging
from typing import Optional

import httpx
from playwright.async_api import Page

logger = logging.getLogger(__name__)


class CaptchaSolver:
    """Captcha detection and solving service supporting 2Captcha/Anti-Captcha APIs."""

    TWOCAPTCHA_API = "https://2captcha.com/in.php"
    TWOCAPTCHA_RESULT_API = "https://2captcha.com/res.php"
    POLL_INTERVAL = 5
    MAX_WAIT_SECONDS = 120

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def detect_captcha(self, page: Page) -> bool:
        """Detect if a captcha challenge is present on the page."""
        captcha_selectors = [
            "iframe[src*='recaptcha']",
            "iframe[src*='hcaptcha']",
            "div.g-recaptcha",
            "div.h-captcha",
            "#captcha",
            "div[class*='captcha']",
            "iframe[title*='captcha']",
            "iframe[title*='challenge']",
            "div.arkose-challenge",
            "#cf-challenge-running",
        ]

        for selector in captcha_selectors:
            element = await page.query_selector(selector)
            if element:
                is_visible = await element.is_visible()
                if is_visible:
                    logger.info(f"Captcha detected via selector: {selector}")
                    return True

        page_text = await page.inner_text("body")
        captcha_keywords = [
            "verify you are human",
            "security check",
            "complete the captcha",
            "prove you're not a robot",
            "i'm not a robot",
        ]
        page_text_lower = page_text.lower()
        for keyword in captcha_keywords:
            if keyword in page_text_lower:
                logger.info(f"Captcha detected via keyword: {keyword}")
                return True

        return False

    async def solve_captcha(self, page: Page, captcha_type: str = "generic") -> bool:
        """
        Attempt to solve a captcha using the configured service.

        Returns True if solved, False if manual intervention is needed.
        """
        if not self.api_key:
            logger.warning("No captcha API key configured, manual solving required")
            return False

        recaptcha_frame = await page.query_selector("iframe[src*='recaptcha']")
        if recaptcha_frame:
            return await self._solve_recaptcha(page)

        hcaptcha_frame = await page.query_selector("iframe[src*='hcaptcha']")
        if hcaptcha_frame:
            return await self._solve_hcaptcha(page)

        return await self._solve_generic_captcha(page)

    async def _solve_recaptcha(self, page: Page) -> bool:
        """Solve a reCAPTCHA v2 challenge using 2Captcha API."""
        try:
            sitekey = await page.evaluate("""
                () => {
                    const el = document.querySelector('.g-recaptcha');
                    return el ? el.getAttribute('data-sitekey') : null;
                }
            """)

            if not sitekey:
                recaptcha_frame = await page.query_selector("iframe[src*='recaptcha']")
                if recaptcha_frame:
                    src = await recaptcha_frame.get_attribute("src")
                    if src and "k=" in src:
                        sitekey = src.split("k=")[1].split("&")[0]

            if not sitekey:
                logger.error("Could not extract reCAPTCHA sitekey")
                return False

            page_url = page.url

            async with httpx.AsyncClient(timeout=30.0) as client:
                submit_response = await client.post(
                    self.TWOCAPTCHA_API,
                    data={
                        "key": self.api_key,
                        "method": "userrecaptcha",
                        "googlekey": sitekey,
                        "pageurl": page_url,
                        "json": 1,
                    },
                )

                result = submit_response.json()
                if result.get("status") != 1:
                    logger.error(f"2Captcha submission failed: {result}")
                    return False

                task_id = result["request"]

                elapsed = 0
                while elapsed < self.MAX_WAIT_SECONDS:
                    await asyncio.sleep(self.POLL_INTERVAL)
                    elapsed += self.POLL_INTERVAL

                    check_response = await client.get(
                        self.TWOCAPTCHA_RESULT_API,
                        params={
                            "key": self.api_key,
                            "action": "get",
                            "id": task_id,
                            "json": 1,
                        },
                    )

                    check_result = check_response.json()
                    if check_result.get("status") == 1:
                        captcha_solution = check_result["request"]
                        await page.evaluate(
                            f"""
                            (solution) => {{
                                document.getElementById('g-recaptcha-response').innerHTML = solution;
                                if (typeof ___grecaptcha_cfg !== 'undefined') {{
                                    Object.keys(___grecaptcha_cfg.clients).forEach(key => {{
                                        const client = ___grecaptcha_cfg.clients[key];
                                        if (client && client.callback) {{
                                            client.callback(solution);
                                        }}
                                    }});
                                }}
                            }}
                            """,
                            captcha_solution,
                        )
                        logger.info("reCAPTCHA solved successfully")
                        return True
                    elif check_result.get("request") == "CAPCHA_NOT_READY":
                        continue
                    else:
                        logger.error(f"2Captcha solving failed: {check_result}")
                        return False

            logger.error("Captcha solving timed out")
            return False

        except Exception as e:
            logger.error(f"Error solving reCAPTCHA: {e}")
            return False

    async def _solve_hcaptcha(self, page: Page) -> bool:
        """Solve an hCaptcha challenge using 2Captcha API."""
        try:
            sitekey = await page.evaluate("""
                () => {
                    const el = document.querySelector('.h-captcha');
                    return el ? el.getAttribute('data-sitekey') : null;
                }
            """)

            if not sitekey:
                hcaptcha_frame = await page.query_selector("iframe[src*='hcaptcha']")
                if hcaptcha_frame:
                    src = await hcaptcha_frame.get_attribute("src")
                    if src and "sitekey=" in src:
                        sitekey = src.split("sitekey=")[1].split("&")[0]

            if not sitekey:
                logger.error("Could not extract hCaptcha sitekey")
                return False

            page_url = page.url

            async with httpx.AsyncClient(timeout=30.0) as client:
                submit_response = await client.post(
                    self.TWOCAPTCHA_API,
                    data={
                        "key": self.api_key,
                        "method": "hcaptcha",
                        "sitekey": sitekey,
                        "pageurl": page_url,
                        "json": 1,
                    },
                )

                result = submit_response.json()
                if result.get("status") != 1:
                    logger.error(f"2Captcha hCaptcha submission failed: {result}")
                    return False

                task_id = result["request"]

                elapsed = 0
                while elapsed < self.MAX_WAIT_SECONDS:
                    await asyncio.sleep(self.POLL_INTERVAL)
                    elapsed += self.POLL_INTERVAL

                    check_response = await client.get(
                        self.TWOCAPTCHA_RESULT_API,
                        params={
                            "key": self.api_key,
                            "action": "get",
                            "id": task_id,
                            "json": 1,
                        },
                    )

                    check_result = check_response.json()
                    if check_result.get("status") == 1:
                        captcha_solution = check_result["request"]
                        await page.evaluate(
                            f"""
                            (solution) => {{
                                const textarea = document.querySelector('[name="h-captcha-response"]');
                                if (textarea) textarea.value = solution;
                                const textarea2 = document.querySelector('[name="g-recaptcha-response"]');
                                if (textarea2) textarea2.value = solution;
                            }}
                            """,
                            captcha_solution,
                        )
                        logger.info("hCaptcha solved successfully")
                        return True
                    elif check_result.get("request") == "CAPCHA_NOT_READY":
                        continue
                    else:
                        logger.error(f"2Captcha hCaptcha solving failed: {check_result}")
                        return False

            logger.error("hCaptcha solving timed out")
            return False

        except Exception as e:
            logger.error(f"Error solving hCaptcha: {e}")
            return False

    async def _solve_generic_captcha(self, page: Page) -> bool:
        """Attempt to solve a generic/unknown captcha type."""
        logger.warning(
            "Generic captcha detected - automated solving not supported for this type. "
            "User manual intervention required."
        )
        return False

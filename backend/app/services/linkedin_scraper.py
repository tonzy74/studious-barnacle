import asyncio
import logging
import random
import re
from typing import Optional
from urllib.parse import urlencode

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

logger = logging.getLogger(__name__)


class LinkedInScraper:
    """Playwright-based LinkedIn profile and job scraper with anti-detection measures."""

    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    ]

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

    async def _init_browser(self):
        """Initialize a Playwright browser with anti-detection settings."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        user_agent = random.choice(self.USER_AGENTS)
        self.context = await self.browser.new_context(
            user_agent=user_agent,
            viewport={"width": 1366, "height": 768},
            locale="en-US",
            timezone_id="America/New_York",
            java_script_enabled=True,
        )

        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            window.chrome = { runtime: {} };
        """)

        self.page = await self.context.new_page()

    async def _random_delay(self, min_seconds: float = 1.0, max_seconds: float = 3.0):
        """Introduce a random delay to mimic human behavior."""
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)

    async def _human_scroll(self, page: Page, scroll_count: int = 3):
        """Scroll the page in a human-like fashion."""
        for _ in range(scroll_count):
            scroll_amount = random.randint(200, 600)
            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            await self._random_delay(0.5, 1.5)

    async def login_with_session(self, session_cookies: list[dict]) -> bool:
        """Resume an authenticated LinkedIn session using stored cookies."""
        try:
            if not self.browser:
                await self._init_browser()

            await self.context.add_cookies(session_cookies)
            await self.page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
            await self._random_delay(2.0, 4.0)

            logged_in = await self.page.query_selector('div[data-control-name="identity_welcome_message"]') is not None
            if not logged_in:
                logged_in = await self.page.query_selector(".feed-identity-module") is not None
            if not logged_in:
                current_url = self.page.url
                logged_in = "/feed" in current_url and "login" not in current_url

            return logged_in
        except Exception as e:
            logger.error(f"Failed to login with session cookies: {e}")
            return False

    async def scrape_profile(self, profile_url: str) -> Optional[dict]:
        """Scrape a LinkedIn profile page for complete profile data."""
        try:
            if not self.page:
                await self._init_browser()

            await self.page.goto(profile_url, wait_until="domcontentloaded")
            await self._random_delay(2.0, 4.0)
            await self._human_scroll(self.page, scroll_count=5)

            profile_data = {}

            name_el = await self.page.query_selector("h1.text-heading-xlarge")
            profile_data["name"] = await name_el.inner_text() if name_el else ""

            headline_el = await self.page.query_selector("div.text-body-medium.break-words")
            profile_data["headline"] = await headline_el.inner_text() if headline_el else ""

            location_el = await self.page.query_selector("span.text-body-small.inline.t-black--light.break-words")
            profile_data["location"] = await location_el.inner_text() if location_el else ""

            profile_data["experience"] = await self._scrape_experience()
            profile_data["skills"] = await self._scrape_skills()
            profile_data["education"] = await self._scrape_education()
            profile_data["certifications"] = await self._scrape_certifications()

            about_el = await self.page.query_selector(
                "section.artdeco-card div.display-flex.ph5.pv3 span.visually-hidden + span"
            )
            profile_data["about"] = await about_el.inner_text() if about_el else ""

            return profile_data
        except Exception as e:
            logger.error(f"Failed to scrape profile {profile_url}: {e}")
            return None

    async def _scrape_experience(self) -> list[dict]:
        """Extract experience entries from the profile page."""
        experiences = []
        try:
            exp_section = await self.page.query_selector("#experience")
            if not exp_section:
                return experiences

            parent = await exp_section.query_selector("xpath=..")
            if not parent:
                return experiences

            items = await parent.query_selector_all("li.artdeco-list__item")
            for item in items:
                title_el = await item.query_selector(
                    "div.display-flex.align-items-center span.mr1 span"
                )
                company_el = await item.query_selector(
                    "span.t-14.t-normal span"
                )
                duration_el = await item.query_selector(
                    "span.t-14.t-normal.t-black--light span"
                )
                desc_el = await item.query_selector(
                    "div.display-flex.align-items-center.t-14 span"
                )

                experience = {
                    "title": (await title_el.inner_text()).strip() if title_el else "",
                    "company": (await company_el.inner_text()).strip() if company_el else "",
                    "duration": (await duration_el.inner_text()).strip() if duration_el else "",
                    "description": (await desc_el.inner_text()).strip() if desc_el else "",
                }
                if experience["title"]:
                    experiences.append(experience)
        except Exception as e:
            logger.warning(f"Error scraping experience: {e}")
        return experiences

    async def _scrape_skills(self) -> list[str]:
        """Extract skills from the profile page."""
        skills = []
        try:
            skills_section = await self.page.query_selector("#skills")
            if not skills_section:
                return skills

            parent = await skills_section.query_selector("xpath=..")
            if not parent:
                return skills

            skill_items = await parent.query_selector_all(
                "li.artdeco-list__item span.mr1 span"
            )
            for item in skill_items:
                text = (await item.inner_text()).strip()
                if text:
                    skills.append(text)
        except Exception as e:
            logger.warning(f"Error scraping skills: {e}")
        return skills

    async def _scrape_education(self) -> list[dict]:
        """Extract education entries from the profile page."""
        education = []
        try:
            edu_section = await self.page.query_selector("#education")
            if not edu_section:
                return education

            parent = await edu_section.query_selector("xpath=..")
            if not parent:
                return education

            items = await parent.query_selector_all("li.artdeco-list__item")
            for item in items:
                school_el = await item.query_selector(
                    "div.display-flex.align-items-center span.mr1 span"
                )
                degree_el = await item.query_selector(
                    "span.t-14.t-normal span"
                )
                dates_el = await item.query_selector(
                    "span.t-14.t-normal.t-black--light span"
                )

                entry = {
                    "school": (await school_el.inner_text()).strip() if school_el else "",
                    "degree": (await degree_el.inner_text()).strip() if degree_el else "",
                    "dates": (await dates_el.inner_text()).strip() if dates_el else "",
                }
                if entry["school"]:
                    education.append(entry)
        except Exception as e:
            logger.warning(f"Error scraping education: {e}")
        return education

    async def _scrape_certifications(self) -> list[dict]:
        """Extract certifications from the profile page."""
        certifications = []
        try:
            cert_section = await self.page.query_selector("#licenses_and_certifications")
            if not cert_section:
                return certifications

            parent = await cert_section.query_selector("xpath=..")
            if not parent:
                return certifications

            items = await parent.query_selector_all("li.artdeco-list__item")
            for item in items:
                name_el = await item.query_selector(
                    "div.display-flex.align-items-center span.mr1 span"
                )
                issuer_el = await item.query_selector(
                    "span.t-14.t-normal span"
                )

                entry = {
                    "name": (await name_el.inner_text()).strip() if name_el else "",
                    "issuer": (await issuer_el.inner_text()).strip() if issuer_el else "",
                }
                if entry["name"]:
                    certifications.append(entry)
        except Exception as e:
            logger.warning(f"Error scraping certifications: {e}")
        return certifications

    async def search_jobs(self, criteria: dict) -> list[dict]:
        """Search LinkedIn jobs based on provided criteria."""
        jobs = []
        try:
            if not self.page:
                await self._init_browser()

            titles = criteria.get("target_titles", [])
            location = criteria.get("location", "")
            remote_ok = criteria.get("remote_ok", True)

            for title in titles:
                search_url = "https://www.linkedin.com/jobs/search/?"
                params = {
                    "keywords": title,
                    "location": location,
                    "sortBy": "DD",
                }
                if remote_ok:
                    params["f_WT"] = "2"

                full_url = search_url + urlencode(params)

                await self.page.goto(full_url, wait_until="domcontentloaded")
                await self._random_delay(2.0, 4.0)
                await self._human_scroll(self.page, scroll_count=3)

                job_cards = await self.page.query_selector_all(
                    "div.job-search-card"
                )

                for card in job_cards:
                    try:
                        title_el = await card.query_selector("h3.base-search-card__title")
                        company_el = await card.query_selector("h4.base-search-card__subtitle a")
                        location_el = await card.query_selector("span.job-search-card__location")
                        link_el = await card.query_selector("a.base-card__full-link")

                        job_title = (await title_el.inner_text()).strip() if title_el else ""
                        company = (await company_el.inner_text()).strip() if company_el else ""
                        job_location = (await location_el.inner_text()).strip() if location_el else ""
                        job_url = await link_el.get_attribute("href") if link_el else ""

                        linkedin_job_id = ""
                        if job_url:
                            id_match = re.search(r"/view/(\d+)", job_url)
                            if id_match:
                                linkedin_job_id = id_match.group(1)

                        if job_title and company:
                            jobs.append({
                                "linkedin_job_id": linkedin_job_id,
                                "title": job_title,
                                "company": company,
                                "location": job_location,
                                "job_url": job_url,
                                "search_title": title,
                            })
                    except Exception as card_error:
                        logger.warning(f"Error parsing job card: {card_error}")
                        continue

                await self._random_delay(1.0, 3.0)

        except Exception as e:
            logger.error(f"Failed to search jobs: {e}")
        return jobs

    async def get_job_details(self, job_url: str) -> Optional[dict]:
        """Scrape full job posting details from a job URL."""
        try:
            if not self.page:
                await self._init_browser()

            await self.page.goto(job_url, wait_until="domcontentloaded")
            await self._random_delay(2.0, 4.0)
            await self._human_scroll(self.page, scroll_count=3)

            details = {}

            title_el = await self.page.query_selector("h1.t-24.t-bold.inline")
            if not title_el:
                title_el = await self.page.query_selector("h2.t-24.t-bold")
            details["title"] = (await title_el.inner_text()).strip() if title_el else ""

            company_el = await self.page.query_selector(
                "a.ember-view.t-black.t-normal span"
            )
            if not company_el:
                company_el = await self.page.query_selector("span.jobs-unified-top-card__company-name a")
            details["company"] = (await company_el.inner_text()).strip() if company_el else ""

            location_el = await self.page.query_selector(
                "span.jobs-unified-top-card__bullet"
            )
            details["location"] = (await location_el.inner_text()).strip() if location_el else ""

            desc_el = await self.page.query_selector(
                "div.jobs-description__content div.jobs-box__html-content"
            )
            if not desc_el:
                desc_el = await self.page.query_selector("div.show-more-less-html__markup")
            details["description"] = (await desc_el.inner_text()).strip() if desc_el else ""

            salary_el = await self.page.query_selector(
                "div.jobs-unified-top-card__job-insight span"
            )
            salary_text = (await salary_el.inner_text()).strip() if salary_el else ""
            details["salary_min"], details["salary_max"] = self._parse_salary(salary_text)

            details["remote_type"] = "onsite"
            workplace_el = await self.page.query_selector(
                "span.jobs-unified-top-card__workplace-type"
            )
            if workplace_el:
                workplace_text = (await workplace_el.inner_text()).strip().lower()
                if "remote" in workplace_text:
                    details["remote_type"] = "remote"
                elif "hybrid" in workplace_text:
                    details["remote_type"] = "hybrid"

            criteria_els = await self.page.query_selector_all(
                "li.jobs-unified-top-card__job-insight span"
            )
            seniority = ""
            for el in criteria_els:
                text = (await el.inner_text()).strip().lower()
                if any(level in text for level in ["entry", "associate", "mid", "senior", "director", "executive"]):
                    seniority = text
                    break
            details["seniority_level"] = seniority

            requirements = []
            req_items = await self.page.query_selector_all(
                "div.jobs-description__content ul li"
            )
            for req in req_items:
                text = (await req.inner_text()).strip()
                if text:
                    requirements.append(text)
            details["requirements"] = "\n".join(requirements)

            return details
        except Exception as e:
            logger.error(f"Failed to get job details for {job_url}: {e}")
            return None

    async def get_linkedin_match_score(self, job_url: str) -> Optional[float]:
        """Extract LinkedIn Premium match percentage from a job posting."""
        try:
            if not self.page:
                await self._init_browser()

            await self.page.goto(job_url, wait_until="domcontentloaded")
            await self._random_delay(2.0, 4.0)

            match_el = await self.page.query_selector(
                "span.job-details-how-you-match__skills-item-subtitle"
            )
            if not match_el:
                match_el = await self.page.query_selector(
                    "div.job-details-how-you-match span"
                )

            if match_el:
                text = (await match_el.inner_text()).strip()
                match = re.search(r"(\d+)%?", text)
                if match:
                    return float(match.group(1))

            return None
        except Exception as e:
            logger.warning(f"Failed to get match score for {job_url}: {e}")
            return None

    @staticmethod
    def _parse_salary(salary_text: str) -> tuple[Optional[float], Optional[float]]:
        """Parse salary range from text like '$80K - $120K' or '$80,000 - $120,000'."""
        if not salary_text:
            return None, None

        amounts = re.findall(r"\$[\d,]+\.?\d*[KkMm]?", salary_text)
        if not amounts:
            return None, None

        parsed = []
        for amount in amounts:
            num_str = amount.replace("$", "").replace(",", "")
            multiplier = 1
            if num_str.upper().endswith("K"):
                multiplier = 1000
                num_str = num_str[:-1]
            elif num_str.upper().endswith("M"):
                multiplier = 1_000_000
                num_str = num_str[:-1]
            try:
                parsed.append(float(num_str) * multiplier)
            except ValueError:
                continue

        if len(parsed) >= 2:
            return parsed[0], parsed[1]
        elif len(parsed) == 1:
            return parsed[0], None
        return None, None

    async def close(self):
        """Close the browser and clean up resources."""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
        except Exception as e:
            logger.warning(f"Error closing browser: {e}")
        finally:
            self.page = None
            self.context = None
            self.browser = None

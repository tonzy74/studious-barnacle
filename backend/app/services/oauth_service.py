import secrets
from typing import Optional
from urllib.parse import urlencode

import httpx


class OAuthService:
    """OAuth 2.0 authentication service (LinkedIn provider)."""

    AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
    PROFILE_API_URL = "https://api.linkedin.com/v2/me"
    EMAIL_API_URL = (
        "https://api.linkedin.com/v2/emailAddress"
        "?q=members&projection=(elements*(handle~))"
    )
    SCOPES = ["openid", "profile", "email"]

    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Generate the OAuth authorization URL."""
        if state is None:
            state = secrets.token_urlsafe(32)

        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state,
            "scope": " ".join(self.SCOPES),
        }
        return f"{self.AUTHORIZATION_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> Optional[dict]:
        """Exchange the authorization code for an access token."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                return None

            return response.json()

    async def get_user_profile(self, access_token: str) -> Optional[dict]:
        """Fetch the user's profile using the access token."""
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            userinfo_response = await client.get(self.USERINFO_URL, headers=headers)

            if userinfo_response.status_code == 200:
                userinfo = userinfo_response.json()
                return {
                    "sub": userinfo.get("sub", ""),
                    "name": userinfo.get("name", ""),
                    "email": userinfo.get("email", ""),
                    "picture": userinfo.get("picture", ""),
                    "headline": userinfo.get("headline", ""),
                    "location": userinfo.get("locale", {}).get("country", ""),
                }

            profile_response = await client.get(self.PROFILE_API_URL, headers=headers)
            if profile_response.status_code != 200:
                return None

            profile_data = profile_response.json()

            first_name = (
                profile_data.get("localizedFirstName", "")
                or profile_data.get("firstName", {})
                .get("localized", {})
                .get("en_US", "")
            )
            last_name = (
                profile_data.get("localizedLastName", "")
                or profile_data.get("lastName", {})
                .get("localized", {})
                .get("en_US", "")
            )

            email = ""
            email_response = await client.get(self.EMAIL_API_URL, headers=headers)
            if email_response.status_code == 200:
                email_data = email_response.json()
                elements = email_data.get("elements", [])
                if elements:
                    handle = elements[0].get("handle~", {})
                    email = handle.get("emailAddress", "")

            return {
                "id": profile_data.get("id", ""),
                "sub": profile_data.get("id", ""),
                "name": f"{first_name} {last_name}".strip(),
                "email": email,
                "headline": profile_data.get("localizedHeadline", ""),
                "location": profile_data.get("location", {}).get(
                    "name", ""
                ),
            }

    async def refresh_token(self, refresh_token: str) -> Optional[dict]:
        """Refresh an expired access token using the refresh token."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                return None

            return response.json()

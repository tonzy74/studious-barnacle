import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { UserProfile } from '../types';

const IDENTITY_TOKEN_KEYCHAIN_ID = 'whiskey-vault.identity-token';

export async function appleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

/**
 * Sign in with Apple. The identity token (a credential) goes to the Keychain;
 * only non-secret profile fields are returned for the persisted store.
 * When the sync backend lands, the identity token is what gets exchanged for
 * a server session — nothing else changes client-side.
 */
export async function signInWithApple(): Promise<UserProfile> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (credential.identityToken) {
    await SecureStore.setItemAsync(IDENTITY_TOKEN_KEYCHAIN_ID, credential.identityToken).catch(
      () => {}
    );
  }
  const name = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  return {
    provider: 'apple',
    userId: credential.user,
    // Apple only provides name/email on FIRST sign-in — persist them then.
    name: name || undefined,
    email: credential.email ?? undefined,
    signedInAt: Date.now(),
  };
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(IDENTITY_TOKEN_KEYCHAIN_ID).catch(() => {});
}

/**
 * Google Sign-In placeholder: requires OAuth client IDs and a backend to
 * validate tokens against (see SECURITY.md — authorization is server-side).
 * Wire via expo-auth-session once the sync backend exists. Apple must remain
 * offered wherever Google is (App Store Guideline 4.8).
 */
export const GOOGLE_SIGN_IN_READY = false;

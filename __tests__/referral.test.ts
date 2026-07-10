import {
  canApplyReferral,
  makeReferralCode,
  parseReferralCode,
  referralLink,
  referralShareText,
} from '../src/lib/referral';

describe('makeReferralCode', () => {
  it('is deterministic and 6 unambiguous chars', () => {
    const a = makeReferralCode('anon-abc');
    expect(a).toBe(makeReferralCode('anon-abc'));
    expect(a).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('differs across seeds', () => {
    expect(makeReferralCode('anon-abc')).not.toBe(makeReferralCode('anon-xyz'));
  });
});

describe('parseReferralCode', () => {
  it('reads a code from a link, a param, or raw text', () => {
    expect(parseReferralCode('https://whiskeyvault.app/r/ABC234')).toBe('ABC234');
    expect(parseReferralCode('whiskeyvault://x?code=abc234')).toBe('ABC234');
    expect(parseReferralCode('  abc234 ')).toBe('ABC234');
  });

  it('rejects junk', () => {
    expect(parseReferralCode('')).toBeUndefined();
    expect(parseReferralCode('not a code!!')).toBeUndefined();
  });
});

describe('canApplyReferral', () => {
  it('blocks self-referral and double-apply', () => {
    expect(canApplyReferral('FRIEND', 'MYCODE', undefined)).toBe(true);
    expect(canApplyReferral('MYCODE', 'MYCODE', undefined)).toBe(false); // self
    expect(canApplyReferral('FRIEND', 'MYCODE', 'PRIOR')).toBe(false); // already applied
    expect(canApplyReferral(undefined, 'MYCODE', undefined)).toBe(false);
  });
});

describe('share text', () => {
  it('includes the code, reward, and link', () => {
    const text = referralShareText('ABC234');
    expect(text).toContain('ABC234');
    expect(text).toContain('free month');
    expect(text).toContain(referralLink('ABC234'));
  });
});

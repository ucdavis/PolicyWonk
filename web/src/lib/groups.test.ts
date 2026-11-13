import { describe, expect, it } from 'vitest';

import { DEFAULT_GROUP } from './constants';
import { getGroupNameFromAffiliation, getGroupFromPathname } from './groups';

describe('campus affiliation mapping', () => {
  it.each([
    ['staff@berkeley.edu', 'ucb'],
    ['faculty@BERKELEY.EDU', 'ucb'],
    ['staff@ucdavis.edu', 'ucdavis'],
    ['employee@ucop.edu', 'ucop'],
    ['faculty@ucsf.edu', 'ucsf'],
    ['staff@ucla.edu', 'ucla'],
    ['employee@ucmerced.edu', 'ucmerced'],
    ['faculty@ucr.edu', 'ucr'],
    ['staff@ucsd.edu', 'ucsd'],
    ['staff@ucsc.edu', 'ucsc'],
    ['employee@lbl.gov', 'lbl'],
    ['staff@uci.edu', 'uci'],
    ['faculty@ucsb.edu', 'ucsb'],
    ['employee@ucanr.edu', 'ucanr'],
    ['staff@uclawsf.edu', 'uclawsf'],
    ['staff@uchastings.edu', 'uclawsf'],
  ])('maps %s to the app group %s', (affiliation, group) => {
    expect(getGroupNameFromAffiliation([affiliation])).toBe(group);
  });

  it('uses the first recognized affiliation when multiple values are released', () => {
    expect(
      getGroupNameFromAffiliation([
        'member@unknown.edu',
        'staff@berkeley.edu',
        'faculty@ucsf.edu',
      ])
    ).toBe('ucb');
  });

  it.each([
    'staff@ucb.edu',
    'staff@ucberkeley.edu',
    'staff@berkeley.edu.example.org',
    'staff@department.berkeley.edu',
    'staff@invalid@berkeley.edu',
    'staff@health.ucsd.edu',
    'berkeley.edu',
  ])(
    'does not infer a campus from an unrecognized scope: %s',
    (affiliation) => {
      expect(getGroupNameFromAffiliation([affiliation])).toBe(DEFAULT_GROUP);
    }
  );

  it('preserves the default group when no affiliation is released', () => {
    expect(getGroupNameFromAffiliation([])).toBe(DEFAULT_GROUP);
  });

  it('keeps existing Berkeley URLs mapped to the same app group', () => {
    expect(getGroupFromPathname('/ucb/chat/existing-chat')).toBe('ucb');
  });
});

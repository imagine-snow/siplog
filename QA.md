# v0.5.3 beta verification / 内测验证

Release checked on 2026-10-27. Results describe the tested beta, not a guarantee for every browser or device.

- 35 Node tests passed; TypeScript, standalone and hosted production builds passed.
- Both clear-data confirmation stages were checked in Chinese and English. Cancellation at either stage kept the data. Reopening started again at stage one, with cancel focused by default.
- A synthetic local fixture contained one bottle, one occasion, a favorite and one photo. Export worked before clearing; after clearing and refreshing, records, bottles and covers were empty, and the selected currency was preserved.
- Exported backup files remained unchanged and restored the bottle, occasion and photo.
- A stale second tab could not write the old data back after clearing: the existing revision check rejected its save.
- Mobile confirmation layout was checked at 390 × 844. SipLog branding, localized creator credit and the version label were checked.
- Browser tests used localhost fixtures only. The hosted user's records were not test data.

## Earlier v0.5 coverage


- 35 Node tests pass: arithmetic, shared/friends-only consumption, early record editing/removal, multi-bottle reflow, later absolute inventory corrections, fractional-capacity stability, atomic rejection, product correction scope, cabinet removal/restore, old backups, photo/favorite migration and bilingual name search/ranking.
- TypeScript check and standalone production build pass. Hosted build is also required before deployment.
- Browser QA uses localhost fixtures only. The hosted user's records are never test data.
- Mobile (390 × 844): first-run guide, skip/reopen, Chinese catalog results, completed-beer editing (name/category/ABV/capacity/quantity/share/price), empty-then-retyped capacity, confirmed persistence, journal search, calendar toggle, cabinet removal/restore, linked-bottle amount and whole-bottle ABV correction, refresh persistence and English navigation.
- Existing 35,964-entry catalog and source/category checks remain in place. This change adds display aliases, not a complete translation or manual verification of the database.
- Records remain local to the current browser; beta distribution and cloud synchronization are separate from this release.

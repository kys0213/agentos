# Plan → Docs Promotion Checklist

Use this checklist to migrate plan content into stable documentation while following repository standards.

- Verify scope is complete and validated against the contract schemas (zod).
- Replace plan TODOs with concrete API names, types, and links to SSOT docs.
- Add or update a page under `apps/gui/docs/**` and link it from the relevant index README.
- Move examples into `docs` with runnable snippets or clear pseudo-code.
- Cross-check links and anchors; ensure no 404s from plan references remain.
- Mark old plan files as “Superseded” with a pointer to the new doc (keep stubs to avoid 404s).
- Update the consolidated plan checklist and references.

References

- Repo docs policy: `docs/40-process-policy/documentation-standards.md`
- Git workflow: `docs/40-process-policy/git-workflow.md`


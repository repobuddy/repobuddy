/**
 * Words that mark an `autoMode` entry as a template nobody filled in. They are tested on the entry
 * with its code spans removed, and an angle placeholder inside a path or URL (`~/code/<repo>`) is
 * syntax, not a blank.
 *
 * Shared by `review-permissions`' scanner and `init-buddy`'s `auto-mode` script, so both skills
 * flag the same entries.
 */
const TEMPLATE_TEXT = [
	/\{[A-Z][A-Z0-9_]*[,}]/,
	/(?<![/\w])<[a-z][a-z -]*>(?![/\w])/,
	/\b(TODO|TBD)\b/,
	/\bsay so here\b/i,
	/\bfill (this |it )?in\b/i,
	/\breplace (this|with)\b/i,
]

/** The template text found in an entry, or an empty array when it reads as filled in. */
export function templateMarkers(entry: string): string[] {
	const prose = entry.replace(/`[^`]*`/g, '')
	const found: string[] = []
	for (const re of TEMPLATE_TEXT) {
		const m = re.exec(prose)
		if (m) found.push(m[0])
	}
	return found
}

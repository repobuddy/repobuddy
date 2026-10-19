// Compiled by `universal-plugin plugin build` from src/skills/auto-mode.ts. Edit the source, not this file.
globalThis.__SKILL_SCRIPT__ = {"package":"repobuddy","bin":"repobuddy","version":"3.0.0","entry":"skills/init-buddy/scripts/auto-mode.mjs","commands":{}};
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
//#region src/permissions/template-text.ts
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
	/\breplace (this|with)\b/i
];
/** The template text found in an entry, or an empty array when it reads as filled in. */
function templateMarkers(entry) {
	const prose = entry.replace(/`[^`]*`/g, "");
	const found = [];
	for (const re of TEMPLATE_TEXT) {
		const m = re.exec(prose);
		if (m) found.push(m[0]);
	}
	return found;
}
//#endregion
//#region src/skills/auto-mode.ts
const USAGE = `usage: auto-mode.mjs check    [--project <dir>] [--home <dir>]
       auto-mode.mjs discover [--project <dir>] [--home <dir>]
       auto-mode.mjs render   <answers.json>
       auto-mode.mjs apply    <entries.json> [--home <dir>] [--write] [--verify]
`;
var UsageError = class extends Error {};
var RunError = class extends Error {};
function parseArgs(argv) {
	const [command, ...rest] = argv;
	if (!command || ![
		"check",
		"discover",
		"render",
		"apply"
	].includes(command)) throw new UsageError();
	const opts = {
		command,
		project: process.cwd(),
		home: homedir(),
		write: false,
		verify: false
	};
	const positional = [];
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i];
		if (a === "--project" || a === "--home") {
			const value = rest[++i];
			if (!value) throw new UsageError();
			opts[a === "--project" ? "project" : "home"] = resolve(value);
		} else if (a === "--write") opts.write = true;
		else if (a === "--verify") opts.verify = true;
		else if (a.startsWith("--")) throw new UsageError();
		else positional.push(a);
	}
	if (command === "render" || command === "apply" ? positional.length !== 1 : positional.length !== 0) throw new UsageError();
	if (positional[0]) opts.file = positional[0];
	return opts;
}
const userSettingsFile = (home) => join(home, ".claude", "settings.json");
const projectSettingsFiles = (project) => [join(project, ".claude", "settings.json"), join(project, ".claude", "settings.local.json")];
function readJson(file) {
	if (!existsSync(file)) return {
		exists: false,
		value: void 0
	};
	try {
		return {
			exists: true,
			value: JSON.parse(readFileSync(file, "utf8"))
		};
	} catch (e) {
		throw new RunError(`could not parse ${file}: ${e.message}`);
	}
}
const LISTS = [
	"environment",
	"allow",
	"soft_deny",
	"hard_deny"
];
/** The entry naming the user's namespaces, written by `render`. */
const SOURCE_CONTROL = /^\W*source control\W*:/i;
function check(project, home) {
	const userFile = userSettingsFile(home);
	const user = readJson(userFile);
	const autoMode = user.value?.autoMode ?? {};
	const modes = [];
	for (const file of [userFile, ...projectSettingsFiles(project)]) {
		const { value } = file === userFile ? user : readJson(file);
		const defaultMode = value?.permissions?.defaultMode;
		if (typeof defaultMode === "string") modes.push({
			file,
			defaultMode
		});
	}
	const lists = Object.fromEntries(LISTS.map((key) => {
		const list = autoMode[key];
		if (!Array.isArray(list)) return [key, {
			exists: false,
			hasDefaults: false,
			count: 0
		}];
		return [key, {
			exists: true,
			hasDefaults: list.includes("$defaults"),
			count: list.length
		}];
	}));
	const templateText = [];
	for (const key of ["environment", "allow"]) {
		const list = autoMode[key];
		if (!Array.isArray(list)) continue;
		list.forEach((entry, index) => {
			if (typeof entry !== "string" || entry === "$defaults") return;
			const markers = templateMarkers(entry);
			if (markers.length) templateText.push({
				list: key,
				index,
				entry,
				markers
			});
		});
	}
	const ignoredProjectBlocks = projectSettingsFiles(project).filter((file) => readJson(file).value?.autoMode);
	const missingDefaults = ["soft_deny", "hard_deny"].filter((key) => lists[key].exists && !lists[key].hasDefaults);
	const sourceControl = (Array.isArray(autoMode.environment) ? autoMode.environment : []).find((e) => typeof e === "string" && SOURCE_CONTROL.test(e)) ?? null;
	return {
		settingsFile: userFile,
		settingsExists: user.exists,
		mode: {
			auto: modes.some((m) => m.defaultMode === "auto"),
			sources: modes
		},
		lists,
		classifyAllShell: autoMode.classifyAllShell === true,
		templateText,
		ignoredProjectBlocks,
		missingDefaults,
		sourceControl
	};
}
function gh(args, cwd) {
	const r = spawnSync("gh", args, {
		cwd,
		encoding: "utf8",
		env: process.env
	});
	if (r.error) throw new RunError(`could not run gh: ${r.error.message}`);
	return {
		ok: r.status === 0,
		stdout: r.stdout ?? "",
		stderr: r.stderr ?? ""
	};
}
const tsv = (text) => text.split("\n").filter((line) => line.trim()).map((line) => line.split("	"));
function visibilityOf(owner) {
	const r = gh([
		"repo",
		"list",
		owner,
		"--limit",
		"1000",
		"--json",
		"name,visibility",
		"--jq",
		".[] | [.name, .visibility] | @tsv"
	]);
	if (!r.ok) throw new RunError(`gh repo list ${owner} failed: ${r.stderr.trim()}`);
	const rows = tsv(r.stdout);
	const pub = rows.filter(([, v]) => v === "PUBLIC").map(([name]) => name);
	const priv = rows.filter(([, v]) => v !== "PUBLIC").map(([name]) => name);
	return {
		summary: !rows.length ? "empty" : !priv.length ? "public" : !pub.length ? "private" : "mixed",
		public: pub,
		private: priv
	};
}
function branchRules(project) {
	const view = gh([
		"repo",
		"view",
		"--json",
		"nameWithOwner,defaultBranchRef",
		"--jq",
		"[.nameWithOwner, .defaultBranchRef.name] | @tsv"
	], project);
	if (!view.ok) return null;
	const [repo, defaultBranch] = tsv(view.stdout)[0] ?? [];
	if (!repo || !defaultBranch) return null;
	const out = {
		repo,
		defaultBranch,
		requiredChecks: [],
		requiredReviews: null,
		mergeQueue: false,
		forcePushBlocked: false,
		classicProtection: "none"
	};
	const rules = gh(["api", `repos/${repo}/rules/branches/${defaultBranch}`]);
	if (rules.ok) for (const rule of JSON.parse(rules.stdout || "[]")) {
		if (rule.type === "required_status_checks") for (const c of rule.parameters?.required_status_checks ?? []) out.requiredChecks.push(c.context);
		if (rule.type === "pull_request") out.requiredReviews = Math.max(out.requiredReviews ?? 0, rule.parameters?.required_approving_review_count ?? 0);
		if (rule.type === "merge_queue") out.mergeQueue = true;
		if (rule.type === "non_fast_forward") out.forcePushBlocked = true;
	}
	const classic = gh(["api", `repos/${repo}/branches/${defaultBranch}/protection`]);
	if (classic.ok) {
		out.classicProtection = "present";
		const p = JSON.parse(classic.stdout);
		const checks = p.required_status_checks;
		for (const c of [...checks?.contexts ?? [], ...(checks?.checks ?? []).map((x) => x.context)]) out.requiredChecks.push(c);
		const reviews = p.required_pull_request_reviews?.required_approving_review_count;
		if (typeof reviews === "number") out.requiredReviews = Math.max(out.requiredReviews ?? 0, reviews);
		if (p.allow_force_pushes?.enabled === false) out.forcePushBlocked = true;
	} else if (/HTTP 403/.test(classic.stderr)) out.classicProtection = "unreadable";
	out.requiredChecks = [...new Set(out.requiredChecks)];
	return out;
}
const LOCKFILES = [
	["pnpm-lock.yaml", "pnpm"],
	["package-lock.json", "npm"],
	["yarn.lock", "yarn"],
	["bun.lock", "bun"],
	["bun.lockb", "bun"]
];
const PUBLISHES = /\b(npm|pnpm|yarn)\s+(\S+\s+)?publish\b|\bchangeset\s+publish\b|changesets\/action/;
function repoSignals(project) {
	let packageManager = null;
	const pkg = existsSync(join(project, "package.json")) ? readJson(join(project, "package.json")).value : void 0;
	if (typeof pkg?.packageManager === "string") packageManager = pkg.packageManager.split("@")[0];
	const lockfiles = LOCKFILES.filter(([file]) => existsSync(join(project, file)));
	packageManager ??= lockfiles[0]?.[1] ?? null;
	const workflows = join(project, ".github", "workflows");
	const publishWorkflows = existsSync(workflows) ? readdirSync(workflows).filter((f) => /\.ya?ml$/.test(f) && PUBLISHES.test(readFileSync(join(workflows, f), "utf8"))).map((f) => `.github/workflows/${f}`) : [];
	return {
		packageManager,
		lockfiles: lockfiles.map(([file]) => file),
		changesets: existsSync(join(project, ".changeset", "config.json")),
		publishWorkflows
	};
}
const mentions = (text, owner) => new RegExp(`(?<![\\w-])${owner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "i").test(text);
function discover(project, home) {
	const login = gh([
		"api",
		"user",
		"--jq",
		".login"
	]);
	if (!login.ok) throw new RunError(`gh is not logged in to GitHub: ${login.stderr.trim()}`);
	const errors = [];
	const namespaces = [{
		owner: login.stdout.trim(),
		kind: "user",
		role: "owner",
		state: "active",
		proposed: true
	}];
	const orgs = gh([
		"api",
		"--paginate",
		"user/memberships/orgs",
		"--jq",
		".[] | [.organization.login, .role, .state] | @tsv"
	]);
	if (orgs.ok) for (const [owner, role, state] of tsv(orgs.stdout)) namespaces.push({
		owner,
		kind: "org",
		role,
		state,
		proposed: role === "admin" && state === "active"
	});
	else errors.push(`could not list organization memberships (needs the read:org scope): ${orgs.stderr.trim()}`);
	for (const ns of namespaces) {
		if (ns.state !== "active") continue;
		try {
			ns.visibility = visibilityOf(ns.owner);
		} catch (e) {
			errors.push(e.message);
		}
	}
	const sourceControl = check(project, home).sourceControl;
	const missing = sourceControl ? namespaces.filter((ns) => ns.proposed && !mentions(sourceControl, ns.owner)).map((ns) => ns.owner) : null;
	return {
		host: "github",
		login: namespaces[0].owner,
		namespaces,
		branch: branchRules(project),
		repo: repoSignals(project),
		refresh: {
			sourceControl,
			missing
		},
		errors
	};
}
const andList = (xs) => xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
const repos = (names) => `the repo${names.length > 1 ? "s" : ""} ${andList(names)} ${names.length > 1 ? "are" : "is"}`;
function sourceControlEntry(namespaces) {
	const users = namespaces.filter((ns) => ns.kind === "user").map((ns) => ns.owner);
	const orgs = namespaces.filter((ns) => ns.kind !== "user").map((ns) => ns.owner);
	return `Source control: my namespaces, which other entries and rules refer to by that name, are ${[...users.length ? [`the GitHub account${users.length > 1 ? "s" : ""} ${andList(users)}`] : [], ...orgs.length ? [`the GitHub organization${orgs.length > 1 ? "s" : ""} ${andList(orgs)}`] : []].join(" and ")}, and every repo under them.`;
}
function visibilityEntry(namespaces) {
	const clauses = [];
	for (const { owner, visibility: v } of namespaces) {
		if (!v || v.summary === "empty") continue;
		if (v.summary === "public" || v.summary === "private") clauses.push(`every repo in ${owner} is ${v.summary}`);
		else if (v.private.length <= v.public.length) clauses.push(`in ${owner}, ${repos(v.private)} private and the rest are public`);
		else clauses.push(`in ${owner}, ${repos(v.public)} public and the rest are private`);
	}
	return clauses.length ? `Repository visibility: in my namespaces, ${clauses.join("; ")}.` : null;
}
const labelled = (label, text) => {
	if (typeof text !== "string" || !text.trim()) return null;
	const t = text.trim();
	return t.toLowerCase().startsWith(`${label.toLowerCase()}:`) ? t : `${label}: ${t}`;
};
const ADMIN_DENY = ["Bash(gh pr merge --admin*)", "Bash(gh pr merge * --admin*)"];
/** The GitHub rules from references/advanced-tier.md and references/auto-mode.md, owners as "my namespaces". */
const RULES = {
	merge: {
		text: "Merging a pull or merge request (`gh pr merge`, or adding it to the merge queue) without an approving review, in a repo in my namespaces, when the agent has confirmed first-hand that it has no merge conflict, every required check or pipeline is green, and no review requests changes or is left unresolved. Bypassing branch protection, branch policies, or required checks (`gh pr merge --admin`), merging while checks or pipelines are red or pending, or merging in a repo owned by anyone else is still not covered.",
		deny: ADMIN_DENY
	},
	queuedMerge: {
		text: "Queuing a pull request to merge once its checks pass (`gh pr merge --auto`, or adding it to the merge queue), for a pull request the agent opened or was asked to work on, in a repo in my namespaces whose base branch requires status checks, while those checks are still pending: the forge merges only after the required checks pass. `gh pr merge --admin`, queuing in a repo whose base branch requires no check, and changing branch protection are still not covered.",
		deny: ADMIN_DENY
	},
	forceWithLease: {
		text: "Force-pushing with `--force-with-lease` or `--force-if-includes` to a non-default branch of a repo in my namespaces, to update a branch after a rebase or amend. A plain `--force` or `-f`, a `+refspec`, and a force-push to the default branch, a release branch, or a branch someone else pushed to are still not covered.",
		deny: [
			"Bash(git push --force *)",
			"Bash(git push -f *)",
			"Bash(git push * --force)",
			"Bash(git push * --force *)",
			"Bash(git push * -f)",
			"Bash(git push * -f *)",
			"Bash(git push * +*)"
		]
	}
};
function render(answers) {
	const namespaces = answers?.namespaces;
	if (!Array.isArray(namespaces) || !namespaces.length || !namespaces.every((ns) => typeof ns?.owner === "string" && ns.owner)) throw new RunError("answers.namespaces must be a non-empty array of { owner, kind } objects");
	const environment = [
		sourceControlEntry(namespaces),
		visibilityEntry(namespaces),
		labelled("Branch protection", answers.branchProtection),
		labelled("Toolchain", answers.toolchain),
		labelled("Release path", answers.releasePath),
		labelled("Host containment", answers.hostContainment),
		labelled("Key internal services", answers.keyInternalServices)
	].filter((e) => Boolean(e));
	const wanted = Object.keys(RULES).filter((key) => answers.rules?.[key] === true);
	return {
		environment,
		allow: wanted.map((key) => RULES[key].text),
		deny: [...new Set(wanted.flatMap((key) => RULES[key].deny))]
	};
}
const strings = (value, name) => {
	if (value === void 0) return [];
	if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) throw new RunError(`${name} must be an array of strings`);
	return value;
};
function indentOf(text) {
	const m = /^[ \t]+(?=")/m.exec(text);
	return m ? m[0] : "  ";
}
function apply(entries, home, write, verify) {
	const wanted = {
		environment: strings(entries?.environment, "environment"),
		allow: strings(entries?.allow, "allow"),
		deny: strings(entries?.deny, "deny")
	};
	const replace = entries?.replace ?? [];
	if (!Array.isArray(replace) || !replace.every((r) => typeof r?.old === "string" && typeof r?.new === "string")) throw new RunError("replace must be an array of { old, new } strings");
	const file = userSettingsFile(home);
	const original = existsSync(file) ? readFileSync(file, "utf8") : null;
	const settings = original === null ? {} : readJson(file).value;
	if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw new RunError(`${file} does not hold a JSON object`);
	const snapshot = () => ({
		autoMode: {
			environment: settings.autoMode?.environment,
			allow: settings.autoMode?.allow
		},
		permissions: { deny: settings.permissions?.deny }
	});
	const before = JSON.parse(JSON.stringify(snapshot()));
	const added = {
		environment: [],
		allow: [],
		deny: []
	};
	const skipped = {
		environment: [],
		allow: [],
		deny: []
	};
	const replaced = [];
	const notFound = [];
	for (const r of replace) {
		const list = ["environment", "allow"].find((key) => settings.autoMode?.[key]?.includes(r.old));
		if (!list) notFound.push(r.old);
		else {
			const entries = settings.autoMode[list];
			entries[entries.indexOf(r.old)] = r.new;
			replaced.push({
				list,
				...r
			});
		}
	}
	const append = (parent, key, items, name, withDefaults) => {
		if (!items.length) return;
		if (!Array.isArray(parent[key])) parent[key] = withDefaults ? ["$defaults"] : [];
		for (const item of items) if (parent[key].includes(item)) skipped[name].push(item);
		else {
			parent[key].push(item);
			added[name].push(item);
		}
	};
	if (wanted.environment.length || wanted.allow.length) settings.autoMode ??= {};
	if (wanted.deny.length) settings.permissions ??= {};
	append(settings.autoMode, "environment", wanted.environment, "environment", true);
	append(settings.autoMode, "allow", wanted.allow, "allow", true);
	append(settings.permissions, "deny", wanted.deny, "deny", false);
	const changed = replaced.length > 0 || Object.values(added).some((list) => list.length);
	let wrote = false;
	let verified = null;
	const notes = [];
	if (write && changed) {
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, `${JSON.stringify(settings, null, original ? indentOf(original) : "  ")}\n`);
		const back = readJson(file).value;
		for (const [key, list] of [
			["environment", back.autoMode?.environment],
			["allow", back.autoMode?.allow],
			["deny", back.permissions?.deny]
		]) if ([...added[key], ...replaced.filter((r) => r.list === key).map((r) => r.new)].some((item) => !list?.includes(item))) throw new RunError(`${file} lost ${key} entries on write`);
		wrote = true;
	}
	if (verify && wrote) {
		const r = spawnSync("claude", ["auto-mode", "config"], {
			encoding: "utf8",
			env: {
				...process.env,
				HOME: home
			}
		});
		if (r.error || r.status !== 0) notes.push("`claude auto-mode config` did not run; check the entries by hand");
		else {
			const config = JSON.parse(r.stdout);
			verified = ["environment", "allow"].every((key) => [...added[key], ...replaced.filter((r) => r.list === key).map((r) => r.new)].every((item) => config[key]?.includes(item)));
		}
	}
	if (notFound.length) notes.push(`not replaced, no such entry: ${notFound.join(" | ")}`);
	return {
		file,
		changed,
		wrote,
		verified,
		added,
		replaced,
		skipped,
		before,
		after: snapshot(),
		notes
	};
}
async function main(argv = process.argv.slice(2)) {
	let opts;
	try {
		opts = parseArgs(argv);
	} catch {
		process.stderr.write(USAGE);
		process.exit(2);
	}
	try {
		const input = opts.file ? readJson(resolve(opts.file)) : void 0;
		if (opts.file && !input?.exists) throw new RunError(`${opts.file} does not exist`);
		const result = opts.command === "check" ? check(opts.project, opts.home) : opts.command === "discover" ? discover(opts.project, opts.home) : opts.command === "render" ? render(input.value) : apply(input.value, opts.home, opts.write, opts.verify);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (e) {
		if (!(e instanceof RunError)) throw e;
		process.stderr.write(`auto-mode: ${e.message}\n`);
		process.exit(1);
	}
}
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith("auto-mode.mjs")) await main();
//#endregion
export { RULES, apply, check, discover, main, render };

// Compiled by `universal-plugin plugin build` from src/skills/permission-candidates.ts. Edit the source, not this file.
globalThis.__SKILL_SCRIPT__ = {"package":"repobuddy","bin":"repobuddy","version":"3.0.0","entry":"skills/init-buddy/scripts/permission-candidates.mjs","commands":{}};
import { execFileSync } from "node:child_process";
import { accessSync, constants, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join, resolve } from "node:path";
//#region src/skills/permission-candidates.ts
const HOSTS = [
	"github",
	"gitlab",
	"gitea",
	"forgejo",
	"azure"
];
const READ_ONLY = {
	github: [
		"gh pr view",
		"gh pr list",
		"gh pr diff",
		"gh pr checks",
		"gh issue view",
		"gh issue list",
		"gh run view",
		"gh run list",
		"gh repo view",
		"gh auth status"
	],
	gitlab: [
		"glab mr view",
		"glab mr list",
		"glab mr diff",
		"glab issue view",
		"glab issue list",
		"glab ci list",
		"glab ci status",
		"glab repo view",
		"glab auth status"
	],
	gitea: [
		"tea pulls list",
		"tea issues list",
		"tea repos list",
		"tea login list"
	],
	forgejo: [
		"fj pr view",
		"fj issue view",
		"fj repo view",
		"fj whoami"
	],
	azure: [
		"az repos pr list",
		"az repos pr show",
		"az pipelines runs list",
		"az pipelines runs show",
		"az account show"
	]
};
const SAFE_SCRIPTS = [
	"test",
	"lint",
	"check",
	"typecheck"
];
const GOOD_TO_HAVE_GIT = [
	{
		entry: "Bash(git add *)",
		reason: "The change stays in the working tree or index"
	},
	{
		entry: "Bash(git mv *)",
		reason: "The change stays in the working tree or index"
	},
	{
		entry: "Bash(git commit *)",
		reason: "Recoverable until pushed; also covers --no-verify and --amend, so only where commit hooks are not the last check"
	},
	{
		entry: "Bash(git stash push *)",
		reason: "The stash keeps the change"
	},
	{
		entry: "Bash(git stash apply *)",
		reason: "The stash keeps the change; apply leaves the entry in place"
	}
];
const FIX_SCRIPTS = [
	"format",
	"check:fix",
	"lint:fix"
];
const FORCE_PUSH = [
	"Bash(git push --force *)",
	"Bash(git push -f *)",
	"Bash(git push * --force)",
	"Bash(git push * --force *)",
	"Bash(git push * -f)",
	"Bash(git push * -f *)",
	"Bash(git push * +*)"
];
const FORCE_PUSH_NOTE = "Blocks a plain --force or -f before, between, or after the arguments, and a +refspec; --force-with-lease stays allowed";
const BYPASS_MERGE = [
	{
		host: "github",
		group: "Bypass merge: GitHub",
		entries: ["Bash(gh pr merge --admin*)", "Bash(gh pr merge * --admin*)"],
		note: "Blocks merging past the required checks with --admin"
	},
	{
		host: "azure",
		group: "Bypass merge: Azure DevOps",
		entries: ["Bash(az repos pr update *--bypass-policy*)", "Bash(az repos pr create *--bypass-policy*)"],
		note: "Blocks bypassing branch policy; also blocks --bypass-policy false, which does nothing anyway"
	},
	{
		host: "gitea",
		group: "Bypass merge: Gitea",
		entries: ["Bash(tea api *force_merge*)"],
		note: "Blocks the API's force_merge, the only bypass; tea pulls merge has no force flag"
	}
];
const IMMEDIATE_MERGE_GITLAB = ["Bash(glab mr merge *--auto-merge=false*)", "Bash(glab mr merge *--auto-merge false*)"];
const REPO_DELETE = {
	github: ["Bash(gh repo delete*)"],
	gitlab: ["Bash(glab repo delete*)"],
	azure: ["Bash(az repos delete*)"],
	gitea: ["Bash(tea repos delete*)", "Bash(tea repos rm*)"],
	forgejo: ["Bash(fj repo delete*)"]
};
const apiDelete = (cli) => [
	`Bash(${cli} api *-X DELETE*)`,
	`Bash(${cli} api *-XDELETE*)`,
	`Bash(${cli} api *--method DELETE*)`,
	`Bash(${cli} api *--method=DELETE*)`
];
const API_DELETE = {
	github: apiDelete("gh"),
	gitlab: apiDelete("glab"),
	gitea: apiDelete("tea")
};
const RECURSIVE_DELETE = [
	"Bash(rm -rf*)",
	"Bash(rm -fr*)",
	"Bash(rm -Rf*)",
	"Bash(rm -fR*)",
	"Bash(rm -r -f*)",
	"Bash(rm -f -r*)",
	"Bash(rm --recursive --force*)",
	"Bash(rm --force --recursive*)"
];
const PUBLISH = {
	npm: ["Bash(npm publish*)"],
	pnpm: ["Bash(pnpm publish*)", "Bash(pnpm -r publish*)"],
	yarn: ["Bash(yarn npm publish*)"],
	bun: ["Bash(bun publish*)"]
};
const PUBLISH_NOTE = "Blocks publishing a package to the registry; reordered flags and publishing scripts get past";
const CHANGESETS_BARE = "Bash(changeset publish*)";
const CHANGESETS_BY_MANAGER = {
	pnpm: ["Bash(pnpm changeset publish*)", "Bash(pnpm exec changeset publish*)"],
	npm: ["Bash(npx changeset publish*)"],
	yarn: ["Bash(yarn changeset publish*)"],
	bun: ["Bash(bunx changeset publish*)"]
};
const CHANGESETS_NOTE = "Blocks publishing the pending changesets; a rule matches the first word, so each manager form needs its own";
const SECRETS_GENERIC = [
	"Read(**/.env*)",
	"Read(~/.ssh/**)",
	"Read(~/.aws/**)",
	"Read(~/.npmrc)"
];
const SECRETS_NOTES = {
	"Read(**/.env*)": "Blocks reading env files; also hides .env.example",
	"Read(~/.ssh/**)": "Blocks reading SSH keys",
	"Read(~/.aws/**)": "Blocks reading AWS credentials",
	"Read(~/.npmrc)": "Blocks reading the npm auth token"
};
const SECRETS_HOST = {
	github: "Read(~/.config/gh/hosts.yml)",
	gitlab: "Read(~/.config/glab-cli/**)",
	azure: "Read(~/.azure/**)",
	gitea: "Read(~/.config/tea/**)",
	forgejo: "Read(~/.local/share/forgejo-cli/**)"
};
const REMOTE_HOSTS = [
	["github.com", "github"],
	["gitlab.com", "gitlab"],
	["dev.azure.com", "azure"],
	["visualstudio.com", "azure"],
	["codeberg.org", "forgejo"]
];
function usage(message) {
	process.stderr.write(`${message}\n`);
	process.stderr.write("usage: permission-candidates.mjs [--project <dir>] [--host <kind>]... [--home <dir>]\n");
	process.exit(2);
}
function parseArgs(argv) {
	const opts = { hosts: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a !== "--project" && a !== "--host" && a !== "--home") usage(`unknown argument "${a}"`);
		const value = argv[i + 1];
		if (value === void 0) usage(`${a} needs a value`);
		if (a === "--host") {
			if (!HOSTS.includes(value)) usage(`unknown host "${value}"`);
			opts.hosts.push(value);
		} else if (a === "--project") opts.project = value;
		else opts.home = value;
		i++;
	}
	return opts;
}
function readJson(file) {
	try {
		const parsed = JSON.parse(readFileSync(file, "utf8"));
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function onPath(name) {
	const exts = process.platform === "win32" ? (process.env["PATHEXT"] ?? ".EXE;.CMD").split(";") : [""];
	for (const dir of (process.env["PATH"] ?? "").split(delimiter)) {
		if (!dir) continue;
		for (const ext of exts) {
			const file = join(dir, name + ext);
			try {
				if (!statSync(file).isFile()) continue;
				accessSync(file, constants.X_OK);
				return true;
			} catch {}
		}
	}
	return false;
}
function hostOfUrl(url) {
	return /^[a-z+]+:\/\/(?:[^@/]*@)?([^/:]+)/i.exec(url)?.[1] ?? /^(?:[^@/\s]+@)?([^:/\s]+):/.exec(url)?.[1];
}
function hostsFromRemotes(dir) {
	let out;
	try {
		out = execFileSync("git", [
			"-C",
			dir,
			"remote",
			"-v"
		], {
			encoding: "utf8",
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			]
		});
	} catch {
		return [];
	}
	const found = /* @__PURE__ */ new Set();
	for (const line of out.split("\n")) {
		const url = line.split(/\s+/)[1];
		const hostname = url && hostOfUrl(url)?.toLowerCase();
		if (!hostname) continue;
		for (const [suffix, kind] of REMOTE_HOSTS) if (hostname === suffix || hostname.endsWith(`.${suffix}`)) found.add(kind);
	}
	return [...found];
}
function detectManager(pkg, dir) {
	const field = typeof pkg?.["packageManager"] === "string" ? pkg["packageManager"].split("@")[0] : void 0;
	if (field === "pnpm" || field === "npm" || field === "yarn" || field === "bun") return field;
	for (const [file, manager] of [
		["pnpm-lock.yaml", "pnpm"],
		["package-lock.json", "npm"],
		["yarn.lock", "yarn"],
		["bun.lock", "bun"],
		["bun.lockb", "bun"]
	]) try {
		if (statSync(join(dir, file)).isFile()) return manager;
	} catch {}
	return null;
}
function scriptEntry(manager, script) {
	if (manager === "npm") return script === "test" ? "Bash(npm test *)" : `Bash(npm run ${script} *)`;
	if (manager === "bun") return `Bash(bun run ${script} *)`;
	return `Bash(${manager} ${script} *)`;
}
const normalize = (entry) => entry.replace(/:\*\)$/, " *)");
function loadPresent(files) {
	const present = [];
	for (const file of files) {
		const permissions = readJson(file)?.["permissions"];
		if (!permissions || typeof permissions !== "object") continue;
		for (const effect of [
			"allow",
			"deny",
			"ask"
		]) {
			const list = permissions[effect];
			if (!Array.isArray(list)) continue;
			for (const entry of list) if (typeof entry === "string") present.push({
				entry: normalize(entry),
				effect,
				file
			});
		}
	}
	return present;
}
function candidates(opts) {
	const pkg = readJson(join(opts.project, "package.json"));
	const scripts = pkg?.["scripts"] && typeof pkg["scripts"] === "object" ? pkg["scripts"] : {};
	const manager = detectManager(pkg, opts.project);
	const hosts = HOSTS.filter((h) => opts.hosts.includes(h));
	const safe = [];
	for (const h of hosts) for (const cmd of READ_ONLY[h]) safe.push({
		entry: `Bash(${cmd} *)`,
		reason: `Read-only ${h} CLI command`
	});
	const goodToHave = [...GOOD_TO_HAVE_GIT];
	if (manager) {
		for (const s of SAFE_SCRIPTS) if (s in scripts) safe.push({
			entry: scriptEntry(manager, s),
			reason: `Runs the repo's \`${s}\` script, which only reads; read it first`
		});
		for (const s of FIX_SCRIPTS) if (s in scripts) goodToHave.push({
			entry: scriptEntry(manager, s),
			reason: `Runs the repo's \`${s}\` script, which rewrites files that git can restore; read it first`
		});
	}
	const has = (m) => m === "npm" || onPath(m);
	const managers = [
		"pnpm",
		"npm",
		"yarn",
		"bun"
	].filter(has);
	const mk = (entries, reason) => entries.map((entry) => ({
		entry,
		reason
	}));
	const deny = [{
		group: "Force push",
		entries: mk(FORCE_PUSH, FORCE_PUSH_NOTE)
	}];
	for (const b of BYPASS_MERGE) if (hosts.includes(b.host)) deny.push({
		group: b.group,
		entries: mk(b.entries, b.note)
	});
	if (hosts.includes("gitlab")) deny.push({
		group: "Immediate merge: GitLab",
		entries: mk(IMMEDIATE_MERGE_GITLAB, "Blocks merging at once past a required pipeline; glab has no other bypass flag")
	});
	deny.push({
		group: "Repo delete",
		entries: hosts.flatMap((h) => mk(REPO_DELETE[h], "Blocks deleting the repository; other aliases the CLI accepts get past"))
	});
	deny.push({
		group: "API delete",
		entries: hosts.flatMap((h) => mk(API_DELETE[h] ?? [], "Blocks an API DELETE call; a lowercase delete gets past"))
	});
	deny.push({
		group: "Recursive delete",
		entries: mk(RECURSIVE_DELETE, "Blocks recursive forced deletes, including cleaning node_modules")
	});
	deny.push({
		group: "Publish",
		entries: managers.flatMap((m) => mk(PUBLISH[m], PUBLISH_NOTE))
	});
	if ("@changesets/cli" in {
		...pkg?.["dependencies"],
		...pkg?.["devDependencies"]
	}) deny.push({
		group: "Publish: Changesets",
		entries: [...mk([CHANGESETS_BARE], CHANGESETS_NOTE), ...managers.flatMap((m) => mk(CHANGESETS_BY_MANAGER[m], CHANGESETS_NOTE))]
	});
	deny.push({
		group: "Secrets",
		entries: [...SECRETS_GENERIC.map((entry) => ({
			entry,
			reason: SECRETS_NOTES[entry]
		})), ...hosts.map((h) => ({
			entry: SECRETS_HOST[h],
			reason: `Blocks reading the ${h} CLI login file`
		}))]
	});
	const present = loadPresent([
		join(opts.home, ".claude", "settings.json"),
		join(opts.project, ".claude", "settings.json"),
		join(opts.project, ".claude", "settings.local.json")
	]);
	const alreadyPresent = [];
	const keep = (list) => list.filter((c) => {
		const hit = present.find((p) => p.entry === normalize(c.entry));
		if (hit) alreadyPresent.push({
			entry: c.entry,
			effect: hit.effect,
			file: hit.file
		});
		return !hit;
	});
	return {
		hosts,
		packageManager: manager,
		allow: {
			safe: keep(safe),
			goodToHave: keep(goodToHave)
		},
		deny: deny.map((g) => ({
			group: g.group,
			entries: keep(g.entries)
		})).filter((g) => g.entries.length),
		alreadyPresent
	};
}
async function main(argv = process.argv.slice(2)) {
	const opts = parseArgs(argv);
	const project = resolve(opts.project ?? process.cwd());
	const hosts = opts.hosts.length ? opts.hosts : hostsFromRemotes(project);
	const result = candidates({
		project,
		home: resolve(opts.home ?? homedir()),
		hosts
	});
	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith("permission-candidates.mjs")) await main();
//#endregion
export { candidates, main };

#!/usr/bin/env node
// Compiled by `universal-plugin plugin build` from src/skills/scan-permissions.ts. Edit the source, not this file.
globalThis.__SKILL_SCRIPT__ = {"package":"repobuddy","bin":"repobuddy","version":"3.0.0","entry":"skills/review-permissions/scripts/scan-permissions.mjs","commands":{}};
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, resolve } from "node:path";
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
//#region src/skills/scan-permissions.ts
/**
* Collect and assess the permissions a user has granted to their agent harnesses.
*
*   node scripts/scan-permissions.mjs [projectDir] [--json] [--all-scopes] [--mode <mode>]
*
* Reads the permission-bearing config files of every harness it can find — Claude Code,
* Cursor CLI, Codex CLI, Copilot CLI, Gemini CLI, OpenCode — at user, project, local and
* enterprise scope, normalizes every grant into one record shape, and reports:
*
*   findings       risk-ranked grants, blanket modes, and scope-hygiene problems
*   consolidation  duplicates, rules subsumed by a broader rule, and merge candidates
*   inventory      every rule it parsed, so the agent can reason about what it did not flag
*
* `--mode auto` says the user runs Claude Code in auto mode even where no settings file sets
* `defaultMode`. In auto mode the scan also checks the `autoMode` block and flags allow rules
* that skip the classifier.
*
* Exit 0 always when the scan itself succeeded — findings are data, not failure. Exit 2 on
* bad usage. The risk levels are a first pass by pattern; they are deliberately conservative
* and know nothing about the repo. The calling agent supplies the judgment.
*/
const USAGE = "usage: node scripts/scan-permissions.mjs [projectDir] [--json] [--all-scopes] [--mode <mode>]\n";
const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const allScopes = argv.includes("--all-scopes");
let modeFlag;
const positional = [];
for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (a === "--mode") {
		modeFlag = argv[++i];
		if (!modeFlag) {
			process.stderr.write(USAGE);
			process.exit(2);
		}
	} else if (a.startsWith("--mode=")) modeFlag = a.slice(7);
	else if (!a.startsWith("--")) positional.push(a);
}
if (positional.length > 1) {
	process.stderr.write(USAGE);
	process.exit(2);
}
const PROJECT = resolve(positional[0] ?? process.cwd());
const HOME = homedir();
const SOURCES = [
	{
		harness: "claude-code",
		scope: "enterprise",
		format: "json",
		file: "/etc/claude-code/managed-settings.json"
	},
	{
		harness: "claude-code",
		scope: "enterprise",
		format: "json",
		file: "/Library/Application Support/ClaudeCode/managed-settings.json"
	},
	{
		harness: "claude-code",
		scope: "user",
		format: "json",
		file: join(HOME, ".claude", "settings.json")
	},
	{
		harness: "claude-code",
		scope: "project",
		format: "json",
		file: join(PROJECT, ".claude", "settings.json")
	},
	{
		harness: "claude-code",
		scope: "local",
		format: "json",
		file: join(PROJECT, ".claude", "settings.local.json")
	},
	{
		harness: "cursor",
		scope: "user",
		format: "json",
		file: join(HOME, ".cursor", "cli-config.json")
	},
	{
		harness: "cursor",
		scope: "project",
		format: "json",
		file: join(PROJECT, ".cursor", "cli.json")
	},
	{
		harness: "codex",
		scope: "user",
		format: "toml",
		file: join(HOME, ".codex", "config.toml")
	},
	{
		harness: "copilot-cli",
		scope: "user",
		format: "json",
		file: join(HOME, ".copilot", "config.json")
	},
	{
		harness: "gemini",
		scope: "user",
		format: "json",
		file: join(HOME, ".gemini", "settings.json")
	},
	{
		harness: "gemini",
		scope: "project",
		format: "json",
		file: join(PROJECT, ".gemini", "settings.json")
	},
	{
		harness: "opencode",
		scope: "user",
		format: "json",
		file: join(HOME, ".config", "opencode", "opencode.json")
	},
	{
		harness: "opencode",
		scope: "project",
		format: "json",
		file: join(PROJECT, "opencode.json")
	}
];
const rules = [];
const findings = [];
const notes = [];
const scanned = [];
/** Claude Code auto mode: set by a `defaultMode` of `auto` in any settings file, or `--mode auto`. */
let autoModeSeen = modeFlag === "auto";
const autoModeBlocks = [];
const LEVELS = [
	"critical",
	"high",
	"medium",
	"low",
	"info"
];
const rank = (l) => LEVELS.indexOf(l);
const addRule = (src, effect, raw) => {
	const text = String(raw).trim();
	if (!text) return;
	const m = /^([A-Za-z_][\w-]*)\((.*)\)$/s.exec(text);
	rules.push({
		harness: src.harness,
		scope: src.scope,
		file: src.file,
		effect,
		tool: m ? m[1] : text,
		arg: m ? m[2].trim() : "",
		raw: text
	});
};
const addFinding = (level, code, title, detail, where, fix) => findings.push({
	level,
	code,
	title,
	detail,
	where,
	fix
});
/** JSON with // and block comments tolerated — several harnesses ship commented defaults. */
const parseJson = (text, file) => {
	const clean = text.replace(/^\uFEFF/, "");
	try {
		return JSON.parse(clean);
	} catch {
		try {
			return JSON.parse(clean.replace(/^\s*\/\/[^\n]*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""));
		} catch (e) {
			notes.push(`could not parse ${file} as JSON (${e.message}) — read it by hand`);
			return null;
		}
	}
};
/** Brackets balance across whatever has been accumulated so far. */
const balanced = (text) => (text.match(/\[/g) ?? []).length === (text.match(/\]/g) ?? []).length;
/**
* A deliberately small TOML reader: enough to pull top-level scalars, the keys of
* [table] headers, and scalars inside a named table. Codex's config.toml is the only
* TOML source and only a handful of its keys carry permissions.
*
* Every line it cannot read is counted and reported, never dropped in silence: a
* permission this reader skips would otherwise read to the user as a permission they
* do not have.
*/
const parseTomlLite = (text, file) => {
	const top = {};
	const tables = {};
	const skipped = [];
	let current = null;
	const lines = text.split("\n");
	const strip = (line) => line.replace(/(^|\s)#.*$/, "").trim();
	for (let i = 0; i < lines.length; i++) {
		const trimmed = strip(lines[i]);
		if (!trimmed) continue;
		const header = /^\[\[?([^\]]+)\]\]?$/.exec(trimmed);
		if (header) {
			current = header[1].trim();
			tables[current] ??= {};
			continue;
		}
		const kv = /^([A-Za-z_][\w.-]*|"[^"]*")\s*=\s*(.+)$/.exec(trimmed);
		if (!kv) {
			skipped.push(i + 1);
			continue;
		}
		const key = kv[1].replace(/^"|"$/g, "");
		let value = kv[2].trim();
		if (value.startsWith("[") && !balanced(value)) {
			while (i + 1 < lines.length && !balanced(value)) value += ` ${strip(lines[++i])}`;
			if (!balanced(value)) skipped.push(i + 1);
		}
		if (/^".*"$/.test(value)) value = value.slice(1, -1);
		else if (value === "true" || value === "false") value = value === "true";
		else if (/^\[[\s\S]*\]$/.test(value)) value = value.slice(1, -1).split(",").map((v) => v.trim().replace(/^"|"$/g, "")).filter(Boolean);
		if (current) tables[current][key] = value;
		else top[key] = value;
	}
	if (skipped.length) notes.push(`${file}: ${skipped.length} line(s) the built-in TOML reader could not parse (line ${skipped.join(", ")}) — read them by hand, they may carry permissions this report is missing`);
	return {
		top,
		tables
	};
};
const extractPermissionsBlock = (src, permissions) => {
	if (!permissions || typeof permissions !== "object") return false;
	for (const effect of [
		"allow",
		"deny",
		"ask"
	]) for (const entry of permissions[effect] ?? []) addRule(src, effect, entry);
	return true;
};
const extractors = {
	"claude-code": (src, cfg) => {
		const p = cfg.permissions ?? {};
		extractPermissionsBlock(src, p);
		const where = `${src.harness} ${src.scope} (${src.file})`;
		if (p.defaultMode) assessMode("defaultMode", p.defaultMode, where);
		if (p.defaultMode === "auto") autoModeSeen = true;
		if (cfg.autoMode && typeof cfg.autoMode === "object") autoModeBlocks.push({
			src,
			block: cfg.autoMode
		});
		for (const dir of p.additionalDirectories ?? []) assessExtraDir(dir, where);
		if (cfg.enableAllProjectMcpServers === true) addFinding("high", "mcp-auto-enable", "Every project-declared MCP server is enabled automatically", "`enableAllProjectMcpServers` turns on whatever MCP servers a repo declares in `.mcp.json`. Cloning a repo is then enough to add tools you never reviewed.", where, "Remove the key and approve MCP servers per project.");
		if (cfg.skipDangerousModePermissionPrompt === true) addFinding("high", "skip-danger-prompt", "The confirmation before permission-bypass mode is suppressed", "`skipDangerousModePermissionPrompt` removes the last human checkpoint in front of the mode that skips all permission checks.", where, "Remove the key unless this machine is a disposable sandbox.");
		if (cfg.hooks && Object.keys(cfg.hooks).length) addFinding("info", "hooks-present", `${Object.keys(cfg.hooks).length} hook event(s) configured`, "Hooks run shell commands around tool calls with no permission prompt of their own, so they sit outside the allowlist entirely. They belong in the same review.", where, "Read each hook command and confirm it is still one you want running on every matching tool call.");
		const servers = Object.keys(cfg.mcpServers ?? {});
		if (servers.length) addFinding("info", "mcp-servers", `${servers.length} MCP server(s) configured: ${servers.join(", ")}`, "Each server contributes a tool surface that the allowlist can only govern by tool name. A server-wide allow rule grants every tool it exposes, now and after any update.", where, "Prefer per-tool rules (`mcp__server__tool`) over a bare server-wide grant.");
	},
	cursor: (src, cfg) => {
		extractPermissionsBlock(src, cfg.permissions);
		const where = `${src.harness} ${src.scope} (${src.file})`;
		if (cfg.approvalMode && cfg.approvalMode !== "allowlist") assessMode("approvalMode", cfg.approvalMode, where);
		if (cfg.sandbox?.mode === "disabled") addFinding("medium", "sandbox-off", "Cursor CLI sandbox is disabled", "With the sandbox off, the allowlist is the only thing between a command and the rest of the machine — a shell rule reaches every file the user can reach, not just the workspace.", where, "Turn the sandbox on, or accept it knowingly and keep the shell allowlist narrow.");
	},
	codex: (src, { top, tables }) => {
		const where = `${src.harness} ${src.scope} (${src.file})`;
		if (top.approval_policy) assessMode("approval_policy", top.approval_policy, where);
		if (top.sandbox_mode) assessMode("sandbox_mode", top.sandbox_mode, where);
		const ws = tables.sandbox_workspace_write ?? {};
		if (ws.network_access === true) addFinding("high", "sandbox-network", "The Codex workspace sandbox has network access", "Network access inside the sandbox turns any write permission into a possible exfiltration path: whatever the agent can read, it can also send.", where, "Set `network_access = false` and grant network per session when a task genuinely needs it.");
		for (const dir of ws.writable_roots ?? []) assessExtraDir(dir, where);
		const trusted = Object.keys(tables).filter((t) => t.startsWith("projects.") && String(tables[t].trust_level) === "trusted");
		if (trusted.length) {
			const paths = trusted.map((t) => t.slice(9).replace(/^"|"$/g, ""));
			addFinding(trusted.length > 10 ? "medium" : "low", "codex-trusted-projects", `${trusted.length} project(s) marked trusted`, "A trusted project skips the trust prompt on entry. The list only grows, and a repo that was trustworthy when it was added is not re-checked after it changes hands.", where, `Drop entries you no longer work in. Currently trusted: ${paths.join(", ")}`);
		}
		for (const name of Object.keys(tables)) if (name.startsWith("mcp_servers.")) addRule(src, "allow", `mcp__${name.slice(12).replace(/^"|"$/g, "")}`);
	},
	"copilot-cli": (src, cfg) => {
		const where = `${src.harness} ${src.scope} (${src.file})`;
		let matched = extractPermissionsBlock(src, cfg.permissions);
		for (const key of ["allowed_tools", "allowedTools"]) for (const entry of cfg[key] ?? []) {
			addRule(src, "allow", entry);
			matched = true;
		}
		for (const key of ["denied_tools", "deniedTools"]) for (const entry of cfg[key] ?? []) {
			addRule(src, "deny", entry);
			matched = true;
		}
		const trusted = cfg.trusted_folders ?? cfg.trustedFolders ?? [];
		for (const dir of trusted) {
			assessExtraDir(dir, where);
			matched = true;
		}
		if (!matched) notes.push(`${src.file} exists but exposes no permission keys this scanner knows — open it and check for grants by hand`);
	},
	gemini: (src, cfg) => {
		const where = `${src.harness} ${src.scope} (${src.file})`;
		for (const entry of cfg.tools?.allowed ?? cfg.coreTools ?? []) addRule(src, "allow", entry);
		for (const entry of cfg.tools?.exclude ?? cfg.excludeTools ?? []) addRule(src, "deny", entry);
		if (cfg.autoAccept === true) assessMode("autoAccept", "true", where);
		for (const [name, server] of Object.entries(cfg.mcpServers ?? {})) if (server?.trust === true) addFinding("high", "mcp-trusted", `MCP server \`${name}\` is trusted`, "A trusted MCP server bypasses the confirmation on every tool it exposes, including tools added in a later version of that server.", where, "Remove `trust: true` and confirm its tools per call, or pin the server to a version you have read.");
	},
	opencode: (src, cfg) => {
		const perm = cfg.permission;
		if (!perm) return;
		for (const [key, value] of Object.entries(perm)) if (typeof value === "string") {
			if (value === "allow") addRule(src, "allow", key === "bash" ? "Bash(*)" : `${key}(*)`);
			if (value === "deny") addRule(src, "deny", key === "bash" ? "Bash(*)" : `${key}(*)`);
		} else if (value && typeof value === "object") {
			for (const [pattern, decision] of Object.entries(value)) if (decision === "allow" || decision === "deny") addRule(src, decision, `Bash(${pattern})`);
		}
	}
};
const MODES = {
	bypassPermissions: [
		"critical",
		"Permission checks are off by default",
		"Every tool call runs unprompted, including shell commands that delete, publish, or send data. The allowlist below is decoration while this is set."
	],
	"danger-full-access": [
		"critical",
		"The sandbox is fully disabled",
		"The agent runs with the full authority of the user account — every file, every network call, no confinement."
	],
	never: [
		"critical",
		"Approval is never requested",
		"Nothing pauses for a human. Combined with any write or network capability this is unattended execution."
	],
	yolo: [
		"critical",
		"Approval is never requested",
		"Nothing pauses for a human."
	],
	"run-everything": [
		"critical",
		"Every command runs without approval",
		"Nothing pauses for a human, in any category."
	],
	true: [
		"high",
		"Actions are auto-accepted",
		"Tool calls proceed without confirmation. Scope it down or turn it off for anything but a throwaway workspace."
	],
	acceptEdits: [
		"medium",
		"File edits are auto-accepted",
		"Edits land without confirmation. Reasonable inside a clean git worktree; risky where the agent can also reach files git does not track."
	],
	"on-failure": [
		"low",
		"Approval is requested only after a failure",
		"Commands run first and ask later."
	],
	auto: [
		"low",
		"The harness decides when to prompt",
		"What counts as prompt-worthy is the harness’s judgment, not yours, and it changes between versions."
	]
};
function assessMode(key, value, where) {
	const entry = MODES[String(value)];
	if (!entry) {
		addFinding("info", "mode-unknown", `\`${key}\` is set to \`${value}\``, "This scanner does not know what that value auto-approves.", where, "Check the harness documentation for what this mode grants.");
		return;
	}
	const [level, title, detail] = entry;
	addFinding(level, `mode-${key}`, `${title} (\`${key} = ${value}\`)`, detail, where, "Move to a prompting mode for anything but a disposable sandbox.");
}
function assessExtraDir(dir, where) {
	const path = String(dir).replace(/^~(?=\/|$)/, HOME);
	const outsideProject = !resolve(path).startsWith(PROJECT);
	const isHomeRoot = resolve(path) === HOME || resolve(path) === "/";
	const level = isHomeRoot ? "critical" : outsideProject ? "high" : "low";
	if (level === "low") return;
	addFinding(level, "extra-dir", `Write access extends outside the project: \`${dir}\``, isHomeRoot ? "The whole home directory is in scope, which includes SSH keys, cloud credentials, shell profiles, and every other repo." : "A directory outside the project is writable, so a mistake is not contained by the repo’s git history.", where, "Narrow it to the specific subdirectory the work needs, or grant it per session instead of persistently.");
}
const SHELL_TOOLS = /* @__PURE__ */ new Set([
	"Bash",
	"Shell",
	"run_shell_command",
	"shell",
	"execute"
]);
/** [regex, level, why] — first match wins, so order from most specific to least. */
const COMMAND_RISK = [
	[
		/^\s*$|^\*+$|^\.\*$/,
		"critical",
		"grants every shell command there is"
	],
	[
		/\brm\s+(-\w*[rf]|--recursive|--force)/,
		"critical",
		"recursive or forced deletion"
	],
	[
		/\b(mkfs|dd\s+if=|shutdown|reboot|chown\s+-R\s+\/|chmod\s+(-R\s+)?777)\b/,
		"critical",
		"system-level destruction or a permissions hole"
	],
	[
		/\bsudo\b/,
		"critical",
		"runs as root, which puts the whole machine inside the grant"
	],
	[
		/\bgit\s+push\b.*(--force(?![\w-])|\s-(?!-)\w*f)/,
		"high",
		"rewrites published history, overwriting whatever is on the remote"
	],
	[
		/\bgit\s+push\b.*--force-(with-lease|if-includes)/,
		"medium",
		"rewrites published history, but refuses to overwrite commits the pusher has not seen"
	],
	[
		/\bgit\s+(reset\s+--hard|clean\b|checkout\s+--\s|restore\b)/,
		"high",
		"discards uncommitted work irrecoverably"
	],
	[
		/\bgit\s+stash\s+(drop|clear|pop)\b/,
		"high",
		"discards stashed work, on a stash stack every worktree shares"
	],
	[
		/^\s*git\s+stash\s*[*:]*\s*$/,
		"medium",
		"admits `drop`, `clear`, and `pop` on a stash stack every worktree of the repo shares; grant `push`, `list`, `show`, and `apply` instead"
	],
	[
		/\b(gh|glab)\s+(repo\s+delete|release|pr\s+merge|workflow\s+run|secret|auth)/,
		"high",
		"acts on the remote: merges, releases, secrets, or credentials"
	],
	[
		/\bnpm\s+publish|pnpm\s+publish|yarn\s+publish|cargo\s+publish|twine\s+upload/,
		"high",
		"publishes an artifact the world can install"
	],
	[
		/\b(terraform|pulumi)\s+(apply|destroy)|\bkubectl\s+(apply|delete|exec)|\baws\s+|\bgcloud\s+|\baz\s+/,
		"high",
		"changes cloud or cluster state"
	],
	[
		/\b(curl|wget|nc|ncat|telnet|scp|rsync|ssh)\b/,
		"high",
		"reaches the network, so anything readable is also sendable"
	],
	[
		/\b(eval|source)\b|\b(bash|sh|zsh)\s+-c\b|\bnode\s+-e\b|\bpython3?\s+-c\b|\bperl\s+-e\b/,
		"high",
		"executes arbitrary code supplied inline, which no pattern can constrain"
	],
	[
		/\b(npx|pnpx|bunx|uvx|pipx\s+run)\b/,
		"high",
		"downloads and runs a package chosen at call time"
	],
	[
		/\bdocker\s+(run|exec)|\bdocker-compose\s+up/,
		"high",
		"starts containers, commonly with host mounts"
	],
	[
		/\bgit\s+push\b/,
		"medium",
		"pushes to a remote — outward-facing and hard to take back"
	],
	[
		/\b(npm|pnpm|yarn|bun)\s+(i|install|add|update|up)\b/,
		"medium",
		"installs packages, and install scripts run arbitrary code"
	],
	[
		/\bgit\s+config\b/,
		"medium",
		"changes git behavior, including hooks and remotes"
	],
	[
		/\b(cat|less|head|tail|grep|rg)\b.*(\.env|\.npmrc|id_rsa|id_ed25519|credentials|\.aws|\.ssh|secrets?)/,
		"high",
		"reads credential material"
	],
	[
		/^\s*(ls|pwd|cat|head|tail|grep|rg|fd|find|wc|which|echo|date|tree)\b/,
		"low",
		"read-only inspection"
	],
	[
		/^\s*git\s+(status|log|diff|show|branch|remote\s+-v|blame)\b/,
		"low",
		"read-only git inspection"
	],
	[
		/^\s*(pnpm|npm|yarn|bun)\s+(test|lint|check|typecheck|build|format)\b/,
		"low",
		"a project script — as safe as the script is"
	]
];
const WILDCARD_TAIL = /[*:]\s*$|\*\)?$/;
function assessRule(rule) {
	if (rule.effect !== "allow") return null;
	const where = `${rule.harness} ${rule.scope} (${rule.file})`;
	const tool = rule.tool;
	const arg = rule.arg;
	if (SHELL_TOOLS.has(tool)) {
		let [, level, why] = COMMAND_RISK.find(([re]) => re.test(arg)) ?? [
			null,
			"low",
			"not in the risk catalog — judge it against what that command can do in this repo"
		];
		const notes = [why];
		const openEnded = WILDCARD_TAIL.test(arg) || arg === "";
		const stem = arg.replace(/[\s*:]+$/, "").trim();
		const subcommandWide = openEnded && stem.split(/\s+/).filter(Boolean).length <= 1;
		if (openEnded) notes.push(subcommandWide ? "the wildcard sits where the subcommand goes, so every subcommand of that tool is granted, not just the one you had in mind" : "the trailing wildcard grants every flag and argument that invocation accepts");
		if (subcommandWide && rank(level) > rank("medium")) level = "medium";
		if (subcommandWide && /^(git|gh|glab|npm|pnpm|yarn|bun|docker|make|cargo|kubectl)$/.test(stem)) level = "high";
		if (!openEnded && level === "high") {
			level = "medium";
			notes.push("bounded, though, since the rule spells the invocation out with no wildcard");
		}
		return {
			level,
			why: notes.join("; "),
			where
		};
	}
	if (tool === "WebSearch" || tool === "web_search") return {
		level: "low",
		why: "sends query text to a search provider — worth knowing about, since the queries an agent writes can carry context from the repo",
		where
	};
	if (tool === "WebFetch" || tool === "web_fetch") {
		if (!arg || arg === "*" || /domain:\*/.test(arg)) return {
			level: "high",
			why: "fetches any URL, which is a data path out of this machine",
			where
		};
		return {
			level: "low",
			why: "fetches a fixed domain",
			where
		};
	}
	if (tool === "Read" || tool === "read_file") {
		if (/\.env|\.ssh|id_rsa|credentials|\.aws|\.npmrc|secrets?/.test(arg)) return {
			level: "high",
			why: "reads credential material",
			where
		};
		if (!arg || /^(\*\*?|\/\*\*|~\/\*\*)$/.test(arg)) return {
			level: "medium",
			why: "reads anything on disk, including files outside the repo",
			where
		};
		return {
			level: "low",
			why: "scoped read",
			where
		};
	}
	if (tool === "Write" || tool === "Edit" || tool === "MultiEdit" || tool === "write_file") {
		if (!arg || arg === "*" || arg.startsWith("/") || arg.startsWith("~")) return {
			level: "high",
			why: "writes outside the repo, where git cannot undo it",
			where
		};
		return {
			level: "low",
			why: "scoped write",
			where
		};
	}
	if (/^mcp__/.test(tool)) {
		if (tool.split("__").length === 2) return {
			level: "medium",
			why: "grants every tool the MCP server exposes, including ones added in a later version",
			where
		};
		return {
			level: "low",
			why: "a single MCP tool",
			where
		};
	}
	if (tool === "*" || rule.raw === "*") return {
		level: "critical",
		why: "grants every tool the harness has",
		where
	};
	return {
		level: "info",
		why: "not classified by this scanner",
		where
	};
}
const consolidation = [];
function analyzeConsolidation() {
	const allows = rules.filter((r) => r.effect === "allow");
	const byRaw = /* @__PURE__ */ new Map();
	for (const r of allows) {
		const key = `${r.harness}|${r.raw}`;
		byRaw.set(key, [...byRaw.get(key) ?? [], r]);
	}
	for (const [key, group] of byRaw) if (group.length > 1) consolidation.push({
		kind: "duplicate",
		rule: key.split("|")[1],
		detail: `declared ${group.length} times: ${group.map((g) => `${g.scope}`).join(", ")}`,
		fix: "Keep the one at the broadest scope that should hold it and delete the rest — a rule in two places is a rule that only gets narrowed in one."
	});
	const covers = (arg, prefix) => arg === prefix || arg.startsWith(`${prefix} `) || /\W$/.test(prefix) && arg.startsWith(prefix);
	for (const r of allows) {
		if (!WILDCARD_TAIL.test(r.arg)) continue;
		const prefix = r.arg.replace(/[*:]\s*$/, "").trim();
		if (prefix.length < 3) continue;
		for (const other of allows) {
			if (other === r || other.tool !== r.tool || other.harness !== r.harness) continue;
			if (other.raw === r.raw) continue;
			if (covers(other.arg, prefix)) consolidation.push({
				kind: "subsumed",
				rule: other.raw,
				detail: `already covered by \`${r.raw}\` (${r.scope})`,
				fix: "Delete the narrower rule, or narrow the broad one — keeping both hides how wide the grant actually is."
			});
		}
	}
	const clusters = /* @__PURE__ */ new Map();
	for (const r of allows) {
		if (!SHELL_TOOLS.has(r.tool) || WILDCARD_TAIL.test(r.arg)) continue;
		const head = r.arg.split(/\s+/).slice(0, 2).join(" ");
		if (!head) continue;
		const key = `${r.harness}|${r.tool}|${head}`;
		clusters.set(key, [...clusters.get(key) ?? [], r]);
	}
	for (const [key, group] of clusters) {
		if (group.length < 3) continue;
		const [, tool, head] = key.split("|");
		consolidation.push({
			kind: "mergeable",
			rule: group.map((g) => g.raw).join(", "),
			detail: `${group.length} rules all start with \`${head}\``,
			fix: `Consider one \`${tool}(${head} *)\` rule — but only if every flag that prefix can take is one you would approve, since merging widens as well as tidies.`
		});
	}
	for (const r of allows) {
		if (r.scope === "local") continue;
		if (/(\/(home|Users)\/[^\s"')]+)/.exec(r.raw)) consolidation.push({
			kind: "misplaced",
			rule: r.raw,
			detail: `an absolute machine path in a ${r.scope}-scope file`,
			fix: "Move it to the local (uncommitted) scope, or make it relative — a path like this is a grant that only makes sense on one machine and a puzzle everywhere else."
		});
		if (r.scope === "user" && /\bgh\s+pr\s+merge|publish|deploy|release/.test(r.arg)) consolidation.push({
			kind: "overbroad-scope",
			rule: r.raw,
			detail: "an outward-facing grant sitting at user scope, so it applies to every repo you open",
			fix: "Move it to the one project that needs it."
		});
	}
}
function analyzeDenyBaseline() {
	const denies = rules.filter((r) => r.effect === "deny");
	const harnesses = [...new Set(rules.map((r) => r.harness))];
	if (!harnesses.length) return;
	const covers = (re) => denies.some((d) => re.test(d.raw));
	const missing = [];
	if (!covers(/\.env/)) missing.push("`Read(./.env)` and `Read(./**/.env*)` — keep secrets out of the transcript");
	if (!covers(/\.ssh|id_rsa/)) missing.push("`Read(~/.ssh/**)` — private keys");
	if (!covers(/force|\s-f\b/)) missing.push("`Bash(git push --force *)` and `Bash(git push -f *)` — blind history rewrites (the space before `*` keeps `--force-with-lease` allowed)");
	if (!covers(/rm\s+-rf|rm -rf/)) missing.push("`Bash(rm -rf *)` — recursive deletion");
	const trailing = "For a flag after the arguments (`git push origin main --force`), add `Bash(git push * --force)` and `Bash(git push * --force *)`, and the same two for `-f`: a trailing ` *` matches the bare flag only when it is the rule’s only wildcard, so the flag at the very end needs its own entry.";
	for (const d of denies) {
		const leading = /\bgit\s+push\s+--force\*/.test(d.arg);
		if (!leading && !/\bgit\s+push\s+\*\s+--force\*/.test(d.arg)) continue;
		addFinding("low", "deny-overmatch", `\`${d.raw}\` also blocks \`git push --force-with-lease\``, `With no space before the \`*\`, the rule matches any \`--force\` flag that starts ${leading ? "the command" : "a later word"}, including \`--force-with-lease\` — the push that refuses to overwrite commits it has not seen, and the routine way to update a rebased branch. It also misses \`-f\`.`, `${d.harness} ${d.scope} (${d.file})`, leading ? `Replace it with \`Bash(git push --force *)\` and \`Bash(git push -f *)\`; a trailing \` *\` also matches the bare flag. A prefix rule cannot tell \`main\` from a feature branch (that is branch protection\u2019s job). ${trailing}` : `Replace it with \`Bash(git push * --force)\`, \`Bash(git push * --force *)\`, \`Bash(git push * -f)\`, and \`Bash(git push * -f *)\`. ${trailing}`);
	}
	if (missing.length) addFinding(denies.length ? "low" : "medium", "deny-baseline", `No deny rule covers ${missing.length} of the cheap high-value cases`, "Deny beats allow in every harness that has both, so a short deny list is the one control that holds even when a broad allow rule or a permissive mode is in play.", harnesses.join(", "), `Consider adding: ${missing.join("; ")}`);
}
/** Commands that act on a remote or reach other people. */
const OUTWARD = /\bgit\s+push\b|\b(gh\s+pr\s+merge|glab\s+mr\s+merge|tea\s+pulls\s+merge|fj\s+pr\s+merge|az\s+repos\s+pr\s+update)\b|\b(gh|glab|tea)\s+api\b|\bgh\s+workflow\s+run\b|\b(gh|glab)\s+release\b|\b(npm|pnpm|yarn|bun)\s+(\S+\s+)?publish\b|\bchangeset\s+publish\b|\bdeploy\b/;
const MERGE = /\b(gh\s+pr\s+merge|glab\s+mr\s+merge|tea\s+pulls\s+merge|fj\s+pr\s+merge|az\s+repos\s+pr\s+update)\b/;
/** A whole host or git CLI behind one wildcard covers its push, merge, and API commands too. */
const OUTWARD_CLI = /^\s*(git|gh|glab|tea|fj|az)\s*[*:]+\s*$/;
/** The broad rules the docs say auto mode drops, or null when the rule stays in effect. */
function droppedInAutoMode(rule) {
	if (rule.tool === "Agent" || rule.tool === "Monitor") return `\`${rule.tool}\` allow rules`;
	if (rule.tool !== "Bash" && rule.tool !== "PowerShell") return null;
	const arg = rule.arg.trim();
	if (arg === "" || /^\*+$/.test(arg)) return `blanket \`${rule.tool}(*)\``;
	if (/^(python3?|node|ruby|perl|php|deno|bash|sh|zsh)\s*[*:]+$/.test(arg)) return "a wildcarded interpreter";
	if (/^(npm|pnpm|yarn|bun)\s+run\s*[*:]+$/.test(arg)) return "a package-manager run command";
	return null;
}
function analyzeAutoMode() {
	const userBlocks = autoModeBlocks.filter((b) => b.src.scope === "user" || b.src.scope === "enterprise");
	for (const { src } of autoModeBlocks) {
		if (src.scope !== "project" && src.scope !== "local") continue;
		addFinding("medium", "automode-ignored", "An `autoMode` block sits in a project settings file, where the classifier ignores it", "Claude Code reads `autoMode` only from `~/.claude/settings.json`, managed settings, and `--settings`, so a repo cannot grant itself exceptions. None of these entries reach the classifier.", `${src.harness} ${src.scope} (${src.file})`, "Move the entries you want to `~/.claude/settings.json` and delete the block here.");
	}
	for (const { src, block } of userBlocks) {
		const where = `${src.harness} ${src.scope} (${src.file})`;
		for (const key of ["soft_deny", "hard_deny"]) {
			const list = block[key];
			if (!Array.isArray(list) || list.includes("$defaults")) continue;
			addFinding("high", "automode-no-defaults", `\`autoMode.${key}\` replaces the built-in rules`, `A \`${key}\` list without \`"$defaults"\` discards every built-in ${key === "soft_deny" ? "soft block, including force push, `curl | bash`, production deploys, and auto-mode bypass" : "hard block, including data exfiltration"}.`, where, `Add \`"$defaults"\` to \`autoMode.${key}\`, unless you copied every built-in rule in on purpose (\`claude auto-mode defaults\` prints them).`);
		}
		for (const key of ["environment", "allow"]) {
			const list = block[key];
			if (!Array.isArray(list)) continue;
			for (const entry of list) {
				if (typeof entry !== "string" || entry === "$defaults") continue;
				if (!templateMarkers(entry).length) continue;
				addFinding("low", "automode-template-text", `\`autoMode.${key}\` entry still holds template text: "${entry.length > 80 ? `${entry.slice(0, 77)}...` : entry}"`, "The classifier reads the entry as written, placeholders and instructions included, so it tells the classifier nothing about your setup.", where, "Fill it in, or remove it (`init-buddy` drafts environment entries from `gh`).");
			}
		}
	}
	if (!autoModeSeen) {
		if (userBlocks.length) addFinding("info", "automode-mode-unknown", "`autoMode` is configured, but no settings file sets `defaultMode` to `auto`", "If you start sessions in auto mode (`--permission-mode auto`, or Shift+Tab), allow rules for outward-facing commands skip its classifier.", userBlocks.map(({ src }) => `${src.harness} ${src.scope} (${src.file})`).join(", "), "Re-run with `--mode auto` to check them.");
		return;
	}
	const classifyAllShell = userBlocks.some(({ block }) => block.classifyAllShell === true);
	const shellAllows = rules.filter((r) => r.harness === "claude-code" && r.effect === "allow");
	if (classifyAllShell) addFinding("info", "automode-classify-all-shell", "`autoMode.classifyAllShell` suspends every Bash and PowerShell allow rule in auto mode", "The classifier judges every shell command, so the shell allow rules apply only in other modes.", userBlocks.map(({ src }) => `${src.harness} ${src.scope} (${src.file})`).join(", "), "Nothing to change. Each shell command now costs a classifier call.");
	for (const rule of shellAllows) {
		const where = `${rule.harness} ${rule.scope} (${rule.file})`;
		const dropped = droppedInAutoMode(rule);
		if (dropped) {
			addFinding("info", "auto-dropped-allow", `\`${rule.raw}\` has no effect in auto mode`, `Auto mode drops ${dropped} while it is active, and restores it when the session leaves auto mode.`, where, "Keep it only if you need it in other modes.");
			continue;
		}
		if (classifyAllShell || rule.tool !== "Bash" && rule.tool !== "PowerShell") continue;
		if (!OUTWARD.test(rule.arg) && !OUTWARD_CLI.test(rule.arg)) continue;
		const merge = MERGE.test(rule.arg) || OUTWARD_CLI.test(rule.arg);
		addFinding("medium", "auto-outward-allow", `\`${rule.raw}\` skips the auto-mode classifier`, `A matching allow rule resolves before the classifier, so this outward-facing command runs on a text match, without the classifier's check of which repo, branch, or PR it touches.${merge ? " For a merge, the built-in Merge Without Review block and any `autoMode.allow` merge rule never see it, and a bypass flag such as `--admin` is stopped only by the deny list." : ""}`, where, "Remove it from `permissions.allow` and leave the command to the classifier. Add it to `permissions.ask` if you want a person every time, or an `autoMode.allow` rule for an exception (`init-buddy` drafts them).");
	}
}
for (const src of SOURCES) {
	if (!existsSync(src.file)) continue;
	if (!allScopes && src.scope === "enterprise" && platform() !== "darwin" && src.file.includes("Library")) continue;
	let text;
	try {
		text = readFileSync(src.file, "utf8");
	} catch (e) {
		notes.push(`could not read ${src.file}: ${e.message}`);
		continue;
	}
	const parsed = src.format === "toml" ? parseTomlLite(text, src.file) : parseJson(text, src.file);
	if (!parsed) continue;
	scanned.push({
		harness: src.harness,
		scope: src.scope,
		file: src.file
	});
	extractors[src.harness]?.(src, parsed);
}
if (!scanned.length) notes.push(`no harness config found for ${PROJECT} or ${HOME} — either nothing is configured, or this harness stores permissions somewhere this scanner does not know about`);
for (const rule of rules) {
	const verdict = assessRule(rule);
	if (!verdict) continue;
	rule.level = verdict.level;
	rule.why = verdict.why;
	if (rank(verdict.level) <= rank("medium")) addFinding(verdict.level, "rule", `\`${rule.raw}\``, verdict.why, verdict.where, "Narrow it to the exact invocation you need, or drop it and approve per call.");
}
analyzeConsolidation();
analyzeDenyBaseline();
analyzeAutoMode();
findings.sort((a, b) => rank(a.level) - rank(b.level));
const report = {
	project: PROJECT,
	scanned,
	counts: {
		rules: rules.length,
		allow: rules.filter((r) => r.effect === "allow").length,
		deny: rules.filter((r) => r.effect === "deny").length,
		ask: rules.filter((r) => r.effect === "ask").length,
		...Object.fromEntries(LEVELS.map((l) => [l, findings.filter((f) => f.level === l).length]))
	},
	findings,
	consolidation,
	inventory: rules,
	notes
};
if (asJson) {
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
	process.exit(0);
}
const out = [];
out.push(`permission scan — ${PROJECT}`);
out.push("");
out.push(scanned.length ? "sources:" : "sources: none found");
for (const s of scanned) out.push(`  ${s.harness.padEnd(12)} ${s.scope.padEnd(10)} ${s.file}`);
out.push("");
out.push(`rules: ${report.counts.rules} (allow ${report.counts.allow}, deny ${report.counts.deny}, ask ${report.counts.ask})`);
out.push(`findings: ${LEVELS.map((l) => `${l} ${report.counts[l]}`).join(", ")}`);
out.push("");
for (const f of findings) {
	out.push(`[${f.level.toUpperCase()}] ${f.title}`);
	out.push(`  where: ${f.where}`);
	out.push(`  why:   ${f.detail}`);
	if (f.fix) out.push(`  fix:   ${f.fix}`);
	out.push("");
}
if (consolidation.length) {
	out.push("consolidation:");
	for (const c of consolidation) {
		out.push(`  [${c.kind}] ${c.rule}`);
		out.push(`     ${c.detail}`);
		out.push(`     ${c.fix}`);
	}
	out.push("");
}
if (notes.length) {
	out.push("notes:");
	for (const n of notes) out.push(`  - ${n}`);
}
process.stdout.write(`${out.join("\n")}\n`);
//#endregion
export {};

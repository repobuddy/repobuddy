// Compiled by `universal-plugin plugin build` from src/skills/epic-plan.ts. Edit the source, not this file.
globalThis.__SKILL_SCRIPT__ = {"package":"repobuddy","bin":"repobuddy","version":"4.8.0","entry":"skills/epic/scripts/epic-plan.mjs","commands":{}};
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// src/skills/epic-plan.ts
const USAGE = `usage: epic-plan.mjs graph --repo <owner/repo> --epic <ref> [--verbose]
       epic-plan.mjs depend --repo <owner/repo> --plan <file.json> [--prune] [--write] [--verbose]
       epic-plan.mjs sync-body --repo <owner/repo> --epic <ref> [--write] [--verbose]
       epic-plan.mjs check --repo <owner/repo> --epic <ref> [--project <title>] [--verbose]
`;
var UsageError = class extends Error {};
var RunError = class extends Error {};
const REF_RE = /https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)|(?<![\w./-])([\w.-]+\/[\w.-]+)#(\d+)|(?<![\w/&.-])#(\d+)/g;
function extractRefs(text, repo) {
	const found = [];
	for (const m of text.matchAll(REF_RE)) {
		const r = m[1] ?? m[3] ?? repo;
		const n = m[2] ?? m[4] ?? m[5];
		found.push({
			key: `${r}#${n}`,
			start: m.index,
			end: m.index + m[0].length
		});
	}
	return found;
}
function parseRef(input, repo) {
	const s = input.trim();
	const url = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)\/?$/.exec(s);
	if (url) return `${url[1]}#${url[2]}`;
	const full = /^([\w.-]+\/[\w.-]+)#(\d+)$/.exec(s);
	if (full) return `${full[1]}#${full[2]}`;
	const num = /^#?(\d+)$/.exec(s);
	if (num) return `${repo}#${num[1]}`;
	throw new UsageError(`not an issue ref: ${input}`);
}
const repoOf = (k) => k.slice(0, k.lastIndexOf("#"));
const numOf = (k) => k.slice(k.lastIndexOf("#") + 1);
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const norm = (k) => `${repoOf(k).toLowerCase()}#${numOf(k)}`;
const fmt = (k, repo) => repoOf(k).toLowerCase() === repo.toLowerCase() ? `#${numOf(k)}` : k;
const fmtAll = (ks, repo) => ks.map((k) => fmt(k, repo));
function keyFromUrl(url, fallbackRepo, number) {
	const m = /github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/.exec(url ?? "");
	return m ? `${m[1]}#${m[2]}` : `${fallbackRepo}#${number}`;
}
const realGh = (args) => execFileSync("gh", args, {
	encoding: "utf8",
	stdio: [
		"ignore",
		"pipe",
		"pipe"
	]
});
function view(gh, key, fields) {
	const repo = repoOf(key);
	let raw;
	try {
		raw = gh([
			"issue",
			"view",
			numOf(key),
			"--repo",
			repo,
			"--json",
			fields
		]);
	} catch (e) {
		throw new RunError(`gh issue view ${key} failed: ${e.message.split("\n")[0]}`);
	}
	const j = JSON.parse(raw);
	const nodes = (x) => Array.isArray(x) ? x : x?.nodes ?? [];
	const subNodes = nodes(j.subIssues);
	return {
		key: j.url ? keyFromUrl(j.url, repo, j.number) : key,
		title: j.title ?? "",
		state: j.state ?? "",
		url: j.url ?? "",
		body: j.body ?? "",
		subIssues: subNodes.map((n) => keyFromUrl(n.url, repo, n.number)),
		subNodes,
		blockedBy: nodes(j.blockedBy).map((n) => keyFromUrl(n.url, repo, n.number)),
		projects: (j.projectItems ?? []).map((p) => p.title)
	};
}
function loadEpic(gh, key, log) {
	log(`reading epic ${key}`);
	const issue = view(gh, key, "number,title,url,body,subIssues,projectItems");
	const children = issue.subNodes.map((n, i) => {
		const ck = issue.subIssues[i];
		log(`reading child ${ck}`);
		const c = view(gh, ck, "number,title,state,url,blockedBy,projectItems");
		return {
			...c,
			key: ck,
			title: c.title || n.title,
			state: c.state || n.state,
			url: c.url || n.url
		};
	});
	return {
		issue,
		repo: repoOf(key),
		children
	};
}
function analyze(graph) {
	const cycles = [];
	const state = /* @__PURE__ */ new Map();
	const stack = [];
	const visit = (k) => {
		state.set(k, 1);
		stack.push(k);
		for (const b of graph.get(k) ?? []) {
			if (!graph.has(b)) continue;
			if (state.get(b) === 1) cycles.push(stack.slice(stack.indexOf(b)));
			else if (!state.has(b)) visit(b);
		}
		stack.pop();
		state.set(k, 2);
	};
	for (const k of graph.keys()) if (!state.has(k)) visit(k);
	if (cycles.length) return {
		cycles,
		waves: null
	};
	const memo = /* @__PURE__ */ new Map();
	const wave = (k) => {
		const hit = memo.get(k);
		if (hit) return hit;
		const w = 1 + Math.max(0, ...(graph.get(k) ?? []).filter((b) => graph.has(b)).map(wave));
		memo.set(k, w);
		return w;
	};
	const waves = [];
	for (const k of graph.keys()) (waves[wave(k) - 1] ??= []).push(k);
	return {
		cycles,
		waves
	};
}
function childGraph(epic) {
	const g = /* @__PURE__ */ new Map();
	const keys = new Set(epic.children.map((c) => norm(c.key)));
	for (const c of epic.children) g.set(norm(c.key), c.blockedBy.map(norm).filter((b) => keys.has(b)));
	return g;
}
function graphCmd(gh, epicKey, log) {
	const epic = loadEpic(gh, epicKey, log);
	const g = childGraph(epic);
	const { cycles, waves } = analyze(g);
	const outside = [];
	for (const c of epic.children) for (const b of c.blockedBy) if (!g.has(norm(b)) && !outside.some((o) => same(o, b))) outside.push(b);
	const r = epic.repo;
	const display = new Map(epic.children.map((c) => [norm(c.key), c.key]));
	const show = (k) => fmt(display.get(k) ?? k, r);
	return {
		epic: fmt(epic.issue.key, r),
		children: epic.children.map((c) => ({
			ref: fmt(c.key, r),
			title: c.title,
			state: c.state,
			url: c.url,
			blockedBy: fmtAll(c.blockedBy, r)
		})),
		outside: fmtAll(outside, r),
		cycles: cycles.map((c) => c.map(show)),
		waves: waves ? waves.map((w) => w.map(show)) : null
	};
}
const refArg = (k, childRepo) => repoOf(k).toLowerCase() === childRepo.toLowerCase() ? numOf(k) : `https://github.com/${repoOf(k)}/issues/${numOf(k)}`;
const diff = (a, b) => a.filter((x) => !b.some((y) => same(x, y)));
function dependCmd(gh, repo, planFile, prune, write, log) {
	let raw;
	try {
		raw = JSON.parse(readFileSync(planFile, "utf8"));
	} catch (e) {
		throw new UsageError(`cannot read plan ${planFile}: ${e.message}`);
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new UsageError("plan must be a JSON object");
	const plan = /* @__PURE__ */ new Map();
	for (const [child, list] of Object.entries(raw)) {
		if (!Array.isArray(list) || list.some((x) => typeof x !== "string")) throw new UsageError(`plan entry ${child} must be an array of refs`);
		plan.set(parseRef(child, repo), list.map((x) => parseRef(x, repo)));
	}
	const { cycles } = analyze(new Map([...plan].map(([k, v]) => [norm(k), v.map(norm)])));
	if (cycles.length) return {
		code: 1,
		out: {
			written: false,
			error: "the planned graph has a cycle",
			cycles: cycles.map((c) => fmtAll(c, repo))
		}
	};
	const changes = [];
	for (const [child, planned] of plan) {
		log(`reading ${child}`);
		const current = view(gh, child, "number,blockedBy").blockedBy;
		const add = diff(planned, current);
		const stale = diff(current, planned);
		const remove = prune ? stale : [];
		const extra = prune ? [] : stale;
		if (add.length || remove.length || extra.length) changes.push({
			child,
			add,
			remove,
			extra
		});
	}
	const show = (c) => ({
		child: fmt(c.child, repo),
		add: fmtAll(c.add, repo),
		remove: fmtAll(c.remove, repo),
		extra: fmtAll(c.extra, repo)
	});
	if (!write) return {
		code: 0,
		out: {
			written: false,
			changes: changes.map(show)
		}
	};
	const results = [];
	for (const c of changes.filter((x) => x.add.length || x.remove.length)) {
		const childRepo = repoOf(c.child);
		const args = [
			"issue",
			"edit",
			numOf(c.child),
			"--repo",
			childRepo
		];
		if (c.add.length) args.push("--add-blocked-by", c.add.map((k) => refArg(k, childRepo)).join(","));
		if (c.remove.length) args.push("--remove-blocked-by", c.remove.map((k) => refArg(k, childRepo)).join(","));
		const label = fmt(c.child, repo);
		try {
			log(`writing ${label}`);
			gh(args);
		} catch (e) {
			results.push({
				child: label,
				ok: false,
				error: e.message.split("\n")[0] ?? "",
				verified: false
			});
			continue;
		}
		try {
			const now = view(gh, c.child, "number,blockedBy").blockedBy;
			const verified = diff(c.add, now).length === 0 && c.remove.every((r) => !now.some((n) => same(n, r)));
			results.push({
				child: label,
				ok: true,
				verified
			});
		} catch (e) {
			results.push({
				child: label,
				ok: true,
				error: e.message,
				verified: false
			});
		}
	}
	return {
		code: results.every((r) => r.ok && r.verified) ? 0 : 1,
		out: {
			written: true,
			changes: changes.map(show),
			results
		}
	};
}
const LIST_RE = /^[-*]\s+\[([ xX])\]\s+(.*)$/;
function leadingRef(line, repo) {
	const m = LIST_RE.exec(line);
	const ref = m && extractRefs(m[2], repo)[0];
	return ref && ref.start === 0 ? ref : void 0;
}
function syncBody(body, subs, repo) {
	const lines = body.split("\n");
	const h = lines.findIndex((l) => /^##\s+Child Issues\s*$/.test(l));
	if (h < 0) return {
		found: false,
		body,
		added: [],
		removed: [],
		updated: [],
		unmatched: []
	};
	let end = lines.findIndex((l, i) => i > h && /^#{1,2}\s/.test(l));
	if (end < 0) end = lines.length;
	const section = lines.slice(h + 1, end);
	const native = new Map(subs.map((s) => [norm(s.key), s]));
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	const other = [];
	const added = [];
	const removed = [];
	const updated = [];
	const unmatched = [];
	const refd = /* @__PURE__ */ new Set();
	for (const line of section) {
		const ref = leadingRef(line, repo);
		if (ref) refd.add(norm(ref.key));
	}
	let firstList = -1;
	section.forEach((line, i) => {
		const m = LIST_RE.exec(line);
		const ref = m && extractRefs(m[2], repo)[0];
		if (m && !(ref && ref.start === 0)) {
			if (firstList < 0) firstList = i;
			const title = m[2].trim();
			const sub = subs.find((x) => x.title === title && !refd.has(norm(x.key)) && !seen.has(norm(x.key)));
			if (!sub) {
				unmatched.push(title);
				out.push(line);
				return;
			}
			seen.add(norm(sub.key));
			out.push(`- [${sub.state === "CLOSED" ? "x" : " "}] ${fmt(sub.key, repo)} ${sub.title}`);
			updated.push(sub.key);
			return;
		}
		if (!m || !ref) {
			other.push(line);
			return;
		}
		if (firstList < 0) firstList = i;
		const k = norm(ref.key);
		if (seen.has(k)) return;
		seen.add(k);
		const sub = native.get(k);
		if (!sub) {
			removed.push(ref.key);
			return;
		}
		const text = m[2];
		const closed = sub.state === "CLOSED";
		if (m[1] !== " " === closed && text.slice(ref.end).trim() === sub.title) out.push(line);
		else {
			out.push(`- [${closed ? "x" : " "}] ${text.slice(0, ref.end)} ${sub.title}`);
			updated.push(ref.key);
		}
	});
	for (const s of subs) if (!seen.has(norm(s.key))) {
		out.push(`- [${s.state === "CLOSED" ? "x" : " "}] ${fmt(s.key, repo)} ${s.title}`);
		added.push(s.key);
	}
	let rebuilt;
	if (firstList >= 0) rebuilt = [
		...section.slice(0, firstList),
		...out,
		...other.slice(firstList)
	];
	else if (out.length) rebuilt = [
		"",
		...out,
		"",
		...section[0] === "" ? section.slice(1) : section
	];
	else rebuilt = section;
	return {
		found: true,
		body: [
			...lines.slice(0, h + 1),
			...rebuilt,
			...lines.slice(end)
		].join("\n"),
		added,
		removed,
		updated,
		unmatched
	};
}
function syncBodyCmd(gh, epicKey, write, log) {
	const epic = loadEpic(gh, epicKey, log);
	const r = epic.repo;
	const subs = epic.children.map((c) => ({
		key: c.key,
		title: c.title,
		state: c.state
	}));
	const res = syncBody(epic.issue.body, subs, r);
	if (!res.found) return {
		code: 1,
		out: { error: "the epic body has no \"## Child Issues\" section" }
	};
	const changed = res.body !== epic.issue.body;
	const out = {
		changed,
		added: fmtAll(res.added, r),
		removed: fmtAll(res.removed, r),
		updated: fmtAll(res.updated, r),
		unmatched: res.unmatched,
		body: res.body
	};
	if (write && changed) {
		const dir = mkdtempSync(join(tmpdir(), "epic-plan-"));
		try {
			const file = join(dir, "body.md");
			writeFileSync(file, res.body);
			log(`writing body of ${epicKey}`);
			try {
				gh([
					"issue",
					"edit",
					numOf(epicKey),
					"--repo",
					repoOf(epicKey),
					"--body-file",
					file
				]);
			} catch (e) {
				return {
					code: 1,
					out: {
						...out,
						written: false,
						error: e.message.split("\n")[0]
					}
				};
			}
			out["written"] = true;
		} finally {
			rmSync(dir, {
				recursive: true,
				force: true
			});
		}
	}
	return {
		code: 0,
		out
	};
}
const result = (id, detail, skip = false) => ({
	id,
	status: skip ? "skip" : detail.length ? "fail" : "pass",
	detail
});
function checkChildren(epic) {
	const r = epic.repo;
	const lines = epic.issue.body.split("\n");
	const h = lines.findIndex((l) => /^##\s+Child Issues\s*$/.test(l));
	if (h < 0) return result("children", ["the epic body has no \"## Child Issues\" section"]);
	let end = lines.findIndex((l, i) => i > h && /^#{1,2}\s/.test(l));
	if (end < 0) end = lines.length;
	const listed = [];
	const detail = [];
	for (const line of lines.slice(h + 1, end)) {
		const m = LIST_RE.exec(line);
		if (!m) continue;
		const ref = leadingRef(line, r);
		if (ref) listed.push(ref.key);
		else {
			const title = m[2].trim();
			const sub = epic.children.find((c) => c.title === title);
			detail.push(sub ? `the line "${title}" has no issue ref; it matches ${fmt(sub.key, r)} (run sync-body)` : `the line "${title}" has no issue ref and matches no sub-issue title`);
			if (sub) listed.push(sub.key);
		}
	}
	const native = epic.children.map((c) => c.key);
	for (const k of listed) if (!native.some((n) => same(n, k))) detail.push(`${fmt(k, r)} is listed but is not a sub-issue`);
	for (const k of native) if (!listed.some((l) => same(l, k))) detail.push(`${fmt(k, r)} is a sub-issue but is not listed`);
	if (listed.length !== native.length) detail.push(`the list has ${listed.length} lines, the epic has ${native.length} sub-issues`);
	return result("children", detail);
}
function tables(body) {
	const lines = body.split("\n");
	const found = [];
	for (let i = 0; i < lines.length; i++) {
		if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? "")) continue;
		const rows = [];
		let j = i;
		for (; j < lines.length && /^\s*\|/.test(lines[j]); j++) if (j !== i + 1) rows.push(cells(lines[j]));
		found.push(rows);
		i = j;
	}
	return found;
}
function cells(line) {
	return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim());
}
function checkRunOrder(epic) {
	const r = epic.repo;
	const startsWithRef = (c) => extractRefs(c, r)[0]?.start === 0;
	for (const rows of tables(epic.issue.body)) {
		const header = rows[0].map((c) => c.toLowerCase());
		const blockedCol = header.indexOf("blocked by");
		if (blockedCol < 0) continue;
		const body = rows.slice(1);
		const issueCol = header.findIndex((_, i) => i !== blockedCol && body.length > 0 && body.every((row) => startsWithRef(row[i] ?? "")));
		if (issueCol < 0) continue;
		const waveCol = header.indexOf("wave");
		const detail = [];
		const byChild = new Map(epic.children.map((c) => [norm(c.key), c]));
		const rowWave = /* @__PURE__ */ new Map();
		const count = /* @__PURE__ */ new Map();
		const parsed = body.map((row) => {
			const child = norm(extractRefs(row[issueCol], r)[0].key);
			count.set(child, (count.get(child) ?? 0) + 1);
			const blockers = extractRefs(row[blockedCol] ?? "", r).map((f) => norm(f.key));
			const wave = waveCol >= 0 ? Number.parseInt(row[waveCol] ?? "", 10) : NaN;
			if (!Number.isNaN(wave)) rowWave.set(child, wave);
			return {
				child,
				blockers,
				wave
			};
		});
		for (const { child, blockers, wave } of parsed) {
			const c = byChild.get(child);
			if (!c) {
				detail.push(`row ${fmt(child, r)} is not a sub-issue of the epic`);
				continue;
			}
			const actual = c.blockedBy.map(norm);
			const missing = diff(actual, blockers);
			const extra = diff(blockers, actual);
			if (missing.length) detail.push(`${fmt(child, r)}: native blocked by ${fmtAll(missing, r).join(", ")} is not in the table`);
			if (extra.length) detail.push(`${fmt(child, r)}: the table lists ${fmtAll(extra, r).join(", ")}, which is not a native blocker`);
			if (waveCol >= 0) for (const b of actual) {
				const bw = rowWave.get(b);
				if (byChild.has(b) && !Number.isNaN(wave) && bw !== void 0 && bw >= wave) detail.push(`${fmt(child, r)} (wave ${wave}) is not after its blocker ${fmt(b, r)} (wave ${bw})`);
			}
		}
		for (const c of epic.children) {
			const n = count.get(norm(c.key)) ?? 0;
			if (n !== 1) detail.push(`${fmt(c.key, r)} appears in ${n} table rows, expected 1`);
		}
		return result("run-order", detail);
	}
	return result("run-order", ["no run-order table (a \"Blocked by\" column)"], true);
}
function checkGraph(epic) {
	const { cycles } = analyze(childGraph(epic));
	return result("graph", cycles.map((c) => `cycle: ${fmtAll([...c, c[0]], epic.repo).join(" -> ")}`));
}
function checkBoard(epic, project) {
	if (!project) return result("board", ["no --project given"], true);
	const detail = [epic.issue, ...epic.children].filter((i) => !i.projects.includes(project)).map((i) => `${fmt(i.key, epic.repo)} is not on the project "${project}"`);
	return result("board", detail);
}
function checkLinks(gh, epic, log) {
	const r = epic.repo;
	const resolved = /* @__PURE__ */ new Map();
	const detail = [];
	let fence = false;
	for (const line of epic.issue.body.split("\n")) {
		if (/^\s*(```|~~~)/.test(line)) {
			fence = !fence;
			continue;
		}
		if (fence) continue;
		const refs = extractRefs(line.replace(/`[^`]*`/g, (m) => " ".repeat(m.length)), r);
		for (const { key } of refs) {
			const k = norm(key);
			if (!resolved.has(k)) {
				log(`resolving ${key}`);
				try {
					const j = JSON.parse(gh([
						"issue",
						"view",
						numOf(key),
						"--repo",
						repoOf(key),
						"--json",
						"url,number"
					]));
					resolved.set(k, norm(keyFromUrl(j.url, repoOf(key), j.number)));
				} catch {
					resolved.set(k, null);
				}
			}
			const to = resolved.get(k);
			if (to === null || to === void 0) {
				const msg = `${fmt(key, r)} does not resolve`;
				if (!detail.includes(msg)) detail.push(msg);
			} else if (to !== k && !refs.some((o) => norm(o.key) === to)) {
				const msg = `${fmt(key, r)} now resolves to ${fmt(to, r)} (transferred) and the line does not name the new ref`;
				if (!detail.includes(msg)) detail.push(msg);
			}
		}
	}
	return result("links", detail);
}
function checkCmd(gh, epicKey, project, log) {
	const epic = loadEpic(gh, epicKey, log);
	const checks = [
		checkChildren(epic),
		checkRunOrder(epic),
		checkGraph(epic),
		checkBoard(epic, project),
		checkLinks(gh, epic, log)
	];
	return {
		code: checks.some((c) => c.status === "fail") ? 1 : 0,
		out: { checks }
	};
}
function parseArgs(argv) {
	const [command, ...rest] = argv;
	if (command !== "graph" && command !== "depend" && command !== "sync-body" && command !== "check") throw new UsageError("unknown command");
	const o = {
		command,
		repo: "",
		prune: false,
		write: false,
		verbose: false
	};
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i];
		const value = () => {
			const v = rest[++i];
			if (v === void 0) throw new UsageError(`${a} needs a value`);
			return v;
		};
		if (a === "--repo") o.repo = value();
		else if (a === "--epic" && command !== "depend") o.epic = value();
		else if (a === "--plan" && command === "depend") o.plan = value();
		else if (a === "--project" && command === "check") o.project = value();
		else if (a === "--prune" && command === "depend") o.prune = true;
		else if (a === "--write" && (command === "depend" || command === "sync-body")) o.write = true;
		else if (a === "--verbose") o.verbose = true;
		else throw new UsageError(`unexpected argument ${a}`);
	}
	if (!/^[\w.-]+\/[\w.-]+$/.test(o.repo)) throw new UsageError("--repo <owner/repo> is required");
	if (command === "depend" ? !o.plan : !o.epic) throw new UsageError(command === "depend" ? "--plan is required" : "--epic is required");
	return o;
}
/** Run one command against `gh`; returns what the process would print and its exit code. */
function run(argv, gh = realGh) {
	let stderr = "";
	let o;
	try {
		o = parseArgs(argv);
	} catch (e) {
		return {
			code: 2,
			stdout: "",
			stderr: `epic-plan: ${e.message}\n${USAGE}`
		};
	}
	const log = (m) => {
		if (o.verbose) stderr += `${m}\n`;
	};
	try {
		const epic = o.epic ? parseRef(o.epic, o.repo) : "";
		const r = o.command === "graph" ? {
			code: 0,
			out: graphCmd(gh, epic, log)
		} : o.command === "depend" ? dependCmd(gh, o.repo, o.plan, o.prune, o.write, log) : o.command === "sync-body" ? syncBodyCmd(gh, epic, o.write, log) : checkCmd(gh, epic, o.project, log);
		return {
			code: r.code,
			stdout: `${JSON.stringify(r.out, null, 2)}\n`,
			stderr
		};
	} catch (e) {
		if (e instanceof UsageError) return {
			code: 2,
			stdout: "",
			stderr: `epic-plan: ${e.message}\n${USAGE}`
		};
		if (!(e instanceof RunError)) throw e;
		return {
			code: 1,
			stdout: `${JSON.stringify({ error: e.message })}\n`,
			stderr: `${stderr}epic-plan: ${e.message}\n`
		};
	}
}
/* istanbul ignore next -- the process entry point; bundles.spec.ts runs it as a child process */
function main(argv = process.argv.slice(2)) {
	const r = run(argv);
	if (r.stdout) process.stdout.write(r.stdout);
	if (r.stderr) process.stderr.write(r.stderr);
	process.exit(r.code);
}
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith("epic-plan.mjs")) main();
export { run };

#!/usr/bin/env node

import { parseArgs, styleText } from 'node:util';
import { checkName, checkNames, loadChecks } from '../src/index.js';

function printHelp() {
	console.log(`
${styleText('bold', 'caniname')} — Check availability of one or more project names

${styleText('bold', 'Usage:')}
  npx caniname <name> [...names] [options]

${styleText('bold', 'Options:')}
  -j, --json    Output results as JSON
  -h, --help    Show this help message

${styleText('bold', 'Examples:')}
  npx caniname formula-input
  npx caniname formula-input calc-input
`.trim());
}

function printResults(results) {
	const maxNameLen = Math.max(...results.map((r) => r.name.length), 0);

	for (const result of results) {
		const label = result.name.padEnd(maxNameLen);

		if (result.error) {
			const icon = styleText('yellow', '⚠');
			console.log(`  ${icon} ${styleText('bold', label)}  ${result.target} — ${styleText('yellow', result.error)}`);
		} else if (result.available) {
			const icon = styleText('green', '✔');
			console.log(`  ${icon} ${styleText('bold', label)}  ${result.target} is ${styleText('green', 'available')}`);
		} else {
			const icon = styleText('red', '✖');
			const link = styleText('dim', `(${result.url})`);
			console.log(`  ${icon} ${styleText('bold', label)}  ${result.target} is ${styleText('red', 'taken')} ${link}`);
		}
	}
}

async function main() {
	let parsed;
	try {
		parsed = parseArgs({
			allowPositionals: true,
			options: {
				json: { type: 'boolean', short: 'j', default: false },
				help: { type: 'boolean', short: 'h', default: false },
			},
		});
	} catch (err) {
		console.error(styleText('red', err instanceof Error ? err.message : 'Invalid arguments'));
		printHelp();
		process.exit(1);
	}

	const { values, positionals } = parsed;

	if (values.help) {
		printHelp();
		process.exit(0);
	}

	const names = positionals.map((n) => n.trim()).filter(Boolean);
	if (names.length === 0) {
		console.error(styleText('red', 'Error: Please provide at least one project name to check.\n'));
		printHelp();
		process.exit(1);
	}

	if (values.json) {
		const entries = await checkNames(names);
		console.log(JSON.stringify(entries.length === 1 ? entries[0] : entries, null, 2));
		const allAvailable = entries.every((e) =>
			e.results.every((r) => r.available && !r.error)
		);
		process.exit(allAvailable ? 0 : 1);
	}

	const checks = await loadChecks();
	let allAvailable = true;

	for (const name of names) {
		console.log(`\nChecking availability for ${styleText('bold', name)}…\n`);
		const results = await checkName(name, checks);
		printResults(results);

		if (!results.every((r) => r.available && !r.error)) {
			allAvailable = false;
		}
	}

	console.log('');
	process.exit(allAvailable ? 0 : 1);
}

main();

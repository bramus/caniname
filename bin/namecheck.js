#!/usr/bin/env node

import { parseArgs, styleText } from 'node:util';
import { checkName } from '../src/index.js';

function printHelp() {
	console.log(`
${styleText('bold', 'namecheck')} — Check availability of a project name

${styleText('bold', 'Usage:')}
  npx namecheck <name> [options]

${styleText('bold', 'Options:')}
  -j, --json    Output results as JSON
  -h, --help    Show this help message

${styleText('bold', 'Example:')}
  npx namecheck formula-input
`.trim());
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

	const name = positionals[0]?.trim();
	if (!name) {
		console.error(styleText('red', 'Error: Please provide a project name to check.\n'));
		printHelp();
		process.exit(1);
	}

	const results = await checkName(name);

	if (values.json) {
		console.log(JSON.stringify({ name, results }, null, 2));
		const allAvailable = results.every((r) => r.available && !r.error);
		process.exit(allAvailable ? 0 : 1);
	}

	console.log(`\nChecking availability for ${styleText('bold', name)}…\n`);

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

	console.log('');

	const allAvailable = results.every((r) => r.available && !r.error);
	process.exit(allAvailable ? 0 : 1);
}

main();

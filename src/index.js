import { readdir } from 'node:fs/promises';

const CHECKS_DIR = new URL('./checks/', import.meta.url);
const VALID_CHECK_FILENAME = /^[a-z0-9_-]+\.js$/i;

/**
 * Load all check modules from `src/checks/`.
 * Any `.js` file added to `src/checks/` exporting `{ id, name, check }`
 * will automatically be picked up.
 */
export async function loadChecks() {
	const entries = await readdir(CHECKS_DIR, { withFileTypes: true });
	const checkFiles = entries
		.filter((entry) => entry.isFile() && VALID_CHECK_FILENAME.test(entry.name))
		.map((entry) => entry.name)
		.sort();

	const modules = await Promise.all(
		checkFiles.map(async (file) => {
			const mod = await import(new URL(file, CHECKS_DIR).href);
			return mod.default ?? mod;
		})
	);

	return modules.filter((mod) => typeof mod?.check === 'function');
}

/**
 * Run all availability checks for a given project name in parallel.
 *
 * @param {string} name - The project name to check
 * @returns {Promise<Array<{ id: string, name: string, target: string, url: string, available: boolean, error?: string }>>}
 */
export async function checkName(name) {
	if (typeof name !== 'string' || !name.trim()) {
		throw new TypeError('A non-empty project name is required.');
	}

	const checks = await loadChecks();
	return Promise.all(checks.map((checker) => checker.check(name)));
}

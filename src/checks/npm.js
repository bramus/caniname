const NPM_NAME_REGEX =
	/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

/**
 * Check if a package name is available on NPM.
 *
 * @param {string} name - Package name to check
 * @returns {Promise<{ id: string, name: string, target: string, url: string, available: boolean, error?: string }>}
 */
export async function check(name) {
	const normalized = name.trim().toLowerCase();
	const target = normalized;
	const url = `https://www.npmjs.com/package/${normalized}`;

	if (!NPM_NAME_REGEX.test(normalized) || normalized.length > 214) {
		return {
			id: 'npm',
			name: 'NPM',
			target,
			url,
			available: false,
			error: 'Invalid NPM package name format',
		};
	}

	const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(normalized)}`;

	try {
		const response = await fetch(registryUrl, {
			method: 'HEAD',
			redirect: 'manual',
			signal: AbortSignal.timeout(10_000),
		});

		return {
			id: 'npm',
			name: 'NPM',
			target,
			url,
			available: response.status === 404,
		};
	} catch (err) {
		return {
			id: 'npm',
			name: 'NPM',
			target,
			url,
			available: false,
			error: err instanceof Error ? err.message : 'Request failed',
		};
	}
}

export default {
	id: 'npm',
	name: 'NPM',
	check,
};

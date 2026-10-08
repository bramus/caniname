const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/**
 * Check if `<name>.netlify.app` is available.
 *
 * @param {string} name - Project name to check
 * @returns {Promise<{ id: string, name: string, target: string, url: string, available: boolean, error?: string }>}
 */
export async function check(name) {
	const normalized = name.trim().toLowerCase();
	const target = `${normalized}.netlify.app`;
	const url = `https://${target}`;

	if (!SUBDOMAIN_REGEX.test(normalized)) {
		return {
			id: 'netlify',
			name: 'Netlify',
			target,
			url,
			available: false,
			error: 'Invalid subdomain format for Netlify',
		};
	}

	try {
		const response = await fetch(url, {
			method: 'HEAD',
			redirect: 'manual',
			signal: AbortSignal.timeout(10_000),
		});

		// Unclaimed Netlify subdomains return 404 with text/plain and no ETag.
		// Claimed sites return 200/3xx/401/etc., or a site-served 404 HTML page with an ETag.
		const isUnclaimed =
			response.status === 404 && !response.headers.has('etag');

		return {
			id: 'netlify',
			name: 'Netlify',
			target,
			url,
			available: isUnclaimed,
		};
	} catch (err) {
		return {
			id: 'netlify',
			name: 'Netlify',
			target,
			url,
			available: false,
			error: err instanceof Error ? err.message : 'Request failed',
		};
	}
}

export default {
	id: 'netlify',
	name: 'Netlify',
	check,
};

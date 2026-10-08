# namecheck

Check availability of a project name across services (Netlify, NPM, and more).

## Usage

```bash
npx namecheck formula-input
```

Or run locally:

```bash
node ./bin/namecheck.js formula-input
```

### Options

- `-j, --json`: Output results as JSON
- `-h, --help`: Show help message

## Adding New Checks

Each check lives in its own file inside [`src/checks/`](./src/checks/). Any `.js` file placed in `src/checks/` is automatically discovered and executed in parallel.

To add a new check, create `src/checks/<service>.js` with the following shape:

```js
export async function check(name) {
	const normalized = name.trim().toLowerCase();
	const target = `${normalized}.example.com`;
	const url = `https://${target}`;

	// Perform availability check...
	const available = true;

	return {
		id: 'example',
		name: 'Example',
		target,
		url,
		available,
	};
}

export default {
	id: 'example',
	name: 'Example',
	check,
};
```

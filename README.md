# caniname

Check availability of a project name across services (Netlify, NPM, and more).

> **Fun fact:** This tool was originally built under the name `namecheck`. Upon running `./bin/namecheck.js namecheck` to dogfood it before publishing, it turned out that `namecheck` was already taken on both Netlify and NPM—so we used the tool itself to find an available name: `caniname`.

## Usage

```bash
npx caniname formula-input
npx caniname formula-input calc-input
```

Or run locally:

```bash
./bin/caniname.js formula-input calc-input
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

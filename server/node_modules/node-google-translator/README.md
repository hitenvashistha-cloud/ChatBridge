# node-google-translator

A robust, free, and unlimited Google Translate API for Node.js.

This library allows you to translate text between languages using Google Translate's API without requiring an API key. It is designed to be lightweight, easy to use, and supports both CommonJS and ES Modules.

## Features

- **Free & Unlimited**: No API key required.
- **Auto-Detection**: Automatically detects the source language.
- **Dual Support**: Works seamlessly with both `require` (CommonJS) and `import` (ESM).
- **Proxy Support**: Easily configure proxies to avoid rate limiting.
- **TypeScript Support**: Includes type definitions out of the box.

## Installation

```bash
npm install node-google-translator
```

## Usage

### Basic Translation

```javascript
import { translate } from "node-google-translator";

const result = await translate("Hello world", { to: "es" });

console.log(result.text); // Hola mundo
console.log(result.raw); // Full response from Google
```

### CommonJS Usage

```javascript
const { translate } = require("node-google-translator");

translate("I love coding", { to: "fr" }).then((res) => {
  console.log(res.text); // J'aime coder
});
```

### Auto-Detect Language

If you don't specify a `from` language, it will be automatically detected.

```javascript
const res = await translate("Bonjour le monde", { to: "en" });
console.log(res.text); // Hello the world
console.log(res.raw.src); // fr
```

### Using a Proxy

To avoid `TooManyRequestsError` (429), you can use an HTTP proxy.

```javascript
import { translate } from "node-google-translator";
import HttpsProxyAgent from "https-proxy-agent";

const agent = new HttpsProxyAgent("http://your-proxy-ip:port");

const res = await translate("Hello", {
  to: "de",
  fetchOptions: { agent },
});
```

## API

### `translate(text, options)`

Returns a `Promise` that resolves to an object containing the translation result.

#### Parameters

- `text` (string): The text to translate.
- `options` (object):
  - `from` (string): Source language code (e.g., 'en', 'es'). Default: `auto`.
  - `to` (string): Target language code. Default: `en`.
  - `host` (string): Google Translate host. Default: `translate.google.com`.
  - `fetchOptions` (object): Custom options passed to `node-fetch` (e.g., headers, agent).

#### Returns

- `text` (string): The translated text.
- `raw` (object): The raw response from Google Translate, including alternative translations and confidence scores.

## Disclaimer

This package is for educational purposes and prototyping. For production environments, consider using the official [Google Cloud Translation API](https://cloud.google.com/translate).

## License

MIT

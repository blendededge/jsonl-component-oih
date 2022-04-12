# JSONL Component

The **JSONL Component** is a component that allows you to convert a JSONL file stored in attachment storage service into a JSON array.

## Configuration
Configuration options can be added to the component's `fields` object.

- `pattern`: string - a JavaScript regular expression used to match file names in the `attachments` object to be processed
- `validateExtension`: boolean - whether to only process files that match the `pattern` regular expression

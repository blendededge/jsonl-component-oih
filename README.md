# JSONL Component

The **JSONL Component** is a component that allows you to convert a JSONL file stored in attachment storage service into a JSON array.

## Configuration
Configuration options can be added to the component's `fields` object.

### Pattern
`pattern` (string)

A JavaScript regular expression used to match file names in the
`attachments` object to be processed. If not provided it will default to the regular expression `.jsonl`.


### Validate Extension

`validateExtension` (boolean)

Whether to only process files that match the regular expression `pattern`.
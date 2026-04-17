import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'protobuf-to-json',
  name: 'Protobuf to JSON',
  description: 'Decode a Protocol Buffer binary file to JSON using a .proto schema. Requires two file inputs: the .proto schema and the binary file.',
  category: 'data',
  tags: ['protobuf', 'proto', 'json', 'decode', 'binary', 'convert', 'data'],
  inputs: [
    {
      id: 'proto',
      label: '.proto Schema File',
      type: 'file',
      accept: '.proto',
    },
    {
      id: 'binary',
      label: 'Binary Protobuf File',
      type: 'file',
      accept: '.bin,.pb,.proto.bin',
    },
  ],
  options: [
    {
      id: 'messageName',
      label: 'Message Name',
      type: 'text',
      default: '',
      placeholder: 'e.g. MyMessage (leave empty to auto-detect)',
      helpText: 'The name of the root message type to decode. If empty, uses the last message defined in the .proto file.',
    },
    {
      id: 'indent',
      label: 'JSON Indentation',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
        { label: 'Minified', value: '0' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const protoFile = inputs.proto as File;
    const binaryFile = inputs.binary as File;
    const messageName = options.messageName as string;
    const indentOpt = options.indent as string;

    if (!protoFile || !binaryFile) {
      return { type: 'text', data: 'Error: Both .proto schema and binary file are required.' };
    }

    const protobuf = await import('protobufjs');

    // Read .proto file text
    const protoText = await protoFile.text();

    // Parse proto schema
    let root: InstanceType<typeof protobuf.Root>;
    try {
      root = protobuf.parse(protoText).root;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Proto parse error: ${msg}` };
    }

    // Find the message type
    let msgType: protobuf.Type;
    try {
      if (messageName) {
        msgType = root.lookupType(messageName);
      } else {
        // Auto-detect: find the last message type
        const types: protobuf.Type[] = [];
        root.nestedArray.forEach(nested => {
          if (nested instanceof protobuf.Type) types.push(nested);
        });
        if (types.length === 0) {
          return { type: 'text', data: 'Error: No message types found in .proto file.' };
        }
        msgType = types[types.length - 1];
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Message lookup error: ${msg}` };
    }

    // Read binary data
    const buffer = await binaryFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Decode
    let decoded: object;
    try {
      const message = msgType.decode(bytes);
      decoded = msgType.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true,
        arrays: true,
        objects: true,
        oneofs: true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `Decode error: ${msg}` };
    }

    const indent = parseInt(indentOpt, 10);
    const space = indent === 0 ? undefined : indent;
    return {
      type: 'text',
      data: JSON.stringify(decoded, null, space),
      summary: `Decoded using message type: ${msgType.name}`,
    };
  },
};

registry.register(tool);
export default tool;

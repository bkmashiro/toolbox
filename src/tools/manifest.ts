// Tool manifest — import each tool module to trigger side-effect registration.
// Agent 0 (scaffold): all sections are stubs. Tool agents fill these in.

// === Video/GIF/Audio tools (Agent 1) ===
import './video/video-convert'
import './video/video-to-gif'
import './video/video-extract-frames'
import './video/video-trim'
import './video/video-compress'
import './video/video-screenshot'
import './video/video-speed'
import './video/video-reverse'
import './video/video-add-subtitle'
import './video/video-extract-audio'
import './gif/gif-make'
import './gif/gif-extract-frames'
import './gif/gif-optimize'
import './gif/gif-reverse'
import './gif/gif-speed'
import './gif/gif-crop'
import './audio/audio-convert'
import './audio/audio-trim'
import './audio/audio-merge'
import './audio/audio-normalize'
import './audio/audio-speed'
import './audio/audio-id3'

// === Image/PDF tools (Agent 2) ===
import './image/image-convert';
import './image/image-compress';
import './image/image-resize';
import './image/image-rotate-flip';
import './image/image-crop';
import './image/image-exif';
import './image/image-to-base64';
import './image/base64-to-image';
import './image/favicon-gen';
import './image/svg-optimize';
import './image/qr-generate';
import './image/qr-decode';
import './image/barcode-generate';
import './image/color-pick';
import './image/palette-extract';
import './image/placeholder-gen';
import './image/image-diff';
import './image/sprite-sheet';
import './pdf/pdf-merge';
import './pdf/pdf-split';
import './pdf/pdf-extract-pages';
import './pdf/pdf-compress';
import './pdf/pdf-to-images';
import './pdf/images-to-pdf';
import './pdf/pdf-rotate';
import './pdf/pdf-extract-text';
import './pdf/pdf-metadata';
import './pdf/pdf-watermark';
import './pdf/pdf-page-numbers';
import './pdf/pdf-protect';

// === Data/Text tools (Agent 3) ===
import './data/json-format';
import './data/json-to-yaml';
import './data/yaml-to-json';
import './data/json-to-toml';
import './data/toml-to-json';
import './data/yaml-to-toml';
import './data/csv-to-json';
import './data/json-to-csv';
import './data/xml-to-json';
import './data/json-to-xml';
import './data/xml-format';
import './data/csv-viewer';
import './data/sql-format';
import './data/protobuf-to-json';
import './data/json-schema';
import './data/json-to-ts';
import './data/markdown-to-html';
import './data/html-to-markdown';
// import './data/json-query';   // stub from scaffold, not yet implemented by Agent 3
import './text/case-convert';
import './text/diff-text';
import './text/text-diff-words';
import './text/regex-test';
import './text/text-count';
import './text/text-stats';
import './text/line-tools';
import './text/lorem-ipsum';
import './text/text-escape';
import './text/morse-code';
import './text/binary-text';
import './text/find-replace';
// import './text/base64';        // stub from scaffold
// import './text/url-encode';    // stub from scaffold
// import './text/html-encode';   // stub from scaffold
// import './text/unicode-inspect'; // stub from scaffold

// === Crypto/Network/Developer tools (Agent 4) ===
import './crypto/hash-gen';
import './crypto/hmac-gen';
import './crypto/bcrypt';
import './crypto/aes-encrypt';
import './crypto/rsa-gen';
import './crypto/rsa-encrypt';
import './crypto/jwt-decode';
import './crypto/jwt-sign';
import './crypto/password-gen';
import './crypto/password-strength';
import './crypto/uuid-gen';
import './crypto/otp-gen';
import './crypto/pgp-encrypt';
import './crypto/cert-decode';
import './network/ip-info';
import './network/ip-calc';
import './network/dns-lookup';
import './network/whois-lookup';
import './network/url-parse';
import './network/url-encode';
import './network/headers-check';
import './network/user-agent-parse';
import './network/curl-gen';
import './network/http-status';
import './network/mime-lookup';
import './network/ping';
import './developer/base64-encode';
import './developer/hex-encode';
import './developer/binary-encode';
import './developer/number-base';
import './developer/color-convert';
import './developer/timestamp';
import './developer/cron-parse';
import './developer/css-unit-convert';
import './developer/css-gradient';
import './developer/box-shadow';
import './developer/border-radius';
import './developer/markdown-preview';
import './developer/html-preview';
import './developer/json-path';
import './developer/xpath-test';
import './developer/ts-compile';
import './developer/code-format';

// === Math/Misc tools (Agent 5) ===
// import './math/calculator';
// import './math/matrix';
// import './math/stats';
// import './math/unit-convert';
// import './math/roman-numeral';
// import './math/prime';
// import './misc/zip-create';
// import './misc/zip-extract';
// import './misc/file-hash';
// import './misc/font-preview';
// import './misc/color-picker';
// import './misc/stopwatch';

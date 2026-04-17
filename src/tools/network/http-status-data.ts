export interface HttpStatusEntry {
  code: number;
  name: string;
  description: string;
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
}

export const HTTP_STATUS_DATA: HttpStatusEntry[] = [
  // 1xx Informational
  { code: 100, name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body.', category: '1xx' },
  { code: 101, name: 'Switching Protocols', description: 'The requester has asked the server to switch protocols and the server has agreed to do so.', category: '1xx' },
  { code: 102, name: 'Processing', description: 'The server has received and is processing the request, but no response is available yet.', category: '1xx' },
  { code: 103, name: 'Early Hints', description: 'Used to return some response headers before final HTTP message.', category: '1xx' },

  // 2xx Success
  { code: 200, name: 'OK', description: 'The request has succeeded. The meaning of the success depends on the HTTP method.', category: '2xx' },
  { code: 201, name: 'Created', description: 'The request has been fulfilled, resulting in the creation of a new resource.', category: '2xx' },
  { code: 202, name: 'Accepted', description: 'The request has been accepted for processing, but the processing has not been completed.', category: '2xx' },
  { code: 203, name: 'Non-Authoritative Information', description: 'The request was successful but the enclosed payload has been modified from that of the origin server\'s 200 OK response by a transforming proxy.', category: '2xx' },
  { code: 204, name: 'No Content', description: 'The server has successfully fulfilled the request and there is no additional content to send in the response payload body.', category: '2xx' },
  { code: 205, name: 'Reset Content', description: 'The server has fulfilled the request and desires that the user agent reset the "document view" which caused the request to be sent.', category: '2xx' },
  { code: 206, name: 'Partial Content', description: 'The server is delivering only part of the resource (byte serving) due to a range header sent by the client.', category: '2xx' },
  { code: 207, name: 'Multi-Status', description: 'A Multi-Status response conveys information about multiple resources in situations where multiple status codes might be appropriate.', category: '2xx' },
  { code: 208, name: 'Already Reported', description: 'Used inside a <dav:propstat> response element to avoid enumerating the internal members of multiple bindings to the same collection repeatedly.', category: '2xx' },
  { code: 226, name: 'IM Used', description: 'The server has fulfilled a request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.', category: '2xx' },

  // 3xx Redirection
  { code: 300, name: 'Multiple Choices', description: 'Indicates multiple options for the resource from which the client may choose.', category: '3xx' },
  { code: 301, name: 'Moved Permanently', description: 'This and all future requests should be directed to the given URI.', category: '3xx' },
  { code: 302, name: 'Found', description: 'Tells the client to look at (browse to) another URL. 302 has been superseded by 303 and 307.', category: '3xx' },
  { code: 303, name: 'See Other', description: 'The response to the request can be found under another URI using the GET method.', category: '3xx' },
  { code: 304, name: 'Not Modified', description: 'Indicates that the resource has not been modified since the version specified by the request headers.', category: '3xx' },
  { code: 305, name: 'Use Proxy', description: 'The requested resource is available only through a proxy, the address for which is provided in the response.', category: '3xx' },
  { code: 307, name: 'Temporary Redirect', description: 'The request should be repeated with another URI; however, future requests should still use the original URI.', category: '3xx' },
  { code: 308, name: 'Permanent Redirect', description: 'The request and all future requests should be repeated using another URI.', category: '3xx' },

  // 4xx Client Errors
  { code: 400, name: 'Bad Request', description: 'The server cannot or will not process the request due to an apparent client error.', category: '4xx' },
  { code: 401, name: 'Unauthorized', description: 'Authentication is required and has failed or has not yet been provided.', category: '4xx' },
  { code: 402, name: 'Payment Required', description: 'Reserved for future use. The original intention was that this code might be used as part of some form of digital cash or micropayment scheme.', category: '4xx' },
  { code: 403, name: 'Forbidden', description: 'The request was valid, but the server is refusing action. The user might not have the necessary permissions for a resource.', category: '4xx' },
  { code: 404, name: 'Not Found', description: 'The requested resource could not be found but may be available in the future.', category: '4xx' },
  { code: 405, name: 'Method Not Allowed', description: 'A request method is not supported for the requested resource.', category: '4xx' },
  { code: 406, name: 'Not Acceptable', description: 'The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.', category: '4xx' },
  { code: 407, name: 'Proxy Authentication Required', description: 'The client must first authenticate itself with the proxy.', category: '4xx' },
  { code: 408, name: 'Request Timeout', description: 'The server timed out waiting for the request.', category: '4xx' },
  { code: 409, name: 'Conflict', description: 'Indicates that the request could not be processed because of conflict in the current state of the resource.', category: '4xx' },
  { code: 410, name: 'Gone', description: 'Indicates that the resource requested is no longer available and will not be available again.', category: '4xx' },
  { code: 411, name: 'Length Required', description: 'The request did not specify the length of its content, which is required by the requested resource.', category: '4xx' },
  { code: 412, name: 'Precondition Failed', description: 'The server does not meet one of the preconditions that the requester put on the request header fields.', category: '4xx' },
  { code: 413, name: 'Content Too Large', description: 'The request is larger than the server is willing or able to process.', category: '4xx' },
  { code: 414, name: 'URI Too Long', description: 'The URI provided was too long for the server to process.', category: '4xx' },
  { code: 415, name: 'Unsupported Media Type', description: 'The request entity has a media type which the server or resource does not support.', category: '4xx' },
  { code: 416, name: 'Range Not Satisfiable', description: 'The client has asked for a portion of the file, but the server cannot supply that portion.', category: '4xx' },
  { code: 417, name: 'Expectation Failed', description: 'The server cannot meet the requirements of the Expect request-header field.', category: '4xx' },
  { code: 418, name: "I'm a teapot", description: "Any attempt to brew coffee with a teapot should result in the error code 418 I'm a teapot. The resulting entity body MAY be short and stout.", category: '4xx' },
  { code: 421, name: 'Misdirected Request', description: 'The request was directed at a server that is not able to produce a response.', category: '4xx' },
  { code: 422, name: 'Unprocessable Content', description: 'The request was well-formed but was unable to be followed due to semantic errors.', category: '4xx' },
  { code: 423, name: 'Locked', description: 'The resource that is being accessed is locked.', category: '4xx' },
  { code: 424, name: 'Failed Dependency', description: 'The request failed because it depended on another request and that request failed.', category: '4xx' },
  { code: 425, name: 'Too Early', description: 'Indicates that the server is unwilling to risk processing a request that might be replayed.', category: '4xx' },
  { code: 426, name: 'Upgrade Required', description: 'The client should switch to a different protocol such as TLS/1.3.', category: '4xx' },
  { code: 428, name: 'Precondition Required', description: 'The origin server requires the request to be conditional.', category: '4xx' },
  { code: 429, name: 'Too Many Requests', description: 'The user has sent too many requests in a given amount of time ("rate limiting").', category: '4xx' },
  { code: 431, name: 'Request Header Fields Too Large', description: 'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large.', category: '4xx' },
  { code: 451, name: 'Unavailable For Legal Reasons', description: 'A server operator has received a legal demand to deny access to a resource or to a set of resources that includes the requested resource.', category: '4xx' },

  // 5xx Server Errors
  { code: 500, name: 'Internal Server Error', description: 'A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.', category: '5xx' },
  { code: 501, name: 'Not Implemented', description: 'The server either does not recognize the request method, or it lacks the ability to fulfill the request.', category: '5xx' },
  { code: 502, name: 'Bad Gateway', description: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.', category: '5xx' },
  { code: 503, name: 'Service Unavailable', description: 'The server cannot handle the request (because it is overloaded or down for maintenance).', category: '5xx' },
  { code: 504, name: 'Gateway Timeout', description: 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.', category: '5xx' },
  { code: 505, name: 'HTTP Version Not Supported', description: 'The server does not support the HTTP protocol version used in the request.', category: '5xx' },
  { code: 506, name: 'Variant Also Negotiates', description: 'Transparent content negotiation for the request results in a circular reference.', category: '5xx' },
  { code: 507, name: 'Insufficient Storage', description: 'The server is unable to store the representation needed to complete the request.', category: '5xx' },
  { code: 508, name: 'Loop Detected', description: 'The server detected an infinite loop while processing the request.', category: '5xx' },
  { code: 510, name: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfill it.', category: '5xx' },
  { code: 511, name: 'Network Authentication Required', description: 'The client needs to authenticate to gain network access.', category: '5xx' },
];

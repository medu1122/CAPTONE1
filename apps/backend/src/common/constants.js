/**
 * Application constants
 */

// File upload constraints
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg', 
  'image/png', 
  'image/jpg', 
  'image/webp'
];

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  BAD_GATEWAY: 502,
};

// Standard error messages
export const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists',
  UNAUTHORIZED: 'Not authorized to perform this action',
  RESOURCE_NOT_FOUND: 'Resource not found',
  INVALID_REQUEST: 'Invalid request data',
  SERVER_ERROR: 'Internal server error',
  FILE_TOO_LARGE: `File size exceeds the ${MAX_IMAGE_SIZE_MB}MB limit`,
  INVALID_FILE_TYPE: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
  REQUIRED_IMAGE_OR_TEXT: 'Either image or text is required',
  TEXT_TOO_LONG: 'Text must be 500 characters or less',
};

// Plant.id API constants
export const PLANT_ID_API = {
  IDENTIFY_ENDPOINT: 'https://api.plant.id/v2/identify',
  HEALTH_ENDPOINT: 'https://api.plant.id/v2/health_assessment',
  MODIFIERS: ['crops_fast', 'similar_images'],
  PLANT_DETAILS: [
    'common_names',
    'url',
    'name_authority',
    'wiki_description',
    'taxonomy',
    'synonyms',
  ],
  DISEASE_DETAILS: [
    'common_names',
    'description',
    'treatment',
  ],
};
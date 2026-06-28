import { describe, expect, test } from 'bun:test';
import {
  assertUploadSizeWithinLimit,
  MAX_FILE_SIZE_BYTES,
  MAX_UPLOAD_BYTES,
} from './uploadLimits';
import { ServiceError } from '../errors';

describe('uploadLimits', () => {
  test('exports consistent byte limits', () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(MAX_FILE_SIZE_BYTES);
  });

  test('allows uploads at the limit', () => {
    expect(() => assertUploadSizeWithinLimit(MAX_UPLOAD_BYTES)).not.toThrow();
  });

  test('rejects uploads over the limit', () => {
    expect(() => assertUploadSizeWithinLimit(MAX_UPLOAD_BYTES + 1)).toThrow(ServiceError);
    expect(() => assertUploadSizeWithinLimit(MAX_UPLOAD_BYTES + 1)).toThrow('50MB');
  });
});

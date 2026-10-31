import { createClientSchema } from '@allfina/shared';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../src/common/zod-validation.pipe';
import { redisConnection } from '../src/queue/queue.module';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(createClientSchema);

  it('returns parsed data for valid input', () => {
    expect(pipe.transform({ firstName: ' Ada ', lastName: 'Lovelace', email: '' })).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: undefined,
    });
  });

  it('throws BadRequestException with field errors for invalid input', () => {
    expect(() => pipe.transform({ firstName: '' })).toThrow(BadRequestException);
  });
});

describe('redisConnection', () => {
  it('parses host, port, password and db', () => {
    expect(redisConnection('redis://:s%40cret@cache.local:6380/2')).toMatchObject({
      host: 'cache.local',
      port: 6380,
      password: 's@cret',
      db: 2,
      tls: undefined,
    });
  });

  it('enables TLS for rediss://', () => {
    expect(redisConnection('rediss://cache.local').tls).toEqual({});
  });
});

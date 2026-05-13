import { Elysia, t } from 'elysia';
import { createEncryptionKeyService } from '../di/container';
import { authMacro } from './auth.plugin';

export const encryptionKeyRoutes = new Elysia({ prefix: '/user/encryption-key' })
  .use(authMacro)
  .post('/', async ({ user, body }) => {
    const service = createEncryptionKeyService();
    return service.createKey({
      userId: user!.id,
      encryptedDek: body.encryptedDek,
      dekIv: body.dekIv,
      dekSalt: body.dekSalt,
      kdfAlgorithm: body.kdfAlgorithm,
      kdfParams: body.kdfParams,
    });
  }, {
    body: t.Object({
      encryptedDek: t.String(),
      dekIv: t.String(),
      dekSalt: t.String(),
      kdfAlgorithm: t.String(),
      kdfParams: t.String(),
    }),
    auth: true,
  })
  .get('/', async ({ user }) => {
    const service = createEncryptionKeyService();
    return service.getKey(user!.id);
  }, {
    auth: true,
  })
  .put('/', async ({ user, body }) => {
    const service = createEncryptionKeyService();
    return service.updateKey(user!.id, {
      encryptedDek: body.encryptedDek,
      dekIv: body.dekIv,
      dekSalt: body.dekSalt,
      kdfAlgorithm: body.kdfAlgorithm,
      kdfParams: body.kdfParams,
    });
  }, {
    body: t.Object({
      encryptedDek: t.String(),
      dekIv: t.String(),
      dekSalt: t.String(),
      kdfAlgorithm: t.String(),
      kdfParams: t.String(),
    }),
    auth: true,
  });

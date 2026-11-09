//
//  AuthState.ts
//  Single source of truth for the persisted storageState path used by
//  tests/auth.setup.ts (which writes it) and any spec that opts in with
//  `test.use({ storageState: AUTH_STATE_FILE })`.
//

import * as path from 'path';

export const AUTH_STATE_FILE = path.resolve('.auth/user.json');

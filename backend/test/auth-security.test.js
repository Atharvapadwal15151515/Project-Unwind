import assert from "node:assert/strict";
import test from "node:test";

import jwt from "jsonwebtoken";


/*
|--------------------------------------------------------------------------
| Safe test-only secrets
|--------------------------------------------------------------------------
|
| These values exist only while tests run.
| They are not production credentials.
|
*/

process.env.JWT_ACCESS_SECRET =
  "test-access-secret-that-is-never-used-outside-tests";

process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-that-is-never-used-outside-tests";

process.env.JWT_ACCESS_EXPIRES_IN =
  "15m";

process.env.JWT_REFRESH_EXPIRES_IN =
  "30d";


/*
|--------------------------------------------------------------------------
| Imports
|--------------------------------------------------------------------------
*/

const {
  generateAccessToken,
  generateRefreshToken
} = await import(
  "../src/utils/generateTokens.js"
);

const {
  hashPassword,
  comparePasswords
} = await import(
  "../src/utils/hashPassword.js"
);

const {
  authorize
} = await import(
  "../src/middleware/authorize.js"
);

const {
  requireAdmin
} = await import(
  "../src/middleware/admin/requireAdmin.js"
);


/*
|--------------------------------------------------------------------------
| Response mock
|--------------------------------------------------------------------------
*/

function createResponseDouble() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;

      return this;
    },

    json(body) {
      this.body = body;

      return this;
    }
  };
}


/*
|--------------------------------------------------------------------------
| Access-token tests
|--------------------------------------------------------------------------
*/

test(
  "access tokens contain the authenticated user ID and role",
  () => {
    const token =
      generateAccessToken({
        user_id:
          "user-security-test",

        role:
          "user"
      });

    const payload =
      jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
      );

    assert.equal(
      payload.sub,
      "user-security-test"
    );

    assert.equal(
      payload.role,
      "user"
    );

    assert.ok(
      payload.exp >
        payload.iat
    );
  }
);


test(
  "access tokens cannot be verified using a different secret",
  () => {
    const token =
      generateAccessToken({
        user_id:
          "user-security-test",

        role:
          "user"
      });

    assert.throws(
      () =>
        jwt.verify(
          token,
          "different-secret"
        ),

      {
        name:
          "JsonWebTokenError"
      }
    );
  }
);


/*
|--------------------------------------------------------------------------
| Refresh-token tests
|--------------------------------------------------------------------------
*/

test(
  "refresh tokens are unique and use the refresh secret",
  () => {
    const user = {
      user_id:
        "user-security-test",

      role:
        "user"
    };

    const firstToken =
      generateRefreshToken(
        user
      );

    const secondToken =
      generateRefreshToken(
        user
      );

    assert.notEqual(
      firstToken,
      secondToken
    );

    const payload =
      jwt.verify(
        firstToken,
        process.env.JWT_REFRESH_SECRET
      );

    assert.ok(
      payload.jti
    );

    assert.throws(
      () =>
        jwt.verify(
          firstToken,
          process.env.JWT_ACCESS_SECRET
        ),

      {
        name:
          "JsonWebTokenError"
      }
    );
  }
);


/*
|--------------------------------------------------------------------------
| Password-hashing tests
|--------------------------------------------------------------------------
*/

test(
  "passwords are stored as bcrypt hashes and compare safely",
  async () => {
    const password =
      "Test-password-42!";

    const passwordHash =
      await hashPassword(
        password
      );

    assert.notEqual(
      passwordHash,
      password
    );

    assert.match(
      passwordHash,
      /^\$2[aby]\$/
    );

    assert.equal(
      await comparePasswords(
        password,
        passwordHash
      ),
      true
    );

    assert.equal(
      await comparePasswords(
        "incorrect",
        passwordHash
      ),
      false
    );
  }
);


/*
|--------------------------------------------------------------------------
| Role-authorization tests
|--------------------------------------------------------------------------
*/

test(
  "role authorization rejects anonymous and unauthorized users",
  () => {
    const adminOnly =
      authorize(
        "admin"
      );

    const anonymousResponse =
      createResponseDouble();

    const userResponse =
      createResponseDouble();

    adminOnly(
      {},
      anonymousResponse,
      () => {
        assert.fail(
          "Anonymous request reached a protected handler"
        );
      }
    );

    adminOnly(
      {
        user: {
          role:
            "user"
        }
      },

      userResponse,

      () => {
        assert.fail(
          "Non-admin user reached an admin handler"
        );
      }
    );

    assert.equal(
      anonymousResponse.statusCode,
      401
    );

    assert.equal(
      userResponse.statusCode,
      403
    );
  }
);


test(
  "admin middleware allows an authenticated administrator",
  () => {
    let nextCalled =
      false;

    const response =
      createResponseDouble();

    requireAdmin(
      {
        user: {
          user_id:
            "admin-security-test",

          role:
            "admin"
        }
      },

      response,

      () => {
        nextCalled =
          true;
      }
    );

    assert.equal(
      nextCalled,
      true
    );

    assert.equal(
      response.statusCode,
      200
    );
  }
);
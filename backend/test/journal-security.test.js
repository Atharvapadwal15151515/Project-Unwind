import assert from "node:assert/strict";
import test from "node:test";

import {
  compareJournalPin,
  createJournalLockoutTime,
  getJournalLockoutRemainingSeconds,
  hashJournalPin,
  isJournalPinLocked,
  isValidJournalPin
} from "../src/utils/journal/journalPin.util.js";

import {
  generateJournalUnlockToken,
  hashJournalUnlockToken,
  isJournalUnlockExpired
} from "../src/utils/journal/journalUnlockToken.util.js";

import {
  getJournalEntryByIdAndUserId,
  permanentlyDeleteJournalEntry,
  updateJournalEntry
} from "../src/models/journal/journalEntry.model.js";


/*
|--------------------------------------------------------------------------
| Journal PIN tests
|--------------------------------------------------------------------------
*/

test(
  "journal PIN validation preserves leading zeroes",
  () => {
    assert.equal(
      isValidJournalPin("0048"),
      true
    );

    assert.equal(
      isValidJournalPin("123456"),
      true
    );

    assert.equal(
      isValidJournalPin("123"),
      false
    );

    assert.equal(
      isValidJournalPin(1234),
      false
    );

    assert.equal(
      isValidJournalPin("12a4"),
      false
    );
  }
);


test(
  "journal PINs are hashed and never compared as plaintext",
  async () => {
    const pinHash =
      await hashJournalPin(
        "0048"
      );

    assert.notEqual(
      pinHash,
      "0048"
    );

    assert.match(
      pinHash,
      /^\$2[aby]\$/
    );

    assert.equal(
      await compareJournalPin(
        "0048",
        pinHash
      ),
      true
    );

    assert.equal(
      await compareJournalPin(
        "9999",
        pinHash
      ),
      false
    );

    assert.equal(
      await compareJournalPin(
        "0048",
        null
      ),
      false
    );
  }
);


/*
|--------------------------------------------------------------------------
| Journal lockout and unlock tests
|--------------------------------------------------------------------------
*/

test(
  "journal lockouts and unlock-token expiry are enforced",
  () => {
    const lockedUntil =
      createJournalLockoutTime();

    assert.equal(
      isJournalPinLocked(
        lockedUntil
      ),
      true
    );

    assert.ok(
      getJournalLockoutRemainingSeconds(
        lockedUntil
      ) > 0
    );

    assert.equal(
      isJournalUnlockExpired(
        new Date(
          Date.now() - 1000
        )
      ),
      true
    );

    assert.equal(
      isJournalUnlockExpired(
        new Date(
          Date.now() + 60000
        )
      ),
      false
    );

    assert.equal(
      isJournalUnlockExpired(
        "invalid-date"
      ),
      true
    );
  }
);


test(
  "journal unlock tokens expose only a one-way hash for storage",
  () => {
    const {
      rawToken,
      tokenHash
    } =
      generateJournalUnlockToken();

    assert.equal(
      rawToken.length,
      96
    );

    assert.equal(
      tokenHash.length,
      64
    );

    assert.notEqual(
      rawToken,
      tokenHash
    );

    assert.equal(
      hashJournalUnlockToken(
        rawToken
      ),
      tokenHash
    );
  }
);


/*
|--------------------------------------------------------------------------
| Fake database
|--------------------------------------------------------------------------
|
| This records SQL queries without connecting to Neon.
|
*/

function createDatabaseDouble(
  rows = []
) {
  const calls = [];

  return {
    calls,

    async query(
      query,
      values
    ) {
      calls.push({
        query,
        values
      });

      return {
        rows
      };
    }
  };
}


/*
|--------------------------------------------------------------------------
| Journal ownership tests
|--------------------------------------------------------------------------
*/

test(
  "journal reads bind both entry ID and authenticated user ID",
  async () => {
    const database =
      createDatabaseDouble([]);

    const result =
      await getJournalEntryByIdAndUserId(
        "entry-a",
        "user-a",
        {},
        database
      );

    assert.equal(
      result,
      null
    );

    assert.match(
      database.calls[0].query,
      /je\.entry_id = \$1/
    );

    assert.match(
      database.calls[0].query,
      /je\.user_id = \$2/
    );

    assert.match(
      database.calls[0].query,
      /je\.is_deleted = FALSE/
    );

    assert.deepEqual(
      database.calls[0].values,
      [
        "entry-a",
        "user-a"
      ]
    );
  }
);


test(
  "journal updates cannot target another user by entry ID alone",
  async () => {
    const database =
      createDatabaseDouble([]);

    await updateJournalEntry(
      "entry-a",
      "user-a",
      {
        title:
          "Private title"
      },
      database
    );

    assert.match(
      database.calls[0].query,
      /WHERE entry_id = \$1/
    );

    assert.match(
      database.calls[0].query,
      /AND user_id = \$2/
    );

    assert.deepEqual(
      database.calls[0]
        .values
        .slice(0, 2),
      [
        "entry-a",
        "user-a"
      ]
    );
  }
);


test(
  "permanent journal deletion requires the authenticated user ID",
  async () => {
    const database =
      createDatabaseDouble([]);

    const result =
      await permanentlyDeleteJournalEntry(
        "entry-a",
        "user-a",
        database
      );

    assert.equal(
      result,
      null
    );

    assert.match(
      database.calls[0].query,
      /WHERE entry_id = \$1/
    );

    assert.match(
      database.calls[0].query,
      /AND user_id = \$2/
    );

    assert.deepEqual(
      database.calls[0].values,
      [
        "entry-a",
        "user-a"
      ]
    );
  }
);
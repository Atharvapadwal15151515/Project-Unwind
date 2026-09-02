import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidJournalPin
} from "../src/utils/journalSecurityValidation.js";

import {
  getCommunityChatMessageId,
  getCommunityChatMessageText,
  isCommunityChatMessageDeleted
} from "../src/utils/communityChatUtils.js";


/*
|--------------------------------------------------------------------------
| Journal PIN validation
|--------------------------------------------------------------------------
*/

test(
  "client journal PIN validation matches backend rules",
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
      isValidJournalPin("12a4"),
      false
    );
  }
);


/*
|--------------------------------------------------------------------------
| Community message normalization
|--------------------------------------------------------------------------
*/

test(
  "community messages normalize server response fields",
  () => {
    const message = {
      chat_message_id:
        "message-1",

      message_text:
        "Hello from Unwind",

      is_deleted:
        true
    };

    assert.equal(
      getCommunityChatMessageId(
        message
      ),
      "message-1"
    );

    assert.equal(
      getCommunityChatMessageText(
        message
      ),
      "Hello from Unwind"
    );

    assert.equal(
      isCommunityChatMessageDeleted(
        message
      ),
      true
    );
  }
);
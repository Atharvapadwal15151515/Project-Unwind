import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateChatbotSafety
} from "../src/services/chatbot/chatbotSafety.service.js";

import {
  calculateDassScores
} from "../src/services/dass/dassScoring.service.js";

import {
  getDassSeverity
} from "../src/utils/dass/dassSeverity.js";


/*
|--------------------------------------------------------------------------
| AI safety tests
|--------------------------------------------------------------------------
*/

test(
  "AI safety detects high-risk crisis language",
  () => {
    const result =
      evaluateChatbotSafety(
        "I want to end my life"
      );

    assert.deepEqual(
      result,
      {
        safe: false,
        level: "high",
        matchedKeyword:
          "end my life"
      }
    );
  }
);


test(
  "AI safety distinguishes distress from immediate high risk",
  () => {
    const mediumRisk =
      evaluateChatbotSafety(
        "I feel hopeless and alone"
      );

    const safeMessage =
      evaluateChatbotSafety(
        "I completed my walk today"
      );

    assert.equal(
      mediumRisk.safe,
      true
    );

    assert.equal(
      mediumRisk.level,
      "medium"
    );

    assert.equal(
      safeMessage.safe,
      true
    );

    assert.equal(
      safeMessage.level,
      "safe"
    );
  }
);


/*
|--------------------------------------------------------------------------
| DASS-21 scoring tests
|--------------------------------------------------------------------------
*/

test(
  "DASS-21 scores are doubled and classified correctly",
  () => {
    const result =
      calculateDassScores([
        {
          category:
            "depression",
          answer_value: 3
        },
        {
          category:
            "depression",
          answer_value: 2
        },
        {
          category:
            "anxiety",
          answer_value: 3
        },
        {
          category:
            "anxiety",
          answer_value: 2
        },
        {
          category:
            "stress",
          answer_value: 3
        },
        {
          category:
            "stress",
          answer_value: 3
        },
        {
          category:
            "stress",
          answer_value: 3
        },
        {
          category:
            "stress",
          answer_value: 2
        }
      ]);

    assert.deepEqual(
      result.rawScores,
      {
        depression: 5,
        anxiety: 5,
        stress: 11
      }
    );

    assert.deepEqual(
      result.scores,
      {
        depression: 10,
        anxiety: 10,
        stress: 22
      }
    );

    assert.deepEqual(
      result.severities,
      {
        depression: "mild",
        anxiety: "moderate",
        stress: "moderate"
      }
    );
  }
);


test(
  "DASS scoring rejects unknown categories",
  () => {
    assert.throws(
      () =>
        calculateDassScores([
          {
            category:
              "unknown",

            answer_value:
              2
          }
        ]),

      /Invalid DASS category/
    );
  }
);


test(
  "DASS severity boundaries match the configured scale",
  () => {
    assert.equal(
      getDassSeverity(
        "depression",
        9
      ),
      "normal"
    );

    assert.equal(
      getDassSeverity(
        "depression",
        10
      ),
      "mild"
    );

    assert.equal(
      getDassSeverity(
        "anxiety",
        20
      ),
      "extremely_severe"
    );

    assert.equal(
      getDassSeverity(
        "stress",
        34
      ),
      "extremely_severe"
    );
  }
);
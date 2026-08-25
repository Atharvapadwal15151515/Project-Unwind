import fs from "fs";
import path from "path";
import {
  fileURLToPath
} from "url";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );

/*
|--------------------------------------------------------------------------
| Paths
|--------------------------------------------------------------------------
|
| Assumed project structure:
|
| unwind-main/
| ├── backend/
| └── client/
|
*/

const projectRoot =
  path.resolve(
    __dirname,
    "..",
    ".."
  );

const backendDataPath =
  path.join(
    projectRoot,
    "backend",
    "src",
    "data",
    "chatbot"
  );

const outputPath =
  path.join(
    projectRoot,
    "client",
    "src",
    "data",
    "chatbotSuggestions.generated.json"
  );

const sourceFiles = [
  {
    filename:
      "intents.json",
    source:
      "intents"
  },

  {
    filename:
      "KB.json",
    source:
      "kb"
  }
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizePhrase(
  phrase
) {
  return String(
    phrase || ""
  )
    .replace(/\s+/g, " ")
    .trim();
}

function createSearchText(
  phrase
) {
  return normalizePhrase(
    phrase
  )
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

function readJsonFile(
  filepath
) {
  if (
    !fs.existsSync(
      filepath
    )
  ) {
    console.warn(
      `Skipping missing file: ${filepath}`
    );

    return null;
  }

  const raw =
    fs.readFileSync(
      filepath,
      "utf8"
    );

  return JSON.parse(raw);
}

/*
|--------------------------------------------------------------------------
| Extract patterns
|--------------------------------------------------------------------------
*/

const suggestionMap =
  new Map();

for (
  const sourceFile of
  sourceFiles
) {
  const filepath =
    path.join(
      backendDataPath,
      sourceFile.filename
    );

  const json =
    readJsonFile(
      filepath
    );

  if (!json) {
    continue;
  }

  const intents =
    Array.isArray(
      json?.intents
    )
      ? json.intents
      : [];

  for (
    const intent of
    intents
  ) {
    const tag =
      String(
        intent?.tag ||
        "general"
      ).trim();

    const patterns =
      Array.isArray(
        intent?.patterns
      )
        ? intent.patterns
        : [];

    for (
      const pattern of
      patterns
    ) {
      if (
        typeof pattern !==
        "string"
      ) {
        continue;
      }

      const text =
        normalizePhrase(
          pattern
        );

      if (!text) {
        continue;
      }

      const duplicateKey =
        createSearchText(
          text
        );

      if (
        suggestionMap.has(
          duplicateKey
        )
      ) {
        /*
         * If the same phrase exists
         * in both JSON files, preserve
         * the first one.
         */
        continue;
      }

      suggestionMap.set(
        duplicateKey,
        {
          text,

          tag,

          source:
            sourceFile.source,

          searchText:
            duplicateKey
        }
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| Sort
|--------------------------------------------------------------------------
*/

const suggestions =
  Array.from(
    suggestionMap.values()
  ).sort(
    (
      firstSuggestion,
      secondSuggestion
    ) =>
      firstSuggestion.text.localeCompare(
        secondSuggestion.text,
        "en",
        {
          sensitivity:
            "base"
        }
      )
  );

/*
|--------------------------------------------------------------------------
| Output
|--------------------------------------------------------------------------
*/

fs.mkdirSync(
  path.dirname(
    outputPath
  ),
  {
    recursive: true
  }
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      generatedAt:
        new Date().toISOString(),

      count:
        suggestions.length,

      suggestions
    },
    null,
    2
  ),
  "utf8"
);

console.log("");
console.log(
  "Chatbot suggestions generated successfully."
);

console.log(
  `Total suggestions: ${suggestions.length}`
);

console.log(
  `Output: ${outputPath}`
);

console.log("");
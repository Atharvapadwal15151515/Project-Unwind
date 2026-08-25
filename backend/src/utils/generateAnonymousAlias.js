import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";

export const generateAnonymousAlias = () => {
  const generatedName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "",
    style: "capital",
  });

  const randomNumber = Math.floor(100 + Math.random() * 900);

  return `${generatedName}${randomNumber}`;
};
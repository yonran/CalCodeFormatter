// Class and Id Constants
// Refers to the primary div for the text of a single civil code, ex.
// https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=65589.5
let CODE_CONTENT_ID = 'single_law_section';
// Refers to the primary div for the text of an article (grouping of codes),
// ex.
// https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=COM&division=7.&title=&part=&chapter=2.&article=
let ARTICLE_CONTENT_ID = 'manylawsections';

type StringToNumberMap = { [key: string]: number };

function romanToInt(roman: string): number {
  roman = roman.toUpperCase();
  const ROMAN_TO_INT: StringToNumberMap = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  let sum = 0;
  for (let i = 0; i < roman.length; i++) {
    if (
      i + 1 < roman.length &&
      ROMAN_TO_INT[roman[i]] < ROMAN_TO_INT[roman[i + 1]]
    ) {
      sum += ROMAN_TO_INT[roman[i + 1]] - ROMAN_TO_INT[roman[i]];
      ++i;
    } else {
      sum += ROMAN_TO_INT[roman[i]];
    }
  }
  return sum;
}

function isLowerCaseLetter(text: string): boolean {
  // First rule out that the text is a Number.
  // or if there are more than one character (e.g. compound heading)
  if (!isNaN(text as any) || text.length > 1) return false;
  return text.toLowerCase() == text;
}

function isNumber(text: string): boolean {
  return !isNaN(text as any);
}

function isUpperCaseLetter(text: string): boolean {
  if (!isNaN(text as any) || text.length > 1) return false;
  return text.toUpperCase() == text;
}

function isUpperCaseRomanNumeral(text: string) {
  let matches: string[] | null = text.match(/[MDCLXVI]+/g);
  if (matches && matches.length == 1 && matches[0].length === text.length) {
    return true;
  }
  return false;
}

function isLowerCaseRomanNumeral(text: string) {
  let matches: string[] | null = text.match(/[mdclxvi]+/g);
  // If the match is not the full length of the text, then we've matched on
  // part of a compound heading like (ia).
  if (matches && matches.length == 1 && matches[0].length === text.length) {
    return true;
  }
  return false;
}

function surroundedByParentheses(text: string): boolean {
  if (text.length < 3) return false;
  return text[0] == '(' && text[text.length - 1] == ')';
}

function reformatPage() {
  let content_div: HTMLElement | null = document.getElementById(
    ARTICLE_CONTENT_ID,
  );
  if (!content_div) {
    // Try the single law page content id.
    content_div = document.getElementById(CODE_CONTENT_ID);
    if (!content_div) {
      console.error(
        'CalCodeFormatter has found an eligible webpage, but not recognized any of the content.',
      );
      return;
    }
  }
  // Returns a static collection, will not reflect DOM updates.
  let text_children_nodes: NodeList = content_div.querySelectorAll('p');
  if (!text_children_nodes) {
    console.warn('This law section appears to have no content.');
    return;
  }

  // The order of the civil code nesting structure is
  // (a) (1) (A) (roman i)( roman I) (ia)
  // Parsing this is complicated by the collision between the first-level
  // lowercase letter (i) and the fourth-level (roman i) and the collision
  // between their capitalized versions. To add indentation based on the first
  // three levels would be trivial, but adding correct indentation for the
  // fourth and fifth requires keeping track of state.
  //
  // One heuristic we can use is the prior level of indentation. The last
  // heading must have reached at least (A) to treat the next (i) as a roman
  // numeral.

  // Level 0 corresponds to root, level 1 corresponds to at the top-level
  // indentation (a), and so on.
  // A single text element can descend multiple levels of indentation, for
  // example:
  // (e) (1) which is level 2, followed by
  // (2) (A) (i) which is level 4
  // If we can encounter an (i) or (II) while at level >=3, we can interpret
  // it as a roman numeral as opposed to a letter.

  let level = 0;
  let last_heading = '';
  for (let text_node of Array.from(text_children_nodes)) {
    let text_or_null: string | null = text_node.textContent;
    let text: string;
    if (!text_or_null) {
      continue;
    } else {
      text = text_or_null;
    }
    // There are empty <p> tags inbetween sections.
    if (text.length == 0) {
      continue;
    }
    // Remove non-breaking spaces.
    text = text.replace(/\u00a0/g, ' ');
    let words: string[] = text.split(' ');
    let i = 0;
    // Padding is determined by the first heading level encountered.
    // However level is set according to all headings on a line.
    let found_padding_level = false;
    let padding_level = 0;
    // Skip any leading whitespaces
    // Ex: Harbors & Navigation Code 1.5 Navigable Waters 133c
    // contains a leading space in front of the (c).
    while (words[i] === '') {
      ++i;
    }
    while (surroundedByParentheses(words[i])) {
      let word = words[i];
      // Strip the parantheses.
      word = word.replace(/[()]/g, '');
      // Turn back, traveler, for Here lies the core of the parsing logic.

      // These are ternary expressions which aren't very clear, but are
      // terribly fun to use. Basically what it's saying is if the last
      // heading was a roman numeral, apply Heuristic #1 (see REAMDE.md). If
      // not, apply Heuristic #3. The've been extracted out of the if
      // statements for clarity.

      let is_lowercase_roman_heading = isLowerCaseRomanNumeral(last_heading)
        ? isLowerCaseRomanNumeral(word) &&
          level >= 4 &&
          romanToInt(last_heading) + 1 == romanToInt(word)
        : (isLowerCaseRomanNumeral(word) && level >= 4) ||
          (level == 3 && word == 'i');

      let is_uppercase_roman_heading = isUpperCaseRomanNumeral(last_heading)
        ? isUpperCaseRomanNumeral(word) &&
          level >= 5 &&
          romanToInt(last_heading) + 1 == romanToInt(word)
        : (isUpperCaseRomanNumeral(word) && level >= 5) ||
          (level == 4 && word == 'I');
      if (is_lowercase_roman_heading) {
        // If the last heading was a lower case roman numeral,
        // ensure this one is the next consecutive heading.
        if (isLowerCaseRomanNumeral(last_heading)) {
        }
        level = 4;
        if (!found_padding_level) {
          padding_level = 4;
          found_padding_level = true;
        }
      } else if (is_uppercase_roman_heading) {
        level = 5;
        if (!found_padding_level) {
          padding_level = 5;
          found_padding_level = true;
        }
      } else if (isLowerCaseLetter(word)) {
        level = 1;
        if (!found_padding_level) {
          padding_level = 1;
          found_padding_level = true;
        }
      } else if (isNumber(word)) {
        level = 2;
        if (!found_padding_level) {
          padding_level = 2;
          found_padding_level = true;
        }
      } else if (isUpperCaseLetter(word)) {
        level = 3;
        if (!found_padding_level) {
          padding_level = 3;
          found_padding_level = true;
        }
      } else {
        // Any heading that falls through these conditionals will be kept at the
        // level of the prior heading, which is our intention for rare compound
        // headings like (ia).
        padding_level = level;
      }
      last_heading = word;
      ++i;
    }
    found_padding_level = false;
    // Set padding based on padding level.
    let padding = padding_level * 25;
    let text_element = text_node as HTMLElement;
    // Yes we're applying the padding variable to margin.  That's because
    // wrapped text doesn't respect padding, which makes it a poor choice for
    // indenting.
    text_element.style.margin = `0 0 0 ${padding}px`;
    text_element.style.padding = `0 0 0 5px`;
    text_element.style.display = 'block';
  }
}

// Default to True, if the UI hasn't been brought up yet, which sets initial state for 'active'.
// This could be done in a background script on the onInstall listener, but this is easier.
chrome.storage.local.get({ active: true }, ({ active }) => {
  if (active) {
    reformatPage();
  }
});

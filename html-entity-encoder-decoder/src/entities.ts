/**
 * HTML Entity definitions and reference maps.
 */

export interface EntityItem {
  char: string;
  name: string;
  decimal: string;
  hex: string;
  description: string;
  category: string;
}

// Basic safe entities
export const BASIC_ENTITIES: EntityItem[] = [
  { char: '&', name: '&amp;', decimal: '&#38;', hex: '&#x26;', description: 'Ampersand', category: 'Basic' },
  { char: '<', name: '&lt;', decimal: '&#60;', hex: '&#x3c;', description: 'Less than sign', category: 'Basic' },
  { char: '>', name: '&gt;', decimal: '&#62;', hex: '&#x3e;', description: 'Greater than sign', category: 'Basic' },
  { char: '"', name: '&quot;', decimal: '&#34;', hex: '&#x22;', description: 'Quotation mark', category: 'Basic' },
  { char: "'", name: '&apos;', decimal: '&#39;', hex: '&#x27;', description: 'Apostrophe (single-quote)', category: 'Basic' },
];

// Comprehensive HTML entities categorized
export const COMPREHENSIVE_ENTITIES: EntityItem[] = [
  ...BASIC_ENTITIES,
  // Currency Symbols
  { char: '¢', name: '&cent;', decimal: '&#162;', hex: '&#xa2;', description: 'Cent sign', category: 'Currency' },
  { char: '£', name: '&pound;', decimal: '&#163;', hex: '&#xa3;', description: 'Pound sign', category: 'Currency' },
  { char: '¥', name: '&yen;', decimal: '&#165;', hex: '&#xa5;', description: 'Yen sign', category: 'Currency' },
  { char: '€', name: '&euro;', decimal: '&#8364;', hex: '&#x20ac;', description: 'Euro sign', category: 'Currency' },
  { char: '¤', name: '&curren;', decimal: '&#164;', hex: '&#xa4;', description: 'General currency sign', category: 'Currency' },
  
  // Customary Symbols
  { char: '©', name: '&copy;', decimal: '&#169;', hex: '&#xa9;', description: 'Copyright symbol', category: 'Symbols' },
  { char: '®', name: '&reg;', decimal: '&#174;', hex: '&#xae;', description: 'Registered trademark', category: 'Symbols' },
  { char: '™', name: '&trade;', decimal: '&#8482;', hex: '&#x2122;', description: 'Trademark symbol', category: 'Symbols' },
  { char: '§', name: '&sect;', decimal: '&#167;', hex: '&#xa7;', description: 'Section sign', category: 'Symbols' },
  { char: '¶', name: '&para;', decimal: '&#182;', hex: '&#xb6;', description: 'Pilcrow sign (paragraph)', category: 'Symbols' },
  { char: '†', name: '&dagger;', decimal: '&#8224;', hex: '&#x2020;', description: 'Dagger mark', category: 'Symbols' },
  { char: '‡', name: '&Dagger;', decimal: '&#8225;', hex: '&#x2021;', description: 'Double dagger mark', category: 'Symbols' },
  { char: '•', name: '&bull;', decimal: '&#8226;', hex: '&#x2022;', description: 'Bullet point', category: 'Symbols' },
  { char: '…', name: '&hellip;', decimal: '&#8230;', hex: '&#x2026;', description: 'Horizontal ellipsis', category: 'Symbols' },
  { char: '‰', name: '&permil;', decimal: '&#8240;', hex: '&#x2030;', description: 'Per mille sign', category: 'Symbols' },
  { char: '°', name: '&deg;', decimal: '&#176;', hex: '&#xb0;', description: 'Degree sign', category: 'Symbols' },
  { char: 'µ', name: '&micro;', decimal: '&#181;', hex: '&#xb5;', description: 'Micro sign / Micron', category: 'Symbols' },

  // Typography Quotes
  { char: '«', name: '&laquo;', decimal: '&#171;', hex: '&#xab;', description: 'Left horizontal-pointing quotes', category: 'Typography' },
  { char: '»', name: '&raquo;', decimal: '&#187;', hex: '&#xbb;', description: 'Right horizontal-pointing quotes', category: 'Typography' },
  { char: '“', name: '&ldquo;', decimal: '&#8220;', hex: '&#x201c;', description: 'Left double curly quote', category: 'Typography' },
  { char: '”', name: '&rdquo;', decimal: '&#8221;', hex: '&#x201d;', description: 'Right double curly quote', category: 'Typography' },
  { char: '‘', name: '&lsquo;', decimal: '&#8216;', hex: '&#x2018;', description: 'Left single curly quote', category: 'Typography' },
  { char: '’', name: '&rsquo;', decimal: '&#8217;', hex: '&#x2019;', description: 'Right single curly quote', category: 'Typography' },
  { char: '–', name: '&ndash;', decimal: '&#8211;', hex: '&#x2013;', description: 'En dash', category: 'Typography' },
  { char: '—', name: '&mdash;', decimal: '&#8212;', hex: '&#x2014;', description: 'Em dash', category: 'Typography' },

  // Mathematics
  { char: '×', name: '&times;', decimal: '&#215;', hex: '&#xd7;', description: 'Multiplication sign', category: 'Math' },
  { char: '÷', name: '&divide;', decimal: '&#247;', hex: '&#xf7;', description: 'Division sign', category: 'Math' },
  { char: '±', name: '&plusmn;', decimal: '&#177;', hex: '&#xb1;', description: 'Plus-minus sign', category: 'Math' },
  { char: '≠', name: '&ne;', decimal: '&#8800;', hex: '&#x2260;', description: 'Not equal to', category: 'Math' },
  { char: '≈', name: '&asymp;', decimal: '&#8776;', hex: '&#x2248;', description: 'Almost equal to (asymptotic)', category: 'Math' },
  { char: '≤', name: '&le;', decimal: '&#8804;', hex: '&#x2264;', description: 'Less than or equal to', category: 'Math' },
  { char: '≥', name: '&ge;', decimal: '&#8805;', hex: '&#x2265;', description: 'Greater than or equal to', category: 'Math' },
  { char: '∞', name: '&infin;', decimal: '&#8734;', hex: '&#x221e;', description: 'Infinity symbol', category: 'Math' },
  { char: '∑', name: '&sum;', decimal: '&#8721;', hex: '&#x2211;', description: 'Summation / Sigma', category: 'Math' },
  { char: '∏', name: '&prod;', decimal: '&#8719;', hex: '&#x220f;', description: 'Product sign / Pi', category: 'Math' },
  { char: '√', name: '&radic;', decimal: '&#8730;', hex: '&#x221a;', description: 'Square root', category: 'Math' },
  { char: '∂', name: '&part;', decimal: '&#8706;', hex: '&#x2202;', description: 'Partial differential', category: 'Math' },
  { char: '∫', name: '&int;', decimal: '&#8747;', hex: '&#x222b;', description: 'Integral symbol', category: 'Math' },
  { char: '¬', name: '&not;', decimal: '&#172;', hex: '&#xac;', description: 'Not sign', category: 'Math' },
  { char: '¼', name: '&frac14;', decimal: '&#188;', hex: '&#xbc;', description: 'One quarter fraction', category: 'Math' },
  { char: '½', name: '&frac12;', decimal: '&#189;', hex: '&#xbd;', description: 'One half fraction', category: 'Math' },
  { char: '¾', name: '&frac34;', decimal: '&#190;', hex: '&#xbe;', description: 'Three quarters fraction', category: 'Math' },

  // Arrows
  { char: '←', name: '&larr;', decimal: '&#8592;', hex: '&#x2190;', description: 'Left arrow', category: 'Arrows' },
  { char: '↑', name: '&uarr;', decimal: '&#8594;', hex: '&#x2192;', description: 'Up arrow', category: 'Arrows' },
  { char: '→', name: '&rarr;', decimal: '&#8594;', hex: '&#x2192;', description: 'Right arrow', category: 'Arrows' },
  { char: '↓', name: '&darr;', decimal: '&#8595;', hex: '&#x2195;', description: 'Down arrow', category: 'Arrows' },
  { char: '↔', name: '&harr;', decimal: '&#8596;', hex: '&#x2196;', description: 'Left right arrow', category: 'Arrows' },
  { char: '⇒', name: '&rArr;', decimal: '&#8658;', hex: '&#x21d2;', description: 'Double right arrow', category: 'Arrows' },
  { char: '⇐', name: '&lArr;', decimal: '&#8656;', hex: '&#x21d0;', description: 'Double left arrow', category: 'Arrows' },

  // Greek/Special Letters
  { char: 'α', name: '&alpha;', decimal: '&#945;', hex: '&#x3b1;', description: 'Greek small letter alpha', category: 'Greek' },
  { char: 'β', name: '&beta;', decimal: '&#946;', hex: '&#x3b2;', description: 'Greek small letter beta', category: 'Greek' },
  { char: 'γ', name: '&gamma;', decimal: '&#947;', hex: '&#x3b3;', description: 'Greek small letter gamma', category: 'Greek' },
  { char: 'δ', name: '&delta;', decimal: '&#948;', hex: '&#x3b4;', description: 'Greek small letter delta', category: 'Greek' },
  { char: 'λ', name: '&lambda;', decimal: '&#955;', hex: '&#x3bb;', description: 'Greek small letter lambda', category: 'Greek' },
  { char: 'ω', name: '&omega;', decimal: '&#969;', hex: '&#x3c9;', description: 'Greek small letter omega', category: 'Greek' },
  { char: 'Ω', name: '&Omega;', decimal: '&#937;', hex: '&#x3a9;', description: 'Greek capital letter omega', category: 'Greek' },
  { char: 'π', name: '&pi;', decimal: '&#960;', hex: '&#x3c0;', description: 'Greek small letter pi', category: 'Greek' },
  { char: 'Σ', name: '&Sigma;', decimal: '&#931;', hex: '&#x3a3;', description: 'Greek capital letter sigma', category: 'Greek' },
];

/**
 * Direct character-to-entity dictionaries for quick encoding lookup.
 */
const BASIC_CHAR_MAP: Record<string, EntityItem> = BASIC_ENTITIES.reduce((acc, item) => {
  acc[item.char] = item;
  return acc;
}, {} as Record<string, EntityItem>);

const COMPREHENSIVE_CHAR_MAP: Record<string, EntityItem> = COMPREHENSIVE_ENTITIES.reduce((acc, item) => {
  acc[item.char] = item;
  return acc;
}, {} as Record<string, EntityItem>);

/**
 * Direct entity-to-character mappings for decoding.
 * Supports named (without/with trailing semicolon), decimal, and hex lookup.
 */
const NAME_TO_CHAR_MAP: Record<string, string> = COMPREHENSIVE_ENTITIES.reduce((acc, item) => {
  // Save both with and without ampersand / semicolon for ease of matching
  const cleanName = item.name.replace(/[&;]/g, '');
  acc[cleanName] = item.char;
  return acc;
}, {} as Record<string, string>);

// Add common aliases that might not be in our standard array but are standard HTML
NAME_TO_CHAR_MAP['nbsp'] = ' ';
NAME_TO_CHAR_MAP['apos'] = "'";

/**
 * Encodes text into HTML entities based on specified options.
 */
export function encodeText(
  text: string,
  options: {
    mapping: 'basic' | 'comprehensive';
    format: 'named' | 'decimal' | 'hex';
    range: 'matched_only' | 'all_non_ascii' | 'all_chars';
  }
): string {
  if (!text) return '';

  const activeMap = options.mapping === 'basic' ? BASIC_CHAR_MAP : COMPREHENSIVE_CHAR_MAP;
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.codePointAt(i) || char.charCodeAt(0);

    // Support surrogate pairs if codePoint is > 0xffff
    if (code > 0xffff) {
      i++; // increment index for surrogate pair
    }

    const matchedEntry = activeMap[char];

    // Determine if this character should be encoded
    let shouldEncode = false;
    if (options.range === 'all_chars') {
      shouldEncode = true;
    } else if (options.range === 'all_non_ascii') {
      // Encode if it's explicitly matched by the map OR if it's a non-ASCII character (code > 127)
      shouldEncode = !!matchedEntry || code > 127;
    } else {
      // 'matched_only'
      shouldEncode = !!matchedEntry;
    }

    if (!shouldEncode) {
      result += char;
      continue;
    }

    // Encoded branch
    if (options.format === 'named' && matchedEntry) {
      result += matchedEntry.name;
    } else if (options.format === 'decimal') {
      result += `&#${code};`;
    } else if (options.format === 'hex') {
      result += `&#x${code.toString(16)};`;
    } else {
      // Format is named, but there's no named entity entry for this character.
      // Fallback to hex/decimal according to preference (we default to hex)
      result += `&#x${code.toString(16)};`;
    }
  }

  return result;
}

/**
 * Decodes all HTML entities (named, decimal, hexadecimal) found in the text.
 */
export function decodeText(text: string): string {
  if (!text) return '';

  // Regex to match named, decimal, or hex entities
  // Examples: &amp;  &#60;  &#x3C;  &Eacute;
  const entityRegex = /&(?:([a-zA-Z0-9]+)|#([0-9]+)|#x([a-fA-F0-9]+));/gi;

  return text.replace(entityRegex, (match, name, dec, hex) => {
    try {
      if (name) {
        const decodedChar = NAME_TO_CHAR_MAP[name];
        return decodedChar !== undefined ? decodedChar : match;
      }
      
      if (dec) {
        const code = parseInt(dec, 10);
        if (!isNaN(code)) {
          return String.fromCodePoint(code);
        }
      }
      
      if (hex) {
        const code = parseInt(hex, 16);
        if (!isNaN(code)) {
          return String.fromCodePoint(code);
        }
      }
    } catch {
      // Fallback on error (e.g. invalid code point)
      return match;
    }
    return match;
  });
}

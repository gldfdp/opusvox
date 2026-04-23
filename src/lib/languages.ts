export interface MistralLanguage {
  code: string
  nameEn: string
  nameFr: string
  nameNative: string
  flag: string
}

export const MISTRAL_SUPPORTED_LANGUAGES: MistralLanguage[] = [
  { code: 'en', nameEn: 'English', nameFr: 'Anglais', nameNative: 'English', flag: '🇬🇧' },
  { code: 'fr', nameEn: 'French', nameFr: 'Français', nameNative: 'Français', flag: '🇫🇷' },
  { code: 'es', nameEn: 'Spanish', nameFr: 'Espagnol', nameNative: 'Español', flag: '🇪🇸' },
  { code: 'de', nameEn: 'German', nameFr: 'Allemand', nameNative: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', nameEn: 'Italian', nameFr: 'Italien', nameNative: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', nameEn: 'Portuguese', nameFr: 'Portugais', nameNative: 'Português', flag: '🇵🇹' },
  { code: 'nl', nameEn: 'Dutch', nameFr: 'Néerlandais', nameNative: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', nameEn: 'Polish', nameFr: 'Polonais', nameNative: 'Polski', flag: '🇵🇱' },
  { code: 'ru', nameEn: 'Russian', nameFr: 'Russe', nameNative: 'Русский', flag: '🇷🇺' },
  { code: 'ja', nameEn: 'Japanese', nameFr: 'Japonais', nameNative: '日本語', flag: '🇯🇵' },
  { code: 'zh', nameEn: 'Chinese', nameFr: 'Chinois', nameNative: '中文', flag: '🇨🇳' },
  { code: 'ko', nameEn: 'Korean', nameFr: 'Coréen', nameNative: '한국어', flag: '🇰🇷' },
  { code: 'ar', nameEn: 'Arabic', nameFr: 'Arabe', nameNative: 'العربية', flag: '🇸🇦' },
  { code: 'hi', nameEn: 'Hindi', nameFr: 'Hindi', nameNative: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', nameEn: 'Turkish', nameFr: 'Turc', nameNative: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', nameEn: 'Swedish', nameFr: 'Suédois', nameNative: 'Svenska', flag: '🇸🇪' },
  { code: 'da', nameEn: 'Danish', nameFr: 'Danois', nameNative: 'Dansk', flag: '🇩🇰' },
  { code: 'no', nameEn: 'Norwegian', nameFr: 'Norvégien', nameNative: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', nameEn: 'Finnish', nameFr: 'Finnois', nameNative: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', nameEn: 'Czech', nameFr: 'Tchèque', nameNative: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', nameEn: 'Slovak', nameFr: 'Slovaque', nameNative: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', nameEn: 'Hungarian', nameFr: 'Hongrois', nameNative: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', nameEn: 'Romanian', nameFr: 'Roumain', nameNative: 'Română', flag: '🇷🇴' },
  { code: 'bg', nameEn: 'Bulgarian', nameFr: 'Bulgare', nameNative: 'Български', flag: '🇧🇬' },
  { code: 'el', nameEn: 'Greek', nameFr: 'Grec', nameNative: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', nameEn: 'Hebrew', nameFr: 'Hébreu', nameNative: 'עברית', flag: '🇮🇱' },
  { code: 'uk', nameEn: 'Ukrainian', nameFr: 'Ukrainien', nameNative: 'Українська', flag: '🇺🇦' },
  { code: 'vi', nameEn: 'Vietnamese', nameFr: 'Vietnamien', nameNative: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', nameEn: 'Thai', nameFr: 'Thaï', nameNative: 'ไทย', flag: '🇹🇭' },
  { code: 'id', nameEn: 'Indonesian', nameFr: 'Indonésien', nameNative: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', nameEn: 'Malay', nameFr: 'Malais', nameNative: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ca', nameEn: 'Catalan', nameFr: 'Catalan', nameNative: 'Català', flag: '🏴' },
  { code: 'hr', nameEn: 'Croatian', nameFr: 'Croate', nameNative: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', nameEn: 'Serbian', nameFr: 'Serbe', nameNative: 'Српски', flag: '🇷🇸' },
  { code: 'lt', nameEn: 'Lithuanian', nameFr: 'Lituanien', nameNative: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', nameEn: 'Latvian', nameFr: 'Letton', nameNative: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', nameEn: 'Estonian', nameFr: 'Estonien', nameNative: 'Eesti', flag: '🇪🇪' },
  { code: 'sl', nameEn: 'Slovenian', nameFr: 'Slovène', nameNative: 'Slovenščina', flag: '🇸🇮' },
]

export function getLanguageName(languageCode: string, displayLanguage: 'en' | 'fr'): string 
{
  const language = MISTRAL_SUPPORTED_LANGUAGES.find(l => l.code === languageCode)
  if (!language) 
  {
    return languageCode
  }
  return displayLanguage === 'fr' ? language.nameFr : language.nameEn
}

export function getLanguageDisplayName(languageCode: string, displayLanguage: 'en' | 'fr'): string 
{
  const language = MISTRAL_SUPPORTED_LANGUAGES.find(l => l.code === languageCode)
  if (!language) 
  {
    return languageCode
  }
  const translatedName = displayLanguage === 'fr' ? language.nameFr : language.nameEn
  return `${language.flag} ${translatedName}`
}

// Reference lists used by the profile editor dropdowns.

export const REGIONS = [
  "NA",
  "NA East",
  "NA West",
  "LATAM",
  "Brazil",
  "EU",
  "EU West",
  "EU East",
  "EU Nordic",
  "UK & Ireland",
  "CIS",
  "MENA",
  "Africa",
  "Asia",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Korea",
  "Japan",
  "China",
  "Oceania",
] as const;

export const STATUSES = [
  { value: "online", label: "Online", color: "#22c55e" },
  { value: "idle", label: "Idle", color: "#f59e0b" },
  { value: "dnd", label: "Do Not Disturb", color: "#ef4444" },
  { value: "offline", label: "Appear Offline", color: "#6b7280" },
] as const;

export function statusMeta(value: string) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0];
}

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Côte d'Ivoire", "Croatia",
  "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
  "Zambia", "Zimbabwe",
] as const;

export const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque",
  "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Burmese", "Catalan", "Cebuano",
  "Chinese (Cantonese)", "Chinese (Mandarin)", "Croatian", "Czech", "Danish", "Dutch",
  "English", "Estonian", "Filipino", "Finnish", "French", "Galician", "Georgian",
  "German", "Greek", "Gujarati", "Hausa", "Hebrew", "Hindi", "Hungarian", "Icelandic",
  "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada",
  "Kazakh", "Khmer", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latvian", "Lithuanian",
  "Luxembourgish", "Macedonian", "Malay", "Malayalam", "Maltese", "Maori", "Marathi",
  "Mongolian", "Nepali", "Norwegian", "Pashto", "Persian", "Polish", "Portuguese",
  "Punjabi", "Romanian", "Russian", "Serbian", "Sinhala", "Slovak", "Slovenian",
  "Somali", "Spanish", "Swahili", "Swedish", "Tagalog", "Tajik", "Tamil", "Telugu",
  "Thai", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh",
  "Xhosa", "Yoruba", "Zulu",
] as const;

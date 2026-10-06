const fs = require('fs');

const content = fs.readFileSync('lib/types.ts', 'utf8');
const match = content.match(/export const CURRENCIES: CurrencyInfo\[\] = \[([\s\S]*?)\];/);
if (!match) throw new Error("not found");

const str = match[1];
const currencies = [];
const regex = /{ code: "(.*?)", symbol: "(.*?)", majorUnit: "(.*?)", minorUnit: "(.*?)" }/g;
let m;
while ((m = regex.exec(str)) !== null) {
  currencies.push({
    code: m[1],
    symbol: m[2],
    majorUnit: m[3],
    minorUnit: m[4]
  });
}

const noPlural = new Set([
  "Taka", "Yen", "Yuan", "Won", "Dong", "Baht", "Rand", "Pula", "Lari", 
  "Kip", "Som", "Manat", "Tenge", "Vatu", "Ariary", "Kina", "Loti",
  "Ringgit", "Rupiah", "Somoni", "Ngultrum", "Rufiyaa", "Lilangeni"
]);

const irregularPlurals = {
  "Penny": "Pence",
  "Centavo": "Centavos",
  "Centime": "Centimes",
  "Cent": "Cents",
  "Lek": "Lekë",
  "Qindarkë": "Qindarka",
  "Dram": "Drams",
  "Luma": "Lumas",
  "Guilder": "Guilders",
  "Kwanza": "Kwanzas",
  "Cêntimo": "Cêntimos",
  "Peso": "Pesos",
  "Dollar": "Dollars",
  "Florin": "Florins",
  "Qəpik": "Qəpiklər",
  "Convertible Mark": "Convertible Marks",
  "Fening": "Fenings",
  "Lev": "Leva",
  "Stotinka": "Stotinki",
  "Dinar": "Dinars",
  "Fils": "Fils",
  "Franc": "Francs",
  "Boliviano": "Bolivianos",
  "Real": "Reais",
  "Chetrum": "Chetrums",
  "Thebe": "Thebe",
  "Ruble": "Rubles",
  "Kapyeyka": "Kapyeykas",
  "Rappen": "Rappen",
  "Colón": "Colones",
  "Escudo": "Escudos",
  "Koruna": "Koruny",
  "Haléř": "Haléře",
  "Øre": "Øre",
  "Piastre": "Piastres",
  "Nakfa": "Nakfa",
  "Birr": "Birr",
  "Santim": "Santims",
  "Euro": "Euros",
  "Pound": "Pounds",
  "Tetri": "Tetri",
  "Cedi": "Cedis",
  "Pesewa": "Pesewas",
  "Dalasi": "Dalasis",
  "Butut": "Bututs",
  "Quetzal": "Quetzales",
  "Gourde": "Gourdes",
  "Forint": "Forints",
  "Fillér": "Fillér",
  "Sen": "Sen",
  "Shekel": "Shekels",
  "Agora": "Agorot",
  "Rupee": "Rupees",
  "Paisa": "Paise",
  "Rial": "Rials",
  "Króna": "Krónur",
  "Eyrir": "Aurar",
  "Shilling": "Shillings",
  "Tyiyn": "Tyiyn",
  "Riel": "Riels",
  "Chon": "Chon",
  "Jeon": "Jeon",
  "Tiyn": "Tiyn",
  "Att": "Att",
  "Lira": "Liras",
  "Kuruş": "Kuruş",
  "Dirham": "Dirhams",
  "Leu": "Lei",
  "Ban": "Bani",
  "Iraimbilanja": "Iraimbilanja",
  "Denar": "Denars",
  "Deni": "Deni",
  "Kyat": "Kyats",
  "Pya": "Pya",
  "Tögrög": "Tögrög",
  "Möngö": "Möngö",
  "Pataca": "Patacas",
  "Avo": "Avos",
  "Ouguiya": "Ouguiya",
  "Khoums": "Khoums",
  "Laari": "Laari",
  "Kwacha": "Kwacha",
  "Tambala": "Tambala",
  "Metical": "Meticais",
  "Naira": "Naira",
  "Kobo": "Kobo",
  "Córdoba": "Córdobas",
  "Krone": "Kroner",
  "Balboa": "Balboas",
  "Centésimo": "Centésimos",
  "Sol": "Soles",
  "Céntimo": "Céntimos",
  "Toea": "Toea",
  "Złoty": "Złotys",
  "Grosz": "Groszy",
  "Guaraní": "Guaraníes",
  "Riyal": "Riyals",
  "Para": "Para",
  "Kopeck": "Kopecks",
  "Halala": "Halalas",
  "Krona": "Kronor",
  "Öre": "Öre",
  "Leone": "Leones",
  "Dobra": "Dobras",
  "Lilangeni": "Emalangeni",
  "Satang": "Satang",
  "Diram": "Dirams",
  "Millime": "Millimes",
  "Paʻanga": "Paʻanga",
  "Seniti": "Seniti",
  "Hryvnia": "Hryvnias",
  "Kopiyka": "Kopiykas",
  "Tiyin": "Tiyin",
  "Bolívar": "Bolívares",
  "Xu": "Xu",
  "Tala": "Tala",
  "Sene": "Sene",
  "Ngwee": "Ngwee"
};

function getPlural(word) {
  if (noPlural.has(word)) return word;
  if (irregularPlurals[word]) return irregularPlurals[word];
  return word + "s";
}

function getCurrencyName(code, major) {
  const map = {
    "USD": "US Dollar",
    "EUR": "Euro",
    "GBP": "British Pound",
    "JPY": "Japanese Yen",
    "CNY": "Chinese Yuan",
    "BDT": "Bangladeshi Taka",
    "AUD": "Australian Dollar",
    "CAD": "Canadian Dollar",
    "INR": "Indian Rupee",
    "KRW": "South Korean Won",
    "VND": "Vietnamese Dong",
    "THB": "Thai Baht",
    "PHP": "Philippine Peso",
  };
  return map[code] || (code + " " + major);
}

const newCurrencies = currencies.map(c => {
  return `  { code: "${c.code}", name: "${getCurrencyName(c.code, c.majorUnit)}", symbol: "${c.symbol}", singular: "${c.majorUnit}", plural: "${getPlural(c.majorUnit)}", minorSingular: "${c.minorUnit}", minorPlural: "${getPlural(c.minorUnit)}" }`;
});

const output = `export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  singular: string;
  plural: string;
  minorSingular: string;
  minorPlural: string;
}

export const CURRENCIES: CurrencyInfo[] = [
${newCurrencies.join(",\n")}
];`;

fs.writeFileSync('output.ts', output);
console.log("Done. Wrote to output.ts.");

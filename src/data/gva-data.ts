// @ts-nocheck
// Disabling TypeScript check for this file due to complex data structure from OCR
// For a production app, this data should be properly typed and validated.

export interface GvaYearValue {
  nepaliYear: string;
  gregorianYear: string;
  value: number | null;
  isRevised?: boolean;
  isPreliminary?: boolean;
}

export interface GvaIndustrialDivision {
  nsic: string;
  name: string;
  data: GvaYearValue[];
}

const yearsHeaderNepali = ["2067/68", "2068/69", "2069/70", "2070/71", "2071/72", "2072/73", "2073/74", "2074/75", "2075/76", "2076/77", "2077/78", "2078/79", "2079/80", "2080/81 R", "2081/82 P"];
const yearsHeaderGregorian = ["2010/11", "2011/12", "2012/13", "2013/14", "2014/15", "2015/16", "2016/17", "2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23", "2023/24", "2024/25"];

const rawData = [
  { nsic: "A", name: "Agriculture, forestry and fishing", values: [480326, 505735, 512342, 535329, 541758, 541301, 569312, 584167, 614292, 629229, 647154, 662372, 682403, 705275, 728442] },
  { nsic: "B", name: "Mining and quarrying", values: [8525, 8966, 9169, 10224, 10546, 10263, 11761, 12867, 15134, 14797, 15485, 16854, 17007, 17557, 17907] },
  { nsic: "C", name: "Manufacturing", values: [84150, 92647, 95325, 101091, 101155, 91537, 106940, 116785, 124403, 113171, 122968, 131209, 128979, 126374, 131148] },
  { nsic: "D", name: "Electricity and gas", values: [14348, 16505, 16647, 17276, 17387, 15891, 19520, 21546, 23617, 28224, 29403, 44891, 53763, 59655, 67901] },
  { nsic: "E", name: "Water supply; sewerage and waste management", values: [9145, 10031, 11021, 12035, 13250, 14222, 14653, 15322, 15510, 15843, 16056, 16550, 17083, 17300, 17663] },
  { nsic: "F", name: "Construction", values: [92666, 92907, 95039, 103557, 106733, 106864, 126822, 142165, 152801, 146095, 156315, 167144, 164673, 161048, 164610] },
  { nsic: "G", name: "Wholesale and retail trade; repair of motor vehicles and motorcycles", values: [220804, 226875, 233081, 247240, 257602, 251008, 277884, 325767, 352194, 312080, 332798, 357483, 342814, 341567, 352823] },
  { nsic: "H", name: "Transportation and storage", values: [77194, 82508, 89324, 95033, 100638, 100812, 105258, 117552, 127863, 112783, 117785, 123207, 124988, 141770, 155169] },
  { nsic: "I", name: "Accommodation and food service activities", values: [24510, 26049, 27851, 28269, 29799, 27420, 31092, 34887, 38348, 24245, 26847, 30220, 35668, 43168, 45328] },
  { nsic: "J", name: "Information and communication", values: [31436, 40082, 44364, 55876, 61795, 62840, 71416, 72942, 78084, 79662, 82589, 86046, 89620, 94018, 98535] },
  { nsic: "K", name: "Financial and insurance activities", values: [68527, 69773, 71119, 75739, 80961, 88170, 96810, 105941, 112667, 112274, 117504, 125629, 135580, 146345, 155545] },
  { nsic: "L", name: "Real estate activities", values: [143470, 145494, 148226, 150618, 152882, 153478, 159689, 162181, 168269, 171766, 176516, 179546, 184764, 189261, 194416] },
  { nsic: "M", name: "Professional, scientific and technical activities", values: [12363, 13005, 13628, 14543, 15620, 15922, 17309, 18165, 19184, 19476, 19769, 20461, 21264, 22147, 23029] },
  { nsic: "N", name: "Administrative and support service activities", values: [5697, 6170, 7045, 8158, 9108, 10198, 11859, 14067, 14972, 15300, 15651, 15898, 16698, 17372, 18062] },
  { nsic: "O", name: "Public administration and defence; compulsory social security", values: [64040, 66247, 69630, 73046, 79002, 80625, 87095, 91200, 95865, 101769, 105212, 109508, 115485, 120414, 123109] },
  { nsic: "P", name: "Education", values: [75323, 79550, 84177, 88345, 93186, 99852, 107048, 113288, 120060, 123904, 128760, 134760, 140055, 143067, 145903] },
  { nsic: "Q", name: "Human health and social work activities", values: [16885, 17666, 18297, 18853, 20854, 21550, 23144, 24503, 26143, 27502, 29316, 31366, 33427, 35203, 36883] },
  { nsic: "R-T", name: "Other Services", values: [6664, 6964, 7216, 7477, 8129, 8496, 8894, 9306, 9857, 10031, 10370, 10835, 11446, 11935, 12403] },
  { nsic: "SUM_AGRI", name: "Total Agriculture, Forestry and Fishing", values: [480326, 505735, 512342, 535329, 541758, 541301, 569312, 584167, 614292, 629229, 647154, 662372, 682403, 705275, 728442] }, // This is a sum, might be identical to first entry
  { nsic: "SUM_NON_AGRI", name: "Total Non-Agriculture", values: [955746, 1001437, 1041160, 1107381, 1158647, 1159147, 1277194, 1398486, 1494971, 1428920, 1503344, 1601607, 1633315, 1688202, 1760433] },
  { nsic: "GDP_BASIC", name: "Gross Domestic Product (GDP) at basic prices", values: [1436072, 1507172, 1553502, 1642711, 1700405, 1700448, 1846506, 1982653, 2109263, 2058149, 2150497, 2263979, 2315718, 2393477, 2488876] },
  { nsic: "TAXES_SUBSIDIES", name: "Taxes less subsidies on products", values: [123150, 124869, 136070, 148430, 161952, 169975, 191831, 211053, 230480, 226150, 244320, 265698, 264111, 280913, 308695] },
  { nsic: "GDP_TOTAL", name: "Gross Domestic Product (GDP)", values: [1559222, 1632040, 1689572, 1791141, 1862357, 1870424, 2038337, 2193706, 2339743, 2284300, 2394818, 2529677, 2579829, 2674390, 2797571] },
];

export const gvaData: GvaIndustrialDivision[] = rawData.map(division => ({
  nsic: division.nsic,
  name: division.name,
  data: division.values.map((value, index) => ({
    nepaliYear: yearsHeaderNepali[index].replace(" R", "").replace(" P", ""),
    gregorianYear: yearsHeaderGregorian[index],
    value: typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value,
    isRevised: yearsHeaderNepali[index].includes(" R"),
    isPreliminary: yearsHeaderNepali[index].includes(" P"),
  })),
}));

export const allGregorianYears: string[] = [...new Set(gvaData.flatMap(d => d.data.map(y => y.gregorianYear)))];
export const allIndustrialDivisions: string[] = [...new Set(gvaData.map(d => d.name))];

// Function to get year as a number for AI model (start year of the gregorianYear string)
export const getNumericYear = (gregorianYear: string): number => {
  return parseInt(gregorianYear.split('/')[0], 10);
};

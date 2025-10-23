/**
 * Build Key-Value(s) Maps with custom config
 * @author leex <jsonleex@163.com>
 * @link https://www.typescriptlang.org/play?#code/PQKhCgAIUgRBTAZgSwHb0gaXgTwLQBqAhgDYCu8AFAM4CUkAskQA7WQDuyALgBaQDGAe1QoA5lBgABImV6CATpBLx4AD0gAeAFbVhytZICMANgDMAOiEBbAHwTg4cENTUukLoIBKRdgBUczBgAvJCUAG6kAFyQZKgA1qiC7Kj0QTaQAPIARlrw-FzmzPKCHlwB8OYeAMpc8miilqQk4aS05tQkyPxUABwANJB4hrSOzq6QyNQACsWB8mXYOJAhLSTRsQlJKdERJBNsM4JzC7jL6QDaAOQ1daiilwOXAHJkVlnw8g+Q1zhvgiSXAC65jQ-HIABN4NRKB5vH5yqtaCNwMBgJAAKrUDAkQTgojUHiFLpxCYuLjwIjgpzCcbMYnLTS+SBqcmocFsQQ5PJcGwwojyUTwLjRXwDOK4ajRSjinCCRCQXy0c6A1LpADeUEgWvkQrI8lQkBl1HMOvBZG6lEo4K6XDFuFVoTVkHMLut+QG5xlgOiXH5gq4ntwgMgAF9aAM1WHwCHHGVApBiJ1wYtqBpRVhmapWezDbg5QqGTL8750iFMJns2xywB+BXnTDBlnwNkHWYfE5LWvl6LoMIfSA9+B9+SORCxfLIYSQSEodBMZhpivNnOc3LujNNlu52XyktWpCSuuAu04aKYWgi+uA5XgMeoCdTmdoeDzxebldc9fl99sRPIZMSmmNgDAQS5bkWu68jOh6+MqJ5ngMuwUIeBAXpAnh5Ao4JpleYE5ocxw4IskC1rBDYDpAvYfAMsEEICdh3g+BpPnOLBvlmy4cp+tobhxW5-gBOCpiWIF4WwEEKlBB6Xse24IZASFQtEBDKmhGFCPI2FkY2fH4W28xEacpG4YOw4DFMxJpiBNgMeOXCTsxSDPq+TI-pAq7cgM366eJea7qJbkSXu0EyfBWCIaQyHVspkAAD4JqpkAapqWrIPKMLlPmilsEEuXfLELHwOClz0BqWrleVOpcHqjmIMaVgsPu8ppNOSCBjgKopaGjgVVVNWtXVJpFeaVCUA1zADDODplRV5VjG4AD6MoMjO7WAl1FVpaEACEkwEe2hk4JQS32vQfX6pA409bNWrzZAC27AyACC8jyEQOAgtQL1vUd2X0LWdL8HETUReQUL0NEq3ZetG2VbqF1Oi65jjR6J0ddED2kN1FUhhGUYxtSZLMqgryMGQ1BdP48YzVqUwZFMDIAETMEcjN9F1nhPQzISXG9zAPBzGQAMLljzxRAwLBNoOS8iIEQ3RkxT-BU-ACDyjTcmK5T5RdYpPavO8I4VagRBWPA0SuLc4ibc4Fu1PUXWuDgyjRE6nDgrw+tvB8ADckA8PAyCiDwwqUQbvsCP8CjRZAlv1N1BN3Qw5Pa4EauHsnSsq2ryoMucXUaxVMrRJnqcVHTUzszdWp65AhhV9XJtm9ElyAIK2gAyEYAz+mAApyAvVxMtvfCzzDtGE9wNzdTsu0lHD-p7dcAAwLwMAdByH0SGEvAxCDi8gt6alzY+VuMF7DWrF1ryvlOYnOV2fCmRebkAAEwT7NTdP5cgAv0YAjKo9331cujCH3iwUe4975Tyfm7OePAN5b39oHYOodN4LyPlqE+FVC7lQvqXK+gQb7C0wG-CqtdTDEPKh-FugBxE0AFt2-9yGpUHrzQQQMwEAMnmUae0CPawMXsvBBa9kFLzQaGdmMNURKEmFwQm4xcEqxTCtJyrFmCUDkeUdOjwZQlRkW4NRgREzIUUbOF8jU9GqwPI8RS2ik4pzwfAJ4psoRGOcqY2x2cLHfA-tYmkui3HlAAJJjGcco1Rfi04eMuEA1A2iURonGtEZaHgH5gx0ZfFWDizbzhygNFxKizEaO+Fox4XiRg2KzgE5wWTgkmLyWE8xdVNG4C+JE5w3iiZmIyfAZ+gThBVJCIVecoTynhIaZ4xxzSoltNkXUgxXSemoD6TkkJ+SIlWMeJM0pPi0nlFmc-TpiyBmuOGfU6gljH7NJKaMGk-wKg4lEEMsu8ysnnDMeYCuKpIASMuMPNhMibnmDuQ8uxnTumVJYNQF5dT07nGfsCKJHyvniziL8sY-zAVmN2U88FkLjnQsMMCRSCK0S81AdQMelw-nKABYIe5GLH57Mcc8lZdVzgL2vJcKxgIiXfA7v-RwEj4nbncIIZJyFUlmIOUompQL3GjMuEUyAVw1ljLNhM1pjxIFAmRKiql6K6lMrqW8+mwIP70C+by3ulLbk0pleUA1xyjVTDhc4M1xKflkvuPytEOrrX3I1BIiqZiUzswDeVOlYNTmxNmh0xxkbQ1ajMfMyNUbA11P2eCkNaJU3HKxawTN0a02ONBb0jNKaw0zPpbm5N8btmBCyfmqMQA
 */

const toRawType = (val: unknown) =>
  Object.prototype.toString.call(val).slice(8, -1);

const isPropertyKey = (val: unknown): val is PropertyKey =>
  ["String", "Number", "Symbol"].includes(toRawType(val));

// Use lodash.pick instead
const pick = <T extends object>(target: T, keys: (keyof T)[]) => {
  return keys.reduce((dict, key) => ({ ...dict, [key]: target[key] }), {});
};

type ValidKeys<T, K extends keyof T = keyof T> = K extends K
  ? T[K] extends PropertyKey
    ? K
    : never
  : never;

function defineMap<T extends object, K extends keyof T>(
  defs: T[],
  key: K
): T[K][];
function defineMap<T extends object, K extends ValidKeys<T>, V extends keyof T>(
  defs: T[],
  key: K,
  values: V
): Record<T[K] extends PropertyKey ? T[K] : never, T[V]>;
function defineMap<T extends object, K extends ValidKeys<T>, V extends keyof T>(
  defs: T[],
  key: K,
  values: V[]
): Record<T[K] extends PropertyKey ? T[K] : never, Pick<T, V>>;
function defineMap<T extends object, K extends keyof T, V extends keyof T>(
  defs: T[],
  key: K,
  values?: V | V[]
) {
  if (typeof values === "undefined") {
    return defs.map((def) => def[key]);
  }

  return defs.reduce((map, def) => {
    const _key = def[key];
    if (!isPropertyKey(_key)) return map;

    const _val = Array.isArray(values) ? pick(def, values) : def[values];

    return { ...map, [_key]: _val };
  }, {});
}

const enum MusicType {
  POP = "pop",
  RAP = "rap",
  ROCK = "rock",
}

interface MusicTypeDef {
  key: MusicType;
  value: number;
  name: string;
  icon: string;
  style: { width: number; height: number; color?: string };
}

const MusicTypeDefs: MusicTypeDef[] = [
  {
    key: MusicType.POP,
    value: 1,
    name: "流行音乐",
    icon: "pop.svg",
    style: { width: 100, height: 100, color: "red" },
  },
  {
    key: MusicType.RAP,
    value: 2,
    name: "说唱音乐",
    icon: "rap.svg",
    style: { width: 100, height: 100 },
  },
  {
    key: MusicType.ROCK,
    value: 3,
    name: "摇滚音乐",
    icon: "rock.svg",
    style: { width: 100, height: 100 },
  },
];

// list
const MusicTypeKeys = defineMap(MusicTypeDefs, "key");
const MusicTypeValues = defineMap(MusicTypeDefs, "value");
const MusicTypeNames = defineMap(MusicTypeDefs, "name");
const MusicTypeIcons = defineMap(MusicTypeDefs, "icon");

// map: key to value
const MusicTypeNameMaps = defineMap(MusicTypeDefs, "key", "name");
const MusicTypeIconMaps = defineMap(MusicTypeDefs, "key", "icon");
const MusicTypeName2IconMaps = defineMap(MusicTypeDefs, "name", "icon");
const MusicTypeValue2IconMaps = defineMap(MusicTypeDefs, "value", "icon");
const MusicTypeValue2NameMaps = defineMap(MusicTypeDefs, "value", "name");

console.log(MusicTypeIconMaps[MusicType.POP]); // 'pop.svg'
console.log(MusicTypeName2IconMaps[MusicTypeDefs[2].icon]); // 'rock.svg'
console.log(MusicTypeValue2IconMaps[MusicTypeDefs[1].value]); // 'rap.svg'
console.log(MusicTypeValue2NameMaps[MusicTypeDefs[0]["value"]]); // '流行音乐'

// map: key to values
const MusicTypeMaps = defineMap(MusicTypeDefs, "key", [
  "value",
  "name",
  "icon",
  "style",
]);

console.log(MusicTypeMaps[MusicType.POP].name); // '流行音乐'
console.log(MusicTypeMaps[MusicType.POP].icon); // 'pop.svg'

// console.log({
//     MusicTypeKeys,
//     MusicTypeValues,
//     MusicTypeNames,
//     MusicTypeIcons,

//     MusicTypeNameMaps,
//     MusicTypeIconMaps,
//     MusicTypeName2IconMaps,
//     MusicTypeValue2IconMaps,

//     MusicTypeMaps,
// })

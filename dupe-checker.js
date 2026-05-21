import { CHANNEL_LIST } from "./public/streams/config.js";

// lmfao just copied from https://www.geeksforgeeks.org/javascript/javascript-program-to-find-duplicate-elements-in-an-array/
let dupli = [];

for (let i in CHANNEL_LIST) {
    for (let j in CHANNEL_LIST) {
        if (i !== j && CHANNEL_LIST[i] === CHANNEL_LIST[j] && !dupli.includes(CHANNEL_LIST[i])) {
            dupli.push(CHANNEL_LIST[i]);
        }
    }
}

console.log(dupli);
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = random;
function random(len) {
    let options = 'aslfkjsdlkfjowiensldkfn34234slkdfsd';
    let length = options.length;
    let ans = "";
    for (let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * length)]; //math.floor(0.2*20)
    }
    return ans;
}

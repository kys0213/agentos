"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringWidth = exports.slugify = exports.noCase = exports.capitalCase = exports.snakeCase = exports.pascalCase = exports.camelCase = void 0;
exports.paramCase = paramCase;
exports.escapeStringRegexp = escapeStringRegexp;
var change_case_all_1 = require("change-case-all");
Object.defineProperty(exports, "camelCase", { enumerable: true, get: function () { return change_case_all_1.camelCase; } });
Object.defineProperty(exports, "pascalCase", { enumerable: true, get: function () { return change_case_all_1.pascalCase; } });
Object.defineProperty(exports, "snakeCase", { enumerable: true, get: function () { return change_case_all_1.snakeCase; } });
Object.defineProperty(exports, "capitalCase", { enumerable: true, get: function () { return change_case_all_1.capitalCase; } });
Object.defineProperty(exports, "noCase", { enumerable: true, get: function () { return change_case_all_1.noCase; } });
const change_case_all_2 = require("change-case-all");
function paramCase(input) {
    return (0, change_case_all_2.noCase)(input, { delimiter: '-' });
}
const slugify_1 = __importDefault(require("slugify"));
exports.slugify = slugify_1.default;
const string_width_1 = __importDefault(require("@innei/string-width"));
exports.stringWidth = string_width_1.default;
function escapeStringRegexp(str) {
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}
//# sourceMappingURL=index.js.map
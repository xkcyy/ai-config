"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackSnapshot = exports.createBackup = exports.runPush = exports.runSync = void 0;
// Main entry point for the library
var sync_1 = require("./sync");
Object.defineProperty(exports, "runSync", { enumerable: true, get: function () { return sync_1.runSync; } });
var push_1 = require("./push");
Object.defineProperty(exports, "runPush", { enumerable: true, get: function () { return push_1.runPush; } });
var backup_1 = require("./backup");
Object.defineProperty(exports, "createBackup", { enumerable: true, get: function () { return backup_1.createBackup; } });
Object.defineProperty(exports, "rollbackSnapshot", { enumerable: true, get: function () { return backup_1.rollbackSnapshot; } });
__exportStar(require("./constants"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./git-utils"), exports);
//# sourceMappingURL=index.js.map
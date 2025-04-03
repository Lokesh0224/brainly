"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentModel = exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
mongoose_1.default.connect("mongodb+srv://Lokesh0224:Z9ifPj7jAX6c0tVd@cluster1.6hfhayl.mongodb.net/secbrain");
const UserSchema = new mongoose_2.Schema({
    username: { type: String, unique: true },
    password: String
});
const contentSchema = new mongoose_2.Schema({
    title: String,
    link: String,
    tags: [{ type: mongoose_1.default.Types.ObjectId, ref: 'Tag' }],
    userId: { type: mongoose_1.default.Types.ObjectId, ref: 'User', required: true }
});
exports.UserModel = (0, mongoose_2.model)('User', UserSchema);
exports.contentModel = (0, mongoose_2.model)('Content', contentSchema);

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = __importDefault(require("zod"));
const db_1 = require("./db");
const utills_1 = require("./utills");
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requireBody = zod_1.default.object({
            username: zod_1.default.string().max(40).min(3),
            email: zod_1.default.string().email().min(5).max(50),
            password: zod_1.default.string().min(6).max(30).regex(/[0-9]/, 'must contain atleast a number').regex(/[!@#$%^&*()?]/, 'must contain atleast a special character'),
        });
        const validateData = requireBody.parse(req.body);
        const { username, email, password } = validateData;
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield db_1.UserModel.create({
            username: username,
            email: email,
            password: hashedPassword
        });
        res.json({
            message: "user signed up Successfully"
        });
    }
    catch (e) {
        res.status(411).json({
            message: 'Something went wrong',
            error: e instanceof Error ? e.message : e
        });
    }
}));
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const existingUser = yield db_1.UserModel.findOne({
        email
    });
    if (!existingUser || !existingUser.password) {
        return res.status(401).json({ message: 'Not a user may be check the password' });
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(password, existingUser.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'invalid password' });
    }
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            id: existingUser._id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        res.status(403).json({
            message: "Incorrect credentials"
        });
    }
}));
//to post the content
app.post('/api/v1/content', middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, link, type } = req.body;
    yield db_1.contentModel.create({
        title, link, type,
        tags: [],
        //@ts-ignore
        userId: req.userId
    });
    return res.json({
        message: "Content added"
    });
}));
//to list the content
app.get('/api/v1/content', middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const content = yield db_1.contentModel.find({ userId }).populate('userId', 'username');
    res.json({
        content
    });
}));
//to update the existing content
app.put('/api/v1/content', middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    const { title, link } = req.body;
    //@ts-ignore
    const userId = req.userId;
    try {
        const updatedContent = yield db_1.contentModel.findOneAndUpdate({ _id: contentId, userId: userId }, { title: title, link: link }, { new: true });
        if (!updatedContent) {
            return res.status(404).json({ message: 'content not found or unauthorized' });
        }
        res.json({
            message: 'Content successfully updated',
            content: updatedContent
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update content', error });
    }
}));
//to delete a content
app.delete('/api/v1/content', middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    //@ts-ignore
    const userId = req.userId;
    yield db_1.contentModel.deleteMany({
        contentId, userId
    });
    res.json({
        message: 'Deleted the content'
    });
}));
//share your brain to others
app.post('/api/v1/brain/share', middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share; //if you give req.body.share =true, it will share the link or else don't 
    //@ts-ignore
    const userId = req.userId;
    if (share) {
        const existLink = yield db_1.linkModel.findOne({
            userId
        });
        if (existLink) {
            res.json({
                hash: existLink.hash
            });
            return;
        }
        const hash = (0, utills_1.random)(10);
        yield db_1.linkModel.create({
            userId,
            hash
        });
        res.json({
            hash
        });
    }
    else {
        yield db_1.linkModel.deleteOne({
            userId
        });
    }
    res.json({
        message: "Sharable link deleted"
    });
}));
//if someone shares the brain you'll get the link and will see the their brain
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.linkModel.findOne({
        hash
    });
    if (!link) {
        res.status(411).json({
            message: " Sorry incorrect input"
        });
        return;
    }
    const content = yield db_1.contentModel.find({
        userId: link.userId
    });
    console.log(link);
    const user = yield db_1.UserModel.findOne({
        _id: link.userId
    });
    if (!user) {
        res.status(411).json({
            message: "user not found,error shouldn't happen"
        });
        return;
    }
    res.json({
        username: user.username,
        content: content
    });
}));
//delete the user and their content
app.delete('/api/v1/user', middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uId = req.body.uId;
    //@ts-ignore
    const userId = req.userId;
    if (userId !== uId) {
        return res.status(403).json({ message: 'Unauthorized to delete the user' });
    }
    try {
        yield db_1.contentModel.deleteMany({ userId }); //in db its like userId: ObjectId('67ee2afee041414bc5345c2f')
        yield db_1.UserModel.findByIdAndDelete(userId); //for this we have to send like findByIdAndDelete('67ee2afee041414bc5345c2f')
        yield db_1.linkModel.deleteMany({ userId });
        res.json({ message: 'User and all associated content deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error });
    }
}));
app.listen(3000);

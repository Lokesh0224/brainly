import mongoose from 'mongoose'
import {Schema, model} from 'mongoose'
mongoose.connect("mongodb+srv://Lokesh0224:Z9ifPj7jAX6c0tVd@cluster1.6hfhayl.mongodb.net/secbrain")

const UserSchema= new Schema({
    username: {type: String, unique: true},
    password: String
})

const contentSchema= new Schema({
    title: String, 
    link: String,
    tags:[{type: mongoose.Types.ObjectId, ref: 'Tag'}], 
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true}

})

export const UserModel= model('User', UserSchema) 
export const contentModel= model('Content', contentSchema)
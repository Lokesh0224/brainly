import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import z from 'zod'
import { UserModel, contentModel} from './db'
import { JWT_SECRET } from './config'
import { userMiddleware } from './middleware'

const app= express()
app.use(express.json())



app.post('/api/v1/signup', async (req, res) => {
    try{
        const {username, password} = req.body

        await UserModel.create({
                username: username, 
                password: password
        })

        res.json({
            message:"user signed in"
        })
}
catch(e){
    res.status(411).json({
        message: 'User already exists'
    })

}

})

app.post('/api/v1/signin', async (req, res)=>{
    const { username, password}= req.body

    const existingUser= await UserModel.findOne({// this will return the json
        username, password
    })

    if(existingUser){
        const token= jwt.sign({
            id: existingUser._id
        }, JWT_SECRET)

        res.json({
            token
        })
    }
    else{
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }

})

app.post('/api/v1/content', userMiddleware, async(req, res)=>{
    const { title, link}= req.body
    await contentModel.create({
        title, link,
        tags:[],
        //@ts-ignore
        userId: req.userId 
        
    })
    return res.json({
        message: "Content added"
    })
})

app.delete('/api/v1/content', (req, res)=>{

})

app.post('/api/v1/content', (req, res)=>{

})

app.get('/api/v1/content', (req, res)=>{

})

app.listen(3000);
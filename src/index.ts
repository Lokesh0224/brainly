import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import z from 'zod'
import { UserModel, contentModel, linkModel} from './db'
import { random } from './utills'
import { JWT_SECRET } from './config'
import { userMiddleware } from './middleware'
import cors from "cors"

const app= express()
app.use(express.json())
app.use(cors())



app.post('/api/v1/signup', async (req, res) => {
    try{

        const requireBody= z.object({
            username: z.string().max(40).min(3),
            email: z.string().email().min(5).max(50),
            password:z.string().min(6).max(30).regex(/[0-9]/, 'must contain atleast a number').regex(/[!@#$%^&*()?]/, 'must contain atleast a special character'),
            
        })

        const validateData= requireBody.parse(req.body)
        const {username, email, password} = validateData

        const existingUser= await UserModel.findOne({username})
        if(existingUser){
            return res.status(400).json({message:'User already exists'})
        }

        const hashedPassword= await bcrypt.hash(password, 10)

        await UserModel.create({
                username: username, 
                email: email, 
                password: hashedPassword
        })

        res.json({
            message:"user signed up Successfully"
        })
}
catch(e){
    
    res.status(411).json({
        message: 'Something went wrong',
        error: e instanceof Error ? e.message : e
    })

}

})

app.post('/api/v1/signin', async (req, res)=>{
    const { email,password}= req.body

    const existingUser= await UserModel.findOne({// this will return the json
         email
    })

    if (!existingUser || !existingUser.password) {
        return res.status(401).json({ message: 'Not a user may be check the password' });
    }

    const isPasswordValid= await bcrypt.compare(password, existingUser.password)

    if(!isPasswordValid){
        return res.status(401).json({message: 'invalid password'})
    }

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

//to post the content
app.post('/api/v1/content', userMiddleware, async(req, res)=>{
    const { title, link, type}= req.body

    await contentModel.create({
        title, link,type, 
        tags:[],
        //@ts-ignore
        userId: req.userId 
        
    })
    return res.json({
        message: "Content added"
    })
})

//to list the content
app.get('/api/v1/content', userMiddleware, async (req, res)=>{
    //@ts-ignore
    const userId= req.userId
    const content= await contentModel.find({userId}).populate('userId', 'username')
    res.json({
        content
    })

})

//to update the existing content
app.put('/api/v1/content', userMiddleware, async(req, res)=>{
    const contentId=req.body.contentId
    const {title, link}= req.body
    //@ts-ignore
    const userId= req.userId

    try{
        const updatedContent= await contentModel.findOneAndUpdate(
            {_id:contentId, userId: userId}, 
            {title: title, link: link}, 
            {new:true}
        )
        if(!updatedContent){
            return res.status(404).json({message: 'content not found or unauthorized'})
        }
        res.json({
            message:'Content successfully updated', 
            content:updatedContent
        })
    }
    catch(error){
        res.status(500).json({message: 'Failed to update content', error})
    }
})


//to delete a content
app.delete('/api/v1/content', userMiddleware, async(req, res)=>{
    
    const contentId= req.body.contentId
    //@ts-ignore
    const userId=req.userId
    await contentModel.deleteMany({
        contentId, userId
    })
    res.json({
        message:'Deleted the content'
    })
})

//share your brain to others
app.post('/api/v1/brain/share', userMiddleware, async(req, res)=>{
    const share= req.body.share//if you give req.body.share =true, it will share the link or else don't 
    //@ts-ignore
    const userId= req.userId
    if(share){
        const existLink= await linkModel.findOne({
            userId
        })

        if(existLink){
            res.json({
                hash: existLink.hash
            })
            return
        }
        const hash= random(10)
        await linkModel.create({
            userId,
            hash
        })
        res.json({
            hash
        })
    }
    else{
        await linkModel.deleteOne({
            userId
        })
    }
    res.json({
        message:"Sharable link deleted"
    })
})

//if someone shares the brain you'll get the link and will see the their brain
app.get("/api/v1/brain/:shareLink", async(req, res)=>{
    const hash= req.params.shareLink

    const link= await linkModel.findOne({//this returns hash and userId
        hash
    })

    if(!link){
        res.status(411).json({
            message:" Sorry incorrect input"
        })
        return 
    }
    const content= await contentModel.find({
        userId:link.userId
    })

    console.log(link)
    const user= await UserModel.findOne({
        _id:link.userId
    })
    if(!user){
        res.status(411).json({
            message: "user not found,error shouldn't happen"
        })
        return
    }
    res.json({
        username: user.username, 
        content: content
    })
})

//delete the user and their content
app.delete('/api/v1/user', userMiddleware, async(req, res)=>{
    const uId= req.body.uId
    //@ts-ignore
    const userId= req.userId

    if(userId !== uId){
        return res.status(403).json({message: 'Unauthorized to delete the user'})
    }

    try{
        await contentModel.deleteMany({userId})//in db its like userId: ObjectId('67ee2afee041414bc5345c2f')
        await UserModel.findByIdAndDelete(userId)//for this we have to send like findByIdAndDelete('67ee2afee041414bc5345c2f')
        await linkModel.deleteMany({userId})

        res.json({ message: 'User and all associated content deleted successfully' })
    }
    catch(error){
        res.status(500).json({ message: 'Failed to delete user', error })
    }
})






app.listen(3000);
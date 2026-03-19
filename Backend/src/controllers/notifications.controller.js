import Notification from "../models/Notification.js";
export const createNotification=async(req,res,next)=>{
    try{
        const{userId,title,message}=req.body;
         if (!userId || !title || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }
        const notification=await Notification.create({
            userId,
            title,
            message
        });
        res.json(notification);
    }catch(error){
        res.status(500).json({message:"notification creation error"});
    }
};
export const getNotifications=async(req,res)=>{
    try{
        const notifications=await Notification.find({
            userId:req.user._id
        }); res.json(notifications);
    }catch(error){
        res.status(500).json({message:"error with fetching notifications"});
    }
};
export const markRead=async(req,res)=>{
    try{
        const id=req.params.id;
        const notification=await Notification.findByIdAndUpdate(id,
            {isRead:true},
            {new:true}
        ); res.json(notification);
    }catch(error){
        res.status(500).json({message:"updating notification error"
        });
    }
};
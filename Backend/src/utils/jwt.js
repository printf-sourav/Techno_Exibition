
import jwt from "jsonwebtokens";
export const generateToken=(userId)=>{
    return jwt.sign(
        {
            id:UserId},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
           
        
    );
};
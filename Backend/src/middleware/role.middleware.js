
import ApiError from "../utils/ApiError.js";

const rolesallowed=(...roles)=>{
    return(req,res,next)=>{
        if(!req.user){
            return next(new ApiError(401,"login first"));
        }
        if(!roles.includes(req.user.role)){
            return next(new ApiError(403,"Access denied"));
        } next();
    };
};
export default rolesallowed;
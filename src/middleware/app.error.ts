/**
 * Custom application error class
 */

class AppError extends Error{
    statusCode:number;
    constructor(message:string,statusCode:number){
        super(message);

        this.statusCode=statusCode;
        this.name="AppError";
        Error.captureStackTrace(this,this.constructor);
    }
}

export default AppError;
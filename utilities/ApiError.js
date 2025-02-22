class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message);
        this.errors=errors;
        this.message=message;
        this.statusCode=statusCode;
        if(stack){
            this.stack=stack;
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}
export {ApiError}
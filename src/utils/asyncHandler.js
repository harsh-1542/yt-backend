// const aysncHandler = ()=>{};
// const aysncHandler = (fn)=> async () => {};

const aysncHandler = ()=>{};




export {aysncHandler};




// this code is for try catch 
// const asyncHandler = (fn) => async (req, res, next)=>{
//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         console.log(error.code || 500);

//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Internal Server Error",
//         })

//     }
// }
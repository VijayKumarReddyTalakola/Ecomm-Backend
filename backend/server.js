const express = require("express");
const app = express();
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");
const connectDB = require("./DB/db");
const dotenv = require("dotenv");

app.use(express.json());
app.use(cookieParser());


//Route imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);

//Middleware for Error handling
app.use(errorMiddleware);

// config 
dotenv.config({path:"config/config.env"});

//connecting to Data base
connectDB();

//Handling uncaught exception
process.on("uncaughtException",(err)=>{
    console.log(`Error:${err.message}`);
    console.log("Shutting down server due to Uncaught Exception");
    process.exit(1);
})

const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is running on ${process.env.PORT}`);
})

//Unhandled Promise Rejection
process.on("unhandledRejection",(err)=>{
    console.log(`Error:${err.message}`);
    console.log("Shutting down server due to Unhandled Promise Rejection");
    server.close(()=>{
        process.exit(1);
    })
})

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
 //Set up default mongoose connection
const connectDB = () =>{
    const mongoDB = process.env.DB;
    mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then((data) => {
      console.log(`Connected successfully with ${data.connection.host}`);
    })
}

module.exports = connectDB

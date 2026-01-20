import mongoose from "mongoose";

const connectToMongoDB = async () => {
    try {
        // local
        const localConnectionPrefix = "mongodb://";
        const connectionHost = process.env.MONGODB_LOCAL_URI_HOST;
        const connectionPort = process.env.MONGODB_LOCAL_URI_PORT;
        // remote
        const clusterName = process.env.MONGODB_CLUSTER_NAME;
        // both
        const databaseName = process.env.MONGODB_DATABASE_NAME;
        const username = process.env.MONGODB_USERNAME;
        const password = process.env.MONGODB_PASSWORD;

        const connectToRemoteDB = (process.env.MONGODB_REMOTE_MODE != null && process.env.MONGODB_REMOTE_MODE.toLocaleLowerCase() == "true") || false;
        let connectionString = "";

        if(connectToRemoteDB){
            console.log("Connecting to remote Mongo Database.");
            connectionString = `mongodb+srv://${username}:${password}@${clusterName.toLocaleLowerCase()}.wsqgvr3.mongodb.net/?appName=${clusterName}`;
        } else {
            console.log("Connecting to local Mongo Database.");
            connectionString = `${localConnectionPrefix}${username}:${password}@${connectionHost}:${connectionPort}`;            
        }

        await mongoose.connect(
            connectionString,
            {
                serverSelectionTimeoutMS: 5000,
                dbName: databaseName,
                authSource: "admin",
            }
        );        

        console.log("Connection to MongoDB server established.");

    } catch(err) {
        console.error("Error connecting to MongoDB server: ", err);
        process.exit(1);
    }
}

export default connectToMongoDB;
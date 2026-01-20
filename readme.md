-Required backend environment variables

--Backend Server Info
    PORT (quotes not neccessary)
    IPV4_ADDRESS (quotes not neccessary)
--Frontend Server Info
    FRONTEND_PORT
--MongoDB
---Local MongoDB Server
    MONGODB_LOCAL_URI_HOST
    MONGODB_LOCAL_URI_PORT
---Remote MongoDB Server
    MONGODB_CLUSTER_NAME
---Both
    MONGODB_DATABASE_NAME
    MONGODB_USERNAME
    MONGODB_PASSWORD
    MONGODB_REMOTE_MODE ("true" or "false")
-JWT
    ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET

If MONGODB_REMOTE_MODE is "true", then you don't need to include the environment variables associated with the "Local MongoDB Server", and vise versa if the variable is set to false
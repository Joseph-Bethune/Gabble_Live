# Required backend environment variables
## Backend Server Info
    PORT : (quotes not neccessary)
    IPV4_ADDRESS : 
    NODE_ENV : (can only accept values of "production" or "dev", quotes required)
## MongoDB
### Local MongoDB Server
    MONGODB_LOCAL_URI_HOST
    MONGODB_LOCAL_URI_PORT
### Remote MongoDB Server
    MONGODB_CLUSTER_NAME
### Both
    MONGODB_DATABASE_NAME
    MONGODB_USERNAME
    MONGODB_PASSWORD
    MONGODB_REMOTE_MODE : (can only accept values of "true" or "false", quotes required)
## JWT
    ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET
## Notes
* If MONGODB_REMOTE_MODE is "true", then you don't need to include the environment variables associated with the "Local MongoDB Server", and vise versa if the variable is set to false.
* All expected values are strings (and thus require quotation marks) unless specified otherwise.
# Required frontend environment variables
## Frontend Server Info
VITE_BACKEND_DOMAIN : (domain of the backend server)
VITE_BACKEND_PORT : (port of the backend server, will match the value above)
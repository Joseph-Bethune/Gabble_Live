# Required backend environment variables
## Backend Server Info
    PORT : (quotes not neccessary)
    NODE_ENV : (can only accept values of "production" or "dev", quotes required)
## MongoDB
### Local MongoDB Server
    MONGODB_LOCAL_URI_HOST (See note (1))
    MONGODB_LOCAL_URI_PORT (See note (1))
### Remote MongoDB Server
    MONGODB_CLUSTER_NAME (See note (2))
### Both
    MONGODB_DATABASE_NAME
    MONGODB_USERNAME
    MONGODB_PASSWORD
    MONGODB_REMOTE_MODE : (can only accept values of "true" or "false", quotes required)
## JWT
    ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET
## Notes
* (1) If MONGODB_REMOTE_MODE is "true", then you don't need to include the environment variables associated with the "Local MongoDB Server".
* (2) If MONGODB_REMOTE_MODE is "false" then you don't need to include the environment variables associated with the "Remote MongoDB Server".
* All expected values are strings (and thus require quotation marks) unless specified otherwise.
# Required frontend environment variables
## Frontend Server Info
    VITE_BACKEND_DOMAIN : (domain of the backend server)
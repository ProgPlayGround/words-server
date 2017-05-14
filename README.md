# words-server

# For Translation API:
1. export GCLOUD_PROJECT=project-id
2. export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account_file.json

# For Amazon aws-sdk:

1. Create credentials in Users/CurrentUser/.aws;
2. Add aws_access_key_id, aws_secret_access_key to credentials;


# For Docker:

docker build -t ap/words-server .
docker run --env HOST=192.168.99.101 -p 49160:3000 -d ap/words-server

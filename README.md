# words-server

# For Translation API:
1. export GCLOUD_PROJECT=project-id
2. export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service_account_file.json

# For Amazon aws-sdk:

1. Create credentials in Users/CurrentUser/.aws;
2. Add aws_access_key_id, aws_secret_access_key to credentials;


# For Docker:

1. docker-machine.exe start words-server
2. docker-machine.exe env words-server
3. docker run --name redis -d --restart=always --publish 6379:6379 --volume /srv/docker/redis:/var/lib/redis redis:latest --appendonly yes
4. docker run -p 27017:27017 --name mongo -d mongo
5. docker build -t ap/words-server .
6. docker run --name words -e HOST=192.168.99.101 -e "HOME=/home" -e "GCLOUD_PROJECT=quiz" -e "GOOGLE_APPLICATION_CREDENTIALS=/home/config/quiz-gcloud.json" -v $HOME/.aws:/home/.aws -p 49160:3000 -v $HOME/config:/home/config -d ap/words-server
7. docker rm $(docker ps -aq)
8. docker exec -it mongo bash
9. docker inspect words

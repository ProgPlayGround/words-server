docker stop words
docker rm words
docker build -t ap/words-server .
docker run --name words -e HOST=192.168.99.101 -e "HOME=/home" -e "GCLOUD_PROJECT=quiz" -e "GOOGLE_APPLICATION_CREDENTIALS=/home/config/quiz-gcloud.json" -v $HOME/.aws:/home/.aws -p 49160:3000 -v $HOME/config:/home/config -d ap/words-server

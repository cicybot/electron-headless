# electron-headless


    docker build -t my-electron .
    docker run --network=host -it -p 3000:3000 -v ./src:/data my-electron bash


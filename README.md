ten20api
========


#Server setup on Linode

## [Secure your server](https://library.linode.com/securing-your-server)


### Install git
    sudo apt-get install git

### Install nginx
    sudo apt-get install nginx
    
### Sample /etc/nginx/nginx.conf

This may not be exactly what you want. The server name and certificate paths will require modification. 

```   
user www-data;
worker_processes 4;
pid /run/nginx.pid;

events {
	worker_connections 768;
	# multi_accept on;
}

http {

	##
	# Basic Settings
	##

	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	server_tokens off;

	# server_names_hash_bucket_size 64;
	# server_name_in_redirect off;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	##
	# Logging Settings
	##

	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	##
	# Gzip Settings
	##

	gzip on;
	gzip_disable "msie6";

	# gzip_vary on;
	gzip_proxied any;
	gzip_comp_level 6;
	gzip_buffers 16 8k;
	gzip_http_version 1.1;
	gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;

	##
	# nginx-naxsi config
	##
	# Uncomment it if you installed nginx-naxsi
	##

	#include /etc/nginx/naxsi_core.rules;

	##
	# nginx-passenger config
	##
	# Uncomment it if you installed nginx-passenger
	##
	
	#passenger_root /usr;
	#passenger_ruby /usr/bin/ruby;

	##
	# Virtual Host Configs
	##

	#include /etc/nginx/conf.d/*.conf;
	#include /etc/nginx/sites-enabled/*;
        

	ssl_session_cache   shared:SSL:10m;
	ssl_session_timeout 10m;

	server {
                server_name www.ten20live.com ten20live.com;
		listen 80;
		return 301 https://ten20live.com;
	}

	upstream homepage {
		server 127.0.0.1:3000;	
	}

        upstream api {
                server 127.0.0.1:4000;
        }

        upstream tileserver {
                server 127.0.0.1:7777;
        }

        upstream sms {
                server 127.0.0.1:5000;
        }

	server {
		listen              443 ssl;
		server_name         ten20live.com;
		keepalive_timeout   70;

		ssl_certificate     /path/to/cert.pem;
		ssl_certificate_key /path/to/key.pem;
		ssl_protocols       SSLv3 TLSv1 TLSv1.1 TLSv1.2;
		ssl_ciphers         HIGH:!aNULL:!MD5;
                

		location  = / {
			proxy_pass http://homepage;
		}
		location ~ ^(/admin)|^(/features)|^(/contact)|^(/console)|^(/docs) {
			proxy_pass http://homepage;
		}
                location ~ ^(/trackers)|^(/signup)|^(/user)|^(/authenticate)|^(/signout)|^(/message)|^(/trips)|^(/recent_messages)|^(/protocols) {
                        proxy_pass http://api;
                }
                location ~ ^(/v2/tiles) {
                        proxy_pass http://tileserver;
                        expires max;
                }
                location ~ ^(/sms) {
                        proxy_pass http://sms;
                        expires max;
                }
		location / {
			root /home/birkett/prod/js/ten20homepage/public;
                        expires modified +24h;
		}
	}
}
```
    
### Install tools to build node
    sudo apt-get install build-essential openssl libssl-dev pkg-config

### Build node

Make a directory to compile node in

    mkdir node
    cd node
    
Get node e.g node v0.10.28

    wget http://nodejs.org/dist/v0.10.28/node-v0.10.28.tar.gz
    
Unpack

    tar -xzf node-v0.10.28.tar.gz 
    
Build

    cd node-v0.10.28/
    ./configure --prefix=$HOME/local/node
    make
    make install
    
### Add node to path
    
    cd
    nano .bashrc
    
add following line at the end of the file

    export PATH=$HOME/local/node/bin:$PATH
    
    
### Install node tools

    npm update -g bower
    npm install -g grunt-cli
    npm install -g forever

### Get projects

    cd
    mkdir prod
    mkdir prod/js
    cd prod/js
    
ten20 sms interface

    git clone https://github.com/ten20/ten20-sms-interface.git
    cd ten20-sms-interface
    npm install
    
ten20 location io

    git clone https://github.com/ten20/ten20location.io.git
    cd ten20location.io
    npm install
    
ten20 tile server

    git clone https://github.com/ten20/ten20-tile-server.git
    cd ten20-tile-server/
    npm install
    
ten20 api
    
    git clone https://github.com/alexbirkett/ten20api.git
    cd ten20api
    npm install
    
ten20homepage
   
    git clone https://github.com/alexbirkett/ten20homepage.git
    cd ten20homepage
    ./update-deps.sh
    

### Script to start services

    nano node_server_init.sh
    
```
#!/bin/sh
export NODE_ENV=production
export PATH=/home/birkett/local/node/bin:$PATH
forever start -a -l ten20api.log /home/birkett/prod/js/ten20api/index.js --port 4000 --dbname ten20api
forever start -a -l ten20homepage.log /home/birkett/prod/js/ten20homepage/app.js --only-http
forever start -a -l ten20location.io.log /home/birkett/prod/js/ten20location.io --url http://localhost:4000
forever start -a -l ten20tileServer.log /home/birkett/local/node/lib/node_modules/ten20-tile-server/app.js -m mbtiles --url mbtiles:///home/birkett/ten20.mbtiles 
forever start -a -l ten20smsInterface.log /home/birkett/prod/js/ten20-sms-interface/index.js
```

    chmod +x node_server_init.sh 


### Start services on boot

     nano /etc/rc.local

```
#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "exit 0" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#
/usr/bin/sudo -u birkett /home/birkett/node_server_init.sh
exit 0

```


Linking api
===========
The ten20api can be 'linked' to allow the ten20home page project and the api to be worked on simultaneously wihtout doing any git commits, pushes or pulls.

from ten20api project root:
    
    npm link
    
from ten20homepage project root:
    
    npm link ten20api

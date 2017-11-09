cd ~/_gc/srv
mv -f ./srv.log ./srv-old.log
sudo -u pi forever start -l /home/pi/_gc/srv/srv.log ./srv.js

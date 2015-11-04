#!/bin/bash
sudo rm -rf /tmp/ocpu*
sudo rm -rf /tmp/opencpu*
sudo rm -rf /tmp/RParcoords
sudo service opencpu restart
sudo service opencpu-cache stop

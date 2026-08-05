sudo apt update
sudo apt upgrade -y
sudo apt install ca-certificates curl gnupg 1sb-release -y
sudo apt install ca-certificates curl gnupg lsb-release -y
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) \
signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo usermod -aG docker @USER
sudo usermod -aG docker $USER
sudo reboot
sudo apt update
sudo apt install openssh-server -y
sudo systemctl enable ssh
sudo systemctl start ssh
sudo systemctl status ssh
ip a
sudo apt install openssh-server -y
sudo systemctl enable ssh
sudo systemctl start ssh
sudo systemctl status ssh
ip a
sudo cat key
cd ~/besu-network/node1
sudo cat key
cd ~/besu-network/node1
sudo cat ~/besu-network/node1/key
cd ..
sudo sed -i `s/^0x//` ~/besu-network/node1/key
sudo sed -i 's/^0x//' ~/besu-network/node1/key
sudo cat ~/besu-network/node1/key
sudo chown -R $USER:$USER ~/besu-network/node1
chmod 600 ~/besu-network/node1/key
chmod 600 ~/besu-network/node1/address
cd node1
cat key
sudo sed -i 's/^0x//' ~/besu-network/node1/key
cd node1 cat key
cat key
python3 createGenesis.py
cd ..
python3 createGenesis.py
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ip a
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
hostname -I
curl -X POST --data
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1} http://127.0.0.1:8545
ip a
docker ps
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1} http://192.168.254.111:8545
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1} http://192.168.254.111:8545
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://192.168.254.111:8545
cat ~/besu-network/docker-compose.yml
docker logs besu-node --tail 50
cat ~/besu-network/docker-compose.yml
nano ~/besu-network/docker-compose.yml
docker-compose down
cd ~/besu-network/node1
docker-compose down
cd ..
docker compose down
nano ~/besu-network/docker-compose.yml
docker compose down
nano ~/besu-network/docker-compose.yml
docker compose down
nano ~/besu-network/docker-compose.yml
docker compose down
cat ~/besu-network/docker-compose.yml
docker compose down
ip a
nano ~/besu-network/docker-compose.yml
docker compose down
nano ~/besu-network/docker-compose.yml
docker compose down
nano ~/besu-network/docker-compose.yml
docker compose up -d
cat -A ~/besu-network/docker-compose.yml
cat ~/besu-network/docker-compose.yml
cat -A ~/besu-network/docker-compose.yml
nano ~/besu-network/docker-compose.yml
docker compose down
cat -A ~/besu-network/docker-compose.yml
docker compose downn
docker compose down
nano ~/besu-network/docker-compose.yml
docker compose config
nano ~/besu-network/docker-compose.yml
docker compose config
nano ~/besu-network/docker-compose.yml
docker compose config
nano ~/besu-network/docker-compose.yml
docker compose config
cd node1
cat key
python3 createGenesis.py
cd ..
python3 createGenesis.py
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker logs besu-node --tai; 20
docker logs besu-node --tail 20
docker ps

curl -X POST http://localhost:8545 -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}'
sudo apt remove -y nodejs npm nodejs-doc libnode-dev
sudo apt purge -y nodejs npm nodejs-doc libnode-dev
sudo apt autoremove -y
curl -o- https://raw/githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
curl -o- https://raw/githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node -v
npm -v
cd besu-system
cd ~
cd besu-system
cd smart-contracts
ls
npm init -y
npm install ethers dotenv
npm install --save-dev hardhat@2.22.19 @nommicfoundation/hardhat-toolbox@hh2
npm install --save-dev hardhat@2.22.19 @nomicfoundation/hardhat-toolbox@hh2
npm install --save-dev hardhat@2.22.19 
npm install --save-dev @nomicfoundation/hardhat-toolbox@hh2
node checkBalance.js
docker logs besu-node --tail 50
node checkBalance.ks
node checkBalance.js
nano docker-compose.yml
node checkBalance.js
nano docker-compose.yml
node checkBalance.js
node docker-compose.yml
nano docker-compose.yml
node docker-compose.yml
nano docker-compose.yml
node docker-compose.yml
nano docker-compose.yml
node docker-compose.yml
nano docker-compose.yml
node docker-compose.yml
nano docker-compose.yml
node docker-compose.yml
nano docker-compose.yml
docker compose down
docker compose up -d
docker ps
cd ..
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
cd ~/besu-system
cd ~/smart-contracts
cd smart-contracts
node checkBalance.js
nano docker-compose.yml
nano checkBalance.js
node checkBalance.js
nano package.json
nano generateWallet.js
node generateWallet.js
nano generateWallet.js
ls
la ~/
-la/besu-network/
-la ~/besu-network/
ls -la ~/besu-network/
ls -la ~/besu-system/
ls -la ~/besu-system/smart-contracts/
find ~-type f -name "*.js" 2>/dev/null
find ~-type f -name "*.sol" 2>/dev/null
find
find ~-type f -name "*.env" 2>/dev/null
npx hardhat init
ls
nano generatewallet.js
node generateWallet.js
nano generateWallet.js
node generateWallet.js
nano generateWallet.js
cd ~/besu-network
ls
cd ~/besu-system/smart-contracts
docker cd ~/besu-network
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ip a
cd ~/besu-system/smart-contracts
node checkBalance.js
nano checkBalance.js
node checkBalance.js
cat ~/besu-network/docker-compose.yml
nano docker-compose.yml
node checkBalance.js
nano docker-compose.yml
cat ~/besu-network/docker-compose.yml
docker ps
docker logs besu-node --tail 30
curl -X POST --data '{
nano docker-compose.yml
docker compose down
docker compose up -d
nano docker-compose.yml
docker compose down
docker compose up -d
nano docker-compose.yml
ls
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
cd ~/besu-system/smart-contracts
node checkBalance.js
ls
cd ..
sudo apt install tree -y
tree ~ --prune -I "node_modules|.npm|.cache

cd ~/besu-system
l
ls
ip a
cd smart-contracts
docker compose down
docker compose up -d
node checkBalance.js
cat key
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
sudo systemctl stop besu
ps aux | grep besu
pgrep -a besu
ps aux | grep java
sudo shutdown now
ls
cd ~/besu-network
ls
cd~/besu-system
cd ~/besu-system
ls
cd smart-contracts
ls
cd ..
sudo apt update
sudo apt install openssh-server -y
sudo systemctl enable ssh
status ssh
start ssh
sudo systemctl start ssh
sudo systemctl status ssh
ip a
cd ~/besu-network/node1
ls
docker run --rm -v $(pwd):/opt/besu/node/hyperledger/besu:25.3.0 --data-ptah=/opt/besu/node public-key export-address --to=/opt/besu/node/address
docker run --rm -v $(pwd):/opt/besu/node/hyperledger/besu:25.3.0 \ --data-path=/opt/besu/node public-key export-address --to=/opt/besu/node/address
docker run --rm -v $(pwd):/opt/besu/node/hyperledger/besu:25.3.0 \ 
--data-path=/opt/besu/node public-key export-address --to=/opt/besu/node/address
cd ~/Downloads
cd ~/besu-system/smart-contracts
docker compose down
docker compose up -d
cd ~/besu--network
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker -f logs besu-node
docker logs -f besu-node
ip a
docker logs -f besu-node
ip a
docker logs -f besu-node
docker ps
pkill -f Postman
postman
cd ..
pkill -f Postman
postman
ps aux | grep postman
pkill -f postman
postman
find / -name "postman" -type f 2>/dev/null
~/Postman/Postman
ip a
docker compose down
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ip a
docker compose down
docker compose up -d
docker ps
docker logs -f besu node
docker logs -f besu-node
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
ls
cd ~/besu-system/smart-contracts
node checkBalance.js
ip a
cd ~/besu-network
docker compose up -d
docker ps
docker logs -f besu-nde
docker logs -f besu-node
cd ~/besu-system/smart-contract
cd ~/besu-system
cd smart-contract
cd smart-contracts
node checkBalance.js
nano checkBalance.js
cd ..
cd ~/besu-system
docker fs
cd ~/besu-network
docker fs
docker ps
docker logs -f besu-node
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
docker volume prune
rm -rf data
docker up -d --force-receate
docker compose up -d --force-recreate
docker ps
docker logs -f besu-node
docker inspect besu-node
ls
nano docker-compose.yml
ls
cd node1
ls
cd ..
docker compose down
cd ~/besu-system
ls
cd smart-contracts
ls
node generateWallet.js
nano generateWallet.js
node fundWallet.js
ls
node checkBalance.js
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
cd ~/besu-system
ls
cd smart-contracts
ls
node generateWallet.js
node checkBalance
node checkBalance.js
nano checkBalance.js
node checkBalance.js
nano checkBalance.js
node checkBalance.js
cat ~/besu-system/node1/address
ls ~/besu-system/node1/data/
cd ..
ls
cd ~/besu-network
ls
cd node1
ls
cd ..
docker ps
docker logs -f besu-node
cd ~/besu-system
ls
cd smart-contracts
ls
node checkBalance.js
cd ..
cd ~/besu-network
docker ps
docker logs -f besu-node
docker ps
docker logs -f besu-node
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
cat ~/besu-system
cat ~/besu-system/startNode.sh
ls ~/besu-system
cd ~/besu-system
ls
cd smart-contracts
node checkBalance.js
cd ~/besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ip a
cd ~/besu-system
ls
cd smart-contracts
node checkBalance.js
cd ~/besu-network
docker compose down
docker compose up -d
curl -X POST http://192.168.254.111:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}'
docker ps
cd ~/besu-system
ls
cd smart-contracts
node checkBalance.js
cd ~/besu-network
docker ps
docker logs -f besu-node
ip a
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
cd ~/besu-system
ls
cd smart-contracts
ls
node checkBalance.js
cd ~/besu-network
sudo apt remove -y nodejs npm nodejs-doc libnode-dev
sudo apt purge -y nodejs npm nodejs-doc libnode-dev
sudo apt autoremove -y
curl -o -https://raw.githubusercontent.com/nvm-sh/nvm/vo.40.3/install.sh | bash
curl -o- -https://raw.githubusercontent.com/nvm-sh/nvm/vo.40.3/install.sh | bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/vo.40.3/install.sh | bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
souce ~/.bashrc
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node -v
npm -v
cd ~/besu-system
ls
cd smart-contracts
ls
node checkBalance.js
mkdir -p contracts
mkdir -p scripts
npx hardhat compile
npx hardhat run scripts/deploy.js --network besu
cd ~/besu-network
ls
docker ps
docker compose down
sudo shutdown now
ls
ipa 
ip a
cd ~/besu-network
ls
docker ps
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
cd ~/besu-system
ls
cd smart-contracts
node checkBalance.js
ls
cd ..
ls
cd smart-contracts
docker compose down
docker compose up -d
ls
docker ps
cd ..
ls
cd besu-system
ls
cd ..
cd besu-network
ls
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ls
cd ~/besu-system
ls
cd smart-contracts
ls
node checkBalance.js
ip a
node checkBalance.js
cd ..
ls
cd ..
ls
cd besu-network
docker compose down
docker ps
docker compose up -d
docker ps
cd ~/besu-system
ls
cd smart-contracts
npx hardhat compile
node checkBalance.js
cd ..
cd ~/besu-network
docker compose down
docker ps
cd ..
sudo shutdown -h now
ls
cd besu-system
ls
cd smart-contracts
ls
node checkBalance.js
npk hardhat compile
npx hardhat compile
cd ..
cd besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ip a
docker logs -f besu-node
ip a
n
docker compose down
docker ps
docker compose up -f
docker compose up -d
docker ps
docker logs -f besu-node
ip a
docker logs -f besu-node
ls
nano docker-compose.yml
ls
cd node1
ls
cd ..
ls
cd besu-system
ls
cd smart-contracts
ls
node generateWallet.js
node checkBalance.js
cd ..
sudo nano /etc/netplan/00-installer-config.yaml
ls /etc/netplan/
nano 50-cloud-init.yaml
ls /etc/netplan/
nano 50-cloud-init.yaml
sudo netplan apply
ip a
ls
cd besu-network
docker ps
docker logs -f besu-node
docker ps
docker compose down
docker ps
cd ..
sudo shutdown now
ip a
ls
besu-network
cd besu-network
docker ps
docker compose up -d
docker ps
ip a
docker logs -f besu-node
ip a
ls
cd ..
ls
cd besu-system
ls
cd ..
cd smart-contracts
ls
cd besu-system
ls
cd smart-contracts
npm run deploy
cd ..
ls
cd besu-network
docker ps
cd ..
cd besu-system
ls
cd smart-contracts
ls
cd contracts
ls
nano TransactionLedger.sol
cd ..
cd besu-network
docker logs -f besu-node
cd ..
cd besu-system
cd smart-contracts
npm run deploy
ls
node package.json
npm run deploy
cd ..
cd besu-network
docker ps
docker logs -f besu-node
cd besu-system
cd ..
ls
cd besu-system
node checkBalance.js
ls
cd smart-contracts
ls
node checkBalance.js
cd ..
cd besu-network
cd ..
cd besu-network
docker ps 
docker compose down
ip a
docker ps
docker compose up
docker ps
docker logs -f besu-node
ip a
docker logs -f besu-node
ip a
docker ps
docker compose down
sudo shutdown now
ip a
ls
cd besu-network
ls
docker ps
docker compose up -d
docker ps
docker compose down
sudo shutdown now
ls
cd besu-network
docker compile
docker ps
docker compose down
docker ps
docker compose up -d
docker ps
docker logs -f beus-node
docker logs -f besu-node
ip a
docker logs -f besu-node
docker ps
docker logs -f besu-node
hostname -I
docker compose down
docker ps
sudo shutdown now
ip a
ls
cd besu-netowrk
cd besu-network
docker compose down
docker compose up -f
docker compose up -d
docker ps
docker logs -f besu-node
ip a
hostname -I
docker logs -f besu-node
docker compose down
docker ps
sudo shutdown now
docker ps
ls
cd besu-network
docker ps
docker compose down
docker rm besu-node
docker run -d
ls
nano docker-compose.yml
docker compose up -d
docker ps
docker logs -f besu-node
docker logs besu-node --tail 20
docker run -d --name besu-node \ 
docker run -d --name besu-node \ -p 8545:8545 \ -p8546:8546 \ -p 30303:30303 \ hyperledger/besu:25.3.0 \ --network=dev \ --miner-enabled \ --miner-coinbase=0

ubuntu --help
docker run -d --name besu-node \ -p 8545:8545 \ -p8546:8546 \ -p 30303:30303 \ hyperledger/besu:25.3.0 \ --network=dev \ --miner-enabled \ --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 \ --rpc-http-enabled \ --rpc-http-host=0.0.0.0 \ --rpc-http-port=8545 \ --rpc-http-cors-origins="*" \ --host-allowlist="*" \ --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN
docker run -d
docker run -d \ --name besu-node \ -p 8545:8545 \ -p8546:8546 \ -p 30303:30303 \ hyperledger/besu:25.3.0 \ --network=dev \ --miner-enabled \ --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 \ --rpc-http-enabled \ --rpc-http-host=0.0.0.0 \ --rpc-http-port=8545 \ --rpc-http-cors-origins="*" \ --host-allowlist="*" \ --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN
dockern run --help
docker run --help
docker run -d \ --name besu-node \ -p 8545:8545 \ -p8546:8546 \ -p 30303:30303 \ hyperledger/besu:25.3.0 \ --network=dev \ --miner-enabled \ --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 \ --rpc-http-enabled \ --rpc-http-host=0.0.0.0 \ --rpc-http-port=8545 \ --rpc-http-cors-origins="*" \ --host-allowlist="*" \ --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:25.3.0 --network=dev --miner-enabled --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 --rpc-http-enabled --rpc-http-host=0.0.0.0 --rpc-http-port=8545 --rpc-http-cors-origins="*" --host-allowlist="*" --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN
docker stop besu-node && docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:25.3.0 --network=dev --miner-enabled --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 --rpc-http-enabled --rpc-http-host=0.0.0.0 --rpc-http-port=8545 --rpc-http-cors-origins="*" --host-allowlist="*" --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN
curl -X POST http;//127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
curl -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
curl -X POST http://192.168.1.113:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
docker ps
docker logs besu-node --tail 30
docker compose up -d
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose up -d
docker compose down
docker compose up -d
docker rm -f besu-node
docker compose up -d
docker ps
docker logs -f besu-node
sudo system restart systemd-timesyncd
sudo system restart
cd ..
sudo system restart
sudo restart now
sudo restart 
docker ps
ls
cd besu-network
docker ps
docker logs -f besu-node
docker compose down
docker ps
docker compose up -d
docker logs -f besu-node
ip a
ls
nano docker-compose.yml
docker compose up -d
docker logs -f besu-node
docker logs --tail 2-
docker logs --tail 20
docker logs --tail -20
docker logs besu-node --tail 20
ip a
docker ps
docker logs -f besu-node
docker compose down
docker ps
docker compile
docker compose up -d
docker ps
docker logs -f besu-node
cd ..
cd besu-system
ls
cd smart-contract
cd smart-contracts
ls
node checkBalance.js
ls
node checkBalance.js
nano checkBalance.js
node checkBalance.js
cd ..
ls
cd ..
cd besu-network
ls
docker ps
docker logs -f besu-node
docker compose down && docker compose up -d
docker logs besu-node
docker compose down
docker ps
cd ..
sudo shutdown now
docker compile
ls
cd besu-network
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
cd ..
cd besu-system
cd smart-contracts
node checkBalance.js
cd ..
cd besu-network
docker compose down
docker compose -d
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
sudo rm -rf ./node1/caches ./node/cahes
sudo rm -rf ./node1/caches ./node/caches
docker compose down
docker compose up -d
docker logs -f besu-node
cd ..
cd besu-network
ls
cd ..
cd besu-system/smart-contracts
node checkBalance.js
cd ..
cd besu-network
docker ps
docker compose down --remove-orphans
docker rm -f besu-node
docker compose up -d
docker ps
docker logs -f besu-node
sudo ufw status
docker compose down
docker ps
docker logs -d besu-noed
docker logs -d besu-node
docker logs -f besu-node
cd ..
cd besu-system
cd smart-contracts
node checkBalance.js
cd ..
cd besu-network
ls
docker ps
docker compose down
docker compose up -d
docker logs -f besu-node
docker logs besu-node --tail 30
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:25.3.0 --network=dev --miner-enabled --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 --rpc-http-enabled --rpc-http-host=0.0.0.0 --rpc-http-port=8545 --rpc-http-cors-origins="*" --host-allowlist="*" --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN --sync-min-peers=1
docker stop besu-node
docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:25.3.0 --network=dev --miner-enabled --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 --rpc-http-enabled --rpc-http-host=0.0.0.0 --rpc-http-port=8545 --rpc-http-cors-origins="*" --host-allowlist="*" --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN --sync-min-peers=1
docker compose up -d
docker compose down
docker compose up 0d
docker compose up -d
docker stop besu-node
docker rm besu-node
docker compose up -d
docker logs -f besu-node
docker compose down
docker compose up -d
docker logs -f besu-node
docker compose up -d
docker logs -f besu-node
docker compose down
docker ps | grep besu-node
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose up -d
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545
c
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:25.3.0 --network=dev --miner-enabled --miner-coinbase=0xf17E02e1caB25ba2fb9c7d72015e98d9f03bca91 --rpc-http-enabled --rpc-http-host=0.0.0.0 --rpc-http-port=8545 --rpc-http-cors-origins="*" --host-allowlist="*" --rpc-https-api=ETH,NET,WEB3.MINER,ADMIN --sync-min-peers=1
df -h
docker stop besu-node
docker rm besu-node
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
docker compose up -d
docker logs -f besu-node
cat docker-compose.yml
docker ps
docker logs -f besu-node | grep -i peer
docker compose down
docker ps
sudo shutdown now
ls
cd besu-network
docker ps
docker compose down
docker compose up -d
docker logs -f besu-node
cd ..
cd besu-system
cd smart-contracts
node checkBalance.js
cd ..
cd besu-network
docker inspect besu-node --format=
docker inspect besu-node --format='{{.Args}}'
docker logs besu-node 2>&1 | grep -i "genesis\|network\|config\|chain"
cat ~/besu-network/config/genesis.json
ls
cat genesis.json
docker logs besu-node 2>&1 | grep -i 
docker logs besu-node 2>&1 | grep -i "clique\|signer\|validator\|block\|import"
docker stop besu-node && docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0 --genesis-file=/config/genesis.json --data-path=/var/lib/besu --node-private-key-file=/var/lib/besu/node1 --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker stop besu-node && docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0 --genesis-file=/config/genesis.json --data-path=/var/lib/besu --node-private-key-file=/var/lib/besu/node1 --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker logs besu-node --tail 20
curl -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu hyperledger/besu:25.3.0 --genesis-file/config/genesis.json --data-path=/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0 --genesis-file=/config/genesis.json --data-path=/var/lib/besu --node-private-key-file=/var/lib/besu/node1 --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker stop besu-node && docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu hyperledger/besu:25.3.0 --genesis-file/config/genesis.json --data-path=/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0 --genesis-file=/config/genesis.json --data-path=/var/lib/besu --node-private-key-file=/var/lib/besu/node1 --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker ps
docker logs besu-node --tail 2-
docker logs besu-node --tail 20
docker logs -f besu-node
docker logs besu-node --tail 20
docker stop besu-node && docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu hyperledger/besu:25.3.0 --genesis-file/config/genesis.json --data-path=/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0 --genesis-file=/config/genesis.json --data-path=/var/lib/besu --node-private-key-file=/var/lib/besu/node1 --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker ps
docker logs besu-node --tail 20
docker stop besu-node && docker rm besu-node
docker stop besu-node
docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -p 30303:30303 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu hyperledger/besu:25.3.0 --genesis-file/config/genesis.json --data-path=/var/lib/besu -v ~/besu-network/node1:/var/lib/besu/node1 hyperledger/besu:25.3.0 --genesis-file=/config/genesis.json --data-path=/var/lib/besu --node-private-key-file=/var/lib/besu/node1 --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker ps && docker logs besu-node --tail 10
ls
ls ~/besu-network/data/
cd node1
ls
cd ..
docker stop besu-node && docker rm besu-node
docker run -d --name besu-node -p 8545:8545 -p 8546:8546 -v ~/besu-network/genesis.json:/config/genesis.json -v ~/besu-network/data:/var/lib/besu/data -v ~/besu-network/node1/key:/config/key hyperledger/besu:25.3.0 --genesis-file/config/genesis.json --data-path=/var/lib/besu/data --node-private-key-file=/config/key --rpc-enabled --rpc-http-host=0.0.0.0. --rpc-http-port=8545 --rpc-http-cors-origin="*" --host-allowlist="*" --rpc-http-api=ETH,NET,WEB3,CLIQUE --min-gas-price=0 --miner-enabled --miner-coinbase=0xf1702e1ca825ba2fb91c7d72015e98d9f03bca91
docker ps
docker logs besu-node --tail 20
docker run --rm hyperledger/besu:25.3.0 --help | grep -i "genesis\|cors\|rpc-http-e"
cat ~/docker-compose.yml
cat ~/besu-network/docker-compose.yml
docker stop besu-node && docker rm besu-node
docker compose down
docker compose up -d
docker logs besu-node --tail 20
docker compose down
docker stop besu-node && docker rm besu-node
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
docker compose up -d
docker logs -f besu-node
docker logs besu-node --tail 20
docker compose down
rm -rf ~/besu-network/node1/database
rm -rf ~/besu-network/node1/caches
rm -rf ~/besu-network/data
docker compose up -d
docker logs besu-node -f
cd ..
cd besu-system
ls
cd smart-contracts
node checkBalance.js
cd ..
cd besu-network
ip a
docker compose down
docker ps
sudo shutdown now
docker compile
ls
cd besu-network
docker compile
ls
docker ps
docker compose down
docker compose up -d
docker ps
docker logs -f besu-node
ip a
docker logs -f besu-node
cd ..
cd besu-system
cd smart-contracts
node deploy.js
ls
cd artifacts
ls
cd ..
cd contracts
ls
cd ..
cd scripts
ls
node deploy.js
cat ~/besu-system/smart-contracts/.env
cat ~/besu-system/smart-contracts/hardhat.config.js
cd ..
npx hardhat run scripts/deploy.js --network besu
cd ..
cd besu-network
docker ps
docker logs -f besu-node
docker compose down
docker ps
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
docker compile
sudo shutdown now
cd besu-network
ls
docker compose down
docker compose up -d
docker ps
ip a
docker compose down
docker compose up -d
ip a
docker ps
docker compose down
docker ps
sudo shutdown now
ls
cd besu-network
docker compose down
docker compose up -d
docker ps
docker compose down
docker ps
docker compose down
docker compose up -d
ip a
docker ps
docker compose down
docker compose up -d
docker ps
docker compose down
docker ps
docker compose up -d
docker ps
docker compose down
docker ps
docker compile
ls
docker compose
docker compose up -d
cd ..
ls
cd besu-system
ls
cd smart-contracts
ls
node checkBalance.js
cd ..
cd besu-network
ls
docker logs -f besu-node
ip a
docker compose down
sudo shutdown now
ip a
ls
cd besu-network
docker compose down
docker compile
docker compose up -d
docker ps
docker logs -f besu-node
docker compose down
ip a
cd ..
sudp shutdown now
sudo shutdown now
cd besu-network
docker compose up -d
docker ps
docker compose down
docker ps
docker compose down
sudo shutdown now
docker compile
ls
cd besu-network
docker compose down
docker compose up -d
ip a
docker ps
docker compose down
ls
cd node1
ls
cd uploads
ls
cd ..
ip a
docker ps
docker compose down
ls
cd node1
ls
cd ..
docker compose down
docker compose up -d
docker compose down
docker compose up -d
docker compose down
sudo shutdown now
ip a
ls
cd besu-network
docker compose down
docker compose up -d
docker ps
ip a
docker compose down
sudo shutdown now
docker ps
ls
cd besu-network
docker compose down
docker ps
docker compose down -d
docker compose up -d
ip 
IP A
ip a
docker ps
docker compose down
sudo shutdown now
docker ps
ip a
ls
cd besu-network
docker compose up -d
docker ps
ip a
docker logs -f
docker logs -f besu-node
docker ps
docker compose -f besu-node
docker logs -f besu-node
docker compose down
docker compile
docker system df
docker ps
docker compile
docker ps
docker compose down
sudo shutdown now
ls
cd besu-network
sudo snap install ngrok
ngrok config add-authtoken 3EDSBDihGKZLWaZquYnnscGaf35_2C83JHuBiEJo3bbbJ1HUR
ls
cd ..
ls
cd snap
ls
cd ngrok
ls
cd ..
ls
cd besu-network
ls
docker ps
docker compose downn
docker compose down
ngrok version
docker compose up -d
docker ps
curl http://localhost:8545
docker logs besu-node
docker logs -f besu-node
docker compose down
ls
cd docker-compose.yml
nano docker-compose.yml
ls
cd ..
docker ps
sudo shutdown now
ls
ngrok version
docker ps
ngrok http 8545
ngrok version
docker ps
docker compose up -d
ls
cd besu-network
docker compose up -d
docker ps
ps aux | grep ngrok
netstat -tulpn | grep ngrok
ss -tulpn | grep ngrok
docker ps
ngrok http 8545
docker ps
docker logs -f besu node
docker logs -f besu-node
docker ps
ngrok http 8545
cat .env | grep BESU_RPC_URL
docker ps
ngrok http 8545
ls
nano docker-compose.yml
docker ps
docker compose down
docker compose up -d
docker ps
ngrok http 8545
ls
nano docker-compose.yml
docker ps
docker compose down
docker compose up -d
docker ps
ngrok http 8545
docker ps
docker logs -f besu-node
ngrok http 8545
docker ps
ngrok http 8545
http ngrok 8545
docker compose down
docker ps
ngrok version
sudo shutdown now
ls
docker ps
cd besu-network
docker compose up -d
ngrok http 8545
docker logs -f besu-node
docker ps
docker compose down
sudo shutdown now
ubuls
ls
cd besu-network
docker ps
docker compose up -d
docker ps
ngrok http 8545
docker ps
ngrok version
docker compose down
cd ..
ls
sudo shutdown now
cd besu-network
ls
docker ps
docker compose up -d
docker ps
ngrok http 8545
docker ps
docker compose down
docker ps
docker compose down
sudo shutdown now
sudo apt update
ls
cd besu-network
ls
cd ..
cd besu-system
ls
cd ..
cd besu-network
ls
docker compose down
docker ps
cd ..
sudo shutdown now
ls
cd besu-network
ls
cd node1
ls
cd ..
ip a
docker os
docker ps
docker compose down
cd ..
ls
sudo systemctl status ssh
sudo apt update
ip a
ls
cd besu-network
ip a
ngrok
-h
ip a
sudo shutdown now
ip a
ls
cd besu-network
ls
nano createGenesis.py
ls
nano docker.compose.yml
ls
nano docker-compose.yml
ls
nano genesis.json
ls
cd node1
ls
ip a
sudo ss -tlnp | grep 22
cd ..
ls
cd besu-network
ls
cd ..
cd besu-system
ls
cd smart-contracts
ls
cd ..
ls
sudo shutdown now

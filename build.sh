cd app
npm install
npm run build
cd ../render
npm install
npm run build
cd ..
mkdir render/dist/electron
echo "Copy electron main and content.js"
cp -a app/dist/* render/dist/electron

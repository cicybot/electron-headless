cd app
npm run build
cd ../render
npm run build
cd ..
mkdir render/dist/electron

cp -a app/dist render/dist/electron
cd prisma
rm dev.db
touch dev.db
cd ..
npx prisma migrate dev 
npx prisma generate
rm -r dist

#!/bin/sh
set -e

echo "🔄 Ejecutando migraciones de base de datos..."
npx prisma db push --skip-generate

echo "🌱 Verificando seed..."
# Solo hace seed si la tabla User está vacía
USER_COUNT=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) FROM "User";
EOF
2>/dev/null || echo "0")

if echo "$USER_COUNT" | grep -q '"count":"0"' || echo "$USER_COUNT" | grep -q '"count": "0"'; then
  echo "🌍 Ejecutando seed inicial..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    // seed mínimo: solo admin
    const prisma = new PrismaClient();
    bcrypt.hash('admin123', 12).then(hash => {
      return prisma.user.create({
        data: { email: 'admin@mundial2026.com', name: 'Administrador', password: hash, role: 'ADMIN' }
      });
    }).then(() => prisma.\$disconnect()).catch(e => { console.error(e); process.exit(1); });
  " || true
fi

echo "🚀 Iniciando servidor..."
exec node server.js

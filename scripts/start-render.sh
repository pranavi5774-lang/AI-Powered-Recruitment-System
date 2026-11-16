#!/bin/sh
set -eu

mkdir -p /var/data/uploads/resumes
chown nextjs:nodejs /var/data /var/data/uploads /var/data/uploads/resumes

exec su-exec nextjs:nodejs sh -c \
  'node /prisma-cli/node_modules/prisma/build/index.js db push --skip-generate && exec node server.js'

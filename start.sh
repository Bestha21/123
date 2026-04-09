#!/bin/bash
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi
export NODE_ENV=production
node ./dist/index.cjs
